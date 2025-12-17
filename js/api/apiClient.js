// Cliente central para realizar todas las peticiones a la API.
// Exportamos la base URL para que otros módulos puedan usar la misma configuración
export const API_BASE_URL = 'https://backend-convenios-production.up.railway.app';

/**
 * Cliente central para realizar todas las peticiones a la API.
 * @param {string} endpoint - El endpoint al que se llamará (ej. '/usuario/obtener-todos').
 * @param {object} [options={}] - Opciones para la petición fetch (method, headers, body).
 * @returns {Promise<any>} - La respuesta de la API en formato JSON.
 */                          
export async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    // Opciones de resiliencia
    const timeout = options.timeout ?? 10000; // ms
    const maxRetries = options.retries ?? 1; // número de reintentos para errores transitorios

    // Configuramos las cabeceras por defecto
    const headers = {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...options.headers, // Permite sobrescribir o añadir cabeceras
    };

    // Si hay un token, lo añadimos a la cabecera de Authorization
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Log detallado de la petición
    console.log('=== PETICIÓN API ===');
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', headers);
    if (options.body) {
        console.log('Body:', options.body);
    }

    // Función para realizar la petición con AbortController y timeout
    const doFetch = async (signal) => {
        return await fetch(url, { ...options, headers, signal });
    };

    let attempt = 0;
    const retryableStatus = new Set([502, 503, 504]);

    while (true) {
        attempt++;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await doFetch(controller.signal);
            clearTimeout(id);

            console.log('=== RESPUESTA API ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            // Manejo centralizado del error 401 (Token inválido/expirado)
            if (response.status === 401) {
                alert('No tiene permisos');
                // Emitir evento global para que la app pueda reaccionar (p. ej. redirigir a login)
                try { window.dispatchEvent(new CustomEvent('api:unauthorized')); } catch (e) {}
                throw new Error('Sesión expirada o sin permisos.');
            }

            if (response.status === 403) {
                alert('Token inválido');
                try { window.dispatchEvent(new CustomEvent('api:forbidden')); } catch (e) {}
                throw new Error('Token inválido.');
            }

            // Si la respuesta no es OK, intentamos extraer el error
            if (!response.ok) {
                // Si es un error transitorio, intentamos reintentar
                if (retryableStatus.has(response.status) && attempt <= maxRetries) {
                    const backoff = 200 * Math.pow(2, attempt - 1);
                    console.warn(`Respuesta ${response.status} — reintentando en ${backoff}ms (intento ${attempt}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, backoff));
                    continue; // reintenta
                }

                let errorMessage = 'Ocurrió un error en la petición.';
                let errorData = null;

                try {
                    // Intentar parsear como JSON
                    errorData = await response.json();
                    console.error('Error Data:', errorData);

                    // Extraer mensaje de error en diferentes formatos posibles
                    if (errorData.detail) {
                        errorMessage = typeof errorData.detail === 'string' 
                            ? errorData.detail 
                            : JSON.stringify(errorData.detail);
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    } else {
                        errorMessage = JSON.stringify(errorData);
                    }
                } catch (parseError) {
                    try {
                        const textError = await response.text();
                        console.error('Error Text:', textError);
                        errorMessage = textError || `Error ${response.status}: ${response.statusText}`;
                    } catch {
                        errorMessage = `Error ${response.status}: ${response.statusText}`;
                    }
                }

                const error = new Error(errorMessage);
                error.status = response.status;
                error.statusText = response.statusText;
                error.response = errorData;

                throw error;
            }

            // Si la respuesta no tiene contenido (ej. status 204), devolvemos un objeto vacío
            if (response.status === 204) {
                console.log('Respuesta 204: Sin contenido');
                return {};
            }

            // Parsear respuesta exitosa
            const data = await response.json();
            console.log('Respuesta exitosa:', data);
            return data;

        } catch (error) {
            clearTimeout(id);

            // Si fue abort por timeout
            if (error.name === 'AbortError') {
                console.warn(`❌ Petición a ${endpoint} abortada por timeout (${timeout}ms)`);
                if (attempt <= maxRetries) {
                    const backoff = 200 * Math.pow(2, attempt - 1);
                    console.warn(`Reintentando en ${backoff}ms (intento ${attempt}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, backoff));
                    continue; // reintentar
                }
                error.message = `Timeout de ${timeout}ms`; // mejorar mensaje para UI
            }

            // Errores de red (TypeError) o reintentos extenuados
            console.error(`❌ Error en la petición a ${endpoint}:`, error);
            console.error('Detalles del error:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                response: error.response
            });

            // Emitir evento global para que la UI pueda mostrar notificaciones,
            // salvo si la opción suppressApiErrorEvent fue activada por el llamador.
            try {
                if (!options.suppressApiErrorEvent) {
                    window.dispatchEvent(new CustomEvent('api:error', { detail: { message: error.message, status: error.status } }));
                }
            } catch (e) {}

            throw error;
        }
    }
}