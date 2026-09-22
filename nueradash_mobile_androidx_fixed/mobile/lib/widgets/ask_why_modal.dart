import 'package:flutter/material.dart';
import '../services/decision_service.dart';
import '../models/decision_models.dart';

class AskWhyModal extends StatefulWidget {
  final String query;
  final bool isProduct;

  const AskWhyModal({
    super.key,
    required this.query,
    this.isProduct = false,
  });

  static Future<void> show(BuildContext context, {required String query, bool isProduct = false}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AskWhyModal(query: query, isProduct: isProduct),
    );
  }

  @override
  State<AskWhyModal> createState() => _AskWhyModalState();
}

class _AskWhyModalState extends State<AskWhyModal> {
  final DecisionService _decisionService = DecisionService();
  bool _isLoading = true;
  String? _errorMessage;
  RootCauseAnalysis? _analysis;

  @override
  void initState() {
    super.initState();
    _fetchAnalysis();
  }

  Future<void> _fetchAnalysis() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final result = await _decisionService.getRootCause(
        event: widget.isProduct ? 'Performance analysis for ${widget.query}' : widget.query,
      );

      setState(() {
        _analysis = result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.psychology, color: Color(0xFF8B5CF6), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI Root Cause Diagnostic',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      widget.query,
                      style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 12),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(strokeWidth: 2),
                        SizedBox(height: 12),
                        Text('Synthesizing business signals & drivers...'),
                      ],
                    ),
                  )
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, color: Colors.redAccent, size: 36),
                            const SizedBox(height: 8),
                            Text(_errorMessage!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: _fetchAnalysis,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _DiagnosticSection(
                              title: 'Primary Driver / Cause',
                              content: _analysis?.primaryCause ?? 'N/A',
                              icon: Icons.lightbulb,
                              color: const Color(0xFF4F46E5),
                            ),
                            const SizedBox(height: 16),
                            if (_analysis?.contributingFactors != null &&
                                _analysis!.contributingFactors.isNotEmpty) ...[
                              Text(
                                'Contributing Factors',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              ..._analysis!.contributingFactors.map(
                                (f) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.arrow_right, size: 18, color: Color(0xFF8B5CF6)),
                                      const SizedBox(width: 4),
                                      Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                            _DiagnosticSection(
                              title: 'Impact Assessment',
                              content: _analysis?.impactAssessment ?? 'N/A',
                              icon: Icons.analytics,
                              color: const Color(0xFFF59E0B),
                            ),
                            const SizedBox(height: 16),
                            _DiagnosticSection(
                              title: 'Recommended Strategic Action',
                              content: _analysis?.recommendation ?? 'N/A',
                              icon: Icons.rocket_launch,
                              color: const Color(0xFF10B981),
                            ),
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _DiagnosticSection extends StatelessWidget {
  final String title;
  final String content;
  final IconData icon;
  final Color color;

  const _DiagnosticSection({
    required this.title,
    required this.content,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.12 : 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: color,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            content,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.4, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
