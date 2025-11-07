/* === JSY ANIME - Sistema de Comentários com Respostas e Admin === */

/* SHA256 para gerar avatar Gravatar */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = "length";
  var i, j, result = "";
  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;
  var hash = (sha256.h = sha256.h || []);
  var k = (sha256.k = sha256.k || []);
  var primeCounter = k[lengthProperty];

  function frac(x) { return (x - Math.floor(x)) * maxWord | 0; }
  function isPrime(n) {
    for (var factor = 2; factor * factor <= n; factor++)
      if (n % factor === 0) return false;
    return true;
  }

  if (!primeCounter) {
    var candidate = 2;
    while (primeCounter < 64) {
      if (isPrime(candidate)) {
        hash[primeCounter] = frac(Math.pow(candidate, 1 / 2));
        k[primeCounter++] = frac(Math.pow(candidate, 1 / 3));
      }
      candidate++;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  var w = [];
  for (j = 0; j < words[lengthProperty]; ) {
    var oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15],
          w2 = w[i - 2];
      var a = hash[0], e = hash[4];
      var temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
        (w[i] = i < 16
          ? words[j + i]
          : (w[i - 16] +
              (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
              w[i - 7] +
              (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      var temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2],
              (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    j += 16;
  }
  for (i = 0; i < 8; i++)
    for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  return result;
}

/* === Gravatar === */
function getGravatarURL(email) {
  const address = String(email).trim().toLowerCase();
  const hash = sha256(address);
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

/* === CONFIGURAÇÕES === */
const scriptURL = "https://script.google.com/macros/s/AKfycbyAlm9dkXM0n4uzQ0z_ttFo86Uw49N5F_kv1F35P44FMm-vV7CQQ987XfatD4B0Dll6pw/exec";
const pageURL = window.location.href;
const IS_ADMIN = false; // altere para true se for admin (ex: JSY responder)

/* === CSS === */
const style = document.createElement("style");
style.textContent = `
#jsy-comments { font-family: Arial, sans-serif; margin-top: 20px; color: #eee; }
.comment-form { display: flex; flex-direction: column; gap: 10px; }
.comment-form input, .comment-form textarea {
  padding: 8px; border-radius: 6px; border: 1px solid #555;
  background: #111; color: #eee; resize: none;
}
.comment-form button {
  background: #e50914; color: #fff; border: none; padding: 10px;
  border-radius: 6px; cursor: pointer; font-weight: bold;
}
.comment-form button:hover { background: #ff2a2a; }
.comment { display: flex; align-items: flex-start; gap: 10px; margin: 15px 0; }
.comment img { width: 40px; height: 40px; border-radius: 50%; }
.comment-content { background: #1c1c1c; padding: 10px; border-radius: 8px; width: 100%; }
.comment-author { color: #ffd700; font-weight: bold; margin-bottom: 5px; }
.comment-admin { color: #ff5555; font-weight: bold; margin-left: 5px; }
.comment-date { font-size: 12px; color: #888; margin-bottom: 5px; }
.reply-btn { color: #00aaff; background: none; border: none; cursor: pointer; font-size: 13px; margin-top: 5px; }
.reply-box { margin-left: 55px; margin-top: 10px; }
.reply-item { margin-left: 55px; border-left: 2px solid #333; padding-left: 10px; margin-top: 8px; }
#comment-count { margin-bottom: 10px; color: #aaa; }
`;
document.head.appendChild(style);

/* === Funções principais === */
async function carregarComentarios() {
  const response = await fetch(`${scriptURL}?page=${encodeURIComponent(pageURL)}`);
  const data = await response.json();
  const lista = document.getElementById("comment-list");
  const contador = document.getElementById("comment-count");
  lista.innerHTML = "";

  const aprovados = data.filter(c => c.aprovado === "true");
  contador.textContent = `${aprovados.length} comentário${aprovados.length !== 1 ? 's' : ''}`;

  const raiz = aprovados.filter(c => !c.parentId);
  const respostas = aprovados.filter(c => c.parentId);

  raiz.reverse().forEach(c => {
    const div = criarComentarioHTML(c);
    const filhos = respostas.filter(r => r.parentId === c.id);
    filhos.forEach(f => {
      const resposta = criarComentarioHTML(f, true);
      div.appendChild(resposta);
    });
    lista.appendChild(div);
  });
}

function criarComentarioHTML(c, isReply = false) {
  const div = document.createElement("div");
  div.className = isReply ? "reply-item" : "comment";

  const avatar = getGravatarURL(c.email);
  const adminSelo = c.admin === "true" ? `<span class="comment-admin">🛡️ Admin</span>` : "";

  div.innerHTML = `
    <img src="${avatar}" alt="${c.nome}">
    <div class="comment-content">
      <div class="comment-author">${c.nome}${adminSelo}</div>
      <div class="comment-date">${c.data}</div>
      <div>${c.mensagem}</div>
      ${!isReply ? `<button class="reply-btn" data-id="${c.id}" data-nome="${c.nome}">Responder</button>` : ""}
    </div>
  `;

  if (!isReply) {
    const replyBtn = div.querySelector(".reply-btn");
    replyBtn.addEventListener("click", () => abrirCaixaResposta(replyBtn.dataset.id, replyBtn.dataset.nome, div));
  }

  return div;
}

function abrirCaixaResposta(parentId, nomeAlvo, divPai) {
  if (divPai.querySelector(".reply-box")) return;
  const box = document.createElement("div");
  box.className = "reply-box";
  box.innerHTML = `
    <form class="comment-form reply-form">
      <input type="text" id="reply-name-${parentId}" placeholder="Seu nome" required>
      <input type="email" id="reply-email-${parentId}" placeholder="Seu e-mail" required>
      <textarea id="reply-msg-${parentId}" rows="3" placeholder="Responda ${nomeAlvo}..." required></textarea>
      <button type="submit">Enviar resposta</button>
    </form>
  `;
  divPai.appendChild(box);

  box.querySelector("form").addEventListener("submit", e => enviarComentario(e, parentId));
}

async function enviarComentario(e, parentId = "") {
  e.preventDefault();
  const form = e.target;

  const nome = form.querySelector('input[type="text"]').value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  const mensagem = form.querySelector("textarea").value.trim();

  if (!nome || !email || !mensagem) return alert("Preencha todos os campos.");

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("email", email);
  formData.append("mensagem", mensagem);
  formData.append("page", pageURL);
  formData.append("parentId", parentId);
  formData.append("admin", IS_ADMIN ? "true" : "false");

  const resp = await fetch(scriptURL, { method: "POST", body: formData });
  if (resp.ok) {
    alert(IS_ADMIN ? "Resposta enviada!" : "Comentário enviado! Aguarde aprovação.");
    form.reset();
    carregarComentarios();
  } else {
    alert("Erro ao enviar.");
  }
}

/* === Inicialização === */
function iniciarComentariosJSY() {
  const container = document.getElementById("jsy-comments");
  container.innerHTML = `
    <h3 id="comment-count">0 comentários</h3>
    <form class="comment-form" id="comment-form">
      <input type="text" id="comment-name" placeholder="Seu nome" required>
      <input type="email" id="comment-email" placeholder="Seu e-mail (para avatar Gravatar)" required>
      <textarea id="comment-message" placeholder="Escreva seu comentário..." rows="4" required></textarea>
      <button type="submit">Enviar comentário</button>
    </form>
    <div id="comment-list"></div>
  `;
  document.getElementById("comment-form").addEventListener("submit", enviarComentario);
  carregarComentarios();
}

if (document.getElementById("jsy-comments")) iniciarComentariosJSY();
