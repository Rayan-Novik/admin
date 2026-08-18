import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from 'react-bootstrap';

const MobileMenu = ({ 
    filteredMenuGroups = [], 
    totalNewOrders, 
    totalUnreadWhatsapp,
    isDarkMode,
    toggleTheme,
    onLogout,
    hasNotificationPermission,
    requestNotificationPermissionManually
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // 🟢 Controla a expansão dos quadradinhos
    
    const navigate = useNavigate();
    const location = useLocation();

    // Bloqueia o scroll do body quando o menu estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Recolhe o menu automaticamente ao fechar a tela
            setTimeout(() => setIsExpanded(false), 300);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleNavigation = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    // 🟢 Função que lida com o clique em QUALQUER botão do grid
    const handleGridClick = (item) => {
        if (item.action === 'EXPAND') {
            setIsExpanded(true);
        } else if (item.action === 'COLLAPSE') {
            setIsExpanded(false);
        } else if (item.action === 'NOTIFICATIONS') {
            requestNotificationPermissionManually && requestNotificationPermissionManually();
        } else if (item.action === 'THEME') {
            toggleTheme && toggleTheme();
        } else if (item.action === 'LOGOUT') {
            onLogout && onLogout();
        } else if (item.action === 'COPY_URL') {
            // Apenas evita erro, a lógica do copy-link já está no dashboard
        } else if (item.to) {
            handleNavigation(item.to);
        }
    };

    // 🟢 QUADRADINHOS FIXOS INICIAIS
    const baseQuickItems = [
        { name: 'Copiar Url', action: 'COPY_URL', icon: 'bi-link-45deg' },
        { name: 'Dados', to: '/admin/perfil-loja', icon: 'bi-person-vcard' },
        { name: 'Unidade', to: '/admin/stores', icon: 'bi-shop-window' },
        { name: 'Caixa', to: '/admin/financeiro', icon: 'bi-cash-coin' },
        { name: 'PDV', to: '/admin/pdv', icon: 'bi-pc-display' },
        { name: 'Comandas', to: '/admin/comandas', icon: 'bi-phone-vibrate' },
        { name: 'Mesas', to: '/admin/mesas', icon: 'bi-layout-wtf' },
        { name: 'Produtos', to: '/products', icon: 'bi-box-seam' },
        { name: 'Pedidos', to: '/orders', icon: 'bi-cart2' },
        { name: 'Fornecedores', to: '/admin/suppliers', icon: 'bi-truck' },
        { name: 'Aparência', to: '/admin/customizer', icon: 'bi-palette' },
        { name: 'Gateways', to: '/settings/gateways', icon: 'bi-credit-card' },
        { name: 'Usuarios', to: '/admin/users', icon: 'bi-people' },
        { name: 'Permissões', to: '/admin/permissoes', icon: 'bi-shield-lock' },
        { name: 'Whatsapp', to: '/admin/chat', icon: 'bi-whatsapp', badge: totalUnreadWhatsapp },
    ];

    // Puxa as permissões do Sidebar para mostrar só o que o usuário pode ver
    const allowedPaths = new Set();
    filteredMenuGroups.forEach(g => g.items.forEach(i => allowedPaths.add(i.to)));

    // Filtra os atalhos fixos baseados na permissão
    const quickItems = baseQuickItems.filter(item => item.action === 'COPY_URL' || allowedPaths.has(item.to));
    const quickItemPaths = new Set(quickItems.map(i => i.to));
    
    // 🟢 QUADRADINHOS EXTRAS (Pegos dinamicamente das permissões do Sidebar)
    const extraItems = [];
    filteredMenuGroups.forEach(g => {
        g.items.forEach(i => {
            if (!quickItemPaths.has(i.to)) {
                // Encurtando nomes longos para caber no quadradinho
                let shortName = i.text;
                if (shortName === "Frente de Caixa (PDV)") shortName = "PDV";
                if (shortName === "Contas Pagar/Receber") shortName = "Contas a Pagar";
                if (shortName === "Auditoria Financeira") shortName = "Auditoria";
                if (shortName === "Configuração Fiscal") shortName = "Fiscal";
                if (shortName === "Respostas Rápidas") shortName = "Msg Rápidas";
                if (shortName === "Empresas Cadastradas") shortName = "Empresas";
                if (shortName === "Faturamento Global") shortName = "Fat. Global";
                if (shortName === "WhatsApp Central") shortName = "Whats Central";
                if (shortName === "Regras de Envio") shortName = "Entregas";
                if (shortName === "Desconto Pix") shortName = "Desc. Pix";
                if (shortName === "Servidor de E-mail") shortName = "E-mail";
                if (shortName === "Chaves de API") shortName = "API Keys";
                if (shortName === "Minha Assinatura") shortName = "Assinatura";
                if (shortName === "Domínio Próprio") shortName = "Domínio";
                
                extraItems.push({ name: shortName, to: i.to, icon: i.icon });
            }
        });
    });

    // 🟢 QUADRADINHOS DE CONFIGURAÇÃO DO SISTEMA
    const systemItems = [];
    if (!hasNotificationPermission) {
        systemItems.push({ name: 'Alertas', action: 'NOTIFICATIONS', icon: 'bi-bell-fill', colorClass: 'text-success', bgClass: 'bg-success bg-opacity-10' });
    }
    systemItems.push({ name: 'Tema', action: 'THEME', icon: isDarkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill', colorClass: 'text-warning', bgClass: 'bg-warning bg-opacity-10' });
    systemItems.push({ name: 'Sair', action: 'LOGOUT', icon: 'bi-box-arrow-right', colorClass: 'text-danger', bgClass: 'bg-danger bg-opacity-10' });

    // 🟢 DEFINE O QUE VAI RENDERIZAR NA TELA BASEADO SE ESTÁ EXPANDIDO OU NÃO
    let currentGrid = [...quickItems];
    if (!isExpanded) {
        currentGrid.push({ name: 'Outros', action: 'EXPAND', icon: 'bi-grid-3x3-gap' });
    } else {
        currentGrid = [...currentGrid, ...extraItems, ...systemItems];
        currentGrid.push({ name: 'Recolher', action: 'COLLAPSE', icon: 'bi-chevron-up', colorClass: 'text-secondary', bgClass: 'bg-secondary bg-opacity-10' });
    }

    return (
        <>
            <style>{`
                /* Esconde o menu mobile em telas grandes */
                @media (min-width: 992px) {
                    .mobile-menu-wrapper { display: none !important; }
                }

                .mobile-menu-wrapper { font-family: sans-serif; }

                /* TELA BRANCA QUE SOBE (BOTTOM SHEET) */
                .mobile-sheet {
                    position: fixed;
                    bottom: 0; left: 0; width: 100%;
                    background-color: var(--bg-main, #ffffff);
                    z-index: 1040;
                    border-top-left-radius: 35px;
                    border-top-right-radius: 35px;
                    transform: translateY(100%);
                    transition: transform 0.4s cubic-bezier(0.33, 1, 0.68, 1);
                    padding: 15px 20px 100px 20px;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 -5px 15px rgba(0,0,0,0.15);
                }

                .mobile-sheet.open { transform: translateY(0); }

                /* SETA PARA BAIXO E PUXADOR */
                .sheet-handle {
                    display: flex; justify-content: center; align-items: center;
                    margin-bottom: 15px; cursor: pointer;
                    color: var(--text-secondary, #999); font-size: 26px;
                }
                .sheet-handle:active { color: var(--text-primary, #666); }

                /* GRID DE ÍCONES FLUIDO */
                .grid-menu {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px 10px;
                    margin-bottom: 30px;
                }

                .grid-item {
                    display: flex; flex-direction: column; align-items: center;
                    cursor: pointer; position: relative;
                }

                .grid-icon-box {
                    width: 55px; height: 55px;
                    background-color: var(--bg-hover, #f0f0f0);
                    border-radius: 14px; margin-bottom: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary, #555); font-size: 24px;
                    transition: background-color 0.2s;
                }
                
                .grid-item:active .grid-icon-box { filter: brightness(0.9); }
                
                .grid-item span { 
                    font-size: 10px; font-weight: 600; 
                    color: var(--text-primary, #333); 
                    text-align: center;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
                    max-width: 100%; padding: 0 4px;
                }

                /* BANNER DE INFORMAÇÕES */
                .info-banner-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; color: var(--text-primary, #000); }
                .info-banner-box { width: 100%; height: 100px; background-color: #2196f3; border-radius: 20px; }

                /* BARRA DE NAVEGAÇÃO INFERIOR FIXA */
                .bottom-nav-bar {
                    position: fixed; bottom: 0; left: 0; width: 100%; height: 80px;
                    background: transparent; display: flex; justify-content: space-between;
                    align-items: center; padding: 0 20px; z-index: 1050; pointer-events: none; 
                }

                .bottom-nav-bg {
                    position: absolute; bottom: 0; left: 0; width: 100%; height: 70px;
                    background: var(--bg-sidebar, white); border-top: 1px solid var(--border-color, #f0f0f0);
                    z-index: -1; pointer-events: auto;
                }

                .nav-circle {
                    width: 45px; height: 45px; background-color: var(--border-color, #e2e8f0);
                    border-radius: 50%; pointer-events: auto; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary, #64748b); font-size: 20px;
                    position: relative; transition: all 0.2s;
                }

                .nav-circle.active {
                    background-color: #2196f3; color: white;
                    box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
                }

                .center-btn-wrapper {
                    position: absolute; left: 50%; bottom: 15px; transform: translateX(-50%); pointer-events: auto;
                }

                .center-float-btn {
                    width: 65px; height: 65px; background-color: #2196f3; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 28px; box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3);
                    cursor: pointer; transition: transform 0.2s; border: 5px solid white;
                }
                .center-float-btn:active { transform: scale(0.95); }

            `}</style>

            <div className="mobile-menu-wrapper d-block d-lg-none">
                
                {/* BOTTOM SHEET (MENU BRANCO QUE SOBE) */}
                <div className={`mobile-sheet ${isOpen ? 'open' : ''}`}>
                    
                    {/* PUXADOR / BOTÃO DE FECHAR */}
                    <div className="sheet-handle" onClick={toggleMenu}>
                        <i className="bi bi-chevron-compact-down"></i>
                    </div>

                    {/* RENDERIZA O GRID ATUAL DE QUADRADINHOS */}
                    <div className="grid-menu">
                        {currentGrid.map((item, index) => (
                            <div key={index} className="grid-item" onClick={() => handleGridClick(item)}>
                                <div className={`grid-icon-box ${item.bgClass || ''} ${item.colorClass || ''}`}>
                                    <i className={`bi ${item.icon}`}></i>
                                    {item.badge > 0 && (
                                        <Badge bg="danger" pill className="position-absolute top-0 end-0 translate-middle">
                                            {item.badge}
                                        </Badge>
                                    )}
                                </div>
                                <span>{item.name}</span>
                            </div>
                        ))}
                    </div>

                </div>

                {/* BARRA INFERIOR FIXA */}
                <div className="bottom-nav-bar">
                    <div className="bottom-nav-bg"></div>
                    
                    {/* Atalhos Rápidos */}
                    <div className={`nav-circle ${location.pathname === '/' ? 'active' : ''}`} onClick={() => handleNavigation('/')}>
                        <i className="bi bi-house-door-fill"></i>
                    </div>

                    <div className={`nav-circle ${location.pathname.startsWith('/orders') ? 'active' : ''}`} onClick={() => handleNavigation('/orders')}>
                        <i className="bi bi-cart-fill"></i>
                        {totalNewOrders > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '10px', height: '10px' }}></span>
                        )}
                    </div>
                    
                    <div style={{ width: '65px' }}></div>
                    
                    <div className={`nav-circle ${location.pathname === '/admin/comandas' ? 'active' : ''}`} onClick={() => handleNavigation('/admin/comandas')}>
                        <i className="bi bi-phone-vibrate-fill"></i>
                    </div>

                    <div className={`nav-circle ${location.pathname === '/admin/pdv' ? 'active' : ''}`} onClick={() => handleNavigation('/admin/pdv')}>
                        <i className="bi bi-pc-display"></i>
                    </div>
                    
                    {/* BOTÃO CENTRAL AZUL */}
                    <div className="center-btn-wrapper">
                        <div className="center-float-btn" onClick={toggleMenu}>
                            <i className={isOpen ? "bi bi-x-lg" : "bi bi-grid-fill"}></i>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;