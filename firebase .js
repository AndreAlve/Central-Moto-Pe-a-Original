// ═══════════════════════════════════════════════════════
//  FIREBASE — firebase.js
//  Inicialização e funções de banco de dados
// ═══════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyCVlQSFz-QOiyji1aJbQLeCBW1ezGKnyKI",
  authDomain:        "central-moto-pecas.firebaseapp.com",
  projectId:         "central-moto-pecas",
  storageBucket:     "central-moto-pecas.firebasestorage.app",
  messagingSenderId: "639017413571",
  appId:             "1:639017413571:web:08bf971ea7113c1d796b76",
  measurementId:     "G-0SZ8FJXK33",
  databaseURL:       "https://central-moto-pecas-default-rtdb.firebaseio.com"
}

// Inicializa só uma vez
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const db = firebase.database()

// ── HELPERS GENÉRICOS ─────────────────────────────────

// Salvar um item (push gera ID automático)
function fbSalvar(caminho, dados) {
  return db.ref(caminho).push(dados)
}

// Ler uma vez
function fbLer(caminho, callback) {
  db.ref(caminho).once("value", function (snap) {
    let lista = []
    snap.forEach(function (child) {
      lista.push({ _fbKey: child.key, ...child.val() })
    })
    callback(lista)
  })
}

// Ouvir em tempo real (atualiza automaticamente)
function fbOuvir(caminho, callback) {
  db.ref(caminho).on("value", function (snap) {
    let lista = []
    snap.forEach(function (child) {
      lista.push({ _fbKey: child.key, ...child.val() })
    })
    callback(lista)
  })
}

// Atualizar um item pelo key
function fbAtualizar(caminho, key, dados) {
  return db.ref(caminho + "/" + key).update(dados)
}

// Excluir um item pelo key
function fbExcluir(caminho, key) {
  return db.ref(caminho + "/" + key).remove()
}

console.log("✅ Firebase conectado — Central Moto Peças")
