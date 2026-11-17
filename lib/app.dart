import 'package:flutter/material.dart';
import 'config/app_theme.dart';
import 'screens/home_preview_screen.dart';

class CampusSaveApp extends StatelessWidget {
  const CampusSaveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CampusSave',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const HomePreviewScreen(),
    );
  }
}
