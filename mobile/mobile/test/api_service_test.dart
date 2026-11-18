import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/services/api_service.dart';

void main() {
  test('returns decoded JSON on success', () async {
    final api = ApiService(
      client: MockClient((_) async => http.Response('{"ok": true}', 200)),
    );
    final data = await api.get('/ping', auth: false);
    expect(data['ok'], true);
  });

  test('throws ApiException with the server message on error', () async {
    final api = ApiService(
      client: MockClient(
        (_) async => http.Response('{"message": "Not found"}', 404),
      ),
    );
    expect(
      api.get('/missing', auth: false),
      throwsA(isA<ApiException>()
          .having((e) => e.message, 'message', 'Not found')
          .having((e) => e.statusCode, 'statusCode', 404)),
    );
  });

  test('uses a generic message when the body is not JSON', () async {
    final api = ApiService(
      client: MockClient((_) async => http.Response('oops', 500)),
    );
    expect(
      api.get('/boom', auth: false),
      throwsA(isA<ApiException>()
          .having((e) => e.statusCode, 'statusCode', 500)),
    );
  });
}
