import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/mfa_screen.dart';
import '../../screens/officer/officer_dashboard_screen.dart';
import '../../screens/officer/capture_screen.dart';
import '../../screens/officer/ai_review_screen.dart';
import '../../screens/officer/manual_classification_screen.dart';
import '../../screens/officer/sealed_evidence_screen.dart';
import '../../screens/officer/transfer_screen.dart';
import '../../screens/vault/vault_dashboard_screen.dart';
import '../../screens/vault/vault_scan_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/officer/dashboard',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/mfa',
      builder: (context, state) => const MfaScreen(),
    ),
    GoRoute(
      path: '/officer/dashboard',
      builder: (context, state) => const OfficerDashboardScreen(),
    ),
    GoRoute(
      path: '/officer/capture',
      builder: (context, state) => const CaptureScreen(),
    ),
    GoRoute(
      path: '/officer/ai_review',
      builder: (context, state) => const AiReviewScreen(),
    ),
    GoRoute(
      path: '/officer/manual_classify',
      builder: (context, state) => const ManualClassificationScreen(),
    ),
    GoRoute(
      path: '/officer/sealed',
      builder: (context, state) => const SealedEvidenceScreen(),
    ),
    GoRoute(
      path: '/officer/transfer',
      builder: (context, state) => const TransferScreen(),
    ),
    GoRoute(
      path: '/vault/dashboard',
      builder: (context, state) => const VaultDashboardScreen(),
    ),
    GoRoute(
      path: '/vault/scan',
      builder: (context, state) => const VaultScanScreen(),
    ),
  ],
);
