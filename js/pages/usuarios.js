import { userService } from '../api/user.service.js';

let usuariosData = [];
let usuariosFiltrados = [];
let usuarioEditando = null;

// Referencias al DOM (se inicializan en Init después de cargar el HTML)
let buscar;
let btnNuevoUsuario;
let btnLimpiarFiltros;
let tablaUsuarios;
let totalUsuarios;
let filtroRol;
let filtroEstado;

let modalCreate = null;
let modalEdit = null;
let formCreate = null;
let formEdit = null;
let btnGuardarUsuario = null;
let btnEditUsuario = null;

/**
 * Espera breve hasta que el DOM de la página interna esté disponible.
 * Simple poll con small delay para páginas cargadas dinámicamente.
 */
function esperarDOM() {
    return new Promise(resolve => {
        const check = () => {
            // Usar el <tbody id="datos"> presente en la página como indicador de que la página está lista
            if (document.getElementById('datos')) return resolve();
            setTimeout(check, 50);
        };
        check();
    });
}

export async function Init() {
    console.log('⚙️👥 Inicializando módulo de Usuarios...');
    try {
        // Esperar que el DOM de la página cargada esté disponible
        await esperarDOM();

        // Inicializar referencias al DOM (IDs que están en users HTML)
        buscar = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const clearSearchButton = document.getElementById('clearSearchButton');
        btnNuevoUsuario = document.querySelector('[data-bs-target="#createUserModal"]');
        tablaUsuarios = document.getElementById('datos'); // tbody
        // En este HTML no hay totalUsuarios, filtroRol ni filtroEstado; algunos campos se llaman distinto
        const inputRolSelect = document.getElementById('inputRol');
        // Guardar referencias que no existían antes
        btnLimpiarFiltros = clearSearchButton || null;
        filtroRol = inputRolSelect || null;

        // Inicializar modales y formularios de forma segura (crear y editar)
        const createModalEl = document.getElementById('createUserModal');
        const editModalEl = document.getElementById('editUserModal');

        if (createModalEl && typeof bootstrap !== 'undefined') {
            try {
                modalCreate = new bootstrap.Modal(createModalEl);
            } catch (modalError) {
                console.error('Error al inicializar Bootstrap Modal (create):', modalError);
            }
        } else if (!createModalEl) {
            console.warn('Advertencia: #createUserModal no encontrado en el DOM');
        }

        // Modal de edición
        if (editModalEl && typeof bootstrap !== 'undefined') {
            try {
                modalEdit = new bootstrap.Modal(editModalEl);
            } catch (modalError) {
                console.error('Error al inicializar Bootstrap Modal (edit):', modalError);
            }
        }

        formCreate = document.getElementById('formSaveUser');
        btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
        // Guardar referencias de edición
        formEdit = document.getElementById('formEditUser');
        btnEditUsuario = document.getElementById('btnEditUsuario');

        await cargarRoles();
        await cargarUsuarios();

        // Listeners adicionales específicos de este HTML
        if (searchButton) searchButton.addEventListener('click', aplicarFiltros);
        if (btnLimpiarFiltros) btnLimpiarFiltros.addEventListener('click', () => { if (buscar) buscar.value = ''; aplicarFiltros(); });
        if (btnGuardarUsuario) btnGuardarUsuario.addEventListener('click', () => { if (typeof guardarUsuario === 'function') guardarUsuario(); });
        if (btnEditUsuario) btnEditUsuario.addEventListener('click', () => { if (typeof guardarEdicion === 'function') guardarEdicion(); });

        inicializarEventos();
        console.log('✅ Módulo de Usuarios inicializado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function cargarRoles() {
    try {
        const roles = await userService.getRoles();
        // En este HTML el select de crear es 'inputRol'
        const selectRol = document.getElementById('inputRol');

        if (selectRol) selectRol.innerHTML = '<option value="">Seleccione un rol</option>';

        roles.forEach(r => {
            if (selectRol) selectRol.innerHTML += `<option value="${r.id_rol}">${r.nombre_rol}</option>`;
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
    if (!tablaUsuarios) return;
    if (!usuariosFiltrados || usuariosFiltrados.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr><td colspan="5" class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No se encontraron usuarios</p>
            </td></tr>`;
        return;
    }

    tablaUsuarios.innerHTML = usuariosFiltrados.map((u, index) => `
        <tr>
            <td>
                <div>
                    <strong>${u.nombre_completo || 'N/A'}</strong>
                    <div class="small text-muted">${u.num_documento || ''}</div>
                </div>
            </td>
            <td>${u.nombre_rol || 'Sin rol'}</td>
            <td>${u.correo || 'N/A'}</td>
            <td class="text-center">
                ${u.estado 
                    ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Activo</span>'
                    : '<span class="badge bg-secondary"><i class="fas fa-times-circle me-1"></i>Inactivo</span>'}
            </td>
            <td class="text-end">
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
    if (!tablaUsuarios) return;
    tablaUsuarios.innerHTML = `
        <tr><td colspan="7" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-3">Cargando usuarios...</p>
        </td></tr>`;
}

function actualizarTotal() {
    if (totalUsuarios) totalUsuarios.textContent = usuariosFiltrados.length;
}

function aplicarFiltros() {
    const texto = buscar?.value?.toLowerCase() || '';
    const rolSel = filtroRol?.value || '';
    const estadoSel = filtroEstado?.value || '';

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
        if (buscar) buscar.value = '';
        if (filtroRol) filtroRol.value = '';
        if (filtroEstado) filtroEstado.value = '';
        aplicarFiltros();
    });
    // Abrir modal Crear
    btnNuevoUsuario?.addEventListener('click', abrirModalNuevo);
    // Los botones de guardar están ya vinculados en Init (btnGuardarUsuario, btnEditUsuario)

    window.editarUsuario = editarUsuario;
    window.eliminarUsuario = eliminarUsuario;
}

function abrirModalNuevo() {
    usuarioEditando = null;
    if (formCreate) formCreate.reset();
    // Limpiar campos específicos del modal create
    const inputs = ['inputNombre','inputCorreo','inputDocumento','inputRol','inputPassword','inputPasswordConfirm'];
    inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    modalCreate?.show();
}

async function editarUsuario(id) {
    try {
        usuarioEditando = await userService.getUsuarioById(id);
        
        document.getElementById('editIdUser').value = usuarioEditando.id_usuario || '';
        document.getElementById('editNombre').value = usuarioEditando.nombre_completo || '';
        document.getElementById('editCorreo').value = usuarioEditando.correo || '';
        document.getElementById('editDocumento').value = usuarioEditando.num_documento || '';
        document.getElementById('editEstado').value = usuarioEditando.estado ? 'true' : 'false';
        
        modalEdit?.show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar usuario para edición');
    }
}

async function guardarUsuario() {
    try {
        const nombre = document.getElementById('inputNombre')?.value?.trim() || '';
        const correo = document.getElementById('inputCorreo')?.value?.trim() || '';
        const documento = document.getElementById('inputDocumento')?.value?.trim() || '';
        const idRol = parseInt(document.getElementById('inputRol')?.value || 0);
        const password = document.getElementById('inputPassword')?.value || '';
        const passwordConfirm = document.getElementById('inputPasswordConfirm')?.value || '';

        if (!nombre || !correo || !documento || !idRol) {
            alert('Completa todos los campos obligatorios');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Las contraseñas no coinciden');
            return;
        }

        btnGuardarUsuario.disabled = true;
        btnGuardarUsuario.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        const data = {
            nombre_completo: nombre,
            correo: correo,
            num_documento: documento,
            id_rol: idRol,
            estado: true,
        };

        if (password) data.contra_encript = password;

        await userService.createUsuario(data);
        alert('Usuario creado');

        modalCreate?.hide();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        btnGuardarUsuario.disabled = false;
        btnGuardarUsuario.innerHTML = '<i class="bi bi-save"></i> Guardar Usuario';
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

async function guardarEdicion() {
    try {
        const id = parseInt(document.getElementById('editIdUser')?.value || 0);
        if (!id) return alert('ID de usuario inválido');

        const nombre = document.getElementById('editNombre')?.value?.trim() || '';
        const correo = document.getElementById('editCorreo')?.value?.trim() || '';
        const documento = document.getElementById('editDocumento')?.value?.trim() || '';
        const estadoVal = document.getElementById('editEstado')?.value;
        const estado = estadoVal === 'true' || estadoVal === true;

        if (!nombre || !correo || !documento) {
            alert('Completa todos los campos obligatorios');
            return;
        }

        btnEditUsuario.disabled = true;
        btnEditUsuario.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        const data = {
            nombre_completo: nombre,
            correo: correo,
            num_documento: documento,
            estado: estado
        };

        await userService.updateUsuario(id, data);
        alert('Usuario actualizado');
        modalEdit?.hide();
        await cargarUsuarios();
    } catch (error) {
        console.error('Error al editar usuario:', error);
        alert('Error al actualizar');
    } finally {
        if (btnEditUsuario) {
            btnEditUsuario.disabled = false;
            btnEditUsuario.innerHTML = 'Guardar cambios';
        }
    }
}