/************************************************
 * DASHBOARD.JS – REAL SUPABASE DATA
 ************************************************/

async function loadDashboard() {
  const sb = window.supabaseClient;

  /* ================= TOTAL PRODUCTS ================= */
  const { count: productCount } = await sb
    .from("products")
    .select("*", { count: "exact", head: true });

  document.getElementById("dashProducts").innerText = productCount || 0;

  /* ================= TOTAL STOCK ================= */
  const { data: stockData } = await sb
    .from("products")
    .select("stock_qty");

  let totalStock = 0;
  stockData?.forEach(p => totalStock += Number(p.stock_qty || 0));

  document.getElementById("dashStock").innerText = totalStock;

  /* ================= TODAY SALES ================= */
  const today = new Date().toISOString().split("T")[0];

  const { data: salesData } = await sb
    .from("bills")
    .select("total_amount")
    .eq("bill_date", today);

  let todaySales = 0;
  salesData?.forEach(b => todaySales += Number(b.total_amount || 0));

  document.getElementById("dashTodaySales").innerText = todaySales.toFixed(2);

  /* ================= STOCK VALUE (CP × QTY) ================= */
  const { data: valueData } = await sb
    .from("products")
    .select("stock_qty, cost_price");

  let stockValue = 0;
  valueData?.forEach(p => {
    stockValue += Number(p.stock_qty || 0) * Number(p.cost_price || 0);
  });

  document.getElementById("dashStockValue").innerText = stockValue.toFixed(2);
}
