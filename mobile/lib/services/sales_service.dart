import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/sales_record_model.dart';

class SalesService {
  final ApiClient _apiClient = ApiClient();

  Future<List<SalesRecordModel>> getSalesRecords() async {
    final response = await _apiClient.get('/insights/sales-records');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => SalesRecordModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load sales records');
  }

  Future<SalesRecordModel> updateSalesRecord(
    String id, {
    required String productName,
    required String category,
    required int quantity,
    required double unitPrice,
    required double totalAmount,
    required String date,
    String? city,
    String? customerType,
    String? paymentMethod,
  }) async {
    final response = await _apiClient.put('/insights/sales-records/$id', body: {
      'productName': productName,
      'category': category,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalAmount': totalAmount,
      'date': date,
      'city': city,
      'customerType': customerType,
      'paymentMethod': paymentMethod,
    });

    if (response.statusCode == 200) {
      return SalesRecordModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update sales record');
  }

  Future<bool> deleteSalesRecord(String id) async {
    final response = await _apiClient.delete('/insights/sales-records/$id');
    return response.statusCode == 200;
  }
}
