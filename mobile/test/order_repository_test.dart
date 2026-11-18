import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/order.dart';
import 'package:mobile/repositories/offer_repository.dart';
import 'package:mobile/repositories/order_repository.dart';

void main() {
  test('createOrder reduces stock and cancelOrder restores it', () async {
    final offers = FakeOfferRepository();
    final orders = FakeOrderRepository();

    final before =
        (await offers.fetchOffers()).firstWhere((o) => o.id == 'demo-1');
    final order = await orders.createOrder(offer: before, quantity: 2);

    expect(order.status, OrderStatus.pendingPayment);
    expect(order.total, before.discountedPrice * 2);

    var after =
        (await offers.fetchOffers()).firstWhere((o) => o.id == 'demo-1');
    expect(after.quantity, before.quantity - 2);

    final cancelled = await orders.cancelOrder(order.id);
    expect(cancelled.status, OrderStatus.cancelled);

    after = (await offers.fetchOffers()).firstWhere((o) => o.id == 'demo-1');
    expect(after.quantity, before.quantity);
  });

  test('rejects sold out offers, zero quantity and too large quantity',
      () async {
    final offers = FakeOfferRepository();
    final orders = FakeOrderRepository();
    final all = await offers.fetchOffers();

    final soldOut = all.firstWhere((o) => o.id == 'demo-5');
    expect(orders.createOrder(offer: soldOut, quantity: 1),
        throwsA(isA<OrderException>()));

    final offer = all.firstWhere((o) => o.id == 'demo-2');
    expect(orders.createOrder(offer: offer, quantity: 0),
        throwsA(isA<OrderException>()));
    expect(orders.createOrder(offer: offer, quantity: offer.quantity + 1),
        throwsA(isA<OrderException>()));
  });

  test('a cancelled order cannot be cancelled twice', () async {
    final offers = FakeOfferRepository();
    final orders = FakeOrderRepository();
    final offer =
        (await offers.fetchOffers()).firstWhere((o) => o.id == 'demo-4');

    final order = await orders.createOrder(offer: offer, quantity: 1);
    await orders.cancelOrder(order.id);
    expect(orders.cancelOrder(order.id), throwsA(isA<OrderException>()));
  });
}
