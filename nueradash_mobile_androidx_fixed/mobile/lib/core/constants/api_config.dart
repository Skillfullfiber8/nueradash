class ApiConfig {
  // Default base URL for Android Studio Emulator (10.0.2.2 maps to host machine localhost:5000)
  static String baseUrl = 'http://10.0.2.2:5000/api';

  // Helper method to override base URL for physical device or production
  static void setBaseUrl(String url) {
    if (url.endsWith('/')) {
      baseUrl = '${url}api';
    } else if (!url.endsWith('/api')) {
      baseUrl = '$url/api';
    } else {
      baseUrl = url;
    }
  }

  // Auth Endpoints
  static String get login => '$baseUrl/auth/login';
  static String get signup => '$baseUrl/auth/signup';
  static String get protected => '$baseUrl/auth/protected';

  // Insights & Analytics Endpoints
  static String get summary => '$baseUrl/insights/summary';
  static String get topProducts => '$baseUrl/insights/top-products';
  static String get salesTrend => '$baseUrl/insights/sales-trend';
  static String get salesPrediction => '$baseUrl/insights/sales-prediction';
  static String get salesByCity => '$baseUrl/insights/sales-by-city';
  static String get salesByCategory => '$baseUrl/insights/sales-by-category';
  static String get salesByRegion => '$baseUrl/insights/sales-by-region';
  static String get paymentMethods => '$baseUrl/insights/payment-methods';
  static String get topCustomers => '$baseUrl/insights/top-customers';
  static String get customerTypes => '$baseUrl/insights/customer-types';
  static String get aiSummary => '$baseUrl/insights/ai-summary';
  static String get regenerateSummary => '$baseUrl/insights/regenerate-summary';
  static String get chat => '$baseUrl/insights/chat';
  static String get salesRecords => '$baseUrl/insights/sales-records';

  // Product Master Endpoints
  static String get productMaster => '$baseUrl/product-master';

  // Smart Import Endpoints
  static String get smartImportAnalyze => '$baseUrl/smart-import/analyze';
  static String get smartImportExecute => '$baseUrl/smart-import/import';

  // Decision Intelligence Endpoints
  static String get decisionOverview => '$baseUrl/decision/overview';
  static String get decisionRadar => '$baseUrl/decision/radar';
  static String get decisionRootCause => '$baseUrl/decision/root-cause';
  static String get decisionSimulate => '$baseUrl/decision/simulate';
  static String get decisionActionPlans => '$baseUrl/decision/action-plans';
  static String get decisionPredictions => '$baseUrl/decision/predictions';
}
