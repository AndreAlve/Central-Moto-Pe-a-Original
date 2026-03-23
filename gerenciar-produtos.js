// ═══════════════════════════════════════════════════════
//  GERENCIAR PRODUTOS — gerenciar-produtos.js
// ═══════════════════════════════════════════════════════

// ── PRODUTOS PADRÃO ───────────────────────────────────
const PRODUTOS_PADRAO = [
  { id: 1, nome: "Pastilha de Freio", marca: "Honda", preco: 45.00, custo: 0, estoque: 12, descricao: "Pastilha de freio dianteiro", codigo: "" },
  { id: 2, nome: "Vela de Ignição", marca: "Yamaha", preco: 18.50, custo: 0, estoque: 30, descricao: "Vela de ignição NGK", codigo: "" },
  { id: 3, nome: "Corrente 428", marca: "Honda", preco: 89.90, custo: 0, estoque: 5, descricao: "Corrente de transmissão 428 links", codigo: "" },
  { id: 4, nome: "Filtro de Óleo", marca: "Honda", preco: 22.00, custo: 0, estoque: 20, descricao: "Filtro de óleo motor", codigo: "" },
  { id: 5, nome: "Pneu Traseiro 90/90", marca: "Yamaha", preco: 189.00, custo: 0, estoque: 3, descricao: "Pneu traseiro aro 18", codigo: "" },
  { id: 6, nome: "Amortecedor Traseiro", marca: "Honda", preco: 320.00, custo: 0, estoque: 0, descricao: "Amortecedor traseiro original", codigo: "" },
  { id: 7, nome: "Cabo de Acelerador", marca: "Suzuki", preco: 35.00, custo: 0, estoque: 8, descricao: "Cabo de acelerador completo", codigo: "" },
  { id: 8, nome: "Relação Completa CG", marca: "Honda", preco: 145.00, custo: 0, estoque: 6, descricao: "Kit relação coroa, pinhão e corrente", codigo: "" }
]

// ── HELPERS ───────────────────────────────────────────
function getProdutos() {
  let lista = JSON.parse(localStorage.getItem("produtosAdmin"))
  if (!lista || lista.length === 0) {
    lista = PRODUTOS_PADRAO
    localStorage.setItem("produtosAdmin", JSON.stringify(lista))
  }
  return lista
}

function setProdutos(lista) {
  localStorage.setItem("produtosAdmin", JSON.stringify(lista))
}

function iconeEmoji(nome) {
  nome = (nome || "").toLowerCase()
  if (nome.includes("pneu")) return "🛞"
  if (nome.includes("freio") || nome.includes("pastilha")) return "🛑"
  if (nome.includes("óleo") || nome.includes("filtro")) return "🛢️"
  if (nome.includes("corrente") || nome.includes("relação")) return "⛓️"
  if (nome.includes("vela")) return "⚡"
  if (nome.includes("cabo")) return "🔌"
  if (nome.includes("amortecedor")) return "🔧"
  if (nome.includes("piston") || nome.includes("pistão")) return "⚙️"
  return "🔩"
}

function toast(msg, cor) {
  let t = document.getElementById("toast")
  t.textContent = msg
  t.className = "toast " + (cor || "") + " visivel"
  setTimeout(function () { t.classList.remove("visivel") }, 2500)
}

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
  renderProdutos()

  document.getElementById("modalProduto").addEventListener("click", function (e) {
    if (e.target === this) fecharModalProduto()
  })
  document.getElementById("modalConfirmar").addEventListener("click", function (e) {
    if (e.target === this) fecharModalConfirmar()
  })
})

// ── RENDERIZAR ────────────────────────────────────────
function renderProdutos() {
  let lista = getProdutos()
  let busca = (document.getElementById("inputBuscaProd").value || "").toLowerCase()
  let filtro = document.getElementById("filtroMarca").value

  let filtrada = lista.filter(function (p) {
    let okBusca = !busca ||
      p.nome.toLowerCase().includes(busca) ||
      (p.descricao || "").toLowerCase().includes(busca) ||
      (p.codigo || "").toLowerCase().includes(busca)
    let okMarca = !filtro || p.marca === filtro
    return okBusca && okMarca
  })

  // Atualiza contadores
  let ok = lista.filter(function (p) { return p.estoque >= 6 }).length
  let baixo = lista.filter(function (p) { return p.estoque > 0 && p.estoque < 6 }).length
  let zerado = lista.filter(function (p) { return p.estoque === 0 }).length

  document.getElementById("qtdOk").textContent = ok
  document.getElementById("qtdBaixo").textContent = baixo
  document.getElementById("qtdZerado").textContent = zerado
  document.getElementById("totalBadge").textContent =
    lista.length + " produto" + (lista.length !== 1 ? "s" : "")

  let div = document.getElementById("listaProdutos")

  if (filtrada.length === 0) {
    div.innerHTML = `
      <div class="empty-state">
        <span>🔍</span>
        Nenhum produto encontrado.
      </div>`
    return
  }

  div.innerHTML = filtrada.map(function (p) {
    let idx = lista.indexOf(p)
    if (idx === -1) idx = lista.findIndex(function (x) { return x.id === p.id })

    let est = p.estoque || 0
    let estCls = est === 0 ? "est-tag-zerado" : est < 6 ? "est-tag-baixo" : "est-tag-ok"
    let estTxt = est === 0 ? "Sem estoque" : est < 6 ? "Estoque baixo" : "Em estoque"
    let estColor = est === 0 ? "#f87171" : est < 6 ? "#f5c400" : "#4ade80"

    let lucro = (p.custo && p.custo > 0)
      ? `<div class="prod-lucro">lucro R$ ${(p.preco - p.custo).toFixed(2)}</div>`
      : ""
    let custo = (p.custo && p.custo > 0)
      ? `<div class="prod-custo">custo R$ ${p.custo.toFixed(2)}</div>`
      : ""

    return `
      <div class="produto-item">
        <div class="prod-emoji">${iconeEmoji(p.nome)}</div>

        <div class="prod-info">
          <div class="prod-nome">${p.nome}</div>
          ${p.descricao ? `<div class="prod-desc">${p.descricao}</div>` : ""}
          <div class="prod-marcas">
            <span class="marca-tag">${p.marca}</span>
            ${p.codigo ? `<span class="marca-tag">📋 ${p.codigo}</span>` : ""}
          </div>
        </div>

        <div style="text-align:right;flex-shrink:0">
          <div class="prod-preco">R$ ${(p.preco || 0).toFixed(2)}</div>
          ${custo}
          ${lucro}
        </div>

        <div class="prod-estoque">
          <div class="est-controle">
            <button class="btn-est btn-est-menos"
              onclick="ajustarEstoque(${idx}, -1)">−</button>
            <div class="est-num-inline" style="color:${estColor};min-width:26px;text-align:center">
              ${est}
            </div>
            <button class="btn-est btn-est-mais"
              onclick="ajustarEstoque(${idx}, +1)">＋</button>
          </div>
          <span class="est-tag ${estCls}">${estTxt}</span>
        </div>

        <div class="prod-acoes">
          <button class="btn-prod-acao btn-edit"
            onclick="abrirModalEditar(${idx})" title="Editar">✏️</button>
          <button class="btn-prod-acao btn-del"
            onclick="confirmarExcluir(${idx})" title="Remover">🗑️</button>
        </div>
      </div>`
  }).join("")
}

// ── AJUSTE RÁPIDO DE ESTOQUE ──────────────────────────
function ajustarEstoque(idx, delta) {
  let lista = getProdutos()
  lista[idx].estoque = Math.max(0, (lista[idx].estoque || 0) + delta)
  setProdutos(lista)
  renderProdutos()
  toast(delta > 0 ? "➕ Estoque aumentado" : "➖ Estoque reduzido",
    delta > 0 ? "verde" : "amarelo")
}

// ── MODAL ADICIONAR ───────────────────────────────────
function abrirModalAdd() {
  document.getElementById("modalProdutoBox").innerHTML = montarFormulario(null, -1)
  document.getElementById("modalProduto").classList.add("aberto")
}

// ── MODAL EDITAR ──────────────────────────────────────
function abrirModalEditar(idx) {
  let lista = getProdutos()
  let p = lista[idx]
  document.getElementById("modalProdutoBox").innerHTML = montarFormulario(p, idx)
  document.getElementById("modalProduto").classList.add("aberto")
}

// ── MONTAR FORMULÁRIO (add e editar usam o mesmo) ─────
function montarFormulario(p, idx) {
  let isEdit = idx !== -1
  return `
    <div class="modal-topo">
      <h3>${isEdit ? "✏️ Editar Produto" : "➕ Novo Produto"}</h3>
      <button class="btn-fechar-modal" onclick="fecharModalProduto()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">📋 Informações principais</div>
      <div class="modal-grid">
        <div class="modal-full">
          <label>Nome da peça *</label>
          <input id="fNome" type="text"
                placeholder="Ex: Pastilha de Freio Dianteira"
                value="${p ? p.nome : ""}">
        </div>
        <div class="modal-full">
          <label>Descrição</label>
          <input id="fDescricao" type="text"
                placeholder="Ex: Serve para CG 160 e Titan 160, par..."
                value="${p ? (p.descricao || "") : ""}">
        </div>
        <div>
          <label>Marca compatível *</label>
          <select id="fMarca">
            <option value="Honda"    ${p && p.marca === "Honda" ? "selected" : ""}>Honda</option>
            <option value="Yamaha"   ${p && p.marca === "Yamaha" ? "selected" : ""}>Yamaha</option>
            <option value="Suzuki"   ${p && p.marca === "Suzuki" ? "selected" : ""}>Suzuki</option>
            <option value="Kawasaki" ${p && p.marca === "Kawasaki" ? "selected" : ""}>Kawasaki</option>
            <option value="Universal"${p && p.marca === "Universal" ? "selected" : ""}>Universal</option>
            <option value="Outra"    ${p && p.marca === "Outra" ? "selected" : ""}>Outra</option>
          </select>
        </div>
        <div>
          <label>Código / Referência</label>
          <input id="fCodigo" type="text"
                placeholder="Ex: 06450-KWB (opcional)"
                value="${p ? (p.codigo || "") : ""}">
        </div>
      </div>

      <div class="modal-secao-titulo">💰 Valores e estoque</div>
      <div class="modal-grid">
        <div>
          <label>Preço de venda (R$) *</label>
          <input id="fPreco" type="number" step="0.01"
                 placeholder="0.00"
                 value="${p ? p.preco : ""}">
        </div>
        <div>
          <label>Preço de custo (R$)</label>
          <input id="fCusto" type="number" step="0.01"
                 placeholder="0.00 (opcional)"
                 value="${p && p.custo ? p.custo : ""}">
        </div>
        <div>
          <label>Quantidade em estoque *</label>
          <input id="fEstoque" type="number"
                 placeholder="0"
                 value="${p ? p.estoque : ""}">
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:2px">
          <div id="previewLucro"
               style="color:#4ade80;font-size:13px;font-weight:bold;padding:10px 0">
            ${p && p.custo && p.custo > 0
      ? "💹 Lucro: R$ " + (p.preco - p.custo).toFixed(2)
      : ""}
          </div>
        </div>
      </div>

      <div class="modal-secao-titulo">📸 Foto do produto</div>

      <div class="foto-upload-area" id="fotoUploadArea"
           onclick="document.getElementById('fFoto').click()">
        <input id="fFoto" type="file" accept="image/*"
               style="display:none" onchange="previewFotoProd(this)">
        <div id="fotoUploadPlaceholder">
          <span>📷</span>
          <p>Toque para adicionar uma foto</p>
          <small>JPG, PNG — a foto aparece no catálogo</small>
        </div>
        <img id="fotoUploadPreview" class="foto-upload-preview"
             src="${p && p.foto ? p.foto : ""}"
             style="${p && p.foto ? "display:block" : "display:none"}">
        <button class="btn-remover-foto-prod" id="btnRemoverFotoProd"
                onclick="removerFotoProd(event)"
                style="${p && p.foto ? "display:block" : "display:none"}">
          ✕ Remover foto
        </button>
      </div>

      <div class="modal-acoes">
        <button class="btn-modal-salvar" onclick="salvarProduto(${idx})">
          💾 ${isEdit ? "Salvar alterações" : "Adicionar produto"}
        </button>
        <button class="btn-modal-sec" onclick="fecharModalProduto()">Cancelar</button>
      </div>
    </div>
  `
}

// ── FOTO DO PRODUTO ───────────────────────────────────
function previewFotoProd(input) {
  if (!input.files || !input.files[0]) return
  let reader = new FileReader()
  reader.onload = function (e) {
    let preview = document.getElementById("fotoUploadPreview")
    let placeholder = document.getElementById("fotoUploadPlaceholder")
    let btnRemover = document.getElementById("btnRemoverFotoProd")
    preview.src = e.target.result
    preview.style.display = "block"
    placeholder.style.display = "none"
    btnRemover.style.display = "block"
  }
  reader.readAsDataURL(input.files[0])
}

function removerFotoProd(e) {
  if (e) e.stopPropagation()
  document.getElementById("fFoto").value = ""
  document.getElementById("fotoUploadPreview").src = ""
  document.getElementById("fotoUploadPreview").style.display = "none"
  document.getElementById("fotoUploadPlaceholder").style.display = "block"
  document.getElementById("btnRemoverFotoProd").style.display = "none"
}

// ── SALVAR PRODUTO ────────────────────────────────────
function salvarProduto(idx) {
  let nome = document.getElementById("fNome").value.trim()
  let descricao = document.getElementById("fDescricao").value.trim()
  let marca = document.getElementById("fMarca").value
  let codigo = document.getElementById("fCodigo").value.trim()
  let preco = parseFloat(document.getElementById("fPreco").value) || 0
  let custo = parseFloat(document.getElementById("fCusto").value) || 0
  let estoque = parseInt(document.getElementById("fEstoque").value) || 0
  let fotoInput = document.getElementById("fFoto")
  let fotoPreview = document.getElementById("fotoUploadPreview")

  if (!nome) { alert("Digite o nome da peça!"); return }
  if (!preco) { alert("Digite o preço de venda!"); return }

  function salvarComFoto(fotoBase64) {
    let lista = getProdutos()

    if (idx === -1) {
      lista.push({
        id: Date.now(),
        nome: nome,
        descricao: descricao,
        marca: marca,
        codigo: codigo,
        preco: preco,
        custo: custo,
        estoque: estoque,
        foto: fotoBase64 || null
      })
      toast("✅ Produto adicionado! Já aparece no catálogo!", "verde")
    } else {
      lista[idx] = {
        ...lista[idx],
        nome: nome,
        descricao: descricao,
        marca: marca,
        codigo: codigo,
        preco: preco,
        custo: custo,
        estoque: estoque,
        foto: fotoBase64 !== undefined ? fotoBase64 : lista[idx].foto
      }
      toast("✅ Produto atualizado!", "verde")
    }

    setProdutos(lista)
    fecharModalProduto()
    renderProdutos()
  }

  // Se tem foto nova selecionada, lê ela
  if (fotoInput.files && fotoInput.files[0]) {
    let reader = new FileReader()
    reader.onload = function (e) { salvarComFoto(e.target.result) }
    reader.readAsDataURL(fotoInput.files[0])
  } else {
    // Mantém foto que já estava ou null se foi removida
    let fotoAtual = (fotoPreview && fotoPreview.style.display !== "none" && fotoPreview.src)
      ? fotoPreview.src
      : null
    salvarComFoto(fotoAtual)
  }
}

// ── CONFIRMAR EXCLUSÃO ────────────────────────────────
function confirmarExcluir(idx) {
  let lista = getProdutos()
  let p = lista[idx]

  document.getElementById("modalConfirmarBox").innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icone">🗑️</div>
      <div class="confirm-titulo">Remover produto?</div>
      <div class="confirm-sub">
        <strong style="color:white">${p.nome}</strong><br>
        Isso vai remover do catálogo também!
      </div>
      <div class="confirm-acoes">
        <button class="btn-confirm-sim" onclick="excluirProduto(${idx})">
          Sim, remover
        </button>
        <button class="btn-confirm-nao" onclick="fecharModalConfirmar()">
          Cancelar
        </button>
      </div>
    </div>
  `
  document.getElementById("modalConfirmar").classList.add("aberto")
}

function excluirProduto(idx) {
  let lista = getProdutos()
  let nome = lista[idx].nome
  lista.splice(idx, 1)
  setProdutos(lista)
  fecharModalConfirmar()
  renderProdutos()
  toast("🗑️ " + nome + " removido!", "vermelho")
}

// ── FECHAR MODAIS ─────────────────────────────────────
function fecharModalProduto() { document.getElementById("modalProduto").classList.remove("aberto") }
function fecharModalConfirmar() { document.getElementById("modalConfirmar").classList.remove("aberto") }