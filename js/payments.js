// Datos de pagos
let payments = JSON.parse(localStorage.getItem('payments')) || [];
let providers = JSON.parse(localStorage.getItem('providers')) || [];
let nextPaymentId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;

// Elementos del DOM
const paymentsTable = document.getElementById('payments-table');
const providerFilter = document.getElementById('provider-filter');
const statusFilter = document.getElementById('status-filter');
const dateRange = document.getElementById('ten-range');
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
    if (init.initialized) {
        console.log('La aplicación ya fue inicializada');
        return;
    }
    
    console.log('Inicializando aplicación de pagos...');
    
    // Cargar datos del localStorage
    payments = JSON.parse(localStorage.getItem('payments') || '[]');
    providers = JSON.parse(localStorage.getItem('providers') || '[]');
    nextPaymentId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
    
    // Configurar la interfaz
    setupEventListeners();
    loadProviders();
    loadDecades();
    renderPaymentsTable();
    updateSummary();
    
    // Marcar que la inicialización ya se realizó
    init.initialized = true;
    console.log('Aplicación inicializada correctamente');
}

// Cargar decenas en el selector
function loadDecades() {
    try {
        console.log('Cargando decenas...');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // Configurar fechas para cargar decenas de mayo a junio del año actual
        const startDate = new Date(currentYear, 4, 1); // 1 de mayo (los meses son 0-indexados)
        const endDate = new Date(currentYear, 5, 30);   // 30 de junio
        
        // Llamar a la función del generador de decenas
        populateDecadeSelect('payment-decade', startDate, endDate, true);
        console.log('decenas cargadas correctamente');
    } catch (error) {
        console.error('Error al cargar las decenas:', error);
    }
}

// Cargar proveedores en los filtros y formularios
function loadProviders() {
    console.log('=== Iniciando carga de proveedores ===');
    
    // Obtener referencias a los elementos del DOM
    const providerSelect = document.getElementById('payment-provider');
    const providerFilter = document.getElementById('provider-filter');
    
    if (!providerSelect || !providerFilter) {
        console.error('Error: No se encontraron los elementos del DOM necesarios');
        return;
    }
    
    console.log('Limpiando selects de proveedores...');
    
    // Limpiar completamente los selects
    providerSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
    providerFilter.innerHTML = '<option value="">Todos los proveedores</option>';
    
    // Obtener proveedores del localStorage
    const storedProviders = JSON.parse(localStorage.getItem('providers') || '[]');
    console.log('Proveedores encontrados en localStorage:', storedProviders.length);
    
    if (!Array.isArray(storedProviders) || storedProviders.length === 0) {
        console.log('No hay proveedores para cargar');
        return;
    }
    
    // Usar un Map para asegurar que no haya duplicados por ID
    const uniqueProviders = new Map();
    
    // Filtrar y limpiar proveedores
    storedProviders.forEach(provider => {
        if (provider && provider.id !== undefined && provider.name) {
            const id = String(provider.id).trim();
            // Guardar el objeto completo del proveedor
            uniqueProviders.set(id, {
                ...provider,
                id: parseInt(id, 10),
                name: String(provider.name).trim()
            });
        }
    });
    
    console.log('Proveedores únicos después de filtrar:', uniqueProviders.size);
    
    // Actualizar el array global de proveedores primero
    window.providers = Array.from(uniqueProviders.values());
    
    // Llenar el select de filtro con todos los proveedores
    uniqueProviders.forEach((provider, id) => {
        // Verificar si la opción ya existe
        const existingOption = Array.from(providerFilter.options).find(opt => opt.value === id);
        if (!existingOption) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = provider.name;
            providerFilter.appendChild(option);
        }
    });
    
    // Llenar el select del formulario de pago solo con proveedores activos
    uniqueProviders.forEach((provider, id) => {
        // Solo agregar si el proveedor está activo
        if (provider.status === 'Activo') {
            const existingOption = Array.from(providerSelect.options).find(opt => opt.value === id);
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = provider.name;
                providerSelect.appendChild(option);
            }
        }
    });
    
    console.log('=== Carga de proveedores completada ===');
    console.log('Proveedores cargados:', uniqueProviders.size);
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
        
        // Obtener información de la decena si existe
        const decadeInfo = payment.decade ? 
            payment.decade.label || `decena ${payment.decade.code}` : 
            'No especificada';
            
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>#${String(payment.id).padStart(4, '0')}</td>
                <td>${provider.name || 'Proveedor no encontrado'}</td>
                <td>${decadeInfo}</td>
                <td>${formattedAmount}</td>
                <td>
                    <span class="status-badge status-${payment.status}">
                        ${payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-info" onclick="editPayment(${payment.id})">
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
    
    // Cargar proveedores usando la función centralizada
    // Esto ya maneja la carga de proveedores activos en el select
    loadProviders();
    
    // Actualizar el select del formulario de pago
    const providerSelect = document.getElementById('payment-provider');
    if (!providerSelect) {
        console.error('No se encontró el select de proveedores');
        return;
    }
    
    // Verificar que hay opciones cargadas
    if (providerSelect.options.length <= 1) {
        console.log('No hay proveedores activos disponibles');
    } else {
        console.log('Proveedores cargados en el select:', providerSelect.options.length - 1);
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
    const decadeCode = document.getElementById('payment-decade').value;
    const paymentIdInput = document.getElementById('payment-id');
    const isEditMode = paymentIdInput && paymentIdInput.value !== '';
    
    // Validaciones
    if (!providerId || isNaN(amount) || amount <= 0 || !concept || !paymentDate || !decadeCode) {
        alert('Por favor complete todos los campos correctamente');
        return;
    }
    
    // Obtener el objeto de decena seleccionado
    const selectedDecade = getDecadeByCode(decadeCode);
    if (!selectedDecade) {
        alert('La decena seleccionada no es válida');
        return;
    }
    
    if (isEditMode) {
        // Modo edición: Actualizar pago existente
        const paymentId = parseInt(paymentIdInput.value);
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex !== -1) {
            // Validar y formatear fechas
            const formatDate = (date) => {
                if (!date) return null;
                const d = date instanceof Date ? date : new Date(date);
                return isNaN(d.getTime()) ? null : d.toISOString();
            };
            
            // Actualizar el pago existente
            payments[paymentIndex] = {
                ...payments[paymentIndex],
                providerId,
                amount,
                concept,
                date: paymentDate,
                decade: {
                    code: selectedDecade.code,
                    label: selectedDecade.label,
                    startDate: formatDate(selectedDecade.startDate) || new Date().toISOString(),
                    endDate: formatDate(selectedDecade.endDate) || new Date().toISOString()
                },
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
        // Validar y formatear fechas
        const formatDate = (date) => {
            if (!date) return null;
            const d = date instanceof Date ? date : new Date(date);
            return isNaN(d.getTime()) ? null : d.toISOString();
        };

        const newPayment = {
            id: nextPaymentId++,
            providerId,
            amount,
            concept,
            date: paymentDate,
            decade: {
                code: selectedDecade.code,
                label: selectedDecade.label,
                startDate: formatDate(selectedDecade.startDate) || new Date().toISOString(),
                endDate: formatDate(selectedDecade.endDate) || new Date().toISOString()
            },
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
        newPaymentButton.addEventListener('click', showNewPaymentModal);
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
    document.getElementById('payment-provider').value = payment.providerId;
    document.getElementById('payment-amount').value = payment.amount;
    document.getElementById('payment-concept').value = payment.concept;
    document.getElementById('payment-date').value = payment.date.split('T')[0];
    
    // Establecer la decena si existe
    if (payment.decade && payment.decade.code) {
        const decadeSelect = document.getElementById('payment-decade');
        if (decadeSelect) {
            // Verificar si la opción existe en el select
            const optionExists = Array.from(decadeSelect.options).some(opt => opt.value === payment.decade.code);
            if (optionExists) {
                decadeSelect.value = payment.decade.code;
            } else {
                // Si la opción no existe, agregarla
                const option = new Option(payment.decade.label, payment.decade.code);
                decadeSelect.add(option);
                decadeSelect.value = payment.decade.code;
            }
        }
    }
    
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

// Función para generar códigos de decenas
function generateDecadeCodes() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1; // Los meses van de 0 a 11
    const decades = [];
    
    // Generar decenas para los últimos 3 meses y los próximos 3 meses
    for (let m = month - 3; m <= month + 3; m++) {
        let currentMonth = m;
        let currentYear = year;
        
        // Ajustar año si el mes es menor a 1 o mayor a 12
        if (currentMonth < 1) {
            currentMonth += 12;
            currentYear--;
        } else if (currentMonth > 12) {
            currentMonth -= 12;
            currentYear++;
        }
        
        // Generar códigos para las tres decenas del mes
        for (let d = 1; d <= 3; d++) {
            const decadeCode = `${d}${currentMonth.toString().padStart(2, '0')}${currentYear}`;
            const startDay = (d - 1) * 10 + 1;
            let endDay = d * 10;
            
            // Ajustar el último día de la tercera decena según el mes
            if (d === 3) {
                const lastDay = new Date(currentYear, currentMonth, 0).getDate();
                endDay = Math.min(30, lastDay);
            }
            
            const label = `decena ${d} (${startDay}-${endDay}/${currentMonth.toString().padStart(2, '0')}/${currentYear})`;
            decades.push({ code: decadeCode, label });
        }
    }
    
    return decades;
}

// Obtener un objeto de decena por su código
function getDecadeByCode(decadeCode) {
    if (!decadeCode) return null;
    
    try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 4, 1); // 1 de mayo
        const endDate = new Date(currentYear, 5, 30);   // 30 de junio
        
        const decades = generateDecadeCodes(startDate, endDate);
        return decades.find(d => d.code === decadeCode) || null;
    } catch (error) {
        console.error('Error al obtener la decena:', error);
        return null;
    }
}

// Función para cargar los rangos de fechas en el select
function loadDateRanges() {
    const dateRangeSelect = document.getElementById('ten-range');
    if (!dateRangeSelect) return;
    
    // Limpiar opciones existentes
    dateRangeSelect.innerHTML = '';
    
    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccionar período';
    dateRangeSelect.appendChild(defaultOption);
    
    // Generar y agregar opciones de decenas
    const decades = generateDecadeCodes();
    decades.forEach(decade => {
        const option = document.createElement('option');
        option.value = decade.code;
        option.textContent = decade.label;
        dateRangeSelect.appendChild(option);
    });
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Solo inicializar si no se ha hecho antes
        if (!init.initialized) {
            init();
            loadDateRanges();
        }
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
});
