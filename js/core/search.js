/***************************************
 * GLOBAL SEARCH – ERP LEVEL
 ***************************************/

const supabase = window.supabaseClient;

async function globalSearch() {
  const keyword = document.getElementById("globalSearch").value.trim();
  if (!keyword) return;

  console.log("Searching:", keyword);

  // Search products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${keyword}%,barcode.ilike.%${keyword}%`);

  console.log("Products:", products);

  // Search bills
  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .or(`invoice_no.ilike.%${keyword}%,bill_date.ilike.%${keyword}%`);

  console.log("Bills:", bills);

  alert(
    `Search Result:\nProducts: ${products?.length || 0}\nBills: ${bills?.length || 0}`
  );
}
