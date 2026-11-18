import '../models/offer.dart';
import '../models/order.dart';
import 'offer_repository.dart';

class OrderException implements Exception {
  final String message;
  const OrderException(this.message);

  @override
  String toString() => message;
}

/// Source des commandes. À l'étape 7b, on ajoutera ApiOrderRepository
/// (appel au Backend) sans modifier les écrans.
abstract class OrderRepository {
  bool get isDemo;

  Future<List<Order>> fetchOrders();

  Future<Order> createOrder({required Offer offer, required int quantity});

  Future<Order> cancelOrder(String orderId);
}

/// DONNÉES DE DÉMONSTRATION (provisoires), en mémoire : elles disparaissent
/// à la fermeture de l'application. Le vrai contrôle du stock, du montant
/// et des statuts sera fait par le Backend.
class FakeOrderRepository implements OrderRepository {
  FakeOrderRepository._();
  static final FakeOrderRepository _instance = FakeOrderRepository._();

  factory FakeOrderRepository() => _instance;

  final List<Order> _orders = [];
  int _counter = 0;

  @override
  bool get isDemo => true;

  @override
  Future<List<Order>> fetchOrders() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return List<Order>.unmodifiable(_orders);
  }

  @override
  Future<Order> createOrder({
    required Offer offer,
    required int quantity,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));

    final offers = FakeOfferRepository();
    final current = offers.find(offer.id);

    if (current == null) {
      throw const OrderException('This offer is no longer available.');
    }
    if (quantity < 1) {
      throw const OrderException('Choose at least one item.');
    }
    if (current.soldOut) {
      throw const OrderException('This offer is sold out.');
    }
    if (quantity > current.quantity) {
      throw OrderException('Only ${current.quantity} left.');
    }

    offers.changeStock(offer.id, -quantity);

    _counter++;
    final order = Order(
      id: 'demo-order-$_counter',
      offerId: current.id,
      offerTitle: current.title,
      merchantName: current.merchantName,
      quantity: quantity,
      unitPrice: current.discountedPrice,
      createdAt: DateTime.now(),
      pickupStart: current.pickupStart,
      pickupEnd: current.pickupEnd,
      status: OrderStatus.pendingPayment,
    );
    _orders.insert(0, order);
    return order;
  }

  Order? find(String orderId) {
    for (final order in _orders) {
      if (order.id == orderId) return order;
    }
    return null;
  }

  /// Simule la confirmation du paiement par le Backend (webhook Konnect).
  /// Dans la vraie version, seul le Backend change ce statut.
  void markPaid(String orderId) {
    final index = _orders.indexWhere((o) => o.id == orderId);
    if (index == -1) return;
    if (_orders[index].status == OrderStatus.pendingPayment) {
      _orders[index] = _orders[index].copyWith(status: OrderStatus.confirmed);
    }
  }

  @override
  Future<Order> cancelOrder(String orderId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));

    final index = _orders.indexWhere((o) => o.id == orderId);
    if (index == -1) {
      throw const OrderException('Order not found.');
    }
    final order = _orders[index];
    if (order.status != OrderStatus.pendingPayment) {
      throw const OrderException('Only unpaid orders can be cancelled.');
    }

    FakeOfferRepository().changeStock(order.offerId, order.quantity);
    final cancelled = order.copyWith(status: OrderStatus.cancelled);
    _orders[index] = cancelled;
    return cancelled;
  }
}
