import { homologacionService } from '../api/homologacion.service.js';
import { institucionService } from '../api/institucion.service.js';

let homologacionesData = [];
let homologacionesFiltradas = [];
let homologacionEditando = null;

const buscar = document.getElementById('buscar');
const btnNuevaHomologacion = document.getElementById('btnNuevaHomologacion');
const tablaHomologaciones = document.getElementById('tabla-homologaciones');
const totalHomologaciones = document.getElementById('totalHomologaciones');

const modalHomologacion = new bootstrap.Modal(document.getElementById('modalHomologacion'));
const formHomologacion = document.getElementById('formHomologacion');
const btnGuardarHomologacion = document.getElementById('btnGuardarHomologacion');

export async function Init() {
    console.log('🎓 Inicializando módulo de Homologaciones...');
    try {
        await cargarInstituciones();
        await cargarHomologaciones();
        inicializarEventos();
        console.log('✅ Módulo de Homologaciones inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarInstituciones() {
    try {
        const instituciones = await institucionService.getInstituciones();
        const select = document.getElementById('institucion');
        select.innerHTML = '<option value="">Seleccione...</option>';
        instituciones.forEach(i => {
            select.innerHTML += `<option value="${i.nit_institucion}">${i.nombre_institucion}</option>`;
        });
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
        actualizarTotal();
        console.log(`✅ ${homologacionesData.length} homologaciones cargadas`);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderizarTabla() {
    if (!homologacionesFiltradas || homologacionesFiltradas.length === 0) {
        tablaHomologaciones.innerHTML = `
            <tr><td colspan="7" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron homologaciones</p>
            </td></tr>`;
        return;
    }

    tablaHomologaciones.innerHTML = homologacionesFiltradas.map((h, index) => {
        const porcentaje = h.creditos_totales > 0 
            ? ((h.creditos_homologados / h.creditos_totales) * 100).toFixed(1) 
            : 0;
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${h.codigo_programa_sena || 'N/A'}</strong></td>
            <td>${h.nombre_programa_sena || 'N/A'}</td>
            <td>${h.nombre_institucion || 'N/A'}</td>
            <td>${h.nombre_programa_destino || 'N/A'}</td>
            <td class="text-center">
                <strong>${h.creditos_homologados}/${h.creditos_totales}</strong><br>
                <span class="badge bg-${porcentaje >= 70 ? 'success' : porcentaje >= 40 ? 'warning' : 'secondary'}">
                    ${porcentaje}%
                </span>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
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

function mostrarCargando() {
    tablaHomologaciones.innerHTML = `
        <tr><td colspan="7" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-3">Cargando homologaciones...</p>
        </td></tr>`;
}

function actualizarTotal() {
    totalHomologaciones.textContent = homologacionesFiltradas.length;
}

function aplicarFiltros() {
    const texto = buscar.value.toLowerCase();
    homologacionesFiltradas = homologacionesData.filter(h => {
        return !texto || 
            (h.codigo_programa_sena && h.codigo_programa_sena.toLowerCase().includes(texto)) ||
            (h.nombre_programa_sena && h.nombre_programa_sena.toLowerCase().includes(texto)) ||
            (h.nombre_institucion && h.nombre_institucion.toLowerCase().includes(texto)) ||
            (h.nombre_programa_destino && h.nombre_programa_destino.toLowerCase().includes(texto));
    });
    renderizarTabla();
    actualizarTotal();
}

function inicializarEventos() {
    buscar?.addEventListener('input', aplicarFiltros);
    btnNuevaHomologacion?.addEventListener('click', abrirModalNuevo);
    btnGuardarHomologacion?.addEventListener('click', guardarHomologacion);

    // Calcular porcentaje automáticamente
    document.getElementById('creditosTotales')?.addEventListener('input', calcularPorcentaje);
    document.getElementById('creditosHomologados')?.addEventListener('input', calcularPorcentaje);

    window.editarHomologacion = editarHomologacion;
    window.eliminarHomologacion = eliminarHomologacion;
}

function calcularPorcentaje() {
    const totales = parseFloat(document.getElementById('creditosTotales').value) || 0;
    const homologados = parseFloat(document.getElementById('creditosHomologados').value) || 0;
    const porcentaje = totales > 0 ? ((homologados / totales) * 100).toFixed(1) : 0;
    document.getElementById('porcentaje').value = `${porcentaje}%`;
}

function abrirModalNuevo() {
    homologacionEditando = null;
    formHomologacion.reset();
    modalHomologacion.show();
}

async function editarHomologacion(id) {
    try {
        homologacionEditando = await homologacionService.getHomologacionById(id);
        
        document.getElementById('codigoSena').value = homologacionEditando.codigo_programa_sena || '';
        document.getElementById('nombreSena').value = homologacionEditando.nombre_programa_sena || '';
        document.getElementById('institucion').value = homologacionEditando.nit_institucion || '';
        document.getElementById('programaDestino').value = homologacionEditando.nombre_programa_destino || '';
        document.getElementById('creditosTotales').value = homologacionEditando.creditos_totales || '';
        document.getElementById('creditosHomologados').value = homologacionEditando.creditos_homologados || '';
        calcularPorcentaje();
        
        modalHomologacion.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function guardarHomologacion() {
    try {
        const data = {
            codigo_programa_sena: document.getElementById('codigoSena').value,
            nombre_programa_sena: document.getElementById('nombreSena').value,
            nit_institucion: document.getElementById('institucion').value,
            nombre_programa_destino: document.getElementById('programaDestino').value,
            creditos_totales: parseFloat(document.getElementById('creditosTotales').value),
            creditos_homologados: parseFloat(document.getElementById('creditosHomologados').value),
            estado: true
        };

        if (!data.codigo_programa_sena || !data.nombre_programa_sena || !data.nit_institucion) {
            alert('Completa los campos obligatorios');
            return;
        }

        btnGuardarHomologacion.disabled = true;
        btnGuardarHomologacion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (homologacionEditando) {
            await homologacionService.updateHomologacion(homologacionEditando.id_homologacion, data);
            alert('Homologación actualizada');
        } else {
            await homologacionService.createHomologacion(data);
            alert('Homologación creada');
        }

        modalHomologacion.hide();
        await cargarHomologaciones();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        btnGuardarHomologacion.disabled = false;
        btnGuardarHomologacion.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
}

async function eliminarHomologacion(id) {
    if (!confirm('¿Eliminar esta homologación?')) return;
    try {
        await homologacionService.deleteHomologacion(id);
        alert('Homologación eliminada');
        await cargarHomologaciones();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}
ENDOFFILE