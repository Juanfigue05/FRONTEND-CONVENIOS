import { request } from './apiClient.js';

export const panelService = {
    /**
     * Obtener todas las instituciones para el dashboard
     * @returns {Promise<Array>}
     */
    getInstituciones: () => {
        const endpoint = `/institucion/obtener-todas`;
        return request(endpoint);
    },
    
    /**
     * Obtener todos los convenios para el dashboard
     * @returns {Promise<Array>}
     */
    getConvenios: () => {
        const endpoint = `/convenios/obtener-todos`;
        return request(endpoint);
    },

    /**
     * Obtener todas las homologaciones para el dashboard
     * @returns {Promise<Array>}
     */
    getHomologaciones: () => {
        const endpoint = `/homologaciones/obtener-todas-homologaciones/`;
        return request(endpoint);
    },

    /**
     * Obtener todos los usuarios para el dashboard
     * @returns {Promise<Array>}
     */
    getUsuarios: () => {
        const endpoint = `/usuario/obtener-todos-secure`;
        return request(endpoint);
    },
    
    /**
     * Obtener resumen completo para el dashboard
     * Hace múltiples llamadas y retorna datos agregados
     * @returns {Promise<object>}
     */
    async getResumenDashboard() {
        try {
            const [instituciones, convenios, homologaciones, usuarios] = await Promise.all([
                this.getInstituciones(),
                this.getConvenios(),
                this.getHomologaciones(),
                this.getUsuarios()
            ]);

            return {
                totalInstituciones: instituciones?.length || 0,
                totalConvenios: convenios?.length || 0,
                totalHomologaciones: homologaciones?.length || 0,
                totalUsuarios: usuarios?.length || 0,
                instituciones,
                convenios,
                homologaciones,
                usuarios
            };
        } catch (error) {
            console.error('Error al obtener resumen del dashboard:', error);
            throw error;
        }
    }
};
