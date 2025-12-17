import { convenioService } from '../api/convenios.service.js';
import { institucionService } from '../api/instituciones.service.js';

let conveniosData = [];
let conveniosFiltrados = [];
let convenioEditando = null;
let institucionesData = [];

// Elementos del DOM
const datos = document.getElementById('tabla-convenios');
const buscar = document.getElementById('buscar');
const btnNuevoConvenio = document.getElementById('btnNuevoConvenio');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const totalConvenios = document.getElementById('totalConvenios');
const conveniosActivos = document.getElementById('conveniosActivos');
const conveniosPorVencer = document.getElementById('conveniosPorVencer');
const conveniosVencidos = document.getElementById('conveniosVencidos');

// Filtros
const filtroEstado = document.getElementById('filtroEstado');
const filtroTipo = document.getElementById('filtroTipo');
const filtroInstitucion = document.getElementById('filtroInstitucion');

// Modales
let modalConvenio = null;
let modalDetalles = null;
let modalExito = null;
let modalError = null;

export async function Init() {
    console.log('🤝 Inicializando módulo de Convenios COMPLETO...');
    try {
        await esperarDOM();
        inicializarModales();
        await cargarInstituciones();
        await cargarConvenios();
        inicializarEventos();
        console.log('✅ Módulo de Convenios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function esperarDOM() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            setTimeout(resolve, 100);
        }
    });
}

function inicializarModales() {
    try {
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap no está disponible');
            return;
        }

        const modalConvenioEl = document.getElementById('modalConvenio');
        if (modalConvenioEl) modalConvenio = new bootstrap.Modal(modalConvenioEl);

        const modalDetallesEl = document.getElementById('modalDetalles');
        if (modalDetallesEl) modalDetalles = new bootstrap.Modal(modalDetallesEl);

        const modalExitoEl = document.getElementById('modalExito');
        if (modalExitoEl) modalExito = new bootstrap.Modal(modalExitoEl);

        const modalErrorEl = document.getElementById('modalError');
        if (modalErrorEl) modalError = new bootstrap.Modal(modalErrorEl);

        console.log('✅ Modales inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar modales:', error);
    }
}

async function cargarInstituciones() {
    try {
        institucionesData = await institucionService.getInstituciones();
        
        // Cargar en el selector del formulario
        const selectInstitucion = document.getElementById('nit_institucion');
        if (selectInstitucion) {
            selectInstitucion.innerHTML = '<option value="">Seleccione una institución...</option>';
            institucionesData.forEach(i => {
                selectInstitucion.innerHTML += `<option value="${i.nit_institucion}" data-nombre="${i.nombre_institucion}">${i.nombre_institucion}</option>`;
            });
        }
        
        // Cargar en filtros
        if (filtroInstitucion) {
            filtroInstitucion.innerHTML = '<option value="">Todas las instituciones</option>';
            institucionesData.forEach(i => {
                filtroInstitucion.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
            });
        }

        console.log(`✅ ${institucionesData.length} instituciones cargadas`);
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
    }
}

async function cargarConvenios() {
    try {
        mostrarCargando();
        conveniosData = await convenioService.getConvenios();
        conveniosFiltrados = [...conveniosData];
        renderizarTabla();
        actualizarEstadisticas();
        console.log(`✅ ${conveniosData.length} convenios cargados`);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar convenios', error.message);
    }
}

function renderizarTabla() {
    if (!datos) return;
    
    if (!conveniosFiltrados || conveniosFiltrados.length === 0) {
        datos.innerHTML = `
            <tr><td colspan="8" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">No se encontraron convenios</p>
            </td></tr>`;
        return;
    }

    datos.innerHTML = conveniosFiltrados.map((c, index) => {
        const estadoBadge = getEstadoBadge(c.estado_convenio);
        const fechaInicio = c.fecha_inicio ? formatearFecha(c.fecha_inicio) : 'N/A';
        const fechaFin = c.plazo_ejecucion ? formatearFecha(c.plazo_ejecucion) : 'N/A';
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${c.num_convenio || 'N/A'}</strong></td>
            <td>
                <i class="fas fa-building text-primary me-1"></i>
                ${c.nombre_institucion || 'N/A'}
            </td>
            <td><span class="badge bg-info">${c.tipo_convenio || 'N/A'}</span></td>
            <td>${fechaInicio}</td>
            <td>${fechaFin}</td>
            <td class="text-center">${estadoBadge}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.verDetallesConvenio(${c.id_convenio})" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="window.editarConvenio(${c.id_convenio})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarConvenio(${c.id_convenio})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function getEstadoBadge(estado) {
    const estados = {
        'Activo': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>',
        'Vencido': '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i>Vencido</span>',
        'Por vencer': '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Por vencer</span>',
        'Suspendido': '<span class="badge bg-secondary"><i class="fas fa-pause-circle me-1"></i>Suspendido</span>',
        'Convencional': '<span class="badge bg-primary"><i class="fas fa-handshake me-1"></i>Convencional</span>'
    };
    return estados[estado] || '<span class="badge bg-secondary">N/A</span>';
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        // Si ya es una fecha formateada, devolverla
        if (fecha.includes('/')) return fecha;
        
        // Si es formato ISO, convertir
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return fecha; // Si no es fecha válida, devolver original
        
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return fecha;
    }
}

function mostrarCargando() {
    if (datos) {
        datos.innerHTML = `
            <tr><td colspan="8" class="text-center py-5">
                <div class="spinner-border text-primary mb-3"></div>
                <p class="text-muted mb-0">Cargando convenios...</p>
            </td></tr>`;
    }
}

function actualizarEstadisticas() {
    if (totalConvenios) totalConvenios.textContent = conveniosFiltrados.length;
    
    const activos = conveniosFiltrados.filter(c => c.estado_convenio === 'Activo').length;
    const porVencer = conveniosFiltrados.filter(c => c.estado_convenio === 'Por vencer').length;
    const vencidos = conveniosFiltrados.filter(c => c.estado_convenio === 'Vencido').length;
    
    if (conveniosActivos) conveniosActivos.textContent = activos;
    if (conveniosPorVencer) conveniosPorVencer.textContent = porVencer;
    if (conveniosVencidos) conveniosVencidos.textContent = vencidos;
}

function aplicarFiltros() {
    const textoBusqueda = buscar?.value.toLowerCase() || '';
    const estadoSel = filtroEstado?.value || '';
    const tipoSel = filtroTipo?.value || '';
    const institucionSel = filtroInstitucion?.value || '';

    conveniosFiltrados = conveniosData.filter(c => {
        const cumpleBusqueda = !textoBusqueda || 
            (c.num_convenio && c.num_convenio.toLowerCase().includes(textoBusqueda)) ||
            (c.nombre_institucion && c.nombre_institucion.toLowerCase().includes(textoBusqueda)) ||
            (c.objetivo_convenio && c.objetivo_convenio.toLowerCase().includes(textoBusqueda)) ||
            (c.num_proceso && c.num_proceso.toLowerCase().includes(textoBusqueda));

        const cumpleEstado = !estadoSel || c.estado_convenio === estadoSel;
        const cumpleTipo = !tipoSel || c.tipo_convenio === tipoSel;
        const cumpleInstitucion = !institucionSel || c.nit_institucion === institucionSel;

        return cumpleBusqueda && cumpleEstado && cumpleTipo && cumpleInstitucion;
    });

    renderizarTabla();
    actualizarEstadisticas();
}

function limpiarFiltros() {
    if (buscar) buscar.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroTipo) filtroTipo.value = '';
    if (filtroInstitucion) filtroInstitucion.value = '';
    
    conveniosFiltrados = [...conveniosData];
    renderizarTabla();
    actualizarEstadisticas();
}

function inicializarEventos() {
    // Búsqueda y filtros
    buscar?.addEventListener('input', aplicarFiltros);
    filtroEstado?.addEventListener('change', aplicarFiltros);
    filtroTipo?.addEventListener('change', aplicarFiltros);
    filtroInstitucion?.addEventListener('change', aplicarFiltros);
    
    btnLimpiarFiltros?.addEventListener('click', limpiarFiltros);
    btnNuevoConvenio?.addEventListener('click', abrirModalNuevo);
    btnExportarExcel?.addEventListener('click', () => alert('Función de exportación próximamente'));

    // Guardar convenio
    const btnGuardar = document.getElementById('btnGuardarConvenio');
    btnGuardar?.addEventListener('click', guardarConvenio);

    // Auto-completar nombre institución al seleccionar NIT
    const selectInstitucion = document.getElementById('nit_institucion');
    selectInstitucion?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const nombreInstitucion = selectedOption.getAttribute('data-nombre');
        const inputNombre = document.getElementById('nombre_institucion');
        if (inputNombre && nombreInstitucion) {
            inputNombre.value = nombreInstitucion;
        }
    });

    // Funciones globales para los botones
    window.verDetallesConvenio = verDetallesConvenio;
    window.editarConvenio = editarConvenio;
    window.eliminarConvenio = eliminarConvenio;
}

function abrirModalNuevo() {
    convenioEditando = null;
    document.getElementById('modalConvenioTitle').innerHTML = '<i class="fas fa-handshake me-2"></i>Nuevo Convenio';
    document.getElementById('formConvenio')?.reset();
    modalConvenio?.show();
}

async function verDetallesConvenio(id) {
    try {
        const convenio = await convenioService.getConvenioById(id);
        const detallesContent = document.getElementById('detallesContent');
        
        if (detallesContent) {
            detallesContent.innerHTML = `
                <!-- Información Básica -->
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información Básica</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <strong>Tipo de Convenio:</strong>
                                <p class="mb-0">${convenio.tipo_convenio || 'N/A'}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Número de Convenio:</strong>
                                <p class="mb-0">${convenio.num_convenio || 'N/A'}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Número de Proceso:</strong>
                                <p class="mb-0">${convenio.num_proceso || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>NIT Institución:</strong>
                                <p class="mb-0">${convenio.nit_institucion || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Estado:</strong>
                                <p class="mb-0">${getEstadoBadge(convenio.estado_convenio)}</p>
                            </div>
                            <div class="col-12">
                                <strong>Institución:</strong>
                                <p class="mb-0">${convenio.nombre_institucion || 'N/A'}</p>
                            </div>
                            <div class="col-12">
                                <strong>Objetivo:</strong>
                                <p class="mb-0">${convenio.objetivo_convenio || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Tipo de Proceso:</strong>
                                <p class="mb-0">${convenio.tipo_proceso || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fechas y Plazos -->
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-calendar me-2"></i>Fechas y Plazos</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <strong>Fecha de Firma:</strong>
                                <p class="mb-0">${formatearFecha(convenio.fecha_firma) || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Fecha de Inicio:</strong>
                                <p class="mb-0">${formatearFecha(convenio.fecha_inicio) || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Fecha Publicación:</strong>
                                <p class="mb-0">${formatearFecha(convenio.fecha_publicacion_proceso) || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Duración:</strong>
                                <p class="mb-0">${convenio.duracion_convenio || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Plazo Ejecución:</strong>
                                <p class="mb-0">${convenio.plazo_ejecucion || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Prórroga:</strong>
                                <p class="mb-0">${convenio.prorroga || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Plazo Prórroga:</strong>
                                <p class="mb-0">${convenio.plazo_prorroga || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Duración Total:</strong>
                                <p class="mb-0">${convenio.duracion_total || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Información Administrativa -->
                <div class="card mb-3">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="fas fa-user-tie me-2"></i>Información Administrativa</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <strong>Supervisor:</strong>
                                <p class="mb-0">${convenio.supervisor || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Persona de Apoyo FPI:</strong>
                                <p class="mb-0">${convenio.persona_apoyo_fpi || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Tipo Convenio SENA:</strong>
                                <p class="mb-0">${convenio.tipo_convenio_sena || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Precio Estimado:</strong>
                                <p class="mb-0">${convenio.precio_estimado ? '$' + convenio.precio_estimado.toLocaleString('es-CO') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enlaces -->
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-link me-2"></i>Enlaces y Evidencias</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <strong>Enlace SECOP:</strong>
                                <p class="mb-0">
                                    ${convenio.enlace_secop ? `<a href="${convenio.enlace_secop}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-external-link-alt me-1"></i>Abrir SECOP</a>` : 'N/A'}
                                </p>
                            </div>
                            <div class="col-12">
                                <strong>Enlace a Evidencias:</strong>
                                <p class="mb-0">${convenio.enlace_evidencias || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        modalDetalles?.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error', 'No se pudieron cargar los detalles del convenio');
    }
}

async function editarConvenio(id) {
    try {
        convenioEditando = await convenioService.getConvenioById(id);
        document.getElementById('modalConvenioTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Convenio';
        
        // Llenar todos los campos del formulario
        document.getElementById('tipo_convenio').value = convenioEditando.tipo_convenio || '';
        document.getElementById('num_convenio').value = convenioEditando.num_convenio || '';
        document.getElementById('num_proceso').value = convenioEditando.num_proceso || '';
        document.getElementById('nit_institucion').value = convenioEditando.nit_institucion || '';
        document.getElementById('nombre_institucion').value = convenioEditando.nombre_institucion || '';
        document.getElementById('estado_convenio').value = convenioEditando.estado_convenio || '';
        document.getElementById('tipo_proceso').value = convenioEditando.tipo_proceso || '';
        document.getElementById('objetivo_convenio').value = convenioEditando.objetivo_convenio || '';
        
        // Fechas
        document.getElementById('fecha_firma').value = convenioEditando.fecha_firma || '';
        document.getElementById('fecha_inicio').value = convenioEditando.fecha_inicio || '';
        document.getElementById('fecha_publicacion_proceso').value = convenioEditando.fecha_publicacion_proceso || '';
        document.getElementById('duracion_convenio').value = convenioEditando.duracion_convenio || '';
        document.getElementById('plazo_ejecucion').value = convenioEditando.plazo_ejecucion || '';
        document.getElementById('prorroga').value = convenioEditando.prorroga || '';
        document.getElementById('plazo_prorroga').value = convenioEditando.plazo_prorroga || '';
        document.getElementById('duracion_total').value = convenioEditando.duracion_total || '';
        
        // Administrativo
        document.getElementById('supervisor').value = convenioEditando.supervisor || '';
        document.getElementById('persona_apoyo_fpi').value = convenioEditando.persona_apoyo_fpi || '';
        document.getElementById('tipo_convenio_sena').value = convenioEditando.tipo_convenio_sena || '';
        document.getElementById('precio_estimado').value = convenioEditando.precio_estimado || '';
        
        // Enlaces
        document.getElementById('enlace_secop').value = convenioEditando.enlace_secop || '';
        document.getElementById('enlace_evidencias').value = convenioEditando.enlace_evidencias || '';
        
        modalConvenio?.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error', 'No se pudo cargar el convenio');
    }
}

async function guardarConvenio() {
    try {
        // Recopilar todos los datos del formulario
        const data = {
            tipo_convenio: document.getElementById('tipo_convenio')?.value.trim(),
            num_convenio: document.getElementById('num_convenio')?.value.trim(),
            num_proceso: document.getElementById('num_proceso')?.value.trim() || null,
            nit_institucion: document.getElementById('nit_institucion')?.value.trim(),
            nombre_institucion: document.getElementById('nombre_institucion')?.value.trim(),
            estado_convenio: document.getElementById('estado_convenio')?.value.trim(),
            tipo_proceso: document.getElementById('tipo_proceso')?.value.trim() || null,
            objetivo_convenio: document.getElementById('objetivo_convenio')?.value.trim() || null,
            
            // Fechas
            fecha_firma: document.getElementById('fecha_firma')?.value || null,
            fecha_inicio: document.getElementById('fecha_inicio')?.value || null,
            fecha_publicacion_proceso: document.getElementById('fecha_publicacion_proceso')?.value || null,
            duracion_convenio: document.getElementById('duracion_convenio')?.value.trim() || null,
            plazo_ejecucion: document.getElementById('plazo_ejecucion')?.value || null,
            prorroga: document.getElementById('prorroga')?.value.trim() || null,
            plazo_prorroga: document.getElementById('plazo_prorroga')?.value.trim() || null,
            duracion_total: document.getElementById('duracion_total')?.value.trim() || null,
            
            // Administrativo
            supervisor: document.getElementById('supervisor')?.value.trim() || null,
            persona_apoyo_fpi: document.getElementById('persona_apoyo_fpi')?.value.trim() || null,
            tipo_convenio_sena: document.getElementById('tipo_convenio_sena')?.value.trim() || null,
            precio_estimado: parseFloat(document.getElementById('precio_estimado')?.value) || null,
            
            // Enlaces
            enlace_secop: document.getElementById('enlace_secop')?.value.trim() || null,
            enlace_evidencias: document.getElementById('enlace_evidencias')?.value.trim() || null
        };

        // Validar campos obligatorios
        if (!data.tipo_convenio || !data.num_convenio || !data.nit_institucion || 
            !data.nombre_institucion || !data.estado_convenio) {
            mostrarMensajeError('Campos incompletos', 'Por favor completa todos los campos obligatorios marcados con *');
            return;
        }

        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (convenioEditando) {
            await convenioService.updateConvenio(convenioEditando.id_convenio, data);
            mostrarMensajeExito('¡Convenio actualizado!', 'El convenio se ha actualizado correctamente');
        } else {
            await convenioService.createConvenio(data);
            mostrarMensajeExito('¡Convenio creado!', 'El convenio se ha creado correctamente');
        }

        modalConvenio?.hide();
        await cargarConvenios();
        
        document.getElementById('formConvenio')?.reset();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al guardar', error.message);
    } finally {
        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Convenio';
    }
}

async function eliminarConvenio(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este convenio?')) return;
    
    try {
        await convenioService.deleteConvenio(id);
        mostrarMensajeExito('¡Convenio eliminado!', 'El convenio se ha eliminado correctamente');
        await cargarConvenios();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al eliminar', error.message);
    }
}

function mostrarMensajeExito(titulo, mensaje) {
    document.getElementById('mensajeExitoTitulo').textContent = titulo;
    document.getElementById('mensajeExitoTexto').textContent = mensaje;
    modalExito?.show();
}

function mostrarMensajeError(titulo, mensaje) {
    document.getElementById('mensajeErrorTitulo').textContent = titulo;
    document.getElementById('mensajeErrorTexto').textContent = mensaje;
    modalError?.show();
}