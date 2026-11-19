const List<String> offerCategories = ['Meals','Bakery','Drinks','Desserts','Snacks'];

class Offer {
  final String id;
  final String merchantId;
  final String merchantName;
  final String title;
  final String description;
  final String category;
  final double originalPrice;
  final double discountedPrice;
  int quantity;
  final String? imageUrl;
  final DateTime pickupStart;
  final DateTime pickupEnd;

  Offer({required this.id, required this.merchantId, required this.merchantName,
    required this.title, required this.description, required this.category,
    required this.originalPrice, required this.discountedPrice, required this.quantity,
    required this.pickupStart, required this.pickupEnd, this.imageUrl});

  int get discountPercent => originalPrice <= 0 ? 0
    : (((originalPrice - discountedPrice) / originalPrice) * 100).round();
  bool get soldOut => quantity <= 0;
}
