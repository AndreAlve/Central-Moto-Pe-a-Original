// ═══════════════════════════════════════════════════════
//  HISTÓRICO DA MOTO — historico-moto.js
// ═══════════════════════════════════════════════════════

let tipoBusca = "nome"

// ── AUTO-FILL com nome salvo ─────────────────────────
window.addEventListener("load", function () {
    let dados = JSON.parse(localStorage.getItem("dadosCliente"))
    if (dados && dados.nome) {
        document.getElementById("inputPlaca").value = dados.nome
    }
    // Enter para buscar
    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") buscarHistorico()
    })
})

// ── TIPO DE BUSCA ─────────────────────────────────────
function setTipoBusca(tipo, btn) {
    tipoBusca = tipo

    document.querySelectorAll(".busca-tab").forEach(function (b) {
        b.classList.remove("ativa")
    })
    btn.classList.add("ativa")

    document.getElementById("campoBuscaNome").style.display =
        tipo === "nome" ? "block" : "none"
    document.getElementById("campoBuscaTelefone").style.display =
        tipo === "telefone" ? "block" : "none"

    document.getElementById("buscaErro").style.display = "none"
}

// ── BUSCAR HISTÓRICO ──────────────────────────────────
function buscarHistorico() {
    let termo = ""

    if (tipoBusca === "nome") {
        termo = document.getElementById("inputPlaca").value.trim().toUpperCase()
        if (!termo) { alert("Digite o nome!"); return }
    } else {
        termo = document.getElementById("inputTelefone").value.trim()
        if (!termo) { alert("Digite o telefone!"); return }
    }

    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let solicitacoes = JSON.parse(localStorage.getItem("solicitacoesServico")) || []

    let resultado

    if (tipoBusca === "nome") {
        resultado = historico.filter(function (h) {
            return (h.nome || "").toUpperCase().includes(termo)
        })
    } else {
        let termoNum = termo.replace(/\D/g, "")
        resultado = historico.filter(function (h) {
            return (h.telefone || "").replace(/\D/g, "").includes(termoNum)
        })
    }

    if (resultado.length === 0) {
        document.getElementById("buscaErro").style.display = "block"
        return
    }

    document.getElementById("buscaErro").style.display = "none"
    mostrarResultado(resultado, termo)
}

// ── MOSTRAR RESULTADO ─────────────────────────────────
function mostrarResultado(lista, termo) {
    document.getElementById("telaBusca").style.display = "none"
    document.getElementById("telaResultado").style.display = "block"
    window.scrollTo({ top: 0, behavior: "smooth" })

    let moto = lista[0].moto || "Moto"
    let nome = lista[0].nome || termo
    let cliente = lista[0].nome
    let totalGasto = lista.reduce(function (a, h) { return a + (h.valor || 0) }, 0)
    let totalServicos = lista.length
    let ultimaVisita = lista[lista.length - 1].data || "—"

    // Card da moto
    document.getElementById("motoCard").innerHTML = `
    <div class="moto-header">
      <div class="moto-icone">🏍️</div>
      <div>
        <div class="moto-nome">${moto}</div>
        <span class="moto-nome">${nome}</span>
      </div>
    </div>
    <div style="color:#555;font-size:13px;margin-bottom:16px">
      👤 ${cliente}
    </div>
    <div class="moto-stats">
      <div class="moto-stat">
        <div class="moto-stat-val">${totalServicos}</div>
        <div class="moto-stat-label">Serviços</div>
      </div>
      <div class="moto-stat">
        <div class="moto-stat-val">R$ ${totalGasto.toFixed(0)}</div>
        <div class="moto-stat-label">Total gasto</div>
      </div>
      <div class="moto-stat">
        <div class="moto-stat-val">${ultimaVisita}</div>
        <div class="moto-stat-label">Última visita</div>
      </div>
    </div>`

    // Timeline dos serviços (mais recente primeiro)
    let ordenado = [...lista].reverse()

    function iconeServico(serv) {
        serv = (serv || "").toLowerCase()
        if (serv.includes("óleo")) return "🛢️"
        if (serv.includes("pneu")) return "🛞"
        if (serv.includes("corrente")) return "⛓️"
        if (serv.includes("freio") || serv.includes("pastilha")) return "🛑"
        if (serv.includes("vela")) return "⚡"
        if (serv.includes("revisão")) return "🔧"
        if (serv.includes("diagnós")) return "🔍"
        if (serv.includes("cabo")) return "🔌"
        return "🏍️"
    }

    let html = ordenado.map(function (h, i) {

        // Peças
        let pecasHtml = ""
        if (h.pecas) {
            let pecasList = h.pecas.split(",").map(function (p) { return p.trim() }).filter(Boolean)
            if (pecasList.length > 0) {
                pecasHtml = `
          <div class="pecas-lista">
            ${pecasList.map(function (p) {
                    return `<span class="peca-tag-hist">🔩 ${p}</span>`
                }).join("")}
          </div>`
            }
        }

        // Serviços extras (das solicitações)
        let extrasHtml = ""
        if (h.servicosExtras && h.servicosExtras.length > 0) {
            extrasHtml = `
        <div class="extras-lista">
          ${h.servicosExtras.map(function (e) {
                return `<span class="extra-tag">➕ ${e}</span>`
            }).join("")}
        </div>`
        }

        // Obs
        let obsHtml = h.obs
            ? `<div class="serv-obs">📝 ${h.obs}</div>`
            : ""

        // Foto
        let fotoHtml = h.foto
            ? `<img src="${h.foto}" class="serv-foto" alt="Foto do serviço">`
            : ""

        // Km
        let kmHtml = h.km ? `<span>📍 ${h.km} km</span>` : ""

        // Funcionário
        let funcHtml = h.funcionario ? `<span>👨‍🔧 ${h.funcionario}</span>` : ""

        // Valor
        let valorHtml = h.valor
            ? `<div class="serv-card-valor">R$ ${h.valor.toFixed(2)}</div>`
            : `<div class="serv-card-valor" style="color:#444">Valor não informado</div>`

        return `
      <div class="timeline-item">
        <div class="timeline-lado">
          <div class="timeline-dot">${iconeServico(h.servico)}</div>
          <div class="timeline-linha"></div>
        </div>
        <div class="serv-card">
          <div class="serv-card-topo">
            <div class="serv-card-nome">${h.servico}</div>
            <div class="serv-card-data">📅 ${h.data}</div>
          </div>
          ${pecasHtml}
          ${extrasHtml}
          ${obsHtml}
          ${fotoHtml}
          <div class="serv-card-rodape">
            <div class="serv-card-info">
              ${kmHtml}
              ${funcHtml}
              ${h.pagamento ? `<span>💳 ${h.pagamento}</span>` : ""}
            </div>
            ${valorHtml}
          </div>
        </div>
      </div>`
    }).join("")

    document.getElementById("timelineServicos").innerHTML = html ||
        `<div class="empty-hist"><span>🔧</span>Nenhum serviço encontrado.</div>`
}

// ── VOLTAR ────────────────────────────────────────────
function voltarBusca() {
    document.getElementById("telaResultado").style.display = "none"
    document.getElementById("telaBusca").style.display = "block"
    document.getElementById("buscaErro").style.display = "none"
    window.scrollTo({ top: 0, behavior: "smooth" })
}