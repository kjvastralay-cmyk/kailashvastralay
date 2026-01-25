/***************************************
 * PRODUCT REGISTRATION – FINAL PRO VERSION
 ***************************************/

async function saveProduct() {
  const sb = window.supabaseClient;

  const name = document.getElementById("p_name").value.trim();
  const size = document.getElementById("p_size").value.trim();

  let unit = document.getElementById("p_unit").value.trim();
  if (!unit) unit = "PCS";

  const cost = Number(document.getElementById("p_cost").value) || 0;
  const sell = Number(document.getElementById("p_sell").value) || 0;
  const qty = Number(document.getElementById("p_qty").value) || 0;
  const barcode = document.getElementById("p_barcode").value.trim();

  const supplierName = document.getElementById("p_supplier_name")?.value.trim() || "";
  const supplierGST = document.getElementById("p_supplier_gst")?.value.trim() || "";
  const supplierInvoice = document.getElementById("p_supplier_invoice")?.value.trim() || "";

  // ✅ Validation
  if (!name) return alert("❌ Product name required");
  if (!barcode) return alert("❌ Barcode required");

  // ✅ Check duplicate barcode
  const { data: existing } = await sb
    .from("products")
    .select("id")
    .eq("barcode", barcode)
    .maybeSingle();

  if (existing) {
    alert("❌ Barcode already exists!");
    return;
  }

  // ✅ Insert product
  const { data: product, error } = await sb
    .from("products")
    .insert({
      name,
      size,
      unit,
      barcode,
      cost_price: cost,
      selling_price: sell,
      stock_qty: qty,

      supplier_name: supplierName,
      supplier_gst: supplierGST,
      supplier_invoice_no: supplierInvoice
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("❌ Product save failed");
    return;
  }

  // ✅ Add stock ledger entry (PURCHASE / OPENING STOCK)
  if (qty > 0) {
    await sb.from("stock_ledger").insert({
      product_id: product.id,
      type: "PURCHASE",
      qty_in: qty,
      remarks: "Opening Stock / Supplier Entry"
    });
  }

  alert("✅ Product saved successfully");

  // ✅ Reload stock table
  if (typeof loadStock === "function") loadStock();

  // ✅ Clear form
  document.getElementById("p_name").value = "";
  document.getElementById("p_size").value = "";
  document.getElementById("p_unit").value = "PCS";
  document.getElementById("p_cost").value = "";
  document.getElementById("p_sell").value = "";
  document.getElementById("p_qty").value = "";
  document.getElementById("p_barcode").value = "";

  if (document.getElementById("p_supplier_name"))
    document.getElementById("p_supplier_name").value = "";
  if (document.getElementById("p_supplier_gst"))
    document.getElementById("p_supplier_gst").value = "";
  if (document.getElementById("p_supplier_invoice"))
    document.getElementById("p_supplier_invoice").value = "";
}
