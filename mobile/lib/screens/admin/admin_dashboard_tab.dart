import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/merchant_info.dart';
import '../../repositories/admin_repository.dart';
import '../../repositories/offer_repository.dart';
import '../../widgets/neo_widgets.dart';
import '../../widgets/stat_card.dart';

class AdminDashboardTab extends StatelessWidget {
  const AdminDashboardTab({super.key});

  Future<Map<String, dynamic>> _stats() async {
    final offers = await FakeOfferRepository().fetchAll();
    final merchants = FakeAdminRepository().merchants;
    final pending   = merchants.where((m) => m.status == MerchantStatus.pending).length;
    final validated = merchants.where((m) => m.status == MerchantStatus.validated).length;
    return {
      'offers':    offers.length,
      'merchants': validated,
      'pending':   pending,
      'orders':    42 + pending * 3,
      'revenue':   1250.0 + validated * 150.0,
      'students':  128 + pending,
    };
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _stats(),
      builder: (context, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: AppColors.black));
        final d = snap.data!;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            NeoCard(
              color: AppColors.black,
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.yellow,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.admin_panel_settings, color: AppColors.black),
                  ),
                  const SizedBox(width: 14),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('ADMIN PANEL',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900,
                            fontSize: 16, letterSpacing: 1)),
                      Text('Platform Overview',
                        style: TextStyle(color: Colors.white60, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Platform Stats',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.black)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12, mainAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                StatCard(label: 'Students',    value: '${d['students']}',  icon: Icons.school,       color: AppColors.teal),
                StatCard(label: 'Merchants',   value: '${d['merchants']}', icon: Icons.storefront,   color: AppColors.green),
                StatCard(label: 'Offers',      value: '${d['offers']}',    icon: Icons.local_offer,  color: AppColors.orange),
                StatCard(label: 'Orders',      value: '${d['orders']}',    icon: Icons.receipt_long, color: AppColors.purple),
              ],
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12, mainAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                StatCard(label: 'Revenue (TND)',
                  value: (d['revenue'] as double).toStringAsFixed(0),
                  icon: Icons.payments, color: AppColors.yellow),
                StatCard(label: 'Pending approval',
                  value: '${d['pending']}',
                  icon: Icons.pending_actions, color: AppColors.red),
              ],
            ),
            const SizedBox(height: 20),
            NeoCard(
              color: AppColors.cardYellow,
              padding: const EdgeInsets.all(16),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quick Info', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                  SizedBox(height: 10),
                  _InfoRow(icon: Icons.admin_panel_settings, text: 'Admin: admin@campussave.tn'),
                  _InfoRow(icon: Icons.science_outlined,     text: 'Demo mode — backend pending'),
                  _InfoRow(icon: Icons.eco,                  text: 'Fighting food waste on campus!'),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.black),
          const SizedBox(width: 8),
          Expanded(child: Text(text,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}
