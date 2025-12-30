// Gestion de l'administration
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Vérifier que l'utilisateur est admin
    checkAdminAccess();
    loadAdminProducts();
    // Ne charger les commandes que si l'onglet est visible ou quand on clique dessus
    // loadAdminOrders(); // Chargé seulement quand nécessaire
    updateCartCount();
});

async function checkAdminAccess() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const user = await response.json();
            console.log('User role:', user.role); // Debug
            if (user.role !== 'Admin') {
                alert('Accès refusé. Cette page est réservée aux administrateurs.\n\nSi vous venez de changer votre rôle en Admin, veuillez vous déconnecter et vous reconnecter pour obtenir un nouveau token.');
                // Vider le token et rediriger
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            } else {
                // Afficher le nom de l'admin
                const adminNameElement = document.getElementById('adminName');
                if (adminNameElement) {
                    adminNameElement.textContent = user.name || user.email;
                }
            }
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erreur vérification admin:', error);
        window.location.href = 'index.html';
    }
}

function showProductsManagement() {
    document.getElementById('productsManagement').style.display = 'block';
    document.getElementById('ordersManagement').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function showOrdersManagement() {
    document.getElementById('productsManagement').style.display = 'none';
    document.getElementById('ordersManagement').style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // Charger les commandes seulement quand on clique sur l'onglet
    loadAdminOrders();
}

// Gestion des produits
async function loadAdminProducts() {
    const loading = document.getElementById('loading');
    const adminProductsList = document.getElementById('adminProductsList');

    try {
        loading.style.display = 'block';

        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Erreur lors du chargement des produits');

        const products = await response.json();
        
        adminProductsList.innerHTML = '';
        
        products.forEach(product => {
            const productCard = createAdminProductCard(product);
            adminProductsList.appendChild(productCard);
        });

        loading.style.display = 'none';
    } catch (error) {
        loading.style.display = 'none';
        alert('Erreur: ' + error.message);
    }
}

function createAdminProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/250x200?text=Produit';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x200?text=Produit'">
        <div class="product-name">${product.name}</div>
        <div class="product-description">${product.description}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <div class="product-stock">Stock: ${product.stock}</div>
        <div class="product-actions">
            <button class="btn btn-primary" onclick="editProduct('${product.id}')">Modifier</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Supprimer</button>
        </div>
    `;
    
    return card;
}

function showProductForm(productId = null) {
    const form = document.getElementById('productForm');
    const formTitle = document.getElementById('productFormTitle');
    const formElement = document.getElementById('productFormElement');
    
    if (productId) {
        formTitle.textContent = 'Modifier le produit';
        loadProductForEdit(productId);
    } else {
        formTitle.textContent = 'Ajouter un produit';
        formElement.reset();
        document.getElementById('productId').value = '';
    }
    
    form.style.display = 'flex';
}

function hideProductForm() {
    document.getElementById('productForm').style.display = 'none';
    // Réinitialiser le formulaire et l'aperçu
    document.getElementById('productFormElement').reset();
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('imagePreview').src = '';
}

function previewImage(imageUrl) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    
    if (imageUrl && imageUrl.trim() !== '') {
        previewImg.src = imageUrl;
        previewImg.style.display = 'block';
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
    }
}

async function loadProductForEdit(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement du produit');

        const product = await response.json();
        
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        const imageUrlInput = document.getElementById('productImageUrl');
        imageUrlInput.value = product.imageUrl || '';
        
        // Afficher l'aperçu si une image existe
        if (product.imageUrl) {
            previewImage(product.imageUrl);
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

async function editProduct(productId) {
    showProductForm(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert('Produit supprimé avec succès');
            loadAdminProducts();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

// Formulaire de produit
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productFormElement');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productId = document.getElementById('productId').value;
            const product = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                imageUrl: document.getElementById('productImageUrl').value
            };

            try {
                const url = productId 
                    ? `${API_BASE_URL}/api/admin/products/${productId}`
                    : `${API_BASE_URL}/api/admin/products`;
                
                const method = productId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(product)
                });

                if (response.ok) {
                    alert(productId ? 'Produit modifié avec succès ✅' : 'Produit ajouté avec succès ✅');
                    hideProductForm();
                    loadAdminProducts();
                } else {
                    const data = await response.json();
                    alert(data.message || 'Erreur lors de l\'enregistrement');
                }
            } catch (error) {
                alert('Erreur de connexion au serveur');
            }
        });
    }
});

// Gestion des commandes
async function loadAdminOrders() {
    const loading = document.getElementById('loading');
    const adminOrdersList = document.getElementById('adminOrdersList');
    const errorMessage = document.getElementById('errorMessage');

    try {
        if (loading) loading.style.display = 'block';
        if (errorMessage) errorMessage.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erreur lors du chargement des commandes' }));
            throw new Error(errorData.message || 'Erreur lors du chargement des commandes');
        }

        const orders = await response.json();
        
        if (adminOrdersList) {
            adminOrdersList.innerHTML = '';
            
            if (orders.length === 0) {
                adminOrdersList.innerHTML = '<div class="empty-state"><p>Aucune commande pour le moment.</p></div>';
            } else {
                orders.forEach(order => {
                    const orderCard = createAdminOrderCard(order);
                    adminOrdersList.appendChild(orderCard);
                });
            }
        }

        if (loading) loading.style.display = 'none';
    } catch (error) {
        if (loading) loading.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } else {
            console.error('Erreur:', error);
        }
    }
}

function createAdminOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    // Gérer les deux cas : id (minuscule) ou Id (majuscule)
    const orderId = order.id || order.Id || '';
    const orderStatus = order.status || 'En attente';
    const orderItems = order.items || [];
    const orderTotal = order.total || 0;
    const userEmail = order.userEmail || 'N/A';
    const createdAt = order.createdAt || new Date().toISOString();
    
    const statusClass = orderStatus.toLowerCase().replace(' ', '').replace('é', 'e');
    
    let itemsHtml = '';
    if (orderItems && orderItems.length > 0) {
        orderItems.forEach(item => {
            const productName = item.productName || item.ProductName || 'Produit';
            const quantity = item.quantity || item.Quantity || 0;
            const subTotal = item.subTotal || item.SubTotal || 0;
            itemsHtml += `
                <div class="order-item">
                    <span>${productName} x ${quantity}</span>
                    <span>${formatPrice(subTotal)}</span>
                </div>
            `;
        });
    }
    
    const statusOptions = ['En attente', 'En cours', 'Livrée', 'Annulée'];
    let statusSelect = '<select class="order-status" onchange="updateOrderStatus(\'' + orderId + '\', this.value)">';
    statusOptions.forEach(option => {
        statusSelect += `<option value="${option}" ${orderStatus === option ? 'selected' : ''}>${option}</option>`;
    });
    statusSelect += '</select>';
    
    const orderIdDisplay = orderId ? orderId.substring(0, 8) : 'N/A';
    
    card.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">Commande #${orderIdDisplay}</div>
                <div class="order-date">Client: ${userEmail}</div>
                <div class="order-date">${formatDate(createdAt)}</div>
            </div>
            ${statusSelect}
        </div>
        <div class="order-items">
            ${itemsHtml || '<p>Aucun article dans cette commande.</p>'}
        </div>
        <div class="order-footer">
            <div class="order-total">Total: ${formatPrice(orderTotal)}</div>
        </div>
    `;
    
    return card;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            alert('Statut de la commande mis à jour');
            loadAdminOrders();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

