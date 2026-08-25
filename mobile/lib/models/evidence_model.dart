class EvidenceModel {
  final String id;
  final String caseId;
  final String evidenceNumber;
  final String status;
  final String? masterHash;
  final String? capturedAt;
  final double? latitude;
  final double? longitude;
  final double? gpsAccuracy;
  final String? category;
  final String? objectName;
  final double? aiConfidence;
  final String? classificationMethod;
  final String? qrToken;

  EvidenceModel({
    required this.id,
    required this.caseId,
    required this.evidenceNumber,
    required this.status,
    this.masterHash,
    this.capturedAt,
    this.latitude,
    this.longitude,
    this.gpsAccuracy,
    this.category,
    this.objectName,
    this.aiConfidence,
    this.classificationMethod,
    this.qrToken,
  });

  factory EvidenceModel.fromJson(Map<String, dynamic> json) {
    return EvidenceModel(
      id: json['id'] as String,
      caseId: json['case_id'] as String,
      evidenceNumber: json['evidence_number'] as String,
      status: json['status'] as String,
      masterHash: json['master_hash'] as String?,
      capturedAt: json['captured_at'] as String?,
      latitude: json['capture_latitude'] != null ? (json['capture_latitude'] as num).toDouble() : null,
      longitude: json['capture_longitude'] != null ? (json['capture_longitude'] as num).toDouble() : null,
      gpsAccuracy: json['capture_gps_accuracy'] != null ? (json['capture_gps_accuracy'] as num).toDouble() : null,
      category: json['category'] as String?,
      objectName: json['object_name'] as String?,
      aiConfidence: json['ai_confidence'] != null ? (json['ai_confidence'] as num).toDouble() : null,
      classificationMethod: json['classification_method'] as String?,
      qrToken: json['qr_token'] as String?,
    );
  }
}
