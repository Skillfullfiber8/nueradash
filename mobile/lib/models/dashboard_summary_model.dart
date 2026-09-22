class DashboardSummary {
  final double totalRevenue;
  final double totalProfit;
  final int totalSales;
  final double averageOrderValue;
  final int totalUnits;
  final double profitMargin;

  DashboardSummary({
    required this.totalRevenue,
    required this.totalProfit,
    required this.totalSales,
    required this.averageOrderValue,
    required this.totalUnits,
    required this.profitMargin,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      totalProfit: (json['totalProfit'] as num?)?.toDouble() ?? 0.0,
      totalSales: (json['totalSales'] as num?)?.toInt() ?? 0,
      averageOrderValue: (json['averageOrderValue'] as num?)?.toDouble() ?? 0.0,
      totalUnits: (json['totalUnits'] as num?)?.toInt() ?? 0,
      profitMargin: (json['profitMargin'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class SalesTrendPoint {
  final String date;
  final double sales;
  final double profit;

  SalesTrendPoint({
    required this.date,
    required this.sales,
    required this.profit,
  });

  factory SalesTrendPoint.fromJson(Map<String, dynamic> json) {
    return SalesTrendPoint(
      date: json['date'] ?? json['_id'] ?? '',
      sales: (json['sales'] ?? json['totalSales'] as num?)?.toDouble() ?? 0.0,
      profit: (json['profit'] ?? json['totalProfit'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class TopProductItem {
  final String name;
  final double totalRevenue;
  final int totalQuantity;

  TopProductItem({
    required this.name,
    required this.totalRevenue,
    required this.totalQuantity,
  });

  factory TopProductItem.fromJson(Map<String, dynamic> json) {
    return TopProductItem(
      name: json['name'] ?? json['_id'] ?? 'Unknown',
      totalRevenue: (json['totalRevenue'] ?? json['revenue'] as num?)?.toDouble() ?? 0.0,
      totalQuantity: (json['totalQuantity'] ?? json['quantity'] as num?)?.toInt() ?? 0,
    );
  }
}

class SalesPredictionPoint {
  final String date;
  final double predictedSales;

  SalesPredictionPoint({
    required this.date,
    required this.predictedSales,
  });

  factory SalesPredictionPoint.fromJson(Map<String, dynamic> json) {
    return SalesPredictionPoint(
      date: json['date'] ?? '',
      predictedSales: (json['predictedSales'] ?? json['sales'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class CategorySalesItem {
  final String category;
  final double totalRevenue;

  CategorySalesItem({required this.category, required this.totalRevenue});

  factory CategorySalesItem.fromJson(Map<String, dynamic> json) {
    return CategorySalesItem(
      category: json['category'] ?? json['_id'] ?? 'Other',
      totalRevenue: (json['totalRevenue'] ?? json['revenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class CitySalesItem {
  final String city;
  final double totalRevenue;

  CitySalesItem({required this.city, required this.totalRevenue});

  factory CitySalesItem.fromJson(Map<String, dynamic> json) {
    return CitySalesItem(
      city: json['city'] ?? json['_id'] ?? 'Other',
      totalRevenue: (json['totalRevenue'] ?? json['revenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
