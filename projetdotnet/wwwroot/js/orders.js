// Gestion des commandes
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    updateCartCount();
});

async function loadOrders() {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const ordersList = document.getElementById('ordersList');
    const emptyOrders = document.getElementById('emptyOrders');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erreur lors du chargement des commandes');

        const orders = await response.json();
        
        if (orders.length === 0) {
            ordersList.style.display = 'none';
            emptyOrders.style.display = 'block';
        } else {
            ordersList.style.display = 'block';
            emptyOrders.style.display = 'none';
            
            ordersList.innerHTML = '';
            orders.forEach(order => {
                const orderCard = createOrderCard(order);
                ordersList.appendChild(orderCard);
            });
        }

        loading.style.display = 'none';
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const statusClass = order.status.toLowerCase().replace(' ', '');
    const statusText = order.status;
    
    let itemsHtml = '';
    order.items.forEach(item => {
        itemsHtml += `
            <div class="order-item">
                <span>${item.productName} x ${item.quantity}</span>
                <span>${formatPrice(item.subTotal)}</span>
            </div>
        `;
    });
    
    card.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-id">Commande #${order.id.substring(0, 8)}</div>
                <div class="order-date">${formatDate(order.createdAt)}</div>
            </div>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        <div class="order-items">
            ${itemsHtml}
        </div>
        <div class="order-footer">
            <div class="order-total">Total: ${formatPrice(order.total)}</div>
        </div>
    `;
    
    return card;
}

