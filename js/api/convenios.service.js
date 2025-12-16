import { request } from './apiClient.js';

export const convenioService = {
    /**
     * Obtener todos los convenios
     * @returns {Promise<Array>}
     */
    getConvenios: () => {
        return request(`/convenios/obtener-todos`);
    },
    
    /**
     * Obtener un convenio por su ID
     * @param {number} id - El ID del convenio
     * @returns {Promise<object>}
     */
    getConvenioById: (id) => {
        return request(`/convenios/obtener-por-id/${id}`);
    },

    /**
     * Obtener convenios por número de convenio
     * @param {string} numConvenio - El número del convenio
     * @returns {Promise<Array>}
     */
    getConvenioByNumero: (numConvenio) => {
        return request(`/convenios/obtener-por-numero-convenio?num_convenio=${encodeURIComponent(numConvenio)}`);
    },

    /**
     * Obtener convenios por NIT de institución
     * @param {string} nit - El NIT de la institución
     * @returns {Promise<Array>}
     */
    getConvenioByNit: (nit) => {
        return request(`/convenios/obtener-por-nit-institucion?nit_institucion=${encodeURIComponent(nit)}`);
    },

    /**
     * Obtener convenios por nombre de institución
     * @param {string} nombre - El nombre de la institución
     * @returns {Promise<Array>}
     */
    getConvenioByNombreInstitucion: (nombre) => {
        return request(`/convenios/obtener-por-nombre-institucion?nombre_institucion=${encodeURIComponent(nombre)}`);
    },

    /**
     * Obtener convenios por estado
     * @param {string} estado - El estado del convenio
     * @returns {Promise<Array>}
     */
    getConvenioByEstado: (estado) => {
        return request(`/convenios/obtener-por-estado-convenio?estado_convenio=${encodeURIComponent(estado)}`);
    },

    /**
     * Obtener convenios por tipo de convenio
     * @param {string} tipo - El tipo de convenio
     * @returns {Promise<Array>}
     */
    getConvenioByTipo: (tipo) => {
        return request(`/convenios/obtener-por-tipo-convenio?tipo_convenio=${encodeURIComponent(tipo)}`);
    },

    /**
     * Obtener convenios por tipo de proceso
     * @param {string} tipoProceso - El tipo de proceso
     * @returns {Promise<Array>}
     */
    getConvenioByTipoProceso: (tipoProceso) => {
        return request(`/convenios/obtener-por-tipo-proceso?tipo_proceso=${encodeURIComponent(tipoProceso)}`);
    },

    /**
     * Obtener convenios por supervisor
     * @param {string} supervisor - El nombre del supervisor
     * @returns {Promise<Array>}
     */
    getConvenioBySupervisor: (supervisor) => {
        return request(`/convenios/obtener-por-supervisor?supervisor=${encodeURIComponent(supervisor)}`);
    },

    /**
     * Obtener convenios por tipo de convenio SENA
     * @param {string} tipoConvenioSena - El tipo de convenio SENA
     * @returns {Promise<Array>}
     */
    getConvenioByTipoConvenioSena: (tipoConvenioSena) => {
        return request(`/convenios/obtener-por-tipo-convenio-sena?tipo_convenio_sena=${encodeURIComponent(tipoConvenioSena)}`);
    },

    /**
     * Obtener convenios por persona de apoyo
     * @param {string} personaApoyo - El nombre de la persona de apoyo
     * @returns {Promise<Array>}
     */
    getConvenioByPersonaApoyo: (personaApoyo) => {
        return request(`/convenios/obtener-por-persona-apoyo?persona_apoyo_fpi=${encodeURIComponent(personaApoyo)}`);
    },

    /**
     * Obtener convenios por rango de fechas de firma
     * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
     * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
     * @returns {Promise<Array>}
     */
    getConvenioByRangoFechasFirma: (fechaInicio, fechaFin) => {
        return request(`/convenios/obtener-por-rango-fechas-firma?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
    },

    /**
     * Obtener convenios por rango de fechas de inicio
     * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
     * @param {string} fechaFin - Fecha fin (YYYY-MM-DD)
     * @returns {Promise<Array>}
     */
    getConvenioByRangoFechasInicio: (fechaInicio, fechaFin) => {
        return request(`/convenios/obtener-por-rango-fechas-inicio?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
    },

    /**
     * Obtener convenios por número de proceso
     * @param {string} numProceso - El número de proceso
     * @returns {Promise<Array>}
     */
    getConvenioByNumProceso: (numProceso) => {
        return request(`/convenios/obtener-por-numero-proceso?num_proceso=${encodeURIComponent(numProceso)}`);
    },

    /**
     * Buscar convenios por objetivo
     * @param {string} palabraClave - Palabra clave para buscar en el objetivo
     * @returns {Promise<Array>}
     */
    getConvenioByObjetivo: (palabraClave) => {
        return request(`/convenios/buscar-por-objetivo?palabra_clave=${encodeURIComponent(palabraClave)}`);
    },

    /**
     * Crear un nuevo convenio
     * @param {object} convenioData - Los datos del convenio
     * @returns {Promise<object>}
     */
    createConvenio: (convenioData) => {
        return request(`/convenios/registrar`, {
            method: 'POST',
            body: JSON.stringify(convenioData),
        });
    },

    /**
     * Actualizar un convenio
     * @param {number} id - El ID del convenio a actualizar
     * @param {object} convenioData - Los nuevos datos del convenio
     * @returns {Promise<object>}
     */
    updateConvenio: (id, convenioData) => {
        return request(`/convenios/editar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(convenioData),
        });
    },

    /**
     * Eliminar un convenio
     * @param {number} id - El ID del convenio a eliminar
     * @returns {Promise<object>}
     */
    deleteConvenio: (id) => {
        return request(`/convenios/eliminar-por-id/${id}`, {
            method: 'DELETE',
        });
    },
};