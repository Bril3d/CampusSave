import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'auth_service.dart';

typedef IdTokenProvider = Future<String?> Function();

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  ApiService({http.Client? client, IdTokenProvider? tokenProvider})
    : _client = client ?? http.Client(),
      _tokenProvider = tokenProvider ?? _defaultTokenProvider;

  final http.Client _client;
  final IdTokenProvider _tokenProvider;

  static Future<String?> _defaultTokenProvider() => AuthService().getIdToken();

  Future<dynamic> get(
    String path, {
    Map<String, String>? q,
    bool auth = true,
  }) => _send('GET', path, query: q, auth: auth);

  Future<dynamic> post(String path, {Object? body, bool auth = true}) =>
      _send('POST', path, body: body, auth: auth);

  Future<dynamic> put(String path, {Object? body, bool auth = true}) =>
      _send('PUT', path, body: body, auth: auth);

  Future<dynamic> patch(String path, {Object? body, bool auth = true}) =>
      _send('PATCH', path, body: body, auth: auth);

  Future<dynamic> delete(String path, {bool auth = true}) =>
      _send('DELETE', path, auth: auth);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    required bool auth,
  }) async {
    final baseUri = Uri.parse(ApiConfig.baseUrl);
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final uri = baseUri
        .resolve(normalizedPath)
        .replace(
          queryParameters: query == null || query.isEmpty ? null : query,
        );

    final headers = <String, String>{'Accept': 'application/json'};

    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }

    if (auth) {
      final token = await _tokenProvider();
      if (token == null || token.isEmpty) {
        throw const ApiException('Not signed in.', statusCode: 401);
      }
      headers['Authorization'] = 'Bearer $token';
    }

    final request = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) {
      request.body = jsonEncode(body);
    }

    try {
      final streamedResponse = await _client
          .send(request)
          .timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamedResponse);
      return _handle(response);
    } on TimeoutException {
      throw const ApiException('Server timeout. Please try again.');
    } on http.ClientException {
      throw const ApiException(
        'Cannot reach the server. Check your connection.',
      );
    }
  }

  dynamic _handle(http.Response response) {
    final responseText = utf8.decode(response.bodyBytes);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (responseText.trim().isEmpty) {
        return null;
      }

      try {
        return jsonDecode(responseText);
      } on FormatException {
        throw ApiException(
          'Invalid server response.',
          statusCode: response.statusCode,
        );
      }
    }

    try {
      final decoded = jsonDecode(responseText);
      if (decoded is Map) {
        final message = decoded['message'] ?? decoded['error'];
        if (message is String && message.isNotEmpty) {
          throw ApiException(message, statusCode: response.statusCode);
        }
      }
    } on FormatException {
      // Fall through to a status-specific message for non-JSON error bodies.
    }

    throw ApiException(
      _genericMessage(response.statusCode),
      statusCode: response.statusCode,
    );
  }

  String _genericMessage(int statusCode) {
    if (statusCode == 401) return 'Session expired. Please sign in again.';
    if (statusCode == 403) return 'Access denied.';
    if (statusCode == 404) return 'Not found.';
    if (statusCode >= 500) return 'Server error. Try again later.';
    return 'Request failed ($statusCode).';
  }

  void close() => _client.close();
}
