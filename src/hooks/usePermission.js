import { useState } from 'react';

export const usePermission = () => {
    // Lê o localStorage instantaneamente no momento que o componente carrega
    const [user] = useState(() => {
        const adminInfo = localStorage.getItem('adminInfo');
        return adminInfo ? JSON.parse(adminInfo) : null;
    });

    // 🟢 Lê os módulos ativos para o sistema de Feature Flags (Bloqueio de Manutenção)
    const [activeModules] = useState(() => {
        const modules = localStorage.getItem('activeModules');
        // Se não existir no localStorage, assume que o FISCAL está ativo por padrão para não quebrar sua tela
        return modules ? JSON.parse(modules) : ['FISCAL']; 
    });

    // 🟢 Função para verificar permissão do cargo (RBAC)
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

    // 🟢 Função para verificar se o módulo está ligado (Feature Flag)
    const isModuleActive = (moduleName) => {
        if (!moduleName) return true;
        return activeModules.includes(moduleName);
    };

    return { can, user, isModuleActive, activeModules };
};