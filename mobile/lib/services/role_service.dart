import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_role.dart';

class RoleService {
  static const _adminEmail = 'admin@campussave.tn';

  Future<UserRole> fetchRole(User user) async {
    if (user.email?.toLowerCase() == _adminEmail) return UserRole.admin;
    final p = await SharedPreferences.getInstance();
    final v = p.getString('role_${user.uid}');
    return UserRole.fromString(v) ?? UserRole.student;
  }

  Future<void> saveRole(String uid, UserRole role) async {
    final p = await SharedPreferences.getInstance();
    await p.setString('role_$uid', role.name);
  }
}
