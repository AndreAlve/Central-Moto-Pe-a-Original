// ═══════════════════════════════════════════════════════
//  SOLICITAR SERVIÇO — solicitar-servico.js
// ═══════════════════════════════════════════════════════

const MODELOS_POR_MARCA = {
  Honda:    ["CG 160", "CG 150", "Biz 110", "Biz 125", "Pop 110", "Titan 150", "Titan 160", "CB 300", "CB 500", "PCX 150", "XRE 300"],
  Yamaha:   ["Fazer 150", "Fazer 250", "YBR 125", "Factor 125", "Factor 150", "MT-03", "NMAX 160", "Crosser 150"],
  Suzuki:   ["Yes 125", "Burgman 125", "GSR 150", "Intruder 125"],
  Kawasaki: ["Ninja 300", "Ninja 400", "Z400", "Versys 300"],
  Dafra:    ["Speed 150", "Next 250", "Kansas 150", "Apache 150"],
  Shineray: ["XY 50", "Phoenix 50"],
  Haojue:   ["DR 160", "HJ 150", "NK 150"],
  Outra:    []
}

let servicoSelecionado = ""

// ── AUTO-FILL ─────────────────────────────────────────
window.addEventListener("load", function () {
  // Auto-fill dados do cliente
  let dados = JSON.parse(localStorage.getItem("dadosCliente"))
  if (dados) {
    if (dados.nome)     document.getElementById("inputNome").value     = dados.nome
    if (dados.telefone) document.getElementById("inputTelefone").value = dados.telefone
  }

  // Veio do catálogo? Pré-seleciona a peça
  let peca = JSON.parse(localStorage.getItem("pecaSelecionada"))
  if (peca) {
    localStorage.removeItem("pecaSelecionada")
    servicoSelecionado = "Orçamento de peça: " + peca.nome

    setTimeout(function () {
      // Marca o botão "Outro"
      document.querySelectorAll(".servico-btn").forEach(function (b) {
        if (b.textContent.trim().includes("Outro")) {
          b.classList.add("selecionado")
        }
      })
      // Preenche o campo custom com o nome e preço da peça
      let custom = document.getElementById("inputServicoCustom")
      if (custom) {
        custom.style.display = "block"
        custom.value = "Orçamento de peça: " + peca.nome +
          (peca.preco ? " (R$ " + parseFloat(peca.preco).toFixed(2) + ")" : "")
      }
      // Se já tem dados do cliente salvo, vai direto pro passo 2
      if (dados && dados.nome && dados.telefone) {
        irPasso(2)
      }
    }, 150)
  }
})

// ── STEPS ────────────────────────────────────────────
function irPasso(n) {
  document.querySelectorAll(".passo").forEach(function (p) {
    p.classList.remove("ativo")
  })
  document.getElementById("passo" + n).classList.add("ativo")

  for (let i = 1; i <= 3; i++) {
    let dot  = document.getElementById("dot" + i)
    let lin  = document.getElementById("lin" + i)
    dot.classList.remove("ativo", "feito")
    if (i < n)       dot.classList.add("feito")
    else if (i === n) dot.classList.add("ativo")
    if (lin) lin.classList.toggle("feita", i < n)
  }

  window.scrollTo({ top: 0, behavior: "smooth" })
}

function irPasso2() {
  let nome     = document.getElementById("inputNome").value.trim()
  let telefone = document.getElementById("inputTelefone").value.trim()
  if (!nome)     { alert("Preencha seu nome!"); return }
  if (!telefone) { alert("Preencha seu WhatsApp!"); return }
  irPasso(2)
}

// ── SERVIÇO ───────────────────────────────────────────
function selecionarServico(el, servico) {
  document.querySelectorAll(".servico-btn").forEach(function (b) {
    b.classList.remove("selecionado")
  })
  el.classList.add("selecionado")
  servicoSelecionado = servico

  let custom = document.getElementById("inputServicoCustom")
  custom.style.display = servico === "Outro" ? "block" : "none"
  if (servico !== "Outro") custom.value = ""
}

// ── MODELOS ───────────────────────────────────────────
function atualizarModelos() {
  document.getElementById("inputModelo").value = ""
}

function mostrarSugestoes() {
  let marca  = document.getElementById("inputMarca").value
  let termo  = document.getElementById("inputModelo").value.toLowerCase()
  let modelos = MODELOS_POR_MARCA[marca] ||
    Object.values(MODELOS_POR_MARCA).flat()

  let filtro = modelos.filter(function (m) {
    return m.toLowerCase().includes(termo)
  })

  let lista = document.getElementById("sugestoesLista")
  if (!filtro.length || !termo) { lista.style.display = "none"; return }

  lista.innerHTML = filtro.slice(0, 6).map(function (m) {
    return `<div class="sugestao-item" onmousedown="escolherModelo('${m}')">${m}</div>`
  }).join("")
  lista.style.display = "block"
}

function escolherModelo(modelo) {
  document.getElementById("inputModelo").value = modelo
  document.getElementById("sugestoesLista").style.display = "none"
}

function esconderSugestoes() {
  setTimeout(function () {
    document.getElementById("sugestoesLista").style.display = "none"
  }, 150)
}

// ── ENVIAR SOLICITAÇÃO ────────────────────────────────
function enviarSolicitacao() {
  let nome     = document.getElementById("inputNome").value.trim()
  let telefone = document.getElementById("inputTelefone").value.trim()
  let marca    = document.getElementById("inputMarca").value
  let modelo   = document.getElementById("inputModelo").value.trim()
  let problema = document.getElementById("inputProblema").value.trim()
  let custom   = document.getElementById("inputServicoCustom").value.trim()

  let servico  = servicoSelecionado === "Outro"
    ? (custom || "Outro serviço")
    : servicoSelecionado

  if (!marca)   { alert("Selecione a marca da moto!"); return }
  if (!modelo)  { alert("Informe o modelo da moto!"); return }
  if (!servico) { alert("Selecione o serviço desejado!"); return }

  // Monta o objeto da solicitação
  let solicitacao = {
    id:           Date.now(),
    nome:         nome,
    telefone:     telefone,
    moto:         marca + " " + modelo,
    servico:      servico,
    problema:     problema,
    hora:         new Date().toLocaleString("pt-BR"),
    status:       "aguardando",
    orcamento:    null,
    obsOrcamento: ""
  }

  // Salva no Firebase (chega em tempo real no celular do Alisson)
  if (typeof fbSalvar !== "undefined") {
    fbSalvar("solicitacoes", solicitacao)
      .catch(function (err) { console.error("Erro Firebase:", err) })
  }

  // Salva também no localStorage como backup
  let lista = JSON.parse(localStorage.getItem("solicitacoesServico")) || []
  lista.push(solicitacao)
  localStorage.setItem("solicitacoesServico", JSON.stringify(lista))

  // Salva dados do cliente para auto-fill futuro
  localStorage.setItem("dadosCliente", JSON.stringify({ nome: nome, telefone: telefone }))

  // Mostra resumo na confirmação
  document.getElementById("confResumo").innerHTML = `
    <p>👤 <strong>${nome}</strong></p>
    <p>📞 <strong>${telefone}</strong></p>
    <p>🏍️ <strong>${marca} ${modelo}</strong></p>
    <p>🔧 <strong>${servico}</strong></p>
    ${problema ? `<p>📝 ${problema}</p>` : ""}
  `

  irPasso(3)
}

// ── NOVA SOLICITAÇÃO ──────────────────────────────────
function novaSolicitacao() {
  servicoSelecionado = ""
  document.getElementById("inputMarca").value    = ""
  document.getElementById("inputModelo").value   = ""
  document.getElementById("inputProblema").value = ""
  document.getElementById("inputServicoCustom").value  = ""
  document.getElementById("inputServicoCustom").style.display = "none"
  document.querySelectorAll(".servico-btn").forEach(function (b) {
    b.classList.remove("selecionado")
  })
  irPasso(1)
}
