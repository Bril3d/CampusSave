import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_role.dart';
import '../repositories/admin_repository.dart';
import 'role_service.dart';

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);
  @override String toString() => message;
}

class AuthService {
  final _auth = FirebaseAuth.instance;
  Stream<User?> get userChanges => _auth.userChanges();
  User? get currentUser => _auth.currentUser;

  Future<void> signIn({required String email, required String password}) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email.trim(), password: password);
    } on FirebaseAuthException catch (e) { throw AuthException(_msg(e.code)); }
  }

  Future<void> register({required String name, required String email,
    required String password, required UserRole role, String businessName = ''}) async {
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
        email: email.trim(), password: password);
      await cred.user?.updateDisplayName(name.trim());
      final roleToSave = role == UserRole.merchant ? UserRole.merchantPending : role;
      await RoleService().saveRole(cred.user!.uid, roleToSave);
      if (role == UserRole.merchant) {
        FakeAdminRepository().registerMerchant(
          cred.user!.uid, name.trim(), email.trim(), businessName.trim());
      }
    } on FirebaseAuthException catch (e) { throw AuthException(_msg(e.code)); }
  }

  Future<void> sendPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-not-found') return;
      throw AuthException(_msg(e.code));
    }
  }

  Future<void> updateDisplayName(String name) async {
    try {
      await _auth.currentUser?.updateDisplayName(name.trim());
      await _auth.currentUser?.reload();
    } on FirebaseAuthException catch (e) { throw AuthException(_msg(e.code)); }
  }

  Future<void> signOut() => _auth.signOut();
  Future<String?> getIdToken({bool forceRefresh = false}) async =>
    await _auth.currentUser?.getIdToken(forceRefresh);

  String _msg(String code) {
    switch (code) {
      case 'invalid-email': return 'Invalid email address.';
      case 'user-disabled': return 'Account disabled.';
      case 'user-not-found': case 'wrong-password': case 'invalid-credential':
        return 'Incorrect email or password.';
      case 'email-already-in-use': return 'An account already exists for this email.';
      case 'weak-password': return 'Password is too weak (min. 6 chars).';
      case 'network-request-failed': return 'Network error. Check your connection.';
      case 'too-many-requests': return 'Too many attempts. Please try again later.';
      case 'operation-not-allowed': return 'Email/password sign-in is not enabled.';
      default: return 'Authentication error ($code).';
    }
  }
}
