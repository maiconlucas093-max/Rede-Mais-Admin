
// Conexão oficial do painel administrativo com o Supabase
(() => {
  const SUPABASE_URL =
    "https://keeeubxxundmotvmkncs.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_JfOJ0JVipgIOohQgeTMQ4g_0uZiJ-_7";

  if (!window.supabase?.createClient) {
    console.error("Biblioteca Supabase não carregada.");
    return;
  }

  window.redeMaisSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log("Conexão Supabase preparada.");
})();
