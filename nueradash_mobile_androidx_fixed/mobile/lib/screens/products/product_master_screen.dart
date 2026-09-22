import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/product_service.dart';
import '../../models/product_model.dart';
import '../../widgets/empty_state_view.dart';
import '../../widgets/ask_why_modal.dart';

class ProductMasterScreen extends StatefulWidget {
  const ProductMasterScreen({super.key});

  @override
  State<ProductMasterScreen> createState() => _ProductMasterScreenState();
}

class _ProductMasterScreenState extends State<ProductMasterScreen> {
  final ProductService _productService = ProductService();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  List<ProductModel> _products = [];
  List<ProductModel> _filteredProducts = [];

  final currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredProducts = _products;
      } else {
        _filteredProducts = _products.where((p) {
          return p.name.toLowerCase().contains(query) || p.category.toLowerCase().contains(query);
        }).toList();
      }
    });
  }

  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _productService.getProducts();
      if (!mounted) return;
      setState(() {
        _products = list;
        _filteredProducts = list;
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

  void _showAddEditDialog([ProductModel? product]) {
    final isEditing = product != null;
    final nameCtrl = TextEditingController(text: product?.name ?? '');
    final catCtrl = TextEditingController(text: product?.category ?? '');
    final costCtrl = TextEditingController(text: product != null && product.costPrice > 0 ? product.costPrice.toString() : '');
    final sellCtrl = TextEditingController(text: product != null && product.sellingPrice > 0 ? product.sellingPrice.toString() : '');

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final cost = double.tryParse(costCtrl.text) ?? 0.0;
            final sell = double.tryParse(sellCtrl.text) ?? 0.0;
            final profit = sell - cost;
            final margin = sell > 0 ? (profit / sell) * 100 : 0.0;

            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text(isEditing ? 'Edit Product' : 'Add New Product'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'Product Name', hintText: 'e.g. Wireless Mouse'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: catCtrl,
                      decoration: const InputDecoration(labelText: 'Category', hintText: 'e.g. Electronics'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: costCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Cost Price (\$)'),
                      onChanged: (_) => setDialogState(() {}),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: sellCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Selling Price (\$)'),
                      onChanged: (_) => setDialogState(() {}),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF4F46E5).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Unit Profit', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(
                                currencyFormat.format(profit),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: profit >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Profit Margin', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(
                                '${margin.toStringAsFixed(1)}%',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: margin >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    Navigator.pop(ctx);

                    try {
                      if (isEditing) {
                        await _productService.updateProduct(
                          product.id,
                          name: nameCtrl.text,
                          category: catCtrl.text,
                          costPrice: cost,
                          sellingPrice: sell,
                        );
                      } else {
                        await _productService.addProduct(
                          name: nameCtrl.text,
                          category: catCtrl.text,
                          costPrice: cost,
                          sellingPrice: sell,
                        );
                      }
                      _loadProducts();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error saving product: $e')),
                      );
                    }
                  },
                  child: Text(isEditing ? 'Save Changes' : 'Create Product'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _deleteProduct(ProductModel product) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Product'),
        content: Text('Are you sure you want to delete "${product.name}"?'),
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
        await _productService.deleteProduct(product.id);
        _loadProducts();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete product: $e')),
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
            Icon(Icons.inventory_2_outlined, color: Color(0xFF4F46E5), size: 22),
            SizedBox(width: 8),
            Text('Product Master', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditDialog(),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Product', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search products by name or category...',
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

          // Product List
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
                            ElevatedButton(onPressed: _loadProducts, child: const Text('Retry')),
                          ],
                        ),
                      )
                    : _filteredProducts.isEmpty
                        ? EmptyStateView(
                            icon: Icons.inventory_2_outlined,
                            title: 'No Products Found',
                            description: _searchController.text.isNotEmpty
                                ? 'No products match your search query.'
                                : 'Start by creating your first product or importing sales data.',
                            actionLabel: 'Add Product',
                            onAction: () => _showAddEditDialog(),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadProducts,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredProducts.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final p = _filteredProducts[index];
                                return _ProductCard(
                                  product: p,
                                  isDark: isDark,
                                  onEdit: () => _showAddEditDialog(p),
                                  onDelete: () => _deleteProduct(p),
                                  onAskWhy: () => AskWhyModal.show(context, query: p.name, isProduct: true),
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

class _ProductCard extends StatelessWidget {
  final ProductModel product;
  final bool isDark;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onAskWhy;

  const _ProductCard({
    required this.product,
    required this.isDark,
    required this.onEdit,
    required this.onDelete,
    required this.onAskWhy,
  });

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    final marginColor = product.margin >= 30
        ? const Color(0xFF10B981)
        : (product.margin >= 15 ? const Color(0xFFF59E0B) : Colors.redAccent);

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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (product.category.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        product.category,
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20),
                onSelected: (val) {
                  if (val == 'edit') onEdit();
                  if (val == 'delete') onDelete();
                  if (val == 'ask_why') onAskWhy();
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'ask_why',
                    child: Row(
                      children: [
                        Icon(Icons.auto_awesome, size: 16, color: Color(0xFF8B5CF6)),
                        SizedBox(width: 8),
                        Text('Ask Why (AI)'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 16),
                        SizedBox(width: 8),
                        Text('Edit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.redAccent)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Price & Margin Grid
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatColumn(label: 'Cost', value: currency.format(product.costPrice)),
                _StatColumn(label: 'Price', value: currency.format(product.sellingPrice)),
                _StatColumn(
                  label: 'Margin',
                  value: '${product.margin.toStringAsFixed(1)}%',
                  valueColor: marginColor,
                ),
                _StatColumn(label: 'Units Sold', value: '${product.totalUnitsSold}'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _StatColumn({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
