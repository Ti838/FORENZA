import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class AiReviewScreen extends StatelessWidget {
  const AiReviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      appBar: AppBar(
        backgroundColor: AppColors.bgDark,
        title: const Text(
          'AI Classification Review',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // AI Model Tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.purple.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, color: AppColors.purple, size: 14),
                    SizedBox(width: 6),
                    Text(
                      'AI Inference Engine • EfficientNet-B0',
                      style: TextStyle(color: AppColors.purple, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // AI Suggestion Main Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.purple.withOpacity(0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Text(
                          'INFERRED IDENTIFICATION',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                            color: AppColors.textSecondaryDark,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.purple,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            '94.2% Confidence',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text('Object Inferred:', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
                    const SizedBox(height: 2),
                    const Text(
                      'Tactical Fixed Blade Knife',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    const Text('Forensic Category:', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12)),
                    const SizedBox(height: 2),
                    const Text(
                      'Weapon / Sharp Cutting Instrument',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryLight),
                    ),
                  ],
                ),
              ),
              const Spacer(),

              // Primary Option: Accept AI Suggestion
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/officer/sealed'),
                  icon: const Icon(Icons.check_circle, color: Colors.white, size: 18),
                  label: const Text(
                    'ACCEPT AI SUGGESTION & SEAL',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Secondary Option: Manual Override
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/officer/manual_classify'),
                  icon: const Icon(Icons.edit, color: Colors.white, size: 18),
                  label: const Text(
                    'CLASSIFY MANUALLY / OVERRIDE',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.borderDark),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
