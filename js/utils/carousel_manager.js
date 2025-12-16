/**
 * Gestor del Carrusel para SENA HUB
 * Maneja la carga, previsualización y guardado de imágenes del carrusel
 */

class CarouselManager {
    constructor() {
        this.slides = [];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
        this.init();
    }

    init() {
        console.log('🎠 Carousel Manager inicializado');
        this.loadSavedData();
        this.setupEventListeners();
        this.checkImages(); // Verificar que las imágenes se carguen
    }

    checkImages() {
        // Verificar que todas las imágenes preview existan
        for (let i = 1; i <= 6; i++) {
            const preview = document.getElementById(`preview-${i}`);
            if (preview) {
                preview.onerror = () => {
                    console.warn(`⚠️ No se pudo cargar la imagen: ${preview.src}`);
                    // Usar una imagen placeholder si no se carga
                    preview.style.backgroundColor = '#e9ecef';
                    preview.style.display = 'flex';
                    preview.style.alignItems = 'center';
                    preview.style.justifyContent = 'center';
                };
                
                preview.onload = () => {
                    console.log(`✅ Imagen ${i} cargada correctamente`);
                };
            }
        }
    }

    setupEventListeners() {
        // Event listeners para los inputs de archivos
        for (let i = 1; i <= 6; i++) {
            const fileInput = document.getElementById(`file-${i}`);
            if (fileInput) {
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e, i));
            }
        }

        // Botón guardar cambios
        const saveBtn = document.getElementById('saveCarouselBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCarouselData());
        }

        // Botón restaurar original
        const resetBtn = document.getElementById('resetCarouselBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToDefault());
        }
    }

    handleFileSelect(event, slideNumber) {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validar tipo de archivo
        if (!this.acceptedFormats.includes(file.type)) {
            this.showNotification('error', 'Formato no válido. Solo se aceptan imágenes JPG y PNG.');
            event.target.value = '';
            return;
        }

        // Validar tamaño
        if (file.size > this.maxFileSize) {
            this.showNotification('error', 'La imagen es muy grande. El tamaño máximo es 5MB.');
            event.target.value = '';
            return;
        }

        // Leer y previsualizar la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(`preview-${slideNumber}`);
            if (preview) {
                preview.src = e.target.result;
                preview.style.backgroundColor = 'transparent';
                this.showNotification('success', `Imagen ${slideNumber} cargada. Recuerda guardar los cambios.`);
            }
        };
        reader.readAsDataURL(file);
    }

    saveCarouselData() {
        const carouselData = [];

        for (let i = 1; i <= 6; i++) {
            const preview = document.getElementById(`preview-${i}`);

            if (preview && preview.src) {
                carouselData.push({
                    id: i,
                    image: preview.src
                });
            }
        }

        // Guardar en localStorage
        try {
            localStorage.setItem('sena-carousel-data', JSON.stringify(carouselData));
            this.showNotification('success', '¡Cambios guardados! Las imágenes se actualizarán en la página de inicio.');
            
            // Actualizar también en inicio.html si está abierto
            this.updateHomePage();
        } catch (error) {
            console.error('Error al guardar:', error);
            if (error.name === 'QuotaExceededError') {
                this.showNotification('error', 'No hay suficiente espacio. Intenta con imágenes más pequeñas.');
            } else {
                this.showNotification('error', 'Error al guardar los cambios. Intenta de nuevo.');
            }
        }
    }

    loadSavedData() {
        try {
            const savedData = localStorage.getItem('sena-carousel-data');
            if (savedData) {
                const carouselData = JSON.parse(savedData);
                
                carouselData.forEach(slide => {
                    const preview = document.getElementById(`preview-${slide.id}`);
                    if (preview && slide.image) {
                        preview.src = slide.image;
                    }
                });

                console.log('✅ Datos del carrusel cargados desde localStorage');
            }
        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
        }
    }

    updateHomePage() {
        // Esta función actualiza el carrusel en inicio.html si está en otra pestaña
        // Usando el evento storage de localStorage
        window.dispatchEvent(new Event('storage'));
    }

    resetToDefault() {
        if (!confirm('¿Estás seguro de que deseas restaurar las imágenes originales? Esta acción no se puede deshacer.')) {
            return;
        }

        // Restaurar imágenes originales
        const defaultImages = [
            'img/carrusel1.png',
            'img/carrusel2.png',
            'img/carrusel3.png',
            'img/carrusel4.png',
            'img/carrusel5.png',
            'img/carrusel6.png'
        ];

        defaultImages.forEach((imagePath, index) => {
            const slideNumber = index + 1;
            const preview = document.getElementById(`preview-${slideNumber}`);
            
            if (preview) {
                preview.src = imagePath;
            }

            // Limpiar inputs de archivo
            const fileInput = document.getElementById(`file-${slideNumber}`);
            if (fileInput) fileInput.value = '';
        });

        // Limpiar localStorage
        localStorage.removeItem('sena-carousel-data');
        
        this.showNotification('success', 'Carrusel restaurado a las imágenes originales.');
    }

    showNotification(type, message) {
        // Obtener altura del navbar
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 60;

        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'position-fixed end-0 p-3';
        toast.style.top = `${navbarHeight + 10}px`;
        toast.style.zIndex = '9999';
        
        const iconClass = type === 'success' ? 'fa-check-circle text-success' : 'fa-exclamation-circle text-danger';
        
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="fas ${iconClass} me-2"></i>
                    <strong class="me-auto">${type === 'success' ? 'Éxito' : 'Error'}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body" style="color:black;">
                    ${message}
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

        // Remover automáticamente después de 4 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transition = 'opacity 0.3s ease';
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }
        }, 4000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de configuraciones
    if (document.getElementById('carouselManager')) {
        window.carouselManager = new CarouselManager();
    }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CarouselManager;
}