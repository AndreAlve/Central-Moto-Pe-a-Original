// ═══════════════════════════════════════════════════════
//  EQUIPE — equipe.js
// ═══════════════════════════════════════════════════════

// Cores disponíveis para o avatar
const CORES = [
    "#e82d2d", "#f5c400", "#4ade80", "#60a5fa",
    "#c084fc", "#f97316", "#ec4899", "#14b8a6"
]

let corSelecionada = CORES[0]
let funcFiltroAtual = "todos"

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
    inicializarFuncionarios()
    renderTudo()

    document.getElementById("modalFunc").addEventListener("click", function (e) {
        if (e.target === this) fecharModalFunc()
    })
    document.getElementById("modalDetalhe").addEventListener("click", function (e) {
        if (e.target === this) fecharModalDetalhe()
    })
})

// ── DADOS ─────────────────────────────────────────────
function getFuncionarios() {
    return JSON.parse(localStorage.getItem("funcionarios")) || []
}

function setFuncionarios(lista) {
    localStorage.setItem("funcionarios", JSON.stringify(lista))
}

function getHistorico() {
    return JSON.parse(localStorage.getItem("historico")) || []
}

// Cria os 3 funcionários padrão se ainda não existirem
function inicializarFuncionarios() {
    let lista = getFuncionarios()
    if (lista.length === 0) {
        lista = [
            { id: 1, nome: "Alisson", cargo: "Proprietário", cor: "#e82d2d", proprietario: true },
            { id: 2, nome: "Funcionário 1", cargo: "Mecânico", cor: "#60a5fa", proprietario: false },
            { id: 3, nome: "Funcionário 2", cargo: "Mecânico", cor: "#4ade80", proprietario: false }
        ]
        setFuncionarios(lista)
    }
}

function toast(msg, cor) {
    let t = document.getElementById("toast")
    t.textContent = msg
    t.className = "toast " + (cor || "") + " visivel"
    setTimeout(function () { t.classList.remove("visivel") }, 2500)
}

// ── RENDER TUDO ───────────────────────────────────────
function renderTudo() {
    let funcionarios = getFuncionarios()
    let historico = getHistorico()

    // Conta serviços por funcionário
    let contagem = {}
    let faturado = {}
    funcionarios.forEach(function (f) {
        contagem[f.nome] = 0
        faturado[f.nome] = 0
    })
    historico.forEach(function (h) {
        if (h.funcionario && contagem[h.funcionario] !== undefined) {
            contagem[h.funcionario]++
            faturado[h.funcionario] = (faturado[h.funcionario] || 0) + (h.valor || 0)
        }
    })

    // Top do mês
    let hoje = new Date()
    let mes = hoje.getMonth()
    let ano = hoje.getFullYear()
    let contagemMes = {}
    historico.forEach(function (h) {
        if (!h.data || !h.funcionario) return
        let partes = h.data.split("/")
        if (partes.length < 3) return
        let d = new Date(partes[2], partes[1] - 1, partes[0])
        if (d.getMonth() === mes && d.getFullYear() === ano) {
            contagemMes[h.funcionario] = (contagemMes[h.funcionario] || 0) + 1
        }
    })
    let topMes = Object.entries(contagemMes).sort(function (a, b) { return b[1] - a[1] })[0]

    // Cards resumo
    document.getElementById("totalFuncionarios").textContent = funcionarios.length
    document.getElementById("totalServicos").textContent = historico.length
    document.getElementById("topFuncionario").textContent = topMes ? topMes[0].split(" ")[0] : "—"

    // Lista de funcionários
    renderFuncionarios(funcionarios, contagem, faturado)

    // Ranking
    renderRanking(funcionarios, contagem)

    // Filtros por funcionário
    renderFiltros(funcionarios)

    // Serviços do filtro atual
    renderServicosFuncionario(historico)
}

// ── LISTA DE FUNCIONÁRIOS ─────────────────────────────
function renderFuncionarios(funcionarios, contagem, faturado) {
    let div = document.getElementById("listaFuncionarios")

    if (funcionarios.length === 0) {
        div.innerHTML = `<div class="empty-state"><span>👷</span>Nenhum funcionário cadastrado.</div>`
        return
    }

    div.innerHTML = funcionarios.map(function (f) {
        let nServ = contagem[f.nome] || 0
        let nFat = faturado[f.nome] || 0
        let inicial = f.nome.trim()[0].toUpperCase()

        return `
      <div class="func-card" onclick="abrirDetalhe(${f.id})">
        <div class="func-avatar"
             style="background:${f.cor}20;border-color:${f.cor}50;color:${f.cor}">
          ${inicial}
        </div>
        <div class="func-info">
          <div class="func-nome">
            ${f.nome}
            ${f.proprietario ? `<span class="tag-proprietario">👑 Proprietário</span>` : ""}
          </div>
          <div class="func-cargo">${f.cargo || "—"}</div>
          <div class="func-stats">
            <div class="func-stat">🔧 <strong>${nServ}</strong> serviço${nServ !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div class="func-dir">
          <div class="func-total-val">R$ ${nFat.toFixed(2)}</div>
          <div class="func-total-label">faturado</div>
        </div>
        <div class="func-acoes" onclick="event.stopPropagation()">
          <button class="btn-func-acao btn-func-edit"
            onclick="abrirModalEditar(${f.id})">✏️</button>
          ${!f.proprietario
                ? `<button class="btn-func-acao btn-func-del"
                onclick="excluirFuncionario(${f.id})">🗑️</button>`
                : ""}
        </div>
      </div>`
    }).join("")
}

// ── RANKING ───────────────────────────────────────────
function renderRanking(funcionarios, contagem) {
    let div = document.getElementById("rankingFuncionarios")

    let ordenado = [...funcionarios].sort(function (a, b) {
        return (contagem[b.nome] || 0) - (contagem[a.nome] || 0)
    })

    let maximo = Math.max(...ordenado.map(function (f) { return contagem[f.nome] || 0 }), 1)

    let medalhas = ["🥇", "🥈", "🥉"]

    div.innerHTML = ordenado.map(function (f, i) {
        let nServ = contagem[f.nome] || 0
        let percent = Math.round((nServ / maximo) * 100)

        return `
      <div class="ranking-card">
        <div class="rank-posicao">${medalhas[i] || (i + 1) + "º"}</div>
        <div class="rank-barra-wrap">
          <div class="rank-nome">${f.nome}</div>
          <div class="rank-barra-bg">
            <div class="rank-barra-fill"
                 style="width:${percent}%;background:${f.cor}"></div>
          </div>
        </div>
        <div>
          <div class="rank-num" style="color:${f.cor}">${nServ}</div>
          <div class="rank-label">serviço${nServ !== 1 ? "s" : ""}</div>
        </div>
      </div>`
    }).join("")
}

// ── FILTROS POR FUNCIONÁRIO ───────────────────────────
function renderFiltros(funcionarios) {
    let div = document.getElementById("filtroFuncRow")

    div.innerHTML = `
    <button class="filtro-func-btn ${funcFiltroAtual === "todos" ? "ativo" : ""}"
      onclick="setFiltroFunc('todos', this)">
      📋 Todos
    </button>
    ${funcionarios.map(function (f) {
        return `
        <button class="filtro-func-btn ${funcFiltroAtual === f.nome ? "ativo" : ""}"
          onclick="setFiltroFunc('${f.nome}', this)"
          style="${funcFiltroAtual === f.nome ? "background:" + f.cor + ";border-color:" + f.cor + ";color:white" : ""}">
          ${f.nome.split(" ")[0]}
        </button>`
    }).join("")}
  `
}

function setFiltroFunc(nome, btn) {
    funcFiltroAtual = nome
    renderFiltros(getFuncionarios())
    renderServicosFuncionario(getHistorico())
}

// ── SERVIÇOS POR FUNCIONÁRIO ──────────────────────────
function renderServicosFuncionario(historico) {
    let div = document.getElementById("listaServicosFuncionario")

    let filtrado = funcFiltroAtual === "todos"
        ? historico
        : historico.filter(function (h) { return h.funcionario === funcFiltroAtual })

    filtrado = [...filtrado].reverse()

    if (filtrado.length === 0) {
        div.innerHTML = `<div class="empty-state"><span>🔧</span>Nenhum serviço encontrado.</div>`
        return
    }

    // Cor do funcionário
    let funcionarios = getFuncionarios()
    function getCor(nome) {
        let f = funcionarios.find(function (x) { return x.nome === nome })
        return f ? f.cor : "#666"
    }

    div.innerHTML = filtrado.slice(0, 20).map(function (h) {
        let cor = getCor(h.funcionario || "")
        return `
      <div class="serv-mini-card" style="border-left-color:${cor}">
        <div style="font-size:22px">🔧</div>
        <div class="serv-mini-info">
          <div class="serv-mini-nome">${h.servico}</div>
          <div class="serv-mini-meta">
            👤 ${h.nome}
            · 🏍️ ${h.moto || "—"}
            ${h.funcionario ? `· <span style="color:${cor};font-weight:bold">${h.funcionario}</span>` : ""}
            · 📅 ${h.data}
          </div>
        </div>
        <div class="serv-mini-val">R$ ${(h.valor || 0).toFixed(2)}</div>
      </div>`
    }).join("")

    if (filtrado.length > 20) {
        div.innerHTML += `
      <div style="text-align:center;color:#333;font-size:13px;padding:12px">
        Mostrando os 20 mais recentes de ${filtrado.length} serviços
      </div>`
    }
}

// ── MODAL ADICIONAR ───────────────────────────────────
function abrirModalAdd() {
    corSelecionada = CORES[0]
    document.getElementById("modalFuncBox").innerHTML = montarForm(null)
    document.getElementById("modalFunc").classList.add("aberto")
}

// ── MODAL EDITAR ──────────────────────────────────────
function abrirModalEditar(id) {
    let f = getFuncionarios().find(function (x) { return x.id === id })
    if (!f) return
    corSelecionada = f.cor || CORES[0]
    document.getElementById("modalFuncBox").innerHTML = montarForm(f)
    document.getElementById("modalFunc").classList.add("aberto")
}

// ── MONTAR FORMULÁRIO ─────────────────────────────────
function montarForm(f) {
    let isEdit = !!f
    return `
    <div class="modal-topo">
      <h3>${isEdit ? "✏️ Editar Funcionário" : "➕ Novo Funcionário"}</h3>
      <button class="btn-fechar-modal" onclick="fecharModalFunc()">✕</button>
    </div>
    <div class="modal-corpo">

      <div class="modal-secao-titulo">👤 Dados</div>

      <label>Nome *</label>
      <input id="fNome" type="text"
             placeholder="Ex: João Silva"
             value="${f ? f.nome : ""}">

      <label>Cargo / Função</label>
      <input id="fCargo" type="text"
             placeholder="Ex: Mecânico, Auxiliar..."
             value="${f ? (f.cargo || "") : ""}">

      <div class="modal-secao-titulo">🎨 Cor do avatar</div>
      <div class="cores-grid">
        ${CORES.map(function (cor) {
        return `
            <div class="cor-opcao ${cor === corSelecionada ? "selecionada" : ""}"
                 style="background:${cor}"
                 onclick="selecionarCor('${cor}', this)">
            </div>`
    }).join("")}
      </div>

      <div class="modal-acoes">
        <button class="btn-modal-salvar"
          onclick="salvarFuncionario(${f ? f.id : -1})">
          💾 ${isEdit ? "Salvar alterações" : "Adicionar"}
        </button>
        <button class="btn-modal-sec" onclick="fecharModalFunc()">Cancelar</button>
      </div>

    </div>
  `
}

function selecionarCor(cor, el) {
    corSelecionada = cor
    document.querySelectorAll(".cor-opcao").forEach(function (c) {
        c.classList.remove("selecionada")
    })
    el.classList.add("selecionada")
}

// ── SALVAR FUNCIONÁRIO ────────────────────────────────
function salvarFuncionario(id) {
    let nome = document.getElementById("fNome").value.trim()
    let cargo = document.getElementById("fCargo").value.trim()

    if (!nome) { alert("Digite o nome!"); return }

    let lista = getFuncionarios()

    if (id === -1) {
        lista.push({
            id: Date.now(),
            nome: nome,
            cargo: cargo || "Mecânico",
            cor: corSelecionada,
            proprietario: false
        })
        toast("✅ Funcionário adicionado!", "verde")
    } else {
        lista = lista.map(function (f) {
            if (f.id === id) {
                return { ...f, nome: nome, cargo: cargo, cor: corSelecionada }
            }
            return f
        })
        toast("✅ Funcionário atualizado!", "verde")
    }

    setFuncionarios(lista)
    fecharModalFunc()
    renderTudo()
}

// ── EXCLUIR FUNCIONÁRIO ───────────────────────────────
function excluirFuncionario(id) {
    let f = getFuncionarios().find(function (x) { return x.id === id })
    if (!f) return
    if (!confirm("Remover " + f.nome + " da equipe?")) return

    let lista = getFuncionarios().filter(function (x) { return x.id !== id })
    setFuncionarios(lista)
    renderTudo()
    toast("🗑️ Funcionário removido!", "vermelho")
}

// ── MODAL DETALHE DO FUNCIONÁRIO ──────────────────────
function abrirDetalhe(id) {
    let funcionarios = getFuncionarios()
    let f = funcionarios.find(function (x) { return x.id === id })
    if (!f) return

    let historico = getHistorico()
    let servicos = historico.filter(function (h) { return h.funcionario === f.nome })
    let total = servicos.reduce(function (a, h) { return a + (h.valor || 0) }, 0)
    let inicial = f.nome.trim()[0].toUpperCase()

    // Serviços do mês
    let hoje = new Date()
    let servicosMes = servicos.filter(function (h) {
        if (!h.data) return false
        let p = h.data.split("/")
        if (p.length < 3) return false
        let d = new Date(p[2], p[1] - 1, p[0])
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
    })

    let histHtml = servicos.length > 0
        ? [...servicos].reverse().slice(0, 8).map(function (h) {
            return `
          <div style="display:flex;justify-content:space-between;align-items:center;
                      padding:10px 0;border-bottom:1px solid #111">
            <div>
              <div style="color:white;font-size:14px;font-weight:bold">🔧 ${h.servico}</div>
              <div style="color:#444;font-size:12px;margin-top:2px">
                👤 ${h.nome} · 🏍️ ${h.moto || "—"} · 📅 ${h.data}
              </div>
            </div>
            <div style="color:#4ade80;font-weight:900;font-size:14px;white-space:nowrap;margin-left:10px">
              R$ ${(h.valor || 0).toFixed(2)}
            </div>
          </div>`
        }).join("")
        : `<div style="color:#333;font-size:13px;padding:12px 0">Nenhum serviço registrado ainda.</div>`

    document.getElementById("modalDetalheBox").innerHTML = `
    <div class="modal-topo">
      <h3>👤 ${f.nome}</h3>
      <button class="btn-fechar-modal" onclick="fecharModalDetalhe()">✕</button>
    </div>
    <div class="modal-corpo">

      <!-- Perfil -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:22px">
        <div style="width:64px;height:64px;border-radius:50%;
                    background:${f.cor}20;border:2px solid ${f.cor}50;
                    display:flex;align-items:center;justify-content:center;
                    font-size:26px;font-weight:900;color:${f.cor}">
          ${inicial}
        </div>
        <div>
          <div style="color:white;font-size:20px;font-weight:900">${f.nome}</div>
          <div style="color:#555;font-size:14px">${f.cargo || "—"}</div>
          ${f.proprietario ? `<span class="tag-proprietario">👑 Proprietário</span>` : ""}
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <div style="background:rgba(255,255,255,0.03);border:1px solid #1a1a1a;
                    border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:${f.cor}">${servicos.length}</div>
          <div style="font-size:11px;color:#444;text-transform:uppercase">Total</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid #1a1a1a;
                    border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#f5c400">${servicosMes.length}</div>
          <div style="font-size:11px;color:#444;text-transform:uppercase">Este mês</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid #1a1a1a;
                    border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:900;color:#4ade80">R$ ${total.toFixed(0)}</div>
          <div style="font-size:11px;color:#444;text-transform:uppercase">Faturado</div>
        </div>
      </div>

      <!-- Histórico -->
      <div style="font-size:11px;font-weight:bold;color:#f5c400;text-transform:uppercase;
                  letter-spacing:0.1em;margin-bottom:10px">
        🔧 Últimos serviços
      </div>
      ${histHtml}

    </div>
  `

    document.getElementById("modalDetalhe").classList.add("aberto")
}

// ── FECHAR MODAIS ─────────────────────────────────────
function fecharModalFunc() { document.getElementById("modalFunc").classList.remove("aberto") }
function fecharModalDetalhe() { document.getElementById("modalDetalhe").classList.remove("aberto") }