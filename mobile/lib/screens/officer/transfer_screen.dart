import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/app_colors.dart';

class TransferScreen extends StatefulWidget {
  const TransferScreen({super.key});

  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen> {
  bool _tokenGenerated = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      appBar: AppBar(
        backgroundColor: AppColors.bgDark,
        title: const Text(
          'Custody Transfer & Handover',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!_tokenGenerated) ...[
                const Text(
                  'Select Item in Your Custody',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Generating a handover token extends the immutable custody chain to the receiving custodian.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                ),
                const SizedBox(height: 20),

                // Item Selected Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primary.withOpacity(0.5)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.inventory_2, color: AppColors.primaryLight, size: 24),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'EVD-2024-0089',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            Text(
                              'Weapon (Tactical Knife) • CASE-2024-041',
                              style: TextStyle(fontSize: 11, color: AppColors.textSecondaryDark),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () => setState(() => _tokenGenerated = true),
                    icon: const Icon(Icons.qr_code, color: Colors.white),
                    label: const Text(
                      'GENERATE HANDOVER QR TOKEN',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ] else ...[
                // Token Generated QR Screen
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.warning.withOpacity(0.4)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.timer, color: AppColors.warning, size: 14),
                            SizedBox(width: 6),
                            Text(
                              'HANDOVER TOKEN EXPIRES IN 14:52',
                              style: TextStyle(color: AppColors.warning, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: QrImageView(
                          data: 'eyJhbGciOiJIUzI1NiJ9.CUSTODY_HANDOVER_TOKEN.sig',
                          version: QrVersions.auto,
                          size: 200.0,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'EVD-2024-0089',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'monospace'),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Present this token to the Vault Custodian or Lab Intake Officer.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                      ),
                    ],
                  ),
                ),
                const Spacer(),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _tokenGenerated = false),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.borderDark),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Cancel Transfer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
