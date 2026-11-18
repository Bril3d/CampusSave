/// Configuration de l'API.
/// Backend Express + Firebase (dossier backend/) : port 5000, routes sous /api.
///
/// Dans l'émulateur Android, 10.0.2.2 désigne le localhost de votre PC.
/// Vous pouvez changer l'URL sans modifier le code :
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000/api
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  static const Duration timeout = Duration(seconds: 15);
}
