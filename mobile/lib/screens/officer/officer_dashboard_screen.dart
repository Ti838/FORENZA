import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class OfficerDashboardScreen extends StatelessWidget {
  const OfficerDashboardScreen({super.key});

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
              'FORENZA FIELD',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                color: Colors.white,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: AppColors.primaryLight),
            onPressed: () => context.push('/vault/scan'),
            tooltip: 'Switch to Vault Scanner',
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.textSecondaryDark, size: 20),
            onPressed: () => context.go('/login'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Officer Greeting Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, Color(0xFF4F46E5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.gps_fixed, color: Colors.white, size: 12),
                        SizedBox(width: 6),
                        Text(
                          'Crime Scene Perimeter Active • Zone #4',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Good Morning, Officer Vance',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.extrabold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Ready to acquire and seal evidence items under Rule 902(14).',
                    style: TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Primary Touch CTA: CAPTURE EVIDENCE
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/officer/capture'),
                icon: const Icon(Icons.camera_alt, color: Colors.white, size: 22),
                label: const Text(
                  'CAPTURE EVIDENCE NOW',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.0, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  elevation: 6,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Stats Cards
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
                        Text('Active Cases', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 11)),
                        SizedBox(height: 4),
                        Text('3', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
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
                        Text('Evidence Today', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 11)),
                        SizedBox(height: 4),
                        Text('5 Sealed', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.verified)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Evidence Section
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text(
                  'Recent Evidence Items',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                TextButton.icon(
                  onPressed: () => context.push('/officer/transfer'),
                  icon: const Icon(Icons.swap_horiz, size: 16, color: AppColors.primaryLight),
                  label: const Text('Transfer', style: TextStyle(fontSize: 12, color: AppColors.primaryLight)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Evidence Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceDark,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.borderDark),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'EVD-2024-0089',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.verified.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.verified.withOpacity(0.3)),
                        ),
                        child: const Text(
                          'SEALED',
                          style: TextStyle(color: AppColors.verified, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Weapon → Tactical Fixed Blade Knife',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'SHA-256: e3b0c44298fc1c14... (Verified)',
                    style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: AppColors.primaryLight),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
