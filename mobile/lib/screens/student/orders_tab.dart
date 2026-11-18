import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/state_views.dart';
import 'payment_screen.dart';

class OrdersTab extends StatefulWidget {
  final OrderRepository repository;

  /// Change de valeur quand l'onglet doit recharger les commandes.
  final int refreshSignal;

  OrdersTab({super.key, OrderRepository? repository, this.refreshSignal = 0})
      : repository = repository ?? FakeOrderRepository();

  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> {
  late Future<List<Order>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchOrders();
  }

  @override
  void didUpdateWidget(covariant OrdersTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshSignal != widget.refreshSignal) {
      _future = widget.repository.fetchOrders();
    }
  }

  void _reload() {
    setState(() {
      _future = widget.repository.fetchOrders();
    });
  }

  Future<void> _refresh() async {
    final future = widget.repository.fetchOrders();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // L'erreur est affichée par le FutureBuilder.
    }
  }

  Future<void> _pay(Order order) async {
    final paid = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => PaymentScreen(order: order)),
    );
    if (paid != true || !mounted) return;
    _reload();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment confirmed! Your order is ready for pickup.'),
      ),
    );
  }

  Future<void> _cancel(Order order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel reservation'),
        content: Text('Cancel your reservation of ${order.offerTitle}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel it'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await widget.repository.cancelOrder(order.id);
    } on OrderException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    }
    if (!mounted) return;
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (widget.repository.isDemo) const DemoBanner(),
        Expanded(
          child: FutureBuilder<List<Order>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const LoadingView();
              }
              if (snapshot.hasError) {
                return ErrorView(
                  message: 'Could not load your orders.',
                  onRetry: _reload,
                );
              }
              final orders = snapshot.data ?? const <Order>[];
              if (orders.isEmpty) {
                return const EmptyView(
                  message: 'No orders yet.\nYour reservations will appear here.',
                  icon: Icons.receipt_long,
                );
              }
              return RefreshIndicator(
                onRefresh: _refresh,
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    return _OrderCard(
                      order: order,
                      onPay: () => _pay(order),
                      onCancel: () => _cancel(order),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onPay;
  final VoidCallback onCancel;

  const _OrderCard({
    required this.order,
    required this.onPay,
    required this.onCancel,
  });

  Color _statusColor(ColorScheme scheme) {
    switch (order.status) {
      case OrderStatus.pendingPayment:
        return scheme.secondary;
      case OrderStatus.confirmed:
        return scheme.primary;
      case OrderStatus.collected:
        return Colors.grey;
      case OrderStatus.cancelled:
        return scheme.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final pending = order.status == OrderStatus.pendingPayment;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(order.offerTitle, style: textTheme.titleMedium),
                ),
                Chip(
                  label: Text(
                    order.status.label,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  backgroundColor: _statusColor(scheme),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            Text(order.merchantName, style: textTheme.bodySmall),
            const SizedBox(height: 8),
            Text('Quantity: ${order.quantity}'),
            Text('Total: ${formatPrice(order.total)}'),
            Text(formatPickup(order.pickupStart, order.pickupEnd)),
            Text('Reserved at ${formatTime(order.createdAt)}',
                style: textTheme.bodySmall),
            if (pending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onPay,
                      child: const Text('Pay now'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: onCancel,
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
