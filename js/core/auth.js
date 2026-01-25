console.log("✅ auth.js loaded");

// IMPORTANT: do NOT redeclare supabase
// use window.supabaseClient directly

window.login = async function () {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  const supabase = window.supabaseClient;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error || !data) {
    alert("❌ Invalid username or password");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));
  alert("✅ Login successful");

  window.location.href = "../index.html";
};

window.logout = function () {
  localStorage.removeItem("user");
  window.location.href = "pages/login.html";
};

window.checkAuth = function () {
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.href = "pages/login.html";
  }
};
