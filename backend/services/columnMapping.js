export const standardHeaders = {
  sale_id: ["sale id", "sid", "saleid", "transaction id"],
  customer_id: ["customer id", "cid", "cust id"],
  customer_name: ["customer name", "name", "cust name"],
  customer_region: ["region", "customer region", "state", "area"],
  product_id: ["product id", "pid", "prod id", "item id"],
  product_name: ["product name", "item", "item name"],
  quantity: ["quantity", "qty", "units sold"],
  selling_price: ["selling price", "price", "sp", "amount"],
  date: ["date", "sale date", "timestamp"],
  location: ["location", "city", "branch", "store"],
};

export function detectColumn(userHeader) {
  userHeader = userHeader.toLowerCase().trim();

  for (let key in standardHeaders) {
    const variations = standardHeaders[key];
    if (variations.some(v => userHeader.includes(v))) {
      return key;
    }
  }

  return null;
}
