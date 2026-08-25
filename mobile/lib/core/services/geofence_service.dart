import 'dart:math';

class GeofenceService {
  static const double earthRadiusMeters = 6371000.0;

  static double _toRadians(double degrees) {
    return degrees * (pi / 180.0);
  }

  /// Calculates Haversine distance in meters between two GPS coordinates
  static double calculateHaversineDistance({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) * sin(dLon / 2) * sin(dLon / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  /// Verifies if capture point is within crime scene radius (default: 500m)
  static bool verifyPerimeter({
    required double captureLat,
    required double captureLon,
    required double crimeSceneLat,
    required double crimeSceneLon,
    double allowedRadiusMeters = 500.0,
  }) {
    final distance = calculateHaversineDistance(
      lat1: captureLat,
      lon1: captureLon,
      lat2: crimeSceneLat,
      lon2: crimeSceneLon,
    );
    return distance <= allowedRadiusMeters;
  }
}
