import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_config.dart';

class ApiService {
  // Default base URL pointing to the Next.js / Supabase backend
  // For Android emulator: 10.0.2.2:3000
  // For physical device: use your machine's LAN IP e.g. 192.168.0.6:3000
  static String baseUrl = AppConfig.defaultApiBaseUrl;
  static String? authToken;

  static void setBaseUrl(String url) {
    baseUrl = url;
  }

  static void setToken(String token) {
    authToken = token;
  }

  static Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json',
      if (authToken != null) 'Authorization': 'Bearer $authToken',
    };
  }

  /// Authenticate officer and bind device
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    required String deviceIdentifier,
    required String deviceName,
    required String platform,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'device_identifier': deviceIdentifier,
        'device_name': deviceName,
        'platform': platform,
      }),
    );

    return jsonDecode(response.body);
  }

  /// Submit geotagged field media capture
  static Future<Map<String, dynamic>> captureEvidence({
    required String evidenceId,
    required double latitude,
    required double longitude,
    required double gpsAccuracy,
    required String mediaSha256,
    required int fileSizeBytes,
    required String storagePath,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/evidence/$evidenceId/capture'),
      headers: _headers(),
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'gps_accuracy': gpsAccuracy,
        'media_type': 'PHOTO',
        'mime_type': 'image/jpeg',
        'file_sha256': mediaSha256,
        'file_size_bytes': fileSizeBytes,
        'storage_path': storagePath,
      }),
    );

    return jsonDecode(response.body);
  }

  /// Seal evidence with canonical SHA-256 master hash
  static Future<Map<String, dynamic>> sealEvidence({
    required String evidenceId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/evidence/$evidenceId/seal'),
      headers: _headers(),
    );

    return jsonDecode(response.body);
  }

  /// Generate custody transfer handover token
  static Future<Map<String, dynamic>> transferEvidence({
    required String evidenceId,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/evidence/$evidenceId/transfer'),
      headers: _headers(),
      body: jsonEncode({'notes': notes}),
    );

    return jsonDecode(response.body);
  }

  /// Receive custody handover token and extend chain
  static Future<Map<String, dynamic>> receiveEvidence({
    required String evidenceId,
    required String handoverToken,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/evidence/$evidenceId/receive'),
      headers: _headers(),
      body: jsonEncode({'token': handoverToken}),
    );

    return jsonDecode(response.body);
  }
}
