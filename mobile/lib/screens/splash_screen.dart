import 'package:flutter/material.dart';
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    return Scaffold(body: Container(
      decoration: BoxDecoration(gradient: LinearGradient(
        begin: Alignment.topCenter, end: Alignment.bottomCenter,
        colors: [s.primary, s.primary.withOpacity(0.7)])),
      child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(24)),
          child: const Icon(Icons.eco, size: 72, color: Colors.white)),
        const SizedBox(height: 16),
        const Text('CampusSave', style: TextStyle(fontSize: 32,
          fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1)),
        const SizedBox(height: 8),
        Text('Fight food waste on campus', style: TextStyle(
          color: Colors.white.withOpacity(0.85), fontSize: 15)),
        const SizedBox(height: 40),
        const CircularProgressIndicator(color: Colors.white),
      ]))));
  }
}
