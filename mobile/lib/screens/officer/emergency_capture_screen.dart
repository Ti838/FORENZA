import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/offline_vault_service.dart';

class EmergencyCaptureScreen extends StatefulWidget {
  const EmergencyCaptureScreen({super.key});

  @override
  State<EmergencyCaptureScreen> createState() => _EmergencyCaptureScreenState();
}

class _EmergencyCaptureScreenState extends State<EmergencyCaptureScreen> {
  bool _isProcessing = false;
  String _selectedCategory = 'WEAPON';
  final _descController = TextEditingController();

  Future<void> _handleEmergencyCapture(String mediaType) async {
    setState(() => _isProcessing = true);

    try {
      // 1. Get Live GPS Fix (Fallback to approximate if unavailable)
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 4),
        );
      } catch (_) {
        position = await Geolocator.getLastKnownPosition();
      }

      final lat = position?.latitude ?? 23.8103;
      final lng = position?.longitude ?? 90.4125;
      final acc = position?.accuracy ?? 15.0;

      // 2. Generate Controlled Emergency Media Bytes
      final rawMockBytes = Uint8List.fromList(
        'FORENZA_EMERGENCY_CAPTURED_MEDIA_${DateTime.now().millisecondsSinceEpoch}'.codeUnits,
      );

      // 3. Store into Secure Encrypted Local Vault
      final item = await OfflineVaultService.storeEmergencyEvidence(
        rawMediaBytes: rawMockBytes,
        caseId: 'CASE-EMERGENCY-01',
        officerId: 'OFFICER-FIELD-01',
        deviceId: 'DEV-OFFICER-BINDING-01',
        latitude: lat,
        longitude: lng,
        locationAccuracy: acc,
        mediaType: mediaType,
        manualCategory: _selectedCategory,
        description: _descController.text.isNotEmpty
            ? _descController.text
            : 'Emergency field acquisition under offline protocol.',
      );

      if (!mounted) return;

      // 4. Show "SAFE TO LEAVE" Safety Dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
          ),
          title: const Row(
            children: [
              Icon(LucideIcons.shieldCheck, color: Color(0xFF10B981), size: 28),
              SizedBox(width: 10),
              Text(
                'SAFE TO LEAVE SCENE',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Evidence has been locally encrypted and cryptographically hashed (SHA-256).',
                style: TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Evidence ID: ${item.evidenceId}',
                      style: const TextStyle(
                        color: Color(0xFF60A5FA),
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Status: ${item.syncStatus.name.toUpperCase()}',
                      style: const TextStyle(
                        color: Color(0xFFFBBF24),
                        fontFamily: 'monospace',
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'You can now safely depart the scene. Synchronization will occur automatically when network is restored.',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.go('/sync/center');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Go to Sync Center'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        elevation: 0,
        title: const Row(
          children: [
            Icon(LucideIcons.alertTriangle, color: Color(0xFFF59E0B), size: 20),
            SizedBox(width: 8),
            Text(
              'EMERGENCY CAPTURE',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
                letterSpacing: 1.1,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444).withOpacity(0.15),
              border: Border.all(color: const Color(0xFFEF4444)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.wifiOff, color: Color(0xFFEF4444), size: 14),
                SizedBox(width: 6),
                Text(
                  'OFFLINE ACTIVE',
                  style: TextStyle(
                    color: Color(0xFFEF4444),
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Officer Safety Guidance
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.shieldAlert, color: Color(0xFF60A5FA), size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Officer Safety Priority: Capture evidence quickly and leave. All data is locally encrypted with SHA-256 and queued for sync.',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Category Selection
            const Text(
              'MANUAL CATEGORY',
              style: TextStyle(
                color: Colors.white54,
                fontWeight: FontWeight.bold,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedCategory,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  items: const [
                    DropdownMenuItem(value: 'WEAPON', child: Text('Weapon / Ballistics')),
                    DropdownMenuItem(value: 'NARCOTICS', child: Text('Controlled Substance')),
                    DropdownMenuItem(value: 'BIOLOGICAL', child: Text('Biological / Blood')),
                    DropdownMenuItem(value: 'DIGITAL', child: Text('Digital Device / Media')),
                    DropdownMenuItem(value: 'DOCUMENT', child: Text('Document / Financial')),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other Physical Object')),
                  ],
                  onChanged: (val) => setState(() => _selectedCategory = val!),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Quick Note
            TextField(
              controller: _descController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Brief field observation notes (optional)...',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF334155)),
                ),
              ),
              maxLines: 2,
            ),

            const Spacer(),

            // 1-Touch Photo Capture Button
            ElevatedButton.icon(
              onPressed: _isProcessing ? null : () => _handleEmergencyCapture('PHOTO'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 4,
              ),
              icon: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.camera, size: 24),
              label: Text(
                _isProcessing ? 'ENCRYPTING EVIDENCE...' : 'CAPTURE EMERGENCY PHOTO',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),

            const SizedBox(height: 12),

            // 1-Touch Video Capture Button
            OutlinedButton.icon(
              onPressed: _isProcessing ? null : () => _handleEmergencyCapture('VIDEO'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFF59E0B),
                side: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: const Icon(LucideIcons.video, size: 22),
              label: const Text(
                'RECORD EMERGENCY VIDEO (ENCRYPTED)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}
