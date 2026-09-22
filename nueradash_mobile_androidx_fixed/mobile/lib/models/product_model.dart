class ProductModel {
  final String id;
  final String name;
  final String category;
  final double costPrice;
  final double sellingPrice;
  final double margin;
  final int totalUnitsSold;
  final double totalRevenue;
  final double totalProfit;

  ProductModel({
    required this.id,
    required this.name,
    this.category = '',
    this.costPrice = 0.0,
    this.sellingPrice = 0.0,
    this.margin = 0.0,
    this.totalUnitsSold = 0,
    this.totalRevenue = 0.0,
    this.totalProfit = 0.0,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      costPrice: (json['costPrice'] as num?)?.toDouble() ?? 0.0,
      sellingPrice: (json['sellingPrice'] as num?)?.toDouble() ?? 0.0,
      margin: (json['margin'] as num?)?.toDouble() ?? 0.0,
      totalUnitsSold: (json['totalUnitsSold'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      totalProfit: (json['totalProfit'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'category': category,
      'costPrice': costPrice,
      'sellingPrice': sellingPrice,
    };
  }
}
