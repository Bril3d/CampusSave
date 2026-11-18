import 'package:flutter/material.dart';

String formatPrice(double value) => '${value.toStringAsFixed(2)} TND';

String formatTime(DateTime time) {
  final h = time.hour.toString().padLeft(2, '0');
  final m = time.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

String formatPickup(DateTime start, DateTime end) =>
    'Pickup ${formatTime(start)} - ${formatTime(end)}';

IconData categoryIcon(String category) {
  switch (category) {
    case 'Meals':
      return Icons.restaurant;
    case 'Bakery':
      return Icons.bakery_dining;
    case 'Drinks':
      return Icons.local_cafe;
    case 'Desserts':
      return Icons.cake;
    default:
      return Icons.fastfood;
  }
}
