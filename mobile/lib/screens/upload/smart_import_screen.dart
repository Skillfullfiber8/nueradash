import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/smart_import_service.dart';

class SmartImportScreen extends StatefulWidget {
  const SmartImportScreen({super.key});

  @override
  State<SmartImportScreen> createState() => _SmartImportScreenState();
}

class _SmartImportScreenState extends State<SmartImportScreen> {
  final SmartImportService _importService = SmartImportService();

  // State
  String? _selectedFileName;
  String? _selectedFilePath;
  List<int>? _fileBytes;
  bool _isAnalyzing = false;
  bool _isImporting = false;
  String? _errorMessage;

  AnalyzeCsvResult? _analysisResult;
  Map<String, String> _columnMapping = {};

  final List<String> _targetFields = [
    'Date',
    'Product',
    'Quantity',
    'UnitPrice',
    'TotalAmount',
    'Category',
    'City',
    'CustomerType',
    'PaymentMethod',
  ];

  Future<void> _pickAndAnalyzeFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv'],
        withData: true,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        setState(() {
          _selectedFileName = file.name;
          _selectedFilePath = file.path;
          _fileBytes = file.bytes;
          _isAnalyzing = true;
          _errorMessage = null;
          _analysisResult = null;
        });

        final analysis = await _importService.analyzeFile(
          file.path ?? file.name,
          bytes: file.bytes,
          filename: file.name,
        );

        if (!mounted) return;
        setState(() {
          _analysisResult = analysis;
          _columnMapping = Map.from(analysis.suggestedMapping);
          _isAnalyzing = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isAnalyzing = false;
      });
    }
  }

  Future<void> _commitImport() async {
    if (_analysisResult == null) return;

    setState(() {
      _isImporting = true;
      _errorMessage = null;
    });

    try {
      final result = await _importService.commitImport(
        _analysisResult!.filePath,
        _columnMapping,
      );

      if (!mounted) return;
      setState(() => _isImporting = false);

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
              SizedBox(width: 10),
              Text('Import Successful!'),
            ],
          ),
          content: Text(
            'Successfully imported ${result.importedCount} transactions into your database.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() {
                  _analysisResult = null;
                  _selectedFileName = null;
                });
              },
              child: const Text('Done'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isImporting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.upload_file_outlined, color: Color(0xFF4F46E5), size: 22),
            SizedBox(width: 8),
            Text('Smart CSV Import', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Upload Drop Area
            InkWell(
              onTap: _isAnalyzing ? null : _pickAndAnalyzeFile,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF4F46E5).withOpacity(0.4),
                    width: 2,
                    style: BorderStyle.solid,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF4F46E5).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.cloud_upload_outlined, size: 36, color: Color(0xFF4F46E5)),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _selectedFileName ?? 'Tap to select CSV File',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'AI will automatically detect columns and map data fields',
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (_isAnalyzing) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Analyzing schema & detecting column mappings...'),
                  ],
                ),
              ),
            ],

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Schema Mapping Review Area
            if (_analysisResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.auto_fix_high, color: Color(0xFF8B5CF6), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'AI Column Mapping Review',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Verify or adjust the column assignments for your dataset:',
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                    const SizedBox(height: 16),
                    ..._targetFields.map((field) {
                      final availableHeaders = ['-- None --', ..._analysisResult!.originalHeaders];
                      final currentVal = _columnMapping[field] ?? '-- None --';
                      final selectedVal = availableHeaders.contains(currentVal) ? currentVal : '-- None --';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 2,
                              child: Text(
                                field,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                            ),
                            const Icon(Icons.arrow_forward, size: 16, color: Colors.grey),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 3,
                              child: DropdownButtonFormField<String>(
                                value: selectedVal,
                                isDense: true,
                                decoration: const InputDecoration(
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                ),
                                items: availableHeaders.map((h) {
                                  return DropdownMenuItem(value: h, child: Text(h, style: const TextStyle(fontSize: 12)));
                                }).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    if (val == null || val == '-- None --') {
                                      _columnMapping.remove(field);
                                    } else {
                                      _columnMapping[field] = val;
                                    }
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 16),

                    // Commit Import Button
                    ElevatedButton.icon(
                      onPressed: _isImporting ? null : _commitImport,
                      icon: _isImporting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.check, size: 20),
                      label: Text(_isImporting ? 'Importing Ledger...' : 'Commit & Import Data'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
