import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/state_views.dart';

class MerchantOrdersTab extends StatefulWidget {
  final String merchantId;
  const MerchantOrdersTab({super.key, required this.merchantId});
  @override State<MerchantOrdersTab> createState() => _State();
}
class _State extends State<MerchantOrdersTab> {
  late Future<List<Order>> _fut;
  @override void initState() { super.initState(); _load(); }
  void _load() => setState(() => _fut = FakeOrderRepository().fetchForMerchant(widget.merchantId));

  Future<void> _validateQr(Order order) async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Validate Pickup'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Ask the student to show their QR code.\nEnter the order ID to validate:'),
        const SizedBox(height: 12),
        TextField(controller: ctrl, decoration: const InputDecoration(
          labelText: 'Order ID', prefixIcon: Icon(Icons.qr_code))),
      ]),
      actions: [
        TextButton(onPressed: () { ctrl.dispose(); Navigator.pop(ctx, false); },
          child: const Text('Cancel')),
        ElevatedButton(onPressed: () { Navigator.pop(ctx, true); },
          child: const Text('Validate')),
      ]));
    if (ok != true) return;
    if (ctrl.text.trim() != order.id) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Invalid QR code. Order ID does not match.')));
      return;
    }
    try {
      await FakeOrderRepository().collect(order.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('"${order.offerTitle}" marked as collected!')));
      _load();
    } on OrderException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override Widget build(BuildContext c) => Column(children: [
    const DemoBanner(),
    Expanded(child: FutureBuilder<List<Order>>(future: _fut,
      builder: (c, snap) {
        if (snap.connectionState != ConnectionState.done) return const LoadingView();
        if (snap.hasError) return ErrorView(message: 'Could not load orders.', onRetry: _load);
        final orders = snap.data ?? [];
        if (orders.isEmpty) return const EmptyView(
          message: 'No orders yet.\nStudents will appear here after reserving your offers.',
          icon: Icons.inbox);
        return RefreshIndicator(onRefresh: () async => _load(),
          child: ListView.separated(physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16), itemCount: orders.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final o = orders[i];
              final s = Theme.of(c).colorScheme;
              Color col; String lbl;
              switch (o.status) {
                case OrderStatus.pendingPayment: col = Colors.orange; lbl = 'Awaiting payment'; break;
                case OrderStatus.confirmed: col = s.primary; lbl = 'Ready for pickup'; break;
                case OrderStatus.collected: col = Colors.grey; lbl = 'Collected'; break;
                case OrderStatus.cancelled: col = s.error; lbl = 'Cancelled'; break;
              }
              return Card(child: Padding(padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text(o.offerTitle, style: Theme.of(c).textTheme.titleSmall,
                      maxLines: 1, overflow: TextOverflow.ellipsis)),
                    Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: col.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8)),
                      child: Text(lbl, style: TextStyle(color: col, fontSize: 11,
                        fontWeight: FontWeight.bold))),
                  ]),
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.shopping_bag_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4), Text('x${o.quantity}  '),
                    const Icon(Icons.payments_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4), Text(fPrice(o.total)),
                    const Spacer(),
                    Text(fDate(o.createdAt), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  ]),
                  if (o.status == OrderStatus.confirmed) ...[
                    const SizedBox(height: 10),
                    SizedBox(width: double.infinity, child: ElevatedButton.icon(
                      icon: const Icon(Icons.qr_code_scanner, size: 16),
                      label: const Text('Validate QR code'),
                      onPressed: () => _validateQr(o))),
                  ],
                ])));
            }));
      })),
  ]);
}
