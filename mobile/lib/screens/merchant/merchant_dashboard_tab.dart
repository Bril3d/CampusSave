import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../repositories/offer_repository.dart';
import '../../repositories/order_repository.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/stat_card.dart';

class MerchantDashboardTab extends StatelessWidget {
  final String merchantId;
  const MerchantDashboardTab({super.key, required this.merchantId});

  Future<Map<String, dynamic>> _load() async {
    final offers = await FakeOfferRepository().fetchForMerchant(merchantId);
    final orders = await FakeOrderRepository().fetchForMerchant(merchantId);
    final pending = orders.where((o) => o.status == OrderStatus.pendingPayment).length;
    final confirmed = orders.where((o) => o.status == OrderStatus.confirmed).length;
    final collected = orders.where((o) => o.status == OrderStatus.collected).length;
    final rev = orders.where((o) => o.status == OrderStatus.confirmed ||
      o.status == OrderStatus.collected).fold(0.0, (s, o) => s + o.total);
    return {'offers': offers.length, 'pending': pending, 'confirmed': confirmed,
      'collected': collected, 'revenue': rev,
      'active': offers.where((o) => !o.soldOut).length};
  }

  @override Widget build(BuildContext c) => Column(children: [
    const DemoBanner(),
    Expanded(child: FutureBuilder<Map<String,dynamic>>(future: _load(),
      builder: (c, snap) {
        if (!snap.hasData) return const Center(child: CircularProgressIndicator());
        final d = snap.data!;
        final s = Theme.of(c).colorScheme;
        return ListView(padding: const EdgeInsets.all(16), children: [
          Text('My Activity', style: Theme.of(c).textTheme.titleLarge),
          const SizedBox(height: 16),
          GridView.count(crossAxisCount: 2, shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3,
            children: [
              StatCard(label: 'Active offers', value: '${d['active']}', icon: Icons.local_offer),
              StatCard(label: 'Pending orders', value: '${d['pending']}',
                icon: Icons.pending_actions, color: Colors.orange),
              StatCard(label: 'Confirmed', value: '${d['confirmed']}',
                icon: Icons.check_circle_outline, color: s.primary),
              StatCard(label: 'Revenue (TND)', value: (d['revenue'] as double).toStringAsFixed(1),
                icon: Icons.payments_outlined, color: Colors.teal),
            ]),
          const SizedBox(height: 20),
          Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Collections', style: Theme.of(c).textTheme.titleMedium),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: d['collected'] > 0
              ? d['collected'] / (d['collected'] + d['confirmed'] + 1) : 0,
              minHeight: 8, borderRadius: BorderRadius.circular(4)),
            const SizedBox(height: 8),
            Text('${d['collected']} orders collected out of ${d['collected'] + d['confirmed']} confirmed',
              style: const TextStyle(fontSize: 13, color: Colors.grey)),
          ]))),
        ]);
      })),
  ]);
}
