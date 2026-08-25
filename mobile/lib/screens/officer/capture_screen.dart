import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  // Live GPS Telemetry
  final double _lat = 40.7128;
  final double _lon = -74.0060;
  final double _accuracy = 3.4;
  final int _distanceMeters = 128;
  final bool _geofenceVerified = true;

  void _onCapture() {
    context.push('/officer/ai_review');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Simulated Camera Viewfinder Grid
          Container(
            width: double.infinity,
            height: double.infinity,
            color: const Color(0xFF070A10),
            child: CustomPaint(
              painter: _GridPainter(),
              child: Center(
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white24, width: 1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Center(
                    child: Icon(Icons.center_focus_weak, color: Colors.white38, size: 48),
                  ),
                ),
              ),
            ),
          ),

          // Top Header: Geofence Verification Pill & Close
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.verified.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.verified.withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.shield, color: AppColors.verified, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          'PERIMETER VERIFIED • ${_distanceMeters}m from scene',
                          style: const TextStyle(
                            color: AppColors.verified,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 24),
                    onPressed: () => context.pop(),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Controls & Live GPS HUD
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black.withOpacity(0.95)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // GPS Telemetry HUD
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            const Text('LAT / LON', style: TextStyle(color: Colors.white54, fontSize: 10)),
                            const SizedBox(height: 2),
                            Text(
                              '${_lat.toStringAsFixed(4)}°, ${_lon.toStringAsFixed(4)}°',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            const Text('ACCURACY', style: TextStyle(color: Colors.white54, fontSize: 10)),
                            const SizedBox(height: 2),
                            Text(
                              '±${_accuracy}m',
                              style: const TextStyle(color: AppColors.verified, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const Column(
                          children: [
                            Text('HEADING', style: TextStyle(color: Colors.white54, fontSize: 10)),
                            SizedBox(height: 2),
                            Text(
                              '184° SSW',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Shutter Button Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.videocam, color: Colors.white, size: 28),
                        onPressed: _onCapture,
                      ),
                      // Primary Capture Trigger
                      GestureDetector(
                        onTap: _onCapture,
                        child: Container(
                          width: 76,
                          height: 76,
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                          ),
                          child: Container(
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primary,
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 32),
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.photo_library, color: Colors.white, size: 28),
                        onPressed: _onCapture,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.04)
      ..strokeWidth = 1;

    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
