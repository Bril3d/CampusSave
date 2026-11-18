import '../models/offer.dart';

/// Source des offres. Les écrans ne dépendent que de cette interface :
/// à l'étape 7b, on ajoutera ApiOfferRepository (appel au Backend)
/// sans modifier les écrans.
abstract class OfferRepository {
  /// true tant que les données sont des données de démonstration.
  bool get isDemo;

  Future<List<Offer>> fetchOffers();
}

/// DONNÉES DE DÉMONSTRATION (provisoires) : aucune donnée réelle.
class FakeOfferRepository implements OfferRepository {
  FakeOfferRepository._();
  static final FakeOfferRepository _instance = FakeOfferRepository._();

  /// Instance unique : les offres et les commandes de démonstration
  /// partagent le même stock.
  factory FakeOfferRepository() => _instance;

  List<Offer>? _offers;

  @override
  bool get isDemo => true;

  @override
  Future<List<Offer>> fetchOffers() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    return List<Offer>.unmodifiable(_offers ??= _buildDemoOffers());
  }

  /// Utilisé uniquement par FakeOrderRepository (le vrai stock sera géré par le Backend).
  Offer? find(String offerId) {
    final list = _offers;
    if (list == null) return null;
    for (final offer in list) {
      if (offer.id == offerId) return offer;
    }
    return null;
  }

  void changeStock(String offerId, int delta) {
    final list = _offers;
    if (list == null) return;
    final index = list.indexWhere((o) => o.id == offerId);
    if (index == -1) return;
    list[index] = list[index].copyWith(quantity: list[index].quantity + delta);
  }

  List<Offer> _buildDemoOffers() {
    final now = DateTime.now();
    DateTime at(int hour, int minute) =>
        DateTime(now.year, now.month, now.day, hour, minute);

    return [
      Offer(
        id: 'demo-1',
        title: 'Chicken sandwich',
        description: 'Grilled chicken, lettuce and sauce in a fresh baguette.',
        merchantName: 'Demo Cafeteria',
        category: 'Meals',
        originalPrice: 8,
        discountedPrice: 4,
        quantity: 5,
        pickupStart: at(17, 0),
        pickupEnd: at(18, 30),
      ),
      Offer(
        id: 'demo-2',
        title: 'Croissant box (3)',
        description: 'Three butter croissants baked this morning.',
        merchantName: 'Demo Bakery',
        category: 'Bakery',
        originalPrice: 6,
        discountedPrice: 3,
        quantity: 8,
        pickupStart: at(16, 30),
        pickupEnd: at(18, 0),
      ),
      Offer(
        id: 'demo-3',
        title: 'Pasta bolognese',
        description: 'Homemade pasta with beef sauce, single portion.',
        merchantName: 'Demo Restaurant',
        category: 'Meals',
        originalPrice: 12,
        discountedPrice: 6,
        quantity: 3,
        pickupStart: at(19, 0),
        pickupEnd: at(20, 0),
      ),
      Offer(
        id: 'demo-4',
        title: 'Iced coffee',
        description: 'Large iced coffee with milk.',
        merchantName: 'Demo Cafeteria',
        category: 'Drinks',
        originalPrice: 5,
        discountedPrice: 2.5,
        quantity: 10,
        pickupStart: at(15, 0),
        pickupEnd: at(18, 0),
      ),
      Offer(
        id: 'demo-5',
        title: 'Chocolate cake slice',
        description: 'Rich chocolate cake, one slice.',
        merchantName: 'Demo Bakery',
        category: 'Desserts',
        originalPrice: 7,
        discountedPrice: 3.5,
        quantity: 0,
        pickupStart: at(17, 0),
        pickupEnd: at(19, 0),
      ),
      Offer(
        id: 'demo-6',
        title: 'Cheese pizza (slice)',
        description: 'Large slice of cheese pizza.',
        merchantName: 'Demo Restaurant',
        category: 'Snacks',
        originalPrice: 4,
        discountedPrice: 2,
        quantity: 12,
        pickupStart: at(18, 0),
        pickupEnd: at(19, 30),
      ),
    ];
  }
}
