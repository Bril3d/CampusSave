import 'package:flutter/material.dart';

String fPrice(double v) => '${v.toStringAsFixed(2)} TND';
String fTime(DateTime t) =>
  '${t.hour.toString().padLeft(2,'0')}:${t.minute.toString().padLeft(2,'0')}';
String fPickup(DateTime s, DateTime e) => 'Pickup ${fTime(s)} – ${fTime(e)}';
String fDate(DateTime d) => '${d.day.toString().padLeft(2,'0')}/'
  '${d.month.toString().padLeft(2,'0')}/${d.year}';

IconData categoryIcon(String c) {
  switch (c) {
    case 'Meals': return Icons.restaurant;
    case 'Bakery': return Icons.bakery_dining;
    case 'Drinks': return Icons.local_cafe;
    case 'Desserts': return Icons.cake;
    default: return Icons.fastfood;
  }
}
