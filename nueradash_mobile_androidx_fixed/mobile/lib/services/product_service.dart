import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/product_model.dart';

class ProductService {
  final ApiClient _apiClient = ApiClient();

  Future<List<ProductModel>> getProducts() async {
    final response = await _apiClient.get('/product-master');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => ProductModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load products');
  }

  Future<ProductModel> addProduct({
    required String name,
    required String category,
    required double costPrice,
    required double sellingPrice,
  }) async {
    final response = await _apiClient.post('/product-master', body: {
      'name': name.trim(),
      'category': category.trim(),
      'costPrice': costPrice,
      'sellingPrice': sellingPrice,
    });

    if (response.statusCode == 200 || response.statusCode == 201) {
      return ProductModel.fromJson(jsonDecode(response.body));
    }
    final error = _parseError(response.body, 'Failed to create product');
    throw Exception(error);
  }

  Future<ProductModel> updateProduct(
    String id, {
    required String name,
    required String category,
    required double costPrice,
    required double sellingPrice,
  }) async {
    final response = await _apiClient.put('/product-master/$id', body: {
      'name': name.trim(),
      'category': category.trim(),
      'costPrice': costPrice,
      'sellingPrice': sellingPrice,
    });

    if (response.statusCode == 200) {
      return ProductModel.fromJson(jsonDecode(response.body));
    }
    final error = _parseError(response.body, 'Failed to update product');
    throw Exception(error);
  }

  Future<bool> deleteProduct(String id) async {
    final response = await _apiClient.delete('/product-master/$id');
    return response.statusCode == 200;
  }

  String _parseError(String body, String defaultMessage) {
    try {
      final data = jsonDecode(body);
      return data['message'] ?? data['error'] ?? defaultMessage;
    } catch (_) {
      return defaultMessage;
    }
  }
}
