class SalesRecordModel {
  final String id;
  final String productName;
  final String category;
  final int quantity;
  final double unitPrice;
  final double totalAmount;
  final double totalProfit;
  final String date;
  final String city;
  final String customerType;
  final String paymentMethod;

  SalesRecordModel({
    required this.id,
    required this.productName,
    this.category = '',
    this.quantity = 1,
    this.unitPrice = 0.0,
    this.totalAmount = 0.0,
    this.totalProfit = 0.0,
    required this.date,
    this.city = '',
    this.customerType = '',
    this.paymentMethod = '',
  });

  factory SalesRecordModel.fromJson(Map<String, dynamic> json) {
    return SalesRecordModel(
      id: json['_id'] ?? json['id'] ?? '',
      productName: json['productName'] ?? json['Product'] ?? '',
      category: json['category'] ?? json['Category'] ?? '',
      quantity: (json['quantity'] ?? json['Quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] ?? json['Price'] ?? json['UnitPrice'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['totalAmount'] ?? json['TotalAmount'] ?? json['Sales'] as num?)?.toDouble() ?? 0.0,
      totalProfit: (json['totalProfit'] ?? json['TotalProfit'] ?? json['Profit'] as num?)?.toDouble() ?? 0.0,
      date: json['date'] ?? json['Date'] ?? '',
      city: json['city'] ?? json['City'] ?? '',
      customerType: json['customerType'] ?? json['CustomerType'] ?? '',
      paymentMethod: json['paymentMethod'] ?? json['PaymentMethod'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productName': productName,
      'category': category,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalAmount': totalAmount,
      'date': date,
      'city': city,
      'customerType': customerType,
      'paymentMethod': paymentMethod,
    };
  }
}
