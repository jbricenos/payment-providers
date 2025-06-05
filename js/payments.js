// Datos de ejemplo para pagos (se reemplazarán con datos reales de localStorage)
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let providers = JSON.parse(localStorage.getItem('providers')) || [];

// Elementos del DOM
const paymentsTable = document.getElementById('payments-table');
const providerFilter = document.getElementById('provider-filter');
const statusFilter = document.getElementById('status-filter');
const dateRange = document.getElementById('date-range');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const newPaymentBtn = document.getElementById('new-payment-btn');
const exportPdfBtn = document.getElementById('export-pdf');

// Fecha actual para el filtro por defecto
const today = new Date();
dateRange.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

// Inicialización
function init() {
    loadProviders();
    renderPaymentsTable();
    updateSummary();
    setupEventListeners();
}

// Cargar proveedores en el filtro
function loadProviders() {
    providerFilter.innerHTML = '<option value="">Todos los proveedores</option>';
    
    providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.name;
        providerFilter.appendChild(option);
    });
}

// Renderizar la tabla de pagos
function renderPaymentsTable(filteredPayments = null) {
    const paymentsToRender = filteredPayments || payments;
    
    if (paymentsToRender.length === 0) {
        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No hay pagos registrados</td>
            </tr>
        `;
        return;
    }
    
    paymentsTable.innerHTML = paymentsToRender.map(payment => {
        const provider = providers.find(p => p.id === payment.providerId) || {};
        const formattedDate = new Date(payment.date).toLocaleDateString('es-CL');
        const formattedAmount = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(payment.amount);
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>#${String(payment.id).padStart(4, '0')}</td>
                <td>${provider.name || 'Proveedor no encontrado'}</td>
                <td>${payment.periodStart} al ${payment.periodEnd}</td>
                <td>${formattedAmount}</td>
                <td>
                    <span class="status-badge status-${payment.status}">
                        ${payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewPaymentDetails(${payment.id})">
                        <i class="ti-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="printReceipt(${payment.id})">
                        <i class="ti-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Actualizar el resumen
function updateSummary() {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paymentCount = payments.length;
    const averagePayment = paymentCount > 0 ? totalPaid / paymentCount : 0;
    const uniqueProviders = new Set(payments.map(p => p.providerId)).size;
    
    document.getElementById('total-paid').textContent = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(totalPaid);
    
    document.getElementById('payment-count').textContent = paymentCount;
    document.getElementById('average-payment').textContent = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    }).format(averagePayment);
    
    document.getElementById('providers-count').textContent = uniqueProviders;
}

// Aplicar filtros
function applyFilters() {
    const selectedProvider = providerFilter.value;
    const selectedStatus = statusFilter.value;
    const selectedDate = dateRange.value;
    
    let filtered = [...payments];
    
    if (selectedProvider) {
        filtered = filtered.filter(payment => payment.providerId === parseInt(selectedProvider));
    }
    
    if (selectedStatus) {
        filtered = filtered.filter(payment => payment.status === selectedStatus);
    }
    
    if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getFullYear() === parseInt(year) && 
                   paymentDate.getMonth() + 1 === parseInt(month);
        });
    }
    
    renderPaymentsTable(filtered);
}

// Configurar event listeners
function setupEventListeners() {
    applyFiltersBtn.addEventListener('click', applyFilters);
    
    resetFiltersBtn.addEventListener('click', () => {
        providerFilter.value = '';
        statusFilter.value = '';
        dateRange.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        renderPaymentsTable();
    });
    
    newPaymentBtn.addEventListener('click', () => {
        // Redirigir a la página de nuevo pago o mostrar modal
        window.location.href = 'index.html#payments';
    });
    
    exportPdfBtn.addEventListener('click', exportToPdf);
}

// Función para ver detalles del pago
function viewPaymentDetails(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
        // Aquí podrías mostrar un modal con los detalles completos del pago
        alert(`Detalles del pago #${paymentId}\nMonto: $${payment.amount}\nProveedor: ${providers.find(p => p.id === payment.providerId)?.name || 'N/A'}`);
    }
}

// Función para imprimir recibo
function printReceipt(paymentId) {
    // Implementar lógica de impresión
    alert(`Generando recibo para el pago #${paymentId}...`);
}

// Función para exportar a PDF
function exportToPdf() {
    // Implementar lógica de exportación a PDF
    alert('Exportando a PDF...');
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// Funciones globales para los botones
window.viewPaymentDetails = viewPaymentDetails;
window.printReceipt = printReceipt;
