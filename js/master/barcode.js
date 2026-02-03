function generateBarcode() {
  // 6-digit numeric barcode (scanner friendly)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  document.getElementById("p_barcode").value = code;

  JsBarcode("#barcodePreview", code, {
    format: "CODE128",
    width: 1,        // 🔥 thin lines
    height: 30,      // compact
    displayValue: false
  });
}


function printBarcode() {
  const code = document.getElementById("p_barcode").value.trim();
  const product = document.getElementById("p_name").value.trim();
  const price = document.getElementById("p_sell").value.trim();

  if (!code || !product || !price) {
    alert("Fill product name, price and generate barcode");
    return;
  }

  const settings = {
    code,
    product,
    price,
    startPos: 1,
    count: 65
  };

  localStorage.setItem("barcodeSettings", JSON.stringify(settings));
  window.open("../pages/barcode-print.html", "_blank");
}
