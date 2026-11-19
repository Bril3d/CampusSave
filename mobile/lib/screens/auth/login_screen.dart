import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../utils/validators.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _State();
}
class _State extends State<LoginScreen> {
  final _fk = GlobalKey<FormState>();
  final _ec = TextEditingController();
  final _pc = TextEditingController();
  bool _load = false, _obs = true;

  @override void dispose() { _ec.dispose(); _pc.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (!_fk.currentState!.validate()) return;
    setState(() => _load = true);
    try {
      await AuthService().signIn(email: _ec.text, password: _pc.text);
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally { if (mounted) setState(() => _load = false); }
  }

  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    return Scaffold(body: Container(
      decoration: BoxDecoration(gradient: LinearGradient(
        begin: Alignment.topCenter, end: Alignment.bottomCenter,
        colors: [s.primary, s.primaryContainer.withOpacity(0.3), const Color(0xFFF5F7F3)],
        stops: const [0, 0.4, 1])),
      child: SafeArea(child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420),
          child: Column(children: [
            const SizedBox(height: 20),
            Container(padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white,
                borderRadius: BorderRadius.circular(20)),
              child: Icon(Icons.eco, size: 56, color: s.primary)),
            const SizedBox(height: 12),
            Text('CampusSave', style: TextStyle(fontSize: 28,
              fontWeight: FontWeight.bold, color: s.primary)),
            const SizedBox(height: 4),
            const Text('Sign in to continue'),
            const SizedBox(height: 32),
            Card(child: Padding(padding: const EdgeInsets.all(24),
              child: Form(key: _fk, child: Column(children: [
                TextFormField(controller: _ec, keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined)),
                  validator: Validators.email),
                const SizedBox(height: 16),
                TextFormField(controller: _pc, obscureText: _obs,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(icon: Icon(_obs
                      ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obs = !_obs))),
                  validator: Validators.password),
                Align(alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _load ? null : () => Navigator.of(c).push(
                      MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                    child: const Text('Forgot password?'))),
                const SizedBox(height: 8),
                ElevatedButton(onPressed: _load ? null : _submit,
                  child: _load ? const SizedBox(height: 22, width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Sign in')),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: _load ? null : () => Navigator.of(c).push(
                  MaterialPageRoute(builder: (_) => const RegisterScreen())),
                  child: const Text("Don't have an account? Register")),
              ])))),
            const SizedBox(height: 16),
            Text('Admin email: admin@campussave.tn',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          ])))))));
  }
}
