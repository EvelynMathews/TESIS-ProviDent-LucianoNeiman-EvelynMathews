const API_URL = 'http://localhost:3000';

let products = [];
let cart = [];

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showMessage('Error al cargar los productos', 'error');
    }
}

function renderProducts() {
    const productsList = document.getElementById('products-list');

    if (products.length === 0) {
        productsList.innerHTML = '<div class="empty-state"><p>No hay productos disponibles</p></div>';
        return;
    }

    productsList.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-header">
                <h3 class="product-title">${product.name}</h3>
                <span class="seller-badge">${product.sellerId}</span>
            </div>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
                <span class="product-price">$${product.price.toFixed(2)}</span>
                <button class="btn-add" onclick="addToCart(${product.id})">
                    Agregar al Carrito
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.name,
            unit_price: product.price,
            quantity: 1,
            sellerId: product.sellerId,
            description: product.description
        });
    }

    renderCart();
    updateCartSummary();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateCartSummary();
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-state"><p>El carrito está vacío</p></div>';
        document.getElementById('checkout-btn').disabled = true;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title} (x${item.quantity})</div>
                <div class="cart-item-seller">${item.sellerId}</div>
            </div>
            <div class="cart-item-price">$${(item.unit_price * item.quantity).toFixed(2)}</div>
            <button class="btn-remove" onclick="removeFromCart(${item.id})">Eliminar</button>
        </div>
    `).join('');

    document.getElementById('checkout-btn').disabled = false;
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const fee = subtotal * 0.05;
    const total = subtotal;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('fee').textContent = `$${fee.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

async function checkout() {
    if (cart.length === 0) {
        showMessage('El carrito está vacío', 'error');
        return;
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Procesando...';

    try {
        const response = await fetch(`${API_URL}/api/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                payer: {
                    name: 'Cliente',
                    surname: 'Test',
                    email: 'test@test.com'
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = data.sandbox_init_point || data.init_point;
        } else {
            throw new Error(data.error || 'Error al procesar el pago');
        }
    } catch (error) {
        console.error('Error en checkout:', error);
        showMessage(error.message || 'Error al procesar el pago', 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceder al Pago';
    }
}

function showMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
        showMessage('Pago procesado exitosamente. Los fondos serán liberados cuando se confirme la entrega.', 'success');
        cart = [];
        renderCart();
        updateCartSummary();
    } else if (status === 'failure') {
        showMessage('El pago no pudo ser procesado. Por favor, intente nuevamente.', 'error');
    } else if (status === 'pending') {
        showMessage('El pago está pendiente de confirmación.', 'info');
    }
}

document.getElementById('checkout-btn').addEventListener('click', checkout);

checkPaymentStatus();
loadProducts();
