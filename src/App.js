import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Contexto de Permissões
import { PermissionProvider } from './contexts/PermissionContext';
import { usePermission } from './hooks/usePermission';

// Componentes
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Páginas
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProductListPage from './pages/ProductListPage';
import GlobalAuditPage from './pages/GlobalAuditPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailMLPage from './pages/OrderDetailMLPage';
import ProductEditPage from './pages/ProductEditPage';
import ProductCreatePage from './pages/ProductCreatePage';
import OrderDetailPage from './pages/OrderDetailPage';
import DashboardSettingsPage from './pages/DashboardSettingsPage';
import ReportsPage from './pages/ReportsPage';
import ReviewListPage from './pages/ReviewListPage';
import MarketingPage from './pages/MarketingPage';
import SupplierListPage from './pages/SupplierListPage';
import CustomizerPage from './pages/CustomizerPage'; // (O seu AppearanceManager / Editor Visual)
import SitePreviewStub from './pages/SitePreviewStub';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import ApiKeysPage from './pages/ApiKeysPage';
import GerenciarPermissoes from './pages/GerenciarPermissoes';

// Configuração de Gateways & Financeiro
import GatewayConfigPage from './pages/admin/GatewayConfig';
import FinancialAuditPage from './pages/admin/FinancialAuditPage';
import FinancialModule from './pages/admin/FinancialModule';
import FaturaPage from './pages/admin/FaturaPage';

// PDV (Ponto de Venda)
import PDVPage from './pages/PDV';

// 🚀 NOVAS IMPORTAÇÕES (Antigo EcommerceModules)
// (Ajuste o caminho dessas importações se as suas pastas forem diferentes)
import DomainManager from './components/modules/AppearanceManager/DomainManager';
import StoresManager from './components/modules/StoresManager';
import ShippingManager from './components/modules/ShippingManager';
import PixDiscountModule from './components/modules/PixDiscountModule';
import EmailSettings from './components/modules/Settings/EmailSettings';
import WhatsAppSettings from './components/modules/Settings/WhatsAppSettings';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MobileFixStyles = () => (
    <style type="text/css">{`
        @media (max-width: 991px) {
            .main-content-mobile-fix {
                padding-bottom: 90px !important;
            }
        }
    `}</style>
);

// --- COMPONENTE MÁGICO: GERENCIADOR DE STORE URL ---
const StoreUrlManager = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const storeFromUrl = searchParams.get('store');

        if (storeFromUrl) {
            localStorage.setItem('tenantSlug', storeFromUrl);
        } else {
            const savedStore = localStorage.getItem('tenantSlug');
            if (savedStore) {
                const newPath = `${location.pathname}?store=${savedStore}`;
                navigate(newPath, { replace: true });
            }
        }
    }, [location, navigate]);

    return null;
};

// --- COMPONENTE DE ROTA PROTEGIDA ---
const PrivateRoute = ({ children, requiredPermission }) => {
    const { can, loading } = usePermission();
    const location = useLocation();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (requiredPermission && !can(requiredPermission)) {
        toast.error("Você não tem permissão para acessar esta área.");
        return <Navigate to={`/${location.search}`} replace />;
    }

    return children;
};

const AdminLayout = ({ children, notifications, onClearNotifications, onLogout }) => {
    const location = useLocation();
    const isChatPage = location.pathname === '/admin/chat';

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            <Sidebar onLogout={onLogout} />

            <main className="flex-grow-1 d-flex flex-column main-content-mobile-fix" style={{ width: '100%', backgroundColor: '#f4f6f9' }}>
                <Header
                    notifications={notifications}
                    onClearNotifications={onClearNotifications}
                    onLogout={onLogout}
                />

                <Container
                    fluid
                    className={isChatPage ? "p-0 h-100 overflow-hidden" : "p-4 flex-grow-1"}
                    style={isChatPage ? { height: '100vh' } : {}}
                >
                    {children}
                </Container>
            </main>
        </div>
    );
};

function App() {
    const [adminInfo, setAdminInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState(() => {
        const savedNotifs = localStorage.getItem('notifications');
        return savedNotifs ? JSON.parse(savedNotifs) : [];
    });

    useEffect(() => {
        const storedAdminInfo = localStorage.getItem('adminInfo');
        if (storedAdminInfo) {
            setAdminInfo(JSON.parse(storedAdminInfo));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (!adminInfo) return;

        const socket = io(SOCKET_URL);
        socket.on('connect', () => console.log('🟢 Socket conectado:', socket.id));

        socket.on('novo_pedido', (pedido) => {
            setNotifications(prev => [pedido, ...prev]);
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(e => console.log("Som bloqueado"));

            toast.success(
                <div>
                    <strong>💰 Novo Pedido #{pedido.id}!</strong><br />
                    Cliente: {pedido.cliente}<br />
                    Total: R$ {parseFloat(pedido.total).toFixed(2)}
                </div>,
                { position: "top-right", autoClose: 8000 }
            );
        });

        return () => socket.disconnect();
    }, [adminInfo]);

    const handleLogin = (info) => {
        localStorage.setItem('adminInfo', JSON.stringify(info));
        setAdminInfo(info);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        setAdminInfo(null);
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100">Carregando...</div>;

    const GuardiaoDeURLLogin = () => {
        const location = useLocation();
        return <Navigate to={`/login${location.search}`} replace />;
    };

    return (
        <Router>
            <StoreUrlManager />

            <PermissionProvider>
                <MobileFixStyles />
                <ToastContainer />

                {adminInfo ? (
                    <Routes>
                        <Route path="/admin/customizer" element={
                            <PrivateRoute requiredPermission="view_ecommerce">
                                <CustomizerPage />
                            </PrivateRoute>
                        } />

                        <Route path="/admin/preview-stub" element={<SitePreviewStub />} />

                        <Route path="/admin/pdv" element={
                            <PrivateRoute requiredPermission="view_ecommerce">
                                <PDVPage />
                            </PrivateRoute>
                        } />

                        <Route path="*" element={
                            <AdminLayout
                                notifications={notifications}
                                onClearNotifications={() => setNotifications([])}
                                onLogout={handleLogout}
                            >
                                <Routes>
                                    <Route path="/" element={
                                        <PrivateRoute requiredPermission="view_dashboard">
                                            <DashboardPage />
                                        </PrivateRoute>
                                    } />

                                    {/* 🚀 NOVAS ROTAS DE CONFIGURAÇÃO DA LOJA (Módulos Separados) */}
                                    <Route path="/admin/domain" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <DomainManager />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/stores" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <StoresManager />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/shipping" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <ShippingManager />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/pix-discount" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <PixDiscountModule />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/email-smtp" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <EmailSettings />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/whatsapp-integration" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <WhatsAppSettings />
                                        </PrivateRoute>
                                    } />
                                    {/* FIM DAS NOVAS ROTAS */}

                                    <Route path="/products" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <ProductListPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/product/create" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <ProductCreatePage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/product/:id/edit" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <ProductEditPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/orders" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <OrderListPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/order/:id" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <OrderDetailPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path='/admin/mercadolivre/order/:id' element={
                                        <PrivateRoute requiredPermission="view_ml">
                                            <OrderDetailMLPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/reviews" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <ReviewListPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/suppliers" element={
                                        <PrivateRoute requiredPermission="view_ecommerce">
                                            <SupplierListPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/marketing" element={
                                        <PrivateRoute requiredPermission="view_dashboard">
                                            <MarketingPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/reports" element={
                                        <PrivateRoute requiredPermission="manage_financial">
                                            <ReportsPage />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/settings/dashboard" element={
                                        <PrivateRoute requiredPermission="manage_financial">
                                            <DashboardSettingsPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/settings/gateways" element={
                                        <PrivateRoute requiredPermission="manage_financial">
                                            <GatewayConfigPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/financeiro" element={
                                        <PrivateRoute requiredPermission="manage_financial">
                                            <FinancialAuditPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/minha-fatura" element={
                                        <PrivateRoute requiredPermission="view_dashboard">
                                            <FaturaPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/gestao-financeira" element={
                                        <PrivateRoute requiredPermission="manage_financial">
                                            <FinancialModule />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/auditoria-global" element={
                                        <PrivateRoute requiredPermission="manage_users">
                                            <GlobalAuditPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="/admin/users" element={
                                        <PrivateRoute requiredPermission="manage_users">
                                            <GerenciarUsuarios />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/permissoes" element={
                                        <PrivateRoute requiredPermission="manage_permissions">
                                            <GerenciarPermissoes />
                                        </PrivateRoute>
                                    } />
                                    <Route path="/admin/api-keys" element={
                                        <PrivateRoute requiredPermission="manage_users">
                                            <ApiKeysPage />
                                        </PrivateRoute>
                                    } />

                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </AdminLayout>
                        } />
                    </Routes>
                ) : (
                    <Routes>
                        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                        <Route path="/register" element={<SignupPage />} />
                        <Route path="*" element={<GuardiaoDeURLLogin />} />
                    </Routes>
                )}
            </PermissionProvider>
        </Router>
    );
}

export default App;