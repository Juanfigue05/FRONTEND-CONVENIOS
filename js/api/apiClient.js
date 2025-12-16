// Cliente central para realizar todas las peticiones a la API.

const API_BASE_URL = 'https://backend-convenios-production.up.railway.app';

/**
 * Cliente central para realizar todas las peticiones a la API.
 * @param {string} endpoint - El endpoint al que se llamará (ej. '/usuario/obtener-todos').
 * @param {object} [options={}] - Opciones para la petición fetch (method, headers, body).
 * @returns {Promise<any>} - La respuesta de la API en formato JSON.
 */                          
export async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');

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

    try {
        const response = await fetch(url, { ...options, headers });

        console.log('=== RESPUESTA API ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        // Manejo centralizado del error 401 (Token inválido/expirado)
        if (response.status === 401) {
            alert("No tiene permisos");
            throw new Error('Sesión expirada o sin permisos.');
        }

        if (response.status === 403) {
            alert("Token inválido");
            throw new Error('Token inválido.');
        }

        // Si la respuesta no es OK, intentamos extraer el error
        if (!response.ok) {
            let errorMessage = 'Ocurrió un error en la petición.';
            let errorData = null;

            try {
                // Intentar parsear como JSON
                errorData = await response.json();
                console.error('Error Data:', errorData);

                // Extraer mensaje de error en diferentes formatos posibles
                if (errorData.detail) {
                    // FastAPI style: { "detail": "mensaje" }
                    errorMessage = typeof errorData.detail === 'string' 
                        ? errorData.detail 
                        : JSON.stringify(errorData.detail);
                } else if (errorData.message) {
                    // Formato estándar: { "message": "mensaje" }
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    // Otro formato común: { "error": "mensaje" }
                    errorMessage = errorData.error;
                } else if (typeof errorData === 'string') {
                    // Si es un string directo
                    errorMessage = errorData;
                } else {
                    // Si es un objeto complejo, convertirlo a string
                    errorMessage = JSON.stringify(errorData);
                }
            } catch (parseError) {
                // Si no se puede parsear como JSON, intentar leer como texto
                try {
                    const textError = await response.text();
                    console.error('Error Text:', textError);
                    errorMessage = textError || `Error ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
            }

            // Crear error con información completa
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
        console.error(`❌ Error en la petición a ${endpoint}:`, error);
        console.error('Detalles del error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            response: error.response
        });
        throw error;
    }
}