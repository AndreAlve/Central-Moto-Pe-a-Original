// ----- MENU-------//

function abrirMenu() {
    let menu = document.getElementById('menu-celular')
    if (menu) menu.classList.toggle('aberto')
}

function fecharMenu() {
    let menu = document.getElementById('menu-celular')
    if (menu) menu.classList.remove('aberto')
}

// Fechar menu ao clicar em um link
document.querySelectorAll('#menu-celular a').forEach(link => {
    link.addEventListener('click', fecharMenu)
})


// LOGIN //

const USUARIO_ADMIN = "alisson"
const SENHA_ADMIN = "123456"



// Animação dos números
function animarNumeros() {
    document.querySelectorAll(".numero-val").forEach(function (el) {
        let alvo = parseInt(el.getAttribute("data-alvo"))
        let inicio = 0
        let duracao = 1500
        let passo = alvo / (duracao / 16)

        let timer = setInterval(function () {
            inicio += passo
            if (inicio >= alvo) {
                el.textContent = alvo + "+"
                clearInterval(timer)
            } else {
                el.textContent = Math.floor(inicio) + "+"
            }
        }, 16)
    })
}

// Dispara quando a seção entra na tela
let animou = false
window.addEventListener("scroll", function () {
    let secao = document.querySelector(".numeros")
    if (!secao || animou) return
    let rect = secao.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
        animou = true
        animarNumeros()
    }
})

// Configuração de administração//

verificarLogin()

// ── FUNCIONÁRIOS PADRÃO ──────────────────────────────
function getFuncionarios() {
    let lista = JSON.parse(localStorage.getItem("funcionarios"))
    if (!lista) {
        lista = [
            { id: 1, nome: "Alisson", funcao: "Proprietário" },
            { id: 2, nome: "Funcionário 1", funcao: "Mecânico" },
            { id: 3, nome: "Funcionário 2", funcao: "Mecânico" }
        ]
        localStorage.setItem("funcionarios", JSON.stringify(lista))
    }
    return lista
}

// ── PRODUTOS NO LOCALSTORAGE ─────────────────────────
function getProdutos() {
    let lista = JSON.parse(localStorage.getItem("produtosAdmin"))
    if (!lista) {
        lista = pecas.map(function (p, i) {
            return { id: i + 1, nome: p.nome, marca: p.marca, preco: p.preco, estoque: p.estoque }
        })
        localStorage.setItem("produtosAdmin", JSON.stringify(lista))
    }
    return lista
}

// ── TROCAR ABA ───────────────────────────────────────
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

// ── CARREGAR RESUMO ──────────────────────────────────
function carregarResumo() {
    let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let hoje = new Date().toLocaleDateString("pt-BR")

    let pendentes = [...orcamentos, ...agendamentos].filter(function (s) {
        return s.status === "Aguardando"
    })

    let clientes = getClientesUnicos()
    let hoje_srv = historico.filter(function (h) { return h.data === hoje })
    let entHoje = hoje_srv.reduce(function (a, h) { return a + (h.valor || 0) }, 0)

    document.getElementById("totalSolicitacoes").textContent = pendentes.length
    document.getElementById("totalClientes").textContent = clientes.length
    document.getElementById("totalServicos").textContent = historico.length
    document.getElementById("totalEntradas").textContent = "R$" + entHoje.toFixed(0)
}

// ── ABA SERVIÇOS ─────────────────────────────────────
function carregarServicos() {
    // Solicitações pendentes
    let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []
    let pendentes = [
        ...orcamentos.filter(function (o) { return o.status === "Aguardando" })
            .map(function (o) { return { ...o, tipo: "orcamento" } }),
        ...agendamentos.filter(function (a) { return a.status === "Aguardando" })
            .map(function (a) { return { ...a, tipo: "agendamento" } })
    ]

    let divPend = document.getElementById("listaSolicitacoes")
    if (pendentes.length === 0) {
        divPend.innerHTML = `<div class="empty"><span>🎉</span>Nenhuma solicitação pendente!</div>`
    } else {
        divPend.innerHTML = pendentes.map(function (s) {
            let tipoIcon = s.tipo === "orcamento" ? "💰" : "📅"
            let msgWpp = montarMsgWpp(s)
            return `
            <div class="card-item">
              <div class="card-topo">
                <div class="card-nome">${tipoIcon} ${s.nome}</div>
                <span class="badge-status badge-aguardando">Aguardando</span>
              </div>
              <p>📞 ${s.telefone} &nbsp;|&nbsp; 🏍️ ${s.moto || ""}</p>
              ${s.problema ? `<p>🔧 ${s.problema}</p>` : ""}
              ${s.data ? `<p>📅 ${s.data}${s.horario ? " às " + s.horario : ""}</p>` : ""}
              <div class="card-acoes">
                <button class="btn-acao btn-verde"
                  onclick="mudarStatus('${s.tipo}',${s.id},'Confirmado')">✅ Confirmar</button>
                <button class="btn-acao btn-vermelho"
                  onclick="mudarStatus('${s.tipo}',${s.id},'Cancelado')">❌ Cancelar</button>
                <a class="btn-notif" href="${msgWpp}" target="_blank">📲 WhatsApp</a>
              </div>
            </div>`
        }).join("")
    }

    // Serviços concluídos
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let divServ = document.getElementById("listaServicos")

    if (historico.length === 0) {
        divServ.innerHTML = `<div class="empty"><span>🔧</span>Nenhum serviço registrado ainda.</div>`
        return
    }

    divServ.innerHTML = [...historico].reverse().map(function (h) {
        let msgPronto = `https://wa.me/55${h.telefone.replace(/\D/g, "")}?text=Ol%C3%A1%20${encodeURIComponent(h.nome)}!%20Sua%20moto%20*${encodeURIComponent(h.moto)}*%20j%C3%A1%20est%C3%A1%20pronta!%20Pode%20passar%20na%20Central%20Moto%20Pe%C3%A7as%20para%20buscar.%20Qualquer%20d%C3%BAvida%20chama%20aqui.%20%F0%9F%8F%8D%EF%B8%8F`
        return `
          <div class="card-item">
            <div class="card-topo">
              <div class="card-nome">🔧 ${h.servico}</div>
              <span class="badge-status badge-confirmado">Concluído</span>
            </div>
            <p>👤 <strong>${h.nome}</strong> &nbsp;|&nbsp; 📞 ${h.telefone}</p>
            <p>🏍️ ${h.moto} — ${h.placa}</p>
            ${h.funcionario ? `<p>👨‍🔧 <span class="func-tag">${h.funcionario}</span></p>` : ""}
            ${h.pecas ? `<p>🔩 Peças: ${h.pecas}</p>` : ""}
            <p>💰 <strong>R$ ${(h.valor || 0).toFixed(2)}</strong>
               &nbsp;|&nbsp; 💳 ${h.pagamento || "—"}
               &nbsp;|&nbsp; 📅 ${h.data}</p>
            <div class="card-acoes">
              <a class="btn-notif" href="${msgPronto}" target="_blank">
                📲 Avisar que está pronto
              </a>
              <button class="btn-acao btn-vermelho"
                onclick="excluirServico(${h.id})">🗑️ Excluir</button>
            </div>
          </div>`
    }).join("")
}

function montarMsgWpp(s) {
    let tipo = s.tipo === "orcamento" ? "orçamento" : "agendamento"
    let msg = `Olá ${s.nome}! Recebemos sua solicitação de ${tipo}. Em breve entraremos em contato. Central Moto Peças 🏍️`
    return `https://wa.me/55${(s.telefone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
}

function mudarStatus(tipo, id, status) {
    let chave = tipo === "orcamento" ? "orcamentos" : "agendamentos"
    let lista = JSON.parse(localStorage.getItem(chave)) || []
    lista.forEach(function (i) { if (i.id == id) i.status = status })
    localStorage.setItem(chave, JSON.stringify(lista))
    carregarServicos()
    carregarResumo()
}

// ── ABA CLIENTES ─────────────────────────────────────
function getClientesUnicos() {
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
    let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []
    let mapa = {}

    // sourcery skip: avoid-function-declarations-in-blocks
    function adicionar(item) {
        let tel = (item.telefone || "").replace(/\D/g, "")
        if (!tel) return
        if (!mapa[tel]) {
            mapa[tel] = { nome: item.nome, telefone: item.telefone, servicos: [] }
        }
        if (item.servico || item.problema) {
            mapa[tel].servicos.push(item.servico || item.problema)
        }
    }

    historico.forEach(adicionar)
    orcamentos.forEach(adicionar)
    agendamentos.forEach(adicionar)
    return Object.values(mapa)
}

function carregarClientes(filtro) {
    let clientes = getClientesUnicos()
    if (filtro) {
        let t = filtro.toLowerCase()
        clientes = clientes.filter(function (c) {
            return c.nome.toLowerCase().includes(t) || c.telefone.includes(t)
        })
    }

    let div = document.getElementById("listaClientes")
    if (clientes.length === 0) {
        div.innerHTML = `<div class="empty"><span>👥</span>Nenhum cliente encontrado.</div>`
        return
    }

    div.innerHTML = clientes.map(function (c) {
        let msgWpp = `https://wa.me/55${c.telefone.replace(/\D/g, "")}?text=${encodeURIComponent("Olá " + c.nome + "! Aqui é a Central Moto Peças.")}`
        return `
          <div class="card-item">
            <div class="card-topo">
              <div class="card-nome">👤 ${c.nome}</div>
              <a class="btn-notif" href="${msgWpp}" target="_blank">📲 WhatsApp</a>
            </div>
            <p>📞 ${c.telefone}</p>
            ${c.servicos.length > 0
                ? `<p>🔧 ${c.servicos.slice(-2).join(" / ")}</p>`
                : ""}
          </div>`
    }).join("")
}

function filtrarClientes() {
    let v = document.getElementById("buscaCliente").value
    carregarClientes(v)
}

// ── ABA PRODUTOS ─────────────────────────────────────
function carregarProdutos() {
    let lista = getProdutos()
    let div = document.getElementById("listaProdutos")

    if (lista.length === 0) {
        div.innerHTML = `<div class="empty"><span>📦</span>Nenhum produto cadastrado.</div>`
        return
    }

    div.innerHTML = lista.map(function (p, i) {
        let est = p.estoque
        let bCls = est === 0 ? "badge-vermelho" : est < 6 ? "badge-amarelo" : "badge-verde"
        let bTxt = est === 0 ? "Sem estoque" : est < 6 ? "Últimas " + est : est + " em estoque"
        return `
          <div class="produto-card">
            <div style="font-size:28px">🔩</div>
            <div class="produto-info">
              <div class="produto-nome">${p.nome}</div>
              <div class="produto-meta">${p.marca}</div>
            </div>
            <div style="text-align:right">
              <div class="produto-preco">R$ ${(p.preco || 0).toFixed(2)}</div>
              <span class="estoque-badge badge ${bCls}" style="margin-top:4px;display:inline-block">
                ${bTxt}
              </span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="btn-acao btn-amarelo" onclick="editarProduto(${i})">✏️</button>
              <button class="btn-acao btn-vermelho" onclick="excluirProduto(${i})">🗑️</button>
            </div>
          </div>`
    }).join("")
}

function abrirFormProduto() {
    document.getElementById("formProduto").style.display = "block"
    document.getElementById("formProdutoTitulo").textContent = "➕ Novo Produto"
    document.getElementById("editProdutoIdx").value = "-1"
    document.getElementById("prodNome").value = ""
    document.getElementById("prodMarca").value = "Honda"
    document.getElementById("prodPreco").value = ""
    document.getElementById("prodEstoque").value = ""
}

function fecharFormProduto() {
    document.getElementById("formProduto").style.display = "none"
}

function editarProduto(idx) {
    let lista = getProdutos()
    let p = lista[idx]
    document.getElementById("formProduto").style.display = "block"
    document.getElementById("formProdutoTitulo").textContent = "✏️ Editar Produto"
    document.getElementById("editProdutoIdx").value = idx
    document.getElementById("prodNome").value = p.nome
    document.getElementById("prodMarca").value = p.marca
    document.getElementById("prodPreco").value = p.preco
    document.getElementById("prodEstoque").value = p.estoque
    window.scrollTo({ top: 0, behavior: "smooth" })
}

function salvarProduto() {
    let nome = document.getElementById("prodNome").value.trim()
    let marca = document.getElementById("prodMarca").value
    let preco = parseFloat(document.getElementById("prodPreco").value) || 0
    let estoque = parseInt(document.getElementById("prodEstoque").value) || 0
    let idx = parseInt(document.getElementById("editProdutoIdx").value)

    if (!nome) { alert("Digite o nome da peça!"); return }

    let lista = getProdutos()
    if (idx === -1) {
        lista.push({ id: Date.now(), nome: nome, marca: marca, preco: preco, estoque: estoque })
    } else {
        lista[idx] = { ...lista[idx], nome: nome, marca: marca, preco: preco, estoque: estoque }
    }
    localStorage.setItem("produtosAdmin", JSON.stringify(lista))
    fecharFormProduto()
    carregarProdutos()
}

function excluirProduto(idx) {
    if (!confirm("Remover este produto?")) return
    let lista = getProdutos()
    lista.splice(idx, 1)
    localStorage.setItem("produtosAdmin", JSON.stringify(lista))
    carregarProdutos()
}

// ── ABA FINANCEIRO ────────────────────────────────────
let periodoAtual = "hoje"

function filtrarFinanceiro(periodo, btn) {
    periodoAtual = periodo
    document.querySelectorAll(".fin-filtro").forEach(function (b) {
        b.classList.remove("ativo")
    })
    btn.classList.add("ativo")
    carregarFinanceiro()
}

function dentroDoperiodo(dataStr) {
    if (!dataStr || periodoAtual === "tudo") return true
    // dataStr formato: DD/MM/YYYY
    let partes = dataStr.split("/")
    if (partes.length < 3) return false
    let data = new Date(partes[2], partes[1] - 1, partes[0])
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

function carregarFinanceiro() {
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let saidas = JSON.parse(localStorage.getItem("saidas")) || []

    let entradas = historico
        .filter(function (h) { return dentroDoperiodo(h.data) })
        .reduce(function (a, h) { return a + (h.valor || 0) }, 0)

    let saidasVal = saidas
        .filter(function (s) { return dentroDoperiodo(s.data) })
        .reduce(function (a, s) { return a + (s.valor || 0) }, 0)

    let lucro = entradas - saidasVal

    document.getElementById("finEntradas").textContent = "R$ " + entradas.toFixed(2)
    document.getElementById("finSaidas").textContent = "R$ " + saidasVal.toFixed(2)
    document.getElementById("finLucro").textContent = "R$ " + lucro.toFixed(2)
    document.getElementById("finLucro").style.color = lucro >= 0 ? "#f5c400" : "#f87171"

    // Lançamentos unificados
    let lancamentos = [
        ...historico
            .filter(function (h) { return dentroDoperiodo(h.data) })
            .map(function (h) {
                return {
                    tipo: "entrada",
                    desc: h.servico + " — " + h.nome,
                    val: h.valor || 0,
                    data: h.data,
                    sub: h.pagamento || "—"
                }
            }),
        ...saidas
            .filter(function (s) { return dentroDoperiodo(s.data) })
            .map(function (s) {
                return {
                    tipo: "saida",
                    desc: s.desc,
                    val: s.valor || 0,
                    data: s.data,
                    sub: s.categ
                }
            })
    ]

    lancamentos.sort(function (a, b) {
        return (b.data || "").localeCompare(a.data || "")
    })

    let div = document.getElementById("listaLancamentos")
    if (lancamentos.length === 0) {
        div.innerHTML = `<div class="empty"><span>💰</span>Nenhum lançamento no período.</div>`
        return
    }

    div.innerHTML = lancamentos.map(function (l) {
        let icon = l.tipo === "entrada" ? "⬆️" : "⬇️"
        return `
          <div class="lancamento-card">
            <div class="lanc-tipo ${l.tipo}">${icon}</div>
            <div class="lanc-info">
              <div class="lanc-desc">${l.desc}</div>
              <div class="lanc-meta">${l.sub} &nbsp;|&nbsp; 📅 ${l.data}</div>
            </div>
            <div class="lanc-val ${l.tipo}">
              ${l.tipo === "entrada" ? "+" : "-"}R$ ${(l.val || 0).toFixed(2)}
            </div>
          </div>`
    }).join("")
}

function abrirModalSaida() {
    let hoje = new Date().toISOString().split("T")[0]
    document.getElementById("saidaData").value = hoje
    document.getElementById("saidaDesc").value = ""
    document.getElementById("saidaValor").value = ""
    document.getElementById("modalSaida").classList.add("aberto")
}

function fecharModalSaida() {
    document.getElementById("modalSaida").classList.remove("aberto")
}

function salvarSaida() {
    let desc = document.getElementById("saidaDesc").value.trim()
    let valor = parseFloat(document.getElementById("saidaValor").value) || 0
    let categ = document.getElementById("saidaCateg").value
    let data = document.getElementById("saidaData").value

    if (!desc || !valor) { alert("Preenche a descrição e o valor!"); return }

    let dataFmt = data.split("-").reverse().join("/")

    let lista = JSON.parse(localStorage.getItem("saidas")) || []
    lista.push({ id: Date.now(), desc: desc, valor: valor, categ: categ, data: dataFmt })
    localStorage.setItem("saidas", JSON.stringify(lista))

    fecharModalSaida()
    carregarFinanceiro()
    carregarResumo()
}

// ── ABA FUNCIONÁRIOS ──────────────────────────────────
function carregarFuncionarios() {
    let lista = getFuncionarios()
    let historico = JSON.parse(localStorage.getItem("historico")) || []
    let div = document.getElementById("listaFuncionarios")

    div.innerHTML = lista.map(function (f) {
        return `
          <div class="card-item" style="display:flex;align-items:center;gap:14px">
            <div style="font-size:32px">👷</div>
            <div style="flex:1">
              <div class="card-nome">${f.nome}</div>
              <div style="color:#555;font-size:13px">${f.funcao}</div>
            </div>
            ${f.id !== 1
                ? `<button class="btn-acao btn-vermelho" onclick="excluirFuncionario(${f.id})">🗑️</button>`
                : ""}
          </div>`
    }).join("")

    // Ranking
    let ranking = {}
    lista.forEach(function (f) { ranking[f.nome] = 0 })
    historico.forEach(function (h) {
        if (h.funcionario) ranking[h.funcionario] = (ranking[h.funcionario] || 0) + 1
    })

    let rankDiv = document.getElementById("rankingFuncionarios")
    let sorted = Object.entries(ranking).sort(function (a, b) { return b[1] - a[1] })

    rankDiv.innerHTML = sorted.map(function (r, i) {
        let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"
        return `
          <div class="card-item" style="display:flex;align-items:center;gap:14px">
            <div style="font-size:28px">${medal}</div>
            <div style="flex:1">
              <div class="card-nome">${r[0]}</div>
            </div>
            <div style="color:#f5c400;font-size:22px;font-weight:900">
              ${r[1]} serviço${r[1] !== 1 ? "s" : ""}
            </div>
          </div>`
    }).join("")
}

function abrirModalFuncionario() {
    document.getElementById("funcNome").value = ""
    document.getElementById("funcFuncao").value = ""
    document.getElementById("modalFuncionario").classList.add("aberto")
}

function fecharModalFuncionario() {
    document.getElementById("modalFuncionario").classList.remove("aberto")
}

function salvarFuncionario() {
    let nome = document.getElementById("funcNome").value.trim()
    let funcao = document.getElementById("funcFuncao").value.trim() || "Mecânico"
    if (!nome) { alert("Digite o nome!"); return }
    let lista = getFuncionarios()
    lista.push({ id: Date.now(), nome: nome, funcao: funcao })
    localStorage.setItem("funcionarios", JSON.stringify(lista))
    fecharModalFuncionario()
    carregarFuncionarios()
}

function excluirFuncionario(id) {
    if (!confirm("Remover funcionário?")) return
    let lista = getFuncionarios().filter(function (f) { return f.id !== id })
    localStorage.setItem("funcionarios", JSON.stringify(lista))
    carregarFuncionarios()
}

// ── INICIAR TUDO ──────────────────────────────────────
carregarResumo()
carregarServicos()
carregarClientes()
carregarProdutos()
carregarFinanceiro()
carregarFuncionarios()
