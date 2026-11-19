import 'package:flutter/material.dart';
import '../../repositories/admin_repository.dart';
import '../../repositories/offer_repository.dart';
import '../../models/merchant_info.dart';
import '../../widgets/stat_card.dart';

class AdminDashboardTab extends StatelessWidget {
  const AdminDashboardTab({super.key});

  Future<Map<String, dynamic>> _stats() async {
    final offers = await FakeOfferRepository().fetchAll();
    final merchants = FakeAdminRepository().merchants;
    final pending = merchants.where((m) => m.status == MerchantStatus.pending).length;
    final validated = merchants.where((m) => m.status == MerchantStatus.validated).length;
    // Demo stats
    return {
      'offers': offers.length,
      'merchants': validated,
      'pending': pending,
      'orders': 42 + pending * 3,
      'revenue': 1250.0 + validated * 150.0,
      'students': 128 + pending,
    };
  }

  @override Widget build(BuildContext c) => FutureBuilder<Map<String,dynamic>>(
    future: _stats(),
    builder: (c, snap) {
      if (!snap.hasData) return const Center(child: CircularProgressIndicator());
      final d = snap.data!;
      return ListView(padding: const EdgeInsets.all(16), children: [
        Container(padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1A237E), Color(0xFF3949AB)]),
            borderRadius: BorderRadius.circular(16)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.admin_panel_settings, color: Colors.white),
              SizedBox(width: 8),
              Text('Admin Panel', style: TextStyle(color: Colors.white,
                fontSize: 18, fontWeight: FontWeight.bold)),
            ]),
            const SizedBox(height: 4),
            Text('CampusSave Platform Overview',
              style: TextStyle(color: Colors.white.withOpacity(0.8))),
          ])),
        const SizedBox(height: 20),
        Text('Platform Statistics', style: Theme.of(c).textTheme.titleMedium),
        const SizedBox(height: 12),
        GridView.count(crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3,
          children: [
            StatCard(label: 'Students', value: '${d['students']}',
              icon: Icons.school, color: Colors.indigo),
            StatCard(label: 'Merchants', value: '${d['merchants']}',
              icon: Icons.storefront, color: Colors.teal),
            StatCard(label: 'Active offers', value: '${d['offers']}',
              icon: Icons.local_offer, color: const Color(0xFF2E7D32)),
            StatCard(label: 'Total orders', value: '${d['orders']}',
              icon: Icons.receipt_long, color: Colors.deepOrange),
          ]),
        const SizedBox(height: 12),
        GridView.count(crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3,
          children: [
            StatCard(label: 'Revenue (TND)',
              value: (d['revenue'] as double).toStringAsFixed(1),
              icon: Icons.payments, color: Colors.amber.shade700),
            StatCard(label: 'Pending approval', value: '${d['pending']}',
              icon: Icons.pending_actions, color: Colors.orange),
          ]),
        const SizedBox(height: 20),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Quick Info', style: Theme.of(c).textTheme.titleSmall),
          const SizedBox(height: 8),
          const _InfoRow(icon: Icons.admin_panel_settings,
            text: 'Admin email: admin@campussave.tn'),
          const _InfoRow(icon: Icons.info_outline,
            text: 'Demo mode — backend integration pending'),
          const _InfoRow(icon: Icons.eco,
            text: 'Fighting food waste on campus!'),
        ]))),
      ]);
    });
}

class _InfoRow extends StatelessWidget {
  final IconData icon; final String text;
  const _InfoRow({required this.icon, required this.text});
  @override Widget build(BuildContext c) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      Icon(icon, size: 16, color: Colors.grey),
      const SizedBox(width: 8),
      Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Colors.grey))),
    ]));
}
