import React, { useState, useEffect } from 'react';
import { Nav, Button, Tooltip, OverlayTrigger, Popover } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermission } from '../hooks/usePermission';
import '../styles/sidebar-ararinha.css';

// ============================================================================
// 1. CONFIGURAÇÃO DOS MENUS
// ============================================================================
const MENU_GROUPS_CONFIG = [
    {
        title: "Principal",
        id: "principal",
        items: [
            { to: "/", icon: "fas fa-tachometer-alt", text: "Dashboard", permission: "view_dashboard" },
        ]
    },
    {
        title: "Loja Física",
        icon: "fas fa-store",
        id: "pdv",
        items: [
            { to: "/admin/pdv", icon: "fas fa-cash-register", text: "Frente de Caixa (PDV)", permission: "view_ecommerce" },
        ]
    },
    {
        title: "E-commerce",
        icon: "fas fa-shopping-bag",
        id: "ecommerce",
        items: [
            { to: "/products", icon: "fas fa-box-open", text: "Produtos", permission: "manage_products" },
            { to: "/orders", icon: "fas fa-shopping-cart", text: "Pedidos Online", permission: "manage_orders" },
            { to: "/admin/suppliers", icon: "fas fa-truck", text: "Fornecedores", permission: "manage_products" },
            { to: "/admin/reviews", icon: "fas fa-star", text: "Avaliações", permission: "view_ecommerce" },
            { to: "/reports", icon: "fas fa-chart-line", text: "Relatórios de Vendas", permission: "manage_financial" },
        ]
    },
    {
        title: "Marketing",
        icon: "fas fa-bullhorn",
        id: "marketing",
        items: [
            { to: "/admin/marketing", icon: "fas fa-ad", text: "Campanhas", permission: "view_dashboard" },
        ]
    },
    {
        // 🚀 O NOVO GRUPO COM TODAS AS OPÇÕES SOLTAS
        title: "Configuração da Loja",
        icon: "fas fa-sliders-h",
        id: "store_config",
        items: [
            { to: "/admin/customizer", icon: "fas fa-paint-brush", text: "Aparência (Editor Visual)", permission: "view_ecommerce" },
            { to: "/admin/domain", icon: "fas fa-globe", text: "Domínio Próprio", permission: "view_ecommerce" },
            { to: "/admin/stores", icon: "fas fa-store-alt", text: "Unidades Físicas", permission: "view_ecommerce" },
            { to: "/admin/shipping", icon: "fas fa-truck-loading", text: "Regras de Envio", permission: "view_ecommerce" },
            { to: "/admin/pix-discount", icon: "fas fa-bolt", text: "Desconto Pix", permission: "view_ecommerce" },
            { to: "/admin/email-smtp", icon: "fas fa-envelope", text: "Servidor de E-mail", permission: "view_ecommerce" },
            { to: "/admin/whatsapp-integration", icon: "fab fa-whatsapp", text: "Integração WhatsApp", permission: "view_ecommerce" },
        ]
    },
    {
        title: "Administrativo",
        icon: "fas fa-cogs",
        id: "admin",
        items: [
            { to: "/admin/minha-fatura", icon: "fas fa-file-invoice", text: "Minha Assinatura", permission: "view_dashboard" },
            { to: "/admin/gestao-financeira", icon: "fas fa-hand-holding-usd", text: "Contas Pagar/Receber", permission: "manage_financial" },
            { to: "/settings/gateways", icon: "fas fa-credit-card", text: "Gateways Pagamento", permission: "manage_financial" },
            { to: "/admin/financeiro", icon: "fas fa-file-invoice-dollar", text: "Auditoria Financeira", permission: "manage_financial" },
            { to: "/admin/users", icon: "fas fa-users", text: "Usuários", permission: "manage_users" },
            { to: "/admin/permissoes", icon: "fas fa-lock", text: "Permissões", permission: "manage_permissions" },
            { to: "/admin/auditoria-global", icon: "fas fa-shield-alt", text: "Auditoria Global", permission: "manage_users" },
            { to: "/admin/api-keys", icon: "fas fa-key", text: "Chaves de API", permission: "manage_users" },
            { to: "/settings/dashboard", icon: "fas fa-sliders-h", text: "Config. Sistema", permission: "manage_financial" },
        ]
    }
];

// ============================================================================
// 2. COMPONENTE SIDEBAR
// ============================================================================
const Sidebar = ({ onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
    const [openMenus, setOpenMenus] = useState({});
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const location = useLocation();
    const { can } = usePermission();

    const filteredMenuGroups = MENU_GROUPS_CONFIG
        .map(group => {
            const visibleItems = group.items.filter(item => !item.permission || can(item.permission));
            if (visibleItems.length > 0) return { ...group, items: visibleItems };
            return null;
        })
        .filter(Boolean);

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    useEffect(() => {
        const newOpenMenus = { ...openMenus };
        filteredMenuGroups.forEach(group => {
            if (!group.items) return;
            const isActiveGroup = group.items.some(item => {
                if (item.to === '/') return location.pathname === '/';
                return location.pathname.startsWith(item.to);
            });
            // 🚀 MUDANÇA: Só abre o menu "sanfona" se a sidebar NÃO estiver colapsada
            if (isActiveGroup && !isCollapsed) newOpenMenus[group.id] = true;
        });
        setOpenMenus(newOpenMenus);
        setShowMobileMenu(false); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, isCollapsed]);

    const toggleMenu = (id) => {
        // 🚀 MUDANÇA: Se estiver fina, clicar não faz nada com a "sanfona"
        // Porque o Popover flutuante vai assumir o controle!
        if (isCollapsed && !showMobileMenu) {
            return; 
        } else {
            setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
        }
    };

    const sidebarVariants = {
        expanded: { width: "270px", transition: { type: "tween", ease: "easeOut", duration: 0.18 } },
        collapsed: { width: "84px", transition: { type: "tween", ease: "easeOut", duration: 0.18 } }
    };

    const submenuVariants = {
        hidden: { height: 0, opacity: 0, transition: { type: "tween", duration: 0.16 } },
        visible: { height: "auto", opacity: 1, transition: { type: "tween", duration: 0.16 } }
    };

    const bottomSheetVariants = {
        hidden: { y: "100%", transition: { type: "tween", duration: 0.28 } },
        visible: { y: 0, transition: { type: "spring", damping: 30, stiffness: 350, mass: 0.8 } }
    };

    const NavItem = ({ to, icon, text, badge, isMobile = false }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

        const linkContent = (
            <LinkContainer to={to}>
                <Nav.Link className={`nav-link-item ${isCollapsed && !isMobile ? "collapsed" : ""} ${isActive ? "active" : ""}`}>
                    <motion.i
                        className={`${icon} nav-ico`}
                        whileHover={{ scale: 1.12, color: "var(--ara-400)" }}
                    />
                    {(!isCollapsed || isMobile) && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="nav-text text-truncate"
                        >
                            {text}
                        </motion.div>
                    )}
                    {badge && <span className="nav-dot"></span>}
                </Nav.Link>
            </LinkContainer>
        );

        if (!isMobile && isCollapsed) {
            return (
                <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip className="sidebar-tooltip">{text}</Tooltip>}
                    trigger={['hover', 'focus']}
                >
                    {linkContent}
                </OverlayTrigger>
            );
        }
        return linkContent;
    };

    // 🚀 NOVO COMPONENTE: O MENU FLUTUANTE (POPOVER)
    // Isso é o que vai aparecer quando a barra estiver fininha e você clicar num grupo
    const PopoverSubMenu = (group) => (
        <Popover id={`popover-${group.id}`} className="sidebar-popover shadow-lg border-0 rounded-4" style={{ minWidth: '240px', zIndex: 1050 }}>
            <Popover.Header as="h6" className="bg-white border-bottom fw-bold text-dark rounded-top-4 px-3 py-2 m-0">
                {group.title}
            </Popover.Header>
            <Popover.Body className="p-2">
                <Nav className="flex-column gap-1">
                    {group.items.map(item => {
                        const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                        return (
                            <LinkContainer key={item.to} to={item.to}>
                                <Nav.Link className={`rounded-3 px-3 py-2 text-dark d-flex align-items-center ${isActive ? 'bg-primary bg-opacity-10 fw-bold text-primary' : 'hover-bg-light'}`} style={{ transition: '0.2s' }}>
                                    <i className={`${item.icon} me-3 opacity-75`}></i>
                                    <span style={{ fontSize: '0.88rem' }}>{item.text}</span>
                                </Nav.Link>
                            </LinkContainer>
                        );
                    })}
                </Nav>
            </Popover.Body>
        </Popover>
    );

    return (
        <>
            <style>{`
                .sidebar-popover .hover-bg-light:hover { background-color: #f8f9fa; }
                .sidebar-popover .nav-link { border: none !important; }
            `}</style>
            
            {/* --- DESKTOP SIDEBAR --- */}
            <motion.div
                className="d-none d-lg-flex flex-column vh-100 position-sticky top-0 sidebar"
                initial={false}
                animate={isCollapsed ? "collapsed" : "expanded"}
                variants={sidebarVariants}
            >
                <div className="sidebar-brand">
                    <AnimatePresence mode="wait">
                        {!isCollapsed ? (
                            <motion.div
                                key="brand-full"
                                className="brand-full"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                            >
                                <div className="brand-badge">
                                    <img src="/logologin.png" alt="Ararinha" className="brand-logo" />
                                </div>
                                <div className="brand-text">
                                    <div className="brand-title">Ararinha</div>
                                    <div className="brand-subtitle">Gestão Integrada</div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="brand-mini"
                                className="brand-mini"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                            >
                                A
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="sidebar-scroll flex-grow-1 overflow-auto no-scrollbar py-3 px-2">
                    {filteredMenuGroups.map((group) => {
                        const hasActiveChild = group.items.some(item => location.pathname.startsWith(item.to));

                        return (
                            <div key={group.id} className="mb-2">
                                {/* Grupos sem submenu (Ex: Dashboard, PDV) */}
                                {group.items.length === 1 ? (
                                    <NavItem {...group.items[0]} />
                                ) : (
                                    /* Grupos com Submenu (Ex: E-commerce, Configurações) */
                                    <>
                                        {/* 🚀 MÁGICA: Se a barra estiver fina, usar o Popover Flutuante */}
                                        {isCollapsed ? (
                                            <OverlayTrigger 
                                                trigger="click" 
                                                rootClose 
                                                placement="right" 
                                                overlay={PopoverSubMenu(group)}
                                            >
                                                <div 
                                                    className={`group-header collapsed ${hasActiveChild ? 'active-group' : ''}`} 
                                                    role="button" 
                                                    tabIndex={0}
                                                >
                                                    <div className="d-flex align-items-center justify-content-center w-100">
                                                        <i className={`${group.icon} sidebar-icon ${hasActiveChild ? 'icon-active' : ''}`}></i>
                                                    </div>
                                                </div>
                                            </OverlayTrigger>
                                        ) : (
                                            /* Se a barra estiver larga, usa a Sanfona (Accordion) normal */
                                            <>
                                                <div
                                                    className={`group-header ${openMenus[group.id] ? 'active-group' : ''}`}
                                                    onClick={() => toggleMenu(group.id)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <i className={`${group.icon} sidebar-icon ${openMenus[group.id] ? 'icon-active' : ''}`}></i>
                                                        <span className="ms-3 group-text">{group.title}</span>
                                                    </div>
                                                    <motion.i
                                                        className="fas fa-chevron-down chevron"
                                                        animate={{ rotate: openMenus[group.id] ? 180 : 0 }}
                                                    />
                                                </div>

                                                <AnimatePresence>
                                                    {openMenus[group.id] && (
                                                        <motion.div
                                                            className="submenu-container"
                                                            variants={submenuVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="hidden"
                                                        >
                                                            {group.items.map(item => <NavItem key={item.to} {...item} />)}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="sidebar-bottom p-3">
                    <Button
                        variant="link"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="collapse-btn w-100 text-decoration-none"
                    >
                        <motion.i className="fas fa-chevron-left" animate={{ rotate: isCollapsed ? 180 : 0 }} />
                    </Button>

                    <Nav.Link
                        className={`logout-link ${isCollapsed ? 'justify-content-center' : ''}`}
                        onClick={onLogout}
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        {!isCollapsed && <span className="ms-3">Sair</span>}
                    </Nav.Link>
                </div>
            </motion.div>

            {/* --- MOBILE SIDEBAR --- */}
            <div className="d-lg-none">
                <AnimatePresence>
                    {showMobileMenu && (
                        <motion.div
                            className="fixed-top vh-100"
                            style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.6)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    className="position-fixed bottom-0 start-0 w-100 mobile-sheet rounded-top-4"
                    style={{
                        zIndex: 1110,
                        height: '85vh',
                        overflow: 'hidden',
                        paddingBottom: '84px'
                    }}
                    variants={bottomSheetVariants}
                    initial="hidden"
                    animate={showMobileMenu ? "visible" : "hidden"}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.05}
                    dragMomentum={false}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) setShowMobileMenu(false);
                    }}
                >
                    <div className="d-flex justify-content-center pt-3 pb-2" onClick={() => setShowMobileMenu(false)}>
                        <div className="mobile-handle"></div>
                    </div>

                    <div className="h-100 overflow-auto p-3 pb-5">
                        <div className="d-flex align-items-center gap-2 mb-3 ps-2">
                            <div className="brand-badge brand-badge--sm">
                                <img src="/logologin.png" alt="Ararinha" className="brand-logo brand-logo--sm" />
                            </div>
                            <div>
                                <div className="brand-title brand-title--sm">Ararinha</div>
                                <div className="brand-subtitle">Menu Mobile</div>
                            </div>
                        </div>

                        {filteredMenuGroups.map((group) => (
                            <div key={group.id} className="mb-4">
                                <h6 className="mobile-group-title text-uppercase small fw-bold ps-2 mb-2 pb-1">
                                    {group.title}
                                </h6>
                                {group.items.map(item => (
                                    <NavItem key={item.to} {...item} isMobile={true} />
                                ))}
                            </div>
                        ))}

                        <Button variant="danger" className="w-100 mt-3" onClick={onLogout}>
                            <i className="fas fa-sign-out-alt me-2"></i> Sair do Sistema
                        </Button>
                    </div>
                </motion.div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="mobile-bar">
                    <LinkContainer to="/">
                        <button
                            type="button"
                            className={`mobile-btn ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            <i className="fas fa-home fs-5"></i>
                            <span className="mobile-label">Início</span>
                        </button>
                    </LinkContainer>

                    <div className="mobile-fab-wrap">
                        <button
                            type="button"
                            className="mobile-fab"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
                        >
                            <motion.i
                                className={`fas ${showMobileMenu ? 'fa-times' : 'fa-th-large'}`}
                                animate={{ rotate: showMobileMenu ? 90 : 0 }}
                            />
                        </button>
                    </div>

                    <LinkContainer to="/admin/pdv">
                        <button
                            type="button"
                            className={`mobile-btn ${location.pathname === '/admin/pdv' ? 'active' : ''}`}
                        >
                            <i className="fas fa-cash-register fs-5"></i>
                            <span className="mobile-label">PDV</span>
                        </button>
                    </LinkContainer>
                </div>
            </div>
        </>
    );
};

export default Sidebar;