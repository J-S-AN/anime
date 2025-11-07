// === comentarios.js (unificado, HTML+CSS+JS) ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGsObPUZeIxjS9RX3JEDJ03FSdd6N6heKoCBeEvgbSY_Z0fpCvcRXOr13XeL2-vhVGDQ/exec';
const PAGE = location.href.split('#')[0]; // URL sem hash

// Injeta HTML + CSS
(function renderShell(){
  const root = document.getElementById('jsy-comments');
  if (!root) {
    console.warn('Elemento #jsy-comments não encontrado.');
    return;
  }

  root.innerHTML = `
    <style>
      #jsy-comments { max-width: 900px; margin: 30px auto; font-family: Arial, sans-serif; color: #eee; }
      .jsy-box { background:#0f0f0f; padding:18px; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.6); }
      .jsy-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
      .jsy-header h3 { margin:0; color:#ffd700; }
      .jsy-form { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
      .jsy-form input[type="text"], .jsy-form input[type="email"], .jsy-form textarea {
        background:#141414; border:1px solid #222; padding:10px; color:#fff; border-radius:8px; width:100%;
      }
      .jsy-form button { background:#ffd700; color:#000; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:bold; }
      .jsy-list { margin-top:12px; }
      .jsy-msg { display:flex; gap:12px; background:#121212; padding:12px; border-radius:10px; margin-bottom:12px; position:relative; }
      .jsy-avatar { width:44px; height:44px; border-radius:50%; flex-shrink:0; }
      .jsy-content { flex:1; }
      .jsy-name { font-weight:700; color:#ffd700; }
      .jsy-admin { background:#ff5e5e; color:#fff; font-size:11px; padding:2px 6px; border-radius:6px; margin-left:8px; display:inline-block; }
      .jsy-date { font-size:12px; color:#999; margin-top:4px; }
      .jsy-text { margin-top:8px; white-space:pre-wrap; color:#ddd; }
      .jsy-actions { margin-top:8px; display:flex; gap:10px; align-items:center; }
      .jsy-reply-btn, .jsy-like-btn { background:none; border:none; color:#4db8ff; cursor:pointer; padding:4px 6px; border-radius:6px; }
      .jsy-like-count { font-size:13px; color:#ffd700; margin-left:6px; }
      .jsy-reply-box { margin-left:56px; margin-top:8px; }
      .jsy-reply-line { position:absolute; left:32px; top:0; bottom:0; width:2px; background:#333; border-radius:2px; }
      .jsy-reply { margin-left:56px; border-left:2px solid #333; padding-left:12px; margin-top:8px; background:#0f0f0f; border-radius:8px; }
      .jsy-empty { text-align:center; color:#aaa; padding:10px 0; }
    </style>

    <div class="jsy-box">
      <div class="jsy-header"><h3>Comentários Em Teste do site</h3><div id="jsy-count">0</div></div>

      <form id="jsy-form" class="jsy-form" autocomplete="off">
        <input name="nome" type="text" placeholder="Seu nome (opcional)">
        <input name="email" type="email" placeholder="Seu e-mail (será usado para avatar)">
        <textarea name="mensagem" rows="3" placeholder="Escreva seu comentário..." required></textarea>
        <input type="hidden" name="page" value="${PAGE}">
        <input type="hidden" name="parentId" value="">
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="submit">Enviar comentário</button>
          <span id="jsy-status" style="color:#aaa;margin-left:8px;"></span>
        </div>
      </form>

      <div id="jsy-list" class="jsy-list">
        <div class="jsy-empty">Carregando comentários...</div>
      </div>
    </div>
  `;
})();

// Util: SHA-256 (browser) -> hex
async function sha256hex(message) {
  const msgUint8 = new TextEncoder().encode(String(message));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Gera url gravatar (async)
async function gravatarUrl(email) {
  if (!email) return 'https://www.gravatar.com/avatar/?d=mp';
  const hash = await sha256hex(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

// Função para enviar comentário/resposta
async function enviarComentario(formEl) {
  const status = document.getElementById('jsy-status');
  status.textContent = 'Enviando...';
  const fd = new FormData(formEl);

  try {
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: fd });
    const text = await res.text();
    status.textContent = text || 'Enviado';
    formEl.reset();
    // limpar parentId oculto
    formEl.querySelector('input[name="parentId"]').value = '';
    await carregarComentarios(); // recarrega lista
    setTimeout(()=> status.textContent = '', 2500);
  } catch (err) {
    console.error(err);
    status.textContent = 'Erro ao enviar';
  }
}

// Função para enviar like
async function enviarLike(id, btn, countEl) {
  try {
    const fd = new FormData();
    fd.append('action', 'like');
    fd.append('id', id);
    const res = await fetch(SCRIPT_URL, { method: 'POST', body: fd });
    const j = await res.json();
    if (j && j.ok) {
      countEl.textContent = j.likes;
      // feedback simples
      btn.style.color = '#ff5e5e';
    }
  } catch (err) {
    console.error('Erro like', err);
  }
}

// Monta árvore de comentários e replies
function buildTree(items) {
  const map = {};
  items.forEach(i => { i.replies = []; map[i.id] = i; });
  const roots = [];
  items.forEach(i => {
    if (i.parentId) {
      if (map[i.parentId]) map[i.parentId].replies.push(i);
      else roots.push(i); // fallback
    } else roots.push(i);
  });
  return roots;
}

// Renderiza lista de comentários (async porque avatar usa crypto)
async function renderList(items) {
  const container = document.getElementById('jsy-list');
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="jsy-empty">Seja o primeiro a comentar!</div>';
    document.getElementById('jsy-count').textContent = '0';
    return;
  }

  const tree = buildTree(items);
  document.getElementById('jsy-count').textContent = String(items.length);

  for (const c of tree) {
    const el = await renderComment(c);
    container.appendChild(el);
    if (c.replies && c.replies.length) {
      for (const r of c.replies) {
        const er = await renderReply(r);
        container.appendChild(er);
      }
    }
  }
}

// Render comentário principal
async function renderComment(c) {
  const wrapper = document.createElement('div');
  wrapper.className = 'jsy-msg';
  wrapper.innerHTML = `
    <div class="jsy-reply-line" style="display:none"></div>
    <img class="jsy-avatar" src="" alt="avatar">
    <div class="jsy-content">
      <div><span class="jsy-name"></span></div>
      <div class="jsy-date"></div>
      <div class="jsy-text"></div>
      <div class="jsy-actions">
        <button class="jsy-reply-btn">Responder</button>
        <button class="jsy-like-btn">❤️</button>
        <span class="jsy-like-count"></span>
      </div>
    </div>
  `;

  // preencher dados (avatar async)
  const img = wrapper.querySelector('.jsy-avatar');
  img.src = await gravatarUrl(c.email);

  wrapper.querySelector('.jsy-name').textContent = c.nome || 'Anônimo';
  if (c.admin === 'true') {
    const adminTag = document.createElement('span');
    adminTag.className = 'jsy-admin';
    adminTag.textContent = 'ADMIN';
    wrapper.querySelector('.jsy-name').appendChild(adminTag);
  }
  wrapper.querySelector('.jsy-date').textContent = c.data;
  wrapper.querySelector('.jsy-text').textContent = c.mensagem;
  const likeBtn = wrapper.querySelector('.jsy-like-btn');
  const likeCount = wrapper.querySelector('.jsy-like-count');
  likeCount.textContent = String(c.likes || 0);

  // actions
  likeBtn.addEventListener('click', () => enviarLike(c.id, likeBtn, likeCount));

  const replyBtn = wrapper.querySelector('.jsy-reply-btn');
  replyBtn.addEventListener('click', () => {
    // coloca parentId no form e foca textarea
    const form = document.getElementById('jsy-form');
    form['parentId'].value = c.id;
    form.scrollIntoView({ behavior: 'smooth' });
    form.querySelector('textarea[name="mensagem"]').focus();
  });

  return wrapper;
}

// Render reply (visually connected)
async function renderReply(r) {
  const wrapper = document.createElement('div');
  wrapper.className = 'jsy-reply';
  wrapper.innerHTML = `
    <img class="jsy-avatar" src="" alt="avatar" style="width:36px;height:36px;">
    <div class="jsy-content">
      <div><span class="jsy-name"></span></div>
      <div class="jsy-date"></div>
      <div class="jsy-text"></div>
      <div class="jsy-actions">
        <button class="jsy-like-btn">❤️</button>
        <span class="jsy-like-count"></span>
      </div>
    </div>
  `;

  const img = wrapper.querySelector('.jsy-avatar');
  img.src = await gravatarUrl(r.email);
  wrapper.querySelector('.jsy-name').textContent = r.nome || 'Anônimo';
  if (r.admin === 'true') {
    const adminTag = document.createElement('span');
    adminTag.className = 'jsy-admin';
    adminTag.textContent = 'ADMIN';
    wrapper.querySelector('.jsy-name').appendChild(adminTag);
  }
  wrapper.querySelector('.jsy-date').textContent = r.data;
  wrapper.querySelector('.jsy-text').textContent = r.mensagem;
  const likeBtn = wrapper.querySelector('.jsy-like-btn');
  const likeCount = wrapper.querySelector('.jsy-like-count');
  likeCount.textContent = String(r.likes || 0);
  likeBtn.addEventListener('click', () => enviarLike(r.id, likeBtn, likeCount));

  return wrapper;
}

// Carrega comentários via GET ?page=...
async function carregarComentarios() {
  const url = `${SCRIPT_URL}?page=${encodeURIComponent(PAGE)}`;
  try {
    const res = await fetch(url);
    const items = await res.json();
    await renderList(items);
  } catch (err) {
    console.error('Erro carregar comentários', err);
    const container = document.getElementById('jsy-list');
    if (container) container.innerHTML = '<div class="jsy-empty">Erro ao carregar comentários.</div>';
  }
}

// Setup envio de formulário
(function setupForm() {
  const form = document.getElementById('jsy-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // validar
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const mensagem = form.mensagem.value.trim();
    if (!mensagem) { alert('Escreva uma mensagem'); return; }
    // envia
    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('email', email);
    fd.append('mensagem', mensagem);
    fd.append('page', PAGE);
    fd.append('parentId', form.parentId.value || '');
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: fd });
      const text = await res.text();
      document.getElementById('jsy-status').textContent = text;
      form.reset();
      form.parentId.value = '';
      await carregarComentarios();
      setTimeout(()=> document.getElementById('jsy-status').textContent = '', 2500);
    } catch (err) {
      console.error('Erro enviar', err);
      document.getElementById('jsy-status').textContent = 'Erro ao enviar';
    }
  });
})();

// inicializa
carregarComentarios();
