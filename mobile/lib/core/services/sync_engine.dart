import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'app_config.dart';
import 'offline_vault_service.dart';

class SyncEngine {
  static bool _isSyncing = false;

  /// Checks if device has active internet connectivity
  static Future<bool> isNetworkAvailable() async {
    try {
      final result = await InternetAddress.lookup('dns.google').timeout(
        const Duration(seconds: 3),
      );
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Triggers full synchronization of all pending offline evidence items
  static Future<Map<String, dynamic>> synchronizePendingVault({
    required String userToken,
  }) async {
    if (_isSyncing) {
      return {'status': 'IN_PROGRESS', 'message': 'Sync already running'};
    }

    final online = await isNetworkAvailable();
    if (!online) {
      return {'status': 'OFFLINE', 'message': 'No internet connection available'};
    }

    _isSyncing = true;
    int syncedCount = 0;
    int failedCount = 0;

    try {
      final allItems = await OfflineVaultService.getAllOfflineEvidence();
      final pendingItems = allItems.where(
        (i) =>
            i.syncStatus == OfflineEvidenceStatus.syncPending ||
            i.syncStatus == OfflineEvidenceStatus.syncFailed,
      );

      for (final item in pendingItems) {
        try {
          await OfflineVaultService.updateItemStatus(
            item.evidenceId,
            OfflineEvidenceStatus.uploading,
          );

          // 1. Post Evidence Metadata to Backend
          final metaUrl = Uri.parse('${AppConfig.defaultApiBaseUrl}/api/evidence');
          final metaResponse = await http.post(
            metaUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $userToken',
            },
            body: jsonEncode({
              'evidence_id': item.evidenceId,
              'case_id': item.caseId,
              'officer_id': item.officerId,
              'device_id': item.deviceId,
              'category': item.manualCategory,
              'description': item.description,
              'latitude': item.latitude,
              'longitude': item.longitude,
              'location_accuracy': item.locationAccuracy,
              'media_type': item.mediaType,
              'original_media_sha256': item.originalMediaSha256,
              'master_evidence_hash': item.masterEvidenceHash,
              'captured_offline': true,
              'client_capture_time': item.captureTime.toIso8601String(),
            }),
          );

          if (metaResponse.statusCode >= 400 && metaResponse.statusCode != 409) {
            throw Exception('Metadata sync rejected: ${metaResponse.body}');
          }

          // 2. Mark Server Verified
          await OfflineVaultService.updateItemStatus(
            item.evidenceId,
            OfflineEvidenceStatus.serverVerified,
            verifiedTime: DateTime.now().toUtc(),
          );
          syncedCount++;
        } catch (e) {
          failedCount++;
          await OfflineVaultService.updateItemStatus(
            item.evidenceId,
            OfflineEvidenceStatus.syncFailed,
            errorMsg: e.toString(),
          );
        }
      }

      return {
        'status': 'COMPLETED',
        'synced': syncedCount,
        'failed': failedCount,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
      };
    } finally {
      _isSyncing = false;
    }
  }
}
