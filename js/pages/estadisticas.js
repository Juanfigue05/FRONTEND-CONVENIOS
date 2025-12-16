import { estadisticaService } from '../api/estadistica.service.js';
import { convenioService } from '../api/convenios.service.js';
import { institucionService } from '../api/instituciones.service.js';
import { homologacionService } from '../api/homologacion.service.js';

// ===============================================
// VARIABLES GLOBALES
// ===============================================
let chartsInstances = {};
let estadisticasCache = {
    convenios: [],
    instituciones: [],
    homologaciones: [],
    estadisticasDB: []
};
let currentMunicipiosView = 'instituciones'; // Vista actual del gráfico de municipios

// ===============================================
// UTILIDADES
// ===============================================

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
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
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
 * Destruye un gráfico si existe
 */
function destroyChart(chartId) {
    if (chartsInstances[chartId]) {
        chartsInstances[chartId].destroy();
        delete chartsInstances[chartId];
    }
}

/**
 * Obtiene colores según el tema
 */
function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        primary: '#338702',
        secondary: '#529d3b',
        info: '#2196F3',
        warning: '#FF9800',
        success: '#4CAF50',
        danger: '#F44336',
        purple: '#9C27B0',
        textColor: isDark ? '#EAEAEA' : '#1A1A1A',
        gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'
    };
}

// ===============================================
// RENDERIZADO DE KPIs
// ===============================================

/**
 * Renderiza las tarjetas KPI con animación
 */
function renderKPICards(stats) {
    const totalConvenios = stats.convenios?.length || 0;
    const totalInstituciones = stats.instituciones?.length || 0;
    const totalHomologaciones = stats.homologaciones?.length || 0;
    const precioTotal = stats.convenios?.reduce((sum, c) => {
        return sum + (parseFloat(c.precio_estimado) || 0);
    }, 0) || 0;

    // Animar números con efecto de conteo
    animateNumber('kpi-convenios', totalConvenios, 1000);
    animateNumber('kpi-instituciones', totalInstituciones, 1000);
    animateNumber('kpi-homologaciones', totalHomologaciones, 1000);
    animateValue('kpi-valor', precioTotal, 1500);

    // Renderizar sparklines
    renderSparkline('sparkline-convenios', [15, 18, 22, 25, 28, 32, 37]);
    renderSparkline('sparkline-instituciones', [18, 20, 22, 23, 24, 25, 26]);
    renderSparkline('sparkline-homologaciones', [1, 1, 2, 2, 2, 3, 3]);
    renderSparkline('sparkline-valor', [5000000, 6500000, 8000000, 9500000, 11000000, 12500000, precioTotal]);
}

/**
 * Anima un número desde 0 hasta el valor final
 */
function animateNumber(elementId, finalValue, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let startValue = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuad)
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.floor(startValue + (finalValue - startValue) * easeProgress);
        
        element.textContent = formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatNumber(finalValue);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Anima un valor monetario
 */
function animateValue(elementId, finalValue, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let startValue = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.floor(startValue + (finalValue - startValue) * easeProgress);
        
        element.textContent = formatCurrency(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatCurrency(finalValue);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Renderiza mini gráfico sparkline
 */
function renderSparkline(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const colors = getThemeColors();
    destroyChart(canvasId);

    chartsInstances[canvasId] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                data: data,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}20`,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// ===============================================
// GRÁFICO DE TENDENCIA TEMPORAL
// ===============================================

/**
 * Renderiza gráfico de tendencia anual - MEJORADO
 */
function renderTendenciaChart(convenios) {
    const canvas = document.getElementById('chartTendencia');
    if (!canvas) return;

    const colors = getThemeColors();
    destroyChart('tendencia');

    // Agrupar por mes
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const datos = new Array(12).fill(0);

    convenios.forEach(c => {
        if (c.fecha_firma) {
            try {
                const fecha = new Date(c.fecha_firma);
                const mes = fecha.getMonth();
                datos[mes]++;
            } catch (e) {
                console.warn('Fecha inválida:', c.fecha_firma);
            }
        }
    });

    chartsInstances['tendencia'] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Convenios por mes',
                data: datos,
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}40`,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: colors.primary,
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: colors.backgroundColor,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.gridColor,
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: { size: 14 },
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { 
                        color: colors.gridColor,
                        drawBorder: false
                    },
                    ticks: { 
                        color: colors.textColor,
                        stepSize: 1,
                        font: { size: 12 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: colors.textColor,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Actualizar estadísticas del footer
    const total = datos.reduce((a, b) => a + b, 0);
    const mesPicoIndex = datos.indexOf(Math.max(...datos));
    const mesPico = meses[mesPicoIndex];
    const promedio = total > 0 ? (total / 12).toFixed(1) : 0;
    
    document.getElementById('totalAnual').textContent = formatNumber(total);
    document.getElementById('mesPico').textContent = mesPico;
    document.getElementById('promedioMensual').textContent = promedio;
}

// ===============================================
// TOP 5 INSTITUCIONES
// ===============================================

/**
 * Renderiza ranking de top instituciones
 */
function renderTopInstituciones(instituciones) {
    const container = document.getElementById('topInstituciones');
    if (!container) return;

    // Ordenar por cantidad de convenios
    const top5 = [...instituciones]
        .sort((a, b) => (b.cant_convenios || 0) - (a.cant_convenios || 0))
        .slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay datos disponibles</p>';
        return;
    }

    const maxConvenios = Math.max(...top5.map(i => i.cant_convenios || 0));

    container.innerHTML = top5.map((inst, index) => {
        const percentage = maxConvenios > 0 ? ((inst.cant_convenios || 0) / maxConvenios) * 100 : 0;
        return `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name" title="${inst.nombre_institucion}">
                        ${inst.nombre_institucion}
                    </div>
                    <div class="ranking-bar">
                        <div class="ranking-progress" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="ranking-value">${inst.cant_convenios || 0}</div>
            </div>
        `;
    }).join('');
}

// ===============================================
// GRÁFICO DE ESTADO
// ===============================================

/**
 * Renderiza gráfico de estado de convenios - MEJORADO
 */
function renderEstadoChart(convenios) {
    const canvas = document.getElementById('chartEstado');
    if (!canvas) return;

    const colors = getThemeColors();
    destroyChart('estado');

    // Agrupar por estado
    const estados = {};
    convenios.forEach(c => {
        const estado = c.estado_convenio || 'Sin Estado';
        estados[estado] = (estados[estado] || 0) + 1;
    });

    const labels = Object.keys(estados);
    const data = Object.values(estados);
    const bgColors = [colors.info, colors.warning, colors.success, colors.danger, colors.purple];

    chartsInstances['estado'] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 3,
                borderColor: colors.backgroundColor,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { 
                        color: colors.textColor,
                        padding: 20,
                        font: { size: 13, weight: '500' },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: colors.backgroundColor,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.gridColor,
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Actualizar estadísticas del footer
    const total = data.reduce((a, b) => a + b, 0);
    const masComun = labels[data.indexOf(Math.max(...data))];
    
    document.getElementById('totalEstado').textContent = formatNumber(total);
    document.getElementById('estadoMasComun').textContent = masComun || '-';
}

// ===============================================
// GRÁFICO DE TIPO
// ===============================================

/**
 * Renderiza gráfico de tipo de convenios - MEJORADO
 */
function renderTipoChart(convenios) {
    const canvas = document.getElementById('chartTipo');
    if (!canvas) return;

    const colors = getThemeColors();
    destroyChart('tipo');

    // Agrupar por tipo
    const tipos = {};
    convenios.forEach(c => {
        const tipo = c.tipo_convenio || 'Sin Tipo';
        tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    const labels = Object.keys(tipos);
    const data = Object.values(tipos);

    // Colores degradados para cada barra
    const backgroundColors = data.map((_, i) => {
        const hue = (i * 137.5) % 360; // Golden angle
        return `hsl(${hue}, 70%, 50%)`;
    });

    chartsInstances['tipo'] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(c => c.replace('50%', '40%')),
                borderWidth: 2,
                borderRadius: 10,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: colors.backgroundColor,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.gridColor,
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: { size: 14 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { 
                        color: colors.gridColor,
                        drawBorder: false
                    },
                    ticks: { 
                        color: colors.textColor,
                        stepSize: 1,
                        font: { size: 12 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: colors.textColor,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Actualizar estadísticas del footer
    const total = data.reduce((a, b) => a + b, 0);
    
    document.getElementById('totalTipo').textContent = formatNumber(total);
    document.getElementById('totalCategorias').textContent = labels.length;
}

// ===============================================
// GRÁFICO DE MUNICIPIOS
// ===============================================

/**
 * Renderiza gráfico de distribución por municipios - MEJORADO
 */
function renderMunicipiosChart(instituciones, convenios) {
    const canvas = document.getElementById('chartMunicipios');
    if (!canvas) return;

    const colors = getThemeColors();
    destroyChart('municipios');

    let municipios = {};
    let labels, data, label, bgColor;

    if (currentMunicipiosView === 'instituciones') {
        // Vista de instituciones por municipio
        instituciones.forEach(i => {
            const municipio = i.id_municipio || 'Sin Municipio';
            municipios[municipio] = (municipios[municipio] || 0) + 1;
        });
        label = 'Instituciones';
        bgColor = colors.danger;
    } else {
        // Vista de convenios por municipio (a través de instituciones)
        convenios.forEach(c => {
            const institucion = instituciones.find(i => i.nit_institucion === c.nit_institucion);
            if (institucion) {
                const municipio = institucion.id_municipio || 'Sin Municipio';
                municipios[municipio] = (municipios[municipio] || 0) + 1;
            }
        });
        label = 'Convenios';
        bgColor = colors.primary;
    }

    // Ordenar por cantidad descendente
    const sorted = Object.entries(municipios).sort((a, b) => b[1] - a[1]);
    labels = sorted.map(([k]) => k);
    data = sorted.map(([, v]) => v);

    // Crear gradiente de colores
    const backgroundColors = data.map((value, index) => {
        const intensity = 0.5 + (value / Math.max(...data)) * 0.5;
        return bgColor + Math.floor(intensity * 255).toString(16).padStart(2, '0');
    });

    chartsInstances['municipios'] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColors,
                borderColor: bgColor,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: colors.backgroundColor,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.gridColor,
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: { size: 14 }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { 
                        color: colors.gridColor,
                        drawBorder: false
                    },
                    ticks: { 
                        color: colors.textColor,
                        stepSize: 1,
                        font: { size: 12 }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { 
                        color: colors.textColor,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Actualizar estadísticas del footer
    const total = labels.length;
    const masActivo = labels.length > 0 ? labels[0] : '-';
    const promedio = data.length > 0 ? (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1) : 0;
    
    document.getElementById('totalMunicipios').textContent = total;
    document.getElementById('municipioActivo').textContent = masActivo;
    document.getElementById('promedioMunicipios').textContent = promedio;
}

/**
 * Cambia la vista del gráfico de municipios
 */
window.toggleMunicipiosView = function(view) {
    currentMunicipiosView = view;
    
    // Actualizar estado de botones
    document.getElementById('viewInstituciones').classList.toggle('active', view === 'instituciones');
    document.getElementById('viewConvenios').classList.toggle('active', view === 'convenios');
    
    // Re-renderizar gráfico
    renderMunicipiosChart(estadisticasCache.instituciones, estadisticasCache.convenios);
}

/**
 * Descarga un gráfico como imagen
 */
window.downloadChart = function(chartId, filename) {
    // Extraer el nombre del chart desde el ID del canvas
    let chartKey = '';
    
    if (chartId === 'chartTendencia') chartKey = 'tendencia';
    else if (chartId === 'chartEstado') chartKey = 'estado';
    else if (chartId === 'chartTipo') chartKey = 'tipo';
    else if (chartId === 'chartMunicipios') chartKey = 'municipios';
    
    const chart = chartsInstances[chartKey];
    if (!chart) {
        console.error('No se encontró el gráfico:', chartKey);
        return;
    }
    
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = url;
    link.click();
}

// ===============================================
// TABLA DE SUPERVISORES
// ===============================================

/**
 * Renderiza tabla de carga de supervisores
 */
function renderTablaSupervisores(convenios) {
    const tbody = document.getElementById('tablaSupervisores');
    if (!tbody) return;

    // Agrupar por supervisor
    const supervisores = {};
    convenios.forEach(c => {
        if (!c.supervisor) return;
        
        if (!supervisores[c.supervisor]) {
            supervisores[c.supervisor] = {
                activos: 0,
                finalizados: 0,
                total: 0
            };
        }

        supervisores[c.supervisor].total++;
        if (c.estado_convenio === 'Activo') {
            supervisores[c.supervisor].activos++;
        } else if (c.estado_convenio === 'Finalizado') {
            supervisores[c.supervisor].finalizados++;
        }
    });

    if (Object.keys(supervisores).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay datos de supervisores disponibles
                </td>
            </tr>
        `;
        return;
    }

    const maxTotal = Math.max(...Object.values(supervisores).map(s => s.total));

    tbody.innerHTML = Object.entries(supervisores)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10) // Top 10
        .map(([nombre, data]) => {
            const percentage = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
            return `
                <tr>
                    <td>${nombre}</td>
                    <td><span class="badge bg-success">${data.activos}</span></td>
                    <td><span class="badge bg-secondary">${data.finalizados}</span></td>
                    <td><strong>${data.total}</strong></td>
                    <td>
                        <div class="progress-bar-custom">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// ===============================================
// TABLA DETALLADA
// ===============================================

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
                    <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No hay estadísticas disponibles</p>
                    <small class="text-muted">Las estadísticas se generarán automáticamente</small>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = estadisticas.map(stat => `
        <tr>
            <td>
                <span class="badge" style="background: ${getCategoryColor(stat.categoria)}">
                    ${stat.categoria || 'N/A'}
                </span>
            </td>
            <td>${stat.nombre || 'N/A'}</td>
            <td>${stat.subcategoria || '-'}</td>
            <td class="text-end"><strong>${formatNumber(stat.cantidad || 0)}</strong></td>
            <td class="text-end">${stat.suma_total ? formatCurrency(stat.suma_total) : '-'}</td>
            <td class="text-center text-muted">${formatDate(stat.fecha_actualizacion)}</td>
        </tr>
    `).join('');
}

/**
 * Obtiene color por categoría
 */
function getCategoryColor(categoria) {
    const colors = {
        'tipo_convenio': '#338702',
        'estado_convenio': '#2196F3',
        'persona_apoyo_fpi': '#FF9800',
        'supervisor': '#9C27B0',
        'municipio_convenios': '#F44336',
        'modalidad_homologacion': '#4CAF50',
        'nivel_programa': '#00BCD4',
        'regional': '#FF5722'
    };
    return colors[categoria] || '#6C757D';
}

// ===============================================
// FILTROS
// ===============================================

/**
 * Aplica filtros
 */
async function aplicarFiltros() {
    const categoria = document.getElementById('filterCategoria')?.value;
    
    if (!categoria) {
        await cargarEstadisticas();
        return;
    }

    try {
        const estadisticas = await estadisticaService.getEstadisticasByCategoria(categoria);
        renderTablaEstadisticas(estadisticas);
    } catch (error) {
        console.error('Error al aplicar filtros:', error);
    }
}

/**
 * Limpia filtros
 */
function limpiarFiltros() {
    document.getElementById('filterFechaInicio').value = '';
    document.getElementById('filterFechaFin').value = '';
    document.getElementById('filterCategoria').value = '';
    cargarEstadisticas();
}

// ===============================================
// CARGA PRINCIPAL
// ===============================================

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
            estadisticaService.getAllEstadisticas().catch(() => [])
        ]);

        estadisticasCache = {
            convenios,
            instituciones,
            homologaciones,
            estadisticasDB
        };

        // Renderizar todos los componentes
        renderKPICards(estadisticasCache);
        renderTendenciaChart(convenios);
        renderTopInstituciones(instituciones);
        renderEstadoChart(convenios);
        renderTipoChart(convenios);
        renderMunicipiosChart(instituciones, convenios);
        renderTablaSupervisores(convenios);
        renderTablaEstadisticas(estadisticasDB);

        console.log('✅ Estadísticas cargadas correctamente');

    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
    }
}

// ===============================================
// INICIALIZACIÓN
// ===============================================

/**
 * Inicializa la página de estadísticas
 */
async function Init() {
    console.log('🚀 Inicializando estadísticas mejoradas...');

    // Event listeners
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');

    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);

    // Cargar estadísticas
    await cargarEstadisticas();

    // Actualizar gráficos al cambiar tema
    if (window.themeManager) {
        const originalToggle = window.themeManager.toggleTheme.bind(window.themeManager);
        window.themeManager.toggleTheme = function() {
            originalToggle();
            setTimeout(() => cargarEstadisticas(), 100);
        };
    }
}

export { Init };