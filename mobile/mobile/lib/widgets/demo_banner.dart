import 'package:flutter/material.dart';

/// Bandeau affiché tant que les données sont des données de démonstration.
class DemoBanner extends StatelessWidget {
  const DemoBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Theme.of(context).colorScheme.secondaryContainer,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: const Text(
        'Demo data - not connected to the server yet',
        style: TextStyle(fontSize: 12),
      ),
    );
  }
}
