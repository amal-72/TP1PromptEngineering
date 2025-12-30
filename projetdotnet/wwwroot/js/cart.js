// Gestion du panier
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});

async function loadCart() {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const emptyCart = document.getElementById('emptyCart');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Erreur lors du chargement du panier');

        const cart = await response.json();
        
        if (!cart.items || cart.items.length === 0) {
            cartItems.style.display = 'none';
            cartSummary.style.display = 'none';
            emptyCart.style.display = 'block';
        } else {
            cartItems.style.display = 'block';
            cartSummary.style.display = 'block';
            emptyCart.style.display = 'none';
            
            cartItems.innerHTML = '';
            cart.items.forEach(item => {
                const cartItem = createCartItem(item);
                cartItems.appendChild(cartItem);
            });

            document.getElementById('cartTotal').textContent = formatPrice(cart.total);
        }

        loading.style.display = 'none';
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.id = `cart-item-${item.productId}`;
    
    div.innerHTML = `
        <div class="cart-item-info">
            <div class="cart-item-name">${item.productName}</div>
            <div class="cart-item-price">${formatPrice(item.price)} / unité</div>
        </div>
        <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
            <input type="number" id="qty-${item.productId}" value="${item.quantity}" min="1" class="quantity-input" 
                   onchange="updateQuantity('${item.productId}', parseInt(this.value))">
            <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
        </div>
        <div class="cart-item-total">${formatPrice(item.subTotal)}</div>
        <button class="btn btn-danger" onclick="removeFromCart('${item.productId}')">Supprimer</button>
    `;
    
    return div;
}

async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, quantity: newQuantity })
        });

        if (response.ok) {
            loadCart();
            updateCartCount();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

async function removeFromCart(productId) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce produit du panier ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            loadCart();
            updateCartCount();
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

async function checkout() {
    // Nouveau flux : créer PaymentIntent côté serveur, confirmer le paiement côté client, puis créer la commande
    if (!confirm('Confirmer la commande et procéder au paiement ?')) {
        return;
    }

    try {
        // Récupérer le panier pour connaître le montant
        const cartResp = await fetch(`${API_BASE_URL}/api/cart`, { headers: getAuthHeaders() });
        if (!cartResp.ok) throw new Error('Impossible de récupérer le panier pour paiement');
        const cart = await cartResp.json();
        const amountCents = Math.round((cart.total || 0) * 100);

        // Demander au serveur de créer un PaymentIntent
        const piResp = await fetch(`${API_BASE_URL}/api/payments/create-payment-intent`, {
            method: 'POST',
            headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
            body: JSON.stringify({ amount: amountCents })
        });

        if (!piResp.ok) {
            const err = await piResp.json();
            throw new Error(err.message || 'Erreur lors de la création du paiement');
        }

        const { clientSecret, publishableKey } = await piResp.json();

        // Afficher l'UI de paiement
        const paymentContainer = document.getElementById('paymentContainer');
        paymentContainer.style.display = 'block';

        const payBtn = document.getElementById('payBtn');
        const cancelBtn = document.getElementById('cancelPaymentBtn');
        const cardErrors = document.getElementById('card-errors');

        // Initialiser Stripe
        const stripe = Stripe(publishableKey);
        const elements = stripe.elements();
        const cardElement = elements.create('card');
        cardElement.mount('#card-element');

        cancelBtn.onclick = () => {
            cardElement.unmount();
            paymentContainer.style.display = 'none';
        };

        payBtn.onclick = async () => {
            payBtn.disabled = true;
            payBtn.textContent = 'Traitement en cours...';
            console.log('Début de confirmation du paiement...');

            try {
                const result = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card: cardElement }
                });

                console.log('Résultat du paiement:', result);

                if (result.error) {
                    console.error('Erreur de paiement:', result.error);
                    cardErrors.textContent = result.error.message || 'Erreur lors du paiement';
                    payBtn.disabled = false;
                    payBtn.textContent = 'Payer';
                } else {
                    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                        console.log('Paiement réussi, création de la commande...');
                        // Paiement OK -> créer la commande côté API
                        try {
                            const orderResp = await fetch(`${API_BASE_URL}/api/orders`, {
                                method: 'POST',
                                headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
                                body: JSON.stringify({ paymentId: result.paymentIntent.id })
                            });

                            console.log('Réponse de création de commande:', orderResp.status);

                            if (orderResp.ok) {
                                const order = await orderResp.json();
                                console.log('Commande créée:', order);
                                alert(`🎉 Paiement et commande réussis !\nNuméro de commande: ${order.id}\n\nVous allez être redirigé vers vos commandes.`);
                                // Fermer le modal de paiement
                                paymentContainer.style.display = 'none';
                                // Rediriger vers les commandes après un court délai
                                setTimeout(() => {
                                    window.location.href = 'orders.html';
                                }, 2000);
                            } else {
                                const data = await orderResp.json();
                                console.error('Erreur création commande:', data);
                                alert(`❌ Erreur lors de la création de la commande: ${data.message || 'Erreur inconnue'}`);
                                payBtn.disabled = false;
                                payBtn.textContent = 'Payer';
                            }
                        } catch (orderError) {
                            console.error('Erreur réseau création commande:', orderError);
                            alert(`❌ Erreur de connexion lors de la création de la commande: ${orderError.message}`);
                            payBtn.disabled = false;
                            payBtn.textContent = 'Payer';
                        }
                    } else {
                        console.error('Paiement non confirmé:', result.paymentIntent);
                        cardErrors.textContent = 'Paiement non confirmé';
                        payBtn.disabled = false;
                        payBtn.textContent = 'Payer';
                    }
                }
            } catch (confirmError) {
                console.error('Erreur lors de la confirmation:', confirmError);
                cardErrors.textContent = 'Erreur lors de la confirmation du paiement';
                payBtn.disabled = false;
                payBtn.textContent = 'Payer';
            }
        };

    } catch (error) {
        alert(error.message || 'Erreur de connexion au serveur');
    }
}

// Attacher l'événement au bouton de commande
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});

