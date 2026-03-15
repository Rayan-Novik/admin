import { usePermissionContext } from '../contexts/PermissionContext';

export const usePermission = () => {
    const { permissions, loading } = usePermissionContext();

    // Função auxiliar para pegar o cargo do usuário logado
    const getUserRole = () => {
        // ✅ Ajustado para ler 'adminInfo', conforme seu App.js
        const userStr = localStorage.getItem('adminInfo'); 
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.role; // 'ADMIN', 'CAIXA', etc.
        } catch (e) {
            return null;
        }
    };

    const role = getUserRole();

    const can = (actionId) => {
        // Se as permissões ainda não carregaram, bloqueia por segurança
        if (loading) return false;

        // Se não tem usuário logado ou não tem cargo, bloqueia
        if (!role) return false;

        // ✅ SUPER ADMIN (GOD MODE)
        // Se for ADMIN, libera TUDO automaticamente, sem checar a lista.
        if (role === 'ADMIN') return true;

        // Se não existem regras definidas para esse cargo no banco, bloqueia
        if (!permissions || !permissions[role]) return false;

        // Verifica se a ação (ex: 'view_pdv') está na lista permitida do cargo
        return permissions[role].includes(actionId);
    };

    return { can, role, loading };
};