import { request } from './apiClient.js';

export const userService = {
    /**
     * Obtener todos los usuarios (requiere autenticación)
     * @returns {Promise<Array>}
     */
    getUsers: () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            return Promise.reject(new Error('Información de usuario no encontrada.'));
        }
        
        const endpoint = `/usuario/obtener-todos-secure`;
        return request(endpoint);
    },
    
    /**
     * Alias de getUsers para compatibilidad
     * @returns {Promise<Array>}
     */
    getUsuarios: function() {
        return this.getUsers();
    },
    
    /**
     * Obtener un usuario por su email.
     * @param {string} correo - El correo del usuario a buscar.
     * @returns {Promise<object>}
    */
    getUserByEmail: (correo) => {
        const endpoint = `/usuario/obtener-por-correo/${correo}`;
        return request(endpoint);
    },

    /**
     * Obtener un usuario por su ID
     * @param {number} id - El ID del usuario
     * @returns {Promise<object>}
     */
    getUsuarioById: (id) => {
        const endpoint = `/usuario/obtener-por-id/${id}`;
        return request(endpoint);
    },

    /**
     * Actualizar un usuario.
     * @param {string | number} userId - El ID del usuario a actualizar.
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
    */
    updateUser: (userId, userData) => {
        return request(`/usuario/editar/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Alias de updateUser para compatibilidad
     * @param {string | number} userId - El ID del usuario a actualizar.
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
     */
    updateUsuario: function(userId, userData) {
        return this.updateUser(userId, userData);
    },

    /**
     * Modifica el estado de un usuario (generalmente para desactivarlo).
     * @param {string | number} userId - El ID del usuario a modificar.
     * @param {boolean} newStatus - Nuevo estado
     * @returns {Promise<object>}
     */
    changueEstatusUser: (userId, newStatus) => {
        return request(`/usuario/cambiar-estado/${userId}?nuevo_estado=${newStatus}`, {
            method: 'PUT',
        });
    },

    /**
     * Crear un usuario.
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
    */
    createUser: (userData) => {
        return request(`/usuario/registrar`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Alias de createUser para compatibilidad
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
     */
    createUsuario: function(userData) {
        return this.createUser(userData);
    },

    /**
     * Eliminar un usuario
     * @param {string | number} userId - El ID del usuario a eliminar
     * @returns {Promise<object>}
     */
    deleteUsuario: (userId) => {
        return request(`/usuario/eliminar-por-id/${userId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Obtener todos los roles disponibles
     * @returns {Promise<Array>}
     */
    getRoles: () => {
        return request(`/usuario/roles`);
    },
};