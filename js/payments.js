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

// Cargar proveedores en los filtros y formularios
function loadProviders() {
    // Limpiar selects
    providerFilter.innerHTML = '<option value="">Todos los proveedores</option>';
    const paymentProviderSelect = document.getElementById('payment-provider');
    
    if (paymentProviderSelect) {
        // Guardar la opción por defecto
        const defaultOption = paymentProviderSelect.querySelector('option[value=""]') || 
                             document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccionar proveedor';
        
        // Limpiar y restaurar la opción por defecto
        paymentProviderSelect.innerHTML = '';
        paymentProviderSelect.appendChild(defaultOption);
    }
    
    // Llenar ambos selects con los proveedores
    providers.forEach(provider => {
        // Para el filtro
        const filterOption = document.createElement('option');
        filterOption.value = provider.id;
        filterOption.textContent = provider.name;
        providerFilter.appendChild(filterOption);
        
        // Para el formulario de pago
        if (paymentProviderSelect) {
            const paymentOption = document.createElement('option');
            paymentOption.value = provider.id;
            paymentOption.textContent = provider.name;
            paymentProviderSelect.appendChild(paymentOption);
        }
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
                    <button class="btn  btn-info" onclick="editPayment(${payment.id})">
                        <i class="ti-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePayment(${payment.id}, this); return false;">
                        <i class="ti-trash"></i> Eliminar
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
        
        setTimeout(() => {
            if (newPaymentForm) {
                newPaymentForm.reset();
                
                // Restaurar el título original del modal
                const modalTitle = document.querySelector('#new-payment-modal .modal-header h2');
                if (modalTitle) {
                    modalTitle.textContent = 'Registrar Nuevo Pago';
                }
                
                // Eliminar el campo oculto del ID del pago si existe
                const paymentIdInput = document.getElementById('payment-id');
                if (paymentIdInput) {
                    paymentIdInput.remove();
                }
                
                // Reactivar y limpiar el select de proveedores
                const providerSelect = document.getElementById('payment-provider');
                if (providerSelect) {
                    // Restaurar la visualización del select
                    providerSelect.style.display = '';
                    providerSelect.disabled = false;
                    providerSelect.classList.remove('disabled');
                    
                    // Eliminar el elemento de visualización si existe
                    if (providerSelect._displayElement) {
                        providerSelect._displayElement.remove();
                        delete providerSelect._displayElement;
                    }
                }
            }
        }, 300);
        
        console.log('Modal cerrado correctamente');
    } else {
        console.error('No se pudo encontrar el modal para cerrar');
    }
}

// Manejar envío del formulario de nuevo/edición de pago
function handleNewPaymentSubmit(e) {
    e.preventDefault();
    
    const providerId = parseInt(document.getElementById('payment-provider').value);
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const concept = document.getElementById('payment-concept').value.trim();
    const paymentDate = document.getElementById('payment-date').value;
    const paymentIdInput = document.getElementById('payment-id');
    const isEditMode = paymentIdInput && paymentIdInput.value !== '';
    
    // Validaciones
    if (!providerId || isNaN(amount) || amount <= 0 || !concept || !paymentDate) {
        alert('Por favor complete todos los campos correctamente');
        return;
    }
    
    if (isEditMode) {
        // Modo edición: Actualizar pago existente
        const paymentId = parseInt(paymentIdInput.value);
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex !== -1) {
            // Actualizar el pago existente
            payments[paymentIndex] = {
                ...payments[paymentIndex],
                providerId,
                amount,
                concept,
                date: paymentDate,
                updatedAt: new Date().toISOString()
            };
            
            // Guardar cambios
            localStorage.setItem('payments', JSON.stringify(payments));
            
            // Actualizar la interfaz
            renderPaymentsTable();
            updateSummary();
            
            // Cerrar el modal
            closeNewPaymentModal();
            
            // Mostrar notificación de éxito
            alert('Pago actualizado exitosamente');
        } else {
            alert('No se pudo encontrar el pago a actualizar');
        }
    } else {
        // Modo creación: Crear nuevo pago
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

// Función para editar un pago existente
function editPayment(paymentId) {
    console.log('Editando pago con ID:', paymentId);
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
        console.error('No se encontró el pago con ID:', paymentId);
        alert('No se pudo cargar la información del pago seleccionado.');
        return;
    }
    
    // Obtener referencia al select de proveedores
    const providerSelect = document.getElementById('payment-provider');
    if (!providerSelect) {
        console.error('No se encontró el select de proveedores');
        return;
    }
    
    // Deshabilitar el select inmediatamente
    providerSelect.disabled = true;
    
    // Asegurarse de que el valor sea una cadena para la comparación
    const providerId = String(payment.providerId);
    
    // Verificar si ya existe un elemento de visualización
    if (!providerSelect._displayElement) {
        // Crear un elemento para mostrar el nombre del proveedor
        const providerDisplay = document.createElement('div');
        providerDisplay.className = 'form-control disabled';
        providerDisplay.style.backgroundColor = '#f8f9fa';
        providerDisplay.style.cursor = 'not-allowed';
        
        // Buscar el nombre del proveedor
        const provider = providers.find(p => String(p.id) === providerId);
        providerDisplay.textContent = provider ? provider.name : 'Proveedor no encontrado';
        
        // Insertar el display después del select y ocultar el select
        providerSelect.parentNode.insertBefore(providerDisplay, providerSelect.nextSibling);
        providerSelect.style.display = 'none';
        
        // Guardar referencia al elemento display para poder limpiarlo después
        providerSelect._displayElement = providerDisplay;
    } else {
        // Si ya existe, solo actualizar el texto
        const provider = providers.find(p => String(p.id) === providerId);
        providerSelect._displayElement.textContent = provider ? provider.name : 'Proveedor no encontrado';
        providerSelect.style.display = 'none';
        providerSelect._displayElement.style.display = 'block';
    }
    document.getElementById('payment-amount').value = payment.amount;
    document.getElementById('payment-concept').value = payment.concept;
    document.getElementById('payment-date').value = payment.date;
    
    // Cambiar el título del modal
    document.querySelector('#new-payment-modal .modal-header h2').textContent = 'Editar Pago';
    
    // Agregar clase para estilo visual cuando está deshabilitado
    providerSelect.classList.add('disabled');
    
    // Agregar un campo oculto para el ID del pago
    let paymentIdInput = document.getElementById('payment-id');
    if (!paymentIdInput) {
        paymentIdInput = document.createElement('input');
        paymentIdInput.type = 'hidden';
        paymentIdInput.id = 'payment-id';
        document.getElementById('new-payment-form').appendChild(paymentIdInput);
    }
    paymentIdInput.value = paymentId;
    
    // Mostrar el modal
    showNewPaymentModal();
}

// Función para ver detalles del pago (mantenida por compatibilidad)
function viewPaymentDetails(paymentId) {
    editPayment(paymentId); // Redirigir a la función de edición
}

// Variables para el modal de confirmación
let currentPaymentToDelete = null;
let currentDeleteButton = null;

// Función para abrir el modal de confirmación
function openDeleteConfirmation(paymentId, button) {
    currentPaymentToDelete = paymentId;
    currentDeleteButton = button;
    
    const modal = document.getElementById('confirm-delete-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Agregar la clase show después de un pequeño retraso para la animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

// Función para cerrar el modal de confirmación
function closeDeleteConfirmation() {
    const modal = document.getElementById('confirm-delete-modal');
    if (modal) {
        modal.classList.remove('show');
        
        // Esperar a que termine la animación antes de ocultar
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            currentPaymentToDelete = null;
            currentDeleteButton = null;
        }, 300);
    }
}

// Función para confirmar la eliminación
function confirmDelete() {
    if (currentPaymentToDelete === null || !currentDeleteButton) return;
    
    // Encontrar el índice del pago
    const paymentIndex = payments.findIndex(p => p.id === currentPaymentToDelete);
    
    if (paymentIndex === -1) {
        showNotification('No se pudo encontrar el pago a eliminar', 'error');
        closeDeleteConfirmation();
        return;
    }
    
    // Eliminar el pago del array
    payments.splice(paymentIndex, 1);
    
    // Actualizar localStorage
    localStorage.setItem('payments', JSON.stringify(payments));
    
    // Actualizar el ID máximo si es necesario
    if (currentPaymentToDelete === nextPaymentId - 1) {
        nextPaymentId--;
    }
    
    // Cerrar el modal
    closeDeleteConfirmation();
    
    // Eliminar la fila de la tabla
    const row = currentDeleteButton.closest('tr');
    if (row) {
        row.style.opacity = '0';
        setTimeout(() => {
            row.remove();
            updateSummary();
            showNotification('Pago eliminado correctamente', 'success');
        }, 300);
    } else {
        // Si no se puede eliminar la fila directamente, recargar la tabla
        renderPaymentsTable();
        updateSummary();
        showNotification('Pago eliminado correctamente', 'success');
    }
}

// Inicializar eventos del modal de confirmación
document.addEventListener('DOMContentLoaded', () => {
    // Botón de confirmar eliminación
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    // Botón de cancelar eliminación
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
    }
    
    // Botón de cerrar (x)
    const closeDeleteModal = document.getElementById('close-delete-modal');
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', closeDeleteConfirmation);
    }
    
    // Cerrar al hacer clic fuera del contenido del modal
    const deleteModal = document.getElementById('confirm-delete-modal');
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeDeleteConfirmation();
            }
        });
    }
});

// Función para eliminar un pago (mantenida por compatibilidad)
function deletePayment(paymentId, button) {
    openDeleteConfirmation(paymentId, button);
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
