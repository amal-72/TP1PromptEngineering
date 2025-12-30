// Configuration de l'API
const API_BASE_URL = '';

// Gestion de l'authentification et du token
let currentUser = null;

// Vérifier si l'utilisateur est connecté au chargement
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Non authentifié');
        })
        .then(user => {
            currentUser = user;
            console.log('User connecté:', user); // Debug
            console.log('Rôle:', user.role); // Debug
            updateUIForUser(user);
        })
        .catch(() => {
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForUser(null);
        });
    } else {
        updateUIForUser(null);
    }
}

function updateUIForUser(user) {
    const cartLink = document.getElementById('cartLink');
    const ordersLink = document.getElementById('ordersLink');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const authBtn = document.getElementById('authBtn');
    const welcomeSection = document.getElementById('welcomeSection');
    const authContainer = document.querySelector('.auth-container');

    if (user) {
        if (cartLink) cartLink.style.display = 'inline-block';
        if (ordersLink) ordersLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (authBtn) authBtn.style.display = 'none';
        
        if (user.role === 'Admin') {
            if (adminLink) {
                adminLink.style.display = 'inline-block';
                console.log('Lien Admin affiché'); // Debug
            }
        } else {
            if (adminLink) {
                adminLink.style.display = 'none';
                console.log('Lien Admin masqué - Rôle:', user.role); // Debug
            }
        }

        if (welcomeSection) {
            welcomeSection.style.display = 'block';
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) userNameSpan.textContent = user.name;
        }

        if (authContainer) authContainer.style.display = 'none';
    } else {
        if (cartLink) cartLink.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (authBtn) authBtn.style.display = 'inline-block';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (authContainer) authContainer.style.display = 'block';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForUser(null);
            window.location.href = 'index.html';
        });
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.add('show');
        setTimeout(() => {
            successElement.classList.remove('show');
        }, 3000);
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

