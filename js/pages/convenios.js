import { convenioService } from '../api/convenios.service.js';
import { institucionService } from '../api/instituciones.service.js';

let conveniosData = [];
let conveniosFiltrados = [];
let convenioEditando = null;

// Elementos del DOM
const datos = document.getElementById('tabla-convenios');
const buscar = document.getElementById('buscar');
const btnNuevoConvenio = document.getElementById('btnNuevoConvenio');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const totalConvenios = document.getElementById('totalConvenios');

// Filtros
const filtroEstado = document.getElementById('filtroEstado');
const filtroTipo = document.getElementById('filtroTipo');
const filtroInstitucion = document.getElementById('filtroInstitucion');

// Modales
const modalConvenio = new bootstrap.Modal(document.getElementById('modalConvenio'));
const modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));

export async function Init() {
    console.log('🤝 Inicializando módulo de Convenios...');
    try {
        await cargarInstituciones();
        await cargarConvenios();
        inicializarEventos();
        console.log('✅ Módulo de Convenios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarInstituciones() {
    try {
        const instituciones = await institucionService.getInstituciones();
        const selectInstitucion = document.getElementById('nit_institucion');
        
        if (selectInstitucion) {
            selectInstitucion.innerHTML = '<option value="">Seleccione...</option>';
            instituciones.forEach(i => {
                selectInstitucion.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
            });
        }
        
        // Cargar en filtros
        if (filtroInstitucion) {
            filtroInstitucion.innerHTML = '<option value="">Todas</option>';
            instituciones.forEach(i => {
                filtroInstitucion.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
            });
        }
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
        actualizarTotal();
        console.log(`✅ ${conveniosData.length} convenios cargados`);
    } catch (error) {
        console.error('Error:', error);
        mostrarError();
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
        const fechaInicio = c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-CO') : 'N/A';
        const fechaFin = c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-CO') : 'N/A';
        
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
                    <button class="btn btn-outline-primary" onclick="window.verDetallesConvenio(${c.id_convenio})" title="Ver">
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
        'Suspendido': '<span class="badge bg-secondary"><i class="fas fa-pause-circle me-1"></i>Suspendido</span>'
    };
    return estados[estado] || '<span class="badge bg-secondary">N/A</span>';
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

function mostrarError() {
    if (datos) {
        datos.innerHTML = `
            <tr><td colspan="8" class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-muted mb-0">Error al cargar convenios</p>
            </td></tr>`;
    }
}

function actualizarTotal() {
    if (totalConvenios) {
        totalConvenios.textContent = conveniosFiltrados.length;
    }
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
            (c.objetivo && c.objetivo.toLowerCase().includes(textoBusqueda));

        const cumpleEstado = !estadoSel || c.estado_convenio === estadoSel;
        const cumpleTipo = !tipoSel || c.tipo_convenio === tipoSel;
        const cumpleInstitucion = !institucionSel || c.nit_institucion === institucionSel;

        return cumpleBusqueda && cumpleEstado && cumpleTipo && cumpleInstitucion;
    });

    renderizarTabla();
    actualizarTotal();
}

function limpiarFiltros() {
    if (buscar) buscar.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroTipo) filtroTipo.value = '';
    if (filtroInstitucion) filtroInstitucion.value = '';
    
    conveniosFiltrados = [...conveniosData];
    renderizarTabla();
    actualizarTotal();
}

function inicializarEventos() {
    buscar?.addEventListener('input', aplicarFiltros);
    filtroEstado?.addEventListener('change', aplicarFiltros);
    filtroTipo?.addEventListener('change', aplicarFiltros);
    filtroInstitucion?.addEventListener('change', aplicarFiltros);
    
    btnLimpiarFiltros?.addEventListener('click', limpiarFiltros);
    btnNuevoConvenio?.addEventListener('click', abrirModalNuevo);
    btnExportarExcel?.addEventListener('click', () => alert('Función de exportación próximamente'));

    const btnGuardarConvenio = document.getElementById('btnGuardarConvenio');
    btnGuardarConvenio?.addEventListener('click', guardarConvenio);

    // Funciones globales
    window.verDetallesConvenio = verDetallesConvenio;
    window.editarConvenio = editarConvenio;
    window.eliminarConvenio = eliminarConvenio;
}

function abrirModalNuevo() {
    convenioEditando = null;
    document.getElementById('modalConvenioTitle').innerHTML = '<i class="fas fa-handshake me-2"></i>Nuevo Convenio';
    document.getElementById('formConvenio')?.reset();
    modalConvenio.show();
}

async function verDetallesConvenio(id) {
    try {
        const convenio = await convenioService.getConvenioById(id);
        const detallesContent = document.getElementById('detallesContent');
        
        if (detallesContent) {
            detallesContent.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6"><strong>Número:</strong><p>${convenio.num_convenio || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Estado:</strong><p>${convenio.estado_convenio || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Tipo:</strong><p>${convenio.tipo_convenio || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Institución:</strong><p>${convenio.nombre_institucion || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Fecha Inicio:</strong><p>${convenio.fecha_inicio ? new Date(convenio.fecha_inicio).toLocaleDateString('es-CO') : 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Fecha Fin:</strong><p>${convenio.fecha_fin ? new Date(convenio.fecha_fin).toLocaleDateString('es-CO') : 'N/A'}</p></div>
                    <div class="col-12"><strong>Objetivo:</strong><p>${convenio.objetivo || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Supervisor:</strong><p>${convenio.supervisor || 'N/A'}</p></div>
                    <div class="col-md-6"><strong>Valor:</strong><p>${convenio.valor ? `$${convenio.valor.toLocaleString('es-CO')}` : 'N/A'}</p></div>
                </div>`;
        }
        
        modalDetalles.show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar detalles del convenio');
    }
}

async function editarConvenio(id) {
    try {
        convenioEditando = await convenioService.getConvenioById(id);
        document.getElementById('modalConvenioTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Convenio';
        
        // Llenar formulario
        document.getElementById('num_convenio').value = convenioEditando.num_convenio || '';
        document.getElementById('nit_institucion').value = convenioEditando.nit_institucion || '';
        document.getElementById('tipo_convenio').value = convenioEditando.tipo_convenio || '';
        document.getElementById('estado_convenio').value = convenioEditando.estado_convenio || '';
        document.getElementById('fecha_inicio').value = convenioEditando.fecha_inicio || '';
        document.getElementById('fecha_fin').value = convenioEditando.fecha_fin || '';
        document.getElementById('objetivo').value = convenioEditando.objetivo || '';
        document.getElementById('supervisor').value = convenioEditando.supervisor || '';
        document.getElementById('valor').value = convenioEditando.valor || '';
        
        modalConvenio.show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el convenio');
    }
}

async function guardarConvenio() {
    try {
        const data = {
            num_convenio: document.getElementById('num_convenio')?.value,
            nit_institucion: document.getElementById('nit_institucion')?.value,
            tipo_convenio: document.getElementById('tipo_convenio')?.value,
            estado_convenio: document.getElementById('estado_convenio')?.value,
            fecha_inicio: document.getElementById('fecha_inicio')?.value,
            fecha_fin: document.getElementById('fecha_fin')?.value,
            objetivo: document.getElementById('objetivo')?.value,
            supervisor: document.getElementById('supervisor')?.value,
            valor: parseFloat(document.getElementById('valor')?.value) || 0
        };

        if (!data.num_convenio || !data.nit_institucion) {
            alert('Completa los campos obligatorios');
            return;
        }

        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (convenioEditando) {
            await convenioService.updateConvenio(convenioEditando.id_convenio, data);
            alert('Convenio actualizado');
        } else {
            await convenioService.createConvenio(data);
            alert('Convenio creado');
        }

        modalConvenio.hide();
        await cargarConvenios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        const btnGuardar = document.getElementById('btnGuardarConvenio');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
}

async function eliminarConvenio(id) {
    if (!confirm('¿Eliminar este convenio?')) return;
    try {
        await convenioService.deleteConvenio(id);
        alert('Convenio eliminado');
        await cargarConvenios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}