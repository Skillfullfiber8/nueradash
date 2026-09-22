import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../storage/auth_storage.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException(this.message, {this.statusCode, this.data});

  @override
  String toString() => message;
}

class ApiClient {
  static Future<Map<String, String>> _getHeaders({bool isJson = true}) async {
    final token = await AuthStorage.getToken();
    final headers = <String, String>{};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // GET Request
  static Future<dynamic> get(String url) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to backend server. Make sure it is running on port 5000.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  // POST Request
  static Future<dynamic> post(String url, {dynamic body}) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .post(
            Uri.parse(url),
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 25));
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to backend server. Make sure it is running on port 5000.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  // PUT Request
  static Future<dynamic> put(String url, {dynamic body}) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .put(
            Uri.parse(url),
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to backend server.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  // DELETE Request
  static Future<dynamic> delete(String url) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .delete(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 20));
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to backend server.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  // Multipart File Upload (CSV)
  static Future<dynamic> uploadFile(String url, String filePath, {String fieldName = 'file'}) async {
    try {
      final token = await AuthStorage.getToken();
      final request = http.MultipartRequest('POST', Uri.parse(url));

      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      final file = await http.MultipartFile.fromPath(fieldName, filePath);
      request.files.add(file);

      final streamedResponse = await request.send().timeout(const Duration(seconds: 40));
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } on SocketException {
      throw ApiException('Cannot connect to backend server for file upload.');
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  // Response Parser & Status Code Handler
  static dynamic _handleResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    if (response.statusCode == 401 || response.statusCode == 403) {
      AuthStorage.clear();
      throw ApiException('Session expired or unauthorized. Please log in again.', statusCode: response.statusCode, data: body);
    }

    final message = (body is Map && body.containsKey('message'))
        ? body['message']
        : (body is Map && body.containsKey('error'))
            ? body['error']
            : 'Request failed with status: ${response.statusCode}';

    throw ApiException(message.toString(), statusCode: response.statusCode, data: body);
  }
}
