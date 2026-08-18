import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import api from '../services/api';

// IMPORTA OS COMPONENTES VISUAIS SEPARADOS
import DesktopMenu from './ui/desktop/menu/DesktopMenu';
import MobileMenu from './ui/mobile/menu/MobileMenu';

const MENU_GROUPS_CONFIG = [
    {
        title: "Principal",
        id: "principal",
        items: [
            { to: "/", icon: "bi bi-grid-1x2", text: "Dashboard", permission: "DASHBOARD_VIEW" },
        ]
    },
    {
        title: "Loja Física",
        icon: "bi bi-shop",
        id: "pdv",
        items: [
            { to: "/admin/pdv", icon: "bi bi-pc-display", text: "Frente de Caixa (PDV)", permission: "PDV_ACCESS" },
            { to: "/admin/comandas", icon: "bi bi-phone-vibrate", text: "Comandas / Mesas", permission: "PDV_ACCESS" },
            { to: "/admin/mesas", icon: "bi bi-layout-wtf", text: "Gerenciar Mesas", permission: "CONFIG_UNIDADES" },
        ]
    },
    {
        title: "Loja Online",
        icon: "bi bi-bag",
        id: "ecommerce",
        items: [
            { to: "/products", icon: "bi bi-box-seam", text: "Produtos", permission: "PRODUTOS_VIEW" },
            { to: "/admin/ifood", icon: "bi bi-shop text-danger", text: "Painel iFood", permission: "IFOOD_VIEW" },
            { to: "/orders", icon: "bi bi-cart2", text: "Pedidos Online", permission: "PEDIDOS_VIEW" },
            { to: "/admin/suppliers", icon: "bi bi-truck", text: "Fornecedores", permission: "ESTOQUE_MANAGE" },
            { to: "/admin/reviews", icon: "bi bi-star", text: "Avaliações", permission: "PRODUTOS_VIEW" },
            { to: "/reports", icon: "bi bi-graph-up", text: "Relatórios de Vendas", permission: "FINANCEIRO_VIEW" },
        ]
    },
    {
        title: "Configuração da Loja",
        icon: "bi bi-sliders",
        id: "store_config",
        items: [
            { to: "/admin/perfil-loja", icon: "bi bi-shop", text: "Dados Pessoais", permission: "CONFIG_UNIDADES" },
            { to: "/admin/customizer", icon: "bi bi-palette", text: "Aparência", permission: "CONFIG_APARENCIA" },
            { to: "/admin/marketing", icon: "bi bi-badge-ad", text: "Campanhas", permission: "MARKETING_VIEW" },
            { to: "/admin/domain", icon: "bi bi-globe", text: "Domínio Próprio", permission: "CONFIG_DOMINIO" },
            { to: "/admin/stores", icon: "bi bi-shop-window", text: "Unidades Físicas", permission: "CONFIG_UNIDADES" },
            { to: "/admin/shipping", icon: "bi bi-truck-flatbed", text: "Regras de Envio", permission: "CONFIG_ENVIO" },
            { to: "/admin/pix-discount", icon: "bi bi-lightning-charge", text: "Desconto Pix", permission: "CONFIG_PIX" },
            { to: "/admin/email-smtp", icon: "bi bi-envelope", text: "Servidor de E-mail", permission: "CONFIG_EMAIL" },
        ]
    },
    {
        title: "Integrações & API",
        icon: "bi bi-braces",
        id: "api_config",
        items: [
            { to: "/settings/gateways", icon: "bi bi-credit-card", text: "Gateways Pagamento", permission: "CONFIG_GATEWAYS" },
            { to: "/admin/api-keys", icon: "bi bi-code-slash", text: "Integração", permission: "CONFIG_INTEGRATIONS" },
            { to: "/admin/public-api", icon: "bi bi-key", text: "Chaves de API", permission: "CONFIG_INTEGRATIONS" },
        ]
    },
    {
        title: "Administrativo",
        icon: "bi bi-gear",
        id: "admin",
        items: [
            { to: "/admin/minha-fatura", icon: "bi bi-receipt", text: "Minha Assinatura", permission: "FINANCEIRO_VIEW" },
            { to: "/admin/gestao-financeira", icon: "bi bi-cash-coin", text: "Contas Pagar/Receber", permission: "CONTAS_MANAGE" },
            { to: "/admin/financeiro", icon: "bi bi-file-earmark-ruled", text: "Auditoria Financeira", permission: "FINANCEIRO_VIEW" },
            { to: "/admin/users", icon: "bi bi-people", text: "Usuários", permission: "EQUIPE_VIEW" },
            { to: "/admin/permissoes", icon: "bi bi-shield-lock", text: "Permissões", permission: "EQUIPE_VIEW" },
            { to: "/admin/impressoras", icon: "bi bi-printer", text: "Impressoras", permission: "CONFIG_UNIDADES" },
        ]
    },
    {
        title: "Fiscal",
        icon: "bi bi-building",
        id: "Fiscal",
        items: [
            { to: "/admin/notas-fiscais", icon: "bi bi-receipt-cutoff", text: "Notas de Saída", permission: "FINANCEIRO_VIEW" },
            { to: "/admin/notas-entrada", icon: "bi bi-box-arrow-in-down", text: "Notas de Entrada", permission: "ESTOQUE_MANAGE" }, // 🟢 NOVO BOTÃO
            { to: "/admin/config-fiscal", icon: "bi bi-building-gear", text: "Configuração Fiscal", permission: "CONFIG_INTEGRATIONS" },
        ]
    },
    {
        title: "Atendimento",
        icon: "bi bi-chat-dots",
        id: "atendimento",
        items: [
            { to: "/admin/chat", icon: "bi bi-whatsapp", text: "Chat / WhatsApp", permission: "WHATSAPP_VIEW" },
            { to: "/admin/respostas-rapidas", icon: "bi bi-lightning-charge", text: "Respostas Rápidas", permission: "WHATSAPP_VIEW" },
        ]
    },
    {
        title: "Gestão SaaS (Master)",
        icon: "bi bi-hdd-network",
        id: "saas_master",
        items: [
            { to: "/admin/saas/tenants", icon: "bi bi-buildings", text: "Empresas Cadastradas" },
            { to: "/admin/saas/planos", icon: "bi bi-tags", text: "Gerenciar Planos" },
            { to: "/admin/saas/faturamento", icon: "bi bi-pie-chart", text: "Faturamento Global" },
            { to: "/admin/saas/whatsapp", icon: "bi bi-whatsapp", text: "WhatsApp Central" },
        ]
    }
];

// Instância do áudio global
const notificationAudio = new Audio('/notificacao.mp3');

const Sidebar = ({ onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
    const [openMenus, setOpenMenus] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('themeMode') === 'dark');

    const [totalUnreadWhatsapp, setTotalUnreadWhatsapp] = useState(0);
    const [totalNewOrders, setTotalNewOrders] = useState(0);
    const [hasNotificationPermission, setHasNotificationPermission] = useState(Notification.permission === 'granted');

    const prevWhatsappRef = useRef(0);
    const prevOrdersRef = useRef(0);

    const location = useLocation();
    const { can } = usePermission();

    const currentTenantId = localStorage.getItem('tenantId') || '1';
    const isMasterTenant = currentTenantId === '1';

    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const roleUsuario = adminInfo.role || 'USER';
    const meuId = (adminInfo.id_usuario === 'DONO' || roleUsuario === 'ADMIN') ? 0 : Number(adminInfo.id_usuario || -1);

    useEffect(() => {
        const unlockAudio = () => {
            notificationAudio.play().then(() => {
                notificationAudio.pause();
                notificationAudio.currentTime = 0;
            }).catch(() => { });
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const dispararNotificacao = (titulo, mensagem) => {
        try {
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(() => console.log('Áudio bloqueado pelo navegador.'));
        } catch (error) { }

        if (Notification.permission === 'granted') {
            new Notification(titulo, { body: mensagem, icon: '/logologin.svg' });
        }
    };

    useEffect(() => {
        const fetchCounters = async () => {
            try {
                if (can('CONFIG_INTEGRATIONS')) {
                    const { data } = await api.get('/whatsapp/chats');
                    let countZap = 0;
                    data.forEach(chat => {
                        if (chat.naoLidas > 0) {
                            const chatStatus = chat.status || 'atendimento';
                            const temDono = chat.responsavelId !== null && chat.responsavelId !== undefined;
                            const isPendente = chatStatus === 'pendentes' || (!temDono && chatStatus !== 'arquivados');
                            const isMeuAtendimento = chatStatus === 'atendimento' && temDono && Number(chat.responsavelId) === meuId;

                            if (isPendente || isMeuAtendimento) {
                                countZap++;
                            }
                        }
                    });

                    if (countZap > prevWhatsappRef.current && location.pathname !== '/admin/chat') {
                        dispararNotificacao("Nova Mensagem!", "Um cliente mandou mensagem no WhatsApp.");
                    }
                    prevWhatsappRef.current = countZap;
                    setTotalUnreadWhatsapp(countZap);
                }

                if (can('PEDIDOS_VIEW')) {
                    const { data: pedidosData } = await api.get('/pedidos/novos/count');
                    const novasOrders = pedidosData.count || 0;

                    if (location.pathname === '/orders') {
                        setTotalNewOrders(0);
                        prevOrdersRef.current = novasOrders;
                    } else {
                        if (novasOrders > prevOrdersRef.current) {
                            dispararNotificacao("Novo Pedido!", "Você recebeu um novo pedido na loja.");
                        }
                        prevOrdersRef.current = novasOrders;
                        setTotalNewOrders(novasOrders);
                    }
                }

            } catch (error) { }
        };

        fetchCounters();
        const interval = setInterval(fetchCounters, 15000);
        return () => clearInterval(interval);
    }, [can, meuId, location.pathname]);

    const filteredMenuGroups = MENU_GROUPS_CONFIG
        .map(group => {
            if (group.id === 'saas_master' && !isMasterTenant) return null;
            const visibleItems = group.items.filter(item => {
                if (!item.permission) return true;
                return can(item.permission);
            });
            if (visibleItems.length > 0) return { ...group, items: visibleItems };
            return null;
        })
        .filter(Boolean);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('themeMode', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('themeMode', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const newOpenMenus = { ...openMenus };
        filteredMenuGroups.forEach(group => {
            if (!group.items) return;
            const isActiveGroup = group.items.some(item => {
                if (item.to === '/') return location.pathname === '/';
                return location.pathname.startsWith(item.to);
            });
            if (isActiveGroup && !isCollapsed) newOpenMenus[group.id] = true;
        });
        setOpenMenus(newOpenMenus);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, isCollapsed]);

    const toggleMenu = (id) => {
        if (isCollapsed) return;
        setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const requestNotificationPermissionManually = () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    setHasNotificationPermission(true);
                    dispararNotificacao("Pronto!", "Notificações ativadas com sucesso.");
                } else {
                    alert("Você bloqueou as notificações. Libere clicando no ícone de cadeado perto do endereço do site.");
                }
            });
        }
    };

    return (
        <>
            <DesktopMenu
                filteredMenuGroups={filteredMenuGroups}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onLogout={onLogout}
                totalUnreadWhatsapp={totalUnreadWhatsapp}
                totalNewOrders={totalNewOrders}
                hasNotificationPermission={hasNotificationPermission}
                requestNotificationPermissionManually={requestNotificationPermissionManually}
            />

            <MobileMenu
                filteredMenuGroups={filteredMenuGroups}
                totalNewOrders={totalNewOrders}
                totalUnreadWhatsapp={totalUnreadWhatsapp}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onLogout={onLogout}
                hasNotificationPermission={hasNotificationPermission}
                requestNotificationPermissionManually={requestNotificationPermissionManually}
            />
        </>
    );
};

export default Sidebar;