import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/decision_models.dart';

class DecisionService {
  final ApiClient _apiClient = ApiClient();

  Future<List<RadarItem>> getRadarItems() async {
    final response = await _apiClient.get('/decision/radar');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => RadarItem.fromJson(e)).toList();
    }
    return [];
  }

  Future<RootCauseAnalysis> getRootCause({String? event, String? metric}) async {
    String query = '';
    if (event != null && event.isNotEmpty) {
      query = '?event=${Uri.encodeComponent(event)}';
    } else if (metric != null && metric.isNotEmpty) {
      query = '?metric=${Uri.encodeComponent(metric)}';
    }

    final response = await _apiClient.get('/decision/root-cause$query');
    if (response.statusCode == 200) {
      return RootCauseAnalysis.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load root cause analysis');
  }

  Future<SimulationResult> runSimulation({
    double priceChangePercent = 0.0,
    double discountPercent = 0.0,
    double adSpendChangePercent = 0.0,
    String? categoryFilter,
  }) async {
    final response = await _apiClient.post('/decision/simulate', body: {
      'priceChangePercent': priceChangePercent,
      'discountPercent': discountPercent,
      'adSpendChangePercent': adSpendChangePercent,
      if (categoryFilter != null && categoryFilter.isNotEmpty)
        'categoryFilter': categoryFilter,
    });

    if (response.statusCode == 200) {
      return SimulationResult.fromJson(jsonDecode(response.body));
    }
    throw Exception('Simulation execution failed: ${response.statusCode}');
  }

  Future<List<ActionPlanItem>> getActionPlans() async {
    final response = await _apiClient.get('/decision/action-plans');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => ActionPlanItem.fromJson(e)).toList();
    }
    return [];
  }
}
