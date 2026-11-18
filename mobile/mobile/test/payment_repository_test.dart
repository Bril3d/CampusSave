import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/order.dart';
import 'package:mobile/models/payment.dart';
import 'package:mobile/repositories/offer_repository.dart';
import 'package:mobile/repositories/order_repository.dart';
import 'package:mobile/repositories/payment_repository.dart';

void main() {
  Future<Order> newOrder(String offerId) async {
    final offer = (await FakeOfferRepository().fetchOffers())
        .firstWhere((o) => o.id == offerId);
    return FakeOrderRepository().createOrder(offer: offer, quantity: 1);
  }

  test('successful payment confirms the order', () async {
    final payments = FakePaymentRepository();
    final order = await newOrder('demo-1');

    final session = await payments.createPayment(order);
    expect(await payments.getPaymentStatus(session.id), PaymentStatus.pending);
    expect(session.amount, order.total);

    payments.simulateOutcome(session.id, success: true);
    expect(await payments.getPaymentStatus(session.id), PaymentStatus.success);
    expect(FakeOrderRepository().find(order.id)!.status, OrderStatus.confirmed);
  });

  test('failed payment keeps the order unpaid and can be retried', () async {
    final payments = FakePaymentRepository();
    final order = await newOrder('demo-2');

    final first = await payments.createPayment(order);
    payments.simulateOutcome(first.id, success: false);
    expect(await payments.getPaymentStatus(first.id), PaymentStatus.failed);
    expect(FakeOrderRepository().find(order.id)!.status,
        OrderStatus.pendingPayment);

    final retry = await payments.createPayment(order);
    expect(retry.id, isNot(first.id));
  });

  test('a paid or cancelled order cannot be paid', () async {
    final payments = FakePaymentRepository();
    final orders = FakeOrderRepository();
    final order = await newOrder('demo-4');

    await orders.cancelOrder(order.id);
    expect(payments.createPayment(order), throwsA(isA<PaymentException>()));
  });
}
