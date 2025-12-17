const mainContent = document.getElementById('contenido');
const navLinks = document.querySelector('.sidebar-menu');

// Event listener para navegación en sidebar
navLinks?.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-page]');
    
    if (link) {
        event.preventDefault();
        const pageToLoad = link.dataset.page;
        console.log(`Navegando a: ${pageToLoad}`);
        loadContent(pageToLoad);
    }
});

/**
 * Mapeo CORREGIDO de páginas y sus módulos correspondientes
 * IMPORTANTE: Los nombres deben coincidir exactamente con los archivos
 */
const pageModules = {
    'panel': () => import('./pages/panel.js'),        
    'convenios': () => import('./pages/convenios.js'),
    'instituciones': () => import('./pages/instituciones.js'),
    'homologaciones': () => import('./pages/homologacion.js'), // SIN 'es' al final
    'municipios': () => import('./pages/municipios.js'),
    'estadisticas': () => import('./pages/estadisticas.js'),
    'usuarios': () => import('./pages/usuarios.js')
};

/**
 * Carga dinámica del contenido HTML y ejecuta el módulo JS correspondiente
 * CON MANEJO MEJORADO DE ERRORES
 */
const loadContent = async (page) => {
    console.log(`Cargando página: ${page}`);
    
    // Mostrar loading
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border spinner-border-custom" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando ${page}...</p>
            </div>
        `;
    }
    
    try {
        // 1. Cargar el HTML
        const response = await fetch(`pages/${page}.html`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo cargar la página`);
        }
        
        const html = await response.text();
        mainContent.innerHTML = html;
        console.log(`✅ HTML de ${page} cargado`);
        
        // 2. Esperar un momento para que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 3. Cargar el módulo JS correspondiente si existe
        if (pageModules[page]) {
            console.log(`Cargando módulo JS de ${page}...`);
            
            try {
                const module = await pageModules[page]();
                
                // 4. Ejecutar la función Init del módulo
                if (module.Init) {
                    await module.Init();
                    console.log(`✅ Módulo ${page}.js inicializado`);
                } else {
                    console.warn(`⚠️ El módulo ${page}.js no tiene función Init()`);
                }
            } catch (moduleError) {
                console.error(`❌ Error al cargar módulo de ${page}:`, moduleError);
                
                // Mostrar error en la interfaz pero mantener el HTML
                const errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-warning alert-dismissible fade show m-3';
                errorAlert.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Advertencia:</strong> El contenido se cargó pero hay un problema con la funcionalidad.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    <div class="small mt-2">Error: ${moduleError.message}</div>
                `;
                mainContent.insertBefore(errorAlert, mainContent.firstChild);
            }
        } else {
            console.log(`ℹ️ No hay módulo JS para ${page}`);
        }
        
    } catch (error) {
        console.error('❌ Error en loadContent:', error);
        mainContent.innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar
                    </h4>
                    <p>No se pudo cargar el contenido solicitado.</p>
                    <hr>
                    <p class="mb-0">
                        <small><strong>Detalles:</strong> ${error.message}</small>
                    </p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo me-2"></i>Recargar Página
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

// Botón de logout
const logoutButton = document.getElementById('logoutBtn');
if (logoutButton) {
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            console.log('Cerrando sesión...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    });
}

// Verificación de autenticación y carga inicial
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema iniciando...');
    
    // Verificar token
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('⚠️ No hay token. Mostrando opciones de autenticación.');

        // Crear banner informativo para facilitar testing local
        const banner = document.createElement('div');
        banner.className = 'alert alert-warning m-3 d-flex justify-content-between align-items-center';
        banner.innerHTML = `
            <div>
                <strong>Atención:</strong> No se encontró token de acceso. Debes iniciar sesión para acceder a todas las funciones.
            </div>
            <div>
                <button id="goLoginBtn" class="btn btn-sm btn-primary me-2">Ir a Login</button>
                <button id="devContinueBtn" class="btn btn-sm btn-outline-secondary">Continuar (modo dev)</button>
            </div>
        `;

        const wrapper = document.getElementById('contenido');
        if (wrapper) wrapper.prepend(banner);

        document.getElementById('goLoginBtn')?.addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        document.getElementById('devContinueBtn')?.addEventListener('click', () => {
            // Marcamos modo dev para pruebas locales y cargamos panel
            localStorage.setItem('dev_mode', '1');
            localStorage.setItem('user', JSON.stringify({ nombre_completo: 'Desarrollador (dev_mode)' }));
            loadContent('panel');
        });

        return;
    }
    
    // Obtener información del usuario
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('👤 Usuario autenticado:', userData.nombre_completo);
        } catch (error) {
            console.error('Error al parsear datos de usuario:', error);
        }
    }
    
    // Escuchar eventos globales de autenticación desde apiClient
    window.addEventListener('api:unauthorized', () => {
        console.warn('Evento api:unauthorized recibido — limpiando sesión y redirigiendo a login');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('dev_mode');
        window.location.href = 'login.html';
    });

    // Mostrar errores globales de API como banner
    function showApiError(message, status) {
        // Evitar crear múltiples banners
        let existing = document.getElementById('apiErrorBanner');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'apiErrorBanner';
            existing.className = 'alert alert-danger m-3';
            existing.style.cursor = 'pointer';
            existing.title = 'Haz clic para cerrar';
            const wrapper = document.getElementById('contenido');
            if (wrapper) wrapper.prepend(existing);
        }
        existing.textContent = `Error en la API${status ? ` (status ${status})` : ''}: ${message}`;
        existing.onclick = () => existing.remove();
    }

    window.addEventListener('api:error', (e) => {
        const { message, status } = e.detail || {};
        console.warn('Evento api:error recibido:', message, status);
        showApiError(message || 'Error inesperado en la API', status);
    });

    // Cargar página inicial (panel)
    loadContent('panel');
    console.log('✅ Sistema iniciado correctamente');
});

// Export para uso en otros módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadContent };
}

// Hacer loadContent disponible globalmente para el panel
window.loadContent = loadContent;