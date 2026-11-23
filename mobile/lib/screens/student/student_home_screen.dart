import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../models/user_role.dart';
import '../profile_screen.dart';
import 'offers_tab.dart';
import 'orders_tab.dart';
import 'student_stats_tab.dart';

class StudentHomeScreen extends StatefulWidget {
  final User user; final UserRole role;
  const StudentHomeScreen({super.key, required this.user, required this.role});
  @override State<StudentHomeScreen> createState() => _State();
}
class _State extends State<StudentHomeScreen> {
  int _idx = 0, _sig = 0;
  void _onReserved(Order o) {
    setState(() { _idx = 1; _sig++; });
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('Reserved! Complete payment to confirm.')));
  }
  @override Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(
      title: Text(_idx == 0
          ? 'Available Offers'
          : _idx == 1
              ? 'My Orders'
              : 'My Impact'),
      actions: [
        IconButton(icon: const Icon(Icons.account_circle_outlined), tooltip: 'Profile',
          onPressed: () => Navigator.of(c).push(MaterialPageRoute(
            builder: (_) => ProfileScreen(user: widget.user, role: widget.role)))),
      ]),
    body: IndexedStack(index: _idx, children: [
      OffersTab(onReserved: _onReserved, studentId: widget.user.uid),
      OrdersTab(refreshSignal: _sig, studentId: widget.user.uid),
      const StudentStatsTab(),
    ]),
    bottomNavigationBar: NavigationBar(selectedIndex: _idx,
      onDestinationSelected: (i) => setState(() { _idx = i; if (i==1) _sig++; }),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.local_offer_outlined),
          selectedIcon: Icon(Icons.local_offer), label: 'Offers'),
        NavigationDestination(icon: Icon(Icons.receipt_long_outlined),
          selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
        NavigationDestination(icon: Icon(Icons.eco_outlined),
          selectedIcon: Icon(Icons.eco), label: 'Impact'),
      ]));
}
