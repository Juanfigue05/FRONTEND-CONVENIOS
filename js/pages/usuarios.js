import { userService } from '../api/user.service.js';

let usuariosData = [];
let usuariosFiltrados = [];
let usuarioEditando = null;

const buscar = document.getElementById('buscar');
const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const tablaUsuarios = document.getElementById('tabla-usuarios');
const totalUsuarios = document.getElementById('totalUsuarios');
const filtroRol = document.getElementById('filtroRol');
const filtroEstado = document.getElementById('filtroEstado');

const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
const formUsuario = document.getElementById('formUsuario');
const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');

export async function Init() {
    console.log('⚙️👥 Inicializando módulo de Usuarios...');
    try {
        await cargarRoles();
        await cargarUsuarios();
        inicializarEventos();
        console.log('✅ Módulo de Usuarios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarRoles() {
    try {
        const roles = await userService.getRoles();
        const selectRol = document.getElementById('id_rol');
        
        filtroRol.innerHTML = '<option value="">Todos</option>';
        selectRol.innerHTML = '<option value="">Seleccione...</option>';
        
        roles.forEach(r => {
            filtroRol.innerHTML += `<option value="${r.id_rol}">${r.nombre_rol}</option>`;
            selectRol.innerHTML += `<option value="${r.id_rol}">${r.nombre_rol}</option>`;
        });
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

async function cargarUsuarios() {
    try {
        mostrarCargando();
        usuariosData = await userService.getUsuarios();
        usuariosFiltrados = [...usuariosData];
        renderizarTabla();
        actualizarTotal();
        console.log(`✅ ${usuariosData.length} usuarios cargados`);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderizarTabla() {
    if (!usuariosFiltrados || usuariosFiltrados.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr><td colspan="7" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron usuarios</p>
            </td></tr>`;
        return;
    }

    tablaUsuarios.innerHTML = usuariosFiltrados.map((u, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <i class="fas fa-user text-primary me-2"></i>
                ${u.nombre_completo || 'N/A'}
            </td>
            <td>${u.correo || 'N/A'}</td>
            <td>${u.num_documento || 'N/A'}</td>
            <td>
                <span class="badge bg-info">
                    ${u.nombre_rol || 'Sin rol'}
                </span>
            </td>
            <td class="text-center">
                ${u.estado 
                    ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>'
                    : '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i>Inactivo</span>'}
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-warning" onclick="window.editarUsuario(${u.id_usuario})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.eliminarUsuario(${u.id_usuario})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function mostrarCargando() {
    tablaUsuarios.innerHTML = `
        <tr><td colspan="7" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-3">Cargando usuarios...</p>
        </td></tr>`;
}

function actualizarTotal() {
    totalUsuarios.textContent = usuariosFiltrados.length;
}

function aplicarFiltros() {
    const texto = buscar.value.toLowerCase();
    const rolSel = filtroRol.value;
    const estadoSel = filtroEstado.value;

    usuariosFiltrados = usuariosData.filter(u => {
        const cumpleBusqueda = !texto || 
            (u.nombre_completo && u.nombre_completo.toLowerCase().includes(texto)) ||
            (u.correo && u.correo.toLowerCase().includes(texto)) ||
            (u.num_documento && u.num_documento.toLowerCase().includes(texto));

        const cumpleRol = !rolSel || u.id_rol == rolSel;
        const cumpleEstado = !estadoSel || u.estado.toString() === estadoSel;

        return cumpleBusqueda && cumpleRol && cumpleEstado;
    });

    renderizarTabla();
    actualizarTotal();
}

function inicializarEventos() {
    buscar?.addEventListener('input', aplicarFiltros);
    filtroRol?.addEventListener('change', aplicarFiltros);
    filtroEstado?.addEventListener('change', aplicarFiltros);
    btnLimpiarFiltros?.addEventListener('click', () => {
        buscar.value = '';
        filtroRol.value = '';
        filtroEstado.value = '';
        aplicarFiltros();
    });
    btnNuevoUsuario?.addEventListener('click', abrirModalNuevo);
    btnGuardarUsuario?.addEventListener('click', guardarUsuario);

    window.editarUsuario = editarUsuario;
    window.eliminarUsuario = eliminarUsuario;
}

function abrirModalNuevo() {
    usuarioEditando = null;
    formUsuario.reset();
    document.getElementById('estado').value = 'true';
    modalUsuario.show();
}

async function editarUsuario(id) {
    try {
        usuarioEditando = await userService.getUsuarioById(id);
        
        document.getElementById('nombre_completo').value = usuarioEditando.nombre_completo || '';
        document.getElementById('correo').value = usuarioEditando.correo || '';
        document.getElementById('num_documento').value = usuarioEditando.num_documento || '';
        document.getElementById('id_rol').value = usuarioEditando.id_rol || '';
        document.getElementById('estado').value = usuarioEditando.estado ? 'true' : 'false';
        document.getElementById('contra_encript').value = ''; // No mostrar contraseña
        
        modalUsuario.show();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function guardarUsuario() {
    try {
        const password = document.getElementById('contra_encript').value;
        
        const data = {
            nombre_completo: document.getElementById('nombre_completo').value,
            correo: document.getElementById('correo').value,
            num_documento: document.getElementById('num_documento').value,
            id_rol: parseInt(document.getElementById('id_rol').value),
            estado: document.getElementById('estado').value === 'true'
        };

        // Solo incluir contraseña si se proporcionó
        if (password) {
            data.contra_encript = password;
        }

        if (!data.nombre_completo || !data.correo || !data.num_documento || !data.id_rol) {
            alert('Completa todos los campos obligatorios');
            return;
        }

        // Si es nuevo usuario, contraseña es obligatoria
        if (!usuarioEditando && !password) {
            alert('La contraseña es obligatoria para usuarios nuevos');
            return;
        }

        btnGuardarUsuario.disabled = true;
        btnGuardarUsuario.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        if (usuarioEditando) {
            await userService.updateUsuario(usuarioEditando.id_usuario, data);
            alert('Usuario actualizado');
        } else {
            await userService.createUsuario(data);
            alert('Usuario creado');
        }

        modalUsuario.hide();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        btnGuardarUsuario.disabled = false;
        btnGuardarUsuario.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
}

async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
        await userService.deleteUsuario(id);
        alert('Usuario eliminado');
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}
ENDOFFILE