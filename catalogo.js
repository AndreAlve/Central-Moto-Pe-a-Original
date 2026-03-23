// ═══════════════════════════════════════════════════════
//  CATÁLOGO — catalogo.js
// ═══════════════════════════════════════════════════════

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
    mostrarPecas(carregarProdutos())
})

// ── CARREGAR PRODUTOS DO LOCALSTORAGE ─────────────────
// Sincronizado com gerenciar-produtos.js
function carregarProdutos() {
    let lista = JSON.parse(localStorage.getItem("produtosAdmin"))
    if (!lista || lista.length === 0) {
        // Fallback para o array padrão do script.js
        return typeof pecas !== "undefined" ? pecas : []
    }
    return lista
}

// ── EMOJI POR TIPO DE PEÇA ────────────────────────────
function iconeEmoji(nome) {
    nome = (nome || "").toLowerCase()
    if (nome.includes("pneu")) return "🛞"
    if (nome.includes("freio") || nome.includes("pastilha")) return "🛑"
    if (nome.includes("óleo") || nome.includes("filtro")) return "🛢️"
    if (nome.includes("corrente") || nome.includes("relação")) return "⛓️"
    if (nome.includes("vela")) return "⚡"
    if (nome.includes("cabo")) return "🔌"
    if (nome.includes("amortecedor")) return "🔧"
    return "🔩"
}

// ── EXIBIR PEÇAS ──────────────────────────────────────
function mostrarPecas(lista) {
    let container = document.getElementById("containerPecas")
    if (!container) return

    if (lista.length === 0) {
        container.innerHTML = "<p class='aviso'>Nenhuma peça encontrada.</p>"
        return
    }

    let html = ""
    for (let i = 0; i < lista.length; i++) {
        let p = lista[i]

        let badgeClass = "badge-verde"
        let badgeTexto = "Em estoque"
        if ((p.estoque || 0) === 0) { badgeClass = "badge-vermelho"; badgeTexto = "Sem estoque" }
        else if ((p.estoque || 0) < 6) { badgeClass = "badge-amarelo"; badgeTexto = "Últimas unidades" }

        let semEstoque = (p.estoque || 0) === 0
        let nomeEsc = (p.nome || "").replace(/'/g, "\\'")

        // Foto ou fallback com emoji
        let fotoHtml = p.foto
            ? `<img class="peca-foto" src="${p.foto}" alt="${p.nome}">`
            : `<div class="foto-fallback">
           ${iconeEmoji(p.nome)}
           <p>${p.nome}</p>
         </div>`

        html += `
      <div class="peca-card">
        <div class="peca-foto-wrap">
          ${fotoHtml}
        </div>
        <div class="peca-info">
          <div class="peca-nome">${p.nome}</div>
          ${p.descricao ? `<div class="peca-desc">${p.descricao}</div>` : ""}
          <div class="peca-marca">${p.marca || ""}</div>
          <div class="peca-preco">R$ ${(p.preco || 0).toFixed(2)}</div>
          <span class="badge ${badgeClass}">${badgeTexto} (${p.estoque || 0})</span>
          <button class="botao-peca"
            ${semEstoque
                ? "disabled"
                : `onclick="pedirPeca('${nomeEsc}', ${p.preco || 0})"`}>
            ${semEstoque ? "Sem estoque" : "Pedir Orçamento"}
          </button>
        </div>
      </div>`
    }

    container.innerHTML = html
}

// ── BUSCAR / FILTRAR ──────────────────────────────────
function buscarPeca() {
    let termo = (document.getElementById("inputBusca").value || "").toLowerCase()
    let filtro = document.getElementById("filtroCatalogo").value
    let lista = carregarProdutos()

    let filtrada = lista.filter(function (p) {
        let okBusca = !termo ||
            (p.nome || "").toLowerCase().includes(termo) ||
            (p.descricao || "").toLowerCase().includes(termo) ||
            (p.marca || "").toLowerCase().includes(termo)
        let okMarca = !filtro || p.marca === filtro
        return okBusca && okMarca
    })

    mostrarPecas(filtrada)
}

// ── PEDIR ORÇAMENTO ───────────────────────────────────
function pedirPeca(nome, preco) {
    localStorage.setItem("pecaSelecionada", JSON.stringify({ nome: nome, preco: preco }))
    window.location.href = "servicos.html"
}
