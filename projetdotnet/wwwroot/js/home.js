// Load featured products (first 6)
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    updateAuthButtonVisibility();
});

function scrollToAuth() {
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        authContainer.scrollIntoView({ behavior: 'smooth' });
        // Show login form by default
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tab-btn').classList.add('active');
    }
}

function updateAuthButtonVisibility() {
    const authBtn = document.getElementById('authBtn');
    const token = localStorage.getItem('token');
    if (authBtn) {
        authBtn.style.display = token ? 'none' : 'inline-block';
    }
}

async function loadFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    try {
        const resp = await fetch(`${API_BASE_URL}/api/products`);
        if (!resp.ok) {
            grid.innerHTML = '<p>Impossible de charger les produits.</p>';
            return;
        }

        const products = await resp.json();
        if (!products || products.length === 0) {
            grid.innerHTML = '<p>Aucun produit disponible.</p>';
            return;
        }

        grid.innerHTML = '';
        products.slice(0,6).forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const imageUrl = product.imageUrl || `https://via.placeholder.com/250x200?text=${encodeURIComponent(product.name || 'Produit')}`;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x200?text=Produit'">
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description || ''}</div>
                <div class="product-price">${formatPrice(product.price || 0)}</div>
                <div class="product-actions">
                    <a href="products.html" class="btn btn-primary">Voir</a>
                </div>
            `;

            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<p>Erreur lors du chargement.</p>';
    }
}
