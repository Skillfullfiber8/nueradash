import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/sales_service.dart';
import '../../models/sales_record_model.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/ask_why_modal.dart';

class SalesRecordsScreen extends StatefulWidget {
  const SalesRecordsScreen({super.key});

  @override
  State<SalesRecordsScreen> createState() => _SalesRecordsScreenState();
}

class _SalesRecordsScreenState extends State<SalesRecordsScreen> {
  final SalesService _salesService = SalesService();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  List<SalesRecordModel> _records = [];
  List<SalesRecordModel> _filteredRecords = [];

  final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _loadSalesRecords();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredRecords = _records;
      } else {
        _filteredRecords = _records.where((r) {
          return r.productName.toLowerCase().contains(query) ||
              r.category.toLowerCase().contains(query) ||
              r.city.toLowerCase().contains(query) ||
              r.customerType.toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  Future<void> _loadSalesRecords() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _salesService.getSalesRecords();
      if (!mounted) return;
      setState(() {
        _records = list;
        _filteredRecords = list;
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

  Future<void> _deleteRecord(SalesRecordModel record) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Sales Record'),
        content: Text('Are you sure you want to delete this sale for "${record.productName}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _salesService.deleteSalesRecord(record.id);
        _loadSalesRecords();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete sale: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
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
            Icon(Icons.receipt_long_outlined, color: Color(0xFF4F46E5), size: 22),
            SizedBox(width: 8),
            Text('Sales History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search Filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by product, city, or category...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => _searchController.clear(),
                      )
                    : null,
                isDense: true,
                filled: true,
                fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Total Count Summary Banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Showing ${_filteredRecords.length} transactions',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),

          // Sales List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, color: Colors.redAccent, size: 36),
                            const SizedBox(height: 8),
                            Text(_errorMessage!),
                            const SizedBox(height: 12),
                            ElevatedButton(onPressed: _loadSalesRecords, child: const Text('Retry')),
                          ],
                        ),
                      )
                    : _filteredRecords.isEmpty
                        ? EmptyStateView(
                            icon: Icons.receipt_long_outlined,
                            title: 'No Sales Recorded',
                            description: 'Upload a CSV dataset to import your sales ledger.',
                          )
                        : RefreshIndicator(
                            onRefresh: _loadSalesRecords,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredRecords.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final r = _filteredRecords[index];
                                return _SalesRecordCard(
                                  record: r,
                                  isDark: isDark,
                                  onDelete: () => _deleteRecord(r),
                                  onAskWhy: () => AskWhyModal.show(context, query: r.productName, isProduct: true),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _SalesRecordCard extends StatelessWidget {
  final SalesRecordModel record;
  final bool isDark;
  final VoidCallback onDelete;
  final VoidCallback onAskWhy;

  const _SalesRecordCard({
    required this.record,
    required this.isDark,
    required this.onDelete,
    required this.onAskWhy,
  });

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  record.productName,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                currency.format(record.totalAmount),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Color(0xFF4F46E5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${record.quantity}x @ ${currency.format(record.unitPrice)}',
                style: TextStyle(fontSize: 12, color: isDark ? Colors.grey[400] : Colors.grey[600]),
              ),
              Text(
                'Profit: ${currency.format(record.totalProfit)}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: record.totalProfit >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(
            children: [
              if (record.date.isNotEmpty) ...[
                Icon(Icons.calendar_today, size: 12, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(record.date.split('T').first, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                const SizedBox(width: 12),
              ],
              if (record.city.isNotEmpty) ...[
                Icon(Icons.location_on_outlined, size: 12, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Text(record.city, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
              ],
              const Spacer(),
              InkWell(
                onTap: onAskWhy,
                child: const Row(
                  children: [
                    Icon(Icons.auto_awesome, size: 12, color: Color(0xFF8B5CF6)),
                    SizedBox(width: 2),
                    Text('Why', style: TextStyle(fontSize: 11, color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: onDelete,
                child: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
