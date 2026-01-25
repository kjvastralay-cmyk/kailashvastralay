
// IMPORTANT: use global supabase from CDN
const SUPABASE_URL = "https://ejtqcadxbnrtcvozavyc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdHFjYWR4Ym5ydGN2b3phdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODIwNTEsImV4cCI6MjA4NDc1ODA1MX0.sqUgSk1dAUW0dZMBtfFnQqS0ZqIeLifVTi3G7eQKzIA";

// create client correctly
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// make it global
window.supabaseClient = supabaseClient;
