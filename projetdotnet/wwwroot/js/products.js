// Chargement des produits
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
});

async function loadProducts() {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const productsGrid = document.getElementById('productsGrid');

    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Erreur lors du chargement des produits');

        const products = await response.json();
        
        productsGrid.innerHTML = '';
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p>Aucun produit disponible.</p>';
        } else {
            products.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.appendChild(productCard);
            });
        }

        loading.style.display = 'none';
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/250x200?text=Produit';
    const stockClass = product.stock < 10 ? 'low' : '';
    const stockText = product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x200?text=Produit'">
        <div class="product-name">${product.name}</div>
        <div class="product-description">${product.description}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-stock ${stockClass}">${stockText}</div>
        <div class="product-actions">
            ${product.stock > 0 ? `
                <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.stock}" class="quantity-input" style="width: 80px;">
                <button class="btn btn-primary" onclick="addToCart('${product.id}', ${product.stock})">Ajouter au panier</button>
            ` : '<span style="color: #e74c3c;">Rupture de stock</span>'}
        </div>
    `;
    
    return card;
}

async function addToCart(productId, maxStock) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Veuillez vous connecter pour ajouter des produits au panier.');
        window.location.href = 'index.html';
        return;
    }

    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;

    if (quantity < 1 || quantity > maxStock) {
        alert(`Quantité invalide. Maximum: ${maxStock}`);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, quantity })
        });

        if (response.ok) {
            alert('Produit ajouté au panier !');
            updateCartCount();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de l\'ajout au panier');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

async function updateCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const cart = await response.json();
            const cartCount = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            
            const cartCountElements = document.querySelectorAll('#cartCount');
            cartCountElements.forEach(el => {
                el.textContent = cartCount > 0 ? cartCount : '';
            });
        }
    } catch (error) {
        // Ignorer les erreurs silencieusement
    }
}

