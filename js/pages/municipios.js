import { municipioService } from '../api/municipio.service.js';

let municipiosData = [];
let municipiosFiltrados = [];
let municipioEditando = null;

// Elementos del DOM
const buscar = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const datos = document.getElementById('datos');
const btnNuevoMunicipio = document.getElementById('btnNuevoMunicipio');

// Inicializar modales SOLO cuando los elementos existan
let modalCreate = null;
let modalEdit = null;
let modalSuccess = null;
let modalError = null;
let modalDelete = null;

export async function Init() {
    console.log('🗺️ Inicializando módulo de Municipios...');
    try {
        // Esperar a que el DOM esté completamente listo
        await esperarDOM();
        
        // Inicializar modales DESPUÉS de que el DOM esté listo
        inicializarModales();
        
        // Cargar datos y eventos
        await cargarMunicipios();
        inicializarEventos();
        
        console.log('✅ Módulo de Municipios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

/**
 * Espera a que el DOM esté completamente cargado
 */
function esperarDOM() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            setTimeout(resolve, 100);
        }
    });
}

/**
 * Inicializa los modales Bootstrap de forma segura
 */
function inicializarModales() {
    try {
        // Verificar que Bootstrap esté disponible
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap no está disponible');
            return;
        }

        // Inicializar cada modal solo si el elemento existe
        const createModalEl = document.getElementById('createMunicipioModal');
        if (createModalEl) {
            modalCreate = new bootstrap.Modal(createModalEl);
        }

        const editModalEl = document.getElementById('editMunicipioModal');
        if (editModalEl) {
            modalEdit = new bootstrap.Modal(editModalEl);
        }

        const successModalEl = document.getElementById('successModal');
        if (successModalEl) {
            modalSuccess = new bootstrap.Modal(successModalEl);
        }

        const errorModalEl = document.getElementById('errorModal');
        if (errorModalEl) {
            modalError = new bootstrap.Modal(errorModalEl);
        }

        const deleteModalEl = document.getElementById('deleteConfirmModal');
        if (deleteModalEl) {
            modalDelete = new bootstrap.Modal(deleteModalEl);
        }

        console.log('✅ Modales inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar modales:', error);
    }
}

async function cargarMunicipios() {
    try {
        mostrarCargando();
        municipiosData = await municipioService.getMunicipios();
        municipiosFiltrados = [...municipiosData];
        renderizarTabla();
        console.log(`✅ ${municipiosData.length} municipios cargados`);
    } catch (error) {
        console.error('Error:', error);
        mostrarError();
    }
}

function renderizarTabla() {
    if (!datos) return;
    
    if (!municipiosFiltrados || municipiosFiltrados.length === 0) {
        datos.innerHTML = `
            <tr><td colspan="3" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron municipios</p>
                <small class="text-muted">Intenta buscar con otro término</small>
            </td></tr>`;
        return;
    }

    datos.innerHTML = municipiosFiltrados.map((m, index) => `
        <tr>
            <td><strong>${m.id_municipio || index + 1}</strong></td>
            <td>
                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                ${m.nombre || m.nom_municipio || 'N/A'}
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning" onclick="window.editarMunicipio(${m.id_municipio})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarMunicipio(${m.id_municipio})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function mostrarCargando() {
    if (datos) {
        datos.innerHTML = `
            <tr><td colspan="3" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="text-muted mt-3">Cargando municipios...</p>
            </td></tr>`;
    }
}

function mostrarError() {
    if (datos) {
        datos.innerHTML = `
            <tr><td colspan="3" class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-muted">Error al cargar municipios</p>
            </td></tr>`;
    }
}

function aplicarFiltros() {
    const texto = buscar?.value.toLowerCase() || '';
    
    if (!texto) {
        municipiosFiltrados = [...municipiosData];
    } else {
        municipiosFiltrados = municipiosData.filter(m => {
            const nombre = m.nombre || m.nom_municipio || '';
            return nombre.toLowerCase().includes(texto);
        });
    }
    
    renderizarTabla();
}

function limpiarBusqueda() {
    if (buscar) buscar.value = '';
    municipiosFiltrados = [...municipiosData];
    renderizarTabla();
}

function inicializarEventos() {
    // Búsqueda
    buscar?.addEventListener('input', aplicarFiltros);
    searchButton?.addEventListener('click', aplicarFiltros);
    clearSearchButton?.addEventListener('click', limpiarBusqueda);
    
    // Botón nuevo municipio
    btnNuevoMunicipio?.addEventListener('click', abrirModalNuevo);
    
    // Botones de formularios
    const btnGuardar = document.getElementById('btnGuardarMunicipio');
    btnGuardar?.addEventListener('click', guardarMunicipio);
    
    const btnEdit = document.getElementById('btnEditMunicipio');
    btnEdit?.addEventListener('click', guardarEdicion);
    
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    btnConfirmDelete?.addEventListener('click', confirmarEliminacion);

    // Funciones globales
    window.editarMunicipio = editarMunicipio;
    window.eliminarMunicipio = eliminarMunicipio;
}

function abrirModalNuevo() {
    municipioEditando = null;
    document.getElementById('formSaveMunicipio')?.reset();
    modalCreate?.show();
}

async function editarMunicipio(id) {
    try {
        municipioEditando = await municipioService.getMunicipioById(id);
        
        document.getElementById('editIdMunicipio').value = municipioEditando.id_municipio;
        document.getElementById('editNombreMunicipio').value = municipioEditando.nombre || municipioEditando.nom_municipio;
        
        modalEdit?.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error', 'No se pudo cargar el municipio');
    }
}

async function guardarMunicipio() {
    try {
        const idMunicipio = document.getElementById('inputIdMunicipio')?.value;
        const nombreMunicipio = document.getElementById('inputNombreMunicipio')?.value;

        if (!idMunicipio || !nombreMunicipio) {
            mostrarMensajeError('Campos incompletos', 'Completa todos los campos');
            return;
        }

        const data = {
            id_municipio: parseInt(idMunicipio),
            nom_municipio: nombreMunicipio,
            estado: true
        };

        await municipioService.createMunicipio(data);
        modalCreate?.hide();
        mostrarMensajeExito('¡Municipio creado!', 'El municipio se ha registrado correctamente');
        await cargarMunicipios();
        
        document.getElementById('formSaveMunicipio')?.reset();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al guardar', error.message);
    }
}

async function guardarEdicion() {
    try {
        const id = document.getElementById('editIdMunicipio')?.value;
        const nombre = document.getElementById('editNombreMunicipio')?.value;

        if (!nombre) {
            mostrarMensajeError('Campo incompleto', 'El nombre es obligatorio');
            return;
        }

        const data = {
            nom_municipio: nombre,
            estado: true
        };

        await municipioService.updateMunicipio(id, data);
        modalEdit?.hide();
        mostrarMensajeExito('¡Municipio actualizado!', 'Los cambios se han guardado correctamente');
        await cargarMunicipios();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al actualizar', error.message);
    }
}

let idAEliminar = null;

function eliminarMunicipio(id) {
    idAEliminar = id;
    const municipio = municipiosData.find(m => m.id_municipio == id);
    const mensaje = `¿Estás seguro de eliminar el municipio "${municipio?.nombre || municipio?.nom_municipio || 'este municipio'}"?`;
    
    const msgElement = document.getElementById('deleteConfirmMessage');
    if (msgElement) {
        msgElement.textContent = mensaje;
    }
    
    modalDelete?.show();
}

async function confirmarEliminacion() {
    try {
        if (!idAEliminar) return;
        
        await municipioService.deleteMunicipio(idAEliminar);
        modalDelete?.hide();
        mostrarMensajeExito('¡Municipio eliminado!', 'El municipio se ha eliminado correctamente');
        await cargarMunicipios();
        idAEliminar = null;
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al eliminar', error.message);
    }
}

function mostrarMensajeExito(titulo, mensaje) {
    const titleEl = document.getElementById('successModalTitle');
    const messageEl = document.getElementById('successModalMessage');
    
    if (titleEl) titleEl.textContent = titulo;
    if (messageEl) messageEl.textContent = mensaje;
    
    modalSuccess?.show();
}

function mostrarMensajeError(titulo, mensaje) {
    const titleEl = document.getElementById('errorModalTitle');
    const messageEl = document.getElementById('errorModalMessage');
    
    if (titleEl) titleEl.textContent = titulo;
    if (messageEl) messageEl.textContent = mensaje;
    
    modalError?.show();
}