// ═══════════════════════════════════════════════════════
//  LOGIN — login.js
// ═══════════════════════════════════════════════════════

const USUARIO = "alisson"
const SENHA = "central123"



// ── ENTER PARA LOGAR ──────────────────────────────────
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") fazerLogin()
})

// ── LOGIN ─────────────────────────────────────────────
function fazerLogin() {
    let usuario = document.getElementById("inputUsuario").value.trim()
    let senha = document.getElementById("inputSenha").value
    let erro = document.getElementById("erroLogin")
    let btn = document.getElementById("btnEntrar")
    let card = document.getElementById("loginCard")

    // Limpa erro anterior
    erro.classList.remove("visivel")

    // Validação de campos
    if (!usuario || !senha) {
        mostrarErro("⚠️ Preencha usuário e senha!")
        return
    }

    // Simulação de loading
    btn.textContent = "Entrando..."
    btn.disabled = true

    setTimeout(function () {
        if (usuario === USUARIO && senha === SENHA) {
            // Login correto
            localStorage.setItem("logado", "sim")
            btn.textContent = "✅ Bem-vindo,!"
            btn.style.background = "#22c55e"

            setTimeout(function () {
                window.location.href = "administracao.html"
            }, 600)

        } else {
            // Login errado
            btn.textContent = "Entrar no Painel →"
            btn.disabled = false

            if (usuario !== USUARIO) {
                mostrarErro("❌ Usuário não encontrado!")
            } else {
                mostrarErro("❌ Senha incorreta!")
            }

            // Animação de erro no card
            card.classList.add("balanco")
            setTimeout(function () { card.classList.remove("balanco") }, 600)

            // Limpa a senha
            document.getElementById("inputSenha").value = ""
            document.getElementById("inputSenha").focus()
        }
    }, 500)
}

// ── VER SENHA ─────────────────────────────────────────
function verSenha() {
    let campo = document.getElementById("inputSenha")
    let btn = document.querySelector(".btn-ver-senha")
    if (campo.type === "password") {
        campo.type = "text"
        btn.textContent = "🙈"
    } else {
        campo.type = "password"
        btn.textContent = "👁️"
    }
}

// ── MOSTRAR ERRO ──────────────────────────────────────
function mostrarErro(msg) {
    let erro = document.getElementById("erroLogin")
    erro.textContent = msg
    erro.classList.add("visivel")
}