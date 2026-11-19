import 'package:flutter/material.dart';
class DemoBanner extends StatelessWidget {
  const DemoBanner({super.key});
  @override Widget build(BuildContext c) => Container(
    width: double.infinity,
    color: Theme.of(c).colorScheme.secondaryContainer,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    child: Row(children: [
      Icon(Icons.science_outlined, size: 16,
        color: Theme.of(c).colorScheme.onSecondaryContainer),
      const SizedBox(width: 8),
      Text('Demo mode – not connected to server',
        style: TextStyle(fontSize: 12,
          color: Theme.of(c).colorScheme.onSecondaryContainer)),
    ]));
}
