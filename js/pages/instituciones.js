import { institucionService } from '../api/institucion.service.js';
import { municipioService } from '../api/municipio.service.js';

let institucionesData = [];
let institucionesFiltradas = [];
let institucionEditando = null;

// Elementos del DOM
const datos = document.getElementById('datos');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const filterButton = document.getElementById('filterButton');

// Modales
const createModal = new bootstrap.Modal(document.getElementById('createInstitucionModal'));
const editModal = new bootstrap.Modal(document.getElementById('editInstitucionModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const successModal = new bootstrap.Modal(document.getElementById('successModal'));
const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
const filtersModal = new bootstrap.Modal(document.getElementById('filtersInstitucionModal'));

export async function Init() {
    console.log('🏛️ Inicializando módulo de Instituciones...');
    try {
        await cargarMunicipios();
        await cargarInstituciones();
        inicializarEventos();
        console.log('✅ Módulo de Instituciones inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar instituciones', error.message);
    }
}

async function cargarMunicipios() {
    try {
        const municipios = await municipioService.getMunicipios();
        
        // Cargar en el select de crear
        const inputMunicipio = document.getElementById('inputMunicipio');
        if (inputMunicipio) {
            inputMunicipio.innerHTML = '<option value="">Seleccione un municipio...</option>';
            municipios.forEach(m => {
                inputMunicipio.innerHTML += `<option value="${m.id_municipio}">${m.nombre || m.nom_municipio}</option>`;
            });
        }
        
        // Cargar en el select de editar
        const editMunicipio = document.getElementById('editMunicipio');
        if (editMunicipio) {
            editMunicipio.innerHTML = '<option value="">Seleccione un municipio...</option>';
            municipios.forEach(m => {
                editMunicipio.innerHTML += `<option value="${m.id_municipio}">${m.nombre || m.nom_municipio}</option>`;
            });
        }
        
        // Cargar en filtros
        const filterMunicipio = document.getElementById('filterMunicipio');
        if (filterMunicipio) {
            filterMunicipio.innerHTML = '<option value="">Todos los municipios</option>';
            municipios.forEach(m => {
                filterMunicipio.innerHTML += `<option value="${m.id_municipio}">${m.nombre || m.nom_municipio}</option>`;
            });
        }
        
        console.log(`✅ ${municipios.length} municipios cargados`);
    } catch (error) {
        console.error('Error al cargar municipios:', error);
    }
}

async function cargarInstituciones() {
    try {
        mostrarCargando();
        institucionesData = await institucionService.getInstituciones();
        institucionesFiltradas = [...institucionesData];
        renderizarTabla();
        console.log(`✅ ${institucionesData.length} instituciones cargadas`);
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
        mostrarError('Error al cargar', 'No se pudieron cargar las instituciones');
    }
}

function renderizarTabla() {
    if (!datos) return;
    
    if (!institucionesFiltradas || institucionesFiltradas.length === 0) {
        datos.innerHTML = `
            <tr><td colspan="6" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">No se encontraron instituciones</p>
            </td></tr>`;
        return;
    }

    datos.innerHTML = institucionesFiltradas.map(inst => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-building text-primary me-2"></i>
                    <strong>${inst.nombre_institucion || 'N/A'}</strong>
                </div>
            </td>
            <td><span class="badge bg-secondary">${inst.nit_institucion || 'N/A'}</span></td>
            <td>${inst.direccion || 'N/A'}</td>
            <td>${inst.nombre_municipio || 'N/A'}</td>
            <td class="text-center">
                <span class="badge bg-primary">${inst.cant_convenios || 0}</span>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning" onclick="window.editarInstitucion('${inst.nit_institucion}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarInstitucion('${inst.nit_institucion}')" title="Eliminar">
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
            <tr><td colspan="6" class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted mb-0">Cargando instituciones...</p>
            </td></tr>`;
    }
}

function aplicarFiltros() {
    const textoBusqueda = searchInput?.value.toLowerCase() || '';
    
    institucionesFiltradas = institucionesData.filter(inst => {
        const cumpleBusqueda = !textoBusqueda || 
            (inst.nombre_institucion && inst.nombre_institucion.toLowerCase().includes(textoBusqueda)) ||
            (inst.nit_institucion && inst.nit_institucion.toLowerCase().includes(textoBusqueda)) ||
            (inst.direccion && inst.direccion.toLowerCase().includes(textoBusqueda)) ||
            (inst.nombre_municipio && inst.nombre_municipio.toLowerCase().includes(textoBusqueda));

        return cumpleBusqueda;
    });

    renderizarTabla();
}

function limpiarBusqueda() {
    if (searchInput) searchInput.value = '';
    institucionesFiltradas = [...institucionesData];
    renderizarTabla();
}

function inicializarEventos() {
    // Búsqueda
    searchInput?.addEventListener('input', aplicarFiltros);
    searchButton?.addEventListener('click', aplicarFiltros);
    clearSearchButton?.addEventListener('click', limpiarBusqueda);
    
    // Botón de filtros
    filterButton?.addEventListener('click', () => {
        filtersModal.show();
    });
    
    // Guardar nueva institución
    const btnGuardarInstitucion = document.getElementById('btnGuardarInstitucion');
    btnGuardarInstitucion?.addEventListener('click', guardarInstitucion);
    
    // Guardar edición
    const btnEditInstitucion = document.getElementById('btnEditInstitucion');
    btnEditInstitucion?.addEventListener('click', guardarEdicion);
    
    // Confirmar eliminación
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    btnConfirmDelete?.addEventListener('click', confirmarEliminacion);

    // Funciones globales para los botones de la tabla
    window.editarInstitucion = editarInstitucion;
    window.eliminarInstitucion = eliminarInstitucion;
}

async function guardarInstitucion() {
    try {
        const nit = document.getElementById('inputNit')?.value.trim();
        const nombre = document.getElementById('inputNombre')?.value.trim();
        const direccion = document.getElementById('inputDireccion')?.value.trim();
        const municipio = document.getElementById('inputMunicipio')?.value;

        if (!nit || !nombre || !direccion || !municipio) {
            mostrarError('Campos incompletos', 'Por favor completa todos los campos obligatorios');
            return;
        }

        const data = {
            nit_institucion: nit,
            nombre_institucion: nombre,
            direccion: direccion,
            id_municipio: parseInt(municipio),
            cant_convenios: 0,
            estado: true
        };

        await institucionService.createInstitucion(data);
        createModal.hide();
        mostrarExito('¡Institución creada!', 'La institución se ha registrado correctamente');
        await cargarInstituciones();
        
        // Limpiar formulario
        document.getElementById('formSaveInstitucion')?.reset();
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarError('Error al guardar', error.message);
    }
}

async function editarInstitucion(nit) {
    try {
        institucionEditando = await institucionService.getInstitucionByNit(nit);
        
        document.getElementById('editNitOriginal').value = institucionEditando.nit_institucion;
        document.getElementById('editNit').value = institucionEditando.nit_institucion;
        document.getElementById('editNombre').value = institucionEditando.nombre_institucion;
        document.getElementById('editDireccion').value = institucionEditando.direccion;
        document.getElementById('editMunicipio').value = institucionEditando.id_municipio;
        
        editModal.show();
    } catch (error) {
        console.error('Error al editar:', error);
        mostrarError('Error', 'No se pudo cargar la información de la institución');
    }
}

async function guardarEdicion() {
    try {
        const nit = document.getElementById('editNit')?.value.trim();
        const nombre = document.getElementById('editNombre')?.value.trim();
        const direccion = document.getElementById('editDireccion')?.value.trim();
        const municipio = document.getElementById('editMunicipio')?.value;

        if (!nit || !nombre || !direccion || !municipio) {
            mostrarError('Campos incompletos', 'Por favor completa todos los campos obligatorios');
            return;
        }

        const data = {
            nit_institucion: nit,
            nombre_institucion: nombre,
            direccion: direccion,
            id_municipio: parseInt(municipio),
            estado: true
        };

        await institucionService.updateInstitucion(nit, data);
        editModal.hide();
        mostrarExito('¡Institución actualizada!', 'Los cambios se han guardado correctamente');
        await cargarInstituciones();
    } catch (error) {
        console.error('Error al actualizar:', error);
        mostrarError('Error al actualizar', error.message);
    }
}

let nitAEliminar = null;

function eliminarInstitucion(nit) {
    nitAEliminar = nit;
    const institucion = institucionesData.find(i => i.nit_institucion === nit);
    const mensaje = `¿Estás seguro de eliminar la institución "${institucion?.nombre_institucion || 'esta institución'}"?`;
    
    document.getElementById('deleteConfirmMessage').textContent = mensaje;
    deleteModal.show();
}

async function confirmarEliminacion() {
    try {
        if (!nitAEliminar) return;
        
        await institucionService.deleteInstitucion(nitAEliminar);
        deleteModal.hide();
        mostrarExito('¡Institución eliminada!', 'La institución se ha eliminado correctamente');
        await cargarInstituciones();
        nitAEliminar = null;
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarError('Error al eliminar', error.message);
    }
}

function mostrarExito(titulo, mensaje) {
    document.getElementById('successModalTitle').textContent = titulo;
    document.getElementById('successModalMessage').textContent = mensaje;
    successModal.show();
}

function mostrarError(titulo, mensaje) {
    document.getElementById('errorModalTitle').textContent = titulo;
    document.getElementById('errorModalMessage').textContent = mensaje;
    errorModal.show();
}