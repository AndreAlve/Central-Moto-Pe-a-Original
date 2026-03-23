// ═══════════════════════════════════════════════════════
//  ADMINISTRAÇÃO — administracao.js
// ═══════════════════════════════════════════════════════

window.addEventListener("load", function () {
    carregarResumo()
    carregarSolicitacoes()
    carregarUltimosServicos()
})

// ── RESUMO ────────────────────────────────────────────
function carregarResumo() {
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []

    // Clientes únicos
    let mapa = {}
    function addCliente(item) {
        let tel = (item.telefone || "").replace(/\D/g, "")
        if (tel) mapa[tel] = true
    }
    historico.forEach(addCliente)
    orcamentos.forEach(addCliente)
    agendamentos.forEach(addCliente)

    // Pendentes
    let pendentes = [...orcamentos, ...agendamentos].filter(function (s) {
        return s.status === "Aguardando"
    })

    // Entradas hoje
    let hoje = new Date().toLocaleDateString("pt-BR")
    let entHoje = historico
        .filter(function (h) { return h.data === hoje })
        .reduce(function (a, h) { return a + (h.valor || 0) }, 0)

    document.getElementById("totalSolicitacoes").textContent = pendentes.length
    document.getElementById("totalClientes").textContent = Object.keys(mapa).length
    document.getElementById("totalServicos").textContent = historico.length
    document.getElementById("totalHoje").textContent =
        "R$" + (entHoje >= 1000
            ? (entHoje / 1000).toFixed(1) + "k"
            : entHoje.toFixed(0))
}

// ── SOLICITAÇÕES PENDENTES ────────────────────────────
function carregarSolicitacoes() {
    let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []

    let pendentes = [
        ...orcamentos.filter(function (o) {
            return o.status === "Aguardando"
        }).map(function (o) { return { ...o, tipo: "orcamento" } }),

        ...agendamentos.filter(function (a) {
            return a.status === "Aguardando"
        }).map(function (a) { return { ...a, tipo: "agendamento" } })
    ]

    let div = document.getElementById("listaSolicitacoes")

    if (pendentes.length === 0) {
        div.innerHTML = `
      <div class="empty-state">
        <span>🎉</span>
        Nenhuma solicitação pendente!
      </div>`
        return
    }

    div.innerHTML = pendentes.map(function (s) {
        let icone = s.tipo === "orcamento" ? "💰" : "📅"
        let tipoTxt = s.tipo === "orcamento" ? "Orçamento" : "Agendamento"
        let tel = (s.telefone || "").replace(/\D/g, "")
        if (!tel.startsWith("55")) tel = "55" + tel
        let msg = encodeURIComponent(
            "Olá " + s.nome + "! Recebemos sua solicitação de " + tipoTxt.toLowerCase() +
            ". Em breve entraremos em contato. Central Moto Peças 🏍️"
        )
        let wppLink = `https://wa.me/${tel}?text=${msg}`

        return `
      <div class="solic-card">
        <div class="solic-topo">
          <div class="solic-nome">${icone} ${s.nome}</div>
          <span class="solic-badge">${tipoTxt}</span>
        </div>
        <div class="solic-info">
          <span>📞 ${s.telefone}</span>
          ${s.moto ? `<span>🏍️ ${s.moto}</span>` : ""}
          ${s.data ? `<span>📅 ${s.data}${s.horario ? " às " + s.horario : ""}</span>` : ""}
          ${s.problema ? `<span>🔧 ${s.problema}</span>` : ""}
        </div>
        <div class="solic-acoes">
          <button class="btn-confirmar"
            onclick="mudarStatus('${s.tipo}', ${s.id}, 'Confirmado')">
            ✅ Confirmar
          </button>
          <button class="btn-cancelar"
            onclick="mudarStatus('${s.tipo}', ${s.id}, 'Cancelado')">
            ❌ Cancelar
          </button>
          <a class="btn-wpp-solic" href="${wppLink}" target="_blank">
            📲 WhatsApp
          </a>
        </div>
      </div>`
    }).join("")
}

function mudarStatus(tipo, id, status) {
    let chave = tipo === "orcamento" ? "orcamentos" : "agendamentos"
    let lista = JSON.parse(localStorage.getItem(chave)) || []
    lista.forEach(function (i) { if (i.id == id) i.status = status })
    localStorage.setItem(chave, JSON.stringify(lista))
    carregarSolicitacoes()
    carregarResumo()
}

// ── ÚLTIMOS SERVIÇOS ──────────────────────────────────
function carregarUltimosServicos() {
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let div = document.getElementById("listaServicos")

    if (historico.length === 0) {
        div.innerHTML = `
      <div class="empty-state">
        <span>🔧</span>
        Nenhum serviço registrado ainda.
        <br><br>
        <a href="registrar-servico.html"
           style="color:#e82d2d;text-decoration:none;font-weight:bold">
          + Registrar primeiro serviço
        </a>
      </div>`
        return
    }

    // Mostra os 5 mais recentes
    let recentes = [...historico].reverse().slice(0, 5)

    function icone(serv) {
        serv = (serv || "").toLowerCase()
        if (serv.includes("óleo")) return "🛢️"
        if (serv.includes("pneu")) return "🛞"
        if (serv.includes("corrente")) return "⛓️"
        if (serv.includes("freio") || serv.includes("pastilha")) return "🛑"
        if (serv.includes("vela")) return "⚡"
        if (serv.includes("revisão")) return "🔧"
        return "🏍️"
    }

    div.innerHTML = recentes.map(function (h) {
        return `
      <div class="serv-card">
        <div class="serv-icone">${icone(h.servico)}</div>
        <div class="serv-info">
          <div class="serv-titulo">${h.servico}</div>
          <div class="serv-meta">
            👤 ${h.nome}
            · 🏍️ ${h.moto || ""}
            ${h.funcionario ? "· 👨‍🔧 " + h.funcionario : ""}
          </div>
        </div>
        <div class="serv-dir">
          <div class="serv-valor">R$ ${(h.valor || 0).toFixed(2)}</div>
          <div class="serv-data">📅 ${h.data}</div>
        </div>
      </div>`
    }).join("")
}
