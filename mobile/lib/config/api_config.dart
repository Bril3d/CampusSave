import 'package:flutter/foundation.dart';

class ApiConfig {
  /// Override with --dart-define=API_BASE_URL=... for physical devices or
  /// non-standard deployments.
  static String get baseUrl {
    const configuredUrl = String.fromEnvironment('API_BASE_URL');
    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:4000';
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator reaches the host machine through 10.0.2.2.
      return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
  }

  static const Duration timeout = Duration(seconds: 15);
}
