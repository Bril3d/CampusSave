import 'package:flutter/material.dart';
import '../../repositories/admin_repository.dart';
import '../../models/merchant_info.dart';

// In a real app, users are listed from Firebase Auth via the backend.
// This demo shows registered merchants and simulates students.
class UsersTab extends StatelessWidget {
  const UsersTab({super.key});

  @override Widget build(BuildContext c) {
    final merchants = FakeAdminRepository().merchants;
    final demoStudents = [
      {'name': 'Ahmed Ben Ali', 'email': 'ahmed@student.essect.tn', 'role': 'Student'},
      {'name': 'Sarra Trabelsi', 'email': 'sarra@student.essect.tn', 'role': 'Student'},
      {'name': 'Youssef Hamdi', 'email': 'youssef@student.essect.tn', 'role': 'Student'},
    ];
    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(10)),
        child: const Row(children: [
          Icon(Icons.info_outline, color: Colors.blue, size: 18),
          SizedBox(width: 8),
          Expanded(child: Text(
            'Real user list requires the backend API. '
            'Merchants registered in this session are shown below.',
            style: TextStyle(fontSize: 12, color: Colors.blue))),
        ])),
      const SizedBox(height: 16),
      Text('Students (demo)', style: Theme.of(c).textTheme.titleSmall
        ?.copyWith(color: Colors.grey)),
      const SizedBox(height: 8),
      ...demoStudents.map((s) => _UserTile(
        name: s['name']!, email: s['email']!, role: s['role']!,
        icon: Icons.school, color: Colors.indigo)),
      const SizedBox(height: 16),
      Text('Merchants (this session)', style: Theme.of(c).textTheme.titleSmall
        ?.copyWith(color: Colors.grey)),
      const SizedBox(height: 8),
      if (merchants.isEmpty)
        const Padding(padding: EdgeInsets.all(16), child: Text(
          'No merchants registered in this session.',
          style: TextStyle(color: Colors.grey))),
      ...merchants.map((m) {
        Color col; IconData icon; String role;
        switch (m.status) {
          case MerchantStatus.pending:
            col = Colors.orange; icon = Icons.hourglass_top; role = 'Merchant (Pending)'; break;
          case MerchantStatus.validated:
            col = Colors.teal; icon = Icons.storefront; role = 'Merchant'; break;
          case MerchantStatus.rejected:
            col = Colors.red; icon = Icons.block; role = 'Merchant (Rejected)'; break;
        }
        return _UserTile(name: m.name, email: m.email, role: role,
          icon: icon, color: col, subtitle: m.businessName);
      }),
    ]);
  }
}

class _UserTile extends StatelessWidget {
  final String name, email, role; final String? subtitle;
  final IconData icon; final Color color;
  const _UserTile({required this.name, required this.email,
    required this.role, required this.icon, required this.color, this.subtitle});
  @override Widget build(BuildContext c) => Card(
    margin: const EdgeInsets.only(bottom: 8),
    child: ListTile(
      leading: CircleAvatar(backgroundColor: color.withOpacity(0.15),
        child: Icon(icon, color: color, size: 20)),
      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(subtitle != null ? '$email\n$subtitle' : email),
      trailing: Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8)),
        child: Text(role, style: TextStyle(color: color, fontSize: 11,
          fontWeight: FontWeight.w600))),
      isThreeLine: subtitle != null));
}
