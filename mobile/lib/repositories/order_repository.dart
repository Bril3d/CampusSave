import '../models/offer.dart';
import '../models/order.dart';
import 'offer_repository.dart';

class OrderException implements Exception {
  final String message;
  const OrderException(this.message);
  @override String toString() => message;
}

class FakeOrderRepository {
  FakeOrderRepository._();
  static final FakeOrderRepository _i = FakeOrderRepository._();
  factory FakeOrderRepository() => _i;

  final List<Order> _orders = [];
  int _c = 0;

  Future<List<Order>> fetchForStudent(String uid) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return _orders.where((o) => o.studentId == uid).toList().reversed.toList();
  }

  Future<List<Order>> fetchForMerchant(String uid) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return _orders.where((o) => o.merchantId == uid).toList().reversed.toList();
  }

  Order? find(String id) {
    for (final o in _orders) { if (o.id == id) return o; }
    return null;
  }

  void markPaid(String orderId) {
    for (final o in _orders) {
      if (o.id == orderId && o.status == OrderStatus.pendingPayment) {
        o.status = OrderStatus.confirmed; break;
      }
    }
  }

  Future<Order> create({required Offer offer, required int quantity, required String studentId}) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final cur = FakeOfferRepository().find(offer.id);
    if (cur == null) throw const OrderException('Offer no longer available.');
    if (quantity < 1) throw const OrderException('Choose at least one.');
    if (cur.soldOut) throw const OrderException('This offer is sold out.');
    if (quantity > cur.quantity) throw OrderException('Only ${cur.quantity} left.');
    FakeOfferRepository().changeStock(offer.id, -quantity);
    _c++;
    final o = Order(id: 'ord$_c', studentId: studentId, offerId: cur.id,
      offerTitle: cur.title, merchantId: cur.merchantId, merchantName: cur.merchantName,
      quantity: quantity, unitPrice: cur.discountedPrice, createdAt: DateTime.now(),
      pickupStart: cur.pickupStart, pickupEnd: cur.pickupEnd,
      status: OrderStatus.pendingPayment);
    _orders.insert(0, o);
    return o;
  }

  Future<Order> cancel(String orderId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final o = find(orderId);
    if (o == null) throw const OrderException('Order not found.');
    if (o.status != OrderStatus.pendingPayment)
      throw const OrderException('Only unpaid orders can be cancelled.');
    FakeOfferRepository().changeStock(o.offerId, o.quantity);
    o.status = OrderStatus.cancelled;
    return o;
  }

  Future<Order> collect(String orderId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final o = find(orderId);
    if (o == null) throw const OrderException('Order not found.');
    if (o.status != OrderStatus.confirmed)
      throw const OrderException('Order is not confirmed yet.');
    o.status = OrderStatus.collected;
    return o;
  }
}
