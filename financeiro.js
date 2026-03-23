// ═══════════════════════════════════════════════════════
//  FINANCEIRO — financeiro.js
// ═══════════════════════════════════════════════════════

let periodoAtual = "hoje"
let categSelecionada = ""

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
    renderTudo()
    document.getElementById("modalSaida").addEventListener("click", function (e) {
        if (e.target === this) fecharModalSaida()
    })
})

// ── HELPERS ───────────────────────────────────────────
function getSaidas() {
    return JSON.parse(localStorage.getItem("saidas")) || []
}

function setSaidas(lista) {
    localStorage.setItem("saidas", JSON.stringify(lista))
}

function getHistorico() {
    return JSON.parse(localStorage.getItem("historico")) || []
}

function fmt(val) {
    return "R$ " + (val || 0).toFixed(2).replace(".", ",")
}

function toast(msg, cor) {
    let t = document.getElementById("toast")
    t.textContent = msg
    t.className = "toast " + (cor || "") + " visivel"
    setTimeout(function () { t.classList.remove("visivel") }, 2500)
}

// ── FILTRO DE PERÍODO ─────────────────────────────────
function setPeriodo(periodo, btn) {
    periodoAtual = periodo
    document.querySelectorAll(".periodo-btn").forEach(function (b) {
        b.classList.remove("ativo")
    })
    btn.classList.add("ativo")
    renderTudo()
}

function dentroDoperiodo(dataStr) {
    if (!dataStr || periodoAtual === "tudo") return true

    // Aceita DD/MM/YYYY e YYYY-MM-DD
    let data
    if (dataStr.includes("/")) {
        let p = dataStr.split("/")
        data = new Date(p[2], p[1] - 1, p[0])
    } else {
        data = new Date(dataStr)
    }

    let hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (periodoAtual === "hoje") {
        return data.toDateString() === hoje.toDateString()
    }

    if (periodoAtual === "semana") {
        let inicio = new Date(hoje)
        inicio.setDate(hoje.getDate() - hoje.getDay())
        return data >= inicio
    }

    if (periodoAtual === "mes") {
        return data.getMonth() === hoje.getMonth() &&
            data.getFullYear() === hoje.getFullYear()
    }

    return true
}

// ── RENDERIZAR TUDO ───────────────────────────────────
function renderTudo() {
    let historico = getHistorico().filter(function (h) {
        return dentroDoperiodo(h.data)
    })
    let saidas = getSaidas().filter(function (s) {
        return dentroDoperiodo(s.data)
    })

    let totalEntradas = historico.reduce(function (a, h) { return a + (h.valor || 0) }, 0)
    let totalSaidas = saidas.reduce(function (a, s) { return a + (s.valor || 0) }, 0)
    let totalLucro = totalEntradas - totalSaidas

    // Cards resumo
    document.getElementById("totalEntradas").textContent = fmt(totalEntradas)
    document.getElementById("totalSaidas").textContent = fmt(totalSaidas)
    document.getElementById("totalLucro").textContent = fmt(totalLucro)
    document.getElementById("totalLucro").style.color =
        totalLucro >= 0 ? "#f5c400" : "#f87171"

    // Breakdown por forma de pagamento
    let pgtos = {}
    historico.forEach(function (h) {
        let p = h.pagamento || "Não informado"
        pgtos[p] = (pgtos[p] || 0) + (h.valor || 0)
    })

    let pgtoHtml = Object.keys(pgtos).map(function (p) {
        let icone = p.includes("Pix") ? "📲"
            : p.includes("Débito") ? "💳"
                : p.includes("Crédito") ? "💳"
                    : p.includes("Dinheiro") ? "💵"
                        : p.includes("Pendente") ? "⏳"
                            : "💰"
        return `
      <div class="pgto-card">
        <div class="pgto-card-val">${icone} ${fmt(pgtos[p])}</div>
        <div class="pgto-card-label">${p}</div>
      </div>`
    }).join("")

    document.getElementById("pagamentosGrid").innerHTML =
        pgtoHtml || `<div style="color:#333;font-size:13px;padding:8px">Nenhuma entrada no período</div>`

    // Lançamentos, entradas e saídas
    renderLancamentos(historico, saidas)
    renderEntradas(historico)
    renderSaidas(saidas)
}

// ── TROCAR ABA ────────────────────────────────────────
function trocarAba(id, btn) {
    document.querySelectorAll(".aba-conteudo").forEach(function (a) {
        a.classList.remove("ativo")
    })
    document.querySelectorAll(".aba").forEach(function (b) {
        b.classList.remove("ativa")
    })
    document.getElementById("aba-" + id).classList.add("ativo")
    btn.classList.add("ativa")
}

// ── LANÇAMENTOS (entradas + saídas misturadas) ────────
function renderLancamentos(entradas, saidas) {
    let lancamentos = [
        ...entradas.map(function (h) {
            return {
                tipo: "entrada",
                desc: h.servico + " — " + h.nome,
                val: h.valor || 0,
                meta: (h.pagamento || "—") + (h.funcionario ? " · 👨‍🔧 " + h.funcionario : ""),
                data: h.data,
                id: null // entradas não são deletáveis daqui
            }
        }),
        ...saidas.map(function (s) {
            return {
                tipo: "saida",
                desc: s.desc,
                val: s.valor || 0,
                meta: s.categ || "Outros",
                data: s.data,
                id: s.id
            }
        })
    ]

    // Ordena mais recente primeiro
    lancamentos.sort(function (a, b) {
        return (b.data || "").localeCompare(a.data || "")
    })

    let div = document.getElementById("listaLancamentos")

    if (lancamentos.length === 0) {
        div.innerHTML = `<div class="empty-state"><span>📋</span>Nenhum lançamento no período.</div>`
        return
    }

    div.innerHTML = lancamentos.map(function (l) {
        let icone = l.tipo === "entrada" ? "⬆️" : "⬇️"
        let sinal = l.tipo === "entrada" ? "+" : "−"
        return `
      <div class="lanc-card">
        <div class="lanc-icone ${l.tipo}">${icone}</div>
        <div class="lanc-info">
          <div class="lanc-desc">${l.desc}</div>
          <div class="lanc-meta">${l.meta}</div>
        </div>
        <div class="lanc-dir">
          <div class="lanc-val ${l.tipo}">${sinal} ${fmt(l.val)}</div>
          <div class="lanc-data">📅 ${l.data || "—"}</div>
        </div>
        ${l.id
                ? `<button class="btn-del-lanc" onclick="excluirSaida(${l.id})" title="Excluir">🗑️</button>`
                : `<div style="width:30px"></div>`}
      </div>`
    }).join("")
}

// ── ENTRADAS ──────────────────────────────────────────
function renderEntradas(entradas) {
    let div = document.getElementById("listaEntradas")

    if (entradas.length === 0) {
        div.innerHTML = `<div class="empty-state"><span>⬆️</span>Nenhuma entrada no período.</div>`
        return
    }

    let sorted = [...entradas].sort(function (a, b) {
        return (b.data || "").localeCompare(a.data || "")
    })

    div.innerHTML = sorted.map(function (h) {
        return `
      <div class="lanc-card">
        <div class="lanc-icone entrada">⬆️</div>
        <div class="lanc-info">
          <div class="lanc-desc">🔧 ${h.servico} — ${h.nome}</div>
          <div class="lanc-meta">
            🏍️ ${h.moto || "—"}
            ${h.funcionario ? " · 👨‍🔧 " + h.funcionario : ""}
            ${h.pagamento ? " · 💳 " + h.pagamento : ""}
          </div>
        </div>
        <div class="lanc-dir">
          <div class="lanc-val entrada">+ ${fmt(h.valor)}</div>
          <div class="lanc-data">📅 ${h.data || "—"}</div>
        </div>
        <div style="width:30px"></div>
      </div>`
    }).join("")
}

// ── SAÍDAS ────────────────────────────────────────────
function renderSaidas(saidas) {
    let div = document.getElementById("listaSaidas")

    if (saidas.length === 0) {
        div.innerHTML = `<div class="empty-state"><span>⬇️</span>Nenhuma saída no período.</div>`
        return
    }

    let sorted = [...saidas].sort(function (a, b) {
        return (b.data || "").localeCompare(a.data || "")
    })

    div.innerHTML = sorted.map(function (s) {
        let iconeCateg = s.categ === "Peças" ? "🔩"
            : s.categ === "Conta" ? "💡"
                : s.categ === "Salário" ? "👷"
                    : s.categ === "Combustível" ? "⛽"
                        : "📦"
        return `
      <div class="lanc-card">
        <div class="lanc-icone saida">${iconeCateg}</div>
        <div class="lanc-info">
          <div class="lanc-desc">${s.desc}</div>
          <div class="lanc-meta">${s.categ || "Outros"}</div>
        </div>
        <div class="lanc-dir">
          <div class="lanc-val saida">− ${fmt(s.valor)}</div>
          <div class="lanc-data">📅 ${s.data || "—"}</div>
        </div>
        <button class="btn-del-lanc" onclick="excluirSaida(${s.id})" title="Excluir">🗑️</button>
      </div>`
    }).join("")
}

// ── EXCLUIR SAÍDA ─────────────────────────────────────
function excluirSaida(id) {
    if (!confirm("Excluir este lançamento?")) return
    let lista = getSaidas().filter(function (s) { return s.id !== id })
    setSaidas(lista)
    renderTudo()
    toast("🗑️ Lançamento excluído", "vermelho")
}

// ── MODAL NOVA SAÍDA ──────────────────────────────────
function abrirModalSaida() {
    categSelecionada = ""
    let hoje = new Date().toISOString().split("T")[0]

    document.getElementById("modalSaidaBox").innerHTML = `
    <div class="modal-topo">
      <h3>⬇️ Nova Saída</h3>
      <button class="btn-fechar-modal" onclick="fecharModalSaida()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">📋 Categoria</div>
      <div class="categorias-grid">
        <div class="categ-btn" onclick="selecionarCateg('Peças', this)">
          🔩 Compra de peças
        </div>
        <div class="categ-btn" onclick="selecionarCateg('Conta', this)">
          💡 Conta (luz, água, aluguel)
        </div>
        <div class="categ-btn" onclick="selecionarCateg('Salário', this)">
          👷 Salário de funcionário
        </div>
        <div class="categ-btn" onclick="selecionarCateg('Combustível', this)">
          ⛽ Combustível
        </div>
        <div class="categ-btn" onclick="selecionarCateg('Ferramentas', this)">
          🔧 Ferramentas / equipamentos
        </div>
        <div class="categ-btn" onclick="selecionarCateg('Outros', this)">
          📦 Outros
        </div>
      </div>

      <div class="modal-secao-titulo">💰 Valores</div>

      <label>Descrição *</label>
      <input id="saidaDesc" type="text"
             placeholder="Ex: Compra de pastilhas de freio Honda...">

      <label>Valor (R$) *</label>
      <input id="saidaValor" type="number" step="0.01" placeholder="0.00">

      <label>Data *</label>
      <input id="saidaData" type="date" value="${hoje}">

      <div class="modal-acoes">
        <button class="btn-modal-salvar" onclick="salvarSaida()">
          💾 Salvar saída
        </button>
        <button class="btn-modal-sec" onclick="fecharModalSaida()">Cancelar</button>
      </div>

    </div>
  `

    document.getElementById("modalSaida").classList.add("aberto")
}

function selecionarCateg(categ, el) {
    categSelecionada = categ
    document.querySelectorAll(".categ-btn").forEach(function (b) {
        b.classList.remove("selecionado")
    })
    el.classList.add("selecionado")
}

function salvarSaida() {
    let desc = document.getElementById("saidaDesc").value.trim()
    let valor = parseFloat(document.getElementById("saidaValor").value) || 0
    let data = document.getElementById("saidaData").value

    if (!categSelecionada) { alert("Selecione a categoria!"); return }
    if (!desc) { alert("Preencha a descrição!"); return }
    if (!valor) { alert("Preencha o valor!"); return }
    if (!data) { alert("Selecione a data!"); return }

    let dataFmt = data.split("-").reverse().join("/")

    let lista = getSaidas()
    lista.push({
        id: Date.now(),
        desc: desc,
        valor: valor,
        categ: categSelecionada,
        data: dataFmt
    })
    setSaidas(lista)

    fecharModalSaida()
    renderTudo()
    toast("✅ Saída registrada!", "verde")
}

function fecharModalSaida() {
    document.getElementById("modalSaida").classList.remove("aberto")
}