import '../models/offer.dart';

class FakeOfferRepository {
  FakeOfferRepository._();
  static final FakeOfferRepository _i = FakeOfferRepository._();
  factory FakeOfferRepository() => _i;

  int _c = 7;
  late final List<Offer> _offers = _build();

  List<Offer> _build() {
    final now = DateTime.now();
    t(int h, int m) => DateTime(now.year, now.month, now.day, h, m);
    return [
      Offer(id:'d1',merchantId:'demo',merchantName:'Campus Cafeteria',title:'Chicken Sandwich',
        description:'Grilled chicken with lettuce and sauce.',category:'Meals',
        originalPrice:8,discountedPrice:4,quantity:5,pickupStart:t(17,0),pickupEnd:t(18,30)),
      Offer(id:'d2',merchantId:'demo',merchantName:'Golden Bakery',title:'Croissant Box (3)',
        description:'Three butter croissants baked this morning.',category:'Bakery',
        originalPrice:6,discountedPrice:3,quantity:8,pickupStart:t(16,30),pickupEnd:t(18,0)),
      Offer(id:'d3',merchantId:'demo',merchantName:'Campus Cafeteria',title:'Pasta Bolognese',
        description:'Homemade pasta with beef sauce.',category:'Meals',
        originalPrice:12,discountedPrice:6,quantity:3,pickupStart:t(19,0),pickupEnd:t(20,0)),
      Offer(id:'d4',merchantId:'demo',merchantName:'Cool Drinks',title:'Iced Coffee',
        description:'Large iced coffee with milk.',category:'Drinks',
        originalPrice:5,discountedPrice:2.5,quantity:10,pickupStart:t(15,0),pickupEnd:t(18,0)),
      Offer(id:'d5',merchantId:'demo',merchantName:'Golden Bakery',title:'Chocolate Cake Slice',
        description:'Rich chocolate cake, one slice.',category:'Desserts',
        originalPrice:7,discountedPrice:3.5,quantity:0,pickupStart:t(17,0),pickupEnd:t(19,0)),
      Offer(id:'d6',merchantId:'demo',merchantName:'Campus Cafeteria',title:'Cheese Pizza Slice',
        description:'Large slice of cheese pizza.',category:'Snacks',
        originalPrice:4,discountedPrice:2,quantity:12,pickupStart:t(18,0),pickupEnd:t(19,30)),
    ];
  }

  Future<List<Offer>> fetchAll() async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    return List.unmodifiable(_offers);
  }

  Future<List<Offer>> fetchForMerchant(String uid) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    return _offers.where((o) => o.merchantId == uid).toList();
  }

  Offer? find(String id) {
    for (final o in _offers) { if (o.id == id) return o; }
    return null;
  }

  void changeStock(String id, int delta) {
    for (final o in _offers) { if (o.id == id) { o.quantity += delta; break; } }
  }

  Future<Offer> createOffer({required String merchantId, required String merchantName,
    required String title, required String description, required String category,
    required double originalPrice, required double discountedPrice,
    required int quantity, required DateTime pickupStart, required DateTime pickupEnd}) async {
    _c++;
    final o = Offer(id: 'o$_c', merchantId: merchantId, merchantName: merchantName,
      title: title, description: description, category: category,
      originalPrice: originalPrice, discountedPrice: discountedPrice, quantity: quantity,
      pickupStart: pickupStart, pickupEnd: pickupEnd);
    _offers.add(o);
    return o;
  }

  Future<void> updateOffer(Offer updated) async {
    final idx = _offers.indexWhere((o) => o.id == updated.id);
    if (idx != -1) _offers[idx] = updated;
  }

  Future<void> deleteOffer(String id) async {
    _offers.removeWhere((o) => o.id == id);
  }
}
