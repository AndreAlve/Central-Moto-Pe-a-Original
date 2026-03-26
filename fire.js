// ═══════════════════════════════════════════════════════
//  FIREBASE — Configuração Centralizada (Versão Moderna)
// ═══════════════════════════════════════════════════════

// 1. Importações dos módulos necessários do Firebase (Via CDN para GitHub Pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    onValue,
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// 2. Sua configuração (Ajustada)
const firebaseConfig = {
    apiKey: "AIzaSyCVlQSFz-QOiyji1aJbQLeCBW1ezGKnyKI",
    authDomain: "central-moto-pecas.firebaseapp.com", // Domínio padrão do Firebase
    projectId: "central-moto-pecas",
    storageBucket: "central-moto-pecas.firebasestorage.app",
    messagingSenderId: "639017413571",
    appId: "1:639017413571:web:08bf971ea7113c1d796b76",
    measurementId: "G-0SZ8FJXK33"
};

// 3. Inicialização
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── HELPERS PARA O SEU SITE ───────────────────────────

// Salvar um item (ex: um novo pedido de orçamento)
export function fbSalvar(caminho, dados) {
    const referencia = ref(db, caminho);
    return push(referencia, dados);
}

// Ler uma vez (ex: carregar o catálogo de peças)
export function fbLer(caminho, callback) {
    const referencia = ref(db, caminho);
    get(referencia).then((snapshot) => {
        let lista = [];
        snapshot.forEach((child) => {
            lista.push({ _fbKey: child.key, ...child.val() });
        });
        callback(lista);
    });
}

// Ouvir em tempo real (ex: chat ou estoque que muda na hora)
export function fbOuvir(caminho, callback) {
    const referencia = ref(db, caminho);
    onValue(referencia, (snapshot) => {
        let lista = [];
        snapshot.forEach((child) => {
            lista.push({ _fbKey: child.key, ...child.val() });
        });
        callback(lista);
    });
}

// Excluir um item
export function fbExcluir(caminho, key) {
    return remove(ref(db, `${caminho}/${key}`));
}

console.log("✅ Motor Firebase ligado e sincronizado!");
