/***************************************
 * CSV UPLOAD – FULL ERP IMPORTER
 ***************************************/

async function uploadCSV() {
  const sb = window.supabaseClient;
  const fileInput = document.getElementById("csvFile");
  const statusBox = document.getElementById("uploadStatus");

  if (!fileInput.files.length) {
    statusBox.innerHTML = "❌ Please select a CSV file";
    return;
  }

  const file = fileInput.files[0];
  statusBox.innerHTML = "⏳ Reading CSV...";

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,

    complete: async function (results) {
      console.log("CSV DATA:", results.data);

      let success = 0;
      let failed = 0;
      let skipped = 0;
      let updated = 0;

      for (const row of results.data) {

        // ✅ Barcode mapping (Marg + Excel)
        const barcode =
          row.barcode ||
          row.Barcode ||
          row["Item Code"] ||
          row["ITEM CODE"];

        if (!barcode || String(barcode).trim() === "") {
          skipped++;
          continue;
        }

        const record = {
          name: (row.name || row["Item Name"] || row["ITEM NAME"] || "").trim(),
          size: row.size || row.Size || null,
          unit: row.unit || row.Unit || "PCS",
          barcode: String(barcode).trim(),

          cost_price: Number(row.cost_price || row.Cost || row["Cost Price"] || 0),
          selling_price: Number(row.selling_price || row.MRP || row.Rate || 0),
          stock_qty: Number(row.stock_qty || row.Qty || row.Quantity || 0),

          // ✅ SUPPLIER DATA
          supplier_name: row.supplier_name || row.Supplier || row["Supplier Name"] || null,
          supplier_gst: row.supplier_gst || row["GST"] || row["GST No"] || null,
          supplier_invoice_no: row.supplier_invoice_no || row["Invoice No"] || null
        };

        try {
          // ✅ Check existing product
          const { data: existing } = await sb
            .from("products")
            .select("id, stock_qty")
            .eq("barcode", record.barcode)
            .maybeSingle();

          if (existing) {
            // ✅ UPDATE instead of skip (professional ERP behavior)
            const newQty = Number(existing.stock_qty) + record.stock_qty;

            await sb.from("products")
              .update({
                name: record.name,
                size: record.size,
                unit: record.unit,
                cost_price: record.cost_price,
                selling_price: record.selling_price,
                stock_qty: newQty,
                supplier_name: record.supplier_name,
                supplier_gst: record.supplier_gst,
                supplier_invoice_no: record.supplier_invoice_no
              })
              .eq("id", existing.id);

            updated++;
            continue;
          }

          // ✅ Insert new product
          const { error } = await sb.from("products").insert(record);

          if (error) {
            console.error("INSERT ERROR:", error, record);
            failed++;
          } else {
            success++;
          }

        } catch (err) {
          console.error("CSV ERROR:", err);
          failed++;
        }
      }

      statusBox.innerHTML = `
        <b>✅ CSV Import Completed</b><br><br>
        🟢 New Products: ${success}<br>
        🔵 Updated Products: ${updated}<br>
        🟡 Skipped Rows: ${skipped}<br>
        🔴 Failed Rows: ${failed}
      `;
    }
  });
}
