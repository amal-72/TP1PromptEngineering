// Gestion de l'authentification
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function showRegister() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Formulaire de connexion
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorElement = document.getElementById('loginError');

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    currentUser = data.user;
                    updateUIForUser(data.user);
                    window.location.href = 'products.html';
                } else {
                    showError('loginError', data.message || 'Erreur de connexion');
                }
            } catch (error) {
                showError('loginError', 'Erreur de connexion au serveur');
            }
        });
    }

    // Formulaire d'inscription
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const errorElement = document.getElementById('registerError');

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    errorElement.textContent = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
                    errorElement.style.color = '#27ae60';
                    errorElement.style.backgroundColor = '#eafaf1';
                    errorElement.style.display = 'block';
                    setTimeout(() => {
                        showLogin();
                        const loginTab = document.querySelectorAll('.tab-btn')[0];
                        if (loginTab) loginTab.click();
                    }, 2000);
                } else {
                    showError('registerError', data.message || 'Erreur d\'inscription');
                }
            } catch (error) {
                showError('registerError', 'Erreur de connexion au serveur');
            }
        });
    }
});

