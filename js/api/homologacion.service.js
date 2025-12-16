import { request } from './apiClient.js';

export const homologacionService = {
    getHomologaciones: () => {
        const endpoint = `/homologaciones/obtener-todas-homologaciones/`;
        
        // La lógica es mucho más simple ahora, solo llamamos a nuestro cliente central.
        let respuesta = request(endpoint);

        return respuesta;
    },

    /**
     * Crear un homologación.
     * @param {object} homologacionData - Los nuevos datos de la homologación.
     * @returns {Promise<object>}
    */

    createHomologacion: (homologacionData) => {
        return request (`/homologaciones/registrar`, {
        method: 'POST',
        body: JSON.stringify(homologacionData)
        });
    },

    /**
     * Obtener homologación por id.
     * @param {string} id_homologacion
     * @returns {Promise<object>}
    */

    getHomologacionById: (id_homologacion) => {
        const endpoint = `/homologaciones/obtener-por-id/${id_homologacion}`;
        return request(endpoint);
    },

    /**
     * Obtener homologación por nivel programa.
     * @param {string} nivel_programa
     * @returns {Promise<object>}
    */

    getHomologacionByLevel: (nivel_programa) => {
        const endpoint = `/homologaciones/obtener-por-nivel-programa/${nivel_programa}`;
        return request(endpoint);
    },

    /**
     * Obtener homologación por nombre programa sena.
     * @param {string} nombre_programa_sena
     * @returns {Promise<object>}
    */

    gethomologacionByName: (nombre_programa_sena) => {
        const endpoint = `/homologaciones/obtener-por-nombre-programa/${nombre_programa_sena}`;
        return request(endpoint);
    },

    /**
     * Actualizar un homologación.
     * @param {string | number} homologacionId
     * @param {object} homologacionData 
     * @returns {Promise<object>}
    */
    
    updateHomologacion: (homologacionId, homologacionData) => {
        return request(`/homologaciones/editar/${homologacionId}`, {
        method: 'PUT',
        body: JSON.stringify(homologacionData)
        });
    },

    /**
     * Eliminar un homologación.
     * @param {string | number} homologacionId
     * @param {object} homologacionData 
     * @returns {Promise<object>}
    */

    deleteHomologacion: (homologacionId, homologacionData) => {
        return request(`/homologaciones/eliminar-por-id/${homologacionId}`,{
        method: 'DELETE',
        body: JSON.stringify(homologacionData)
        })
    }

};