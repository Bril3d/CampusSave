/// Rôles possibles d'un utilisateur.
/// PROVISOIRE : les valeurs texte ('student', 'merchant', 'admin') doivent
/// être confirmées par le développeur Backend.
enum UserRole {
  student,
  merchant,
  admin;

  static UserRole? fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'student':
        return UserRole.student;
      case 'merchant':
        return UserRole.merchant;
      case 'admin':
        return UserRole.admin;
      default:
        return null;
    }
  }

  String get label {
    switch (this) {
      case UserRole.student:
        return 'Student';
      case UserRole.merchant:
        return 'Merchant';
      case UserRole.admin:
        return 'Admin';
    }
  }
}
