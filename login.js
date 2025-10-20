const axios = require("axios");

// URL base da API
const API_BASE_URL = "https://localhost:7080";

// Configurar axios para ignorar certificados SSL (apenas para desenvolvimento)
axios.defaults.httpsAgent = {
    rejectUnauthorized: false
};

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const forgotPasswordLink = document.getElementById("forgot-password-link");
    const forgotPasswordModal = document.getElementById("forgot-password-modal");
    const modalClose = document.getElementById("modal-close");
    const modalOk = document.getElementById("modal-ok");

    // Event listener para o formulário de login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            showMessage("Por favor, preencha todos os campos.", "error");
            return;
        }
        
        await handleLogin(email, password);
    });

    // Event listeners para o modal de esqueci a senha
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        showModal();
    });

    modalClose.addEventListener("click", hideModal);
    modalOk.addEventListener("click", hideModal);

    // Fechar modal clicando fora dele
    forgotPasswordModal.addEventListener("click", (e) => {
        if (e.target === forgotPasswordModal) {
            hideModal();
        }
    });

    // Função para fazer login
    async function handleLogin(email, password) {
        const loginButton = document.querySelector(".btn-login");
        const originalText = loginButton.textContent;
        
        try {
            // Mostrar loading
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="loading"></span>Entrando...';
            
            // Remover mensagens anteriores
            removeMessages();
            
            // Fazer requisição para a API
            const response = await axios.post(`${API_BASE_URL}/api/Usuarios/authenticate?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(password)}`);
            
            if (response.data) {
                const user = response.data;
                
                // Salvar dados do usuário no localStorage
                localStorage.setItem("currentUser", JSON.stringify(user));
                
                showMessage("Login realizado com sucesso!", "success");
                
                // Redirecionar para a aplicação principal após um breve delay
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } else {
                showMessage("Credenciais inválidas. Verifique seu e-mail e senha.", "error");
            }
            
        } catch (error) {
            console.error("Erro no login:", error);
            
            if (error.response && error.response.status === 401) {
                showMessage("Credenciais inválidas. Verifique seu e-mail e senha.", "error");
            } else if (error.response && error.response.status === 404) {
                showMessage("Usuário não encontrado.", "error");
            } else {
                showMessage("Erro ao conectar com o servidor. Tente novamente.", "error");
            }
        } finally {
            // Restaurar botão
            loginButton.disabled = false;
            loginButton.textContent = originalText;
        }
    }

    // Função para mostrar mensagens
    function showMessage(message, type) {
        removeMessages();
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        const form = document.querySelector(".login-form");
        form.insertBefore(messageDiv, form.firstChild);
    }

    // Função para remover mensagens
    function removeMessages() {
        const messages = document.querySelectorAll(".error-message, .success-message");
        messages.forEach(msg => msg.remove());
    }

    // Função para mostrar modal
    function showModal() {
        forgotPasswordModal.classList.add("show");
    }

    // Função para esconder modal
    function hideModal() {
        forgotPasswordModal.classList.remove("show");
    }

    // Verificar se já existe um usuário logado
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        // Se já estiver logado, redirecionar para a aplicação principal
        window.location.href = "index.html";
    }
});
