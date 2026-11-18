import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'auth_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Client HTTP commun à toute l'application.
/// Il ajoute le Firebase ID Token, gère les délais d'attente et les erreurs.
/// Il ne connaît AUCUNE route : celles-ci seront ajoutées dans les services
/// (offer_service, order_service...) une fois le contrat API validé.
class ApiService {
  ApiService({http.Client? client, AuthService? authService})
      : _client = client ?? http.Client(),
        _authService = authService;

  final http.Client _client;
  AuthService? _authService;

  AuthService get _auth => _authService ??= AuthService();

  Future<dynamic> get(String path,
          {Map<String, String>? query, bool auth = true}) =>
      _send('GET', path, query: query, auth: auth);

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
    final uri =
        Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);

    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }
    if (auth) {
      final token = await _auth.getIdToken();
      if (token == null) {
        throw const ApiException('You are not signed in.', statusCode: 401);
      }
      headers['Authorization'] = 'Bearer $token';
    }

    final request = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) {
      request.body = jsonEncode(body);
    }

    try {
      final streamed = await _client.send(request).timeout(ApiConfig.timeout);
      final response = await http.Response.fromStream(streamed);
      return _handle(response);
    } on TimeoutException {
      throw const ApiException('The server took too long to respond.');
    } on http.ClientException {
      throw const ApiException(
          'Cannot reach the server. Check your connection and try again.');
    }
  }

  dynamic _handle(http.Response response) {
    final code = response.statusCode;
    final text = utf8.decode(response.bodyBytes);

    if (code >= 200 && code < 300) {
      if (text.trim().isEmpty) return null;
      try {
        return jsonDecode(text);
      } on FormatException {
        throw ApiException('Invalid response from the server.',
            statusCode: code);
      }
    }

    throw ApiException(_errorMessage(code, text), statusCode: code);
  }

  /// PROVISOIRE : le format des erreurs du Backend reste à confirmer.
  /// On cherche ici une clé "message" ou "error" dans le JSON.
  String _errorMessage(int code, String text) {
    try {
      final decoded = jsonDecode(text);
      if (decoded is Map) {
        final msg = decoded['message'] ?? decoded['error'];
        if (msg is String && msg.isNotEmpty) return msg;
      }
    } on FormatException {
      // Corps non JSON : on utilise un message générique ci-dessous.
    }

    switch (code) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You are not allowed to do this.';
      case 404:
        return 'The requested item was not found.';
      default:
        if (code >= 500) {
          return 'Server error. Please try again later.';
        }
        return 'Request failed ($code).';
    }
  }
}
