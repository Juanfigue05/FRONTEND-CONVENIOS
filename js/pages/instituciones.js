import { institucionService } from '../api/institucion_service.js';
import { municipioService } from '../api/municipio_service.js';

let institucionesData = [];
let institucionesFiltradas = [];
let institucionEditando = null;

const buscar = document.getElementById('buscar');
const btnNuevaInstitucion = document.getElementById('btnNuevaInstitucion');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const tablaInstituciones = document.getElementById('tabla-instituciones');
const totalInstituciones = document.getElementById('totalInstituciones');
const filtroMunicipio = document.getElementById('filtroMunicipio');
const filtroCaracter = document.getElementById('filtroCaracter');

const modalInstitucion = new bootstrap.Modal(document.getElementById('modalInstitucion'));
const modalInstitucionTitle = document.getElementById('modalInstitucionTitle');
const formInstitucion = document.getElementById('formInstitucion');
const btnGuardarInstitucion = document.getElementById('btnGuardarInstitucion');
const modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
const detallesContent = document.getElementById('detallesContent');

export async function Init() {
    console.log('🏛️ Inicializando módulo de Instituciones...');
    try {
        await cargarMunicipios();
        await cargarInstituciones();
        inicializarEventos();
        console.log('✅ Módulo de Instituciones inicializado');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
    }
}

async function cargarMunicipios() {
    try {
        const municipios = await municipioService.getMunicipios();
        const selectMunicipio = document.getElementById('id_municipio');
        
        filtroMunicipio.innerHTML = '<option value="">Todos</option>';
        selectMunicipio.innerHTML = '<option value="">Seleccione...</option>';
        
        municipios.forEach(m => {
            filtroMunicipio.innerHTML += `<option value="${m.id_municipio}">${m.nombre}</option>`;
            selectMunicipio.innerHTML += `<option value="${m.id_municipio}">${m.nombre}</option>`;
        });
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
        actualizarTotal();
        console.log(`✅ ${institucionesData.length} instituciones cargadas`);
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
    }
}

function renderizarTabla() {
    if (!institucionesFiltradas || institucionesFiltradas.length === 0) {
        tablaInstituciones.innerHTML = `
            <tr><td colspan="7" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron instituciones</p>
            </td></tr>`;
        return;
    }

    tablaInstituciones.innerHTML = institucionesFiltradas.map((inst, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${inst.nit_institucion || 'N/A'}</strong></td>
            <td>
                <i class="fas fa-building text-primary me-2"></i>
                ${inst.nombre_institucion || 'N/A'}
            </td>
            <td>${inst.nombre_municipio || 'N/A'}</td>
            <td>${inst.caracter_institucion || 'N/A'}</td>
            <td class="text-center">
                ${inst.estado 
                    ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>'
                    : '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i>Inactivo</span>'}
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.verDetallesInst('${inst.nit_institucion}')" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
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
    tablaInstituciones.innerHTML = `
        <tr><td colspan="7" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-3">Cargando instituciones...</p>
        </td></tr>`;
}

function actualizarTotal() {
    totalInstituciones.textContent = institucionesFiltradas.length;
}

function aplicarFiltros() {
    const textoBusqueda = buscar.value.toLowerCase();
    const municipioSel = filtroMunicipio.value;
    const caracterSel = filtroCaracter.value;

    institucionesFiltradas = institucionesData.filter(inst => {
        const cumpleBusqueda = !textoBusqueda || 
            (inst.nombre_institucion && inst.nombre_institucion.toLowerCase().includes(textoBusqueda)) ||
            (inst.nit_institucion && inst.nit_institucion.toLowerCase().includes(textoBusqueda)) ||
            (inst.nombre_municipio && inst.nombre_municipio.toLowerCase().includes(textoBusqueda));

        const cumpleMunicipio = !municipioSel || inst.id_municipio == municipioSel;
        const cumpleCaracter = !caracterSel || inst.caracter_institucion === caracterSel;

        return cumpleBusqueda && cumpleMunicipio && cumpleCaracter;
    });

    renderizarTabla();
    actualizarTotal();
}

function inicializarEventos() {
    buscar?.addEventListener('input', aplicarFiltros);
    filtroMunicipio?.addEventListener('change', aplicarFiltros);
    filtroCaracter?.addEventListener('change', aplicarFiltros);
    btnLimpiarFiltros?.addEventListener('click', () => {
        buscar.value = '';
        filtroMunicipio.value = '';
        filtroCaracter.value = '';
        aplicarFiltros();
    });
    btnNuevaInstitucion?.addEventListener('click', abrirModalNuevo);
    btnGuardarInstitucion?.addEventListener('click', guardarInstitucion);
    btnExportarExcel?.addEventListener('click', () => alert('Exportar próximamente'));

    window.verDetallesInst = verDetallesInst;
    window.editarInstitucion = editarInstitucion;
    window.eliminarInstitucion = eliminarInstitucion;
}

function abrirModalNuevo() {
    institucionEditando = null;
    modalInstitucionTitle.innerHTML = '<i class="fas fa-building me-2"></i>Nueva Institución';
    formInstitucion.reset();
    modalInstitucion.show();
}

async function verDetallesInst(nit) {
    try {
        const inst = await institucionService.getInstitucionByNit(nit);
        detallesContent.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><strong>NIT:</strong><p>${inst.nit_institucion}</p></div>
                <div class="col-md-6"><strong>Municipio:</strong><p>${inst.nombre_municipio || 'N/A'}</p></div>
                <div class="col-12"><strong>Nombre:</strong><p>${inst.nombre_institucion}</p></div>
                <div class="col-12"><strong>Dirección:</strong><p>${inst.direccion || 'N/A'}</p></div>
                <div class="col-md-6"><strong>Teléfono:</strong><p>${inst.telefono || 'N/A'}</p></div>
                <div class="col-md-6"><strong>Correo:</strong><p>${inst.correo || 'N/A'}</p></div>
                <div class="col-md-6"><strong>Carácter:</strong><p>${inst.caracter_institucion || 'N/A'}</p></div>
                <div class="col-md-6"><strong>Página Web:</strong><p>${inst.pagina_web ? `<a href="${inst.pagina_web}" target="_blank">Visitar</a>` : 'N/A'}</p></div>
            </div>`;
        modalDetalles.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function editarInstitucion(nit) {
    try {
        institucionEditando = await institucionService.getInstitucionByNit(nit);
        modalInstitucionTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Institución';
        
        document.getElementById('nit').value = institucionEditando.nit_institucion || '';
        document.getElementById('id_municipio').value = institucionEditando.id_municipio || '';
        document.getElementById('nombre').value = institucionEditando.nombre_institucion || '';
        document.getElementById('telefono').value = institucionEditando.telefono || '';
        document.getElementById('correo').value = institucionEditando.correo || '';
        document.getElementById('direccion').value = institucionEditando.direccion || '';
        document.getElementById('caracter').value = institucionEditando.caracter_institucion || '';
        document.getElementById('pagina_web').value = institucionEditando.pagina_web || '';
        
        modalInstitucion.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function guardarInstitucion() {
    try {
        const data = {
            nit_institucion: document.getElementById('nit').value,
            id_municipio: parseInt(document.getElementById('id_municipio').value),
            nombre_institucion: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            correo: document.getElementById('correo').value,
            direccion: document.getElementById('direccion').value,
            caracter_institucion: document.getElementById('caracter').value,
            pagina_web: document.getElementById('pagina_web').value,
            cant_convenios: 0,
            estado: true
        };

        if (!data.nit_institucion || !data.nombre_institucion || !data.id_municipio) {
            alert('Completa los campos obligatorios');
            return;
        }

        btnGuardarInstitucion.disabled = true;
        btnGuardarInstitucion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (institucionEditando) {
            await institucionService.updateInstitucion(institucionEditando.nit_institucion, data);
            alert('Institución actualizada');
        } else {
            await institucionService.createInstitucion(data);
            alert('Institución creada');
        }

        modalInstitucion.hide();
        await cargarInstituciones();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        btnGuardarInstitucion.disabled = false;
        btnGuardarInstitucion.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Institución';
    }
}

async function eliminarInstitucion(nit) {
    if (!confirm('¿Eliminar esta institución?')) return;
    try {
        await institucionService.deleteInstitucion(nit);
        alert('Institución eliminada');
        await cargarInstituciones();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}
ENDOFFILE