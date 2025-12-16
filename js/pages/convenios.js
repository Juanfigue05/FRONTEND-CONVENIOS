import { convenioService } from '../api/convenio_service.js';
import { municipioService } from '../api/municipio_service.js';

// Variables globales
let conveniosData = [];
let conveniosFiltrados = [];
let convenioEditando = null;

// Elementos del DOM
const buscar = document.getElementById('buscar');
const btnNuevoConvenio = document.getElementById('btnNuevoConvenio');
const btnCargaMasiva = document.getElementById('btnCargaMasiva');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const tablaConvenios = document.getElementById('tabla-convenios');
const totalConvenios = document.getElementById('totalConvenios');

// Filtros
const filtroAnio = document.getElementById('filtroAnio');
const filtroMunicipio = document.getElementById('filtroMunicipio');
const filtroEstado = document.getElementById('filtroEstado');

// Modal convenio
const modalConvenio = new bootstrap.Modal(document.getElementById('modalConvenio'));
const modalConvenioTitle = document.getElementById('modalConvenioTitle');
const formConvenio = document.getElementById('formConvenio');
const btnGuardarConvenio = document.getElementById('btnGuardarConvenio');

// Modal carga masiva
const modalCargaMasiva = new bootstrap.Modal(document.getElementById('modalCargaMasiva'));
const archivoExcel = document.getElementById('archivoExcel');
const btnDescargarPlantilla = document.getElementById('btnDescargarPlantilla');
const btnLimpiarArchivo = document.getElementById('btnLimpiarArchivo');
const btnConfirmarImportacion = document.getElementById('btnConfirmarImportacion');
const infoArchivo = document.getElementById('infoArchivo');
const nombreArchivo = document.getElementById('nombreArchivo');
const tamanoArchivo = document.getElementById('tamanoArchivo');
const progresoLectura = document.getElementById('progresoLectura');
const vistaPrevia = document.getElementById('vistaPrevia');
const headerVistaPrevia = document.getElementById('headerVistaPrevia');
const bodyVistaPrevia = document.getElementById('bodyVistaPrevia');
const cantidadRegistros = document.getElementById('cantidadRegistros');

// Modal detalles
const modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
const detallesContent = document.getElementById('detallesContent');

/**
 * Inicializa el módulo
 */
export async function Init() {
    console.log('📋 Inicializando módulo de Convenios...');
    
    try {
        await cargarMunicipios();
        await cargarConvenios();
        inicializarEventos();
        console.log('✅ Módulo de Convenios inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo:', error);
        mostrarError('Error al cargar el módulo de convenios');
    }
}

/**
 * Carga los municipios para los filtros
 */
async function cargarMunicipios() {
    try {
        const municipios = await municipioService.getMunicipios();
        
        // Llenar filtro de municipios
        filtroMunicipio.innerHTML = '<option value="">Todos</option>';
        municipios.forEach(municipio => {
            const option = document.createElement('option');
            option.value = municipio.id_municipio;
            option.textContent = municipio.nombre;
            filtroMunicipio.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar municipios:', error);
    }
}

/**
 * Carga todos los convenios
 */
async function cargarConvenios() {
    try {
        mostrarCargando();
        conveniosData = await convenioService.getConvenios();
        conveniosFiltrados = [...conveniosData];
        renderizarTabla();
        actualizarTotal();
        console.log(`✅ ${conveniosData.length} convenios cargados`);
    } catch (error) {
        console.error('Error al cargar convenios:', error);
        mostrarError('No se pudieron cargar los convenios');
    }
}

/**
 * Renderiza la tabla de convenios
 */
function renderizarTabla() {
    if (!conveniosFiltrados || conveniosFiltrados.length === 0) {
        tablaConvenios.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No se encontraron convenios</p>
                </td>
            </tr>
        `;
        return;
    }

    tablaConvenios.innerHTML = conveniosFiltrados.map((convenio, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${convenio.num_proceso || 'N/A'}</strong></td>
            <td>${convenio.anio || 'N/A'}</td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-university text-primary me-2"></i>
                    <div>
                        <strong>${convenio.universidad || 'N/A'}</strong>
                        <br><small class="text-muted">NIT: ${convenio.nit_institucion || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td>${convenio.vigencia || 'N/A'}</td>
            <td class="text-center">
                ${convenio.estado 
                    ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>'
                    : '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i>Inactivo</span>'
                }
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="window.verDetalles(${convenio.id_convenio})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="window.editarConvenio(${convenio.id_convenio})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarConvenio(${convenio.id_convenio})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Muestra el loading en la tabla
 */
function mostrarCargando() {
    tablaConvenios.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted mt-3">Cargando convenios...</p>
            </td>
        </tr>
    `;
}

/**
 * Actualiza el contador total
 */
function actualizarTotal() {
    totalConvenios.textContent = conveniosFiltrados.length;
}

/**
 * Aplica los filtros
 */
function aplicarFiltros() {
    const textoBusqueda = buscar.value.toLowerCase();
    const anioSeleccionado = filtroAnio.value;
    const municipioSeleccionado = filtroMunicipio.value;
    const estadoSeleccionado = filtroEstado.value;

    conveniosFiltrados = conveniosData.filter(convenio => {
        // Filtro de búsqueda
        const cumpleBusqueda = !textoBusqueda || 
            (convenio.universidad && convenio.universidad.toLowerCase().includes(textoBusqueda)) ||
            (convenio.nit_institucion && convenio.nit_institucion.toLowerCase().includes(textoBusqueda)) ||
            (convenio.num_proceso && convenio.num_proceso.toLowerCase().includes(textoBusqueda));

        // Filtro de año
        const cumpleAnio = !anioSeleccionado || convenio.anio == anioSeleccionado;

        // Filtro de estado
        const cumpleEstado = !estadoSeleccionado || convenio.estado.toString() === estadoSeleccionado;

        return cumpleBusqueda && cumpleAnio && cumpleEstado;
    });

    renderizarTabla();
    actualizarTotal();
}

/**
 * Inicializa los eventos
 */
function inicializarEventos() {
    // Búsqueda
    buscar?.addEventListener('input', aplicarFiltros);

    // Filtros
    filtroAnio?.addEventListener('change', aplicarFiltros);
    filtroMunicipio?.addEventListener('change', aplicarFiltros);
    filtroEstado?.addEventListener('change', aplicarFiltros);

    // Limpiar filtros
    btnLimpiarFiltros?.addEventListener('click', () => {
        buscar.value = '';
        filtroAnio.value = '';
        filtroMunicipio.value = '';
        filtroEstado.value = '';
        aplicarFiltros();
    });

    // Botón nuevo convenio
    btnNuevoConvenio?.addEventListener('click', abrirModalNuevo);

    // Botón carga masiva
    btnCargaMasiva?.addEventListener('click', () => {
        modalCargaMasiva.show();
    });

    // Guardar convenio
    btnGuardarConvenio?.addEventListener('click', guardarConvenio);

    // Exportar Excel
    btnExportarExcel?.addEventListener('click', exportarExcel);

    // Carga masiva - archivo
    archivoExcel?.addEventListener('change', procesarArchivoExcel);
    btnLimpiarArchivo?.addEventListener('click', limpiarArchivo);
    btnConfirmarImportacion?.addEventListener('click', confirmarImportacion);
    btnDescargarPlantilla?.addEventListener('click', descargarPlantilla);

    // Exponer funciones globalmente
    window.verDetalles = verDetalles;
    window.editarConvenio = editarConvenio;
    window.eliminarConvenio = eliminarConvenio;
}

/**
 * Abre el modal para nuevo convenio
 */
function abrirModalNuevo() {
    convenioEditando = null;
    modalConvenioTitle.innerHTML = '<i class="fas fa-file-contract me-2"></i>Nuevo Convenio';
    formConvenio.reset();
    
    // Establecer año actual por defecto
    document.getElementById('anio').value = new Date().getFullYear();
    
    modalConvenio.show();
}

/**
 * Ver detalles de un convenio
 */
async function verDetalles(id) {
    try {
        const convenio = await convenioService.getConvenioById(id);
        
        detallesContent.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <strong><i class="fas fa-hashtag me-2"></i>N° Proceso:</strong>
                    <p>${convenio.num_proceso || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <strong><i class="fas fa-calendar me-2"></i>Año:</strong>
                    <p>${convenio.anio || 'N/A'}</p>
                </div>
                <div class="col-12">
                    <strong><i class="fas fa-university me-2"></i>Universidad:</strong>
                    <p>${convenio.universidad || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <strong><i class="fas fa-id-card me-2"></i>NIT:</strong>
                    <p>${convenio.nit_institucion || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <strong><i class="fas fa-hourglass-half me-2"></i>Vigencia:</strong>
                    <p>${convenio.vigencia || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <strong><i class="fas fa-calendar-check me-2"></i>Fecha Inicio:</strong>
                    <p>${convenio.fecha_inicio || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <strong><i class="fas fa-calendar-times me-2"></i>Fecha Fin:</strong>
                    <p>${convenio.fecha_fin || 'N/A'}</p>
                </div>
                ${convenio.link_convenio ? `
                <div class="col-12">
                    <strong><i class="fas fa-link me-2"></i>Link Convenio:</strong>
                    <p><a href="${convenio.link_convenio}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-external-link-alt me-2"></i>Abrir Convenio
                    </a></p>
                </div>
                ` : ''}
                ${convenio.link_secop ? `
                <div class="col-12">
                    <strong><i class="fas fa-external-link-alt me-2"></i>Link SECOP:</strong>
                    <p><a href="${convenio.link_secop}" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-external-link-alt me-2"></i>Abrir SECOP
                    </a></p>
                </div>
                ` : ''}
            </div>
        `;
        
        modalDetalles.show();
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarError('No se pudieron cargar los detalles');
    }
}

/**
 * Editar convenio
 */
async function editarConvenio(id) {
    try {
        convenioEditando = await convenioService.getConvenioById(id);
        
        modalConvenioTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Convenio';
        
        // Llenar formulario
        document.getElementById('num_proceso').value = convenioEditando.num_proceso || '';
        document.getElementById('anio').value = convenioEditando.anio || '';
        document.getElementById('nit_institucion').value = convenioEditando.nit_institucion || '';
        document.getElementById('universidad').value = convenioEditando.universidad || '';
        document.getElementById('link_convenio').value = convenioEditando.link_convenio || '';
        document.getElementById('link_secop').value = convenioEditando.link_secop || '';
        document.getElementById('fecha_inicio').value = convenioEditando.fecha_inicio || '';
        document.getElementById('fecha_fin').value = convenioEditando.fecha_fin || '';
        document.getElementById('vigencia').value = convenioEditando.vigencia || '';
        
        modalConvenio.show();
    } catch (error) {
        console.error('Error al cargar convenio:', error);
        mostrarError('No se pudo cargar el convenio');
    }
}

/**
 * Guardar convenio
 */
async function guardarConvenio() {
    try {
        const convenioData = {
            num_proceso: document.getElementById('num_proceso').value,
            anio: parseInt(document.getElementById('anio').value),
            nit_institucion: document.getElementById('nit_institucion').value,
            universidad: document.getElementById('universidad').value,
            link_convenio: document.getElementById('link_convenio').value,
            link_secop: document.getElementById('link_secop').value,
            fecha_inicio: document.getElementById('fecha_inicio').value,
            fecha_fin: document.getElementById('fecha_fin').value,
            vigencia: document.getElementById('vigencia').value,
            estado: true
        };

        // Validar campos requeridos
        if (!convenioData.num_proceso || !convenioData.anio || !convenioData.nit_institucion || 
            !convenioData.universidad || !convenioData.vigencia) {
            mostrarError('Por favor completa todos los campos obligatorios');
            return;
        }

        // Mostrar loading
        btnGuardarConvenio.disabled = true;
        btnGuardarConvenio.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (convenioEditando) {
            // Actualizar
            await convenioService.updateConvenio(convenioEditando.id_convenio, convenioData);
            mostrarExito('Convenio actualizado exitosamente');
        } else {
            // Crear
            await convenioService.createConvenio(convenioData);
            mostrarExito('Convenio creado exitosamente');
        }

        modalConvenio.hide();
        await cargarConvenios();
    } catch (error) {
        console.error('Error al guardar convenio:', error);
        mostrarError('Error al guardar el convenio');
    } finally {
        btnGuardarConvenio.disabled = false;
        btnGuardarConvenio.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Convenio';
    }
}

/**
 * Eliminar convenio
 */
async function eliminarConvenio(id) {
    if (!confirm('¿Estás seguro de eliminar este convenio?')) return;

    try {
        await convenioService.deleteConvenio(id);
        mostrarExito('Convenio eliminado exitosamente');
        await cargarConvenios();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarError('Error al eliminar el convenio');
    }
}

/**
 * Exportar a Excel
 */
function exportarExcel() {
    // TODO: Implementar exportación
    alert('Funcionalidad de exportación próximamente');
}

/**
 * Procesar archivo Excel
 */
function procesarArchivoExcel(event) {
    // TODO: Implementar procesamiento de Excel
    alert('Funcionalidad de carga masiva próximamente');
}

/**
 * Limpiar archivo
 */
function limpiarArchivo() {
    archivoExcel.value = '';
    infoArchivo.style.display = 'none';
    vistaPrevia.style.display = 'none';
    btnConfirmarImportacion.style.display = 'none';
}

/**
 * Confirmar importación
 */
function confirmarImportacion() {
    // TODO: Implementar importación
    alert('Funcionalidad de importación próximamente');
}

/**
 * Descargar plantilla
 */
function descargarPlantilla() {
    // TODO: Implementar descarga de plantilla
    alert('Descarga de plantilla próximamente');
}

/**
 * Muestra mensaje de error
 */
function mostrarError(mensaje) {
    // Usar toasts de Bootstrap o alertas
    alert(mensaje);
}

/**
 * Muestra mensaje de éxito
 */
function mostrarExito(mensaje) {
    alert(mensaje);
}