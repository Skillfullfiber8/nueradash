import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/dashboard_service.dart';
import '../../models/dashboard_summary_model.dart';
import '../../widgets/kpi_card.dart';
import '../../widgets/sales_trend_chart.dart';
import '../../widgets/top_products_chart.dart';
import '../../widgets/ask_why_modal.dart';
import '../chatbot/chatbot_sheet.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DashboardService _dashboardService = DashboardService();

  bool _isLoading = true;
  String? _errorMessage;

  DashboardSummary? _summary;
  List<SalesTrendPoint> _trendPoints = [];
  List<SalesPredictionPoint> _predictionPoints = [];
  List<TopProductItem> _topProducts = [];
  String _aiSummary = '';
  bool _isRegeneratingSummary = false;

  final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
  final compactCurrency = NumberFormat.compactCurrency(symbol: '\$');

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final summaryFuture = _dashboardService.getSummary();
      final trendFuture = _dashboardService.getSalesTrend();
      final predictionFuture = _dashboardService.getSalesPrediction();
      final topProductsFuture = _dashboardService.getTopProducts();
      final aiSummaryFuture = _dashboardService.getAISummary();

      final results = await Future.wait([
        summaryFuture,
        trendFuture,
        predictionFuture,
        topProductsFuture,
        aiSummaryFuture,
      ]);

      if (!mounted) return;
      setState(() {
        _summary = results[0] as DashboardSummary;
        _trendPoints = results[1] as List<SalesTrendPoint>;
        _predictionPoints = results[2] as List<SalesPredictionPoint>;
        _topProducts = results[3] as List<TopProductItem>;
        _aiSummary = results[4] as String;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _regenerateSummary() async {
    setState(() => _isRegeneratingSummary = true);
    try {
      final newSummary = await _dashboardService.regenerateAISummary();
      if (!mounted) return;
      setState(() {
        _aiSummary = newSummary;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('AI Executive Summary refreshed!')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to regenerate summary: $e')),
      );
    } finally {
      if (mounted) setState(() => _isRegeneratingSummary = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.auto_graph_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
            const Text('NeuraDash Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Data',
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => ChatbotSheet.show(context),
        icon: const Icon(Icons.psychology, color: Colors.white),
        label: const Text('Ask AI', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                          const SizedBox(height: 12),
                          Text('Failed to load dashboard data', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 6),
                          Text(_errorMessage!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[500])),
                          const SizedBox(height: 16),
                          ElevatedButton(onPressed: _loadDashboardData, child: const Text('Try Again')),
                        ],
                      ),
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // AI Executive Summary Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isDark
                                  ? [const Color(0xFF1E1B4B), const Color(0xFF311042)]
                                  : [const Color(0xFFEEF2FF), const Color(0xFFFAF5FF)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFF8B5CF6).withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.auto_awesome, color: Color(0xFF8B5CF6), size: 18),
                                      SizedBox(width: 8),
                                      Text(
                                        'AI Executive Briefing',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: Color(0xFF8B5CF6),
                                        ),
                                      ),
                                    ],
                                  ),
                                  InkWell(
                                    onTap: _isRegeneratingSummary ? null : _regenerateSummary,
                                    borderRadius: BorderRadius.circular(8),
                                    child: Padding(
                                      padding: const EdgeInsets.all(4),
                                      child: _isRegeneratingSummary
                                          ? const SizedBox(
                                              width: 14,
                                              height: 14,
                                              child: CircularProgressIndicator(strokeWidth: 2),
                                            )
                                          : const Row(
                                              children: [
                                                Icon(Icons.refresh, size: 14, color: Color(0xFF8B5CF6)),
                                                SizedBox(width: 4),
                                                Text(
                                                  'Regenerate',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    color: Color(0xFF8B5CF6),
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _aiSummary.isNotEmpty
                                    ? _aiSummary
                                    : 'Upload or record sales to generate automated strategic AI insights.',
                                style: TextStyle(
                                  fontSize: 13,
                                  height: 1.45,
                                  color: isDark ? Colors.grey[200] : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // KPI Grid (2 columns)
                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.25,
                          children: [
                            KpiCard(
                              title: 'Total Revenue',
                              value: compactCurrency.format(_summary?.totalRevenue ?? 0),
                              subtitle: '${_summary?.totalSales ?? 0} transactions',
                              icon: Icons.attach_money_rounded,
                              iconColor: const Color(0xFF4F46E5),
                              onTap: () => AskWhyModal.show(context, query: 'Total Revenue performance drivers'),
                            ),
                            KpiCard(
                              title: 'Total Profit',
                              value: compactCurrency.format(_summary?.totalProfit ?? 0),
                              subtitle: '${(_summary?.profitMargin ?? 0).toStringAsFixed(1)}% margin',
                              icon: Icons.trending_up_rounded,
                              iconColor: const Color(0xFF10B981),
                              onTap: () => AskWhyModal.show(context, query: 'Total Profit margin factors'),
                            ),
                            KpiCard(
                              title: 'Avg Order Value',
                              value: currencyFormat.format(_summary?.averageOrderValue ?? 0),
                              subtitle: 'Per transaction',
                              icon: Icons.shopping_bag_outlined,
                              iconColor: const Color(0xFFF59E0B),
                              onTap: () => AskWhyModal.show(context, query: 'Average Order Value optimization'),
                            ),
                            KpiCard(
                              title: 'Total Units Sold',
                              value: '${_summary?.totalUnits ?? 0}',
                              subtitle: 'Across catalog',
                              icon: Icons.inventory_2_outlined,
                              iconColor: const Color(0xFF06B6D4),
                              onTap: () => AskWhyModal.show(context, query: 'Unit sales velocity and demand'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Sales Trend & Prediction Chart Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: SalesTrendChart(
                            dataPoints: _trendPoints,
                            predictionPoints: _predictionPoints,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Top Products Chart Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: TopProductsChart(
                            products: _topProducts,
                            onAskWhy: (prodName) => AskWhyModal.show(context, query: prodName, isProduct: true),
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
      ),
    );
  }
}
