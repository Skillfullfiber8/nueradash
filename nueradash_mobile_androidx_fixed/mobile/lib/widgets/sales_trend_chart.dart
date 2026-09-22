import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../models/dashboard_summary_model.dart';

class SalesTrendChart extends StatelessWidget {
  final List<SalesTrendPoint> dataPoints;
  final List<SalesPredictionPoint> predictionPoints;

  const SalesTrendChart({
    super.key,
    required this.dataPoints,
    this.predictionPoints = const [],
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (dataPoints.isEmpty) {
      return Container(
        height: 220,
        alignment: Alignment.center,
        child: Text(
          'No trend data available yet',
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
        ),
      );
    }

    final currencyFormat = NumberFormat.compactCurrency(symbol: '\$');

    // Create FlSpots for actual sales and profits
    final salesSpots = <FlSpot>[];
    final profitSpots = <FlSpot>[];

    for (int i = 0; i < dataPoints.length; i++) {
      salesSpots.add(FlSpot(i.toDouble(), dataPoints[i].sales));
      profitSpots.add(FlSpot(i.toDouble(), dataPoints[i].profit));
    }

    // Prediction spots starting from last point
    final predictionSpots = <FlSpot>[];
    if (predictionPoints.isNotEmpty && salesSpots.isNotEmpty) {
      final lastIdx = (dataPoints.length - 1).toDouble();
      predictionSpots.add(FlSpot(lastIdx, dataPoints.last.sales));
      for (int i = 0; i < predictionPoints.length; i++) {
        predictionSpots.add(FlSpot(lastIdx + 1 + i, predictionPoints[i].predictedSales));
      }
    }

    double maxY = 0;
    for (var s in salesSpots) {
      if (s.y > maxY) maxY = s.y;
    }
    for (var s in profitSpots) {
      if (s.y > maxY) maxY = s.y;
    }
    for (var s in predictionSpots) {
      if (s.y > maxY) maxY = s.y;
    }
    if (maxY == 0) maxY = 100;
    maxY = maxY * 1.15; // padding

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Sales & Profit Dynamics',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                _LegendItem(color: const Color(0xFF4F46E5), label: 'Sales'),
                const SizedBox(width: 12),
                _LegendItem(color: const Color(0xFF10B981), label: 'Profit'),
                if (predictionSpots.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  _LegendItem(color: const Color(0xFFF59E0B), label: 'Forecast', isDashed: true),
                ],
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: maxY > 0 ? (maxY / 4) : 1,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                  strokeWidth: 1,
                ),
              ),
              titlesData: FlTitlesData(
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 45,
                    interval: maxY > 0 ? (maxY / 4) : 1,
                    getTitlesWidget: (value, meta) {
                      return Text(
                        currencyFormat.format(value),
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                        ),
                      );
                    },
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 24,
                    interval: (dataPoints.length / 5).clamp(1.0, 10.0),
                    getTitlesWidget: (value, meta) {
                      final idx = value.toInt();
                      if (idx >= 0 && idx < dataPoints.length) {
                        final rawDate = dataPoints[idx].date;
                        final parts = rawDate.split('-');
                        final label = parts.length >= 2 ? '${parts[parts.length - 2]}/${parts.last}' : rawDate;
                        return Text(
                          label,
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.grey[400] : Colors.grey[600],
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              minX: 0,
              maxX: (dataPoints.length + predictionPoints.length - 1).toDouble().clamp(0.0, 100.0),
              minY: 0,
              maxY: maxY,
              lineBarsData: [
                // Sales Line
                LineChartBarData(
                  spots: salesSpots,
                  isCurved: true,
                  color: const Color(0xFF4F46E5),
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF4F46E5).withOpacity(0.25),
                        const Color(0xFF4F46E5).withOpacity(0.0),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                // Profit Line
                LineChartBarData(
                  spots: profitSpots,
                  isCurved: true,
                  color: const Color(0xFF10B981),
                  barWidth: 2.5,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                ),
                // Prediction Line
                if (predictionSpots.isNotEmpty)
                  LineChartBarData(
                    spots: predictionSpots,
                    isCurved: true,
                    color: const Color(0xFFF59E0B),
                    barWidth: 2.5,
                    dashArray: [6, 4],
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final bool isDashed;

  const _LegendItem({required this.color, required this.label, this.isDashed = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: isDashed ? 3 : 8,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
