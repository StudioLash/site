// Configurações do Banco de Dados
const DB_NAME = 'AndressaLanzaDB';
const DB_VERSION = 1;
const STORE_NAME = 'depoimentos';
const DEPOIMENTOS_PER_SLIDE = 3; // Define quantos cards aparecem por slide

// Dados Iniciais (Seeds) - Serão inseridos apenas na primeira visita
const initialDepoimentos = [
    { nome: "Maria S.", texto: "O volume russo ficou perfeito, do jeito que eu pedi! Atendimento impecável e o ambiente super relaxante. Não troco por nada!", id: 1 },
    { nome: "Juliana R.", texto: "Meus cílios clássicos duram muito mais que em outros lugares. A Andressa é super atenciosa, explica tudo direitinho e o resultado é sempre natural.", id: 2 },
    { nome: "Patrícia L.", texto: "Fiz o design com henna e amei! A cor ficou na medida certa e minhas sobrancelhas ficaram lindas. Voltarei com certeza!", id: 3 },
    { nome: "Fernanda G.", texto: "Simplesmente apaixonada pelo resultado do meu Volume Brasileiro! Durou muito mais que o esperado e os fios são levíssimos. Profissional super qualificada.", id: 4 },
    { nome: "Beatriz L.", texto: "Finalmente encontrei uma lash designer que cuida da saúde dos meus fios. O design clássico ficou discreto e valorizou demais meu olhar.", id: 5 }
];

let db;

// 1. Função para Abrir e Inicializar o IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // 'id' será a chave única (Primary Key)
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                // Popula o banco com os dados iniciais
                objectStore.transaction.oncomplete = () => {
                    const depoimentoStore = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
                    initialDepoimentos.forEach((depoimento) => {
                        depoimentoStore.add(depoimento);
                    });
                };
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("Erro ao abrir IndexedDB:", event.target.errorCode);
            reject("Erro ao abrir IndexedDB");
        };
    });
}

// 2. Função para Obter Todos os Depoimentos
function getAllDepoimentos() {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error("Banco de dados não está aberto.");
            return reject("Banco de dados não está aberto.");
        }
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            // Reverte a ordem para mostrar os mais recentes primeiro
            resolve(event.target.result.reverse());
        };

        request.onerror = (event) => {
            console.error("Erro ao buscar depoimentos:", event.target.errorCode);
            reject([]);
        };
    });
}

// 3. Função para Inserir o HTML no Carrossel
function displayDepoimentos(depoimentos) {
    const container = document.getElementById('depoimentos-container');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    if (!container || !indicatorsContainer) return;

    let totalSlides = Math.ceil(depoimentos.length / DEPOIMENTOS_PER_SLIDE);
    let htmlContent = '';
    let indicatorsHtml = '';

    for (let i = 0; i < totalSlides; i++) {
        const isActive = i === 0 ? 'active' : '';
        
        // Abre o item do carrossel e a linha de cards
        htmlContent += `<div class="carousel-item ${isActive}"><div class="row g-4 justify-content-center">`;
        
        // Adiciona o indicador
        indicatorsHtml += `
            <button type="button" data-bs-target="#depoimentosCarousel" data-bs-slide-to="${i}" class="${isActive}" aria-current="${i === 0}" aria-label="Slide ${i + 1}"></button>
        `;

        // Preenche o slide com DEPOIMENTOS_PER_SLIDE cards
        for (let j = 0; j < DEPOIMENTOS_PER_SLIDE; j++) {
            const index = i * DEPOIMENTOS_PER_SLIDE + j;
            if (index < depoimentos.length) {
                const d = depoimentos[index];
                htmlContent += `
                    <div class="col-12 col-md-4">
                        <div class="card h-100 p-4 shadow-sm border-0 text-center">
                            <i class="bi bi-quote display-4 text-primary mb-3"></i>
                            <p class="card-text fst-italic">"${d.texto}"</p>
                            <footer class="blockquote-footer mt-2">${d.nome}</footer>
                        </div>
                    </div>
                `;
            }
        }
        
        // Fecha a linha e o item do carrossel
        htmlContent += `</div></div>`;
    }

    container.innerHTML = htmlContent;
    indicatorsContainer.innerHTML = indicatorsHtml;
}

// 4. Função Principal (Inicializa e Exibe)
async function init() {
    try {
        await openDatabase();
        const depoimentos = await getAllDepoimentos();
        displayDepoimentos(depoimentos);
    } catch (error) {
        console.error("Falha ao inicializar a página:", error);
    }
}

// Inicia o processo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);


// -----------------------------------------------------------
// FUNÇÕES DE ADMIN (PARA VOCÊ USAR NO CONSOLE)
// -----------------------------------------------------------

/**
 * Adiciona um novo depoimento ao IndexedDB.
 * Use no Console: adicionarDepoimento("Nome da Cliente", "Texto do depoimento.");
 * @param {string} nome - Nome da cliente (ex: "Ana C.").
 * @param {string} texto - O texto completo do depoimento.
 */
window.adicionarDepoimento = function(nome, texto) {
    if (!db) {
        // Tenta abrir o banco antes de adicionar, se não estiver aberto
        openDatabase().then(() => {
            adicionarDepoimento(nome, texto); // Tenta novamente após a abertura
        }).catch(() => {
            console.error("O banco de dados não pôde ser aberto.");
        });
        return;
    }

    const novoDepoimento = {
        nome: nome,
        texto: texto
    };

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(novoDepoimento);

    request.onsuccess = () => {
        console.log(`Depoimento de ${nome} adicionado com sucesso!`);
        console.log("ATUALIZE A PÁGINA para vê-lo no site e no carrossel.");
    };

    request.onerror = (event) => {
        console.error("Erro ao adicionar depoimento:", event.target.error);
    };
};

/**
 * Exclui um depoimento do IndexedDB usando seu ID.
 * Use no Console: excluirDepoimento(ID_DO_DEPOIMENTO);
 * @param {number} id - O ID único do depoimento a ser excluído.
 */
window.excluirDepoimento = function(id) {
    if (!db) {
        console.error("O banco de dados não foi inicializado. Tente novamente após a página carregar.");
        return;
    }

    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(Number(id)); // Garante que o ID é um número

    request.onsuccess = () => {
        console.log(`Depoimento com ID ${id} excluído com sucesso!`);
        console.log("ATUALIZE A PÁGINA para vê-lo removido do site.");
    };

    request.onerror = (event) => {
        console.error("Erro ao excluir depoimento:", event.target.error);
    };
};

// Expondo a função para listar todos os depoimentos no console
window.getAllDepoimentos = getAllDepoimentos;