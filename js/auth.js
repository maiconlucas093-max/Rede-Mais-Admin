
(() => {
  "use strict";

  const supabase = window.redeMaisSupabase;

  const $ = (id) => document.getElementById(id);

  const loginForm = $("adminLoginForm");
  const welcome = $("welcomeScreen");
  const appShell = $("appShell");
  const feedback = $("loginFeedback");
  const loginButton = $("loginButton");

  function showLogin(message = "") {
    welcome.hidden = false;
    appShell.hidden = true;

    if (feedback) {
      feedback.textContent = message;
    }
  }

  function showPanel(user) {
    welcome.hidden = true;
    appShell.hidden = false;

    const email = $("adminEmail");

    if (email) {
      email.textContent = user.email || "Administrador";
    }

    if (typeof window.redeMaisRefresh === "function") {
      window.redeMaisRefresh();
    }
  }

  async function validateAdmin(user) {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id, display_name, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  async function checkSession() {
    if (!supabase || !loginForm) {
      showLogin("Não foi possível iniciar o sistema de acesso.");
      return;
    }

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      showLogin();
      return;
    }

    try {
      const admin = await validateAdmin(data.session.user);

      if (!admin) {
        await supabase.auth.signOut();
        showLogin("Esta conta não possui autorização administrativa.");
        return;
      }

      showPanel(data.session.user);
    } catch (error) {
      console.error("Erro ao validar administrador:", error);
      await supabase.auth.signOut();
      showLogin("Não foi possível validar sua autorização.");
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    feedback.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Verificando acesso...";

    try {
      const email = $("loginEmail").value.trim();
      const password = $("loginPassword").value;

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      const admin = await validateAdmin(data.user);

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error(
          "Esta conta não possui autorização administrativa."
        );
      }

      $("loginPassword").value = "";

      showPanel(data.user);

    } catch (error) {
      console.error("Erro no login:", error);

      feedback.textContent =
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message || "Não foi possível entrar.";

    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Entrar no painel";
    }
  });

  $("logoutButton").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Não foi possível encerrar a sessão.");
      return;
    }

    showLogin("Sessão encerrada com segurança.");
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      showLogin();
    }
  });

  checkSession();
})();
