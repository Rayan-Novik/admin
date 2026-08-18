import { useState } from 'react';

export const usePermission = () => {
    // Lê o localStorage instantaneamente no momento que o componente carrega
    const [user] = useState(() => {
        const adminInfo = localStorage.getItem('adminInfo');
        return adminInfo ? JSON.parse(adminInfo) : null;
    });

    const can = (requiredPermission) => {
        if (!user) return false;
        
        // 👑 MODO DEUS
        if (user.is_dono || user.isAdmin || user.role === 'ADMIN') return true;

        // 👷 FUNCIONÁRIOS
        if (user.permissoes && Array.isArray(user.permissoes)) {
            return user.permissoes.includes(requiredPermission);
        }

        return false;
    };

    return { can, user };
};