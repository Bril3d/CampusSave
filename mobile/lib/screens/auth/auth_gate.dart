import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../role_home_screen.dart';
import '../splash_screen.dart';
import 'login_screen.dart';

/// Choisit l'écran à afficher : connexion ou espace de l'utilisateur.
/// Firebase conserve la session : l'utilisateur reste connecté au redémarrage.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: AuthService().userChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SplashScreen();
        }
        final user = snapshot.data;
        if (user == null) {
          return const LoginScreen();
        }
        return RoleHomeScreen(key: ValueKey(user.uid), user: user);
      },
    );
  }
}
