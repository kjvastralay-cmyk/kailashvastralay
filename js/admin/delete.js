/************************************************
 * ADMIN DELETE SYSTEM – PROFESSIONAL LOGIC
 ************************************************/

console.log("✅ admin/delete.js loaded");

/* ================= DELETE BILLS BY DATE ================= */

async function deleteBillsByDate() {
  const sb = window.supabaseClient;

  const date = prompt("Enter date (YYYY-MM-DD):");

  if (!date) return;

  if (!confirm(`⚠️ Delete ALL bills of ${date}? Stock will NOT be restored.`)) return;

  const { data: bills } = await sb
    .from("bills")
    .select("id")
    .eq("bill_date", date);

  if (!bills || bills.length === 0) {
    alert("❌ No bills found");
    return;
  }

  for (const bill of bills) {
    await sb.from("bill_items").delete().eq("bill_id", bill.id);
  }

  await sb.from("bills").delete().eq("bill_date", date);

  alert(`✅ Deleted ${bills.length} bills of ${date}`);
  loadBills();
}

/* ================= DELETE BILLS BY MONTH ================= */

async function deleteBillsByMonth() {
  const sb = window.supabaseClient;

  const year = prompt("Enter year (YYYY):", new Date().getFullYear());
  const month = prompt("Enter month (1-12):");

  if (!year || !month) return;

  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const end = `${year}-${mm}-31`;

  if (!confirm(`⚠️ Delete ALL bills of ${year}-${mm}? Stock will NOT be restored.`)) return;

  const { data: bills } = await sb
    .from("bills")
    .select("id")
    .gte("bill_date", start)
    .lte("bill_date", end);

  if (!bills || bills.length === 0) {
    alert("❌ No bills found");
    return;
  }

  for (const bill of bills) {
    await sb.from("bill_items").delete().eq("bill_id", bill.id);
  }

  await sb
    .from("bills")
    .delete()
    .gte("bill_date", start)
    .lte("bill_date", end);

  alert(`✅ Deleted ${bills.length} bills of ${year}-${mm}`);
  loadBills();
}

/* ================= DELETE BILLS BY YEAR ================= */

async function deleteBillsByYear() {
  const sb = window.supabaseClient;

  const year = prompt("Enter year (YYYY):", new Date().getFullYear());

  if (!year) return;

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  if (!confirm(`⚠️ Delete ALL bills of ${year}? Stock will NOT be restored.`)) return;

  const { data: bills } = await sb
    .from("bills")
    .select("id")
    .gte("bill_date", start)
    .lte("bill_date", end);

  if (!bills || bills.length === 0) {
    alert("❌ No bills found");
    return;
  }

  for (const bill of bills) {
    await sb.from("bill_items").delete().eq("bill_id", bill.id);
  }

  await sb
    .from("bills")
    .delete()
    .gte("bill_date", start)
    .lte("bill_date", end);

  alert(`✅ Deleted ${bills.length} bills of ${year}`);
  loadBills();
}

/* ================= AUTO DELETE ZERO STOCK (AFTER 3 MONTHS) ================= */

async function cleanupZeroStock() {
  const sb = window.supabaseClient;

  if (!confirm("⚠️ Delete products with ZERO stock older than 3 months?")) return;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const dateStr = threeMonthsAgo.toISOString().split("T")[0];

  const { data: products } = await sb
    .from("products")
    .select("id, name")
    .eq("stock_qty", 0)
    .lte("created_at", dateStr);

  if (!products || products.length === 0) {
    alert("✅ No zero-stock products found");
    return;
  }

  for (const p of products) {
    await sb.from("products").delete().eq("id", p.id);
  }

  alert(`✅ Deleted ${products.length} zero-stock products`);
  loadStock();
}
