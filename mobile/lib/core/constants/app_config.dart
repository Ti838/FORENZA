class AppConfig {
  static const String appName = 'FORENZA';
  static const String appVersion = '1.0.0';

  // Supabase Backend Credentials
  static const String supabaseUrl = 'https://xffidcqdhbmladtbvnyu.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_VW1KvSChtkkXjfFjFVLBWg_qUrqK9WD';

  // API Base URL
  // For Android Emulator: 'http://10.0.2.2:3000/api'
  // For Physical Phone on same WiFi: 'http://192.168.0.6:3000/api'
  // For Production / Vercel: 'https://your-vercel-domain.vercel.app/api'
  static const String defaultApiBaseUrl = 'http://10.0.2.2:3000/api';

  // Geofence defaults
  static const double defaultGeofenceRadiusMeters = 500.0;
}
