import { userService } from './api/user.service.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const successDiv = document.getElementById('success-message');
    const successText = document.getElementById('success-text');
    const btnRegister = document.getElementById('btnRegister');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ocultar mensajes previos
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';

        const nombre = document.getElementById('inputNombre')?.value.trim() || '';
        const correo = document.getElementById('inputEmail')?.value.trim() || '';
        const documento = document.getElementById('inputDocumento')?.value.trim() || '';
        const password = document.getElementById('inputPassword')?.value || '';
        const passwordConfirm = document.getElementById('inputPasswordConfirm')?.value || '';

        // Validaciones
        if (password !== passwordConfirm) {
            if (errorText) errorText.textContent = 'Las contraseñas no coinciden';
            if (errorDiv) errorDiv.style.display = 'block';
            return;
        }

        if (nombre.length < 3) {
            if (errorText) errorText.textContent = 'El nombre debe tener al menos 3 caracteres';
            if (errorDiv) errorDiv.style.display = 'block';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            if (errorText) errorText.textContent = 'Ingresa un correo válido';
            if (errorDiv) errorDiv.style.display = 'block';
            return;
        }

        if (documento.length < 8 || documento.length > 12) {
            if (errorText) errorText.textContent = 'El documento debe tener entre 8 y 12 caracteres';
            if (errorDiv) errorDiv.style.display = 'block';
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,}$/;
        if (!passwordRegex.test(password)) {
            if (errorText) errorText.textContent = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un caracter especial';
            if (errorDiv) errorDiv.style.display = 'block';
            return;
        }

        // Mostrar loading en el botón
        const originalBtnText = btnRegister ? btnRegister.innerHTML : '';
        if (btnRegister) {
            btnRegister.disabled = true;
            btnRegister.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta...';
        }

        try {
            const userData = {
                nombre_completo: nombre,
                id_rol: 2,
                correo: correo,
                num_documento: documento,
                contra_encript: password,
                estado: true
            };

            await userService.createUser(userData);

            if (successText) successText.textContent = '¡Cuenta creada exitosamente! Redirigiendo al login...';
            if (successDiv) successDiv.style.display = 'block';

            if (btnRegister) {
                btnRegister.innerHTML = '<i class="fas fa-check-circle me-2"></i>¡Cuenta Creada!';
                btnRegister.classList.remove('btn-register');
                btnRegister.classList.add('btn-success');
            }

            registerForm.reset();

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Error en registro:', error);
            if (errorText) errorText.textContent = error.message || 'Error al registrar. Intenta nuevamente.';
            if (errorDiv) errorDiv.style.display = 'block';

            if (btnRegister) {
                btnRegister.disabled = false;
                btnRegister.innerHTML = originalBtnText;
            }
        }
    });
});
