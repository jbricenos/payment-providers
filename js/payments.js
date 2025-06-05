// Datos de pagos
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let providers = JSON.parse(localStorage.getItem('providers')) || [];
let nextPaymentId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;

// Elementos del DOM
const paymentsTable = document.getElementById('payments-table');
const providerFilter = document.getElementById('provider-filter');
const statusFilter = document.getElementById('status-filter');
const dateRange = document.getElementById('date-range');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const newPaymentBtn = document.getElementById('new-payment-btn');
const exportPdfBtn = document.getElementById('export-pdf');

// Elementos del modal de nuevo pago
const newPaymentModal = document.getElementById('new-payment-modal');
const newPaymentForm = document.getElementById('new-payment-form');
const closeModalBtn = document.querySelector('.close-modal');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

// Fecha actual para el filtro por defecto
const today = new Date();
dateRange.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

// Inicialización
function init() {
    console.log('Inicializando aplicación de pagos...');
    console.log('Botón newPaymentBtn en init:', newPaymentBtn);
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
    const paymentsToRender = filteredPayments || [...payments].reverse(); // Mostrar los más recientes primero
    
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

// Mostrar modal de nuevo pago
function showNewPaymentModal() {
    console.log('Mostrando modal de nuevo pago');
    
    // Cargar proveedores en el select
    const providerSelect = document.getElementById('payment-provider');
    if (providerSelect) {
        providerSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
        
        const activeProviders = providers.filter(p => p.status === 'Activo');
        console.log('Proveedores activos:', activeProviders);
        
        activeProviders.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.name;
            providerSelect.appendChild(option);
        });
    } else {
        console.error('No se encontró el elemento payment-provider');
    }
    
    // Establecer fecha actual como valor por defecto
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('payment-date');
    if (dateInput) {
        dateInput.value = today;
    } else {
        console.error('No se encontró el elemento payment-date');
    }
    
    // Mostrar el modal
    if (newPaymentModal) {
        newPaymentModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('Modal mostrado correctamente');
    } else {
        console.error('No se pudo encontrar el modal');
    }
}

// Cerrar modal de nuevo pago
function closeNewPaymentModal() {
    console.log('Cerrando modal de nuevo pago');
    
    if (newPaymentModal) {
        newPaymentModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Esperar a que termine la animación para resetear el formulario
        setTimeout(() => {
            if (newPaymentForm) {
                newPaymentForm.reset();
            }
        }, 300);
        
        console.log('Modal cerrado correctamente');
    } else {
        console.error('No se pudo encontrar el modal para cerrar');
    }
}

// Manejar envío del formulario de nuevo pago
function handleNewPaymentSubmit(e) {
    e.preventDefault();
    
    const providerId = parseInt(document.getElementById('payment-provider').value);
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const concept = document.getElementById('payment-concept').value.trim();
    const paymentDate = document.getElementById('payment-date').value;
    
    // Validaciones
    if (!providerId || isNaN(amount) || amount <= 0 || !concept || !paymentDate) {
        alert('Por favor complete todos los campos correctamente');
        return;
    }
    
    // Crear nuevo pago
    const newPayment = {
        id: nextPaymentId++,
        providerId,
        amount,
        concept,
        date: paymentDate,
        status: 'Completado',
        createdAt: new Date().toISOString()
    };
    
    // Agregar a la lista de pagos
    payments.unshift(newPayment);
    
    // Guardar en localStorage
    localStorage.setItem('payments', JSON.stringify(payments));
    
    // Actualizar la interfaz
    renderPaymentsTable();
    updateSummary();
    
    // Cerrar el modal y limpiar el formulario
    closeNewPaymentModal();
    
    // Mostrar notificación de éxito
    alert('Pago registrado exitosamente');
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botón de nuevo pago
    console.log('Buscando botón con id new-payment-btn');
    const newPaymentButton = document.getElementById('new-payment-btn');
    console.log('Botón encontrado en setupEventListeners:', newPaymentButton);
    
    if (newPaymentButton) {
        console.log('Configurando botón nuevo pago');
        newPaymentButton.addEventListener('click', function() {
            console.log('Click en botón nuevo pago detectado');
            showNewPaymentModal();
        });
    } else {
        console.error('No se encontró el botón de nuevo pago');
    }
    
    // Filtros y botones existentes
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPdf);
    
    // Eventos del modal de nuevo pago
    if (newPaymentForm) newPaymentForm.addEventListener('submit', handleNewPaymentSubmit);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeNewPaymentModal);
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closeNewPaymentModal);
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === newPaymentModal) {
            closeNewPaymentModal();
        }
    });
    
    console.log('Event listeners configurados');
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

// Función para resetear filtros
function resetFilters() {
    providerFilter.value = '';
    statusFilter.value = '';
    const today = new Date();
    dateRange.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    renderPaymentsTable();
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// Funciones globales para los botones
window.viewPaymentDetails = viewPaymentDetails;
window.printReceipt = printReceipt;
