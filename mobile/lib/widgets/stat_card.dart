import 'package:flutter/material.dart';
class StatCard extends StatelessWidget {
  final String label; final String value; final IconData icon; final Color? color;
  const StatCard({super.key, required this.label, required this.value,
    required this.icon, this.color});
  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    final col = color ?? s.primary;
    return Card(child: Padding(padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: col.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: col, size: 20)),
          const Spacer(),
        ]),
        const SizedBox(height: 12),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: col)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 13, color: Colors.grey)),
      ])));
  }
}
