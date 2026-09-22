import 'dart:convert';
import '../core/network/api_client.dart';

class AnalyzeCsvResult {
  final String filePath;
  final List<String> originalHeaders;
  final Map<String, String> suggestedMapping;
  final List<Map<String, dynamic>> previewRows;

  AnalyzeCsvResult({
    required this.filePath,
    required this.originalHeaders,
    required this.suggestedMapping,
    required this.previewRows,
  });

  factory AnalyzeCsvResult.fromJson(Map<String, dynamic> json) {
    final rawMapping = json['suggestedMapping'] as Map<String, dynamic>? ?? {};
    final mapping = rawMapping.map((k, v) => MapEntry(k, v.toString()));

    final rawHeaders = json['originalHeaders'] as List<dynamic>? ?? [];
    final headers = rawHeaders.map((e) => e.toString()).toList();

    final rawPreview = json['previewRows'] as List<dynamic>? ?? [];
    final preview = rawPreview.map((e) => Map<String, dynamic>.from(e as Map)).toList();

    return AnalyzeCsvResult(
      filePath: json['filePath'] ?? '',
      originalHeaders: headers,
      suggestedMapping: mapping,
      previewRows: preview,
    );
  }
}

class ImportResult {
  final bool success;
  final int importedCount;
  final String message;

  ImportResult({
    required this.success,
    required this.importedCount,
    required this.message,
  });

  factory ImportResult.fromJson(Map<String, dynamic> json) {
    return ImportResult(
      success: json['success'] ?? true,
      importedCount: json['importedCount'] ?? json['count'] ?? 0,
      message: json['message'] ?? 'Import completed successfully',
    );
  }
}

class SmartImportService {
  final ApiClient _apiClient = ApiClient();

  Future<AnalyzeCsvResult> analyzeFile(String filePath, {List<int>? bytes, String? filename}) async {
    final response = await _apiClient.uploadFile(
      '/smart-import/analyze',
      filePath: filePath,
      fileBytes: bytes,
      filename: filename,
    );

    final respStr = await response.stream.bytesToString();
    if (response.statusCode == 200) {
      return AnalyzeCsvResult.fromJson(jsonDecode(respStr));
    }
    throw Exception('Failed to analyze CSV file: $respStr');
  }

  Future<ImportResult> commitImport(String serverFilePath, Map<String, String> mapping) async {
    final response = await _apiClient.post('/smart-import/import', body: {
      'filePath': serverFilePath,
      'mapping': mapping,
    });

    if (response.statusCode == 200) {
      return ImportResult.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to commit import: ${response.body}');
  }
}
