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
 * Mapeo de páginas y sus módulos correspondientes
 */
const pageModules = {
    'panel': () => import('./pages/panel.js'),
    'convenios': () => import('./pages/convenios.js'),
    'instituciones': () => import('./pages/instituciones.js'),
    'homologaciones': () => import('./pages/homologacion.js'),
    'municipios': () => import('./pages/municipios.js'),
    'estadisticas': () => import('./pages/estadisticas.js'),
    'usuarios': () => import('./pages/usuarios.js')
};

/**
 * Carga dinámicamente el contenido HTML de la página solicitada
 * y ejecuta el módulo JS correspondiente
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
            </div>
        `;
    }
    
    try {
        const response = await fetch(`pages/${page}.html`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo cargar la página`);
        }
        
        const html = await response.text();
        mainContent.innerHTML = html;
        console.log(`✅ HTML de ${page} cargado`);
        
        // Cargar el módulo JS correspondiente si existe
        if (pageModules[page]) {
            console.log(`Cargando módulo JS de ${page}...`);
            pageModules[page]()
                .then(module => {
                    if (module.Init) {
                        module.Init();
                        console.log(`✅ Módulo ${page}.js inicializado`);
                    }
                })
                .catch(error => {
                    console.error(`❌ Error al cargar módulo de ${page}:`, error);
                });
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
                        <small>${error.message}</small>
                    </p>
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
        console.warn('⚠️ No hay token, redirigiendo a login');
        window.location.href = 'login.html';
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
    
    // Cargar página inicial
    loadContent('panel');
    console.log('✅ Sistema iniciado correctamente');
});

// Export para uso en otros módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadContent };
}
