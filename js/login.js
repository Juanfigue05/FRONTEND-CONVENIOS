// login.js
import { API_BASE_URL } from './api/apiClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('login');
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ocultar mensaje previo
        if (errorDiv) errorDiv.style.display = 'none';

        const correo = document.getElementById('inputEmail')?.value.trim() || '';
        const contrasenia = document.getElementById('inputPassword')?.value || '';

        // Mostrar loading
        const originalBtnHtml = loginBtn ? loginBtn.innerHTML : '';
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
        }

        const formData = new URLSearchParams();
        formData.append('username', correo);
        formData.append('password', contrasenia);

        const loginUrl = `${API_BASE_URL}/access/token`;

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'accept': 'application/json'
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || errData.message || response.statusText || 'Credenciales incorrectas');
            }

            const data = await response.json();
            console.log('Login exitoso:', data);

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Si veníamos en modo dev, limpiarlo al iniciar sesión real
            localStorage.removeItem('dev_mode');

            if (loginBtn) {
                loginBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>¡Acceso concedido!';
                loginBtn.classList.remove('btn-login');
                loginBtn.classList.add('btn-success');
            }

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);

        } catch (error) {
            console.error('Error en login:', error);
            if (errorText) errorText.textContent = error.message || 'Error en autenticación';
            if (errorDiv) errorDiv.style.display = 'block';

            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnHtml;
            }
        }
    });
});