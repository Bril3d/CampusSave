import 'package:shared_preferences/shared_preferences.dart';
import '../models/merchant_info.dart';
import '../models/user_role.dart';

class FakeAdminRepository {
  FakeAdminRepository._();
  static final FakeAdminRepository _i = FakeAdminRepository._();
  factory FakeAdminRepository() => _i;

  final List<MerchantInfo> merchants = [];

  void registerMerchant(String uid, String name, String email, String biz) {
    if (!merchants.any((m) => m.uid == uid)) {
      merchants.add(MerchantInfo(uid: uid, name: name, email: email, businessName: biz));
    }
  }

  String businessName(String uid) {
    final m = merchants.where((m) => m.uid == uid).isNotEmpty
      ? merchants.firstWhere((m) => m.uid == uid) : null;
    return m?.businessName ?? 'My Shop';
  }

  Future<void> validate(String uid) async {
    for (final m in merchants) { if (m.uid == uid) m.status = MerchantStatus.validated; }
    final p = await SharedPreferences.getInstance();
    await p.setString('role_$uid', UserRole.merchant.name);
  }

  Future<void> reject(String uid) async {
    for (final m in merchants) { if (m.uid == uid) m.status = MerchantStatus.rejected; }
    final p = await SharedPreferences.getInstance();
    await p.setString('role_$uid', UserRole.student.name);
  }
}
