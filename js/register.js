import { userService } from './api/user.service.js';

/**
 * Inicializa la página de registro: configura el listener del formulario
 * que captura los datos, valida y llama al servicio para crear el usuario.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elemento del formulario de registro
    const registerForm = document.getElementById('registerForm');
    const alertDiv = document.getElementById('alert');

    if (registerForm) {
        /**
         * Manejador del evento submit del formulario de registro.
         * Recopila los campos, construye el objeto `userData` y llama
         * a `userService.createUser`. Muestra mensajes de éxito/error.
         */
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Limpiar alertas previas
            alertDiv.classList.add('d-none');
            alertDiv.classList.remove('alert-danger', 'alert-success');
            alertDiv.textContent = '';

            const formData = new FormData(registerForm);
            const userData = {
                nombre_completo: formData.get('full_name'),
                correo: formData.get('email'),
                num_documento: formData.get('num_documento'),
                contra_encript: formData.get('contrasena'),
                id_rol: 2, // 2 = Usuario estándar (según convención observada)
                estado: true
            };

            try {
                await userService.createUser(userData);

                // Mostrar éxito
                alertDiv.classList.remove('d-none');
                alertDiv.classList.add('alert-success');
                alertDiv.textContent = 'Usuario registrado exitosamente. Redirigiendo...';

                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (error) {
                // Mostrar error
                console.error('Error al registrar:', error);
                alertDiv.classList.remove('d-none');
                alertDiv.classList.add('alert-danger');
                alertDiv.textContent = error.message || 'Error al registrar el usuario. Inténtalo de nuevo.';
            }
        });
    }
});
