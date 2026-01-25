function generateBarcode() {
  const code = "KV" + Date.now();
  document.getElementById("p_barcode").value = code;

  JsBarcode("#barcodePreview", code, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: true
  });
}

function printBarcode() {
  const code = document.getElementById("p_barcode").value;
  if (!code) {
    alert("Generate barcode first");
    return;
  }

  const startPos = Number(document.getElementById("bc_start_pos").value);
  const count = Number(document.getElementById("bc_count").value);

  const settings = {
    code,
    startPos,
    count
  };

  localStorage.setItem("barcodeSettings", JSON.stringify(settings));
  window.open("../pages/barcode-print.html", "_blank");
}
