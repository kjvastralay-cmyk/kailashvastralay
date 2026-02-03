/************************************************
 * STOCK.JS – STABLE & LARGE DATA SAFE
 * Uses: window.supabaseClient (ONLY)
 ************************************************/

let stockPage = 1;
const PAGE_SIZE = 100;

/* ================= LOAD STOCK (PAGINATION) ================= */
async function loadStock() {
  const sb = window.supabaseClient;
  const tbody = document.getElementById("stockBody");
  const info = document.getElementById("stockPageInfo");

  tbody.innerHTML = `<tr><td colspan="10">Loading...</td></tr>`;
  if (info) info.innerText = "";

  const from = (stockPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await sb
    .from("products")
    .select(
      "barcode,name,size,unit,stock_qty,cost_price,selling_price,supplier_name,supplier_gst,supplier_invoice_no"
    )
    .order("name")
    .range(from, to);

  if (error) {
    console.error("Stock load error:", error);
    tbody.innerHTML = `<tr><td colspan="10">Failed to load stock</td></tr>`;
    return;
  }

  renderStockRows(data);

  if (info) {
    info.innerText = `Page ${stockPage} (Showing ${from + 1} – ${from + data.length})`;
  }
}

/* ================= SEARCH STOCK (FULL DATASET) ================= */
async function searchStock() {
  const sb = window.supabaseClient;
  const search = document.getElementById("stockSearch").value.trim();
  const tbody = document.getElementById("stockBody");
  const info = document.getElementById("stockPageInfo");

  if (!search) {
    stockPage = 1;
    loadStock();
    return;
  }

  tbody.innerHTML = `<tr><td colspan="10">Searching...</td></tr>`;
  if (info) info.innerText = "Search results";

  const filter =
    `name.ilike.%${search}%` +
    `,barcode.ilike.%${search}%` +
    `,size.ilike.%${search}%` +
    `,supplier_name.ilike.%${search}%` +
    `,supplier_invoice_no.ilike.%${search}%`;

  const { data, error } = await sb
    .from("products")
    .select(
      "barcode,name,size,unit,stock_qty,cost_price,selling_price,supplier_name,supplier_gst,supplier_invoice_no"
    )
    .or(filter)
    .limit(200);

  if (error) {
    console.error("Search error:", error);
    tbody.innerHTML = `<tr><td colspan="10">Search failed</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">No results found</td></tr>`;
    return;
  }

  renderStockRows(data);
}


/* ================= RENDER TABLE ================= */
function renderStockRows(data) {
  const tbody = document.getElementById("stockBody");
  tbody.innerHTML = "";

  data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.barcode || ""}</td>
        <td>${p.name}</td>
        <td>${p.size || ""}</td>
        <td>${p.unit || "PCS"}</td>
        <td>${p.stock_qty}</td>
        <td>${p.cost_price}</td>
        <td>${p.selling_price}</td>
        <td>${p.supplier_name || "-"}</td>
        <td>${p.supplier_gst || "-"}</td>
        <td>${p.supplier_invoice_no || "-"}</td>
      </tr>
    `;
  });
}

/* ================= PAGINATION ================= */
function nextStock() {
  stockPage++;
  loadStock();
}

function prevStock() {
  if (stockPage > 1) {
    stockPage--;
    loadStock();
  }
}
