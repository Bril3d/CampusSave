import '../models/offer.dart';
enum OfferSort { relevance, priceLow, priceHigh, discount }

List<Offer> filterOffers(List<Offer> offers, {String query='',
  String? category, double? maxPrice, OfferSort sort=OfferSort.relevance}) {
  final q = query.trim().toLowerCase();
  final r = offers.where((o) {
    if (category != null && o.category != category) return false;
    if (maxPrice != null && o.discountedPrice > maxPrice) return false;
    if (q.isEmpty) return true;
    return o.title.toLowerCase().contains(q) ||
      o.merchantName.toLowerCase().contains(q) ||
      o.category.toLowerCase().contains(q);
  }).toList();
  switch (sort) {
    case OfferSort.priceLow: r.sort((a,b)=>a.discountedPrice.compareTo(b.discountedPrice)); break;
    case OfferSort.priceHigh: r.sort((a,b)=>b.discountedPrice.compareTo(a.discountedPrice)); break;
    case OfferSort.discount: r.sort((a,b)=>b.discountPercent.compareTo(a.discountPercent)); break;
    case OfferSort.relevance: break;
  }
  return r;
}
