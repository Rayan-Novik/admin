import React from 'react';
import { Nav, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';

const DesktopMenu = ({
    filteredMenuGroups,
    isCollapsed,
    setIsCollapsed,
    openMenus,
    toggleMenu,
    isDarkMode,
    toggleTheme,
    onLogout,
    totalUnreadWhatsapp,
    totalNewOrders,
    hasNotificationPermission,
    requestNotificationPermissionManually
}) => {
    const location = useLocation();

    // 🟢 Componente Interno Limpo para os Itens de Navegação
    const NavItem = ({ to, icon, text }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        const isWhatsappItem = to === '/admin/chat'; 
        const isOrdersItem = to === '/orders'; 
        const notifCount = isWhatsappItem ? totalUnreadWhatsapp : (isOrdersItem ? totalNewOrders : 0);

        const content = (
            <LinkContainer to={to}>
                <Nav.Link className={`saas-nav-item d-flex align-items-center ${isCollapsed ? "collapsed-item justify-content-center" : "justify-content-between"} ${isActive ? "active" : ""}`}>
                    <div className="d-flex align-items-center">
                        <i className={`${icon} saas-icon position-relative`}>
                            {isCollapsed && isWhatsappItem && totalUnreadWhatsapp > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                            )}
                            {isCollapsed && isOrdersItem && totalNewOrders > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                            )}
                        </i>
                        {!isCollapsed && <span className="saas-nav-text text-truncate">{text}</span>}
                    </div>
                    
                    {!isCollapsed && isWhatsappItem && totalUnreadWhatsapp > 0 && (
                        <Badge bg="danger" pill className="shadow-sm ms-2" style={{ fontSize: '0.65rem' }}>
                            {totalUnreadWhatsapp}
                        </Badge>
                    )}
                    {!isCollapsed && isOrdersItem && totalNewOrders > 0 && (
                        <Badge bg="danger" pill className="shadow-sm ms-2" style={{ fontSize: '0.65rem' }}>
                            {totalNewOrders}
                        </Badge>
                    )}
                </Nav.Link>
            </LinkContainer>
        );

        if (isCollapsed) {
            return (
                <OverlayTrigger placement="right" overlay={<Tooltip className="saas-tooltip border-0">{text}</Tooltip>}>
                    {content}
                </OverlayTrigger>
            );
        }
        return content;
    };

    return (
        <>
            {/* 🟢 LÓGICA DO MODO ESCURO DE VOLTA - NENHUMA ALTERAÇÃO NO SEU HTML */}
            <style>{`
                :root {
                    --bg-sidebar: #ffffff;
                    --bg-main: #f8fafc;
                    --border-color: #e2e8f0;
                    --text-primary: #0f172a;
                    --text-secondary: #64748b;
                    --bg-hover: #f8fafc;
                    --bg-active: #eff6ff;
                    --text-active: #2563eb;
                    --bg-tooltip: #0f172a;
                    --text-tooltip: #ffffff;
                }

                body.dark-mode {
                    --bg-sidebar: #0f172a;
                    --bg-main: #020617;
                    --border-color: #1e293b;
                    --text-primary: #f8fafc;
                    --text-secondary: #94a3b8;
                    --bg-hover: #1e293b;
                    --bg-active: #1d4ed8;
                    --text-active: #ffffff;
                    --bg-tooltip: #ffffff;
                    --text-tooltip: #0f172a;
                    
                    background-color: var(--bg-main) !important;
                    color: var(--text-primary);
                }

                body.dark-mode .clean-card, 
                body.dark-mode .card,
                body.dark-mode .bg-white {
                    background-color: #0f172a !important;
                    border-color: #1e293b !important;
                    color: #f8fafc !important;
                }
                body.dark-mode .text-dark { color: #f8fafc !important; }
                body.dark-mode .text-muted { color: #94a3b8 !important; }
                body.dark-mode .bg-light { background-color: #1e293b !important; }
                body.dark-mode .border { border-color: #1e293b !important; }
                body.dark-mode .table { color: #f8fafc !important; }

                .sidebar-lite {
                    background-color: var(--bg-sidebar);
                    border-right: 1px solid var(--border-color);
                    transition: width 0.2s ease-in-out;
                    width: 260px;
                    z-index: 1000;
                }
                .sidebar-lite.collapsed { width: 72px; }

                .sidebar-brand { height: 72px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; }
                .brand-title { color: var(--text-primary); font-weight: 800; font-size: 18px; letter-spacing: -0.5px; line-height: 1; }
                .brand-sub { color: var(--text-secondary); font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

                .saas-nav-item {
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 6px;
                    margin: 2px 12px;
                    padding: 8px 12px;
                    text-decoration: none;
                    cursor: pointer;
                }
                .saas-nav-item:hover { background-color: var(--bg-hover); color: var(--text-primary); }
                .saas-nav-item.active { background-color: var(--bg-active); color: var(--text-active); font-weight: 600; }
                
                .saas-icon { font-size: 16px; width: 24px; text-align: center; margin-right: 10px; }
                
                .saas-nav-item.collapsed-item { margin: 4px 12px; padding: 10px 0; justify-content: center; }
                .saas-nav-item.collapsed-item .saas-icon { margin-right: 0; font-size: 18px; }

                .saas-group-header {
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 600;
                    border-radius: 6px;
                    margin: 4px 12px 0 12px;
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .saas-group-header:hover { background-color: var(--bg-hover); color: var(--text-primary); }
                .saas-group-header.active-group { color: var(--text-primary); }
                
                .submenu-lite {
                    margin-left: 24px;
                    border-left: 1px solid var(--border-color);
                    padding-left: 4px;
                    margin-top: 2px;
                    display: none;
                }
                .submenu-lite.open { display: block; }
                .submenu-lite .saas-nav-item { font-size: 12px; padding: 6px 10px; margin: 2px 0; }
                .submenu-lite .saas-icon { font-size: 14px; width: 20px; }

                .chevron-icon { transition: transform 0.2s ease; font-size: 10px; opacity: 0.5; }
                .chevron-icon.open { transform: rotate(180deg); }

                .sidebar-footer { border-top: 1px solid var(--border-color); padding: 12px; background-color: var(--bg-sidebar); }
                .btn-sidebar-action { background: var(--bg-hover); color: var(--text-secondary); border: 1px solid var(--border-color); width: 100%; border-radius: 6px; padding: 6px; cursor: pointer; transition: 0.2s; margin-bottom: 4px;}
                .btn-sidebar-action:hover { background: var(--border-color); color: var(--text-primary); }
                
                .btn-logout { color: #ef4444; width: 100%; text-align: left; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; border: none; background: transparent; margin-top: 4px; }
                .btn-logout:hover { background: #fef2f2; }

                .no-scroll::-webkit-scrollbar { display: none; }
                .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                
                .saas-tooltip .tooltip-inner { background-color: var(--bg-tooltip); color: var(--text-tooltip); font-size: 11px; padding: 4px 8px; border-radius: 4px; }
                .saas-tooltip .tooltip-arrow::before { border-right-color: var(--bg-tooltip) !important; }
            `}</style>

            <div 
                className="d-none d-lg-flex flex-column vh-100 position-sticky top-0 flex-shrink-0" 
                style={{ 
                    width: isCollapsed ? '88px' : '260px', 
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    backgroundColor: 'var(--bg-sidebar, #ffffff)', 
                    borderRight: '1px solid var(--border-color, #e2e8f0)',
                    zIndex: 1000 
                }}
            >
                
                {/* 🟢 BRAND / LOGO (Centralizado e Fonte Personalizada) */}
                <div 
                    className="d-flex align-items-center justify-content-center w-100" 
                    style={{ height: '76px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}
                >
                    <img 
                        src="/logologin.png" 
                        alt="Logo" 
                        style={{ width: '48px', height: '48px',}} 
                        className={isCollapsed ? '' : 'me-2'} 
                    />
                </div>

                {/* 🟢 LISTA DE MENUS (Scroll Invisível) */}
                <div 
                    className="flex-grow-1 py-3 overflow-auto" 
                    style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                >
                    {filteredMenuGroups.map((group) => {
                        const hasActiveChild = group.items.some(item => location.pathname.startsWith(item.to));
                        
                        let groupNotifCount = 0;
                        if (group.id === 'atendimento') groupNotifCount = totalUnreadWhatsapp;
                        if (group.id === 'ecommerce') groupNotifCount = totalNewOrders;

                        return (
                            <div key={group.id} className="mb-2 px-3">
                                {group.items.length === 1 ? (
                                    <NavItem {...group.items[0]} />
                                ) : (
                                    <>
                                        {/* Menu Pai Expansível */}
                                        {isCollapsed ? (
                                            <OverlayTrigger placement="right" overlay={<Tooltip className="saas-tooltip border-0">{group.title}</Tooltip>}>
                                                <div className="d-flex justify-content-center align-items-center py-2 mb-1 text-secondary position-relative" style={{ cursor: 'pointer', opacity: 0.6 }}>
                                                    <i className={`${group.icon} fs-5`}></i>
                                                    {groupNotifCount > 0 && (
                                                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-white rounded-circle shadow-sm" style={{ width: '10px', height: '10px' }}></span>
                                                    )}
                                                </div>
                                            </OverlayTrigger>
                                        ) : (
                                            <div 
                                                className={`d-flex align-items-center justify-content-between py-2 px-3 mb-1 rounded-3 ${hasActiveChild ? 'text-primary fw-bold' : 'text-secondary fw-semibold'}`}
                                                style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                onClick={() => toggleMenu(group.id)}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8fafc)'; e.currentTarget.style.color = 'var(--text-primary, #0f172a)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = hasActiveChild ? 'var(--text-primary)' : 'var(--text-secondary)'; }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i className={`${group.icon} fs-5 me-2 ${hasActiveChild ? 'text-primary' : ''}`}></i>
                                                    <span>{group.title}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    {groupNotifCount > 0 && !openMenus[group.id] && (
                                                        <span className="bg-danger text-white rounded-pill me-2 d-flex align-items-center justify-content-center shadow-sm fw-bold" style={{ fontSize: '10px', padding: '2px 6px' }}>{groupNotifCount}</span>
                                                    )}
                                                    <i className="bi bi-chevron-down" style={{ fontSize: '12px', transition: 'transform 0.2s', transform: openMenus[group.id] ? 'rotate(180deg)' : 'none' }}></i>
                                                </div>
                                            </div>
                                        )}

                                        {/* Filhos (Submenus) */}
                                        <div 
                                            className={`ms-3 ps-2 border-start border-2 ${openMenus[group.id] && !isCollapsed ? 'd-block' : 'd-none'}`} 
                                            style={{ borderColor: 'var(--border-color, #e2e8f0)' }}
                                        >
                                            {group.items.map(item => <NavItem key={item.to} {...item} />)}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 🟢 RODAPÉ DE AÇÕES */}
                <div className="mt-auto p-3 d-flex flex-column gap-2 border-top" style={{ borderColor: 'var(--border-color, #e2e8f0)', backgroundColor: 'var(--bg-sidebar, #ffffff)' }}>
                    
                    {!hasNotificationPermission && (
                        <button 
                            className={`btn d-flex align-items-center text-success border-0 rounded-3 ${isCollapsed ? 'justify-content-center p-2' : 'px-3 py-2'}`}
                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', transition: 'transform 0.2s' }}
                            onClick={requestNotificationPermissionManually}
                            title="Ativar Alertas"
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <i className="bi bi-bell-fill fs-5"></i>
                            {!isCollapsed && <span className="ms-3 fw-bold" style={{ fontSize: '13px' }}>Ativar Alertas</span>}
                        </button>
                    )}

                    <button 
                        className={`btn d-flex align-items-center text-secondary border-0 rounded-3 ${isCollapsed ? 'justify-content-center p-2' : 'px-3 py-2'}`}
                        style={{ backgroundColor: 'var(--bg-main, #f8fafc)', transition: 'background-color 0.2s' }}
                        onClick={toggleTheme}
                        title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color, #e2e8f0)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main, #f8fafc)'}
                    >
                        <i className={`bi ${isDarkMode ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'} fs-5`}></i>
                        {!isCollapsed && <span className="ms-3 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
                    </button>

                    <button 
                        className={`btn d-flex align-items-center text-secondary border-0 rounded-3 ${isCollapsed ? 'justify-content-center p-2' : 'px-3 py-2'}`}
                        style={{ backgroundColor: 'var(--bg-main, #f8fafc)', transition: 'background-color 0.2s' }}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expandir" : "Recolher"}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color, #e2e8f0)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main, #f8fafc)'}
                    >
                        <i className={`bi bi-chevron-double-${isCollapsed ? 'right' : 'left'} fs-5`}></i>
                        {!isCollapsed && <span className="ms-3 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Recolher Menu</span>}
                    </button>

                    <button 
                        className={`btn d-flex align-items-center text-danger border-0 rounded-3 mt-1 ${isCollapsed ? 'justify-content-center p-2' : 'px-3 py-2'}`}
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', transition: 'background-color 0.2s' }}
                        onClick={onLogout}
                        title="Sair"
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                    >
                        <i className="bi bi-box-arrow-right fs-5"></i>
                        {!isCollapsed && <span className="ms-3 fw-bold" style={{ fontSize: '13px' }}>Sair da Conta</span>}
                    </button>
                </div>
                
            </div>
        </>
    );
};

export default DesktopMenu;