import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class VaultScanScreen extends StatefulWidget {
  const VaultScanScreen({super.key});

  @override
  State<VaultScanScreen> createState() => _VaultScanScreenState();
}

class _VaultScanScreenState extends State<VaultScanScreen> {
  bool _scanned = false;
  final _vaultController = TextEditingController(text: 'VAULT-01');
  final _rackController = TextEditingController(text: 'RACK-B');
  final _shelfController = TextEditingController(text: 'SHELF-04');
  final _binController = TextEditingController(text: 'BIN-12');

  void _onConfirmStorage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Evidence stored in Vault-01 / Rack-B / Shelf-04 / Bin-12. Custody chain updated.'),
        backgroundColor: AppColors.verified,
      ),
    );
    context.go('/vault/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      appBar: AppBar(
        backgroundColor: AppColors.bgDark,
        title: const Text(
          'Vault Scanner & Storage Index',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: !_scanned
              ? Column(
                  children: [
                    const SizedBox(height: 20),
                    // Scanner Animation Frame
                    Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppColors.primary, width: 2),
                      ),
                      child: const Center(
                        child: Icon(Icons.qr_code_scanner, color: AppColors.primary, size: 72),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Scan Officer Handover Token',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Validating cryptographic JWT signature & current holder state.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                    ),
                    const Spacer(),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => setState(() => _scanned = true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Simulate Handover Scan', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                )
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Verified Handover Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceDark,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.verified.withOpacity(0.4)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                const Text(
                                  'EVD-2024-0089',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.verified.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Text(
                                    'INTEGRITY VERIFIED',
                                    style: TextStyle(color: AppColors.verified, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Text('Category: Weapon (Tactical Knife)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            const Text('Transferor: Detective Marcus Vance (#4028)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Storage Allocation Form
                      const Text(
                        'Assign Vault Storage Location',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _vaultController,
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                              decoration: InputDecoration(
                                labelText: 'Vault ID',
                                labelStyle: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 11),
                                filled: true,
                                fillColor: AppColors.surfaceDark,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.borderDark),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _rackController,
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                              decoration: InputDecoration(
                                labelText: 'Rack',
                                labelStyle: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 11),
                                filled: true,
                                fillColor: AppColors.surfaceDark,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.borderDark),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _shelfController,
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                              decoration: InputDecoration(
                                labelText: 'Shelf',
                                labelStyle: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 11),
                                filled: true,
                                fillColor: AppColors.surfaceDark,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.borderDark),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _binController,
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'monospace'),
                              decoration: InputDecoration(
                                labelText: 'Bin',
                                labelStyle: const TextStyle(color: AppColors.textSecondaryDark, fontSize: 11),
                                filled: true,
                                fillColor: AppColors.surfaceDark,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppColors.borderDark),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 28),

                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: _onConfirmStorage,
                          icon: const Icon(Icons.check_circle, color: Colors.white),
                          label: const Text(
                            'CONFIRM STORAGE & EXTEND CHAIN',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
