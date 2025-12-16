import { panelService } from "../api/panel_service.js";

/**
 * Renderiza las tarjetas de estadísticas en el dashboard
 * @param {object} resumen - Objeto con totales de cada entidad
 */
function renderEstadisticas(resumen) {
    const contenedor = document.getElementById('estadisticas-cards');
    
    if (!contenedor) {
        console.error('No se encontró el contenedor de estadísticas');
        return;
    }

    contenedor.innerHTML = `
        <div class="col-md-6 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-primary-subtle text-primary p-3">
                            <i class="bi bi-building fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Instituciones</h6>
                            <h3 class="mb-0 fw-bold">${resumen.totalInstituciones}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-success-subtle text-success p-3">
                            <i class="bi bi-file-earmark-text fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Convenios</h6>
                            <h3 class="mb-0 fw-bold">${resumen.totalConvenios}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-warning-subtle text-warning p-3">
                            <i class="bi bi-arrow-repeat fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Homologaciones</h6>
                            <h3 class="mb-0 fw-bold">${resumen.totalHomologaciones}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-info-subtle text-info p-3">
                            <i class="bi bi-people fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Usuarios</h6>
                            <h3 class="mb-0 fw-bold">${resumen.totalUsuarios}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Muestra mensaje de error en el panel
 * @param {string} mensaje - Mensaje de error a mostrar
 */
function mostrarError(mensaje) {
    const contenedor = document.getElementById('estadisticas-cards');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle"></i> ${mensaje}
                </div>
            </div>
        `;
    }
}

/**
 * Muestra indicador de carga
 */
function mostrarCargando() {
    const contenedor = document.getElementById('estadisticas-cards');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando estadísticas...</p>
            </div>
        `;
    }
}

/**
 * Inicializa la lógica del panel/dashboard.
 * Carga datos y muestra estadísticas generales.
 */
async function Init() {
    console.log('Inicializando panel.js');
    
    try {
        // Mostrar estado de carga
        mostrarCargando();

        // Obtener resumen del dashboard
        const resumen = await panelService.getResumenDashboard();
        console.log('Resumen del dashboard:', resumen);

        // Renderizar estadísticas
        renderEstadisticas(resumen);

    } catch (error) {
        console.error('Error al cargar el panel:', error);
        mostrarError('No se pudieron cargar las estadísticas del panel. Por favor recarga la página.');
    }
}

export { Init };