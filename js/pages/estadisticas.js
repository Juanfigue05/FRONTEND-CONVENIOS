import { convenioService } from '../api/convenios.service.js';
import { institucionService } from '../api/instituciones.service.js';
import { homologacionService } from '../api/homologacion.service.js';

let conveniosData = [];
let institucionesData = [];
let homologacionesData = [];

// Referencias a los gráficos
let chartConveniosMes = null;
let chartEstados = null;
let chartInstituciones = null;
let chartTipos = null;

export async function Init() {
    console.log('📊 Inicializando estadísticas mejoradas...');
    try {
        await cargarDatos();
        renderizarEstadisticas();
        await crearGraficos();
        renderizarTablaResumen();
        inicializarEventos();
        console.log('✅ Estadísticas inicializadas correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar estadísticas:', error);
        mostrarError(error.message);
    }
}

async function cargarDatos() {
    try {
        console.log('🔄 Cargando datos...');
        
        // Cargar datos en paralelo (sin estadisticas/obtener-todas que da error)
        const [convenios, instituciones, homologaciones] = await Promise.all([
            convenioService.getConvenios().catch(err => {
                console.error('Error cargando convenios:', err);
                return [];
            }),
            institucionService.getInstituciones().catch(err => {
                console.error('Error cargando instituciones:', err);
                return [];
            }),
            homologacionService.getHomologaciones().catch(err => {
                console.error('Error cargando homologaciones:', err);
                return [];
            })
        ]);

        conveniosData = convenios || [];
        institucionesData = instituciones || [];
        homologacionesData = homologaciones || [];
        
        console.log('✅ Datos cargados:', {
            convenios: conveniosData.length,
            instituciones: institucionesData.length,
            homologaciones: homologacionesData.length
        });
    } catch (error) {
        console.error('Error al cargar datos:', error);
        throw error;
    }
}

function renderizarEstadisticas() {
    // Actualizar métricas principales
    const statTotalConvenios = document.getElementById('stat-total-convenios');
    const statTotalInstituciones = document.getElementById('stat-total-instituciones');
    const statTotalHomologaciones = document.getElementById('stat-total-homologaciones');
    const statTotalUsuarios = document.getElementById('stat-total-usuarios');

    if (statTotalConvenios) statTotalConvenios.textContent = conveniosData.length;
    if (statTotalInstituciones) statTotalInstituciones.textContent = institucionesData.length;
    if (statTotalHomologaciones) statTotalHomologaciones.textContent = homologacionesData.length;
    if (statTotalUsuarios) statTotalUsuarios.textContent = '---'; // No tenemos usuarios en este contexto
}

async function crearGraficos() {
    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 200));
    
    crearGraficoConveniosMes();
    crearGraficoEstados();
    crearGraficoInstituciones();
    crearGraficoTipos();
}

function crearGraficoConveniosMes() {
    const ctx = document.getElementById('chartConveniosMes');
    if (!ctx) {
        console.warn('Canvas chartConveniosMes no encontrado');
        return;
    }

    // Procesar datos por mes
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const conveniosPorMes = new Array(12).fill(0);
    
    conveniosData.forEach(convenio => {
        if (convenio.fecha_inicio) {
            try {
                const mes = new Date(convenio.fecha_inicio).getMonth();
                if (mes >= 0 && mes < 12) {
                    conveniosPorMes[mes]++;
                }
            } catch (e) {
                console.warn('Error procesando fecha:', convenio.fecha_inicio);
            }
        }
    });

    // Destruir gráfico anterior si existe
    if (chartConveniosMes) {
        chartConveniosMes.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#EAEAEA' : '#1A1A1A';

    try {
        chartConveniosMes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Convenios Iniciados',
                    data: conveniosPorMes,
                    borderColor: '#338702',
                    backgroundColor: 'rgba(51, 135, 2, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#338702',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
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
                            font: { size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E1E1E' : '#fff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creando gráfico de convenios por mes:', error);
    }
}

function crearGraficoEstados() {
    const ctx = document.getElementById('chartEstados');
    if (!ctx) {
        console.warn('Canvas chartEstados no encontrado');
        return;
    }

    // Contar convenios por estado
    const estadosCount = {};
    conveniosData.forEach(convenio => {
        const estado = convenio.estado_convenio || 'Sin Estado';
        estadosCount[estado] = (estadosCount[estado] || 0) + 1;
    });

    const estados = Object.keys(estadosCount);
    const valores = Object.values(estadosCount);

    if (estados.length === 0) {
        console.warn('No hay datos de estados');
        return;
    }

    if (chartEstados) {
        chartEstados.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#EAEAEA' : '#1A1A1A';

    try {
        chartEstados = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: estados,
                datasets: [{
                    data: valores,
                    backgroundColor: [
                        '#338702',  // Activo
                        '#dc3545',  // Vencido
                        '#ffc107',  // Por vencer
                        '#6c757d'   // Suspendido
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#1E1E1E' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E1E1E' : '#fff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? '#2E2E2E' : '#E5E5E5',
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creando gráfico de estados:', error);
    }
}

function crearGraficoInstituciones() {
    const ctx = document.getElementById('chartInstituciones');
    if (!ctx) {
        console.warn('Canvas chartInstituciones no encontrado');
        return;
    }

    // Contar convenios por institución
    const institucionesCount = {};
    conveniosData.forEach(convenio => {
        const inst = convenio.nombre_institucion || 'Sin Institución';
        institucionesCount[inst] = (institucionesCount[inst] || 0) + 1;
    });

    // Top 10
    const sorted = Object.entries(institucionesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sorted.length === 0) {
        console.warn('No hay datos de instituciones');
        return;
    }

    const nombres = sorted.map(item => item[0]);
    const valores = sorted.map(item => item[1]);

    if (chartInstituciones) {
        chartInstituciones.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#EAEAEA' : '#1A1A1A';

    try {
        chartInstituciones = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: nombres,
                datasets: [{
                    label: 'Número de Convenios',
                    data: valores,
                    backgroundColor: 'rgba(51, 135, 2, 0.7)',
                    borderColor: '#338702',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1E1E1E' : '#fff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creando gráfico de instituciones:', error);
    }
}

function crearGraficoTipos() {
    const ctx = document.getElementById('chartTipos');
    if (!ctx) {
        console.warn('Canvas chartTipos no encontrado');
        return;
    }

    // Contar convenios por tipo
    const tiposCount = {};
    conveniosData.forEach(convenio => {
        const tipo = convenio.tipo_convenio || 'Sin Tipo';
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });

    const tipos = Object.keys(tiposCount);
    const valores = Object.values(tiposCount);

    if (tipos.length === 0) {
        console.warn('No hay datos de tipos');
        return;
    }

    if (chartTipos) {
        chartTipos.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#EAEAEA' : '#1A1A1A';

    try {
        chartTipos = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: tipos,
                datasets: [{
                    data: valores,
                    backgroundColor: [
                        '#338702',
                        '#529d3b',
                        '#6eb551',
                        '#8acc68'
                    ],
                    borderWidth: 2,
                    borderColor: isDark ? '#1E1E1E' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E1E1E' : '#fff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? '#2E2E2E' : '#E5E5E5',
                        borderWidth: 1
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creando gráfico de tipos:', error);
    }
}

function renderizarTablaResumen() {
    const tbody = document.querySelector('#tablaResumen tbody');
    if (!tbody) return;

    // Agrupar convenios por institución
    const resumenPorInstitucion = {};
    
    conveniosData.forEach(convenio => {
        const nit = convenio.nit_institucion;
        if (!resumenPorInstitucion[nit]) {
            resumenPorInstitucion[nit] = {
                nombre: convenio.nombre_institucion || 'Sin nombre',
                total: 0,
                activos: 0,
                vencidos: 0,
                homologaciones: 0
            };
        }
        
        resumenPorInstitucion[nit].total++;
        
        if (convenio.estado_convenio === 'Activo') {
            resumenPorInstitucion[nit].activos++;
        } else if (convenio.estado_convenio === 'Vencido') {
            resumenPorInstitucion[nit].vencidos++;
        }
    });

    // Contar homologaciones por institución
    homologacionesData.forEach(homol => {
        const nit = homol.nit_institucion;
        if (resumenPorInstitucion[nit]) {
            resumenPorInstitucion[nit].homologaciones++;
        }
    });

    // Renderizar tabla
    const instituciones = Object.values(resumenPorInstitucion)
        .sort((a, b) => b.total - a.total);

    if (instituciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    No hay datos disponibles
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = instituciones.map((inst, index) => {
        const cumplimiento = inst.total > 0 ? Math.round((inst.activos / inst.total) * 100) : 0;
        const badgeClass = cumplimiento >= 70 ? 'success' : cumplimiento >= 50 ? 'warning' : 'danger';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${inst.nombre}</strong></td>
                <td class="text-center"><span class="badge bg-primary">${inst.total}</span></td>
                <td class="text-center"><span class="badge bg-success">${inst.activos}</span></td>
                <td class="text-center"><span class="badge bg-danger">${inst.vencidos}</span></td>
                <td class="text-center"><span class="badge bg-info">${inst.homologaciones}</span></td>
                <td class="text-center">
                    <span class="badge bg-${badgeClass}">${cumplimiento}%</span>
                </td>
            </tr>
        `;
    }).join('');
}

function inicializarEventos() {
    // Botón de exportar
    const btnExportar = document.getElementById('btnExportarReporte');
    btnExportar?.addEventListener('click', () => {
        alert('Funcionalidad de exportación próximamente');
    });

    // Botones de período
    document.querySelectorAll('[data-period]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Aquí se podría actualizar el gráfico según el período
        });
    });

    // Actualizar gráficos al cambiar tema
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        setTimeout(() => {
            crearGraficos();
        }, 300);
    });
}

function mostrarError(mensaje) {
    const contenedor = document.querySelector('.container-fluid');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-danger m-4" role="alert">
                <h4 class="alert-heading">
                    <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar estadísticas
                </h4>
                <p>${mensaje}</p>
                <hr>
                <p class="mb-0">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </p>
            </div>
        `;
    }
}