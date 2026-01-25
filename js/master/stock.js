/************************************************
 * STOCK.JS – REAL STOCK VIEW
 ************************************************/

async function loadStock() {
  const sb = window.supabaseClient;
  const tbody = document.getElementById("stockBody");
  tbody.innerHTML = "";

  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("name");

  if (error) {
    console.error("Stock load error:", error);
    return;
  }

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


async function searchStock() {
  const sb = window.supabaseClient;
  const search = document.getElementById("stockSearch").value.trim();

  const tbody = document.getElementById("stockBody");
  tbody.innerHTML = "";

  let query = sb.from("products").select("*").limit(200);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,barcode.ilike.%${search}%,size.ilike.%${search}%,supplier_name.ilike.%${search}%,supplier_invoice_no.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Stock search error:", error);
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10">No results found</td></tr>`;
    return;
  }

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


