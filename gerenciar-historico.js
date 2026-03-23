// ═══════════════════════════════════════════════════════
//  HISTÓRICO — historico.js
// ═══════════════════════════════════════════════════════

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
    carregarResumo()
    renderHistorico()

    document.getElementById("modalServico").addEventListener("click", function (e) {
        if (e.target === this) fecharModal()
    })
})

// ── HELPERS ───────────────────────────────────────────
function getHistorico() {
    return JSON.parse(localStorage.getItem("historico")) || []
}

function setHistorico(lista) {
    localStorage.setItem("historico", JSON.stringify(lista))
}

function toast(msg, cor) {
    let t = document.getElementById("toast")
    t.textContent = msg
    t.className = "toast " + (cor || "") + " visivel"
    setTimeout(function () { t.classList.remove("visivel") }, 2500)
}

function dentroDoperiodo(dataStr, periodo) {
    if (!periodo || periodo === "tudo") return true
    let data
    if (dataStr && dataStr.includes("/")) {
        let p = dataStr.split("/")
        data = new Date(p[2], p[1] - 1, p[0])
    } else {
        data = new Date(dataStr)
    }

    let hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (periodo === "hoje") return data.toDateString() === hoje.toDateString()
    if (periodo === "semana") {
        let ini = new Date(hoje)
        ini.setDate(hoje.getDate() - hoje.getDay())
        return data >= ini
    }
    if (periodo === "mes") {
        return data.getMonth() === hoje.getMonth() &&
            data.getFullYear() === hoje.getFullYear()
    }
    return true
}

function iconeServico(serv) {
    serv = (serv || "").toLowerCase()
    if (serv.includes("óleo")) return "🛢️"
    if (serv.includes("pneu")) return "🛞"
    if (serv.includes("corrente")) return "⛓️"
    if (serv.includes("freio") || serv.includes("pastilha")) return "🛑"
    if (serv.includes("vela")) return "⚡"
    if (serv.includes("revisão")) return "🔧"
    if (serv.includes("diagnós")) return "🔍"
    return "🏍️"
}

// ── RESUMO ────────────────────────────────────────────
function carregarResumo() {
    let hist = getHistorico()
    let hoje = new Date().toLocaleDateString("pt-BR")
    let clientes = new Set(hist.map(function (h) {
        return (h.telefone || "").replace(/\D/g, "")
    })).size

    let total = hist.reduce(function (a, h) { return a + (h.valor || 0) }, 0)
    let hojeQtd = hist.filter(function (h) { return h.data === hoje }).length

    document.getElementById("cardTotal").textContent = hist.length
    document.getElementById("cardFaturado").textContent =
        total >= 1000 ? "R$" + (total / 1000).toFixed(1) + "k" : "R$" + total.toFixed(0)
    document.getElementById("cardClientes").textContent = clientes
    document.getElementById("cardHoje").textContent = hojeQtd
}

// ── RENDERIZAR HISTÓRICO ──────────────────────────────
function renderHistorico() {
    let busca = (document.getElementById("inputBusca").value || "").toLowerCase()
    let servFil = document.getElementById("filtroServico").value
    let perFil = document.getElementById("filtroPeriodo").value

    let lista = getHistorico()

    // Filtros
    let filtrada = lista.filter(function (h) {
        let okBusca = !busca || (
            (h.nome || "").toLowerCase().includes(busca) ||
            (h.moto || "").toLowerCase().includes(busca) ||
            (h.placa || "").toLowerCase().includes(busca) ||
            (h.servico || "").toLowerCase().includes(busca) ||
            (h.pecas || "").toLowerCase().includes(busca)
        )
        let okServico = !servFil || h.servico === servFil
        let okPeriodo = dentroDoperiodo(h.data, perFil)
        return okBusca && okServico && okPeriodo
    })

    // Mais recente primeiro
    filtrada = [...filtrada].reverse()

    // Contagem
    let count = document.getElementById("resultadoCount")
    count.textContent = filtrada.length > 0
        ? filtrada.length + " serviço" + (filtrada.length !== 1 ? "s" : "") + " encontrado" + (filtrada.length !== 1 ? "s" : "")
        : ""

    let div = document.getElementById("listaHistorico")

    if (filtrada.length === 0) {
        div.innerHTML = `
      <div class="empty-state">
        <span>📜</span>
        Nenhum serviço encontrado.
      </div>`
        return
    }

    div.innerHTML = filtrada.map(function (h) {

        // Peças em tags
        let pecasHtml = ""
        if (h.pecas) {
            let lista = h.pecas.split(",").map(function (p) { return p.trim() }).filter(Boolean)
            if (lista.length > 0) {
                pecasHtml = `<div class="pecas-row">
          ${lista.map(function (p) {
                    return `<span class="peca-mini-tag">🔩 ${p}</span>`
                }).join("")}
        </div>`
            }
        }

        let json = encodeURIComponent(JSON.stringify(h))

        return `
      <div class="hist-card" onclick="abrirModal('${json}')">
        <div class="hist-card-topo">
          <div>
            <div class="hist-card-serv">
              ${iconeServico(h.servico)} ${h.servico}
            </div>
            <div class="hist-card-data">📅 ${h.data || "—"}</div>
          </div>
          <div class="hist-card-val">R$ ${(h.valor || 0).toFixed(2)}</div>
        </div>

        <div class="hist-card-info">
          <span>👤 <strong style="color:#aaa">${h.nome}</strong></span>
          <span>🏍️ ${h.moto || "—"}</span>
          ${h.placa ? `<span>🔖 ${h.placa}</span>` : ""}
          ${h.km ? `<span>📍 ${h.km} km</span>` : ""}
        </div>

        ${pecasHtml}

        <div class="hist-card-rodape">
          <div class="hist-card-pagto">
            💳 ${h.pagamento || "Não informado"}
          </div>
          ${h.funcionario
                ? `<span class="hist-card-func">👨‍🔧 ${h.funcionario}</span>`
                : ""}
        </div>
      </div>`
    }).join("")
}

// ── MODAL DETALHE ─────────────────────────────────────
function abrirModal(json) {
    let h = JSON.parse(decodeURIComponent(json))

    let tel = (h.telefone || "").replace(/\D/g, "")
    if (!tel.startsWith("55")) tel = "55" + tel

    let msgPronto = encodeURIComponent(
        "Olá " + h.nome + "! Sua moto *" + (h.moto || "") + "* está pronta para buscar! 🏍️\n_Central Moto Peças_"
    )
    let wppLink = `https://wa.me/${tel}?text=${msgPronto}`

    // Peças
    let pecasHtml = ""
    if (h.pecas) {
        let lista = h.pecas.split(",").map(function (p) { return p.trim() }).filter(Boolean)
        pecasHtml = lista.map(function (p) {
            return `<span class="peca-mini-tag" style="margin:2px">🔩 ${p}</span>`
        }).join("")
    }

    // Serviços extras
    let extrasHtml = ""
    if (h.servicosExtras && h.servicosExtras.length > 0) {
        extrasHtml = h.servicosExtras.map(function (e) {
            return `<span class="peca-mini-tag" style="margin:2px;border-color:rgba(168,85,247,0.2);color:#c084fc">➕ ${e}</span>`
        }).join("")
    }

    document.getElementById("modalServicoBox").innerHTML = `
    <div class="modal-topo">
      <h3>${iconeServico(h.servico)} ${h.servico}</h3>
      <button class="btn-fechar-modal" onclick="fecharModal()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">👤 Cliente</div>
      <div class="modal-linha">
        <span class="modal-linha-label">Nome</span>
        <span class="modal-linha-val">${h.nome}</span>
      </div>
      <div class="modal-linha">
        <span class="modal-linha-label">Telefone</span>
        <span class="modal-linha-val">${h.telefone || "—"}</span>
      </div>

      <div class="modal-secao-titulo">🏍️ Moto</div>
      <div class="modal-linha">
        <span class="modal-linha-label">Moto</span>
        <span class="modal-linha-val">${h.moto || "—"}</span>
      </div>
      <div class="modal-linha">
        <span class="modal-linha-label">Placa</span>
        <span class="modal-linha-val">${h.placa || "—"}</span>
      </div>
      ${h.km ? `
      <div class="modal-linha">
        <span class="modal-linha-label">KM</span>
        <span class="modal-linha-val">${h.km} km</span>
      </div>` : ""}

      <div class="modal-secao-titulo">🔧 Serviço</div>
      <div class="modal-linha">
        <span class="modal-linha-label">Data</span>
        <span class="modal-linha-val">📅 ${h.data || "—"}</span>
      </div>
      <div class="modal-linha">
        <span class="modal-linha-label">Serviço</span>
        <span class="modal-linha-val">${h.servico}</span>
      </div>
      ${h.funcionario ? `
      <div class="modal-linha">
        <span class="modal-linha-label">Funcionário</span>
        <span class="modal-linha-val" style="color:#60a5fa">👨‍🔧 ${h.funcionario}</span>
      </div>` : ""}
      ${h.obs ? `
      <div class="modal-linha">
        <span class="modal-linha-label">Observação</span>
        <span class="modal-linha-val">${h.obs}</span>
      </div>` : ""}

      ${pecasHtml || extrasHtml ? `
        <div class="modal-secao-titulo">📦 Peças utilizadas</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;padding:4px 0">
          ${pecasHtml}${extrasHtml}
        </div>` : ""}

      <div class="modal-secao-titulo">💰 Pagamento</div>
      <div class="modal-linha">
        <span class="modal-linha-label">Valor</span>
        <span class="modal-linha-val" style="color:#4ade80;font-size:20px">
          R$ ${(h.valor || 0).toFixed(2)}
        </span>
      </div>
      <div class="modal-linha">
        <span class="modal-linha-label">Forma</span>
        <span class="modal-linha-val">💳 ${h.pagamento || "Não informado"}</span>
      </div>

      ${h.foto ? `
        <div class="modal-secao-titulo">📸 Foto do serviço</div>
        <img src="${h.foto}" class="modal-foto" alt="Foto do serviço">
      ` : ""}

      <div class="modal-acoes">
        <a class="btn-wpp-modal" href="${wppLink}" target="_blank">
          📲 Avisar que está pronto
        </a>
        <button class="btn-excluir-modal"
          onclick="excluirServico(${h.id})">
          🗑️ Excluir
        </button>
      </div>

    </div>
  `

    document.getElementById("modalServico").classList.add("aberto")
}

// ── EXCLUIR ───────────────────────────────────────────
function excluirServico(id) {
    if (!confirm("Excluir este serviço do histórico?")) return
    let lista = getHistorico().filter(function (h) { return h.id != id })
    setHistorico(lista)
    fecharModal()
    carregarResumo()
    renderHistorico()
    toast("🗑️ Serviço excluído!", "vermelho")
}

// ── FECHAR MODAL ──────────────────────────────────────
function fecharModal() {
    document.getElementById("modalServico").classList.remove("aberto")
}