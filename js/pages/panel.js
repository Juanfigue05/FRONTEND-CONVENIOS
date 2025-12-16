import { panelService } from "../api/panel.service.js";

// Variable global para el gráfico
let conveniosChart = null;

/**
 * Renderiza las tarjetas de estadísticas con animación y diseño mejorado
 */
function renderEstadisticas(resumen) {
    const contenedor = document.getElementById('estadisticas-cards');
    
    if (!contenedor) {
        console.error('No se encontró el contenedor de estadísticas');
        return;
    }

    // Calcular tendencias (simuladas - ajusta según tus datos reales)
    const tendencias = {
        instituciones: { valor: 12, positivo: true },
        convenios: { valor: 8, positivo: true },
        homologaciones: { valor: 5, positivo: false },
        usuarios: { valor: 15, positivo: true }
    };

    contenedor.innerHTML = `
        <div class="col-md-6 col-xl-3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon bg-primary-subtle">
                        <i class="fas fa-building-columns text-primary"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${resumen.totalInstituciones}</div>
                    <div class="stat-label">Instituciones Activas</div>
                </div>
                <div class="stat-footer">
                    <span class="stat-trend ${tendencias.instituciones.positivo ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${tendencias.instituciones.positivo ? 'up' : 'down'}"></i>
                        ${tendencias.instituciones.valor}%
                    </span>
                    <span class="text-muted ms-2">vs. mes anterior</span>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-xl-3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon bg-success-subtle">
                        <i class="fas fa-handshake text-success"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${resumen.totalConvenios}</div>
                    <div class="stat-label">Convenios Registrados</div>
                </div>
                <div class="stat-footer">
                    <span class="stat-trend ${tendencias.convenios.positivo ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${tendencias.convenios.positivo ? 'up' : 'down'}"></i>
                        ${tendencias.convenios.valor}%
                    </span>
                    <span class="text-muted ms-2">vs. mes anterior</span>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-xl-3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon bg-warning-subtle">
                        <i class="fas fa-graduation-cap text-warning"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${resumen.totalHomologaciones}</div>
                    <div class="stat-label">Homologaciones</div>
                </div>
                <div class="stat-footer">
                    <span class="stat-trend ${tendencias.homologaciones.positivo ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${tendencias.homologaciones.positivo ? 'up' : 'down'}"></i>
                        ${tendencias.homologaciones.valor}%
                    </span>
                    <span class="text-muted ms-2">vs. mes anterior</span>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-xl-3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon bg-info-subtle">
                        <i class="fas fa-users text-info"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${resumen.totalUsuarios}</div>
                    <div class="stat-label">Usuarios del Sistema</div>
                </div>
                <div class="stat-footer">
                    <span class="stat-trend ${tendencias.usuarios.positivo ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${tendencias.usuarios.positivo ? 'up' : 'down'}"></i>
                        ${tendencias.usuarios.valor}%
                    </span>
                    <span class="text-muted ms-2">vs. mes anterior</span>
                </div>
            </div>
        </div>
    `;

    // Animar las tarjetas
    setTimeout(() => {
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }, 100);
}

/**
 * Renderiza el gráfico de convenios
 */
function renderConveniosChart(convenios) {
    const ctx = document.getElementById('conveniosChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (conveniosChart) {
        conveniosChart.destroy();
    }

    // Procesar datos para el gráfico (ejemplo con datos simulados)
    // Ajusta esto según la estructura real de tus convenios
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datosActivos = [15, 22, 18, 30, 25, 35, 28, 40, 33, 45, 38, convenios?.length || 0];
    const datosInactivos = [5, 8, 6, 10, 8, 12, 10, 15, 12, 18, 15, Math.floor((convenios?.length || 0) * 0.2)];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#EAEAEA' : '#1A1A1A';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    conveniosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Convenios Activos',
                    data: datosActivos,
                    borderColor: '#338702',
                    backgroundColor: 'rgba(51, 135, 2, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#338702',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Convenios Vencidos',
                    data: datosInactivos,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#dc3545',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: { size: 12, weight: '500' },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1E1E1E' : '#fff',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: isDark ? '#2E2E2E' : '#E5E5E5',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} convenios`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        padding: 8
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        padding: 8
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Renderiza el top de instituciones
 */
function renderTopInstituciones(instituciones, convenios) {
    const contenedor = document.getElementById('topInstituciones');
    if (!contenedor) return;

    // Contar convenios por institución
    const conveniosPorInstitucion = {};
    
    convenios?.forEach(convenio => {
        const instId = convenio.id_institucion || convenio.institucion_id;
        if (instId) {
            conveniosPorInstitucion[instId] = (conveniosPorInstitucion[instId] || 0) + 1;
        }
    });

    // Crear array de instituciones con su conteo
    const institucionesConConteo = instituciones?.map(inst => ({
        ...inst,
        totalConvenios: conveniosPorInstitucion[inst.id_institucion] || 0
    })) || [];

    // Ordenar por cantidad de convenios
    const topInstituciones = institucionesConConteo
        .sort((a, b) => b.totalConvenios - a.totalConvenios)
        .slice(0, 5);

    if (topInstituciones.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p class="mb-0">No hay datos disponibles</p>
            </div>
        `;
        return;
    }

    const rankClasses = ['gold', 'silver', 'bronze', 'default', 'default'];
    
    contenedor.innerHTML = topInstituciones.map((inst, index) => `
        <div class="top-item">
            <div class="top-rank ${rankClasses[index]}">
                ${index + 1}
            </div>
            <div class="top-info">
                <div class="top-name" title="${inst.nombre_institucion || 'Sin nombre'}">
                    ${inst.nombre_institucion || 'Sin nombre'}
                </div>
                <div class="top-count">
                    <i class="fas fa-handshake me-1"></i>
                    ${inst.totalConvenios} convenio${inst.totalConvenios !== 1 ? 's' : ''}
                </div>
            </div>
            <span class="top-badge">${inst.totalConvenios}</span>
        </div>
    `).join('');
}

/**
 * Actualiza los contadores en las tarjetas de módulos
 */
function updateModuleCounts(resumen) {
    const counts = {
        'module-convenios-count': resumen.totalConvenios,
        'module-instituciones-count': resumen.totalInstituciones,
        'module-homologaciones-count': resumen.totalHomologaciones,
        'module-usuarios-count': resumen.totalUsuarios,
        'module-municipios-count': 'N/A' // No tenemos este dato en el resumen
    };

    Object.entries(counts).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

/**
 * Muestra mensaje de error
 */
function mostrarError(mensaje) {
    const contenedor = document.getElementById('estadisticas-cards');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <h5 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar datos
                    </h5>
                    <p class="mb-0">${mensaje}</p>
                </div>
            </div>
        `;
    }
}

/**
 * Inicializa el panel
 */
async function Init() {
    console.log('🚀 Inicializando panel mejorado...');
    
    try {
        // Obtener resumen del dashboard
        const resumen = await panelService.getResumenDashboard();
        console.log('✅ Resumen obtenido:', resumen);

        // Renderizar estadísticas
        renderEstadisticas(resumen);

        // Renderizar gráfico de convenios
        renderConveniosChart(resumen.convenios);

        // Renderizar top instituciones
        renderTopInstituciones(resumen.instituciones, resumen.convenios);

        // Actualizar contadores de módulos
        updateModuleCounts(resumen);

        console.log('✅ Panel cargado exitosamente');

    } catch (error) {
        console.error('❌ Error al cargar el panel:', error);
        mostrarError('No se pudieron cargar las estadísticas. Por favor, intenta recargar la página.');
    }
}

// Actualizar gráfico al cambiar tema
document.getElementById('themeToggle')?.addEventListener('click', () => {
    setTimeout(() => {
        if (conveniosChart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#EAEAEA' : '#1A1A1A';
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

            conveniosChart.options.plugins.legend.labels.color = textColor;
            conveniosChart.options.scales.y.grid.color = gridColor;
            conveniosChart.options.scales.y.ticks.color = textColor;
            conveniosChart.options.scales.x.ticks.color = textColor;
            conveniosChart.update();
        }
    }, 100);
});

// Exportar para uso global
window.panelModule = { Init };

export { Init };