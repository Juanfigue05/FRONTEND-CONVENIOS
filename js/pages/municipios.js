import { municipioService } from '../api/municipio.service.js';

let municipiosData = [];
let municipiosFiltrados = [];
let municipioEditando = null;

const buscar = document.getElementById('buscar');
const btnNuevoMunicipio = document.getElementById('btnNuevoMunicipio');
const tablaMunicipios = document.getElementById('tabla-municipios');
const totalMunicipios = document.getElementById('totalMunicipios');

const modalMunicipio = new bootstrap.Modal(document.getElementById('modalMunicipio'));
const formMunicipio = document.getElementById('formMunicipio');
const btnGuardarMunicipio = document.getElementById('btnGuardarMunicipio');

export async function Init() {
    console.log('📍 Inicializando módulo de Municipios...');
    try {
        await cargarMunicipios();
        inicializarEventos();
        console.log('✅ Módulo de Municipios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarMunicipios() {
    try {
        mostrarCargando();
        municipiosData = await municipioService.getMunicipios();
        municipiosFiltrados = [...municipiosData];
        renderizarTabla();
        actualizarTotal();
        console.log(`✅ ${municipiosData.length} municipios cargados`);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderizarTabla() {
    if (!municipiosFiltrados || municipiosFiltrados.length === 0) {
        tablaMunicipios.innerHTML = `
            <tr><td colspan="5" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron municipios</p>
            </td></tr>`;
        return;
    }

    tablaMunicipios.innerHTML = municipiosFiltrados.map((m, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${m.codigo_dane || 'N/A'}</strong></td>
            <td>
                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                ${m.nombre || 'N/A'}
            </td>
            <td class="text-center">
                ${m.estado 
                    ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>'
                    : '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i>Inactivo</span>'}
            </td>
            <td class="text-center">
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
    tablaMunicipios.innerHTML = `
        <tr><td colspan="5" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-3">Cargando municipios...</p>
        </td></tr>`;
}

function actualizarTotal() {
    totalMunicipios.textContent = municipiosFiltrados.length;
}

function aplicarFiltros() {
    const texto = buscar.value.toLowerCase();
    municipiosFiltrados = municipiosData.filter(m => {
        return !texto || 
            (m.nombre && m.nombre.toLowerCase().includes(texto)) ||
            (m.codigo_dane && m.codigo_dane.toLowerCase().includes(texto));
    });
    renderizarTabla();
    actualizarTotal();
}

function inicializarEventos() {
    buscar?.addEventListener('input', aplicarFiltros);
    btnNuevoMunicipio?.addEventListener('click', abrirModalNuevo);
    btnGuardarMunicipio?.addEventListener('click', guardarMunicipio);

    window.editarMunicipio = editarMunicipio;
    window.eliminarMunicipio = eliminarMunicipio;
}

function abrirModalNuevo() {
    municipioEditando = null;
    formMunicipio.reset();
    modalMunicipio.show();
}

async function editarMunicipio(id) {
    try {
        municipioEditando = await municipioService.getMunicipioById(id);
        
        document.getElementById('codigo_dane').value = municipioEditando.codigo_dane || '';
        document.getElementById('nombre').value = municipioEditando.nombre || '';
        
        modalMunicipio.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function guardarMunicipio() {
    try {
        const data = {
            codigo_dane: document.getElementById('codigo_dane').value,
            nombre: document.getElementById('nombre').value,
            estado: true
        };

        if (!data.codigo_dane || !data.nombre) {
            alert('Completa todos los campos');
            return;
        }

        btnGuardarMunicipio.disabled = true;
        btnGuardarMunicipio.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (municipioEditando) {
            await municipioService.updateMunicipio(municipioEditando.id_municipio, data);
            alert('Municipio actualizado');
        } else {
            await municipioService.createMunicipio(data);
            alert('Municipio creado');
        }

        modalMunicipio.hide();
        await cargarMunicipios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        btnGuardarMunicipio.disabled = false;
        btnGuardarMunicipio.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
}

async function eliminarMunicipio(id) {
    if (!confirm('¿Eliminar este municipio?')) return;
    try {
        await municipioService.deleteMunicipio(id);
        alert('Municipio eliminado');
        await cargarMunicipios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}
ENDOFFILE