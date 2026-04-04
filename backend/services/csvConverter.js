import Papa from "papaparse";

export function convertCSV(csvText, productMaster = []) {
  console.log("convertCSV called, productMaster length:", productMaster.length);

  // Parse CSV
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data || [];

  console.log("First row Product ID:", rows[0]?.["Product ID"]);

  // Convert product master array to quick lookup map
  const productMap = {};
  productMaster.forEach((p) => {
    productMap[p.productId] = p;
    console.log("Mapped:", p.productId, "costPrice:", p.costPrice);
  });

  console.log("Lookup result:", productMap[rows[0]?.["Product ID"]]);

  // Standardize rows
  const standardized = rows.map((row, index) => {
    const product = productMap[row["Product ID"]] || {};

    const quantity = Number(row["Quantity"]) || 0;
    const price = Number(row["Price"]) || product.sellingPrice || 0;

    const costPrice = product.costPrice || 0;
    const sellingPrice = product.sellingPrice || price;
    const profitPerUnit = sellingPrice - costPrice;
    const totalProfit = profitPerUnit * quantity;

    return {
      saleId: row["Sale ID"] || `AUTO-${index + 1}`,
      customerName: row["Customer Name"] || "",
      region: row["Region"] || "",
      email: row["Customer Email"] || "",
      phone: row["Customer Phone"] || "",

      productId: row["Product ID"] || "",
      productName: row["Product Name"] || product.productName || "",
      category: row["Category"] || product.category || "",

      quantity,
      price,
      totalAmount: quantity * price,

      date: row["Date"] ? new Date(row["Date"]) : null,
      location: row["Location"] || "",
      paymentMethod: row["Payment Method"] || "",

      costPrice,
      sellingPrice,
      profitMargin: totalProfit,
    };
  });

  return standardized;
}