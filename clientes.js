// ═══════════════════════════════════════════════════════
//  CLIENTES — clientes.js
// ═══════════════════════════════════════════════════════

let filtroSolicAtual = "todos"

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
  // Fecha modal clicando fora
  document.getElementById("modalSolic").addEventListener("click", function (e) {
    if (e.target === this) fecharModalSolic()
  })
  document.getElementById("modalCliente").addEventListener("click", function (e) {
    if (e.target === this) fecharModalCliente()
  })

  // Ouve o Firebase em tempo real — atualiza automaticamente quando chegar pedido novo
  if (typeof fbOuvir !== "undefined") {
    fbOuvir("solicitacoes", function (lista) {
      // Sincroniza com localStorage para o resto do sistema funcionar
      localStorage.setItem("solicitacoesServico", JSON.stringify(lista))
      carregarResumo()
      renderSolicitacoes()
      renderClientes()
    })
  } else {
    carregarResumo()
    renderSolicitacoes()
    renderClientes()
  }
})

// ── HELPERS ──────────────────────────────────────────
function getSolicitacoes() {
  return JSON.parse(localStorage.getItem("solicitacoesServico")) || []
}

function setSolicitacoes(lista) {
  localStorage.setItem("solicitacoesServico", JSON.stringify(lista))
  // Sincroniza cada item atualizado no Firebase
  if (typeof db !== "undefined") {
    lista.forEach(function (s) {
      if (s._fbKey) {
        let dados = Object.assign({}, s)
        delete dados._fbKey
        fbAtualizar("solicitacoes", s._fbKey, dados)
      }
    })
  }
}

function getHistorico() {
  return JSON.parse(localStorage.getItem("historico")) || []
}

function montarWpp(telefone, msg) {
  let tel = (telefone || "").replace(/\D/g, "")
  if (!tel.startsWith("55")) tel = "55" + tel
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
}

function toast(msg, cor) {
  let t = document.getElementById("toast")
  t.textContent = msg
  t.className   = "toast " + (cor || "") + " visivel"
  setTimeout(function () { t.classList.remove("visivel") }, 2500)
}

// Texto e cor do badge por status
function badgeInfo(status) {
  let map = {
    aguardando:   { txt: "⏳ Aguardando",    cls: "badge-aguardando"   },
    agendado:     { txt: "📅 Agendado",       cls: "badge-agendado"     },
    em_andamento: { txt: "🔧 Em andamento",   cls: "badge-em_andamento" },
    pronto:       { txt: "✅ Pronto",          cls: "badge-pronto"       },
    concluido:    { txt: "🏁 Concluído",       cls: "badge-concluido"    }
  }
  return map[status] || { txt: status, cls: "" }
}

// ── RESUMO ────────────────────────────────────────────
function carregarResumo() {
  let lista = getSolicitacoes()
  document.getElementById("cardAguardando").textContent =
    lista.filter(function (s) { return s.status === "aguardando" }).length
  document.getElementById("cardAgendado").textContent =
    lista.filter(function (s) { return s.status === "agendado" }).length
  document.getElementById("cardAndamento").textContent =
    lista.filter(function (s) { return s.status === "em_andamento" }).length
  document.getElementById("cardPronto").textContent =
    lista.filter(function (s) { return s.status === "pronto" }).length
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

// ── FILTRO SOLICITAÇÕES ───────────────────────────────
function setFiltroSolic(filtro, btn) {
  filtroSolicAtual = filtro
  document.querySelectorAll(".filtro-btn").forEach(function (b) {
    b.classList.remove("ativo")
  })
  btn.classList.add("ativo")
  renderSolicitacoes()
}

// ── RENDERIZAR SOLICITAÇÕES ───────────────────────────
function renderSolicitacoes() {
  let lista = getSolicitacoes()

  if (filtroSolicAtual !== "todos") {
    lista = lista.filter(function (s) { return s.status === filtroSolicAtual })
  }

  lista = [...lista].reverse()

  let div = document.getElementById("listaSolicitacoes")

  if (lista.length === 0) {
    let msgs = {
      todos:        "Nenhuma solicitação ainda.",
      aguardando:   "Nenhuma solicitação aguardando! 🎉",
      agendado:     "Nenhum agendamento confirmado.",
      em_andamento: "Nenhum serviço em andamento.",
      pronto:       "Nenhum serviço pronto para buscar.",
      concluido:    "Nenhum serviço concluído ainda."
    }
    div.innerHTML = `
      <div class="empty-state">
        <span>📋</span>${msgs[filtroSolicAtual] || "Nenhuma solicitação."}
      </div>`
    return
  }

  div.innerHTML = lista.map(function (s) {
    let badge = badgeInfo(s.status)

    // Bloco de agendamento
    let agendHtml = ""
    if (s.data || s.horario) {
      agendHtml = `
        <div class="agendamento-box">
          ${s.data    ? `<div class="agend-item">📅 <span class="agend-val">${s.data}</span></div>`    : ""}
          ${s.horario ? `<div class="agend-item">🕐 <span class="agend-val">${s.horario}</span></div>` : ""}
        </div>`
    }

    // Serviços extras
    let extrasHtml = ""
    if (s.servicosExtras && s.servicosExtras.length > 0) {
      extrasHtml = `
        <div class="servicos-extras">
          <div class="servicos-extras-titulo">🔧 Serviços adicionados</div>
          ${s.servicosExtras.map(function (e) {
            return `<span class="servico-extra-tag">${e}</span>`
          }).join("")}
        </div>`
    }

    // Botões por status
    let acoes = ""
    if (s.status === "aguardando") {
      acoes = `
        <button class="btn-acao-solic btn-agendar"
          onclick="abrirModalAgendar(${s.id})">📅 Agendar</button>
        <a class="btn-acao-solic btn-wpp"
          href="${montarWpp(s.telefone, "Olá " + s.nome + "! Recebemos sua solicitação de *" + s.servico + "*. Em breve entraremos em contato! 🏍️ _Central Moto Peças_")}"
          target="_blank">📲 WhatsApp</a>
        <button class="btn-acao-solic btn-cancelar-solic"
          onclick="cancelarSolic(${s.id})">❌ Cancelar</button>`

    } else if (s.status === "agendado") {
      let msgAgend = "Olá " + s.nome + "! 👋\n\nSua moto *" + s.moto + "* está agendada para análise:\n📅 *" + (s.data || "") + "* às *" + (s.horario || "") + "*\n\nTraga sua moto na Central Moto Peças em Altinho/PE. Qualquer dúvida é só chamar! 🏍️"
      acoes = `
        <button class="btn-acao-solic btn-iniciar"
          onclick="mudarStatus(${s.id}, 'em_andamento')">🔧 Iniciar Análise</button>
        <button class="btn-acao-solic btn-agendar"
          onclick="abrirModalAgendar(${s.id})">✏️ Editar data</button>
        <a class="btn-acao-solic btn-wpp"
          href="${montarWpp(s.telefone, msgAgend)}"
          target="_blank">📲 Confirmar com cliente</a>`

    } else if (s.status === "em_andamento") {
      acoes = `
        <button class="btn-acao-solic btn-detalhes"
          onclick="abrirModalServicos(${s.id})">➕ Adicionar serviços</button>
        <button class="btn-acao-solic btn-pronto"
          onclick="marcarPronto(${s.id})">✅ Marcar como pronto</button>`

    } else if (s.status === "pronto") {
      let msgPronto = "Olá " + s.nome + "! 🎉\n\nSua moto *" + s.moto + "* está PRONTA para buscar!\n\nPasse na Central Moto Peças em Altinho/PE no horário comercial.\n\nQualquer dúvida é só chamar! 🏍️\n_Central Moto Peças_"
      acoes = `
        <a class="btn-acao-solic btn-wpp"
          href="${montarWpp(s.telefone, msgPronto)}"
          target="_blank">📲 Avisar que está pronta</a>
        <button class="btn-acao-solic btn-pronto"
          onclick="concluirServico(${s.id})">🏁 Concluir serviço</button>`

    } else if (s.status === "concluido") {
      acoes = `
        <a class="btn-acao-solic btn-wpp"
          href="${montarWpp(s.telefone, "Obrigado pela preferência, " + s.nome + "! 🙏 Qualquer coisa estamos à disposição. _Central Moto Peças_")}"
          target="_blank">📲 Agradecer cliente</a>`
    }

    return `
      <div class="solic-card ${s.status}">
        <div class="solic-topo">
          <div>
            <div class="solic-nome">👤 ${s.nome}</div>
            <div class="solic-hora">🕐 ${s.hora || ""}</div>
          </div>
          <span class="solic-badge ${badge.cls}">${badge.txt}</span>
        </div>

        <div class="solic-dados">
          <div class="solic-dado">
            <div class="solic-dado-label">📞 WhatsApp</div>
            <div class="solic-dado-valor">${s.telefone}</div>
          </div>
          <div class="solic-dado">
            <div class="solic-dado-label">🏍️ Moto</div>
            <div class="solic-dado-valor">${s.moto || "—"}</div>
          </div>
          <div class="solic-dado" style="flex-basis:100%">
            <div class="solic-dado-label">🔧 Serviço solicitado</div>
            <div class="solic-dado-valor">${s.servico}</div>
          </div>
        </div>

        ${s.problema ? `<div class="solic-problema">📝 "${s.problema}"</div>` : ""}
        ${agendHtml}
        ${extrasHtml}

        <div class="solic-acoes">${acoes}</div>
      </div>`
  }).join("")
}

// ── MUDAR STATUS ──────────────────────────────────────
function mudarStatus(id, novoStatus) {
  let lista = getSolicitacoes()
  lista.forEach(function (s) {
    if (s.id === id) s.status = novoStatus
  })
  setSolicitacoes(lista)
  carregarResumo()
  renderSolicitacoes()
  toast("✅ Status atualizado!", "verde")
}

function cancelarSolic(id) {
  if (!confirm("Cancelar esta solicitação?")) return
  let lista = getSolicitacoes().filter(function (s) { return s.id !== id })
  setSolicitacoes(lista)
  carregarResumo()
  renderSolicitacoes()
  toast("🗑️ Solicitação cancelada", "vermelho")
}

// ── MODAL: AGENDAR DATA/HORA ──────────────────────────
function abrirModalAgendar(id) {
  let lista = getSolicitacoes()
  let s     = lista.find(function (x) { return x.id === id })
  if (!s) return

  let hoje = new Date().toISOString().split("T")[0]

  document.getElementById("modalSolicBox").innerHTML = `
    <div class="modal-topo">
      <h3>📅 Agendar Visita</h3>
      <button class="btn-fechar-modal" onclick="fecharModalSolic()">✕</button>
    </div>
    <div class="modal-corpo">
      <div style="background:rgba(255,255,255,0.02);border:1px solid #1a1a1a;border-radius:10px;padding:14px;margin-bottom:18px">
        <p style="color:white;font-weight:bold;font-size:14px">👤 ${s.nome}</p>
        <p style="color:#555;font-size:13px;margin-top:4px">🏍️ ${s.moto || "—"} · 🔧 ${s.servico}</p>
      </div>

      <div class="modal-secao-titulo">📅 Data e horário para trazer a moto</div>
      <div class="data-hora-grid">
        <div>
          <label>Data *</label>
          <input id="mdData" type="date" min="${hoje}" value="${s.data || ""}">
        </div>
        <div>
          <label>Horário *</label>
          <select id="mdHorario">
            <option value="">Selecione...</option>
            ${["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"].map(function (h) {
              return `<option value="${h}" ${s.horario === h ? "selected" : ""}>${h}</option>`
            }).join("")}
          </select>
        </div>
      </div>

      <label>Observação para o cliente (opcional)</label>
      <textarea id="mdObs" placeholder="Ex: traga o documento da moto, venha com 1/4 de combustível..."
                style="min-height:70px">${s.obsAgendamento || ""}</textarea>

      <div class="modal-acoes">
        <button class="btn-modal-principal" onclick="salvarAgendamento(${s.id})">
          📲 Confirmar e avisar cliente
        </button>
        <button class="btn-modal-sec" onclick="fecharModalSolic()">Cancelar</button>
      </div>
    </div>
  `

  document.getElementById("modalSolic").classList.add("aberto")
}

function salvarAgendamento(id) {
  let data    = document.getElementById("mdData").value
  let horario = document.getElementById("mdHorario").value
  let obs     = document.getElementById("mdObs").value.trim()

  if (!data)    { alert("Selecione a data!"); return }
  if (!horario) { alert("Selecione o horário!"); return }

  let dataFmt = data.split("-").reverse().join("/")

  let lista = getSolicitacoes()
  let s
  lista.forEach(function (x) {
    if (x.id === id) {
      x.status        = "agendado"
      x.data          = dataFmt
      x.horario       = horario
      x.obsAgendamento= obs
      s = x
    }
  })
  setSolicitacoes(lista)

  let msg = "Olá " + s.nome + "! 👋\n\n" +
    "Seu serviço de *" + s.servico + "* foi agendado! 📅\n\n" +
    "📅 *Data:* " + dataFmt + "\n" +
    "🕐 *Horário:* " + horario + "\n" +
    (obs ? "📝 " + obs + "\n" : "") +
    "\nTraga sua moto na Central Moto Peças — Altinho/PE.\n" +
    "Qualquer dúvida é só chamar! 🏍️\n_Central Moto Peças_"

  fecharModalSolic()
  carregarResumo()
  renderSolicitacoes()
  toast("📅 Agendado! Abrindo WhatsApp...", "azul")

  setTimeout(function () {
    window.open(montarWpp(s.telefone, msg), "_blank")
  }, 500)
}

// ── MODAL: ADICIONAR SERVIÇOS ─────────────────────────
function abrirModalServicos(id) {
  let lista = getSolicitacoes()
  let s     = lista.find(function (x) { return x.id === id })
  if (!s) return

  let servicosDisponiveis = [
    "Troca de óleo", "Revisão completa", "Troca de pneus",
    "Troca de corrente", "Regulagem de freios", "Troca de pastilhas",
    "Troca de vela", "Diagnóstico geral", "Limpeza do carburador",
    "Troca de filtro de ar", "Calibragem de pneus", "Troca de fluido de freio"
  ]

  let extras = s.servicosExtras || []

  document.getElementById("modalSolicBox").innerHTML = `
    <div class="modal-topo">
      <h3>🔧 Adicionar Serviços</h3>
      <button class="btn-fechar-modal" onclick="fecharModalSolic()">✕</button>
    </div>
    <div class="modal-corpo">
      <div style="background:rgba(255,255,255,0.02);border:1px solid #1a1a1a;border-radius:10px;padding:14px;margin-bottom:18px">
        <p style="color:white;font-weight:bold;font-size:14px">👤 ${s.nome}</p>
        <p style="color:#555;font-size:13px;margin-top:4px">🔧 Serviço original: <strong style="color:white">${s.servico}</strong></p>
      </div>

      <div class="modal-secao-titulo">🔧 Serviços adicionais encontrados na análise</div>
      <div class="servicos-check-grid" id="servicosCheckGrid">
        ${servicosDisponiveis.map(function (sv) {
          let marcado = extras.includes(sv) ? "marcado" : ""
          return `
            <div class="serv-check ${marcado}" onclick="toggleServico(this, '${sv}')">
              <input type="checkbox" ${marcado ? "checked" : ""}>
              ${sv}
            </div>`
        }).join("")}
      </div>

      <label>Outro serviço não listado</label>
      <input id="mdServicoExtra" type="text"
             placeholder="Ex: troca de rolamento de roda...">

      <label style="margin-top:14px">Observação para o cliente</label>
      <textarea id="mdObsServicos"
                placeholder="Ex: encontramos desgaste nas pastilhas, recomendamos trocar..."
                style="min-height:70px">${s.obsServicos || ""}</textarea>

      <div class="modal-acoes">
        <button class="btn-modal-principal" onclick="salvarServicos(${s.id})">
          📲 Salvar e avisar cliente
        </button>
        <button class="btn-modal-sec" onclick="fecharModalSolic()">Cancelar</button>
      </div>
    </div>
  `

  document.getElementById("modalSolic").classList.add("aberto")
}

function toggleServico(el) {
  el.classList.toggle("marcado")
}

function salvarServicos(id) {
  let marcados = Array.from(
    document.querySelectorAll(".serv-check.marcado")
  ).map(function (el) { return el.textContent.trim() })

  let extra = document.getElementById("mdServicoExtra").value.trim()
  if (extra) marcados.push(extra)

  let obs = document.getElementById("mdObsServicos").value.trim()

  let lista = getSolicitacoes()
  let s
  lista.forEach(function (x) {
    if (x.id === id) {
      x.servicosExtras = marcados
      x.obsServicos    = obs
      s = x
    }
  })
  setSolicitacoes(lista)

  // Monta mensagem para o cliente
  let msg = "Olá " + s.nome + "! 👋\n\n" +
    "Analisamos sua moto *" + s.moto + "* e encontramos o seguinte:\n\n" +
    "🔧 *Serviço solicitado:* " + s.servico + "\n"

  if (marcados.length > 0) {
    msg += "\n➕ *Serviços adicionais identificados:*\n"
    marcados.forEach(function (sv) { msg += "• " + sv + "\n" })
  }

  if (obs) msg += "\n📝 " + obs + "\n"

  msg += "\nDeseja prosseguir com todos os serviços? Responda aqui! 🏍️\n_Central Moto Peças_"

  fecharModalSolic()
  renderSolicitacoes()
  toast("✅ Serviços salvos! Abrindo WhatsApp...", "verde")

  setTimeout(function () {
    window.open(montarWpp(s.telefone, msg), "_blank")
  }, 500)
}

// ── MARCAR PRONTO / CONCLUIR ──────────────────────────
function marcarPronto(id) {
  mudarStatus(id, "pronto")
  toast("✅ Marcado como pronto!", "verde")
}

function concluirServico(id) {
  let lista = getSolicitacoes()
  let s     = lista.find(function (x) { return x.id === id })
  if (!s) return

  // Abre modal para preencher valor antes de concluir
  document.getElementById("modalSolicBox").innerHTML = `
    <div class="modal-topo">
      <h3>🏁 Concluir Serviço</h3>
      <button class="btn-fechar-modal" onclick="fecharModalSolic()">✕</button>
    </div>
    <div class="modal-corpo">
      <div style="background:rgba(255,255,255,0.02);border:1px solid #1a1a1a;
                  border-radius:10px;padding:14px;margin-bottom:18px">
        <p style="color:white;font-weight:bold;font-size:14px">👤 ${s.nome}</p>
        <p style="color:#555;font-size:13px;margin-top:4px">
          🏍️ ${s.moto || "—"} · 🔧 ${s.servico}
          ${s.servicosExtras && s.servicosExtras.length
            ? " + " + s.servicosExtras.length + " extras"
            : ""}
        </p>
      </div>

      <div class="modal-secao-titulo">💰 Valor e pagamento</div>

      <label>Valor cobrado (R$) *</label>
      <input id="concValor" type="number" step="0.01" placeholder="0.00">

      <label>Forma de pagamento</label>
      <select id="concPagamento">
        <option value="Dinheiro">💵 Dinheiro</option>
        <option value="Pix">📲 Pix</option>
        <option value="Cartão de Débito">💳 Cartão de Débito</option>
        <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
        <option value="Pendente">⏳ Pendente (a pagar)</option>
      </select>

      <label>Funcionário que fez</label>
      <select id="concFuncionario">
        <option value="">Selecione...</option>
      </select>

      <label>KM atual da moto</label>
      <input id="concKm" type="number" placeholder="Ex: 15400 (opcional)">

      <div class="modal-acoes">
        <button class="btn-modal-principal" onclick="salvarConclusao(${s.id})">
          🏁 Concluir e salvar no histórico
        </button>
        <button class="btn-modal-sec" onclick="fecharModalSolic()">Cancelar</button>
      </div>
    </div>
  `
  document.getElementById("modalSolic").classList.add("aberto")

  // Carrega funcionários no select
  let funcs  = JSON.parse(localStorage.getItem("funcionarios")) || []
  let selFun = document.getElementById("concFuncionario")
  funcs.forEach(function (f) {
    let opt   = document.createElement("option")
    opt.value = f.nome
    opt.text  = f.nome + (f.funcao ? " — " + f.funcao : "")
    selFun.appendChild(opt)
  })
}

function salvarConclusao(id) {
  let valor      = parseFloat(document.getElementById("concValor").value) || 0
  let pagamento  = document.getElementById("concPagamento").value
  let funcionario= document.getElementById("concFuncionario").value
  let km         = document.getElementById("concKm").value

  if (!valor) { alert("Digite o valor cobrado!"); return }

  let lista = getSolicitacoes()
  let s     = lista.find(function (x) { return x.id === id })
  if (!s) return

  // Salva no histórico
  let hist = getHistorico()
  hist.push({
    id:             Date.now(),
    nome:           s.nome,
    telefone:       s.telefone,
    moto:           s.moto || "",
    placa:          s.placa || "",
    km:             km,
    servico:        s.servico,
    servicosExtras: s.servicosExtras || [],
    obs:            s.obsServicos || "",
    valor:          valor,
    data:           new Date().toLocaleDateString("pt-BR"),
    pagamento:      pagamento,
    funcionario:    funcionario,
    foto:           null,
    origem:         "solicitacao"
  })
  localStorage.setItem("historico", JSON.stringify(hist))

  lista.forEach(function (x) {
    if (x.id === id) x.status = "concluido"
  })
  setSolicitacoes(lista)

  fecharModalSolic()
  carregarResumo()
  renderSolicitacoes()
  toast("🏁 Serviço concluído e salvo no histórico!", "verde")
}

// ── FECHAR MODAIS ─────────────────────────────────────
function fecharModalSolic()   { document.getElementById("modalSolic").classList.remove("aberto") }
function fecharModalCliente() { document.getElementById("modalCliente").classList.remove("aberto") }

// ── ADICIONAR CLIENTE MANUAL ──────────────────────────
function abrirModalAddCliente() {
  document.getElementById("modalClienteBox").innerHTML = `
    <div class="modal-topo">
      <h3>➕ Adicionar Cliente</h3>
      <button class="btn-fechar-modal" onclick="fecharModalCliente()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">👤 Dados do cliente</div>

      <label>Nome *</label>
      <input id="addNome" type="text" placeholder="Ex: João Silva">

      <label>Telefone / WhatsApp *</label>
      <input id="addTelefone" type="tel" placeholder="Ex: (94) 99999-0000">

      <div class="modal-secao-titulo">🏍️ Moto</div>

      <label>Marca</label>
      <select id="addMarca">
        <option value="">Selecione...</option>
        <option value="Honda">Honda</option>
        <option value="Yamaha">Yamaha</option>
        <option value="Suzuki">Suzuki</option>
        <option value="Kawasaki">Kawasaki</option>
        <option value="Dafra">Dafra</option>
        <option value="Shineray">Shineray</option>
        <option value="Haojue">Haojue</option>
        <option value="Outra">Outra</option>
      </select>

      <label>Modelo</label>
      <input id="addModelo" type="text" placeholder="Ex: CG 160, Fazer 250...">

      <label>Placa</label>
      <input id="addPlaca" type="text" placeholder="Ex: ABC-1D23"
             oninput="this.value = this.value.toUpperCase()">

      <div class="modal-acoes">
        <button class="btn-modal-principal" onclick="salvarNovoCliente()">
          💾 Salvar Cliente
        </button>
        <button class="btn-modal-sec" onclick="fecharModalCliente()">Cancelar</button>
      </div>

    </div>
  `
  document.getElementById("modalCliente").classList.add("aberto")
}

function salvarNovoCliente() {
  let nome     = document.getElementById("addNome").value.trim()
  let telefone = document.getElementById("addTelefone").value.trim()
  let marca    = document.getElementById("addMarca").value
  let modelo   = document.getElementById("addModelo").value.trim()
  let placa    = document.getElementById("addPlaca").value.trim().toUpperCase()

  if (!nome)     { alert("Digite o nome!"); return }
  if (!telefone) { alert("Digite o telefone!"); return }

  // Salva como um registro vazio no histórico
  // para que o cliente apareça na lista
  let hist = getHistorico()
  hist.push({
    id:          Date.now(),
    nome:        nome,
    telefone:    telefone,
    moto:        marca && modelo ? marca + " " + modelo : marca || modelo || "",
    placa:       placa,
    km:          "",
    servico:     "Cadastro manual",
    obs:         "Cliente adicionado manualmente",
    valor:       0,
    data:        new Date().toLocaleDateString("pt-BR"),
    pagamento:   "",
    funcionario: "",
    foto:        null,
    cadastroManual: true
  })
  localStorage.setItem("historico", JSON.stringify(hist))

  fecharModalCliente()
  renderClientes()
  toast("✅ Cliente adicionado!", "verde")
}

// ── RENDERIZAR CLIENTES ───────────────────────────────
function renderClientes() {
  let busca = (document.getElementById("inputBuscaCli").value || "").toLowerCase()

  let historico    = getHistorico()
  let orcamentos   = JSON.parse(localStorage.getItem("orcamentos"))   || []
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []
  let solicitacoes = getSolicitacoes()

  let mapa = {}

  function adicionar(item, tipo) {
    let tel = (item.telefone || "").replace(/\D/g, "")
    if (!tel || !item.nome) return
    if (!mapa[tel]) {
      mapa[tel] = {
        nome: item.nome, telefone: item.telefone,
        motos: [], placas: [], servicos: [], pendentes: 0, totalGasto: 0
      }
    }
    let c = mapa[tel]
    if (item.moto  && !c.motos.includes(item.moto))   c.motos.push(item.moto)
    if (item.placa && !c.placas.includes(item.placa)) c.placas.push(item.placa)
    if (tipo === "historico") {
      c.servicos.push(item)
      c.totalGasto += item.valor || 0
    }
    if (tipo === "pendente") c.pendentes++
  }

  historico.forEach(function (i) { adicionar(i, "historico") })
  orcamentos.filter(function (o) { return o.status === "Aguardando" })
            .forEach(function (i) { adicionar(i, "pendente") })
  agendamentos.filter(function (a) { return a.status === "Aguardando" })
              .forEach(function (i) { adicionar(i, "pendente") })
  solicitacoes.filter(function (s) { return s.status !== "concluido" })
              .forEach(function (i) { adicionar(i, "pendente") })

  let clientes = Object.values(mapa)

  if (busca) {
    clientes = clientes.filter(function (c) {
      return c.nome.toLowerCase().includes(busca) ||
             c.telefone.includes(busca) ||
             c.motos.some(function (m) { return m.toLowerCase().includes(busca) }) ||
             c.placas.some(function (p) { return p.toLowerCase().includes(busca) })
    })
  }

  clientes.sort(function (a, b) { return b.totalGasto - a.totalGasto })

  let div = document.getElementById("listaClientes")

  if (clientes.length === 0) {
    div.innerHTML = `<div class="empty-state"><span>👥</span>Nenhum cliente encontrado.</div>`
    return
  }

  div.innerHTML = clientes.map(function (c) {
    let inicial = c.nome.trim()[0].toUpperCase()
    let nServ   = c.servicos.length

    let tags = ""
    if (nServ >= 5)       tags += `<span class="cli-tag tag-vip">⭐ VIP</span>`
    else if (nServ >= 2)  tags += `<span class="cli-tag tag-frequente">⭐ Frequente</span>`
    else if (nServ === 0) tags += `<span class="cli-tag tag-novo">🆕 Novo</span>`
    if (c.pendentes > 0)  tags += `<span class="cli-tag tag-pendente">⏳ ${c.pendentes} pendente${c.pendentes > 1 ? "s" : ""}</span>`

    let json = encodeURIComponent(JSON.stringify(c))

    return `
      <div class="cliente-card" onclick="abrirModalCliente('${json}')">
        <div class="cli-avatar">${inicial}</div>
        <div class="cli-info">
          <div class="cli-nome">${c.nome}</div>
          <div class="cli-meta">
            📞 ${c.telefone}
            ${c.motos[0] ? " · 🏍️ " + c.motos[0] : ""}
            ${c.placas[0] ? " · 🔖 " + c.placas[0] : ""}
          </div>
          ${tags ? `<div class="cli-tags">${tags}</div>` : ""}
        </div>
        <div class="cli-dir">
          <div class="cli-total">R$ ${c.totalGasto.toFixed(2)}</div>
          <div class="cli-total-label">total gasto</div>
          <div class="cli-serv-count">${nServ} serviço${nServ !== 1 ? "s" : ""}</div>
        </div>
      </div>`
  }).join("")
}

// ── MODAL CLIENTE ─────────────────────────────────────
function abrirModalCliente(json) {
  let c = JSON.parse(decodeURIComponent(json))

  let wppGeral  = montarWpp(c.telefone, "Olá " + c.nome + "! Aqui é a Central Moto Peças. Como posso te ajudar? 🏍️")
  let wppPronto = montarWpp(c.telefone, "Olá " + c.nome + "! Sua moto *" + (c.motos[0] || "") + "* está pronta para buscar! 🏍️ _Central Moto Peças_")

  let histHtml = c.servicos.length > 0
    ? [...c.servicos].reverse().map(function (s) {
        return `
          <div class="hist-mini">
            <div class="hist-mini-topo">
              <div class="hist-mini-serv">🔧 ${s.servico}</div>
              <div class="hist-mini-data">📅 ${s.data}</div>
            </div>
            <div class="hist-mini-meta">
              🏍️ ${s.moto || ""}
              ${s.funcionario ? " · 👨‍🔧 " + s.funcionario : ""}
              ${s.pecas       ? " · 🔩 " + s.pecas         : ""}
            </div>
            <div class="hist-mini-val">💰 R$ ${(s.valor || 0).toFixed(2)}</div>
          </div>`
      }).join("")
    : `<div style="color:#333;font-size:13px;padding:8px">Nenhum serviço registrado.</div>`

  let telEnc = encodeURIComponent(c.telefone)

  document.getElementById("modalClienteBox").innerHTML = `
    <div class="modal-topo">
      <h3>👤 ${c.nome}</h3>
      <button class="btn-fechar-modal" onclick="fecharModalCliente()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">📋 Dados</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:4px">
        <div style="color:#888;font-size:14px">📞 <strong style="color:white">${c.telefone}</strong></div>
        <div style="color:#888;font-size:14px">🏍️ <strong style="color:white">${c.motos.join(", ") || "—"}</strong></div>
        ${c.placas.length ? `<div style="color:#888;font-size:14px">🔖 <strong style="color:white">${c.placas.join(", ")}</strong></div>` : ""}
        <div style="color:#888;font-size:14px">🔧 <strong style="color:white">${c.servicos.length} serviço${c.servicos.length !== 1 ? "s" : ""}</strong></div>
        <div style="color:#888;font-size:14px">💰 Total gasto: <strong style="color:#4ade80">R$ ${c.totalGasto.toFixed(2)}</strong></div>
      </div>

      <div class="modal-secao-titulo">🔧 Histórico de serviços</div>
      ${histHtml}

      <div class="modal-acoes">
        <a class="btn-modal-principal"
           href="${wppGeral}" target="_blank"
           style="display:block;text-align:center;text-decoration:none;
                  background:#25d366;color:black">
          📲 Enviar mensagem
        </a>
        <a href="${wppPronto}" target="_blank"
           style="flex:1;display:block;text-align:center;text-decoration:none;
                  padding:13px;background:rgba(59,130,246,0.1);
                  border:1px solid rgba(59,130,246,0.3);color:#60a5fa;
                  border-radius:11px;font-weight:bold;font-size:14px">
          ✅ Moto pronta
        </a>
      </div>

      <!-- EXCLUIR CLIENTE -->
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #1a1a1a">
        <button onclick="excluirCliente('${telEnc}')"
          style="width:100%;padding:11px;background:transparent;
                 border:1px solid rgba(232,45,45,0.25);color:#f87171;
                 border-radius:10px;font-size:13px;font-weight:bold;
                 cursor:pointer;transition:background 0.2s"
          onmouseover="this.style.background='rgba(232,45,45,0.1)'"
          onmouseout="this.style.background='transparent'">
          🗑️ Excluir cliente e histórico
        </button>
      </div>

    </div>
  `

  document.getElementById("modalCliente").classList.add("aberto")
}

// ── EXCLUIR CLIENTE ───────────────────────────────────
function excluirCliente(telEnc) {
  let tel = decodeURIComponent(telEnc).replace(/\D/g, "")
  if (!confirm("Tem certeza? Isso vai apagar TODO o histórico deste cliente!")) return

  // Remove do histórico
  let hist = getHistorico().filter(function (h) {
    return (h.telefone || "").replace(/\D/g, "") !== tel
  })
  localStorage.setItem("historico", JSON.stringify(hist))

  // Remove das solicitações
  let solics = getSolicitacoes().filter(function (s) {
    return (s.telefone || "").replace(/\D/g, "") !== tel
  })
  setSolicitacoes(solics)

  // Remove dos orçamentos e agendamentos também
  let orc = (JSON.parse(localStorage.getItem("orcamentos")) || []).filter(function (o) {
    return (o.telefone || "").replace(/\D/g, "") !== tel
  })
  localStorage.setItem("orcamentos", JSON.stringify(orc))

  let age = (JSON.parse(localStorage.getItem("agendamentos")) || []).filter(function (a) {
    return (a.telefone || "").replace(/\D/g, "") !== tel
  })
  localStorage.setItem("agendamentos", JSON.stringify(age))

  fecharModalCliente()
  carregarResumo()
  renderClientes()
  toast("🗑️ Cliente excluído!", "vermelho")
}
