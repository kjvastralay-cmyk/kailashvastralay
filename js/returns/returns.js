/************************************************
 * RETURNS.JS – PROFESSIONAL BILL RETURN SYSTEM
 ************************************************/

let returnBillId = null;
let returnItems = [];

/* ================= LOAD BILL ================= */
async function loadBillForReturn() {
  const sb = window.supabaseClient;
  const invoiceNo = document.getElementById("returnInvoice").value.trim();

  if (!invoiceNo) return alert("Enter invoice number");

  const { data: bill } = await sb
    .from("bills")
    .select("*")
    .eq("invoice_no", invoiceNo)
    .maybeSingle();

  if (!bill) return alert("❌ Bill not found");

  returnBillId = bill.id;

  const { data: items } = await sb
    .from("bill_items")
    .select("*, products(name, size, stock_qty)")
    .eq("bill_id", bill.id);

  if (!items || items.length === 0)
    return alert("❌ No items in bill");

  returnItems = items;

  renderReturnTable();
}

/* ================= RENDER RETURN TABLE ================= */
function renderReturnTable() {
  const tbody = document.getElementById("returnTableBody");
  tbody.innerHTML = "";

  returnItems.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.products.name}</td>
        <td>${item.products.size || ""}</td>
        <td>${item.qty}</td>
        <td><input type="number" min="0" max="${item.qty}" value="0" id="retQty_${i}"></td>
      </tr>
    `;
  });
}

/* ================= PROCESS RETURN ================= */
async function processReturn() {
  const sb = window.supabaseClient;

  if (!returnBillId) return alert("Load bill first");

  let anyReturn = false;

  for (let i = 0; i < returnItems.length; i++) {
    const item = returnItems[i];
    const qty = Number(document.getElementById(`retQty_${i}`).value);

    if (!qty || qty <= 0) continue;
    if (qty > item.qty) return alert("❌ Invalid return qty");

    anyReturn = true;

    // ✅ Increase stock
    const newStock = item.products.stock_qty + qty;

    await sb.from("products")
      .update({ stock_qty: newStock })
      .eq("id", item.product_id);

    // ✅ Update bill_items
    const remaining = item.qty - qty;

    if (remaining > 0) {
      await sb.from("bill_items")
        .update({ qty: remaining })
        .eq("id", item.id);
    } else {
      await sb.from("bill_items")
        .delete()
        .eq("id", item.id);
    }

    // ✅ Ledger
    await sb.from("stock_ledger").insert({
      product_id: item.product_id,
      type: "RETURN",
      qty_in: qty,
      reference_table: "bills",
      reference_id: returnBillId
    });
  }

  if (!anyReturn) return alert("❌ Enter return quantity");

  await recalcBillTotal(returnBillId);

  alert("✅ Return processed");

  loadStock();
  loadBillForReturn();
}

/* ================= RECALCULATE BILL ================= */
async function recalcBillTotal(billId) {
  const sb = window.supabaseClient;

  const { data: items } = await sb
    .from("bill_items")
    .select("qty, rate, discount_percent")
    .eq("bill_id", billId);

  if (!items || items.length === 0) {
    await sb.from("bills").delete().eq("id", billId);
    document.getElementById("returnTableBody").innerHTML = "";
    alert("⚠️ Bill deleted (all items returned)");
    return;
  }

  let total = 0;

  items.forEach(i => {
    const base = i.qty * i.rate;
    const disc = (base * (i.discount_percent || 0)) / 100;
    total += base - disc;
  });

  await sb.from("bills")
    .update({ total_amount: total })
    .eq("id", billId);
}
