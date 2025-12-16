import { request } from './apiClient.js';

export const municipioService = {
    /**
     * Crear un municipio.
     * @param {object} municipioData - Los nuevos datos del municipio.
     * @returns {Promise<object>}
    */
    createMunicipio: (municipioData) => {
        return request(`/municipio/registrar`, {
            method: 'POST',
            body: JSON.stringify(municipioData),
        });
    },

    /**
     * Obtener todos los municipios
     * @returns {Promise<Array>}
     */
    getAllMunicipios: () => {
        const endpoint = `/municipio/obtener-todos`;
        return request(endpoint);
    },

    /**
     * Alias de getAllMunicipios para compatibilidad con controladores
     * @returns {Promise<Array>}
     */
    getMunicipios: () => {
        return request(`/municipio/obtener-todos`);
    },

    /**
     * Obtener un municipio por su nombre
     * @param {string} nombre - El nombre del municipio a buscar
     * @returns {Promise<object>}
     */
    getMunicipioByName: (nombre) => {
        const endpoint = `/municipio/obtener-por-nombre?nom_municipio=${encodeURIComponent(nombre)}`;
        return request(endpoint);
    },

    /**
     * Obtener un municipio por su ID
     * @param {string | number} id_municipio - El ID del municipio
     * @returns {Promise<object>}
     */
    getMunicipioById: (id_municipio) => {
        const endpoint = `/municipio/obtener-por-id/${id_municipio}`;
        return request(endpoint);
    },

    /**
     * Actualizar un municipio
     * @param {string | number} id_municipio - El ID del municipio a actualizar
     * @param {object} municipioData - Los nuevos datos del municipio
     * @returns {Promise<object>}
     */
    updateMunicipio: (id_municipio, municipioData) => {
        return request(`/municipio/editar/${id_municipio}`, {
            method: 'PUT',
            body: JSON.stringify(municipioData),
        });
    },

    /**
     * Eliminar un municipio
     * @param {string | number} id_municipio - El ID del municipio a eliminar
     * @returns {Promise<object>}
     */
    deleteMunicipio: (id_municipio) => {
        return request(`/municipio/eliminar-por-id/${id_municipio}`, {
            method: 'DELETE',
        });
    },
};