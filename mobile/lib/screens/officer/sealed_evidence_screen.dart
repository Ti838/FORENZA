import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants/app_colors.dart';

class SealedEvidenceScreen extends StatelessWidget {
  const SealedEvidenceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const String evidenceNumber = 'EVD-2024-0089';
    const String caseNumber = 'CASE-2024-041';
    const String masterHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const String qrJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJFVkQtMjAyNC0wMDg5In0.sig';

    return Scaffold(
      backgroundColor: AppColors.bgDark,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const SizedBox(height: 12),
              // Big Shield Verification Visual
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.verified.withOpacity(0.15),
                  border: Border.all(color: AppColors.verified.withOpacity(0.4), width: 2),
                ),
                child: const Icon(Icons.verified_user, color: AppColors.verified, size: 40),
              ),
              const SizedBox(height: 16),
              const Text(
                'EVIDENCE SEALED & SECURED',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Cryptographic integrity recorded under Rule 902(14)',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark),
              ),
              const SizedBox(height: 24),

              // QR Code Badge Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.borderDark),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: QrImageView(
                        data: qrJwtToken,
                        version: QrVersions.auto,
                        size: 160.0,
                        backgroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      evidenceNumber,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'CASE: $caseNumber',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondaryDark, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 16),

                    // Hash Monospace Display
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.bgDark,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderDark),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('SHA-256 MASTER SEAL:', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 10, fontWeight: FontWeight.bold)),
                          SizedBox(height: 4),
                          Text(
                            masterHash,
                            style: TextStyle(color: AppColors.verified, fontSize: 10, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.go('/officer/dashboard'),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.borderDark),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Field Desk', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => context.push('/officer/transfer'),
                      icon: const Icon(Icons.swap_horiz, size: 18, color: Colors.white),
                      label: const Text('Transfer Custody', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
