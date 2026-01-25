/************************************************
 * BILLS.JS – PROFESSIONAL BILL MANAGEMENT
 ************************************************/

/* ================= FILTER UI TOGGLE ================= */

function toggleBillFilters() {
  const type = document.getElementById("billFilterType").value;

  document.getElementById("billFilterDate").hidden = true;
  document.getElementById("billFilterMonth").hidden = true;
  document.getElementById("billFilterYear").hidden = true;

  if (type === "date") document.getElementById("billFilterDate").hidden = false;
  if (type === "month") {
    document.getElementById("billFilterMonth").hidden = false;
    document.getElementById("billFilterYear").hidden = false;
  }
  if (type === "year") document.getElementById("billFilterYear").hidden = false;
}

/* ================= LOAD BILLS ================= */

async function loadBills() {
  const supabase = window.supabaseClient;

  let query = supabase.from("bills").select("*").order("bill_date", { ascending: false });

  const filterType = document.getElementById("billFilterType").value;
  const searchText = document.getElementById("billSearch").value.toLowerCase();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // ===== FILTER LOGIC =====
  if (filterType === "today") {
    query = query.eq("bill_date", todayStr);
  }

  if (filterType === "date") {
    const date = document.getElementById("billFilterDate").value;
    if (date) query = query.eq("bill_date", date);
  }

  if (filterType === "month") {
    const month = document.getElementById("billFilterMonth").value;
    const year = document.getElementById("billFilterYear").value;
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      query = query.gte("bill_date", start).lte("bill_date", end);
    }
  }

  if (filterType === "year") {
    const year = document.getElementById("billFilterYear").value;
    if (year) {
      query = query.gte("bill_date", `${year}-01-01`)
                   .lte("bill_date", `${year}-12-31`);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Bills load error:", error);
    alert("❌ Failed to load bills");
    return;
  }

  const tbody = document.getElementById("billListBody");
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No bills found</td></tr>`;
    return;
  }

  // ===== SEARCH FILTER =====
  const filtered = data.filter(bill => {
    const text = `
      ${bill.invoice_no}
      ${bill.customer_name || ""}
      ${bill.customer_phone || ""}
      ${bill.bill_date}
    `.toLowerCase();

    return text.includes(searchText);
  });

  filtered.forEach((bill, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${bill.invoice_no}</td>
        <td>${bill.bill_date}</td>
        <td>${bill.customer_name || "-"}</td>
        <td>${bill.customer_phone || "-"}</td>
        <td>₹${Number(bill.total_amount).toFixed(2)}</td>
        <td>
          <button onclick="viewBill('${bill.id}')">View</button>
          <button onclick="editBill('${bill.id}')">Edit</button>
          <button onclick="printBill('${bill.id}')">Print</button>
          <button onclick="deleteBill('${bill.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ================= VIEW BILL ================= */

async function viewBill(billId) {
  const supabase = window.supabaseClient;

  const { data: bill } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  const { data: items } = await supabase
    .from("bill_items")
    .select("*, products(name, size)")
    .eq("bill_id", billId);

  if (!bill || !items) {
    alert("❌ Bill not found");
    return;
  }

  // Fill billing UI
  document.getElementById("billInvoiceNo").value = bill.invoice_no;
  document.getElementById("billDate").value = bill.bill_date;
  document.getElementById("billCustomerName").value = bill.customer_name || "";
  document.getElementById("billCustomerPhone").value = bill.customer_phone || "";

  billItems = items.map(it => ({
    id: it.product_id,
    name: it.products?.name || "",
    size: it.products?.size || "",
    price: Number(it.rate),
    qty: it.qty,
    discountPercent: it.discount_percent || 0,
    stock: 0
  }));

  renderBill();
  showSection("billing");
}

/* ================= PRINT BILL ================= */

async function printBill(billId) {
  await viewBill(billId);
  showInvoice();
  window.print();
}

/* ================= DELETE BILL ================= */

async function deleteBill(billId) {
  const supabase = window.supabaseClient;

  if (!confirm("⚠️ Delete this bill? Stock will be restored.")) return;

  // Get items
  const { data: items } = await supabase
    .from("bill_items")
    .select("*")
    .eq("bill_id", billId);

  // Restore stock
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", item.product_id)
      .single();

    await supabase
      .from("products")
      .update({ stock_qty: product.stock_qty + item.qty })
      .eq("id", item.product_id);
  }

  // Delete bill items
  await supabase.from("bill_items").delete().eq("bill_id", billId);

  // Delete bill
  await supabase.from("bills").delete().eq("id", billId);

  alert("✅ Bill deleted & stock restored");
  loadBills();
}

/* ================= EDIT BILL ================= */

async function editBill(billId) {
  currentEditBillId = billId;
  await viewBill(billId);

  alert("✏️ Edit mode enabled. Click UPDATE BILL to save changes.");

  const btn = document.getElementById("saveBillBtn");
  btn.innerText = "Update Bill";
  btn.onclick = updateBill;
}

/* ================= UPDATE BILL ================= */

async function updateBill() {
  const supabase = window.supabaseClient;

  if (!currentEditBillId) {
    alert("❌ No bill selected");
    return;
  }

  // Load old items
  const { data: oldItems } = await supabase
    .from("bill_items")
    .select("*")
    .eq("bill_id", currentEditBillId);

  // Restore old stock
  for (const item of oldItems) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", item.product_id)
      .single();

    await supabase
      .from("products")
      .update({ stock_qty: product.stock_qty + item.qty })
      .eq("id", item.product_id);
  }

  // Delete old items
  await supabase.from("bill_items").delete().eq("bill_id", currentEditBillId);

  // Recalculate totals
  let subTotal = 0;
  let discountTotal = 0;

  billItems.forEach(item => {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    subTotal += base;
    discountTotal += disc;
  });

  const totalAmount = subTotal - discountTotal;

  // Update bill header
  await supabase
    .from("bills")
    .update({
      invoice_no: document.getElementById("billInvoiceNo").value,
      bill_date: document.getElementById("billDate").value,
      customer_name: document.getElementById("billCustomerName").value,
      customer_phone: document.getElementById("billCustomerPhone").value,
      total_amount: totalAmount
    })
    .eq("id", currentEditBillId);

  // Insert new items + reduce stock
  for (const item of billItems) {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    const final = base - disc;

    await supabase.from("bill_items").insert({
      bill_id: currentEditBillId,
      product_id: item.id,
      qty: item.qty,
      rate: item.price,
      discount_percent: item.discountPercent,
      subtotal: final
    });

    const { data: product } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", item.id)
      .single();

    await supabase
      .from("products")
      .update({ stock_qty: product.stock_qty - item.qty })
      .eq("id", item.id);
  }

  alert("✅ Bill updated successfully");

  // Reset mode
  currentEditBillId = null;
  const btn = document.getElementById("saveBillBtn");
  btn.innerText = "Save Bill";
  btn.onclick = saveBill;

  resetBill();
  loadBills();
}
