/************************************************
 * UI.JS – SECTION CONTROL + MENU ACTIVE SYSTEM
 ************************************************/

function showSection(id) {
  // Hide all sections
  document.querySelectorAll("main section").forEach(sec => {
    sec.hidden = true;
  });

  // Show selected section
  const target = document.getElementById(id);
  if (target) target.hidden = false;

  // Set active menu
  document.querySelectorAll(".sidebar button").forEach(btn => {
    btn.classList.remove("active");
  });

  const activeBtn = [...document.querySelectorAll(".sidebar button")]
    .find(btn => btn.getAttribute("onclick")?.includes(id));

  if (activeBtn) activeBtn.classList.add("active");
}

// Default section on load
window.addEventListener("load", () => {
  showSection("dashboard");
});
// ✅ ENTER KEY = NEXT INPUT / BUTTON (POS STYLE)
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const form = document.querySelectorAll(
      "input, select, textarea, button"
    );

    const visible = Array.from(form).filter(el =>
      !el.disabled &&
      el.offsetParent !== null
    );

    const index = visible.indexOf(document.activeElement);

    if (index > -1) {
      e.preventDefault();
      const next = visible[index + 1] || visible[0];
      next.focus();

      // ✅ Auto click if button
      if (next.tagName === "BUTTON") next.click();
    }
  }
});
document.getElementById("barcodeInput").addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    addItem();
  }
});
document.addEventListener("keydown", function(e){

  // F2 = Save Bill
  if(e.key === "F2"){
    e.preventDefault();
    saveBill();
  }

  // F4 = Print A5
  if(e.key === "F4"){
    e.preventDefault();
    showInvoice();
    window.print();
  }

  // F6 = Reset Bill
  if(e.key === "F6"){
    e.preventDefault();
    resetBill();
  }

  // ESC = Focus barcode
  if(e.key === "Escape"){
    document.getElementById("barcodeInput").focus();
  }
});
