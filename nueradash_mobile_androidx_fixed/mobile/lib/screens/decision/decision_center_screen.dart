import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/decision_service.dart';
import '../../models/decision_models.dart';
import '../../widgets/ask_why_modal.dart';
import '../../widgets/empty_state_view.dart';

class DecisionCenterScreen extends StatefulWidget {
  const DecisionCenterScreen({super.key});

  @override
  State<DecisionCenterScreen> createState() => _DecisionCenterScreenState();
}

class _DecisionCenterScreenState extends State<DecisionCenterScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DecisionService _decisionService = DecisionService();

  // Radar State
  bool _isLoadingRadar = true;
  List<RadarItem> _radarItems = [];

  // Simulator State
  double _priceChange = 0.0;
  double _discountChange = 0.0;
  double _adSpendChange = 0.0;
  bool _isSimulating = false;
  SimulationResult? _simulationResult;

  // Action Plans State
  bool _isLoadingPlans = true;
  List<ActionPlanItem> _actionPlans = [];

  // Root Cause State
  final TextEditingController _rootCauseController = TextEditingController(text: 'Drop in profit margin');
  bool _isDiagnosing = false;
  RootCauseAnalysis? _rootCauseResult;

  final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAllData();
  }

  void _loadAllData() {
    _loadRadar();
    _runSimulation();
    _loadActionPlans();
  }

  Future<void> _loadRadar() async {
    setState(() => _isLoadingRadar = true);
    try {
      final items = await _decisionService.getRadarItems();
      if (!mounted) return;
      setState(() {
        _radarItems = items;
        _isLoadingRadar = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoadingRadar = false);
    }
  }

  Future<void> _runSimulation() async {
    setState(() => _isSimulating = true);
    try {
      final result = await _decisionService.runSimulation(
        priceChangePercent: _priceChange,
        discountPercent: _discountChange,
        adSpendChangePercent: _adSpendChange,
      );
      if (!mounted) return;
      setState(() {
        _simulationResult = result;
        _isSimulating = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isSimulating = false);
    }
  }

  Future<void> _loadActionPlans() async {
    setState(() => _isLoadingPlans = true);
    try {
      final plans = await _decisionService.getActionPlans();
      if (!mounted) return;
      setState(() {
        _actionPlans = plans;
        _isLoadingPlans = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoadingPlans = false);
    }
  }

  Future<void> _runRootCause() async {
    final query = _rootCauseController.text.trim();
    if (query.isEmpty) return;

    setState(() => _isDiagnosing = true);
    try {
      final result = await _decisionService.getRootCause(event: query);
      if (!mounted) return;
      setState(() {
        _rootCauseResult = result;
        _isDiagnosing = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isDiagnosing = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _rootCauseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.shield_outlined, color: Color(0xFF4F46E5), size: 22),
            SizedBox(width: 8),
            Text('Decision Hub', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFF4F46E5),
          unselectedLabelColor: isDark ? Colors.grey[400] : Colors.grey[600],
          indicatorColor: const Color(0xFF4F46E5),
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.radar, size: 18), text: 'Radar'),
            Tab(icon: Icon(Icons.tune, size: 18), text: 'What-If'),
            Tab(icon: Icon(Icons.psychology, size: 18), text: 'Root Cause'),
            Tab(icon: Icon(Icons.checklist, size: 18), text: 'Action Plan'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. Radar View
          _buildRadarView(isDark, theme),

          // 2. What-If Simulator View
          _buildSimulatorView(isDark, theme),

          // 3. Root Cause View
          _buildRootCauseView(isDark, theme),

          // 4. Action Plans View
          _buildActionPlansView(isDark, theme),
        ],
      ),
    );
  }

  // TAB 1: RADAR
  Widget _buildRadarView(bool isDark, ThemeData theme) {
    if (_isLoadingRadar) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_radarItems.isEmpty) {
      return EmptyStateView(
        icon: Icons.radar,
        title: 'Business Radar Clear',
        description: 'No critical risks or opportunities detected right now.',
        actionLabel: 'Refresh Signals',
        onAction: _loadRadar,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRadar,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _radarItems.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = _radarItems[index];
          final isRisk = item.type.toLowerCase() == 'risk';
          final badgeColor = isRisk ? const Color(0xFFEF4444) : const Color(0xFF10B981);

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: badgeColor.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isRisk ? 'RISK' : 'OPPORTUNITY',
                        style: TextStyle(
                          color: badgeColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Urgency: ${item.urgency.toUpperCase()}',
                        style: TextStyle(fontSize: 10, color: isDark ? Colors.grey[300] : Colors.grey[700]),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.psychology, size: 18, color: Color(0xFF8B5CF6)),
                      tooltip: 'Ask Why',
                      onPressed: () => AskWhyModal.show(context, query: item.title),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  item.title,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  item.description,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.grey[300] : Colors.grey[700],
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.lightbulb_outline, size: 16, color: Color(0xFF4F46E5)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Suggested Action: ${item.suggestedAction}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF4F46E5)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // TAB 2: WHAT-IF SIMULATOR
  Widget _buildSimulatorView(bool isDark, ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Control Sliders Card
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
                Text(
                  'Simulation Levers',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // Price Change Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Price Adjustment', style: TextStyle(fontWeight: FontWeight.w500)),
                    Text(
                      '${_priceChange >= 0 ? '+' : ''}${_priceChange.toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _priceChange >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _priceChange,
                  min: -30,
                  max: 30,
                  divisions: 12,
                  activeColor: const Color(0xFF4F46E5),
                  onChanged: (val) {
                    setState(() => _priceChange = val);
                    _runSimulation();
                  },
                ),
                const SizedBox(height: 12),

                // Discount Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Promotional Discount', style: TextStyle(fontWeight: FontWeight.w500)),
                    Text('${_discountChange.toStringAsFixed(0)}%', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                Slider(
                  value: _discountChange,
                  min: 0,
                  max: 50,
                  divisions: 10,
                  activeColor: const Color(0xFFF59E0B),
                  onChanged: (val) {
                    setState(() => _discountChange = val);
                    _runSimulation();
                  },
                ),
                const SizedBox(height: 12),

                // Ad Spend Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Ad Spend / Marketing', style: TextStyle(fontWeight: FontWeight.w500)),
                    Text(
                      '${_adSpendChange >= 0 ? '+' : ''}${_adSpendChange.toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _adSpendChange >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _adSpendChange,
                  min: -50,
                  max: 50,
                  divisions: 10,
                  activeColor: const Color(0xFF06B6D4),
                  onChanged: (val) {
                    setState(() => _adSpendChange = val);
                    _runSimulation();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Simulation Results Card
          if (_isSimulating)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_simulationResult != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                      : [const Color(0xFFEEF2FF), Colors.white],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF4F46E5).withOpacity(0.3)),
              ],
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.insights, color: Color(0xFF4F46E5), size: 20),
                      SizedBox(width: 8),
                      Text('Projected Impact', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _SimMetricBox(
                          label: 'Simulated Revenue',
                          value: currencyFormat.format(_simulationResult!.simulatedRevenue),
                          delta: _simulationResult!.revenueDelta,
                          isDark: isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SimMetricBox(
                          label: 'Simulated Profit',
                          value: currencyFormat.format(_simulationResult!.simulatedProfit),
                          delta: _simulationResult!.profitDelta,
                          isDark: isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Strategic AI Synthesis',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _simulationResult!.summary,
                    style: const TextStyle(fontSize: 13, height: 1.45),
                  ),
                  if (_simulationResult!.insights.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ..._simulationResult!.insights.map(
                      (insight) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFF10B981)),
                            const SizedBox(width: 6),
                            Expanded(child: Text(insight, style: const TextStyle(fontSize: 12))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // TAB 3: ROOT CAUSE
  Widget _buildRootCauseView(bool isDark, ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
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
                Text(
                  'Diagnostic Query',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  'Input any business anomaly, KPI shift, or question to isolate root causes.',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _rootCauseController,
                  decoration: InputDecoration(
                    hintText: 'e.g. Sales dip in North region',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: _runRootCause,
                    ),
                  ),
                  onSubmitted: (_) => _runRootCause(),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _isDiagnosing ? null : _runRootCause,
                  icon: const Icon(Icons.psychology, size: 18),
                  label: _isDiagnosing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Run Root Cause Diagnostic'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (_rootCauseResult != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
              ],
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.verified, color: Color(0xFF8B5CF6), size: 20),
                      SizedBox(width: 8),
                      Text('Diagnostic Result', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _DiagnosisCard(
                    title: 'Primary Driver',
                    content: _rootCauseResult!.primaryCause,
                    icon: Icons.lightbulb,
                    color: const Color(0xFF4F46E5),
                  ),
                  const SizedBox(height: 12),
                  if (_rootCauseResult!.contributingFactors.isNotEmpty) ...[
                    Text('Contributing Factors', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    ..._rootCauseResult!.contributingFactors.map(
                      (f) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.arrow_right, size: 16, color: Color(0xFF8B5CF6)),
                            const SizedBox(width: 4),
                            Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  _DiagnosisCard(
                    title: 'Strategic Recommendation',
                    content: _rootCauseResult!.recommendation,
                    icon: Icons.rocket_launch,
                    color: const Color(0xFF10B981),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // TAB 4: ACTION PLANS
  Widget _buildActionPlansView(bool isDark, ThemeData theme) {
    if (_isLoadingPlans) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_actionPlans.isEmpty) {
      return EmptyStateView(
        icon: Icons.checklist,
        title: 'No Action Plans',
        description: 'All strategic action items have been addressed or none created.',
        actionLabel: 'Refresh Plans',
        onAction: _loadActionPlans,
      );
    }

    return RefreshIndicator(
      onRefresh: _loadActionPlans,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _actionPlans.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final plan = _actionPlans[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF4F46E5).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        plan.category.toUpperCase(),
                        style: const TextStyle(
                          color: Color(0xFF4F46E5),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.schedule, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(plan.timeline, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  plan.title,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  'Expected Outcome: ${plan.expectedOutcome}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF10B981)),
                ),
                if (plan.steps.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 8),
                  Text('Action Steps', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[400])),
                  const SizedBox(height: 6),
                  ...plan.steps.map(
                    (step) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_box_outline_blank, size: 16, color: Color(0xFF4F46E5)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(step, style: const TextStyle(fontSize: 13))),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SimMetricBox extends StatelessWidget {
  final String label;
  final String value;
  final double delta;
  final bool isDark;

  const _SimMetricBox({
    required this.label,
    required this.value,
    required this.delta,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final isPos = delta >= 0;
    final color = isPos ? const Color(0xFF10B981) : Colors.redAccent;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(isPos ? Icons.trending_up : Icons.trending_down, size: 14, color: color),
              const SizedBox(width: 4),
              Text(
                '${isPos ? '+' : ''}${delta.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DiagnosisCard extends StatelessWidget {
  final String title;
  final String content;
  final IconData icon;
  final Color color;

  const _DiagnosisCard({
    required this.title,
    required this.content,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: color)),
            ],
          ),
          const SizedBox(height: 6),
          Text(content, style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }
}
