/* ==========================================================
   Nice Bolos — Cardápio com Navegação
   Arquivo de lógica (JavaScript)
   ========================================================== */

// ---------- Configuração ----------
const NUMERO_LOJA = "5531999999999"; // TODO: trocar pelo número real da loja

const CARDAPIO = [
  { id: "bolo-choc", nome: "Bolo de Chocolate", categoria: "bolos", preco: 45.0, unidade: "un" },
  { id: "bolo-cenoura", nome: "Bolo de Cenoura c/ Cobertura", categoria: "bolos", preco: 40.0, unidade: "un" },
  { id: "coxinha", nome: "Coxinha de Frango", categoria: "salgados", preco: 4.5, unidade: "un (mín. 20)" },
  { id: "risole", nome: "Risole de Camarão", categoria: "salgados", preco: 5.5, unidade: "un (mín. 20)" },
  { id: "brigadeiro", nome: "Brigadeiro Gourmet", categoria: "doces", preco: 3.0, unidade: "un (mín. 15)" },
  { id: "beijinho", nome: "Beijinho", categoria: "doces", preco: 3.0, unidade: "un (mín. 15)" },
  { id: "suco", nome: "Suco Natural (1L)", categoria: "bebidas", preco: 12.0, unidade: "un" },
  { id: "refri", nome: "Refrigerante (2L)", categoria: "bebidas", preco: 10.0, unidade: "un" },
];

let carrinho = {};

// ---------- Renderiza cada item na sua seção correspondente ----------
function renderCardapio() {
  document.querySelectorAll(".menu-section").forEach((section) => {
    const categoria = section.id;
    const container = section.querySelector("[data-menu]");
    const itens = CARDAPIO.filter((i) => i.categoria === categoria);

    itens.forEach((item) => {
      const el = document.createElement("div");
      el.className = "menu-item";
      el.innerHTML = `
        <div class="info">
          <h3>${item.nome}</h3>
          <p>${item.unidade}</p>
        </div>
        <span class="price">${formatarMoeda(item.preco)}</span>
        <button class="add-btn">+ Adicionar</button>
      `;
      el.querySelector(".add-btn").addEventListener("click", () => adicionarAoCarrinho(item.id));
      container.appendChild(el);
    });
  });
}

// ---------- Navegação por botões (âncoras) ----------
function configurarNavegacao() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = document.querySelector(btn.dataset.target);
      alvo.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Destaca o botão da seção atual calculando a posição de rolagem diretamente.
  // Isso é mais confiável que IntersectionObserver quando as seções são curtas,
  // porque não depende de uma "faixa" fixa onde mais de uma seção pode caber ao mesmo tempo.
  const sections = Array.from(document.querySelectorAll(".menu-section"));
  const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
  const navBar = document.querySelector(".nav-bar");

  function atualizarBotaoAtivo() {
    const offset = navBar.offsetHeight + 16; // compensa a altura da nav fixa
    const posicaoAtual = window.scrollY + offset;

    // percorre as seções e guarda a última cujo topo já foi ultrapassado
    let secaoAtiva = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= posicaoAtual) secaoAtiva = s;
    }

    navButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.target === "#" + secaoAtiva.id);
    });
  }

  window.addEventListener("scroll", atualizarBotaoAtivo, { passive: true });
  window.addEventListener("resize", atualizarBotaoAtivo);
  atualizarBotaoAtivo(); // define o estado inicial ao carregar a página
}

// ---------- Carrinho ----------
function adicionarAoCarrinho(id) {
  carrinho[id] = (carrinho[id] || 0) + 1;
  renderCarrinho();
  abrirCarrinho();
}

function alterarQuantidade(id, delta) {
  if (!carrinho[id]) return;
  carrinho[id] += delta;
  if (carrinho[id] <= 0) delete carrinho[id];
  renderCarrinho();
}

function renderCarrinho() {
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const totalEl = document.getElementById("cart-total");
  const sendBtn = document.getElementById("send-btn");
  const fabCount = document.getElementById("fab-count");

  const ids = Object.keys(carrinho);
  itemsEl.innerHTML = "";

  const totalItens = ids.reduce((acc, id) => acc + carrinho[id], 0);
  fabCount.textContent = totalItens;

  if (ids.length === 0) {
    emptyEl.style.display = "block";
    totalEl.style.display = "none";
    sendBtn.disabled = true;
    return;
  }

  emptyEl.style.display = "none";
  totalEl.style.display = "flex";
  sendBtn.disabled = false;

  let totalGeral = 0;
  ids.forEach((id) => {
    const item = CARDAPIO.find((p) => p.id === id);
    const qtd = carrinho[id];
    const subtotal = item.preco * qtd;
    totalGeral += subtotal;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <div class="name">${item.nome}</div>
      </div>
      <div class="qty-control">
        <button aria-label="Diminuir">−</button>
        <span class="qty-val">${qtd}</span>
        <button aria-label="Aumentar">+</button>
      </div>
      <div class="row-price">${formatarMoeda(subtotal)}</div>
    `;
    const [btnMenos, btnMais] = row.querySelectorAll(".qty-control button");
    btnMenos.addEventListener("click", () => alterarQuantidade(id, -1));
    btnMais.addEventListener("click", () => alterarQuantidade(id, 1));
    itemsEl.appendChild(row);
  });

  document.getElementById("total-value").textContent = formatarMoeda(totalGeral);
}

function abrirCarrinho() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function fecharCarrinho() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// ---------- Envio via WhatsApp ----------
function enviarPedido() {
  const ids = Object.keys(carrinho);
  if (ids.length === 0) return;

  const nome = document.getElementById("nome-cliente").value.trim();
  const data = document.getElementById("data-entrega").value;
  const hora = document.getElementById("hora-entrega").value;

  let totalGeral = 0;
  const linhas = ids.map((id) => {
    const item = CARDAPIO.find((p) => p.id === id);
    const qtd = carrinho[id];
    const subtotal = item.preco * qtd;
    totalGeral += subtotal;
    return `• ${qtd}x ${item.nome} — ${formatarMoeda(subtotal)}`;
  });

  let mensagem = `Olá! Gostaria de fazer o seguinte pedido:\n\n${linhas.join("\n")}\n\n*Total: ${formatarMoeda(totalGeral)}*`;
  if (data) mensagem += `\n📅 Data desejada: ${formatarData(data)}`;
  if (hora) mensagem += `\n🕐 Horário: ${hora}`;
  if (nome) mensagem += `\n👤 Nome: ${nome}`;

  const url = `https://wa.me/${NUMERO_LOJA}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

// ---------- Utilidades ----------
function formatarMoeda(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// ---------- Inicialização ----------
renderCardapio();
configurarNavegacao();
renderCarrinho();
