import { estadisticaService } from '../api/estadistica_service.js';
import { convenioService } from '../api/convenios_service.js';
import { institucionService } from '../api/instituciones_service.js';
import { homologacionService } from '../api/homologacion_service.js';

let errorModalInstance = null;
let estadisticasCache = [];
let chartsInstances = {}; // Para guardar instancias de gráficos y poder destruirlos

/**
 * Inicializa el modal de error
 */
function initializeModal() {
    const errorModalElement = document.getElementById('errorModal');
    if (errorModalElement && !errorModalInstance) {
        errorModalInstance = new bootstrap.Modal(errorModalElement);
    }
}

/**
 * Muestra modal de error
 */
function showErrorModal(title, message) {
    initializeModal();
    document.getElementById('errorModalTitle').textContent = title;
    document.getElementById('errorModalMessage').textContent = message;
    errorModalInstance.show();
}

/**
 * Formatea números con separador de miles
 */
function formatNumber(num) {
    return new Intl.NumberFormat('es-CO').format(num);
}

/**
 * Formatea moneda en pesos colombianos
 */
function formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(num);
}

/**
 * Formatea fecha
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'N/A';
    }
}

/**
 * Renderiza tarjetas de resumen
 */
function renderResumenCards(stats) {
    const contenedor = document.getElementById('resumen-cards');
    if (!contenedor) return;

    // Calcular totales
    const totalConvenios = stats.convenios?.length || 0;
    const totalInstituciones = stats.instituciones?.length || 0;
    const totalHomologaciones = stats.homologaciones?.length || 0;

    // Calcular precio estimado total de convenios
    const precioTotal = stats.convenios?.reduce((sum, c) => {
        return sum + (parseFloat(c.precio_estimado) || 0);
    }, 0) || 0;

    contenedor.innerHTML = `
        <div class="col-md-6 col-lg-3 mb-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                            <i class="bi bi-file-earmark-text text-primary fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Convenios</h6>
                            <h3 class="mb-0 fw-bold">${formatNumber(totalConvenios)}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3 mb-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-success bg-opacity-10 p-3">
                            <i class="bi bi-building text-success fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Instituciones</h6>
                            <h3 class="mb-0 fw-bold">${formatNumber(totalInstituciones)}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3 mb-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-warning bg-opacity-10 p-3">
                            <i class="bi bi-arrow-repeat text-warning fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted">Homologaciones</h6>
                            <h3 class="mb-0 fw-bold">${formatNumber(totalHomologaciones)}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-3 mb-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-info bg-opacity-10 p-3">
                            <i class="bi bi-cash-stack text-info fs-4"></i>
                        </div>
                        <div class="ms-3">
                            <h6 class="mb-0 text-muted" style="font-size: 0.85rem;">Valor Estimado</h6>
                            <h5 class="mb-0 fw-bold" style="font-size: 1.2rem;">${formatCurrency(precioTotal)}</h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Destruye un gráfico si existe
 */
function destroyChart(chartId) {
    if (chartsInstances[chartId]) {
        chartsInstances[chartId].destroy();
        delete chartsInstances[chartId];
    }
}

/**
 * Renderiza gráfico de convenios por estado (Pie Chart)
 */
function renderChartConveniosEstado(convenios) {
    const canvas = document.getElementById('chartConveniosEstado');
    if (!canvas) return;

    // Limpiar contenedor y crear canvas si no existe
    const container = canvas.parentElement;
    container.innerHTML = '<canvas id="chartConveniosEstadoCanvas"></canvas>';
    const ctx = document.getElementById('chartConveniosEstadoCanvas').getContext('2d');

    // Agrupar por estado
    const estados = {};
    convenios.forEach(c => {
        const estado = c.estado_convenio || 'Sin Estado';
        estados[estado] = (estados[estado] || 0) + 1;
    });

    const labels = Object.keys(estados);
    const data = Object.values(estados);

    // Colores
    const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
    ];

    destroyChart('conveniosEstado');
    chartsInstances['conveniosEstado'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renderiza gráfico de convenios por tipo (Bar Chart)
 */
function renderChartConveniosTipo(convenios) {
    const canvas = document.getElementById('chartConveniosTipo');
    if (!canvas) return;

    const container = canvas.parentElement;
    container.innerHTML = '<canvas id="chartConveniosTipoCanvas"></canvas>';
    const ctx = document.getElementById('chartConveniosTipoCanvas').getContext('2d');

    // Agrupar por tipo
    const tipos = {};
    convenios.forEach(c => {
        const tipo = c.tipo_convenio || 'Sin Tipo';
        tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    const labels = Object.keys(tipos);
    const data = Object.values(tipos);

    destroyChart('conveniosTipo');
    chartsInstances['conveniosTipo'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Convenios',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Renderiza gráfico de instituciones por municipio (Bar Chart Horizontal)
 */
function renderChartInstitucionesMunicipio(instituciones) {
    const canvas = document.getElementById('chartInstitucionesMunicipio');
    if (!canvas) return;

    const container = canvas.parentElement;
    container.innerHTML = '<canvas id="chartInstitucionesMunicipioCanvas"></canvas>';
    const ctx = document.getElementById('chartInstitucionesMunicipioCanvas').getContext('2d');

    // Agrupar por municipio
    const municipios = {};
    instituciones.forEach(i => {
        const municipio = i.id_municipio || 'Sin Municipio';
        municipios[municipio] = (municipios[municipio] || 0) + 1;
    });

    const labels = Object.keys(municipios);
    const data = Object.values(municipios);

    destroyChart('institucionesMunicipio');
    chartsInstances['institucionesMunicipio'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Instituciones',
                data: data,
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Renderiza gráfico de homologaciones por nivel (Doughnut Chart)
 */
function renderChartHomologacionesNivel(homologaciones) {
    const canvas = document.getElementById('chartHomologacionesNivel');
    if (!canvas) return;

    const container = canvas.parentElement;
    container.innerHTML = '<canvas id="chartHomologacionesNivelCanvas"></canvas>';
    const ctx = document.getElementById('chartHomologacionesNivelCanvas').getContext('2d');

    // Agrupar por nivel
    const niveles = {};
    homologaciones.forEach(h => {
        const nivel = h.nivel_programa || 'Sin Nivel';
        niveles[nivel] = (niveles[nivel] || 0) + 1;
    });

    const labels = Object.keys(niveles);
    const data = Object.values(niveles);

    const colors = [
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)'
    ];

    destroyChart('homologacionesNivel');
    chartsInstances['homologacionesNivel'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Renderiza tabla de estadísticas detalladas
 */
function renderTablaEstadisticas(estadisticas) {
    const tbody = document.getElementById('tablaEstadisticas');
    if (!tbody) return;

    if (!estadisticas || estadisticas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <p class="text-muted mb-0">No hay estadísticas disponibles en la base de datos</p>
                    <small class="text-muted">Las estadísticas se generarán automáticamente según los datos del sistema</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = estadisticas.map(stat => `
        <tr>
            <td><span class="badge bg-primary">${stat.categoria || 'N/A'}</span></td>
            <td>${stat.nombre || 'N/A'}</td>
            <td>${stat.subcategoria || '-'}</td>
            <td class="text-end fw-bold">${formatNumber(stat.cantidad || 0)}</td>
            <td class="text-end">${stat.suma_total ? formatCurrency(stat.suma_total) : '-'}</td>
            <td class="text-center text-muted">${formatDate(stat.fecha_actualizacion)}</td>
        </tr>
    `).join('');
}

/**
 * Carga todas las estadísticas
 */
async function cargarEstadisticas() {
    try {
        // Cargar datos en paralelo
        const [convenios, instituciones, homologaciones, estadisticasDB] = await Promise.all([
            convenioService.getConvenios(),
            institucionService.getInstituciones(),
            homologacionService.getHomologaciones(),
            estadisticaService.getAllEstadisticas().catch(() => []) // Capturar error si tabla está vacía
        ]);

        const stats = {
            convenios,
            instituciones,
            homologaciones,
            estadisticasDB
        };

        // Renderizar componentes
        renderResumenCards(stats);
        renderChartConveniosEstado(convenios);
        renderChartConveniosTipo(convenios);
        renderChartInstitucionesMunicipio(instituciones);
        renderChartHomologacionesNivel(homologaciones);
        renderTablaEstadisticas(estadisticasDB);

        estadisticasCache = stats;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showErrorModal(
            'Error al Cargar Estadísticas',
            error.message || 'No se pudieron cargar las estadísticas del sistema.'
        );
    }
}

/**
 * Aplica filtros de categoría
 */
async function aplicarFiltros() {
    const categoria = document.getElementById('filterCategoria').value;
    const subcategoria = document.getElementById('filterSubcategoria').value;

    if (!categoria && !subcategoria) {
        // Sin filtros, recargar todo
        await cargarEstadisticas();
        return;
    }

    try {
        let estadisticas;
        if (categoria && !subcategoria) {
            estadisticas = await estadisticaService.getEstadisticasByCategoria(categoria);
        } else if (categoria && subcategoria) {
            // Filtrar por ambos (hacer manualmente)
            const todas = await estadisticaService.getEstadisticasByCategoria(categoria);
            estadisticas = todas.filter(e => e.subcategoria === subcategoria);
        } else {
            estadisticas = await estadisticaService.getAllEstadisticas();
        }

        renderTablaEstadisticas(estadisticas);
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        showErrorModal('Error al Filtrar', error.message || 'No se pudieron aplicar los filtros.');
    }
}

/**
 * Inicializa la página de estadísticas
 */
async function Init() {
    console.log('Inicializando estadisticas.js');

    // Configurar listeners
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }

    // Cargar estadísticas
    await cargarEstadisticas();
}

export { Init };
