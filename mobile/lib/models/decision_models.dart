class RadarItem {
  final String id;
  final String type; // 'risk' or 'opportunity'
  final String title;
  final String description;
  final String metric;
  final String impact;
  final String urgency; // 'high', 'medium', 'low'
  final String suggestedAction;

  RadarItem({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.metric,
    required this.impact,
    required this.urgency,
    required this.suggestedAction,
  });

  factory RadarItem.fromJson(Map<String, dynamic> json) {
    return RadarItem(
      id: json['id'] ?? '',
      type: json['type'] ?? 'risk',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      metric: json['metric'] ?? '',
      impact: json['impact'] ?? '',
      urgency: json['urgency'] ?? 'medium',
      suggestedAction: json['suggestedAction'] ?? '',
    );
  }
}

class RootCauseAnalysis {
  final String event;
  final String primaryCause;
  final List<String> contributingFactors;
  final String impactAssessment;
  final String recommendation;

  RootCauseAnalysis({
    required this.event,
    required this.primaryCause,
    required this.contributingFactors,
    required this.impactAssessment,
    required this.recommendation,
  });

  factory RootCauseAnalysis.fromJson(Map<String, dynamic> json) {
    return RootCauseAnalysis(
      event: json['event'] ?? '',
      primaryCause: json['primaryCause'] ?? '',
      contributingFactors: (json['contributingFactors'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      impactAssessment: json['impactAssessment'] ?? '',
      recommendation: json['recommendation'] ?? '',
    );
  }
}

class SimulationResult {
  final double originalRevenue;
  final double simulatedRevenue;
  final double revenueDelta;
  final double originalProfit;
  final double simulatedProfit;
  final double profitDelta;
  final String summary;
  final List<String> insights;

  SimulationResult({
    required this.originalRevenue,
    required this.simulatedRevenue,
    required this.revenueDelta,
    required this.originalProfit,
    required this.simulatedProfit,
    required this.profitDelta,
    required this.summary,
    required this.insights,
  });

  factory SimulationResult.fromJson(Map<String, dynamic> json) {
    return SimulationResult(
      originalRevenue: (json['originalRevenue'] as num?)?.toDouble() ?? 0.0,
      simulatedRevenue: (json['simulatedRevenue'] as num?)?.toDouble() ?? 0.0,
      revenueDelta: (json['revenueDelta'] as num?)?.toDouble() ?? 0.0,
      originalProfit: (json['originalProfit'] as num?)?.toDouble() ?? 0.0,
      simulatedProfit: (json['simulatedProfit'] as num?)?.toDouble() ?? 0.0,
      profitDelta: (json['profitDelta'] as num?)?.toDouble() ?? 0.0,
      summary: json['summary'] ?? '',
      insights: (json['insights'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class ActionPlanItem {
  final String id;
  final String title;
  final String category;
  final String priority;
  final String timeline;
  final String expectedOutcome;
  final List<String> steps;

  ActionPlanItem({
    required this.id,
    required this.title,
    required this.category,
    required this.priority,
    required this.timeline,
    required this.expectedOutcome,
    required this.steps,
  });

  factory ActionPlanItem.fromJson(Map<String, dynamic> json) {
    return ActionPlanItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? 'General',
      priority: json['priority'] ?? 'Medium',
      timeline: json['timeline'] ?? 'Immediate',
      expectedOutcome: json['expectedOutcome'] ?? '',
      steps: (json['steps'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}
