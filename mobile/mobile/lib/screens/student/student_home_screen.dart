import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../models/user_role.dart';
import '../profile_screen.dart';
import 'offers_tab.dart';
import 'orders_tab.dart';

class StudentHomeScreen extends StatefulWidget {
  final User user;
  final UserRole role;

  const StudentHomeScreen({super.key, required this.user, required this.role});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  int _index = 0;
  int _ordersSignal = 0;

  void _onReserved(Order order) {
    setState(() {
      _index = 1;
      _ordersSignal++;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Reserved! Complete the payment to confirm your order.'),
      ),
    );
  }

  void _onDestinationSelected(int index) {
    setState(() {
      _index = index;
      if (index == 1) _ordersSignal++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_index == 0 ? 'Offers' : 'My orders'),
        actions: [
          IconButton(
            tooltip: 'Profile',
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) =>
                    ProfileScreen(user: widget.user, role: widget.role),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: [
          OffersTab(onReserved: _onReserved),
          OrdersTab(refreshSignal: _ordersSignal),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _onDestinationSelected,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.local_offer), label: 'Offers'),
          NavigationDestination(
              icon: Icon(Icons.receipt_long), label: 'Orders'),
        ],
      ),
    );
  }
}
