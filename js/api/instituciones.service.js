import { request } from './apiClient.js';

export const institucionService = {
    /**
     * Obtener todas las instituciones
     * @returns {Promise<Array>}
     */
    getInstituciones: () => {
        const endpoint = `/institucion/obtener-todas`;
        return request(endpoint);
    },
    
    /**
     * Obtener una institución por su NIT
     * @param {string} nit - El NIT de la institución
     * @returns {Promise<object>}
     */
    getInstitucionByNit: (nit) => {
        const endpoint = `/institucion/obtener-por-nit?nit_institucion=${nit}`;
        return request(endpoint);
    },

    /**
     * Obtener instituciones por nombre
     * @param {string} nombre - El nombre de la institución
     * @returns {Promise<Array>}
     */
    getInstitucionByNombre: (nombre) => {
        const endpoint = `/institucion/obtener-por-nombre?nombre_institucion=${encodeURIComponent(nombre)}`;
        return request(endpoint);
    },

    /**
     * Obtener instituciones por dirección
     * @param {string} direccion - La dirección de la institución
     * @returns {Promise<Array>}
     */
    getInstitucionByDireccion: (direccion) => {
        const endpoint = `/institucion/obtener-por-direccion?direccion=${encodeURIComponent(direccion)}`;
        return request(endpoint);
    },

    /**
     * Obtener instituciones por municipio
     * @param {string} idMunicipio - El ID del municipio
     * @returns {Promise<Array>}
     */
    getInstitucionByMunicipio: (idMunicipio) => {
        const endpoint = `/institucion/obtener-por-municipio?id_municipio=${idMunicipio}`;
        return request(endpoint);
    },

    /**
     * Obtener instituciones por convenios
     * @param {number} cantConvenios - La cantidad de convenios
     * @returns {Promise<Array>}
     */
    getInstitucionByConvenios: (cantConvenios) => {
        const endpoint = `/institucion/obtener-por-convenios?cant_convenios=${cantConvenios}`;
        return request(endpoint);
    },

    /**
     * Obtener instituciones por rango de convenios
     * @param {number} min - Mínimo de convenios
     * @param {number} max - Máximo de convenios
     * @returns {Promise<Array>}
     */
    getInstitucionByRangoConvenios: (min, max) => {
        const endpoint = `/institucion/obtener-rango-convenios?min_convenios=${min}&max_convenios=${max}`;
        return request(endpoint);
    },

    /**
     * Búsqueda avanzada de instituciones
     * @param {object} filters - Filtros de búsqueda
     * @returns {Promise<Array>}
     */
    busquedaAvanzada: (filters) => {
        const params = new URLSearchParams(filters).toString();
        const endpoint = `/institucion/busqueda-avanzada?${params}`;
        return request(endpoint);
    },

    /**
     * Crear una nueva institución
     * @param {object} institucionData - Los datos de la institución (nit_institucion, nombre_institucion, direccion, id_municipio, cant_convenios)
     * @returns {Promise<object>}
     */
    createInstitucion: (institucionData) => {
        return request(`/institucion/registrar`, {
            method: 'POST',
            body: JSON.stringify(institucionData),
        });
    },

    /**
     * Actualizar una institución
     * @param {string} nit - El NIT de la institución a actualizar
     * @param {object} institucionData - Los nuevos datos de la institución (nit_institucion, nombre_institucion, direccion, id_municipio)
     * @returns {Promise<object>}
     */
    updateInstitucion: (nit, institucionData) => {
        return request(`/institucion/editar/${nit}`, {
            method: 'PUT',
            body: JSON.stringify(institucionData),
        });
    },

    /**
     * Eliminar una institución
     * @param {string} nit - El NIT de la institución a eliminar
     * @returns {Promise<object>}
     */
    deleteInstitucion: (nit) => {
        return request(`/institucion/eliminar-por-nit/${nit}`, {
            method: 'DELETE',
        });
    },
};