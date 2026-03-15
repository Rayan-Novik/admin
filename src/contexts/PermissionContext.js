import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    const loadPermissions = useCallback(async () => {
        try {
            setLoading(true);
            // Pegamos o token do adminInfo para garantir que estamos logados
            const adminInfo = localStorage.getItem('adminInfo');
            if (!adminInfo) {
                setLoading(false);
                return;
            }

            const { data } = await api.get('/permissoes');
            
            // Garantimos que 'data' seja um objeto válido
            setPermissions(data || {});
        } catch (error) {
            console.error("Erro ao carregar permissões do servidor:", error);
            // Em caso de erro, não limpamos as permissões para não deslogar o usuário visualmente
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    // Função para verificar se o cargo tem a permissão
    const checkPermission = (role, action) => {
        if (loading) return false;
        if (!role || !permissions[role]) return false;
        return permissions[role].includes(action);
    };

    return (
        <PermissionContext.Provider value={{ 
            permissions, 
            setPermissions, 
            loadPermissions, 
            can: checkPermission, 
            loading 
        }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissionContext = () => useContext(PermissionContext);