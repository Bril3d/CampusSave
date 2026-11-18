import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/user_role.dart';
import '../services/role_service.dart';
import '../widgets/state_views.dart';
import 'profile_screen.dart';
import 'student/student_home_screen.dart';

/// Choisit l'espace à afficher selon le rôle de l'utilisateur.
/// Étudiant : espace réel (étape 9). Commerçant / Admin : placeholders
/// jusqu'aux étapes 12 et suivantes.
class RoleHomeScreen extends StatefulWidget {
  final User user;

  const RoleHomeScreen({super.key, required this.user});

  @override
  State<RoleHomeScreen> createState() => _RoleHomeScreenState();
}

class _RoleHomeScreenState extends State<RoleHomeScreen> {
  late Future<UserRole> _roleFuture;

  @override
  void initState() {
    super.initState();
    _roleFuture = RoleService().fetchRole(widget.user);
  }

  void _reload() {
    setState(() {
      _roleFuture = RoleService().fetchRole(widget.user);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<UserRole>(
      future: _roleFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return Scaffold(
            appBar: AppBar(title: const Text('CampusSave')),
            body: const LoadingView(),
          );
        }
        if (snapshot.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('CampusSave')),
            body: ErrorView(
              message: 'Could not load your profile.',
              onRetry: _reload,
            ),
          );
        }

        final role = snapshot.data!;
        if (role == UserRole.student) {
          return StudentHomeScreen(user: widget.user, role: role);
        }
        return _PlaceholderHome(user: widget.user, role: role);
      },
    );
  }
}

class _PlaceholderHome extends StatelessWidget {
  final User user;
  final UserRole role;

  const _PlaceholderHome({required this.user, required this.role});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CampusSave'),
        actions: [
          IconButton(
            tooltip: 'Profile',
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProfileScreen(user: user, role: role),
              ),
            ),
          ),
        ],
      ),
      body: Center(
        child: Text('${role.label} space coming soon.'),
      ),
    );
  }
}
