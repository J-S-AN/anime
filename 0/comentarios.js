(function() {
  const URL_ENVIAR = "https://script.google.com/macros/s/AKfycbwY4-YJvhgYF-m_hS8RMU0-IKawz_Fw3zpvRXG-wS2MHMnNTPI3_-jzZhUow66fXTWg8Q/exec";
  const URL_LISTAR = "https://script.google.com/macros/s/AKfycbyChG1va51aJMmvIiOg-MBIFYtqB_2-luWf8Jnqw6YUFScU_Dp-hagul185JP1GS0bHpQ/exec";

  const container = document.getElementById("jsy-comments");
  if (!container) return;

  const urlObj = new URL(window.location.href);
  const pageURL = urlObj.origin + urlObj.pathname; // normaliza URL

  container.innerHTML = `
  <style>
    #jsy-comments * { box-sizing: border-box; font-family: Arial, sans-serif; }
    #jsy-comments { background:#0e0e0e; color:#fff; padding:20px; border-radius:10px; max-width:800px; margin:20px auto; }
    #jsy-comments h3 { color:#f1c40f; margin-bottom:10px; }
    .comment-form input, .comment-form textarea {
      width:100%; padding:10px; margin:5px 0; border-radius:5px; border:none; background:#1a1a1a; color:#fff;
    }
    .comment-form button { background:#f1c40f; color:#000; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; }
    .comment { background:#1b1b1b; border-radius:8px; margin-top:10px; padding:10px; position:relative; }
    .comment .meta { font-size:14px; color:#aaa; margin-bottom:5px; }
    .comment .admin-badge { background:#f39c12; color:#000; font-weight:bold; font-size:12px; padding:2px 6px; border-radius:4px; margin-left:5px; }
    .reply { margin-left:40px; border-left:2px solid #f1c40f; padding-left:10px; margin-top:10px; }
    .avatar { width:40px; height:40px; border-radius:50%; vertical-align:middle; margin-right:10px; }
  </style>

  <h3>Comentários</h3>
  <form class="comment-form">
    <input type="text" name="nome" placeholder="Seu nome" required>
    <input type="email" name="email" placeholder="Seu e-mail (Gravatar)" required>
    <textarea name="mensagem" rows="3" placeholder="Escreva seu comentário..." required></textarea>
    <button type="submit">Enviar</button>
  </form>
  <div id="comment-list"></div>
  `;

  const form = container.querySelector(".comment-form");
  const list = container.querySelector("#comment-list");

  async function carregarComentarios() {
    list.innerHTML = "<p>Carregando comentários...</p>";
    try {
      const res = await fetch(`${URL_LISTAR}?page=${encodeURIComponent(pageURL)}`);
      const comentarios = await res.json();
      list.innerHTML = gerarHTMLComentarios(comentarios);
    } catch {
      list.innerHTML = "<p>Erro ao carregar comentários.</p>";
    }
  }

  function gerarHTMLComentarios(comentarios, parentId = "") {
    return comentarios
      .filter(c => c.parentId === parentId)
      .map(c => `
        <div class="comment" data-id="${c.id}">
          <div class="meta">
            <img class="avatar" src="https://www.gravatar.com/avatar/${md5(c.email.trim().toLowerCase())}?d=mp&s=40">
            <strong>${c.nome}</strong>
            ${c.admin === "true" ? '<span class="admin-badge">ADMIN</span>' : ""}
            <span>• ${c.data}</span>
          </div>
          <div class="mensagem">${c.mensagem}</div>
          <button class="reply-btn" data-id="${c.id}">Responder</button>
          <div class="reply">${gerarHTMLComentarios(comentarios, c.id)}</div>
        </div>
      `).join("");
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const dados = new FormData(form);
    dados.append("page", pageURL);
    try {
      await fetch(URL_ENVIAR, { method: "POST", body: dados });
      form.reset();
      carregarComentarios();
    } catch {
      alert("Erro ao enviar comentário.");
    }
  });

  // MD5 para Gravatar
  function md5(str) { return CryptoJS.MD5(str).toString(); }

  carregarComentarios();
})();
