import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_role.dart';

/// PROVISOIRE : le rôle doit venir du Backend (jamais décidé par l'app).
/// À l'étape 7, cette méthode appellera la route de profil du Backend
/// avec le Firebase ID Token, une fois le contrat API validé par l'équipe.
class RoleService {
  Future<UserRole> fetchRole(User user) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return UserRole.student;
  }
}
