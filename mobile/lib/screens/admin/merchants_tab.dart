import 'package:flutter/material.dart';
import '../../models/merchant_info.dart';
import '../../repositories/admin_repository.dart';

class MerchantsTab extends StatefulWidget {
  const MerchantsTab({super.key});
  @override State<MerchantsTab> createState() => _State();
}
class _State extends State<MerchantsTab> {
  Future<void> _validate(MerchantInfo m) async {
    await FakeAdminRepository().validate(m.uid);
    if (mounted) {
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${m.businessName}" validated! Merchant can now log in.')));
    }
  }

  Future<void> _reject(MerchantInfo m) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Reject merchant'),
      content: Text('Reject "${m.businessName}" (${m.name})?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Reject', style: TextStyle(color: Colors.red))),
      ]));
    if (ok != true) return;
    await FakeAdminRepository().reject(m.uid);
    if (mounted) {
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${m.businessName}" rejected.')));
    }
  }

  @override Widget build(BuildContext c) {
    final all = FakeAdminRepository().merchants;
    final pending  = all.where((m) => m.status == MerchantStatus.pending).toList();
    final validated = all.where((m) => m.status == MerchantStatus.validated).toList();
    final rejected  = all.where((m) => m.status == MerchantStatus.rejected).toList();

    return ListView(padding: const EdgeInsets.all(16), children: [
      if (pending.isNotEmpty) ...[
        Row(children: [
          Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 8),
            decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle)),
          Text('Pending Approval (${pending.length})',
            style: Theme.of(c).textTheme.titleSmall),
        ]),
        const SizedBox(height: 8),
        ...pending.map((m) => _MerchantCard(m: m,
          onValidate: () => _validate(m), onReject: () => _reject(m))),
        const SizedBox(height: 20),
      ],
      if (all.isEmpty) Center(child: Padding(padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.storefront_outlined, size: 56, color: Colors.grey),
          const SizedBox(height: 12),
          const Text('No merchant registrations yet.',
            textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 8),
          Text('Merchants register from the Sign up screen.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
        ]))),
      if (validated.isNotEmpty) ...[
        Row(children: [
          Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 8),
            decoration: const BoxDecoration(color: Colors.teal, shape: BoxShape.circle)),
          Text('Validated (${validated.length})', style: Theme.of(c).textTheme.titleSmall),
        ]),
        const SizedBox(height: 8),
        ...validated.map((m) => _MerchantCard(m: m)),
        const SizedBox(height: 20),
      ],
      if (rejected.isNotEmpty) ...[
        Row(children: [
          Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 8),
            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
          Text('Rejected (${rejected.length})', style: Theme.of(c).textTheme.titleSmall),
        ]),
        const SizedBox(height: 8),
        ...rejected.map((m) => _MerchantCard(m: m)),
      ],
    ]);
  }
}

class _MerchantCard extends StatelessWidget {
  final MerchantInfo m;
  final VoidCallback? onValidate, onReject;
  const _MerchantCard({required this.m, this.onValidate, this.onReject});
  @override Widget build(BuildContext c) {
    Color col; IconData icon;
    switch (m.status) {
      case MerchantStatus.pending:   col = Colors.orange; icon = Icons.hourglass_top; break;
      case MerchantStatus.validated: col = Colors.teal;   icon = Icons.check_circle;  break;
      case MerchantStatus.rejected:  col = Colors.red;    icon = Icons.cancel;         break;
    }
    return Card(margin: const EdgeInsets.only(bottom: 10),
      child: Padding(padding: const EdgeInsets.all(14), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(backgroundColor: col.withOpacity(0.12),
            child: Icon(icon, color: col, size: 20)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(m.businessName, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(m.name, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ])),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: col.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8)),
            child: Text(m.status.name[0].toUpperCase() + m.status.name.substring(1),
              style: TextStyle(color: col, fontSize: 11, fontWeight: FontWeight.bold))),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          const Icon(Icons.email_outlined, size: 14, color: Colors.grey),
          const SizedBox(width: 4),
          Text(m.email, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ]),
        if (m.status == MerchantStatus.pending && onValidate != null) ...[
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: ElevatedButton.icon(
              icon: const Icon(Icons.check, size: 16),
              label: const Text('Validate'),
              onPressed: onValidate)),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              icon: const Icon(Icons.close, size: 16),
              label: const Text('Reject'),
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red), minimumSize: const Size(100, 44)),
              onPressed: onReject),
          ]),
        ],
      ])));
  }
}
