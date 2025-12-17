import { homologacionService } from '../api/homologacion.service.js';
import { institucionService } from '../api/instituciones.service.js';

let homologacionesData = [];
let homologacionesFiltradas = [];
let homologacionEditando = null;
let institucionesData = [];

// Elementos del DOM
const datos = document.getElementById('tabla-homologaciones');
const buscar = document.getElementById('buscar');
const btnNuevaHomologacion = document.getElementById('btnNuevaHomologacion');
const btnExportarHomologaciones = document.getElementById('btnExportarHomologaciones');
const btnLimpiarFiltrosHom = document.getElementById('btnLimpiarFiltrosHom');

// Estadísticas
const totalHomologaciones = document.getElementById('totalHomologaciones');
const totalProgramasSena = document.getElementById('totalProgramasSena');
const totalInstitucionesHom = document.getElementById('totalInstitucionesHom');
const totalCreditosHom = document.getElementById('totalCreditosHom');

// Filtros
const filtroNivel = document.getElementById('filtroNivel');
const filtroInstitucionHom = document.getElementById('filtroInstitucionHom');

// Modales
let modalHomologacion = null;
let modalDetallesHom = null;
let modalExitoHom = null;
let modalErrorHom = null;

export async function Init() {
    console.log('🎓 Inicializando módulo de Homologaciones COMPLETO...');
    try {
        await esperarDOM();
        inicializarModales();
        await cargarInstituciones();
        await cargarHomologaciones();
        inicializarEventos();
        console.log('✅ Módulo de Homologaciones inicializado');
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

        const modalHomologacionEl = document.getElementById('modalHomologacion');
        if (modalHomologacionEl) modalHomologacion = new bootstrap.Modal(modalHomologacionEl);

        const modalDetallesHomEl = document.getElementById('modalDetallesHom');
        if (modalDetallesHomEl) modalDetallesHom = new bootstrap.Modal(modalDetallesHomEl);

        const modalExitoHomEl = document.getElementById('modalExitoHom');
        if (modalExitoHomEl) modalExitoHom = new bootstrap.Modal(modalExitoHomEl);

        const modalErrorHomEl = document.getElementById('modalErrorHom');
        if (modalErrorHomEl) modalErrorHom = new bootstrap.Modal(modalErrorHomEl);

        console.log('✅ Modales inicializados correctamente');
    } catch (error) {
        console.error('Error al inicializar modales:', error);
    }
}

async function cargarInstituciones() {
    try {
        institucionesData = await institucionService.getInstituciones();
        
        // Cargar en el selector del formulario
        const selectInstitucion = document.getElementById('nit_institucion_destino');
        if (selectInstitucion) {
            selectInstitucion.innerHTML = '<option value="">Seleccione una institución...</option>';
            institucionesData.forEach(i => {
                selectInstitucion.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
            });
        }
        
        // Cargar en filtros
        if (filtroInstitucionHom) {
            filtroInstitucionHom.innerHTML = '<option value="">Todas las instituciones</option>';
            institucionesData.forEach(i => {
                filtroInstitucionHom.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
            });
        }

        console.log(`✅ ${institucionesData.length} instituciones cargadas`);
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
    }
}

async function cargarHomologaciones() {
    try {
        mostrarCargando();
        homologacionesData = await homologacionService.getHomologaciones();
        homologacionesFiltradas = [...homologacionesData];
        renderizarTabla();
        actualizarEstadisticas();
        console.log(`✅ ${homologacionesData.length} homologaciones cargadas`);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al cargar homologaciones', error.message);
    }
}

function renderizarTabla() {
    if (!datos) return;
    
    if (!homologacionesFiltradas || homologacionesFiltradas.length === 0) {
        datos.innerHTML = `
            <tr><td colspan="10" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">No se encontraron homologaciones</p>
            </td></tr>`;
        return;
    }

    datos.innerHTML = homologacionesFiltradas.map((h, index) => {
        const porcentaje = calcularPorcentaje(h.creditos_homologados, h.creditos_totales);
        const badgePorcentaje = getBadgePorcentaje(porcentaje);
        
        // Buscar nombre de la institución
        const institucion = institucionesData.find(i => i.nit_institucion === h.nit_institucion_destino);
        const nombreInstitucion = institucion ? institucion.nombre_institucion : 'N/A';
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><span class="badge bg-secondary">${h.cod_programa_sena || 'N/A'}</span></td>
            <td>
                <i class="fas fa-book text-primary me-1"></i>
                <strong>${h.nombre_programa_sena || 'N/A'}</strong>
            </td>
            <td>${nombreInstitucion}</td>
            <td>${h.programa_ies || 'N/A'}</td>
            <td><span class="badge bg-info">${h.nivel_programa || 'N/A'}</span></td>
            <td class="text-center"><span class="badge bg-success">${h.creditos_homologados || 0}</span></td>
            <td class="text-center"><span class="badge bg-primary">${h.creditos_totales || 0}</span></td>
            <td class="text-center">${badgePorcentaje}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.verDetallesHomologacion(${h.id_homologacion})" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="window.editarHomologacion(${h.id_homologacion})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarHomologacion(${h.id_homologacion})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function calcularPorcentaje(homologados, totales) {
    if (!totales || totales === 0) return 0;
    return Math.round((homologados / totales) * 100);
}

function getBadgePorcentaje(porcentaje) {
    let clase = 'bg-danger';
    if (porcentaje >= 70) clase = 'bg-success';
    else if (porcentaje >= 50) clase = 'bg-warning';
    
    return `<span class="badge ${clase}">${porcentaje}%</span>`;
}

function mostrarCargando() {
    if (datos) {
        datos.innerHTML = `
            <tr><td colspan="10" class="text-center py-5">
                <div class="spinner-border text-primary mb-3"></div>
                <p class="text-muted mb-0">Cargando homologaciones...</p>
            </td></tr>`;
    }
}

function actualizarEstadisticas() {
    if (totalHomologaciones) {
        totalHomologaciones.textContent = homologacionesFiltradas.length;
    }
    
    // Contar programas SENA únicos
    const programasUnicos = new Set(homologacionesFiltradas.map(h => h.cod_programa_sena));
    if (totalProgramasSena) {
        totalProgramasSena.textContent = programasUnicos.size;
    }
    
    // Contar instituciones únicas
    const institucionesUnicas = new Set(homologacionesFiltradas.map(h => h.nit_institucion_destino));
    if (totalInstitucionesHom) {
        totalInstitucionesHom.textContent = institucionesUnicas.size;
    }
    
    // Sumar créditos homologados
    const creditosTotales = homologacionesFiltradas.reduce((sum, h) => sum + (h.creditos_homologados || 0), 0);
    if (totalCreditosHom) {
        totalCreditosHom.textContent = creditosTotales;
    }
}

function aplicarFiltros() {
    const textoBusqueda = buscar?.value.toLowerCase() || '';
    const nivelSel = filtroNivel?.value || '';
    const institucionSel = filtroInstitucionHom?.value || '';

    homologacionesFiltradas = homologacionesData.filter(h => {
        const cumpleBusqueda = !textoBusqueda || 
            (h.cod_programa_sena && h.cod_programa_sena.toLowerCase().includes(textoBusqueda)) ||
            (h.nombre_programa_sena && h.nombre_programa_sena.toLowerCase().includes(textoBusqueda)) ||
            (h.programa_ies && h.programa_ies.toLowerCase().includes(textoBusqueda));

        const cumpleNivel = !nivelSel || h.nivel_programa === nivelSel;
        const cumpleInstitucion = !institucionSel || h.nit_institucion_destino === institucionSel;

        return cumpleBusqueda && cumpleNivel && cumpleInstitucion;
    });

    renderizarTabla();
    actualizarEstadisticas();
}

function limpiarFiltros() {
    if (buscar) buscar.value = '';
    if (filtroNivel) filtroNivel.value = '';
    if (filtroInstitucionHom) filtroInstitucionHom.value = '';
    
    homologacionesFiltradas = [...homologacionesData];
    renderizarTabla();
    actualizarEstadisticas();
}

function inicializarEventos() {
    // Búsqueda y filtros
    buscar?.addEventListener('input', aplicarFiltros);
    filtroNivel?.addEventListener('change', aplicarFiltros);
    filtroInstitucionHom?.addEventListener('change', aplicarFiltros);
    
    btnLimpiarFiltrosHom?.addEventListener('click', limpiarFiltros);
    btnNuevaHomologacion?.addEventListener('click', abrirModalNuevo);
    btnExportarHomologaciones?.addEventListener('click', () => alert('Función de exportación próximamente'));

    // Guardar homologación
    const btnGuardar = document.getElementById('btnGuardarHomologacion');
    btnGuardar?.addEventListener('click', guardarHomologacion);

    // Calcular créditos pendientes y porcentaje automáticamente
    const creditosHomologados = document.getElementById('creditos_homologados');
    const creditosTotales = document.getElementById('creditos_totales');
    
    creditosHomologados?.addEventListener('input', calcularCreditosPendientes);
    creditosTotales?.addEventListener('input', calcularCreditosPendientes);

    // Funciones globales
    window.verDetallesHomologacion = verDetallesHomologacion;
    window.editarHomologacion = editarHomologacion;
    window.eliminarHomologacion = eliminarHomologacion;
}

function calcularCreditosPendientes() {
    const homologados = parseInt(document.getElementById('creditos_homologados')?.value) || 0;
    const totales = parseInt(document.getElementById('creditos_totales')?.value) || 0;
    
    const pendientes = Math.max(0, totales - homologados);
    const porcentaje = calcularPorcentaje(homologados, totales);
    
    document.getElementById('creditos_pendientes').value = pendientes;
    document.getElementById('porcentaje_homologacion').value = porcentaje;
    
    // Actualizar barra de progreso
    const barra = document.getElementById('barraProgreso');
    const texto = document.getElementById('textoProgreso');
    
    if (barra && texto) {
        barra.style.width = `${porcentaje}%`;
        barra.setAttribute('aria-valuenow', porcentaje);
        texto.textContent = `${porcentaje}%`;
        
        // Cambiar color según porcentaje
        barra.className = 'progress-bar';
        if (porcentaje >= 70) barra.classList.add('bg-success');
        else if (porcentaje >= 50) barra.classList.add('bg-warning');
        else barra.classList.add('bg-danger');
    }
}

function abrirModalNuevo() {
    homologacionEditando = null;
    document.getElementById('modalHomologacionTitle').innerHTML = '<i class="fas fa-graduation-cap me-2"></i>Nueva Homologación';
    document.getElementById('formHomologacion')?.reset();
    
    // Resetear barra de progreso
    document.getElementById('barraProgreso').style.width = '0%';
    document.getElementById('textoProgreso').textContent = '0%';
    
    modalHomologacion?.show();
}

async function verDetallesHomologacion(id) {
    try {
        const h = await homologacionService.getHomologacionById(id);
        const detallesContent = document.getElementById('detallesHomologacionContent');
        
        const institucion = institucionesData.find(i => i.nit_institucion === h.nit_institucion_destino);
        const nombreInstitucion = institucion ? institucion.nombre_institucion : 'N/A';
        const porcentaje = calcularPorcentaje(h.creditos_homologados, h.creditos_totales);
        
        if (detallesContent) {
            detallesContent.innerHTML = `
                <!-- Programa SENA -->
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-school me-2"></i>Programa SENA</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <strong>Código:</strong>
                                <p class="mb-0"><span class="badge bg-secondary fs-6">${h.cod_programa_sena || 'N/A'}</span></p>
                            </div>
                            <div class="col-md-8">
                                <strong>Nombre del Programa:</strong>
                                <p class="mb-0">${h.nombre_programa_sena || 'N/A'}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Versión:</strong>
                                <p class="mb-0">${h.version_programa || 'N/A'}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Título:</strong>
                                <p class="mb-0">${h.titulo || 'N/A'}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Regional:</strong>
                                <p class="mb-0">${h.regional || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Institución Destino -->
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-building-columns me-2"></i>Institución Destino</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <strong>NIT:</strong>
                                <p class="mb-0">${h.nit_institucion_destino || 'N/A'}</p>
                            </div>
                            <div class="col-md-8">
                                <strong>Nombre:</strong>
                                <p class="mb-0">${nombreInstitucion}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Programa IES:</strong>
                                <p class="mb-0">${h.programa_ies || 'N/A'}</p>
                            </div>
                            <div class="col-md-3">
                                <strong>Nivel:</strong>
                                <p class="mb-0"><span class="badge bg-info">${h.nivel_programa || 'N/A'}</span></p>
                            </div>
                            <div class="col-md-3">
                                <strong>SNIES:</strong>
                                <p class="mb-0">${h.snies || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Modalidad:</strong>
                                <p class="mb-0">${h.modalidad || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Semestres:</strong>
                                <p class="mb-0">${h.semestres || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Créditos -->
                <div class="card mb-3">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="fas fa-calculator me-2"></i>Información de Créditos</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-3">
                            <div class="col-md-4 text-center">
                                <div class="card bg-success text-white">
                                    <div class="card-body">
                                        <h3 class="mb-0">${h.creditos_homologados || 0}</h3>
                                        <small>Créditos Homologados</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="card bg-primary text-white">
                                    <div class="card-body">
                                        <h3 class="mb-0">${h.creditos_totales || 0}</h3>
                                        <small>Créditos Totales</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 text-center">
                                <div class="card bg-danger text-white">
                                    <div class="card-body">
                                        <h3 class="mb-0">${h.creditos_pendientes || 0}</h3>
                                        <small>Créditos Pendientes</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="form-label small fw-bold">Porcentaje de Homologación:</label>
                            <div class="progress" style="height: 30px;">
                                <div class="progress-bar ${porcentaje >= 70 ? 'bg-success' : porcentaje >= 50 ? 'bg-warning' : 'bg-danger'}" 
                                    role="progressbar" style="width: ${porcentaje}%;" aria-valuenow="${porcentaje}" 
                                    aria-valuemin="0" aria-valuemax="100">
                                    <span class="fs-6 fw-bold">${porcentaje}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enlace -->
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-link me-2"></i>Documentación</h6>
                    </div>
                    <div class="card-body">
                        <strong>Enlace a Documentos:</strong>
                        <p class="mb-0">
                            ${h.enlace ? `<a href="${h.enlace}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-external-link-alt me-1"></i>Abrir Documentación</a>` : 'N/A'}
                        </p>
                    </div>
                </div>
            `;
        }
        
        modalDetallesHom?.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error', 'No se pudieron cargar los detalles de la homologación');
    }
}

async function editarHomologacion(id) {
    try {
        homologacionEditando = await homologacionService.getHomologacionById(id);
        document.getElementById('modalHomologacionTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Homologación';
        
        // Llenar formulario
        document.getElementById('cod_programa_sena').value = homologacionEditando.cod_programa_sena || '';
        document.getElementById('nombre_programa_sena').value = homologacionEditando.nombre_programa_sena || '';
        document.getElementById('version_programa').value = homologacionEditando.version_programa || '';
        document.getElementById('titulo').value = homologacionEditando.titulo || '';
        document.getElementById('regional').value = homologacionEditando.regional || '';
        
        document.getElementById('nit_institucion_destino').value = homologacionEditando.nit_institucion_destino || '';
        document.getElementById('programa_ies').value = homologacionEditando.programa_ies || '';
        document.getElementById('nivel_programa').value = homologacionEditando.nivel_programa || '';
        document.getElementById('snies').value = homologacionEditando.snies || '';
        document.getElementById('modalidad').value = homologacionEditando.modalidad || '';
        
        document.getElementById('creditos_homologados').value = homologacionEditando.creditos_homologados || 0;
        document.getElementById('creditos_totales').value = homologacionEditando.creditos_totales || 0;
        document.getElementById('semestres').value = homologacionEditando.semestres || '';
        document.getElementById('enlace').value = homologacionEditando.enlace || '';
        
        // Calcular pendientes y porcentaje
        calcularCreditosPendientes();
        
        modalHomologacion?.show();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error', 'No se pudo cargar la homologación');
    }
}

async function guardarHomologacion() {
    try {
        const data = {
            nit_institucion_destino: document.getElementById('nit_institucion_destino')?.value.trim(),
            nombre_programa_sena: document.getElementById('nombre_programa_sena')?.value.trim(),
            cod_programa_sena: document.getElementById('cod_programa_sena')?.value.trim(),
            version_programa: parseInt(document.getElementById('version_programa')?.value) || 1,
            titulo: document.getElementById('titulo')?.value.trim(),
            programa_ies: document.getElementById('programa_ies')?.value.trim(),
            nivel_programa: document.getElementById('nivel_programa')?.value.trim(),
            snies: parseInt(document.getElementById('snies')?.value) || 0,
            creditos_homologados: parseInt(document.getElementById('creditos_homologados')?.value) || 0,
            creditos_totales: parseInt(document.getElementById('creditos_totales')?.value) || 0,
            creditos_pendientes: parseInt(document.getElementById('creditos_pendientes')?.value) || 0,
            modalidad: document.getElementById('modalidad')?.value.trim(),
            semestres: document.getElementById('semestres')?.value.trim(),
            regional: document.getElementById('regional')?.value.trim(),
            enlace: document.getElementById('enlace')?.value.trim()
        };

        // Validar campos obligatorios
        if (!data.nit_institucion_destino || !data.nombre_programa_sena || !data.cod_programa_sena || 
            !data.titulo || !data.programa_ies || !data.nivel_programa || !data.modalidad || 
            !data.regional || !data.enlace) {
            mostrarMensajeError('Campos incompletos', 'Por favor completa todos los campos obligatorios marcados con *');
            return;
        }

        const btnGuardar = document.getElementById('btnGuardarHomologacion');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (homologacionEditando) {
            await homologacionService.updateHomologacion(homologacionEditando.id_homologacion, data);
            mostrarMensajeExito('¡Homologación actualizada!', 'La homologación se ha actualizado correctamente');
        } else {
            await homologacionService.createHomologacion(data);
            mostrarMensajeExito('¡Homologación creada!', 'La homologación se ha creado correctamente');
        }

        modalHomologacion?.hide();
        await cargarHomologaciones();
        
        document.getElementById('formHomologacion')?.reset();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al guardar', error.message);
    } finally {
        const btnGuardar = document.getElementById('btnGuardarHomologacion');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Homologación';
    }
}

async function eliminarHomologacion(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta homologación?')) return;
    
    try {
        await homologacionService.deleteHomologacion(id);
        mostrarMensajeExito('¡Homologación eliminada!', 'La homologación se ha eliminado correctamente');
        await cargarHomologaciones();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al eliminar', error.message);
    }
}

function mostrarMensajeExito(titulo, mensaje) {
    document.getElementById('mensajeExitoHomTitulo').textContent = titulo;
    document.getElementById('mensajeExitoHomTexto').textContent = mensaje;
    modalExitoHom?.show();
}

function mostrarMensajeError(titulo, mensaje) {
    document.getElementById('mensajeErrorHomTitulo').textContent = titulo;
    document.getElementById('mensajeErrorHomTexto').textContent = mensaje;
    modalErrorHom?.show();
}