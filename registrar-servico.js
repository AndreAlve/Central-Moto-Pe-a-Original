// ═══════════════════════════════════════════════════════
//  REGISTRAR SERVIÇO — registrar-servico.js
// ═══════════════════════════════════════════════════════

let pecasSelecionadas = []
let ultimoRegistro = null

// ── INIT ─────────────────────────────────────────────
window.addEventListener("load", function () {
  // Data padrão = hoje
  let hoje = new Date().toISOString().split("T")[0]
  document.getElementById("inputData").value = hoje

  // Carrega funcionários no select
  let funcs = JSON.parse(localStorage.getItem("funcionarios")) || []
  let selFun = document.getElementById("inputFuncionario")
  funcs.forEach(function (f) {
    let opt = document.createElement("option")
    opt.value = f.nome
    opt.text = f.nome + (f.funcao ? " — " + f.funcao : "")
    selFun.appendChild(opt)
  })
})

// ── BUSCA DE CLIENTE ─────────────────────────────────
function buscarCliente() {
  let termo = document.getElementById("buscaClienteInput").value.trim().toLowerCase()
  if (!termo) return

  let historico = JSON.parse(localStorage.getItem("historico")) || []
  let orcamentos = JSON.parse(localStorage.getItem("orcamentos")) || []
  let agendamentos = JSON.parse(localStorage.getItem("agendamentos")) || []

  let mapa = {}

  function adicionar(item) {
    let tel = (item.telefone || "").replace(/\D/g, "")
    if (!tel || !item.nome) return
    if (!mapa[tel]) {
      mapa[tel] = {
        nome: item.nome,
        telefone: item.telefone,
        moto: item.moto || "",
        placa: item.placa || ""
      }
    }
  }

  historico.forEach(adicionar)
  orcamentos.forEach(adicionar)
  agendamentos.forEach(adicionar)

  let lista = Object.values(mapa).filter(function (c) {
    return c.nome.toLowerCase().includes(termo) ||
      c.telefone.includes(termo) ||
      (c.placa || "").toLowerCase().includes(termo)
  })

  let div = document.getElementById("resultadoBusca")

  if (lista.length === 0) {
    div.className = "resultado-busca visivel"
    div.innerHTML = `<div style="color:#555;font-size:13px;padding:8px">
      😕 Não encontrado. Preencha manualmente abaixo.
    </div>`
    return
  }

  div.className = "resultado-busca visivel"
  div.innerHTML = lista.slice(0, 5).map(function (c) {
    let json = encodeURIComponent(JSON.stringify(c))
    return `
      <div class="cli-opcao" onclick="preencherCliente('${json}')">
        <div>
          <div class="cli-opcao-nome">👤 ${c.nome}</div>
          <div class="cli-opcao-meta">
            📞 ${c.telefone}
            ${c.moto ? " · 🏍️ " + c.moto : ""}
            ${c.placa ? " · " + c.placa : ""}
          </div>
        </div>
        <span class="cli-opcao-tag">Selecionar</span>
      </div>`
  }).join("")
}

function preencherCliente(json) {
  let c = JSON.parse(decodeURIComponent(json))
  document.getElementById("inputNome").value = c.nome || ""
  document.getElementById("inputTelefone").value = c.telefone || ""
  document.getElementById("inputPlaca").value = c.placa || ""

  if (c.moto) {
    let marcas = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Dafra", "Shineray", "Haojue"]
    let partes = c.moto.split(" ")
    let marcaEncontrada = marcas.find(function (m) { return partes[0] === m }) || "Outra"
    document.getElementById("inputMarca").value = marcaEncontrada
    document.getElementById("inputModelo").value = partes.slice(1).join(" ")
  }

  document.getElementById("resultadoBusca").className = "resultado-busca"
  document.getElementById("buscaClienteInput").value = ""
  document.getElementById("badgeAutofill").className = "badge-autofill visivel"
}

function limparCliente() {
  document.getElementById("inputNome").value = ""
  document.getElementById("inputTelefone").value = ""
  document.getElementById("inputMarca").value = ""
  document.getElementById("inputModelo").value = ""
  document.getElementById("inputPlaca").value = ""
  document.getElementById("inputKm").value = ""
  document.getElementById("badgeAutofill").className = "badge-autofill"
}

// ── CATÁLOGO DE PEÇAS ─────────────────────────────────
function abrirCatalogo() {
  document.getElementById("modalCatalogo").classList.add("aberto")
  document.getElementById("buscaModalPeca").value = ""
  renderCatalogo()
}

function fecharCatalogo() {
  document.getElementById("modalCatalogo").classList.remove("aberto")
}

function iconesPeca(nome) {
  nome = nome.toLowerCase()
  if (nome.includes("pneu")) return "🛞"
  if (nome.includes("freio") || nome.includes("pastilha")) return "🛑"
  if (nome.includes("óleo") || nome.includes("filtro")) return "🛢️"
  if (nome.includes("corrente") || nome.includes("relação")) return "⛓️"
  if (nome.includes("vela")) return "⚡"
  if (nome.includes("cabo")) return "🔌"
  if (nome.includes("amortecedor")) return "🔧"
  return "🔩"
}

function renderCatalogo() {
  let busca = document.getElementById("buscaModalPeca").value.toLowerCase()
  let lista = JSON.parse(localStorage.getItem("produtosAdmin")) || []

  // Fallback para o array do script.js se o localStorage estiver vazio
  if (!lista.length && typeof pecas !== "undefined") lista = pecas

  let filtrada = lista.filter(function (p) {
    return !busca || p.nome.toLowerCase().includes(busca)
  })

  let div = document.getElementById("modalListaPecas")

  div.innerHTML = filtrada.map(function (p) {
    let est = p.estoque || 0
    let estCls = est === 0 ? "cat-est-zer" : est < 6 ? "cat-est-low" : "cat-est-ok"
    let estTxt = est === 0 ? "❌ Sem estoque" : est < 6 ? "⚠️ " + est + " restantes" : "✅ " + est + " em estoque"
    let jatem = pecasSelecionadas.find(function (s) { return s.nome === p.nome })
    let json = encodeURIComponent(JSON.stringify({ nome: p.nome, preco: p.preco, estoque: est }))

    return `
      <div class="catalogo-item ${est === 0 ? "sem-estoque" : ""}"
           ${est > 0 ? `onclick="adicionarPeca('${json}')"` : ""}>
        <div class="cat-icone">${iconesPeca(p.nome)}</div>
        <div class="cat-info">
          <div class="cat-nome">${p.nome}</div>
          <div class="cat-meta">
            ${p.marca}
            <span class="${estCls}" style="margin-left:8px">${estTxt}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="cat-preco">R$ ${(p.preco || 0).toFixed(2)}</div>
          ${jatem
        ? `<div style="color:#4ade80;font-size:11px;margin-top:4px">✅ Adicionada</div>`
        : est > 0 ? `<div style="color:#888;font-size:11px;margin-top:4px">Toque p/ add</div>` : ""}
        </div>
      </div>`
  }).join("")
}

function adicionarPeca(json) {
  let p = JSON.parse(decodeURIComponent(json))
  let existente = pecasSelecionadas.find(function (s) { return s.nome === p.nome })
  if (existente) {
    existente.qtd++
  } else {
    pecasSelecionadas.push({ nome: p.nome, preco: p.preco, estoque: p.estoque, qtd: 1 })
  }
  renderTagsPecas()
  renderCatalogo()
}

function removerPeca(nome) {
  pecasSelecionadas = pecasSelecionadas.filter(function (p) { return p.nome !== nome })
  renderTagsPecas()
}

function renderTagsPecas() {
  let div = document.getElementById("pecasSelecionadas")
  if (pecasSelecionadas.length === 0) {
    div.innerHTML = '<span class="pecas-vazio">Nenhuma peça selecionada</span>'
    return
  }
  div.innerHTML = pecasSelecionadas.map(function (p) {
    let nomeEsc = p.nome.replace(/'/g, "\\'")
    return `
      <div class="peca-tag">
        ${p.nome}
        <span class="peca-tag-qtd">x${p.qtd}</span>
        <span style="color:#f5c400;font-size:11px">R$${(p.preco * p.qtd).toFixed(2)}</span>
        <button class="peca-tag-remove" onclick="removerPeca('${nomeEsc}')">✕</button>
      </div>`
  }).join("")
}

// ── PIX / FOTO ────────────────────────────────────────
function mostrarPix() {
  let val = document.getElementById("inputPagamento").value
  document.getElementById("caixaPix").style.display = val === "Pix" ? "block" : "none"
}

function copiarPix() {
  navigator.clipboard.writeText("(94) 9 9571-8970")
  let a = document.getElementById("pixCopiado")
  a.style.display = "block"
  setTimeout(function () { a.style.display = "none" }, 2000)
}

function previewFoto(input) {
  if (!input.files || !input.files[0]) return
  let reader = new FileReader()
  reader.onload = function (e) {
    document.getElementById("fotoPreviewImg").src = e.target.result
    document.getElementById("fotoPreviewImg").style.display = "block"
    document.getElementById("fotoPlaceholder").style.display = "none"
    document.getElementById("btnRemoverImg").style.display = "block"
  }
  reader.readAsDataURL(input.files[0])
}

function removerFoto(e) {
  if (e) e.stopPropagation()
  document.getElementById("inputFoto").value = ""
  document.getElementById("fotoPreviewImg").style.display = "none"
  document.getElementById("fotoPlaceholder").style.display = "block"
  document.getElementById("btnRemoverImg").style.display = "none"
}

// ── REGISTRAR SERVIÇO ─────────────────────────────────
function registrarServico() {
  let nome = document.getElementById("inputNome").value.trim()
  let telefone = document.getElementById("inputTelefone").value.trim()
  let marca = document.getElementById("inputMarca").value
  let modelo = document.getElementById("inputModelo").value.trim()
  let placa = document.getElementById("inputPlaca").value.trim().toUpperCase()
  let km = document.getElementById("inputKm").value
  let servico = document.getElementById("inputServico").value
  let funcionario = document.getElementById("inputFuncionario").value
  let obs = document.getElementById("inputObs").value.trim()
  let valor = parseFloat(document.getElementById("inputValor").value) || 0
  let data = document.getElementById("inputData").value
  let pagamento = document.getElementById("inputPagamento").value
  let pecasExtra = document.getElementById("inputPecasExtra").value.trim()

  if (!nome) { alert("Preenche o nome do cliente!"); return }
  if (!telefone) { alert("Preenche o telefone!"); return }
  if (!marca) { alert("Seleciona a marca da moto!"); return }
  if (!modelo) { alert("Preenche o modelo!"); return }
  if (!placa) { alert("Preenche a placa!"); return }
  if (!servico) { alert("Seleciona o serviço realizado!"); return }
  if (!funcionario) { alert("Seleciona quem fez o serviço!"); return }
  if (!data) { alert("Seleciona a data!"); return }

  let dataFmt = data.split("-").reverse().join("/")

  let pecasTexto = pecasSelecionadas.map(function (p) {
    return p.nome + (p.qtd > 1 ? " x" + p.qtd : "")
  }).join(", ")
  if (pecasExtra) pecasTexto += (pecasTexto ? ", " : "") + pecasExtra

  function salvarComFoto(fotoBase64) {
    let registro = {
      id: Date.now(),
      nome: nome,
      telefone: telefone,
      moto: marca + " " + modelo,
      placa: placa,
      km: km,
      servico: servico,
      funcionario: funcionario,
      obs: obs,
      pecas: pecasTexto,
      pecasDetalhes: JSON.parse(JSON.stringify(pecasSelecionadas)),
      valor: valor,
      data: dataFmt,
      pagamento: pagamento || "Não informado",
      foto: fotoBase64 || null
    }

    // Salva no histórico
    let hist = JSON.parse(localStorage.getItem("historico")) || []
    hist.push(registro)
    localStorage.setItem("historico", JSON.stringify(hist))

    // Baixa estoque automaticamente
    let produtos = JSON.parse(localStorage.getItem("produtosAdmin")) || []
    pecasSelecionadas.forEach(function (ps) {
      let prod = produtos.find(function (p) { return p.nome === ps.nome })
      if (prod) prod.estoque = Math.max(0, prod.estoque - ps.qtd)
    })
    localStorage.setItem("produtosAdmin", JSON.stringify(produtos))

    ultimoRegistro = registro
    mostrarResultado(registro)
  }

  let fotoInput = document.getElementById("inputFoto")
  if (fotoInput.files && fotoInput.files[0]) {
    let reader = new FileReader()
    reader.onload = function (e) { salvarComFoto(e.target.result) }
    reader.readAsDataURL(fotoInput.files[0])
  } else {
    salvarComFoto(null)
  }
}

// ── MOSTRAR RESULTADO ─────────────────────────────────
function mostrarResultado(r) {
  let box = document.getElementById("resultadoBox")
  box.classList.add("visivel")
  box.scrollIntoView({ behavior: "smooth" })

  let pecasHtml = ""
  if (r.pecasDetalhes && r.pecasDetalhes.length > 0) {
    pecasHtml = `<div class="res-pecas-lista">` +
      r.pecasDetalhes.map(function (p) {
        return `<p>🔩 ${p.nome} x${p.qtd} — R$ ${(p.preco * p.qtd).toFixed(2)}</p>`
      }).join("") + `</div>`
  }

  document.getElementById("resConteudo").innerHTML = `
    <div class="res-linha"><span>👤 Cliente</span><strong>${r.nome}</strong></div>
    <div class="res-linha"><span>🏍️ Moto</span><strong>${r.moto} — ${r.placa}</strong></div>
    <div class="res-linha"><span>🔧 Serviço</span><strong>${r.servico}</strong></div>
    <div class="res-linha"><span>👨‍🔧 Funcionário</span><strong>${r.funcionario}</strong></div>
    <div class="res-linha"><span>📅 Data</span><strong>${r.data}</strong></div>
    ${r.pecas ? `<div class="res-linha"><span>📦 Peças</span><strong>${r.pecas}</strong></div>` : ""}
    ${pecasHtml}
    <div class="res-linha"><span>💰 Valor</span><strong>R$ ${r.valor.toFixed(2)}</strong></div>
    <div class="res-linha"><span>💳 Pagamento</span><strong>${r.pagamento}</strong></div>
    ${r.obs ? `<div class="res-linha"><span>📝 Obs</span><strong>${r.obs}</strong></div>` : ""}
  `

  let tel = r.telefone.replace(/\D/g, "")
  let msg = `✅ *Serviço Registrado*%0A%0A`
  msg += `👤 *Cliente:* ${r.nome}%0A`
  msg += `🏍️ *Moto:* ${r.moto} — ${r.placa}%0A`
  msg += `🔧 *Serviço:* ${r.servico}%0A`
  if (r.funcionario) msg += `👨‍🔧 *Feito por:* ${r.funcionario}%0A`
  if (r.pecas) msg += `📦 *Peças:* ${r.pecas}%0A`
  if (r.obs) msg += `📝 *Obs:* ${r.obs}%0A`
  msg += `💰 *Valor:* R$ ${r.valor.toFixed(2)}%0A`
  msg += `💳 *Pagamento:* ${r.pagamento}%0A`
  msg += `📅 *Data:* ${r.data}%0A%0A`
  msg += `_Central Moto Peças — Altinho/PE_`

  document.getElementById("btnWppRes").href = `https://wa.me/55${tel}?text=${msg}`
}

// ── IMPRIMIR COMPROVANTE ──────────────────────────────
function imprimirComprovante() {
  let r = ultimoRegistro
  if (!r) return

  let fotoHtml = r.foto
    ? `<img src="${r.foto}" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-top:14px">`
    : ""

  let pecasHtml = ""
  if (r.pecasDetalhes && r.pecasDetalhes.length > 0) {
    pecasHtml = `<div class="sec">Peças utilizadas</div>` +
      r.pecasDetalhes.map(function (p) {
        return `<div class="linha">
          <span class="label">${p.nome} x${p.qtd}</span>
          <span class="val">R$ ${(p.preco * p.qtd).toFixed(2)}</span>
        </div>`
      }).join("")
  }

  let janela = window.open("", "_blank")
  janela.document.write(`
    <!DOCTYPE html><html><head>
    <title>Comprovante — Central Moto Peças</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:28px 18px;color:#111}
      .topo{text-align:center;border-bottom:3px solid #e82d2d;padding-bottom:14px;margin-bottom:18px}
      .topo h1{color:#e82d2d;font-size:20px;margin:0 0 4px}
      .topo p{color:#666;font-size:12px;margin:2px 0}
      .sec{background:#f5c400;color:black;padding:5px 10px;border-radius:5px;
           font-size:11px;font-weight:bold;text-transform:uppercase;margin:14px 0 8px}
      .linha{display:flex;justify-content:space-between;padding:7px 0;
             border-bottom:1px solid #eee;font-size:13px}
      .label{color:#888} .val{font-weight:bold}
      .total{background:#e82d2d;color:white;padding:14px;border-radius:10px;
             text-align:center;margin-top:18px}
      .total .tl{font-size:11px;opacity:.8;text-transform:uppercase}
      .total .tv{font-size:30px;font-weight:900}
      .pgto{background:#f0fff4;color:#166534;padding:10px;border-radius:8px;
            text-align:center;margin-top:8px;font-weight:bold;font-size:14px}
      .rodape{text-align:center;margin-top:20px;padding-top:14px;
              border-top:2px dashed #ddd;color:#888;font-size:11px}
      @media print{button{display:none!important}}
    </style></head><body>
    <div class="topo">
      <h1>🏍️ Central Moto Peças</h1>
      <p>Altinho — PE | (94) 9 9571-8970</p>
    </div>
    <div class="sec">Cliente</div>
    <div class="linha"><span class="label">Nome</span><span class="val">${r.nome}</span></div>
    <div class="linha"><span class="label">Telefone</span><span class="val">${r.telefone}</span></div>
    <div class="sec">Moto</div>
    <div class="linha"><span class="label">Moto</span><span class="val">${r.moto}</span></div>
    <div class="linha"><span class="label">Placa</span><span class="val">${r.placa}</span></div>
    ${r.km ? `<div class="linha"><span class="label">KM</span><span class="val">${r.km} km</span></div>` : ""}
    <div class="sec">Serviço</div>
    <div class="linha"><span class="label">Serviço</span><span class="val">${r.servico}</span></div>
    <div class="linha"><span class="label">Funcionário</span><span class="val">${r.funcionario}</span></div>
    <div class="linha"><span class="label">Data</span><span class="val">${r.data}</span></div>
    ${r.obs ? `<div class="linha"><span class="label">Obs</span><span class="val">${r.obs}</span></div>` : ""}
    ${pecasHtml}
    <div class="total"><div class="tl">Total cobrado</div><div class="tv">R$ ${r.valor.toFixed(2)}</div></div>
    <div class="pgto">💳 ${r.pagamento}</div>
    ${fotoHtml}
    <div class="rodape"><p>Obrigado pela preferência! 🙏</p><p>${r.data}</p></div><br>
    <button onclick="window.print()"
      style="width:100%;padding:13px;background:#e82d2d;color:white;border:none;
             border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer">
      🖨️ Imprimir
    </button>
    </body></html>`)
  janela.document.close()
}

// ── NOVO REGISTRO ─────────────────────────────────────
function novoRegistro() {
  pecasSelecionadas = []
  ultimoRegistro = null
  document.getElementById("resultadoBox").classList.remove("visivel")
  document.getElementById("inputNome").value = ""
  document.getElementById("inputTelefone").value = ""
  document.getElementById("inputMarca").value = ""
  document.getElementById("inputModelo").value = ""
  document.getElementById("inputPlaca").value = ""
  document.getElementById("inputKm").value = ""
  document.getElementById("inputServico").value = ""
  document.getElementById("inputFuncionario").value = ""
  document.getElementById("inputObs").value = ""
  document.getElementById("inputValor").value = ""
  document.getElementById("inputPagamento").value = ""
  document.getElementById("inputPecasExtra").value = ""
  document.getElementById("caixaPix").style.display = "none"
  document.getElementById("badgeAutofill").className = "badge-autofill"
  renderTagsPecas()
  removerFoto(null)
  window.scrollTo({ top: 0, behavior: "smooth" })
}