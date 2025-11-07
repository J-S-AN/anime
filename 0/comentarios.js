// === JSY ANIME - SISTEMA DE COMENTÁRIOS COMPLETO ===
// Inclui Gravatar, respostas, admin e moderação
// Requer js-sha256 (ex: <script src="https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/build/sha256.min.js"></script>)

const scriptURL = "https://script.google.com/macros/s/AKfycbyAlm9dkXM0n4uzQ0z_ttFo86Uw49N5F_kv1F35P44FMm-vV7CQQ987XfatD4B0Dll6pw/exec";

// === Injeta CSS automático ===
(function addCommentCSS() {
  const css = `
  #comentarios-lista {
    margin-top: 20px;
  }

  .comentario {
    background: #1b1b1b;
    color: #f0f0f0;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
    position: relative;
  }

  .comentario-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }

  .admin-badge {
    background: #ffcc00;
    color: #000;
    font-size: 0.75em;
    padding: 2px 6px;
    border-radius: 6px;
    margin-left: 6px;
  }

  .resposta {
    margin-left: 40px;
    margin-top: 10px;
    position: relative;
  }

  .linha-conexao {
    width: 2px;
    height: 100%;
    background: #555;
    position: absolute;
    left: -20px;
    top: 0;
  }

  .resposta-box {
    background: #222;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    gap: 10px;
  }

  .comentario-texto {
    margin-top: 6px;
    white-space: pre-wrap;
  }

  .responder-btn {
    background: none;
    border: none;
    color: #00c3ff;
    cursor: pointer;
    margin-top: 8px;
    font-size: 0.9em;
  }

  .responder-btn:hover {
    text-decoration: underline;
  }

  #contador-comentarios {
    font-weight: bold;
    color: #ffd000;
  }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

// === Função para gerar avatar do Gravatar ===
function getGravatarURL(email) {
  const address = String(email).trim().toLowerCase();
  const hash = sha256(address);
  return `https://gravatar.com/avatar/${hash}?d=identicon`;
}

// === Enviar comentário ou resposta ===
async function enviarComentario(nome, email, mensagem, parentId = "", admin = "false") {
  const page = window.location.href;

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("email", email);
  formData.append("mensagem", mensagem);
  formData.append("page", page);
  formData.append("parentId", parentId);
  formData.append("admin", admin);

  const res = await fetch(scriptURL, { method: "POST", body: formData });
  const text = await res.text();
  alert(text);
  carregarComentarios();
}

// === Carregar e exibir comentários ===
async function carregarComentarios() {
  const page = window.location.href;
  const res = await fetch(`${scriptURL}?page=${encodeURIComponent(page)}`);
  const comentarios = await res.json();

  const area = document.getElementById("comentarios-lista");
  const contador = document.getElementById("contador-comentarios");

  const comentariosAprovados = comentarios.filter(c => c.aprovado === "true");
  contador.textContent = comentariosAprovados.length;

  // Cria estrutura hierárquica (comentários + respostas)
  const mapa = {};
  comentariosAprovados.forEach(c => mapa[c.id] = { ...c, respostas: [] });
  const raiz = [];

  comentariosAprovados.forEach(c => {
    if (c.parentId) {
      mapa[c.parentId]?.respostas.push(c);
    } else {
      raiz.push(c);
    }
  });

  area.innerHTML = "";
  raiz.forEach(c => area.appendChild(renderComentario(c)));
}

function renderComentario(c) {
  const div = document.createElement("div");
  div.className = "comentario";

  const gravatar = getGravatarURL(c.email);
  const adminBadge = c.admin === "true" ? `<span class="admin-badge">Admin</span>` : "";

  div.innerHTML = `
    <div class="comentario-header">
      <img src="${gravatar}" class="avatar">
      <strong>${c.nome}</strong> ${adminBadge}
      <span class="data">${c.data}</span>
    </div>
    <div class="comentario-texto">${c.mensagem}</div>
    <button class="responder-btn" data-id="${c.id}">Responder</button>
    <div class="respostas"></div>
  `;

  const respostasDiv = div.querySelector(".respostas");
  if (c.respostas && c.respostas.length > 0) {
    c.respostas.forEach(r => respostasDiv.appendChild(renderResposta(r)));
  }

  div.querySelector(".responder-btn").addEventListener("click", e => {
    const parentId = e.target.getAttribute("data-id");
    const nome = prompt("Seu nome:");
    const email = prompt("Seu e-mail:");
    const mensagem = prompt("Sua resposta:");
    if (mensagem) enviarComentario(nome, email, mensagem, parentId);
  });

  return div;
}

function renderResposta(r) {
  const div = document.createElement("div");
  div.className = "resposta";

  const gravatar = getGravatarURL(r.email);
  const adminBadge = r.admin === "true" ? `<span class="admin-badge">Admin</span>` : "";

  div.innerHTML = `
    <div class="linha-conexao"></div>
    <div class="resposta-box">
      <img src="${gravatar}" class="avatar">
      <div>
        <strong>${r.nome}</strong> ${adminBadge}
        <span class="data">${r.data}</span>
        <div class="comentario-texto">${r.mensagem}</div>
      </div>
    </div>
  `;
  return div;
}

document.addEventListener("DOMContentLoaded", carregarComentarios);
