import { convenioService } from '../api/convenio.service.js';
import { institucionService } from '../api/institucion.service.js';

// Variables globales
let conveniosData = [];
let conveniosFiltrados = [];
let convenioEditando = null;

// Variables de paginación
let paginaActual = 1;
const conveniosPorPagina = 10;
let totalPaginas = 1;

// Elementos del DOM
const tbody = document.getElementById('datos');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const filterButton = document.getElementById('filterButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const btnUploadExcel = document.getElementById('btnUploadExcel');

/**
 * Inicializa el módulo
 */
export async function Init() {
    console.log('📋 Inicializando módulo de Convenios...');
    
    try {
        await cargarInstituciones();
        await cargarConvenios();
        inicializarEventos();
        console.log('✅ Módulo de Convenios inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar módulo:', error);
        mostrarError('Error al cargar el módulo de convenios');
    }
}

/**
 * Carga todas las instituciones para los selectores
 */
async function cargarInstituciones() {
    try {
        const instituciones = await institucionService.getInstituciones();
        
        // Llenar selector del modal de crear
        const selectCreate = document.getElementById('inputNitInstitucion');
        const selectEdit = document.getElementById('editNitInstitucion');
        const selectFilter = document.getElementById('filterNitInstitucion');
        
        if (selectCreate) {
            selectCreate.innerHTML = '<option value="">Seleccione una institución...</option>';
            instituciones.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.nit_institucion;
                option.textContent = `${inst.nombre_institucion} (${inst.nit_institucion})`;
                option.dataset.nombre = inst.nombre_institucion;
                selectCreate.appendChild(option);
            });
        }
        
        // Llenar selector del modal de editar
        if (selectEdit) {
            selectEdit.innerHTML = '<option value="">Seleccione una institución...</option>';
            instituciones.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.nit_institucion;
                option.textContent = `${inst.nombre_institucion} (${inst.nit_institucion})`;
                option.dataset.nombre = inst.nombre_institucion;
                selectEdit.appendChild(option);
            });
        }
        
        // Llenar selector de filtros
        if (selectFilter) {
            selectFilter.innerHTML = '<option value="">Todas las instituciones</option>';
            instituciones.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.nit_institucion;
                option.textContent = inst.nombre_institucion;
                selectFilter.appendChild(option);
            });
        }
        
        console.log(`✅ ${instituciones.length} instituciones cargadas`);
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
        mostrarError('No se pudieron cargar las instituciones');
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
        paginaActual = 1;
        calcularPaginacion();
        renderizarTabla();
        renderizarPaginacion();
        console.log(`✅ ${conveniosData.length} convenios cargados`);
    } catch (error) {
        console.error('Error al cargar convenios:', error);
        mostrarError('No se pudieron cargar los convenios');
    }
}

/**
 * Calcula el total de páginas
 */
function calcularPaginacion() {
    totalPaginas = Math.ceil(conveniosFiltrados.length / conveniosPorPagina);
    if (totalPaginas === 0) totalPaginas = 1;
}

/**
 * Obtiene los convenios de la página actual
 */
function obtenerConveniosPagina() {
    const inicio = (paginaActual - 1) * conveniosPorPagina;
    const fin = inicio + conveniosPorPagina;
    return conveniosFiltrados.slice(inicio, fin);
}

/**
 * Renderiza la tabla de convenios con paginación
 */
function renderizarTabla() {
    if (!conveniosFiltrados || conveniosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">No se encontraron convenios</p>
                </td>
            </tr>
        `;
        return;
    }

    const conveniosPagina = obtenerConveniosPagina();
    const inicio = (paginaActual - 1) * conveniosPorPagina;

    tbody.innerHTML = conveniosPagina.map((convenio, index) => `
        <tr>
            <td class="px-3">${inicio + index + 1}</td>
            <td class="px-3">
                <strong class="text-primary">${convenio.num_convenio || 'N/A'}</strong>
            </td>
            <td class="px-3">
                <div style="max-width: 200px;">
                    <strong>${convenio.nombre_institucion || 'N/A'}</strong>
                    <br><small class="text-muted">NIT: ${convenio.nit_institucion || 'N/A'}</small>
                </div>
            </td>
            <td class="px-3">${convenio.tipo_convenio || 'N/A'}</td>
            <td class="px-3">
                ${renderBadgeEstado(convenio.estado_convenio)}
            </td>
            <td class="px-3">${convenio.supervisor || 'N/A'}</td>
            <td class="px-3">${formatearFecha(convenio.fecha_firma)}</td>
            <td class="px-3 text-end">
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" 
                            onclick="window.verDetallesConvenio(${convenio.id_convenio})" 
                            title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" 
                            onclick="window.editarConvenioModal(${convenio.id_convenio})" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" 
                            onclick="window.confirmarEliminarConvenio(${convenio.id_convenio}, '${escaparTexto(convenio.num_convenio)}')" 
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Renderiza el badge de estado
 */
function renderBadgeEstado(estado) {
    if (!estado) return '<span class="badge bg-secondary">Sin estado</span>';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('convencional') && !estadoLower.includes('pre')) {
        return '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Convencional</span>';
    } else if (estadoLower.includes('preconvencional')) {
        return '<span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i>Preconvencional</span>';
    } else if (estadoLower.includes('liquidado')) {
        return '<span class="badge bg-info"><i class="bi bi-check2-all me-1"></i>Liquidado</span>';
    } else {
        return `<span class="badge bg-secondary">${estado}</span>`;
    }
}

/**
 * Formatea una fecha VARCHAR que puede contener texto
 */
function formatearFecha(fecha) {
    if (!fecha || fecha === 'N/A' || fecha.trim() === '') {
        return 'N/A';
    }
    
    // Si contiene letras (no es una fecha válida)
    if (/[a-zA-Z]/.test(fecha)) {
        return fecha;
    }
    
    // Intentar parsear la fecha
    try {
        // Formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
            const [anio, mes, dia] = fecha.split('-');
            return `${dia}/${mes}/${anio}`;
        }
        
        // Formato DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}/.test(fecha)) {
            return fecha;
        }
        
        return fecha;
    } catch (error) {
        return fecha;
    }
}

/**
 * Escapa texto para usar en HTML
 */
function escaparTexto(texto) {
    if (!texto) return '';
    return texto.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Renderiza los controles de paginación
 */
function renderizarPaginacion() {
    const paginacionContainer = document.getElementById('paginacion');
    if (!paginacionContainer) return;

    const inicio = (paginaActual - 1) * conveniosPorPagina + 1;
    const fin = Math.min(paginaActual * conveniosPorPagina, conveniosFiltrados.length);
    const total = conveniosFiltrados.length;

    let html = `
        <div class="d-flex justify-content-between align-items-center mt-4">
            <div class="text-muted">
                Mostrando <strong>${inicio}</strong> a <strong>${fin}</strong> de <strong>${total}</strong> convenios
            </div>
            <nav aria-label="Navegación de página">
                <ul class="pagination mb-0">
    `;

    // Botón anterior
    html += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="window.irAPagina(${paginaActual - 1}); return false;">
                <i class="bi bi-chevron-left"></i> Anterior
            </a>
        </li>
    `;

    // Páginas numeradas
    const maxPaginas = 5;
    let inicioPaginas = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
    let finPaginas = Math.min(totalPaginas, inicioPaginas + maxPaginas - 1);
    
    if (finPaginas - inicioPaginas < maxPaginas - 1) {
        inicioPaginas = Math.max(1, finPaginas - maxPaginas + 1);
    }

    // Primera página
    if (inicioPaginas > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="window.irAPagina(1); return false;">1</a>
            </li>
        `;
        if (inicioPaginas > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Páginas del rango
    for (let i = inicioPaginas; i <= finPaginas; i++) {
        html += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="window.irAPagina(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Última página
    if (finPaginas < totalPaginas) {
        if (finPaginas < totalPaginas - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="window.irAPagina(${totalPaginas}); return false;">${totalPaginas}</a>
            </li>
        `;
    }

    // Botón siguiente
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="window.irAPagina(${paginaActual + 1}); return false;">
                Siguiente <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    html += `
                </ul>
            </nav>
        </div>
    `;

    paginacionContainer.innerHTML = html;
}

/**
 * Navegar a una página específica
 */
window.irAPagina = function(pagina) {
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaActual = pagina;
    renderizarTabla();
    renderizarPaginacion();
    
    // Scroll suave al inicio de la tabla
    document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Muestra el loading en la tabla
 */
function mostrarCargando() {
    tbody.innerHTML = `
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
 * Valida si una fecha VARCHAR es una fecha válida
 */
function esFechaValida(fecha) {
    if (!fecha || fecha === 'N/A') return false;
    
    // Si contiene letras, no es fecha válida
    if (/[a-zA-Z]/.test(fecha)) return false;
    
    // Intentar parsear
    const formatos = [
        /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/ // DD/MM/YYYY
    ];
    
    return formatos.some(formato => formato.test(fecha));
}

/**
 * Convierte fecha VARCHAR a objeto Date (si es válida)
 */
function convertirADate(fecha) {
    if (!esFechaValida(fecha)) return null;
    
    try {
        // Formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
            return new Date(fecha);
        }
        
        // Formato DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}/.test(fecha)) {
            const [dia, mes, anio] = fecha.split('/');
            return new Date(`${anio}-${mes}-${dia}`);
        }
    } catch (error) {
        return null;
    }
    
    return null;
}

/**
 * Aplica los filtros avanzados
 */
function aplicarFiltros() {
    const tipoConvenio = document.getElementById('filterTipoConvenio')?.value.toLowerCase() || '';
    const estadoConvenio = document.getElementById('filterEstadoConvenio')?.value || '';
    const nitInstitucion = document.getElementById('filterNitInstitucion')?.value || '';
    const nombreInstitucion = document.getElementById('filterNombreInstitucion')?.value.toLowerCase() || '';
    const tipoProceso = document.getElementById('filterTipoProceso')?.value.toLowerCase() || '';
    const tipoConvenioSena = document.getElementById('filterTipoConvenioSena')?.value.toLowerCase() || '';
    const supervisor = document.getElementById('filterSupervisor')?.value.toLowerCase() || '';
    const personaApoyo = document.getElementById('filterPersonaApoyo')?.value.toLowerCase() || '';
    const numProceso = document.getElementById('filterNumProceso')?.value.toLowerCase() || '';
    const objetivo = document.getElementById('filterObjetivo')?.value.toLowerCase() || '';
    
    // Filtros de fechas
    const fechaFirmaInicio = document.getElementById('filterFechaFirmaInicio')?.value || '';
    const fechaFirmaFin = document.getElementById('filterFechaFirmaFin')?.value || '';
    const fechaInicioInicio = document.getElementById('filterFechaInicioInicio')?.value || '';
    const fechaInicioFin = document.getElementById('filterFechaInicioFin')?.value || '';

    conveniosFiltrados = conveniosData.filter(convenio => {
        // Filtro tipo convenio
        if (tipoConvenio && !(convenio.tipo_convenio || '').toLowerCase().includes(tipoConvenio)) {
            return false;
        }

        // Filtro estado
        if (estadoConvenio && convenio.estado_convenio !== estadoConvenio) {
            return false;
        }

        // Filtro NIT
        if (nitInstitucion && convenio.nit_institucion !== nitInstitucion) {
            return false;
        }

        // Filtro nombre institución
        if (nombreInstitucion && !(convenio.nombre_institucion || '').toLowerCase().includes(nombreInstitucion)) {
            return false;
        }

        // Filtro tipo proceso
        if (tipoProceso && !(convenio.tipo_proceso || '').toLowerCase().includes(tipoProceso)) {
            return false;
        }

        // Filtro tipo convenio SENA
        if (tipoConvenioSena && !(convenio.tipo_convenio_sena || '').toLowerCase().includes(tipoConvenioSena)) {
            return false;
        }

        // Filtro supervisor
        if (supervisor && !(convenio.supervisor || '').toLowerCase().includes(supervisor)) {
            return false;
        }

        // Filtro persona apoyo
        if (personaApoyo && !(convenio.persona_apoyo_fpi || '').toLowerCase().includes(personaApoyo)) {
            return false;
        }

        // Filtro número proceso
        if (numProceso && !(convenio.num_proceso || '').toLowerCase().includes(numProceso)) {
            return false;
        }

        // Filtro objetivo
        if (objetivo && !(convenio.objetivo_convenio || '').toLowerCase().includes(objetivo)) {
            return false;
        }

        // Filtro de rango de fechas de firma
        if (fechaFirmaInicio || fechaFirmaFin) {
            const fechaFirma = convertirADate(convenio.fecha_firma);
            if (!fechaFirma) return false; // Si no es fecha válida, excluir
            
            if (fechaFirmaInicio) {
                const fechaInicio = new Date(fechaFirmaInicio);
                if (fechaFirma < fechaInicio) return false;
            }
            
            if (fechaFirmaFin) {
                const fechaFin = new Date(fechaFirmaFin);
                if (fechaFirma > fechaFin) return false;
            }
        }

        // Filtro de rango de fechas de inicio
        if (fechaInicioInicio || fechaInicioFin) {
            const fechaInicio = convertirADate(convenio.fecha_inicio);
            if (!fechaInicio) return false; // Si no es fecha válida, excluir
            
            if (fechaInicioInicio) {
                const fechaIni = new Date(fechaInicioInicio);
                if (fechaInicio < fechaIni) return false;
            }
            
            if (fechaInicioFin) {
                const fechaFn = new Date(fechaInicioFin);
                if (fechaInicio > fechaFn) return false;
            }
        }

        return true;
    });

    paginaActual = 1;
    calcularPaginacion();
    renderizarTabla();
    renderizarPaginacion();
    
    // Cerrar modal de filtros
    const modalFiltros = bootstrap.Modal.getInstance(document.getElementById('filtersConvenioModal'));
    modalFiltros?.hide();
}

/**
 * Buscar por número de convenio
 */
function buscarConvenio() {
    const termino = searchInput?.value.trim().toLowerCase() || '';
    
    if (termino === '') {
        conveniosFiltrados = [...conveniosData];
    } else {
        conveniosFiltrados = conveniosData.filter(convenio => 
            (convenio.num_convenio || '').toLowerCase().includes(termino)
        );
    }

    paginaActual = 1;
    calcularPaginacion();
    renderizarTabla();
    renderizarPaginacion();
}

/**
 * Limpiar búsqueda y filtros
 */
function limpiarBusqueda() {
    if (searchInput) searchInput.value = '';
    conveniosFiltrados = [...conveniosData];
    paginaActual = 1;
    calcularPaginacion();
    renderizarTabla();
    renderizarPaginacion();
}

/**
 * Limpiar todos los filtros del modal
 */
function limpiarFiltrosModal() {
    document.getElementById('filterTipoConvenio').value = '';
    document.getElementById('filterEstadoConvenio').value = '';
    document.getElementById('filterNitInstitucion').value = '';
    document.getElementById('filterNombreInstitucion').value = '';
    document.getElementById('filterTipoProceso').value = '';
    document.getElementById('filterTipoConvenioSena').value = '';
    document.getElementById('filterSupervisor').value = '';
    document.getElementById('filterPersonaApoyo').value = '';
    document.getElementById('filterNumProceso').value = '';
    document.getElementById('filterObjetivo').value = '';
    document.getElementById('filterFechaFirmaInicio').value = '';
    document.getElementById('filterFechaFirmaFin').value = '';
    document.getElementById('filterFechaInicioInicio').value = '';
    document.getElementById('filterFechaInicioFin').value = '';
}

/**
 * Calcular duración entre dos fechas
 */
function calcularDuracion(fechaInicio, fechaFin) {
    const inicio = convertirADate(fechaInicio);
    const fin = convertirADate(fechaFin);
    
    if (!inicio || !fin) return 'N/A';
    
    const diffTime = Math.abs(fin - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const meses = Math.floor(diffDays / 30);
    const dias = diffDays % 30;
    
    if (meses > 0 && dias > 0) {
        return `${meses} mes${meses > 1 ? 'es' : ''} ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (meses > 0) {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
    } else {
        return `${dias} día${dias > 1 ? 's' : ''}`;
    }
}

/**
 * Inicializa los eventos
 */
function inicializarEventos() {
    // Búsqueda
    searchButton?.addEventListener('click', buscarConvenio);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarConvenio();
    });
    clearSearchButton?.addEventListener('click', limpiarBusqueda);

    // Filtros
    filterButton?.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('filtersConvenioModal'));
        modal.show();
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', aplicarFiltros);
    document.getElementById('clearFiltersModalBtn')?.addEventListener('click', limpiarFiltrosModal);

    // Guardar convenio
    document.getElementById('btnGuardarConvenio')?.addEventListener('click', guardarConvenio);
    document.getElementById('btnEditConvenio')?.addEventListener('click', editarConvenio);

    // Cambio de institución en modal crear
    document.getElementById('inputNitInstitucion')?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const nombreInput = document.getElementById('inputNombreInstitucion');
        if (nombreInput) {
            nombreInput.value = selectedOption.dataset.nombre || '';
        }
    });

    // Cambio de institución en modal editar
    document.getElementById('editNitInstitucion')?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const nombreInput = document.getElementById('editNombreInstitucion');
        if (nombreInput) {
            nombreInput.value = selectedOption.dataset.nombre || '';
        }
    });

    // Calcular duración automática en modal crear
    const inputFechaInicio = document.getElementById('inputFechaInicio');
    const inputPlazoEjecucion = document.getElementById('inputPlazoEjecucion');
    const inputDuracionConvenio = document.getElementById('inputDuracionConvenio');

    [inputFechaInicio, inputPlazoEjecucion].forEach(input => {
        input?.addEventListener('change', () => {
            const inicio = inputFechaInicio?.value;
            const fin = inputPlazoEjecucion?.value;
            if (inicio && fin && inputDuracionConvenio) {
                inputDuracionConvenio.value = calcularDuracion(inicio, fin);
            }
        });
    });

    // Calcular duración automática en modal editar
    const editFechaInicio = document.getElementById('editFechaInicio');
    const editPlazoEjecucion = document.getElementById('editPlazoEjecucion');
    const editDuracionConvenio = document.getElementById('editDuracionConvenio');

    [editFechaInicio, editPlazoEjecucion].forEach(input => {
        input?.addEventListener('change', () => {
            const inicio = editFechaInicio?.value;
            const fin = editPlazoEjecucion?.value;
            if (inicio && fin && editDuracionConvenio) {
                editDuracionConvenio.value = calcularDuracion(inicio, fin);
            }
        });
    });

    // Exponer funciones globalmente
    window.verDetallesConvenio = verDetallesConvenio;
    window.editarConvenioModal = editarConvenioModal;
    window.confirmarEliminarConvenio = confirmarEliminarConvenio;
}

/**
 * Ver detalles de un convenio
 */
async function verDetallesConvenio(id) {
    try {
        const convenio = await convenioService.getConvenioById(id);
        
        // Aquí puedes implementar un modal de detalles o abrir una página
        console.log('Detalles del convenio:', convenio);
        alert('Funcionalidad de detalles próximamente');
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarError('No se pudieron cargar los detalles');
    }
}

/**
 * Editar convenio
 */
async function editarConvenioModal(id) {
    try {
        convenioEditando = await convenioService.getConvenioById(id);
        
        // Llenar formulario de edición
        document.getElementById('editIdConvenio').value = convenioEditando.id_convenio;
        document.getElementById('editTipoConvenio').value = convenioEditando.tipo_convenio || '';
        document.getElementById('editNumConvenio').value = convenioEditando.num_convenio || '';
        document.getElementById('editNitInstitucion').value = convenioEditando.nit_institucion || '';
        document.getElementById('editNombreInstitucion').value = convenioEditando.nombre_institucion || '';
        document.getElementById('editNumProceso').value = convenioEditando.num_proceso || '';
        document.getElementById('editEstadoConvenio').value = convenioEditando.estado_convenio || '';
        document.getElementById('editObjetivoConvenio').value = convenioEditando.objetivo_convenio || '';
        document.getElementById('editTipoProceso').value = convenioEditando.tipo_proceso || '';
        document.getElementById('editTipoConvenioSena').value = convenioEditando.tipo_convenio_sena || '';
        document.getElementById('editFechaFirma').value = convenioEditando.fecha_firma || '';
        document.getElementById('editFechaInicio').value = convenioEditando.fecha_inicio || '';
        document.getElementById('editDuracionConvenio').value = convenioEditando.duracion_convenio || '';
        document.getElementById('editPlazoEjecucion').value = convenioEditando.plazo_ejecucion || '';
        document.getElementById('editProrroga').value = convenioEditando.prorroga || '';
        document.getElementById('editPlazoProrroga').value = convenioEditando.plazo_prorroga || '';
        document.getElementById('editDuracionTotal').value = convenioEditando.duracion_total || '';
        document.getElementById('editSupervisor').value = convenioEditando.supervisor || '';
        document.getElementById('editPersonaApoyoFpi').value = convenioEditando.persona_apoyo_fpi || '';
        document.getElementById('editPrecioEstimado').value = convenioEditando.precio_estimado || '';
        document.getElementById('editFechaPublicacionProceso').value = convenioEditando.fecha_publicacion_proceso || '';
        document.getElementById('editEnlaceSecop').value = convenioEditando.enlace_secop || '';
        document.getElementById('editEnlaceEvidencias').value = convenioEditando.enlace_evidencias || '';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editConvenioModal'));
        modal.show();
    } catch (error) {
        console.error('Error al cargar convenio:', error);
        mostrarError('No se pudo cargar el convenio');
    }
}

/**
 * Guardar nuevo convenio
 */
async function guardarConvenio() {
    try {
        const convenioData = {
            tipo_convenio: document.getElementById('inputTipoConvenio').value,
            num_convenio: document.getElementById('inputNumConvenio').value,
            nit_institucion: document.getElementById('inputNitInstitucion').value,
            nombre_institucion: document.getElementById('inputNombreInstitucion').value,
            num_proceso: document.getElementById('inputNumProceso').value || null,
            estado_convenio: document.getElementById('inputEstadoConvenio').value,
            objetivo_convenio: document.getElementById('inputObjetivoConvenio').value || null,
            tipo_proceso: document.getElementById('inputTipoProceso').value || null,
            tipo_convenio_sena: document.getElementById('inputTipoConvenioSena').value || null,
            fecha_firma: document.getElementById('inputFechaFirma').value || null,
            fecha_inicio: document.getElementById('inputFechaInicio').value || null,
            duracion_convenio: document.getElementById('inputDuracionConvenio').value || null,
            plazo_ejecucion: document.getElementById('inputPlazoEjecucion').value || null,
            prorroga: document.getElementById('inputProrroga').value || 'N/A',
            plazo_prorroga: document.getElementById('inputPlazoProrroga').value || 'N/A',
            duracion_total: document.getElementById('inputDuracionTotal').value || null,
            supervisor: document.getElementById('inputSupervisor').value || null,
            persona_apoyo_fpi: document.getElementById('inputPersonaApoyoFpi').value || null,
            precio_estimado: parseFloat(document.getElementById('inputPrecioEstimado').value) || null,
            fecha_publicacion_proceso: document.getElementById('inputFechaPublicacionProceso').value || null,
            enlace_secop: document.getElementById('inputEnlaceSecop').value || null,
            enlace_evidencias: document.getElementById('inputEnlaceEvidencias').value || null
        };

        // Validar campos requeridos
        if (!convenioData.tipo_convenio || !convenioData.num_convenio || 
            !convenioData.nit_institucion || !convenioData.estado_convenio) {
            mostrarError('Por favor completa todos los campos obligatorios marcados con *');
            return;
        }

        // Mostrar loading
        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

        await convenioService.createConvenio(convenioData);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createConvenioModal'));
        modal.hide();
        
        // Mostrar éxito
        mostrarExito('Convenio creado exitosamente');
        
        // Recargar convenios
        await cargarConvenios();
    } catch (error) {
        console.error('Error al guardar convenio:', error);
        mostrarError(error.message || 'Error al guardar el convenio');
    } finally {
        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="bi bi-save"></i> Guardar Convenio';
    }
}

/**
 * Editar convenio existente
 */
async function editarConvenio() {
    try {
        const idConvenio = document.getElementById('editIdConvenio').value;
        
        const convenioData = {
            tipo_convenio: document.getElementById('editTipoConvenio').value,
            num_convenio: document.getElementById('editNumConvenio').value,
            nit_institucion: document.getElementById('editNitInstitucion').value,
            nombre_institucion: document.getElementById('editNombreInstitucion').value,
            num_proceso: document.getElementById('editNumProceso').value || null,
            estado_convenio: document.getElementById('editEstadoConvenio').value,
            objetivo_convenio: document.getElementById('editObjetivoConvenio').value || null,
            tipo_proceso: document.getElementById('editTipoProceso').value || null,
            tipo_convenio_sena: document.getElementById('editTipoConvenioSena').value || null,
            fecha_firma: document.getElementById('editFechaFirma').value || null,
            fecha_inicio: document.getElementById('editFechaInicio').value || null,
            duracion_convenio: document.getElementById('editDuracionConvenio').value || null,
            plazo_ejecucion: document.getElementById('editPlazoEjecucion').value || null,
            prorroga: document.getElementById('editProrroga').value || 'N/A',
            plazo_prorroga: document.getElementById('editPlazoProrroga').value || 'N/A',
            duracion_total: document.getElementById('editDuracionTotal').value || null,
            supervisor: document.getElementById('editSupervisor').value || null,
            persona_apoyo_fpi: document.getElementById('editPersonaApoyoFpi').value || null,
            precio_estimado: parseFloat(document.getElementById('editPrecioEstimado').value) || null,
            fecha_publicacion_proceso: document.getElementById('editFechaPublicacionProceso').value || null,
            enlace_secop: document.getElementById('editEnlaceSecop').value || null,
            enlace_evidencias: document.getElementById('editEnlaceEvidencias').value || null
        };

        // Mostrar loading
        const btnEditar = document.getElementById('btnEditConvenio');
        btnEditar.disabled = true;
        btnEditar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

        await convenioService.updateConvenio(idConvenio, convenioData);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editConvenioModal'));
        modal.hide();
        
        // Mostrar éxito
        mostrarExito('Convenio actualizado exitosamente');
        
        // Recargar convenios
        await cargarConvenios();
    } catch (error) {
        console.error('Error al editar convenio:', error);
        mostrarError(error.message || 'Error al actualizar el convenio');
    } finally {
        const btnEditar = document.getElementById('btnEditConvenio');
        btnEditar.disabled = false;
        btnEditar.innerHTML = '<i class="bi bi-save"></i> Guardar Cambios';
    }
}

/**
 * Confirmar eliminación de convenio
 */
window.confirmarEliminarConvenio = function(id, numConvenio) {
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    const mensaje = document.getElementById('deleteConfirmMessage');
    mensaje.textContent = `¿Estás seguro de que deseas eliminar el convenio ${numConvenio}? Esta acción no se puede deshacer.`;
    
    // Configurar botón de confirmar
    const btnConfirm = document.getElementById('btnConfirmDelete');
    btnConfirm.onclick = () => eliminarConvenio(id);
    
    modal.show();
};

/**
 * Eliminar convenio
 */
async function eliminarConvenio(id) {
    try {
        const btnConfirm = document.getElementById('btnConfirmDelete');
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<i class="bi bi-hourglass-split"></i> Eliminando...';

        await convenioService.deleteConvenio(id);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        // Mostrar éxito
        mostrarExito('Convenio eliminado exitosamente');
        
        // Recargar convenios
        await cargarConvenios();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarError(error.message || 'Error al eliminar el convenio');
    } finally {
        const btnConfirm = document.getElementById('btnConfirmDelete');
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
    }
}

/**
 * Muestra mensaje de error
 */
function mostrarError(mensaje) {
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('errorModalMessage').textContent = mensaje;
    modal.show();
}

/**
 * Muestra mensaje de éxito
 */
function mostrarExito(mensaje) {
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    document.getElementById('successModalMessage').textContent = mensaje;
    modal.show();
}