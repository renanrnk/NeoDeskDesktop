const axios = require("axios");

// URL base da API (substitua pela URL real da sua API)
const API_BASE_URL = "http://localhost:7080";

// Mapeamento de enums para exibição
const StatusChamadoMap = {
    0: "Pendente",
    1: "Em andamento", 
    2: "Solucionado",
    3: "Fechado",
    4: "Cancelado"
};

const PrioridadeMap = {
    0: "Baixa",
    1: "Média",
    2: "Alta", 
    3: "Urgente",
    4: "Crítica"
};

const TipoUsuarioMap = {
    0: "Funcionário",
    1: "Administrador",
    2: "Técnico"
};

// Configuração de axios removida (usando HTTP em vez de HTTPS)

// Estado global da aplicação
let currentChamados = [];
let currentUsuarios = [];
let currentTecnicos = [];
let selectedChamado = null;
let currentUser = null;
let autoRefreshInterval = null; // Para o auto-refresh

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar autenticação
    await checkAuthentication();
    
    const chamadosTableBody = document.querySelector("#chamados-table tbody");
    const usuariosTableBody = document.querySelector("#usuarios-table tbody");
    
    // Elementos de navegação
    const menuItems = document.querySelectorAll(".menu-item");
    const navLinks = document.querySelectorAll(".nav-link");
    const screens = document.querySelectorAll(".screen");
    
    // Elementos de pesquisa
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const searchUsuariosInput = document.getElementById("search-usuarios-input");
    const searchUsuariosBtn = document.getElementById("search-usuarios-btn");
    
    // Elementos de detalhes
    const voltarBtn = document.getElementById("voltar-btn");

    // Elementos do Dashboard
    const dashboardDataInicio = document.getElementById("data-inicio");
    const dashboardDataFim = document.getElementById("data-fim");
    const dashboardFiltrarBtn = document.getElementById("filtrar-btn");
    const dashboardExportarBtn = document.querySelector("#dashboard .btn-secondary");

    // Elementos de usuário
    const logoutBtn = document.getElementById("logout-btn");
    const logoutConfirmationModal = document.getElementById("logout-confirmation-modal");
    const logoutConfirmationClose = document.getElementById("logout-confirmation-close");
    const logoutCancel = document.getElementById("logout-cancel");
    const logoutConfirm = document.getElementById("logout-confirm");

    const novoUsuarioBtn = document.getElementById("novo-usuario-btn");
    const novoUsuarioModal = document.getElementById("novo-usuario-modal");
    const novoUsuarioModalClose = document.getElementById("novo-usuario-modal-close");
    const novoUsuarioForm = document.getElementById("novo-usuario-form");
    const novoUsuarioCancelar = document.getElementById("novo-usuario-cancelar");
    const novoUsuarioSalvar = document.getElementById("novo-usuario-salvar");
    const novaSenhaInput = document.getElementById("nova-senha");
    const confirmarNovaSenhaInput = document.getElementById("confirmar-nova-senha");
    const senhaAdminConfirmacaoInput = document.getElementById("senha-admin-confirmacao");

    // Elementos de abrir chamado
    const abrirChamadoBtn = document.getElementById("abrir-chamado-btn");
    const abrirChamadoModal = document.getElementById("abrir-chamado-modal");
    const abrirChamadoModalClose = document.getElementById("abrir-chamado-modal-close");
    const abrirChamadoForm = document.getElementById("abrir-chamado-form");
    const abrirChamadoCancelar = document.getElementById("abrir-chamado-cancelar");
    const abrirChamadoSalvar = document.getElementById("abrir-chamado-salvar");

    // Elementos de recarregar e modo escuro
    const reloadBtn = document.getElementById("reload-btn");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const autoRefreshIndicator = document.createElement("div");
    autoRefreshIndicator.className = "auto-refresh-indicator";
    autoRefreshIndicator.textContent = "Atualizando...";
    document.body.appendChild(autoRefreshIndicator);

    // Verificar autenticação
    async function checkAuthentication() {
        const userData = localStorage.getItem("currentUser");
        if (!userData) {
            window.location.href = "login.html";
            return;
        }
        
        try {
            currentUser = JSON.parse(userData);
            document.getElementById("current-user-name").textContent = currentUser.nome || "Usuário";
            document.getElementById("current-user-type").textContent = TipoUsuarioMap[currentUser.tipoUsuario] || "Desconhecido";
            
            // Mostrar elementos específicos para administradores
            if (currentUser.tipoUsuario === 1) { // Administrador
                document.querySelectorAll(".admin-only").forEach(el => {
                    el.style.display = "";
                });
            }

            // Mostrar elementos específicos para técnicos e administradores
            if (currentUser.tipoUsuario === 1 || currentUser.tipoUsuario === 2) { // Administrador ou Técnico
                document.querySelectorAll(".tecnico-only").forEach(el => {
                    el.style.display = "";
                });
            }
        } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            localStorage.removeItem("currentUser");
            window.location.href = "login.html";
        }
    }

    // Funções de API
    async function fetchChamados(filters = {}) {
        try {
            let url = `${API_BASE_URL}/api/Chamados`;
            const params = new URLSearchParams();
            
            // Controle de acesso: Funcionários só veem seus próprios chamados
            if (currentUser && currentUser.tipoUsuario === 0) { // Funcionário
                params.append("usuarioSolicitanteId", currentUser.id);
            }
            
            if (filters.status !== undefined) params.append("status", filters.status);
            if (filters.prioridade !== undefined) params.append("prioridade", filters.prioridade);
            if (filters.usuarioSolicitanteId !== undefined) params.append("usuarioSolicitanteId", filters.usuarioSolicitanteId);
            if (filters.tecnicoResponsavelId !== undefined) params.append("tecnicoResponsavelId", filters.tecnicoResponsavelId);
            
            if (params.toString()) {
                url += "?" + params.toString();
            }
            
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar chamados da API:", error);
            // Retornar dados de exemplo em caso de erro
            return [
                {
                    id: 1,
                    titulo: "Problema com acesso ao sistema",
                    descricao: "Não consigo logar no sistema de RH.",
                    prioridade: 1,
                    status: 0,
                    dataCriacao: "2025-10-03T17:26:43.547Z",
                    usuarioSolicitanteNome: "Funcionário User",
                    tecnicoResponsavelNome: "Técnico User"
                },
                {
                    id: 2,
                    titulo: "Solicitação de nova funcionalidade",
                    descricao: "Gostaria de uma funcionalidade para exp",
                    prioridade: 2,
                    status: 1,
                    dataCriacao: "2025-10-03T17:26:43.547Z",
                    usuarioSolicitanteNome: "Funcionário User",
                    tecnicoResponsavelNome: "Técnico User"
                }
            ];
        }
    }

    async function fetchChamadoById(id) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/Chamados/${id}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar chamado da API:", error);
            return currentChamados.find(c => c.id == id) || {
                id: id,
                titulo: "Chamado não encontrado",
                descricao: "Não foi possível carregar os detalhes do chamado.",
                prioridade: 0,
                status: 0,
                dataCriacao: new Date().toISOString(),
                usuarioSolicitanteNome: "N/A",
                tecnicoResponsavelNome: "N/A"
            };
        }
    }

    async function fetchUsuarios() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/Usuarios`);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar usuários da API:", error);
            // Retornar dados de exemplo em caso de erro
            return [
                {
                    id: 1,
                    nome: "Administrador",
                    email: "admin@neodesk.com",
                    tipoUsuario: 2,
                    ativo: true,
                    dataCriacao: "2025-01-01T00:00:00.000Z"
                },
                {
                    id: 2,
                    nome: "Técnico User",
                    email: "tecnico@neodesk.com",
                    tipoUsuario: 1,
                    ativo: true,
                    dataCriacao: "2025-01-02T00:00:00.000Z"
                },
                {
                    id: 3,
                    nome: "Funcionário User",
                    email: "funcionario@neodesk.com",
                    tipoUsuario: 0,
                    ativo: true,
                    dataCriacao: "2025-01-03T00:00:00.000Z"
                }
            ];
        }
    }

    async function fetchTecnicos() {
        try {
            // Buscar usuários do tipo Técnico (1) e Administrador (2)
            const response = await axios.get(`${API_BASE_URL}/api/Usuarios`);
            return response.data.filter(user => user.tipoUsuario === 1 || user.tipoUsuario === 2);
        } catch (error) {
            console.error("Erro ao buscar técnicos da API:", error);
            return [
                {
                    id: 2,
                    nome: "Técnico User",
                    email: "tecnico@neodesk.com",
                    tipoUsuario: 1
                }
            ];
        }
    }

    async function createChamado(chamadoData) {
        try {
            // Converter FormData para objeto JSON se necessário
            let jsonData = chamadoData;
            if (chamadoData instanceof FormData) {
                jsonData = {};
                for (let [key, value] of chamadoData.entries()) {
                    // Ignorar anexos por enquanto (a API pode não suportar)
                    if (key !== 'anexos') {
                        jsonData[key] = value;
                    }
                }
            }
            
            const response = await axios.post(`${API_BASE_URL}/api/Chamados`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Erro ao criar chamado:", error);
            console.error("Resposta da API:", error.response?.data);
            throw error;
        }
    }

    async function createUsuario(usuarioData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/Usuarios`, usuarioData);
            return response.data;
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            throw error;
        }
    }

    async function authenticateUser(email, senha) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/Usuarios/authenticate?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
            return response.data;
        } catch (error) {
            console.error("Erro na autenticação:", error);
            throw error;
        }
    }

    async function exportChamadosCSV() {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/Chamados/export-csv`, { 
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'chamados.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast("Chamados exportados com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao exportar chamados para CSV:", error);
            showToast("Erro ao exportar chamados.", "error");
        }
    }

    // Funções de Renderização
    function renderChamados(chamadosData) {
        chamadosTableBody.innerHTML = "";
        if (chamadosData.length === 0) {
            chamadosTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center;">Nenhum chamado encontrado.</td></tr>`;
            return;
        }

        chamadosData.forEach(chamado => {
            const row = chamadosTableBody.insertRow();
            
            // Usar os mapas para obter o texto e a classe correta
            const statusText = StatusChamadoMap[chamado.status] || "N/A";
            const prioridadeText = PrioridadeMap[chamado.prioridade] || "N/A";

            const statusClass = statusText.toLowerCase().replace(/ /g, "-");
            const prioridadeClass = prioridadeText.toLowerCase();

            const dataCriacao = new Date(chamado.dataCriacao);
            const agora = new Date();
            const diffHoras = Math.floor((agora - dataCriacao) / (1000 * 60 * 60));
            const prazo = diffHoras > 24 ? `${Math.floor(diffHoras/24)}d` : `${diffHoras}h`;

            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>Tipo de chamado</td>
                <td>${String(chamado.id).padStart(6, '0')}</td>
                <td>${chamado.titulo || "N/A"}</td>
                <td>${chamado.usuarioSolicitanteNome || "N/A"}</td>
                <td>${chamado.tecnicoResponsavelNome || "N/A"}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(chamado.dataCriacao).toLocaleDateString('pt-BR') || "N/A"}</td>
                <td>${prazo}</td>
                <td><span class="prioridade-badge ${prioridadeClass}">${prioridadeText}</span></td>
            `;

            row.addEventListener('click', () => {
                showChamadoDetails(chamado.id);
            });
        });
    }

    function renderUsuarios(usuariosData) {
        usuariosTableBody.innerHTML = "";
        if (usuariosData.length === 0) {
            usuariosTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhum usuário encontrado.</td></tr>`;
            return;
        }

        usuariosData.forEach(usuario => {
            const row = usuariosTableBody.insertRow();
            
            const tipoText = TipoUsuarioMap[usuario.tipoUsuario] || "N/A";
            const statusText = usuario.ativo ? "Ativo" : "Inativo";
            const statusClass = usuario.ativo ? "ativo" : "inativo";

            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${usuario.id}</td>
                <td>${usuario.nome || "N/A"}</td>
                <td>${usuario.email || "N/A"}</td>
                <td><span class="tipo-badge">${tipoText}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(usuario.dataCriacao).toLocaleDateString('pt-BR') || "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-primary">Editar</button>
                    <button class="btn btn-sm btn-danger">Desativar</button>
                </td>
            `;
        });
    }

    function populateTecnicosSelect() {
        const tecnicoSelect = document.getElementById("chamado-tecnico");
        if (!tecnicoSelect) return;

        // Limpar opções existentes (exceto a primeira)
        while (tecnicoSelect.children.length > 1) {
            tecnicoSelect.removeChild(tecnicoSelect.lastChild);
        }

        // Adicionar técnicos
        currentTecnicos.forEach(tecnico => {
            const option = document.createElement("option");
            option.value = tecnico.id;
            option.textContent = `${tecnico.nome} (${TipoUsuarioMap[tecnico.tipoUsuario]})`;
            tecnicoSelect.appendChild(option);
        });
    }

    function filterChamados(searchTerm) {
        if (!searchTerm) {
            renderChamados(currentChamados);
            return;
        }

        const filtered = currentChamados.filter(chamado => 
            (chamado.titulo && chamado.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (chamado.usuarioSolicitanteNome && chamado.usuarioSolicitanteNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(chamado.id).includes(searchTerm)
        );
        
        renderChamados(filtered);
    }

    function filterUsuarios(searchTerm) {
        if (!searchTerm) {
            renderUsuarios(currentUsuarios);
            return;
        }

        const filtered = currentUsuarios.filter(usuario => 
            (usuario.nome && usuario.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (usuario.email && usuario.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            String(usuario.id).includes(searchTerm)
        );
        
        renderUsuarios(filtered);
    }

    async function showChamadoDetails(chamadoId) {
        selectedChamado = await fetchChamadoById(chamadoId);
        
        document.getElementById('detail-id').textContent = `#${String(selectedChamado.id).padStart(6, '0')}`;
        document.getElementById('detail-status').innerHTML = `<span class="status-badge ${StatusChamadoMap[selectedChamado.status].toLowerCase().replace(/ /g, '-')}">${StatusChamadoMap[selectedChamado.status]}</span>`;
        document.getElementById('detail-prioridade').innerHTML = `<span class="prioridade-badge ${PrioridadeMap[selectedChamado.prioridade].toLowerCase()}">${PrioridadeMap[selectedChamado.prioridade]}</span>`;
        document.getElementById('detail-solicitante').textContent = selectedChamado.usuarioSolicitanteNome || "N/A";
        document.getElementById('detail-tecnico').textContent = selectedChamado.tecnicoResponsavelNome || "N/A";
        document.getElementById('detail-data').textContent = new Date(selectedChamado.dataCriacao).toLocaleDateString('pt-BR');
        document.getElementById('detail-descricao').textContent = selectedChamado.descricao || "Sem descrição disponível.";
        
        // Renderizar anexos
        renderAnexos(selectedChamado.anexos || []);
        
        showScreen('detalhes-chamado');
    }

    function renderAnexos(anexos) {
        const anexosContainer = document.getElementById('detail-anexos');
        anexosContainer.innerHTML = '';
        
        if (!anexos || anexos.length === 0) {
            anexosContainer.innerHTML = '<p style="color: var(--text-light-color); font-style: italic;">Nenhum anexo encontrado.</p>';
            return;
        }
        
        anexos.forEach(anexo => {
            const anexoItem = document.createElement('div');
            anexoItem.className = 'anexo-item';
            
            const anexoInfo = document.createElement('div');
            anexoInfo.className = 'anexo-info';
            
            const anexoIcon = document.createElement('div');
            anexoIcon.className = 'anexo-icon';
            anexoIcon.innerHTML = '📎'; // Ícone simples de anexo
            
            const anexoDetails = document.createElement('div');
            anexoDetails.innerHTML = `
                <div class="anexo-name">${anexo.nomeOriginal || anexo.nome || 'Arquivo'}</div>
                <div class="anexo-size">${formatFileSize(anexo.tamanho || 0)}</div>
            `;
            
            anexoInfo.appendChild(anexoIcon);
            anexoInfo.appendChild(anexoDetails);
            
            const anexoActions = document.createElement('div');
            anexoActions.className = 'anexo-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.innerHTML = '⬇️';
            downloadBtn.title = 'Baixar anexo';
            downloadBtn.onclick = () => downloadAnexo(anexo);
            
            anexoActions.appendChild(downloadBtn);
            
            anexoItem.appendChild(anexoInfo);
            anexoItem.appendChild(anexoActions);
            
            anexosContainer.appendChild(anexoItem);
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function downloadAnexo(anexo) {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/Chamados/anexo/${anexo.id}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', anexo.nomeOriginal || anexo.nome || 'anexo');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showToast("Anexo baixado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao baixar anexo:", error);
            showToast("Erro ao baixar anexo.", "error");
        }
    }

    function renderDashboard(chamadosData) {
        // Exemplo de métricas simples para o dashboard
        const totalChamados = chamadosData.length;
        const chamadosPorStatus = chamadosData.reduce((acc, chamado) => {
            const status = StatusChamadoMap[chamado.status] || "Desconhecido";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const chamadosPorPrioridade = chamadosData.reduce((acc, chamado) => {
            const prioridade = PrioridadeMap[chamado.prioridade] || "Desconhecida";
            acc[prioridade] = (acc[prioridade] || 0) + 1;
            return acc;
        }, {});

        // Atualizar placeholders do dashboard
        document.querySelector("#dashboard .dashboard-card:nth-child(1) .chart-placeholder").textContent = `Total de Chamados: ${totalChamados}. Por Status: ${JSON.stringify(chamadosPorStatus)}`;
        document.querySelector("#dashboard .dashboard-card:nth-child(2) .chart-placeholder").textContent = `Total de Chamados: ${totalChamados}. Por Prioridade: ${JSON.stringify(chamadosPorPrioridade)}`;
        document.querySelector("#dashboard .dashboard-card:nth-child(3) .chart-placeholder").textContent = `Chamados por Período (simulado)`;
        document.querySelector("#dashboard .dashboard-card:nth-child(4) .chart-placeholder").textContent = `Tempo Médio de Resolução (simulado)`;
    }

    // Funções de Navegação
    function showScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        updateNavigation(screenId);

        // Recarregar dados se for a tela de fila de espera, dashboard ou usuários
        if (screenId === 'fila-espera') {
            loadChamados();
        } else if (screenId === 'dashboard') {
            loadDashboardData();
        } else if (screenId === 'usuarios') {
            loadUsuarios();
        }
    }

    function updateNavigation(screenId) {
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-screen') === screenId) {
                item.classList.add('active');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-screen') === screenId) {
                link.classList.add('active');
            }
        });
    }

    // Funções de mensagens (Toast)
    function showToast(message, type = "info") {
        const toastContainer = document.querySelector(".toast-container") || (() => {
            const div = document.createElement("div");
            div.className = "toast-container";
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 10);

        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => toast.remove());
        }, 3000);
    }

    // Funções de mensagens (dentro de modais/formulários)
    function showFormMessage(message, type, container) {
        removeFormMessages(container);
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remover mensagem de sucesso após 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    function removeFormMessages(container) {
        const messages = container.querySelectorAll(".error-message, .success-message");
        messages.forEach(msg => msg.remove());
    }

    // Event Listeners
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenId = item.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);
            }
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const screenId = link.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);
            }
        });
    });

    searchInput.addEventListener('input', (e) => {
        filterChamados(e.target.value);
    });

    searchBtn.addEventListener('click', () => {
        filterChamados(searchInput.value);
    });

    if (searchUsuariosInput) {
        searchUsuariosInput.addEventListener('input', (e) => {
            filterUsuarios(e.target.value);
        });
    }

    if (searchUsuariosBtn) {
        searchUsuariosBtn.addEventListener('click', () => {
            filterUsuarios(searchUsuariosInput.value);
        });
    }

    voltarBtn.addEventListener('click', () => {
        showScreen('fila-espera');
    });

    // Event listeners para logout
    logoutBtn.addEventListener('click', () => {
        logoutConfirmationModal.classList.add('show');
    });

    logoutConfirmationClose.addEventListener('click', () => {
        logoutConfirmationModal.classList.remove('show');
    });

    logoutCancel.addEventListener('click', () => {
        logoutConfirmationModal.classList.remove('show');
    });

    logoutConfirm.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Event listeners para abrir chamado
    abrirChamadoBtn.addEventListener('click', async () => {
        // Carregar técnicos antes de abrir o modal
        currentTecnicos = await fetchTecnicos();
        populateTecnicosSelect();
        abrirChamadoModal.classList.add('show');
    });

    abrirChamadoModalClose.addEventListener('click', () => {
        abrirChamadoModal.classList.remove('show');
        abrirChamadoForm.reset();
        removeFormMessages(abrirChamadoModal.querySelector('.modal-body'));
    });

    abrirChamadoCancelar.addEventListener('click', () => {
        abrirChamadoModal.classList.remove('show');
        abrirChamadoForm.reset();
        removeFormMessages(abrirChamadoModal.querySelector('.modal-body'));
    });

    abrirChamadoSalvar.addEventListener('click', async () => {
        const formData = new FormData(abrirChamadoForm);
        const modalBody = abrirChamadoModal.querySelector('.modal-body');
        
        // Validar campos obrigatórios
        const titulo = formData.get('titulo')?.trim();
        const descricao = formData.get('descricao')?.trim();
        const prioridade = formData.get('prioridade');
        
        if (!titulo || !descricao || !prioridade) {
            showFormMessage("Por favor, preencha todos os campos obrigatórios.", "error", modalBody);
            return;
        }

        // Preparar dados do chamado incluindo anexos
        const chamadoFormData = new FormData();
        chamadoFormData.append('titulo', titulo);
        chamadoFormData.append('descricao', descricao);
        chamadoFormData.append('prioridade', parseInt(prioridade));
        chamadoFormData.append('status', 0); // Pendente
        chamadoFormData.append('usuarioSolicitanteId', currentUser.id);
        
        if (formData.get('tecnicoResponsavelId')) {
            chamadoFormData.append('tecnicoResponsavelId', parseInt(formData.get('tecnicoResponsavelId')));
        }
        
        // Adicionar anexos se houver
        const anexosInput = document.getElementById('chamado-anexos');
        if (anexosInput && anexosInput.files.length > 0) {
            for (let i = 0; i < anexosInput.files.length; i++) {
                chamadoFormData.append('anexos', anexosInput.files[i]);
            }
        }

        // Mostrar loading
        const btnText = abrirChamadoSalvar.querySelector('.btn-text');
        const btnLoading = abrirChamadoSalvar.querySelector('.btn-loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        abrirChamadoSalvar.disabled = true;

        try {
            await createChamado(chamadoFormData);
            showFormMessage("Chamado criado com sucesso! Você será notificado sobre atualizações.", "success", modalBody);
            
            // Limpar formulário após sucesso
            setTimeout(() => {
                abrirChamadoModal.classList.remove('show');
                abrirChamadoForm.reset();
                removeFormMessages(modalBody);
                loadChamados(); // Recarregar lista de chamados
            }, 2000);
            
        } catch (error) {
            console.error("Erro ao criar chamado:", error);
            let errorMessage = "Erro ao criar chamado. Tente novamente.";
            
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
                } else if (error.response.status === 401) {
                    errorMessage = "Sessão expirada. Faça login novamente.";
                } else if (error.response.status === 500) {
                    errorMessage = "Erro interno do servidor. Contate o administrador.";
                }
            }
            
            showFormMessage(errorMessage, "error", modalBody);
        } finally {
            // Restaurar botão
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            abrirChamadoSalvar.disabled = false;
        }
    });

    // Event listeners para gestão de usuários (apenas para administradores)
    if (novoUsuarioBtn) {
        novoUsuarioBtn.addEventListener('click', () => {
            novoUsuarioModal.classList.add('show');
            removeFormMessages(novoUsuarioModal.querySelector('.modal-body'));
        });
    }

    if (novoUsuarioModalClose) {
        novoUsuarioModalClose.addEventListener('click', () => {
            novoUsuarioModal.classList.remove('show');
            novoUsuarioForm.reset();
            removeFormMessages(novoUsuarioModal.querySelector('.modal-body'));
        });
    }

    if (novoUsuarioCancelar) {
        novoUsuarioCancelar.addEventListener('click', () => {
            novoUsuarioModal.classList.remove('show');
            novoUsuarioForm.reset();
            removeFormMessages(novoUsuarioModal.querySelector('.modal-body'));
        });
    }

    if (novoUsuarioSalvar) {
        novoUsuarioSalvar.addEventListener('click', async () => {
            const formData = new FormData(novoUsuarioForm);
            const modalBody = novoUsuarioModal.querySelector('.modal-body');

            const nome = formData.get('nome')?.trim();
            const email = formData.get('email')?.trim();
            const senha = formData.get('senha');
            const confirmarSenha = formData.get('confirmarSenha');
            const tipoUsuario = formData.get('tipoUsuario');
            const senhaAdminConfirmacao = formData.get('senhaAdminConfirmacao');

            if (!nome || !email || !senha || !confirmarSenha || !tipoUsuario || !senhaAdminConfirmacao) {
                showFormMessage("Por favor, preencha todos os campos obrigatórios.", "error", modalBody);
                return;
            }

            if (senha !== confirmarSenha) {
                showFormMessage("As senhas não coincidem.", "error", modalBody);
                return;
            }

            // Mostrar loading
            const btnText = novoUsuarioSalvar.querySelector('.btn-text');
            const btnLoading = novoUsuarioSalvar.querySelector('.btn-loading');
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            novoUsuarioSalvar.disabled = true;

            try {
                // 1. Autenticar senha do administrador
                const adminAuth = await authenticateUser(currentUser.email, senhaAdminConfirmacao);
                if (!adminAuth || adminAuth.id !== currentUser.id) {
                    showFormMessage("Senha de administrador incorreta.", "error", modalBody);
                    return;
                }

                // 2. Criar novo usuário
                const usuarioData = {
                    nome: nome,
                    email: email,
                    senha: senha,
                    tipoUsuario: parseInt(tipoUsuario)
                };
                await createUsuario(usuarioData);
                showFormMessage("Usuário criado com sucesso!", "success", modalBody);
                
                setTimeout(() => {
                    novoUsuarioModal.classList.remove('show');
                    novoUsuarioForm.reset();
                    removeFormMessages(modalBody);
                    loadUsuarios(); // Recarregar lista de usuários
                }, 2000);

            } catch (error) {
                console.error("Erro ao criar usuário:", error);
                let errorMessage = "Erro ao criar usuário. Tente novamente.";
                if (error.response && error.response.status === 400) {
                    errorMessage = "Dados inválidos ou e-mail já cadastrado.";
                } else if (error.response && error.response.status === 401) {
                    errorMessage = "Sessão expirada ou senha de administrador incorreta.";
                }
                showFormMessage(errorMessage, "error", modalBody);
            } finally {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                novoUsuarioSalvar.disabled = false;
            }
        });
    }

    // Validação de senha no formulário de novo usuário
    if (novaSenhaInput && confirmarNovaSenhaInput) {
        const validatePasswords = () => {
            const senha = novaSenhaInput.value;
            const confirmarSenha = confirmarNovaSenhaInput.value;
            const feedbackContainer = confirmarNovaSenhaInput.parentNode;
            let feedbackElement = feedbackContainer.querySelector('.password-feedback');

            if (!feedbackElement) {
                feedbackElement = document.createElement('small');
                feedbackElement.className = 'password-feedback';
                feedbackContainer.appendChild(feedbackElement);
            }

            if (senha === confirmarSenha && senha.length >= 6) {
                confirmarNovaSenhaInput.classList.remove('password-mismatch');
                confirmarNovaSenhaInput.classList.add('password-match');
                feedbackElement.textContent = 'Senhas coincidem.';
                feedbackElement.className = 'password-feedback success';
            } else if (confirmarSenha.length > 0 && senha !== confirmarSenha) {
                confirmarNovaSenhaInput.classList.remove('password-match');
                confirmarNovaSenhaInput.classList.add('password-mismatch');
                feedbackElement.textContent = 'As senhas não coincidem.';
                feedbackElement.className = 'password-feedback error';
            } else {
                confirmarNovaSenhaInput.classList.remove('password-match', 'password-mismatch');
                feedbackElement.textContent = '';
            }
        };

        novaSenhaInput.addEventListener('input', validatePasswords);
        confirmarNovaSenhaInput.addEventListener('input', validatePasswords);
    }

    if (dashboardFiltrarBtn) {
        dashboardFiltrarBtn.addEventListener('click', async () => {
            const startDate = dashboardDataInicio.value;
            const endDate = dashboardDataFim.value;
            await loadDashboardData();
            showToast(`Filtrando dashboard de ${startDate} a ${endDate}`, "info");
        });
    }

    if (dashboardExportarBtn) {
        dashboardExportarBtn.addEventListener('click', () => {
            exportChamadosCSV();
        });
    }

    // Fechar modais clicando fora deles
    [logoutConfirmationModal, abrirChamadoModal, novoUsuarioModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    if (modal === abrirChamadoModal) {
                        abrirChamadoForm.reset();
                        removeFormMessages(modal.querySelector('.modal-body'));
                    } else if (modal === novoUsuarioModal) {
                        novoUsuarioForm.reset();
                        removeFormMessages(modal.querySelector('.modal-body'));
                    }
                }
            });
        }
    });

    // Modo Escuro
    darkModeToggle.addEventListener('click', () => {
        document.body.toggleAttribute('data-theme');
        const isDarkMode = document.body.hasAttribute('data-theme');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });

    // Carregar preferência de modo escuro
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.setAttribute('data-theme', 'dark');
    }

    // Botão de recarregar chamados
    reloadBtn.addEventListener('click', async () => {
        reloadBtn.classList.add('loading');
        await loadChamados();
        showToast("Lista de chamados atualizada!", "info");
        setTimeout(() => {
            reloadBtn.classList.remove('loading');
        }, 500);
    });

    // Auto-refresh a cada 60 segundos (1 minuto)
    function startAutoRefresh() {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(async () => {
            if (document.getElementById('fila-espera').classList.contains('active')) {
                autoRefreshIndicator.classList.add('show');
                await loadChamados();
                autoRefreshIndicator.classList.remove('show');
                showToast("Chamados atualizados automaticamente.", "info");
            }
        }, 60000); // 60 segundos
    }

    // Funções de Carregamento Inicial
    async function loadChamados() {
        currentChamados = await fetchChamados();
        renderChamados(currentChamados);
    }

    async function loadUsuarios() {
        if (currentUser && currentUser.tipoUsuario === 2) { // Apenas administradores
            currentUsuarios = await fetchUsuarios();
            renderUsuarios(currentUsuarios);
        }
    }

    async function loadDashboardData() {
        const allChamados = await fetchChamados();
        renderDashboard(allChamados);
    }

    // Carregar chamados ao iniciar
    await loadChamados();
    startAutoRefresh(); // Iniciar auto-refresh
    
    console.log("Aplicação NeoDesk carregada com sucesso!");
});
