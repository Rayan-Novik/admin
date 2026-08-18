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

    // Componente interno para os Itens do Menu Desktop
    const NavItem = ({ to, icon, text }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        const isWhatsappItem = to === '/admin/chat'; 
        const isOrdersItem = to === '/orders'; 

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

            <div className={`d-none d-lg-flex flex-column vh-100 position-sticky top-0 sidebar-lite ${isCollapsed ? 'collapsed' : ''}`}>
                
                <div className={`sidebar-brand ${isCollapsed ? 'justify-content-center' : 'px-4'}`}>
                    <img src="/logologin.svg" alt="Logo" style={{ width: '28px', height: '28px', filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} className={isCollapsed ? '' : 'me-3'} />
                    {!isCollapsed && (
                        <div>
                            <div className="brand-title">Ararinha</div>
                            <div className="brand-sub">Cloud</div>
                        </div>
                    )}
                </div>

                <div className="flex-grow-1 overflow-auto no-scroll py-2">
                    {filteredMenuGroups.map((group) => {
                        const hasActiveChild = group.items.some(item => location.pathname.startsWith(item.to));

                        let groupNotifCount = 0;
                        if (group.id === 'atendimento') groupNotifCount = totalUnreadWhatsapp;
                        if (group.id === 'ecommerce') groupNotifCount = totalNewOrders;

                        return (
                            <div key={group.id} className="mb-1">
                                {group.items.length === 1 ? (
                                    <NavItem {...group.items[0]} />
                                ) : (
                                    <>
                                        {isCollapsed ? (
                                            <div className="saas-group-header collapsed-item justify-content-center text-muted opacity-50 position-relative" title={group.title}>
                                                <i className={`${group.icon} saas-icon m-0 position-relative`}>
                                                    {groupNotifCount > 0 && (
                                                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                                                    )}
                                                </i>
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`saas-group-header ${hasActiveChild ? 'active-group' : ''}`} onClick={() => toggleMenu(group.id)}>
                                                    <div className="d-flex align-items-center">
                                                        <i className={`${group.icon} saas-icon ${hasActiveChild ? 'text-primary' : ''}`}></i>
                                                        <span>{group.title}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        {groupNotifCount > 0 && !openMenus[group.id] && (
                                                            <Badge bg="danger" pill className="shadow-sm me-2" style={{ fontSize: '0.65rem' }}>
                                                                {groupNotifCount}
                                                            </Badge>
                                                        )}
                                                        <i className={`bi bi-chevron-down chevron-icon ${openMenus[group.id] ? 'open' : ''}`}></i>
                                                    </div>
                                                </div>
                                                <div className={`submenu-lite ${openMenus[group.id] ? 'open' : ''}`}>
                                                    {group.items.map(item => <NavItem key={item.to} {...item} />)}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="sidebar-footer">
                    {!hasNotificationPermission && (
                        <button className={`btn-sidebar-action d-flex align-items-center text-success ${isCollapsed ? 'justify-content-center' : 'px-3'}`} onClick={requestNotificationPermissionManually} title="Ativar Alertas">
                            <i className="bi bi-bell-fill" style={{ fontSize: '16px' }}></i>
                            {!isCollapsed && <span className="ms-2 fw-bold" style={{ fontSize: '12px' }}>Ativar Alertas</span>}
                        </button>
                    )}

                    <button className={`btn-sidebar-action d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'px-3'}`} onClick={toggleTheme} title={isDarkMode ? "Modo Claro" : "Modo Escuro"}>
                        <i className={`bi ${isDarkMode ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'}`} style={{ fontSize: '16px' }}></i>
                        {!isCollapsed && <span className="ms-2 fw-medium" style={{ fontSize: '13px' }}>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
                    </button>
                    
                    <button className={`btn-sidebar-action d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'px-3'}`} onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Expandir" : "Recolher"}>
                        <i className={`bi bi-chevron-double-${isCollapsed ? 'right' : 'left'}`} style={{ fontSize: '16px' }}></i>
                        {!isCollapsed && <span className="ms-2 fw-medium" style={{ fontSize: '13px' }}>Recolher Menu</span>}
                    </button>

                    <button className={`btn-logout d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`} onClick={onLogout} title="Sair">
                        <i className="bi bi-box-arrow-right" style={{ fontSize: '16px' }}></i>
                        {!isCollapsed && <span className="ms-2">Sair da Conta</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default DesktopMenu;