// ----------------------
// 🌐 Datos iniciales
// ----------------------
console.log('Inicializando aplicación...');
let providers = [];
let nextProviderId = 1;

try {
    const storedProviders = localStorage.getItem('providers');
    const storedNextId = localStorage.getItem('nextProviderId');

    providers = storedProviders ? JSON.parse(storedProviders) : [];
    nextProviderId = storedNextId ? parseInt(storedNextId) : 1;

    console.log('Datos cargados de localStorage:', { providers, nextProviderId });
} catch (error) {
    console.error('❌ Error al cargar datos de localStorage:', error);
    providers = [];
    nextProviderId = 1;
}

// ----------------------
// 🔁 Funciones CRUD
// ----------------------
function getProviders() {
    try {
        const stored = localStorage.getItem('providers');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('❌ Error al obtener proveedores:', error);
        return [];
    }
}

function saveProviders(providersToSave) {
    try {
        localStorage.setItem('providers', JSON.stringify(providersToSave));
        localStorage.setItem('nextProviderId', nextProviderId);
        updateMetrics();
        return true;
    } catch (error) {
        console.error('❌ Error al guardar proveedores:', error);
        showNotification('❌ Error al guardar los datos', 'error');
        return false;
    }
}

function createProvider(providerData) {
    const newProvider = {
        id: nextProviderId++,
        ...providerData,
        status: 'Activo',
        createdAt: new Date().toISOString()
    };
    const updatedProviders = [...getProviders(), newProvider];

    saveProviders(updatedProviders);
    return newProvider;
}

function updateProvider(id, updatedData) {
    const providers = getProviders();
    const index = providers.findIndex(p => p.id === id);
    if (index !== -1) {
        providers[index] = { ...providers[index], ...updatedData, updatedAt: new Date().toISOString() };
        return saveProviders(providers);
    }
    return false;
}

function deleteProvider(id) {
    const providers = getProviders();
    const updatedProviders = providers.filter(p => p.id !== id);
    if (updatedProviders.length < providers.length) {
        return saveProviders(updatedProviders);
    }
    return false;
}

// ----------------------
// 📊 Render UI
// ----------------------
function renderProvidersTable() {
    const tbody = document.getElementById('providers-table');
    if (!tbody) return;

    const providers = getProviders();
    if (providers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No hay proveedores registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = providers.map(provider => `
        <tr>
        <td>${provider.createdAt ? new Date(provider.createdAt).toLocaleDateString() : 'N/A'}</td>
            <td>${provider.name || '-'}</td>
            <td>${provider.representative || '-'}</td>
            <td>${provider.representativeEmail || '-'}</td>
            <td>${provider.bank || '-'}</td>
            <td>${provider.accountNumber || '-'}</td>
            <td>${provider.accountType || '-'}</td>
            <td><span class="status-badge ${(provider.status || 'Activo').toLowerCase()}">${provider.status || 'Activo'}</span></td>
            <td>
                <button class="btn btn-primary" onclick="editProvider(${provider.id})">
                    <i class="ti-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDelete(${provider.id})">
                    <i class="ti-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

function updateMetrics() {
    const providers = getProviders();
    document.getElementById('total-providers').textContent = providers.length;
    document.getElementById('active-providers').textContent = providers.filter(p => p.status === 'Activo').length;
    document.getElementById('inactive-providers').textContent = providers.filter(p => p.status === 'Inactivo').length; // Contar proveedores inactivos
    document.getElementById('total-accounts').textContent = providers.length; // Actualizar contador de cuentas totales

    // Actualizar si hay métricas de pagos
    if (document.getElementById('total-payments')) {
        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const avg = payments.length ? Math.round(total / payments.length) : 0;

        document.getElementById('total-payments').textContent = `$${total.toLocaleString()}`;
        document.getElementById('payment-count').textContent = payments.length;
        document.getElementById('avg-payment').textContent = `$${avg.toLocaleString()}`;
    }
}

// ----------------------
// ✅ Validaciones
// ----------------------
function validateForm(data) {
    if (!data.name.trim()) throw new Error('El nombre del proveedor es requerido');
    if (!data.representative.trim()) throw new Error('El nombre del representante es requerido');
    if (!data.bank) throw new Error('Debe seleccionar un banco');
    if (!/^\d{1,20}$/.test(data.accountNumber)) throw new Error('Número de cuenta inválido (máx. 20 dígitos numéricos)');
    if (!data.accountType) throw new Error('Debe seleccionar un tipo de cuenta');
    return true;
}

// ----------------------
// 🔔 Notificaciones
// ----------------------
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        notification.addEventListener('animationend', () => notification.remove());
    }, 3000);
}

// ----------------------
// 🧠 Manejadores de eventos
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
    renderProvidersTable();
    updateMetrics();

    const form = document.getElementById('provider-form');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const providerData = {
            name: document.getElementById('provider-name').value.trim(),
            representative: document.getElementById('representative-name').value.trim(),
            representativeEmail: document.getElementById('representative-email').value.trim(),
            bank: document.getElementById('bank-name').value,
            accountNumber: document.getElementById('account-number').value.trim(),
            accountType: document.getElementById('account-type').value
        };

        try {
            validateForm(providerData);
            const isDuplicate = getProviders().some(p => p.name.toLowerCase() === providerData.name.toLowerCase());
            if (isDuplicate) throw new Error('Ya existe un proveedor con este nombre');

            createProvider(providerData);
            showNotification('✅ Proveedor registrado exitosamente');
            renderProvidersTable();
            updateMetrics();
            form.reset();
        } catch (error) {
            showNotification(`❌ ${error.message}`, 'error');
        }
    });
});

// ----------------------
// 🔁 Edición y eliminación
// ----------------------
let currentProviderToDelete = null;

window.confirmDelete = function(id) {
    const provider = getProviders().find(p => p.id === id);
    if (!provider) return showNotification('❌ No se encontró el proveedor', 'error');
    openDeleteModal(provider);
};

function handleDeleteProvider() {
    if (!currentProviderToDelete) return;
    try {
        if (deleteProvider(currentProviderToDelete.id)) {
            showNotification('✅ Proveedor eliminado');
            renderProvidersTable();
            updateMetrics();
        } else {
            throw new Error('No se pudo eliminar el proveedor');
        }
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    } finally {
        closeDeleteModal();
    }
}

// ----------------------
// 🗑️ Funciones para el modal de eliminación
// ----------------------
function openDeleteModal(provider) {
    console.log('=== INICIO openDeleteModal ===');
    console.log('Proveedor a eliminar:', provider);
    
    if (!provider) {
        console.error('No se proporcionó un proveedor para eliminar');
        return;
    }
    
    currentProviderToDelete = provider;
    
    // Actualizar el contenido del modal con el nombre del proveedor
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) {
        console.error('No se encontró el modal de confirmación de eliminación');
        return;
    }
    
    // Mostrar el nombre del proveedor en el mensaje de confirmación
    const providerNameElement = modal.querySelector('#provider-name-to-delete');
    if (providerNameElement) {
        providerNameElement.textContent = provider.name || 'este proveedor';
    }
    
    // Abrir el modal
    openModal(modal);
    
    console.log('=== FIN openDeleteModal ===');
}

function closeDeleteModal() {
    console.log('=== INICIO closeDeleteModal ===');
    
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        closeModal(modal);
    }
    
    // Limpiar la referencia al proveedor actual
    currentProviderToDelete = null;
    
    console.log('=== FIN closeDeleteModal ===');
}

// Eventos modal de confirmación
document.addEventListener('DOMContentLoaded', () => {
    // Configurar el manejador para el botón de confirmar eliminación
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleDeleteProvider);
    } else {
        console.error('No se encontró el botón de confirmar eliminación');
    }
    
    // Configurar el manejador para el botón de cancelar
    const cancelBtn = document.getElementById('cancel-delete-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDeleteModal);
    }
    
    // Configurar el manejador para el botón de cerrar (X)
    const closeBtn = document.getElementById('close-delete-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDeleteModal);
    }
    
    // Cerrar al hacer clic fuera del contenido del modal
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                closeDeleteModal();
            }
        });
    }
});

// ----------------------
// 🪟 Funciones de Modal
// ----------------------
function openModal(modal) {
    console.log('=== INICIO openModal ===');
    
    if (!modal) {
        const errorMsg = 'No se proporcionó un modal para abrir';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    console.log('Abriendo modal con ID:', modal.id);
    console.log('Clases del modal antes:', modal.className);
    
    // Verificar si el modal está en el DOM
    if (!document.body.contains(modal)) {
        const errorMsg = `El modal con ID ${modal.id} no se encuentra en el DOM`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    // Mostrar el modal y agregar la clase show
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Usar setTimeout para asegurar que el navegador procese el cambio de display
    setTimeout(() => {
        modal.classList.add('show');
        console.log('Clases del modal después:', modal.className);
        console.log('Modal mostrado exitosamente');
        
        // Verificar si el modal es visible
        const isVisible = modal.offsetParent !== null || 
                         modal.offsetWidth > 0 || 
                         modal.offsetHeight > 0;
        console.log('Visibilidad del modal:', isVisible);
    }, 10);
}

function closeModal(modal) {
    console.log('=== INICIO closeModal ===');
    
    if (!modal) {
        console.error('No se proporcionó un modal para cerrar');
        return;
    }
    
    console.log('Cerrando modal con ID:', modal.id);
    
    // Remover la clase show primero para la animación
    modal.classList.remove('show');
    
    // Esperar a que termine la transición antes de ocultar
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('Modal cerrado correctamente');
    }, 300); // Debe coincidir con la duración de la transición CSS
}

// ----------------------
// ✏️ Funciones de edición
// ----------------------
window.editProvider = function(id) {
    console.log('=== INICIO editProvider ===');
    console.log('ID recibido:', id, 'Tipo:', typeof id);
    
    // Asegurarse de que el ID sea un número
    const providerId = typeof id === 'string' ? parseInt(id) : id;
    
    if (isNaN(providerId)) {
        console.error('ID de proveedor no válido:', id);
        return showNotification('❌ ID de proveedor no válido', 'error');
    }
    
    console.log('Buscando proveedor con ID:', providerId);
    
    const providers = getProviders();
    console.log('Total de proveedores cargados:', providers.length);
    console.log('IDs de proveedores disponibles:', providers.map(p => p.id));
    
    const provider = providers.find(p => p.id === providerId);
    if (!provider) {
        console.error('No se encontró el proveedor con ID:', providerId);
        return showNotification('❌ No se encontró el proveedor', 'error');
    }
    
    console.log('Proveedor encontrado:', provider);

    console.log('Proveedor encontrado:', provider);
    
    const modal = document.getElementById('edit-provider-modal');
    if (!modal) {
        console.error('No se encontró el elemento con ID: edit-provider-modal');
        return showNotification('❌ Error: No se pudo cargar el formulario de edición', 'error');
    }

    try {
        console.log('Iniciando mapeo de campos del formulario...');
        
        // Mapear los campos del proveedor a los IDs del formulario
        const fieldMap = {
            'name': 'edit-provider-name',
            'representative': 'edit-representative-name',
            'representativeEmail': 'edit-representative-email',
            'bank': 'edit-bank-name',
            'accountNumber': 'edit-account-number',
            'accountType': 'edit-account-type',
            'status': 'edit-status'
        };

        console.log('Campos a mapear:', Object.entries(fieldMap));

        // Prellenar los campos del formulario
        Object.entries(fieldMap).forEach(([field, fieldId]) => {
            console.log(`Buscando elemento con ID: ${fieldId}`);
            const element = document.getElementById(fieldId);
            if (element) {
                console.log(`Elemento encontrado, estableciendo valor: ${provider[field] || ''}`);
                element.value = provider[field] || '';
            } else {
                console.error(`No se encontró el elemento con ID: ${fieldId}`);
                throw new Error(`Campo requerido no encontrado: ${fieldId}`);
            }
        });

        console.log('Campos del formulario establecidos correctamente');

        // Establecer el ID del proveedor en el campo oculto
        const providerIdElement = document.getElementById('edit-provider-id');
        if (providerIdElement) {
            providerIdElement.value = provider.id;
            console.log('ID del proveedor establecido:', provider.id);
        } else {
            console.error('No se encontró el elemento edit-provider-id');
            throw new Error('No se pudo encontrar el campo oculto para el ID del proveedor');
        }

        // Mostrar el modal
        console.log('Mostrando modal de edición');
        openModal(modal);
    } catch (error) {
        console.error('Error al abrir el modal de edición:', error);
        showNotification('❌ Error al cargar el formulario de edición', 'error');
    }
};

// Función para manejar el envío del formulario de edición
function handleEditFormSubmit(e) {
    e.preventDefault();
    
    try {
        const providerIdElement = document.getElementById('edit-provider-id');
        if (!providerIdElement || !providerIdElement.value) {
            throw new Error('No se pudo obtener el ID del proveedor');
        }
        
        const id = parseInt(providerIdElement.value);
        if (isNaN(id)) {
            throw new Error('ID de proveedor no válido');
        }
        
        const updatedData = {
            name: document.getElementById('edit-provider-name').value.trim(),
            representative: document.getElementById('edit-representative-name').value.trim(),
            representativeEmail: document.getElementById('edit-representative-email').value.trim(),
            bank: document.getElementById('edit-bank-name').value,
            accountNumber: document.getElementById('edit-account-number').value.trim(),
            accountType: document.getElementById('edit-account-type').value,
            status: document.getElementById('edit-status').value,
            updatedAt: new Date().toISOString()
        };
        
        console.log('Datos a actualizar:', updatedData);

        // Validar los datos
        validateForm(updatedData);
        
        // Actualizar el proveedor
        if (updateProvider(id, updatedData)) {
            showNotification('✅ Proveedor actualizado exitosamente');
            renderProvidersTable();
            updateMetrics();
            closeModal(document.getElementById('edit-provider-modal'));
        } else {
            throw new Error('No se pudo actualizar el proveedor');
        }
    } catch (error) {
        console.error('Error al actualizar el proveedor:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Inicializar el formulario de edición
document.addEventListener('DOMContentLoaded', () => {
    // Event listener para el formulario de edición
    const editForm = document.getElementById('edit-provider-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
    
    // Cerrar modal al hacer clic en el botón de cancelar
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            closeModal(document.getElementById('edit-provider-modal'));
        });
    }
    
    // Cerrar modal al hacer clic en la X
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            closeModal(document.getElementById('edit-provider-modal'));
        });
    }
    
    // Cerrar modal al hacer clic fuera del contenido del modal
    const editModal = document.getElementById('edit-provider-modal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeModal(editModal);
            }
        });
    }
});
