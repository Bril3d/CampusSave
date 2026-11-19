import 'package:flutter/material.dart';
class AppTheme {
  static const Color primary   = Color(0xFF2E7D32);
  static const Color secondary = Color(0xFFE65100);
  static ThemeData get light {
    final s = ColorScheme.fromSeed(seedColor: primary, secondary: secondary);
    return ThemeData(
      useMaterial3: true, colorScheme: s,
      scaffoldBackgroundColor: const Color(0xFFF5F7F3),
      appBarTheme: AppBarTheme(centerTitle: true, elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: s.primary, foregroundColor: s.onPrimary),
      cardTheme: CardThemeData(elevation: 0, color: Colors.white,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey.shade200))),
      elevatedButtonTheme: ElevatedButtonThemeData(style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        backgroundColor: s.primary, foregroundColor: s.onPrimary, elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)))),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        side: BorderSide(color: s.primary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)))),
      inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: primary, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.red)),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.red, width: 2))),
      snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
    );
  }
}
