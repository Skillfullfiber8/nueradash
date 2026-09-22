import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/dashboard_summary_model.dart';

class DashboardService {
  final ApiClient _apiClient = ApiClient();

  Future<DashboardSummary> getSummary() async {
    final response = await _apiClient.get('/insights/summary');
    if (response.statusCode == 200) {
      return DashboardSummary.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load dashboard summary: ${response.statusCode}');
  }

  Future<List<SalesTrendPoint>> getSalesTrend() async {
    final response = await _apiClient.get('/insights/sales-trend');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => SalesTrendPoint.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<TopProductItem>> getTopProducts() async {
    final response = await _apiClient.get('/insights/top-products');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => TopProductItem.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<SalesPredictionPoint>> getSalesPrediction() async {
    final response = await _apiClient.get('/insights/sales-prediction');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => SalesPredictionPoint.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<CategorySalesItem>> getSalesByCategory() async {
    final response = await _apiClient.get('/insights/sales-by-category');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => CategorySalesItem.fromJson(e)).toList();
    }
    return [];
  }

  Future<List<CitySalesItem>> getSalesByCity() async {
    final response = await _apiClient.get('/insights/sales-by-city');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => CitySalesItem.fromJson(e)).toList();
    }
    return [];
  }

  Future<String> getAISummary() async {
    final response = await _apiClient.get('/insights/ai-summary');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['summary'] ?? 'No AI summary generated yet.';
    }
    return 'Could not load AI summary.';
  }

  Future<String> regenerateAISummary() async {
    final response = await _apiClient.post('/insights/regenerate-summary');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['summary'] ?? 'AI summary updated.';
    }
    throw Exception('Failed to regenerate AI summary');
  }
}
