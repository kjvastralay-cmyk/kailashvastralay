async function loadProfitReport(type = "today") {
  const supabase = window.supabaseClient;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  let startDate, endDate;

  if (type === "today") {
    startDate = endDate = `${yyyy}-${mm}-${dd}`;
  }
  if (type === "month") {
    startDate = `${yyyy}-${mm}-01`;
    endDate = `${yyyy}-${mm}-31`;
  }
  if (type === "year") {
    startDate = `${yyyy}-01-01`;
    endDate = `${yyyy}-12-31`;
  }

  // Join bill_items + products
  const { data, error } = await supabase
    .from("bill_items")
    .select("qty, rate, products(cost_price), bills(bill_date)")
    .gte("bills.bill_date", startDate)
    .lte("bills.bill_date", endDate);

  if (error) {
    console.error(error);
    alert("❌ Profit load failed");
    return;
  }

  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;

  data.forEach(item => {
    const qty = item.qty;
    const sell = item.rate;
    const cost = item.products.cost_price || 0;

    totalSales += sell * qty;
    totalCost += cost * qty;
  });

  totalProfit = totalSales - totalCost;

  document.getElementById("reportOutput").innerHTML = `
    <h4>Profit Report (${type.toUpperCase()})</h4>
    <p>Total Sales: ₹${totalSales.toFixed(2)}</p>
    <p>Total Cost: ₹${totalCost.toFixed(2)}</p>
    <h3>Net Profit: ₹${totalProfit.toFixed(2)}</h3>
  `;
}
