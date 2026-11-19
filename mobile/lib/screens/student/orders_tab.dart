import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/state_views.dart';
import 'order_confirmation_screen.dart';
import 'payment_screen.dart';

class OrdersTab extends StatefulWidget {
  final int refreshSignal; final String studentId;
  const OrdersTab({super.key, this.refreshSignal = 0, required this.studentId});
  @override State<OrdersTab> createState() => _State();
}
class _State extends State<OrdersTab> {
  late Future<List<Order>> _fut;
  @override void initState() { super.initState(); _load(); }
  @override void didUpdateWidget(covariant OrdersTab old) {
    super.didUpdateWidget(old);
    if (old.refreshSignal != widget.refreshSignal) _load();
  }
  void _load() => setState(() => _fut = FakeOrderRepository().fetchForStudent(widget.studentId));

  Future<void> _pay(Order order) async {
    final paid = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => PaymentScreen(order: order)));
    if (paid != true || !mounted) return;
    _load();
    final updated = FakeOrderRepository().find(order.id);
    if (updated != null && mounted) {
      await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => OrderConfirmationScreen(order: updated)));
    }
  }

  Future<void> _cancel(Order order) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Cancel reservation'),
      content: Text('Cancel "${order.offerTitle}"?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
        TextButton(onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Cancel it', style: TextStyle(color: Colors.red))),
      ]));
    if (ok != true) return;
    try { await FakeOrderRepository().cancel(order.id); }
    on OrderException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
    if (mounted) _load();
  }

  void _showQr(Order order) => Navigator.of(context).push(MaterialPageRoute(
    builder: (_) => OrderConfirmationScreen(order: order)));

  @override Widget build(BuildContext c) => Column(children: [
    const DemoBanner(),
    Expanded(child: FutureBuilder<List<Order>>(future: _fut,
      builder: (c, snap) {
        if (snap.connectionState != ConnectionState.done) return const LoadingView();
        if (snap.hasError) return ErrorView(message: 'Could not load orders.', onRetry: _load);
        final orders = snap.data ?? [];
        if (orders.isEmpty) return const EmptyView(
          message: 'No orders yet.\nReserve an offer to get started!',
          icon: Icons.receipt_long);
        return RefreshIndicator(onRefresh: () async => _load(),
          child: ListView.separated(physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16), itemCount: orders.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _OrderCard(order: orders[i],
              onPay: () => _pay(orders[i]),
              onCancel: () => _cancel(orders[i]),
              onShowQr: () => _showQr(orders[i]))));
      })),
  ]);
}

class _OrderCard extends StatelessWidget {
  final Order order; final VoidCallback onPay, onCancel, onShowQr;
  const _OrderCard({required this.order, required this.onPay,
    required this.onCancel, required this.onShowQr});

  Color _color(ColorScheme s) {
    switch (order.status) {
      case OrderStatus.pendingPayment: return Colors.orange;
      case OrderStatus.confirmed: return s.primary;
      case OrderStatus.collected: return Colors.grey;
      case OrderStatus.cancelled: return s.error;
    }
  }

  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    final pending = order.status == OrderStatus.pendingPayment;
    final confirmed = order.status == OrderStatus.confirmed;
    return Card(child: Padding(padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(order.offerTitle,
            style: Theme.of(c).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: _color(s).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8)),
            child: Text(order.status.label,
              style: TextStyle(color: _color(s), fontSize: 12, fontWeight: FontWeight.bold))),
        ]),
        const SizedBox(height: 4),
        Text(order.merchantName, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 8),
        Row(children: [
          const Icon(Icons.shopping_bag_outlined, size: 16, color: Colors.grey),
          const SizedBox(width: 4), Text('x${order.quantity}'),
          const SizedBox(width: 16),
          const Icon(Icons.payments_outlined, size: 16, color: Colors.grey),
          const SizedBox(width: 4), Text(fPrice(order.total)),
        ]),
        const SizedBox(height: 4),
        Row(children: [
          const Icon(Icons.schedule, size: 16, color: Colors.grey),
          const SizedBox(width: 4),
          Text(fPickup(order.pickupStart, order.pickupEnd),
            style: const TextStyle(fontSize: 13)),
        ]),
        if (pending || confirmed) ...[
          const SizedBox(height: 12),
          Row(children: [
            if (pending) ...[
              Expanded(child: ElevatedButton.icon(
                icon: const Icon(Icons.payment, size: 16),
                label: const Text('Pay now'),
                onPressed: onPay)),
              const SizedBox(width: 10),
              OutlinedButton(onPressed: onCancel,
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  minimumSize: const Size(80, 48)),
                child: const Text('Cancel')),
            ],
            if (confirmed) Expanded(child: OutlinedButton.icon(
              icon: const Icon(Icons.qr_code, size: 16),
              label: const Text('Show QR code'),
              onPressed: onShowQr)),
          ]),
        ],
      ])));
  }
}
