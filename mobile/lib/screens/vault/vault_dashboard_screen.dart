import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class VaultDashboardScreen extends StatelessWidget {
  const VaultDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      appBar: AppBar(
        backgroundColor: AppColors.bgDark,
        title: Row(
          children: [
            Image.asset('assets/logo.png', width: 28, height: 28),
            const SizedBox(width: 10),
            const Text(
              'VAULT CONTROL',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Big Scanner CTA
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surfaceDark,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.primary.withOpacity(0.4)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.qr_code_scanner, color: AppColors.primary, size: 56),
                  const SizedBox(height: 14),
                  const Text(
                    'Receive Evidence Intake',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Scan officer handover QR tokens to verify custody and index physical storage.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/vault/scan'),
                      icon: const Icon(Icons.camera_alt, color: Colors.white),
                      label: const Text('LAUNCH QR SCANNER', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Storage Quick Stats
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceDark,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderDark),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Stored Items', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 11)),
                        SizedBox(height: 4),
                        Text('1,429', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceDark,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderDark),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Received Today', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 11)),
                        SizedBox(height: 4),
                        Text('8 Items', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.verified)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
