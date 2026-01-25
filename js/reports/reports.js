/************************************************
 * REPORTS.JS – PROFESSIONAL SALES & PROFIT SYSTEM
 ************************************************/

// ✅ IST Date Fix (India Time)
function getTodayDate() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split("T")[0];
}

/* ================= TOGGLE REPORT INPUTS ================= */

function toggleReportInputs() {
  const type = document.getElementById("reportType").value;

  document.getElementById("reportDate").style.display = "none";
  document.getElementById("reportMonth").style.display = "none";
  document.getElementById("reportYear").style.display = "none";
  document.getElementById("reportFrom").style.display = "none";
  document.getElementById("reportTo").style.display = "none";

  if (type === "daily") {
    document.getElementById("reportDate").style.display = "inline-block";
  }

  if (type === "monthly") {
    document.getElementById("reportMonth").style.display = "inline-block";
    document.getElementById("reportYear").style.display = "inline-block";
  }

  if (type === "yearly") {
    document.getElementById("reportYear").style.display = "inline-block";
  }

  if (type === "range") {
    document.getElementById("reportFrom").style.display = "inline-block";
    document.getElementById("reportTo").style.display = "inline-block";
  }
}

/* ================= GENERATE REPORT ================= */

async function generateReport() {
  const supabase = window.supabaseClient;

  let fromDate, toDate;
  const type = document.getElementById("reportType").value;

  const today = getTodayDate();

  // ✅ DAILY REPORT
  if (type === "daily") {
    fromDate = toDate = document.getElementById("reportDate").value || today;
  }

  // ✅ MONTHLY REPORT (correct last day of month)
  if (type === "monthly") {
    const m = document.getElementById("reportMonth").value;
    const y = document.getElementById("reportYear").value;

    if (!m || !y) {
      alert("❌ Select month and year");
      return;
    }

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0); // last day of month

    fromDate = start.toLocaleDateString("en-CA");
    toDate = end.toLocaleDateString("en-CA");
  }

  // ✅ YEARLY REPORT
  if (type === "yearly") {
    const y = document.getElementById("reportYear").value;

    if (!y) {
      alert("❌ Enter year");
      return;
    }

    fromDate = `${y}-01-01`;
    toDate = `${y}-12-31`;
  }

  // ✅ CUSTOM RANGE
  if (type === "range") {
    fromDate = document.getElementById("reportFrom").value;
    toDate = document.getElementById("reportTo").value;

    if (!fromDate || !toDate) {
      alert("❌ Select from & to date");
      return;
    }
  }

  console.log("Report Range:", fromDate, toDate);

  // ✅ SUPABASE QUERY (correct join)
  const { data: items, error } = await supabase
    .from("bill_items")
    .select(`
      qty,
      rate,
      discount_percent,
      products(cost_price),
      bills!inner(bill_date)
    `)
    .gte("bills.bill_date", fromDate)
    .lte("bills.bill_date", toDate);

  if (error) {
    console.error("Report error:", error);
    alert("❌ Failed to load report data");
    return;
  }

  if (!items || items.length === 0) {
    document.getElementById("reportResult").innerHTML = `
      <h3>📊 Sales Report</h3>
      <p>No data found for selected period.</p>
    `;
    return;
  }

  // ✅ CALCULATIONS
  let totalQty = 0;
  let totalSP = 0; // Selling Price
  let totalCP = 0; // Cost Price
  let totalDiscount = 0;

  items.forEach(it => {
    const base = it.qty * it.rate;
    const disc = (base * (it.discount_percent || 0)) / 100;
    const sp = base - disc;
    const cp = it.qty * (it.products?.cost_price || 0);

    totalQty += it.qty;
    totalSP += sp;
    totalCP += cp;
    totalDiscount += disc;
  });

  const profit = totalSP - totalCP;

  // ✅ OUTPUT UI
  document.getElementById("reportResult").innerHTML = `
    <h2>📊 Professional Sales Report</h2>
    <p><b>Period:</b> ${fromDate} to ${toDate}</p>

    <hr>

    <p>🧾 Total Items Sold: <b>${items.length}</b></p>
    <p>📦 Total Quantity Sold: <b>${totalQty}</b></p>

    <hr>

    <p>💰 Total Selling Price (SP): <b>₹${totalSP.toFixed(2)}</b></p>
    <p>💸 Total Cost Price (CP): <b>₹${totalCP.toFixed(2)}</b></p>
    <p>🏷️ Total Discount: <b>₹${totalDiscount.toFixed(2)}</b></p>

    <hr>

    <h2 style="color:green;">📈 Net Profit: ₹${profit.toFixed(2)}</h2>
  `;
}
