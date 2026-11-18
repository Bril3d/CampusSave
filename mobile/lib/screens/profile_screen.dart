import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/user_role.dart';
import '../services/auth_service.dart';
import '../utils/validators.dart';

class ProfileScreen extends StatelessWidget {
  final User user;
  final UserRole? role;

  const ProfileScreen({super.key, required this.user, this.role});

  Future<void> _editName(BuildContext context, String current) async {
    final messenger = ScaffoldMessenger.of(context);
    final newName = await showDialog<String>(
      context: context,
      builder: (_) => _EditNameDialog(initial: current),
    );
    if (newName == null) return;
    try {
      await AuthService().updateDisplayName(newName);
      messenger.showSnackBar(const SnackBar(content: Text('Name updated.')));
    } on AuthException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _resetPassword(BuildContext context, String email) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await AuthService().sendPasswordReset(email);
      messenger.showSnackBar(
        SnackBar(content: Text('Reset link sent to $email.')),
      );
    } on AuthException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _signOut(BuildContext context) async {
    final navigator = Navigator.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out'),
        content: const Text('Do you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    navigator.popUntil((route) => route.isFirst);
    await AuthService().signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My profile')),
      body: StreamBuilder<User?>(
        stream: AuthService().userChanges,
        initialData: user,
        builder: (context, snapshot) {
          final current = snapshot.data ?? user;
          final name = (current.displayName ?? '').trim();
          final email = current.email ?? '';
          final initial = (name.isNotEmpty ? name : email).isNotEmpty
              ? (name.isNotEmpty ? name : email)[0].toUpperCase()
              : '?';

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: CircleAvatar(
                  radius: 44,
                  child: Text(initial, style: const TextStyle(fontSize: 32)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                name.isEmpty ? 'No name set' : name,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(email, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Center(
                child: Chip(
                  label: Text(role == null ? 'Role: loading...' : 'Role: ${role!.label}'),
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.edit_outlined),
                      title: const Text('Edit name'),
                      onTap: () => _editName(context, name),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.lock_reset),
                      title: const Text('Reset password'),
                      subtitle: const Text('We will email you a reset link'),
                      onTap: email.isEmpty
                          ? null
                          : () => _resetPassword(context, email),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => _signOut(context),
                icon: const Icon(Icons.logout),
                label: const Text('Sign out'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _EditNameDialog extends StatefulWidget {
  final String initial;

  const _EditNameDialog({required this.initial});

  @override
  State<_EditNameDialog> createState() => _EditNameDialogState();
}

class _EditNameDialogState extends State<_EditNameDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.initial);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      Navigator.pop(context, _ctrl.text.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit name'),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: _ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Full name'),
          validator: (v) => Validators.requiredField(v, label: 'Name'),
          onFieldSubmitted: (_) => _save(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(onPressed: _save, child: const Text('Save')),
      ],
    );
  }
}
