import 'dart:convert';
import 'package:crypto/crypto.dart';

class CryptoService {
  static const String genesisHash = 'FORENZA_GENESIS_v1';

  /// Generates a canonical SHA-256 master hash for evidence
  static String generateEvidenceHash({
    required String evidenceId,
    required String caseId,
    required String evidenceNumber,
    required String officerId,
    required String timestampUtc,
    required double latitude,
    required double longitude,
    required double? gpsAccuracy,
    required String mediaSha256,
    required String mediaType,
    required String mimeType,
    required int fileSizeBytes,
  }) {
    final Map<String, dynamic> canonicalMap = {
      'algorithm': 'FORENZA_EVIDENCE_HASH_v1',
      'case_id': caseId,
      'evidence_id': evidenceId,
      'evidence_number': evidenceNumber,
      'file_size_bytes': fileSizeBytes,
      'gps_accuracy': gpsAccuracy,
      'latitude': latitude,
      'longitude': longitude,
      'media_sha256': mediaSha256,
      'media_type': mediaType,
      'mime_type': mimeType,
      'officer_id': officerId,
      'timestamp_utc': timestampUtc,
    };

    // Sort keys alphabetically for canonical serialization
    final sortedKeys = canonicalMap.keys.toList()..sort();
    final sortedMap = {for (var k in sortedKeys) k: canonicalMap[k]};
    final jsonString = jsonEncode(sortedMap);

    return sha256.convert(utf8.encode(jsonString)).toString();
  }

  /// Computes custody chain extension hash
  static String extendCustodyChain({
    required String previousHash,
    required String custodyId,
    required String evidenceId,
    required String action,
    required String? senderId,
    required String? receiverId,
    required String timestamp,
    required double? latitude,
    required double? longitude,
  }) {
    final Map<String, dynamic> canonicalMap = {
      'action': action,
      'algorithm': 'FORENZA_CUSTODY_CHAIN_v1',
      'custody_id': custodyId,
      'evidence_id': evidenceId,
      'latitude': latitude,
      'longitude': longitude,
      'receiver_id': receiverId,
      'sender_id': senderId,
      'timestamp': timestamp,
    };

    final sortedKeys = canonicalMap.keys.toList()..sort();
    final sortedMap = {for (var k in sortedKeys) k: canonicalMap[k]};
    final jsonString = jsonEncode(sortedMap);

    final input = previousHash + jsonString;
    return sha256.convert(utf8.encode(input)).toString();
  }
}
