/************************************************
 * BILLING.JS – KAILASH VASTRALAY (100% FIXED)
 ************************************************/
let currentEditBillId = null; // null = new bill

let billItems = [];
let isSavingBill = false;

const START_YEAR = 2024;

/* ================= AUTO DATE & INVOICE ================= */
window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("billDate").value =
new Date().toLocaleDateString("en-CA")

  document.getElementById("billInvoiceNo").value =
    await getNextInvoiceNumber();
});

/* ================= INVOICE NUMBER ================= */
async function getNextInvoiceNumber() {
  const sb = window.supabaseClient;
  const currentYear = new Date().getFullYear();
  const yearIndex = currentYear - START_YEAR + 1;

  const { data } = await sb
    .from("bills")
    .select("invoice_no")
    .like("invoice_no", `KV-${yearIndex}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let next = 1;
  if (data?.invoice_no) {
    const last = data.invoice_no.split("-").pop();
    next = parseInt(last) + 1;
  }

  return `KV-${yearIndex}-${String(next).padStart(4, "0")}`;
}

let scanLock = false;

/* ================= ADD ITEM ================= */
async function addItem() {
  if (scanLock) return;   // 🔒 prevent double scan
  scanLock = true;

  setTimeout(() => {
    scanLock = false;     // 🔓 unlock after 300ms
  }, 300);

  const sb = window.supabaseClient;
  const barcode = document.getElementById("barcodeInput").value.trim();

  if (!barcode) return alert("Enter barcode");

  if (billItems.length >= 20)
    return alert("❌ Maximum 20 items allowed");

  const { data: product } = await sb
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();

  if (!product) return alert("❌ Product not found");
  if (product.stock_qty <= 0) return alert("❌ Stock not available");

  const existing = billItems.find(i => i.id === product.id);

  if (existing) {
    if (existing.qty + 1 > product.stock_qty)
      return alert("❌ Stock limit reached");
    existing.qty += 1;   // ✅ always +1
  } else {
    billItems.push({
      id: product.id,
      name: product.name,
      size: product.size || "",
      price: Number(product.selling_price),
      qty: 1,
      discountPercent: 10,
      stock: product.stock_qty
    });
  }


  renderBill();
  document.getElementById("barcodeInput").value = "";
}

/* ================= RENDER BILL ================= */
function renderBill() {
  const tbody = document.querySelector("#billTable tbody");
  tbody.innerHTML = "";

  let grandTotal = 0;

  billItems.forEach((item, i) => {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    const total = base - disc;
    grandTotal += total;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.size}</td>
        <td><input type="number" value="${item.qty}" min="1" onchange="updateQty(${i},this.value)"></td>
        <td><input type="number" value="${item.price}" onchange="updatePrice(${i},this.value)"></td>
        <td><input type="number" value="${item.discountPercent}" onchange="updateDiscount(${i},this.value)"></td>
        <td>₹${total.toFixed(2)}</td>
        <td><button onclick="removeItem(${i})">❌</button></td>
      </tr>
    `;
  });

  document.getElementById("grandTotal").innerText =
    "₹" + grandTotal.toFixed(2);
}

function updateQty(i, v) { billItems[i].qty = Number(v); renderBill(); }
function updatePrice(i, v) { billItems[i].price = Number(v); renderBill(); }
function updateDiscount(i, v) { billItems[i].discountPercent = Number(v); renderBill(); }
function removeItem(i) { billItems.splice(i, 1); renderBill(); }

/* ================= NUMBER TO WORDS ================= */
function numberToWords(num) {
  if (!num || num === 0) return "Zero Rupees Only";

  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + " " + a[n%10];
    if (n < 1000) return a[Math.floor(n/100)] + " Hundred " + inWords(n%100);
    if (n < 100000) return inWords(Math.floor(n/1000)) + " Thousand " + inWords(n%1000);
    if (n < 10000000) return inWords(Math.floor(n/100000)) + " Lakh " + inWords(n%100000);
    return inWords(Math.floor(n/10000000)) + " Crore " + inWords(n%10000000);
  }

  return inWords(Math.floor(num)) + " Rupees Only";
}

/* ================= SHOW INVOICE ================= */
function showInvoice() {
  document.getElementById("invoicePreview").style.display = "block";

  const invoiceNo = document.getElementById("billInvoiceNo").value;
  const date = document.getElementById("billDate").value;
  const custName = document.getElementById("billCustomerName").value;
  const custPhone = document.getElementById("billCustomerPhone").value;

  document.getElementById("invNo").innerText = invoiceNo;
  document.getElementById("invDate").innerText = date;
  document.getElementById("custName").innerText = custName || "-";
  document.getElementById("custPhone").innerText = custPhone || "-";

  const tbody = document.getElementById("invItems");
  tbody.innerHTML = "";

  let subTotal = 0;
  let discountTotal = 0;
  let totalQty = 0;

  billItems.forEach((item, i) => {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    const final = base - disc;

    subTotal += base;
    discountTotal += disc;
    totalQty += item.qty;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.size}</td>
        <td>${item.qty}</td>
        <td>${item.price}</td>
        <td>${item.discountPercent}%</td>
        <td>${final.toFixed(2)}</td>
      </tr>
    `;
  });

  // ✅ Always show 20 rows
  for (let i = billItems.length; i < 20; i++) {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
      </tr>
    `;
  }

  const grandTotal = subTotal - discountTotal;

  document.getElementById("subTotal").innerText = subTotal.toFixed(2);
  document.getElementById("discTotal").innerText = discountTotal.toFixed(2);
  document.getElementById("invTotal").innerText = grandTotal.toFixed(2);
  document.getElementById("totalQty").innerText = totalQty;

  document.getElementById("amountWords").innerText =
    numberToWords(grandTotal);
}

/* ================= SAVE + PRINT BILL ================= */
async function saveBill() {
  if (isSavingBill) return;
  const sb = window.supabaseClient;

  if (billItems.length === 0) {
    alert("❌ No items in bill");
    return;
  }

  isSavingBill = true;

  const invoiceNo = document.getElementById("billInvoiceNo").value;
  const billDate = document.getElementById("billDate").value;
  const custName = document.getElementById("billCustomerName").value;
  const custPhone = document.getElementById("billCustomerPhone").value;

  let subTotal = 0, discountTotal = 0;

  billItems.forEach(item => {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    subTotal += base;
    discountTotal += disc;
  });

  const totalAmount = subTotal - discountTotal;

  let billId;

  /* ================= EDIT MODE ================= */
  if (currentEditBillId) {

    billId = currentEditBillId;

    // 1️⃣ Restore old stock
    const { data: oldItems } = await sb
      .from("bill_items")
      .select("*")
      .eq("bill_id", billId);

    for (const it of oldItems) {
      const { data: prod } = await sb
        .from("products")
        .select("stock_qty")
        .eq("id", it.product_id)
        .single();

      await sb.from("products")
        .update({ stock_qty: prod.stock_qty + it.qty })
        .eq("id", it.product_id);
    }

    // 2️⃣ Delete old bill items
    await sb.from("bill_items").delete().eq("bill_id", billId);

    // 3️⃣ Update bill header
    const { error } = await sb.from("bills")
      .update({
        invoice_no: invoiceNo,
        bill_date: billDate,
        customer_name: custName,
        customer_phone: custPhone,
        total_amount: totalAmount
      })
      .eq("id", billId);

    if (error) {
      console.error(error);
      alert("❌ Bill update failed");
      isSavingBill = false;
      return;
    }

  } 
  /* ================= NEW BILL MODE ================= */
  else {

    const { data: bill, error } = await sb
      .from("bills")
      .insert({
        invoice_no: invoiceNo,
        bill_date: billDate,
        customer_name: custName,
        customer_phone: custPhone,
        total_amount: totalAmount
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("❌ Bill save failed");
      isSavingBill = false;
      return;
    }

    billId = bill.id;
  }

  /* ================= INSERT NEW BILL ITEMS ================= */
  for (const item of billItems) {

    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    const final = base - disc;

    await sb.from("bill_items").insert({
      bill_id: billId,
      product_id: item.id,
      qty: item.qty,
      rate: item.price,
      discount_percent: item.discountPercent,
      subtotal: final
    });

    const { data: prod } = await sb
      .from("products")
      .select("stock_qty")
      .eq("id", item.id)
      .single();

    await sb.from("products")
      .update({ stock_qty: prod.stock_qty - item.qty })
      .eq("id", item.id);
  }

  alert(currentEditBillId ? "✅ Bill Updated" : "✅ Bill Saved");

  showInvoice();
  setTimeout(() => window.print(), 300);

  currentEditBillId = null; // exit edit mode
  await resetBill();
  loadStock();

  isSavingBill = false;
}
function printA5() {
  if (!billItems || billItems.length === 0) {
    alert("❌ No items in bill");
    return;
  }

  const invoiceBox = document.getElementById("invoicePreview");
  invoiceBox.style.display = "block";

  // ================= HEADER DATA =================
  const invoiceNo = document.getElementById("billInvoiceNo").value || "";
  const date = document.getElementById("billDate").value || "";
  const custName = document.getElementById("billCustomerName").value || "";
  const custPhone = document.getElementById("billCustomerPhone").value || "";

  document.getElementById("invNo").innerText = invoiceNo;
  document.getElementById("invDate").innerText = date;
  document.getElementById("custName").innerText = custName || "-";
  document.getElementById("custPhone").innerText = custPhone || "-";

  // ================= ITEMS TABLE =================
  const tbody = document.getElementById("invItems");
  tbody.innerHTML = "";

  let subTotal = 0;
  let discountTotal = 0;
  let totalQty = 0;

  billItems.forEach((item, i) => {
    const base = item.qty * item.price;
    const disc = (base * item.discountPercent) / 100;
    const final = base - disc;

    subTotal += base;
    discountTotal += disc;
    totalQty += item.qty;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.size || ""}</td>
        <td>${item.qty}</td>
        <td>${item.price}</td>
        <td>${item.discountPercent}%</td>
        <td>${final.toFixed(2)}</td>
      </tr>
    `;
  });

  // ✅ ALWAYS SHOW 20 ROWS
  for (let i = billItems.length; i < 20; i++) {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>&nbsp;</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }

  const grandTotal = subTotal - discountTotal;

  document.getElementById("subTotal").innerText = subTotal.toFixed(2);
  document.getElementById("discTotal").innerText = discountTotal.toFixed(2);
  document.getElementById("invTotal").innerText = grandTotal.toFixed(2);
  document.getElementById("totalQty").innerText = totalQty;

  // ================= AMOUNT IN WORDS =================
  document.getElementById("amountWords").innerText =
    numberToWords(grandTotal);

  // ================= PRINT ONLY A5 =================
  setTimeout(() => {
    window.print();
  }, 300);
}

/* ================= RESET BILL ================= */
async function resetBill() {
  billItems = [];
  renderBill();

  document.getElementById("barcodeInput").value = "";
  document.getElementById("billCustomerName").value = "";
  document.getElementById("billCustomerPhone").value = "";

  document.getElementById("billDate").value =
    new Date().toISOString().split("T")[0];

  document.getElementById("billInvoiceNo").value =
    await getNextInvoiceNumber();
}
