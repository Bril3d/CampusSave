/// Configuration de l'API.
/// PROVISOIRE : l'URL et le port doivent être confirmés par le développeur Backend.
///
/// Dans l'émulateur Android, 10.0.2.2 désigne le localhost de votre PC.
/// Vous pouvez changer l'URL sans modifier le code :
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const Duration timeout = Duration(seconds: 15);
}
