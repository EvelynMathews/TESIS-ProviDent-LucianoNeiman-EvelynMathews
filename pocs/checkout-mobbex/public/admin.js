const API_URL = 'http://localhost:3000';

async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}/api/payments`);
        const payments = await response.json();
        renderPayments(payments);
    } catch (error) {
        console.error('Error cargando pagos:', error);
        showMessage('Error al cargar los pagos', 'error');
    }
}

function renderPayments(payments) {
    const paymentsList = document.getElementById('payments-list');

    if (payments.length === 0) {
        paymentsList.innerHTML = '<div class="empty-state"><p>No hay pagos registrados</p></div>';
        return;
    }

    paymentsList.innerHTML = payments.map(payment => {
        const createdDate = new Date(payment.created_at).toLocaleString();
        const paidDate = payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'N/A';
        const releasedDate = payment.released_at ? new Date(payment.released_at).toLocaleString() : 'N/A';

        return `
            <div class="payment-card">
                <div class="payment-header">
                    <span class="payment-id">${payment.id}</span>
                    <span class="payment-status ${payment.hold_status}">${payment.hold_status.toUpperCase()}</span>
                </div>
                <div class="payment-details">
                    <p><strong>Referencia:</strong> ${payment.reference}</p>
                    <p><strong>Estado del pago:</strong> ${payment.status}</p>
                    <p><strong>Total:</strong> $${payment.total ? payment.total.toFixed(2) : '0.00'}</p>
                    <p><strong>Fecha de creación:</strong> ${createdDate}</p>
                    <p><strong>Fecha de pago:</strong> ${paidDate}</p>
                    ${payment.hold_status === 'released' ? `<p><strong>Fecha de liberación:</strong> ${releasedDate}</p>` : ''}
                    <p><strong>Distribuciones:</strong></p>
                    <ul>
                        ${payment.split.map(s => `
                            <li>${s.reference}: $${s.total.toFixed(2)} (Fee: $${s.fee.toFixed(2)})</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }).join('');
}

async function releaseFunds() {
    const paymentId = document.getElementById('payment-id-input').value.trim();

    if (!paymentId) {
        showMessage('Por favor ingrese un ID de pago válido', 'error');
        return;
    }

    const releaseBtn = document.getElementById('release-btn');
    releaseBtn.disabled = true;
    releaseBtn.textContent = 'Liberando...';

    try {
        const response = await fetch(`${API_URL}/api/release-funds/${paymentId}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const message = data.simulated
                ? `${data.message} (Nota: endpoint de liberación simulado para desarrollo)`
                : data.message;
            showMessage(message, 'success');
            document.getElementById('payment-id-input').value = '';
            setTimeout(() => {
                loadPayments();
            }, 1000);
        } else {
            throw new Error(data.error || 'Error al liberar fondos');
        }
    } catch (error) {
        console.error('Error liberando fondos:', error);
        showMessage(error.message || 'Error al liberar fondos', 'error');
    } finally {
        releaseBtn.disabled = false;
        releaseBtn.textContent = 'Liberar Fondos';
    }
}

function showMessage(message, type) {
    const statusMessage = document.getElementById('release-status');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    setTimeout(() => {
        statusMessage.className = 'status-message';
    }, 5000);
}

document.getElementById('release-btn').addEventListener('click', releaseFunds);

loadPayments();

setInterval(loadPayments, 10000);
