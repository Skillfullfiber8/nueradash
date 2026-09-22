import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/dashboard_summary_model.dart';

class TopProductsChart extends StatelessWidget {
  final List<TopProductItem> products;
  final Function(String productName)? onAskWhy;

  const TopProductsChart({
    super.key,
    required this.products,
    this.onAskWhy,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 0);

    if (products.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        alignment: Alignment.center,
        child: Text(
          'No product data available',
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
        ),
      );
    }

    final maxRevenue = products.fold<double>(0, (prev, elem) => elem.totalRevenue > prev ? elem.totalRevenue : prev);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Top Performing Products',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: products.take(5).length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final p = products[index];
            final ratio = maxRevenue > 0 ? (p.totalRevenue / maxRevenue) : 0.0;

            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          p.name,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        currencyFormat.format(p.totalRevenue),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF4F46E5),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ratio,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4F46E5)),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${p.totalQuantity} units sold',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                        ),
                      ),
                      if (onAskWhy != null)
                        InkWell(
                          onTap: () => onAskWhy!(p.name),
                          child: const Row(
                            children: [
                              Icon(Icons.auto_awesome, size: 12, color: Color(0xFF8B5CF6)),
                              SizedBox(width: 4),
                              Text(
                                'Ask Why',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF8B5CF6),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
