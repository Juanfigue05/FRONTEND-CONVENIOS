/**
 * Gestor de Tema para SENA HUB
 * Maneja el cambio entre modo claro y oscuro
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        // Aplicar tema almacenado al cargar
        this.applyTheme(this.currentTheme);
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('🎨 Theme Manager inicializado - Tema actual:', this.currentTheme);
    }

    setupEventListeners() {
        // Botón de toggle en navbar
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Opciones de tema en página de configuraciones
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-theme');
                this.setTheme(theme);
                
                // Actualizar estado visual de las opciones
                themeOptions.forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Detectar cambios de tema del sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.getStoredTheme() === 'system') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    getStoredTheme() {
        return localStorage.getItem('sena-hub-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('sena-hub-theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggleIcon(theme);
        this.currentTheme = theme;
    }

    setTheme(theme) {
        this.applyTheme(theme);
        this.setStoredTheme(theme);
        
        // Mostrar notificación de cambio
        this.showThemeChangeNotification(theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            themeToggle.setAttribute('title', 
                theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'
            );
        }

        // Actualizar opciones en página de configuraciones
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === theme) {
                option.classList.add('active');
            }
        });
    }

    showThemeChangeNotification(theme) {
        // Obtener altura del navbar
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 60;
        
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'position-fixed end-0 p-3';
        toast.style.top = `${navbarHeight + 10}px`; // Posicionar debajo del navbar con margen
        toast.style.zIndex = '9999';
        
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="fas fa-palette text-${theme === 'light' ? 'warning' : 'info'} me-2"></i>
                    <strong class="me-auto">Tema cambiado</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body" style="color:black;">
                    Modo ${theme === 'light' ? 'claro' : 'oscuro'} activado correctamente.
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Manejar el botón de cerrar
        const closeBtn = toast.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });
        }

        // Remover automáticamente después de 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transition = 'opacity 0.3s ease';
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, 3000);
    }

    // Método para obtener el tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Método para verificar si el tema oscuro está activo
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}