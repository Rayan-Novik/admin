import React from 'react';
    import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
    import { Container } from 'react-bootstrap';
    import { ToastContainer } from 'react-toastify';

    // 🟢 1. IMPORTANDO O HOOK DE PERMISSÃO
    import { usePermission } from '../hooks/usePermission';

    import Sidebar from '../components/Sidebar';

    import LoginPage from '../pages/LoginPage';
    import SignupPage from '../pages/SignupPage';
    import DashboardPage from '../pages/DashboardPage';
    import ProductListPage from '../pages/ProductListPage';
    import GlobalAuditPage from '../pages/GlobalAuditPage';
    import OrderListPage from '../pages/Pedidos/OrderListPage';
    import OrderDetailMLPage from '../pages/Pedidos/OrderDetailMLPage';
    import ProductEditPage from '../pages/ProductEditPage';
    import ProductCreatePage from '../pages/ProductCreatePage';
    import OrderDetailPage from '../pages/Pedidos/OrderDetailPage';
    import DashboardSettingsPage from '../pages/DashboardSettingsPage';
    import ReportsPage from '../pages/ReportsPage';
    import ReviewListPage from '../pages/ReviewListPage';
    import MarketingPage from '../pages/MarketingPage';
    import SupplierListPage from '../pages/SupplierListPage';
    import CustomizerPage from '../pages/CustomizerPage';
    import SitePreviewStub from '../pages/SitePreviewStub';
    import GerenciarUsuarios from '../pages/GerenciarUsuarios';
    import ApiKeysPage from '../pages/admin/ApiKeysPage';
    import GerenciarCargos from '../pages/GerenciarCargos';
    import IntegrationApiPage from '../pages/admin/IntegrationApiPage';

    import GatewayConfigPage from '../pages/admin/GatewayConfig';
    import FinancialAuditPage from '../pages/admin/FinancialAuditPage';
    import FinancialModule from '../pages/admin/FinancialModule';
    import FaturaPage from '../pages/admin/FaturaPage';

    import PDVPage from '../pages/PDV/PDV';
    import ComandasPage from '../pages/PDV/ComandasPage';
    import GerenciarMesas from '../pages/PDV/GerenciarMesas';

    import DomainManager from '../components/modules/AppearanceManager/DomainManager';
    import StoresManager from '../components/modules/StoresManager';
    import ShippingManager from '../components/modules/ShippingManager';
    import PixDiscountModule from '../components/modules/PixDiscountModule';
    import EmailSettings from '../components/modules/Settings/EmailSettings';

    import ConfiguracoesFiscais from '../pages/fiscal/ConfiguracoesFiscais';
    import ListaNotasFiscais from '../pages/fiscal/ListaNotasFiscais';
    import DanfeView from '../pages/fiscal/DanfeView';
    import NfceView from '../pages/fiscal/NfceView';
    // 🟢 NOVA TELA DE ENTRADA (XML)
    import ImportadorXml from '../pages/fiscal/ImportadorXml';
    import ModulosPage from '../pages/saas/ModulosPage';
    
    // 🟢 PÁGINA DE MANUTENÇÃO ADICIONADA AQUI
    import MaintenancePage from '../pages/MaintenancePage';

    import TenantsPage from '../pages/saas/TenantsPage';
    import PlanosPage from '../pages/saas/PlanosPage';
    import { WhatsappMaster } from '../pages/saas/WhatsappMaster';
    import WhatsAppChatPage from '../pages/whatsapp/WhatsAppChatPage';
    import RespostasRapidasPage from '../pages/whatsapp/RespostasRapidasPage';
    import IfoodDashboard from '../pages/admin/IfoodDashboard';
    import ImpressorasPanel from '../pages/configs/ImpressorasPanel';
    import PerfilLoja from '../pages/configs/PerfilLoja';
    import MPCallback from '../pages/MPCallback';

    // ============================================================================
    // 🟢 2. A CATRACA (PRIVATE ROUTE)
    // ============================================================================
    const PrivateRoute = ({ children, requiredPermission, requiredModule }) => {
        const { can, user } = usePermission();
        
        // 🟢 Busca os módulos ativos no localStorage (Garante que se não houver nada, o FISCAL fica ativo por padrão para não quebrar)
        const activeModules = JSON.parse(localStorage.getItem('activeModules') || '["FISCAL"]');

        // 🟢 BARREIRA 1: Verifica se o Módulo está em manutenção (Só entra aqui se a rota tiver exigido um requiredModule)
        if (requiredModule && !activeModules.includes(requiredModule)) {
            // Se estiver bloqueado, REDIRECIONA para a página separada passando o nome do módulo
            return <Navigate to={`/manutencao?modulo=${requiredModule}`} replace />;
        }

        // 🟢 BARREIRA 2: Verifica as permissões do usuário
        if (requiredPermission && !can(requiredPermission)) {
            return (
                <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center p-5 mt-5">
                    <div className="bg-danger bg-opacity-10 p-4 rounded-circle mb-3">
                        <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Acesso Restrito</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        O seu cargo atual não possui a permissão <strong>({requiredPermission})</strong> para visualizar esta página. <br />
                        Fale com o administrador da loja se precisar de acesso.
                    </p>
                </div>
            );
        }

        return children;
    };

    // ============================================================================
    // 3. LAYOUT DO ADMIN (Sem o Header)
    // ============================================================================
    const AdminLayout = ({ children, onLogout }) => {
        const location = useLocation();
        const isChatPage = location.pathname === '/admin/chat';

        return (
            <div className="d-flex admin-layout-root" style={{ minHeight: '100vh' }}>
                <div className="no-print-sidebar">
                    <Sidebar onLogout={onLogout} />
                </div>

                <main className="flex-grow-1 d-flex flex-column main-content-mobile-fix print-main-content" style={{ width: '100%', backgroundColor: 'var(--bg-main, #f8fafc)', transition: 'background-color 0.2s ease' }}>
                    <Container
                        fluid
                        className={isChatPage ? "h-100 overflow-hidden p-0" : "flex-grow-1 print-container-fix p-0"}
                        style={isChatPage ? { height: '100vh' } : {}}
                    >
                        {children}
                    </Container>
                </main>

                <style>{`
                    @media print {
                        .no-print-sidebar {
                            display: none !important;
                        }
                        .admin-layout-root {
                            display: block !important;
                        }
                        .print-main-content {
                            background-color: white !important;
                            width: 100% !important;
                            min-width: 100% !important;
                        }
                        .print-container-fix {
                            padding: 0 !important;
                        }
                    }
                `}</style>
            </div>
        );
    };

    const GuardiaoDeURLLogin = () => {
        return <Navigate to="/login" replace />;
    };

    // ============================================================================
    // 4. ROTAS DO SISTEMA
    // ============================================================================
    const AppRoutes = ({ adminInfo, handleLogin, handleLogout }) => {

        if (adminInfo) {
            return (
                <Routes>
                    <Route path="/admin/preview-stub" element={<SitePreviewStub />} />
                    
                    {/* 🟢 ROTA DE MANUTENÇÃO AQUI - Tela Cheia */}
                    <Route path="/manutencao" element={<MaintenancePage />} />

                    <Route path="/admin/pdv" element={
                        <PrivateRoute requiredPermission="PDV_ACCESS">
                            <PDVPage />
                        </PrivateRoute>
                    } />

                    <Route path="/admin/comandas" element={
                        <PrivateRoute requiredPermission="PDV_ACCESS">
                            <ComandasPage />
                        </PrivateRoute>
                    } />

                    <Route path="*" element={
                        <AdminLayout onLogout={handleLogout}>
                            <Routes>
                                {/* DASHBOARD */}
                                <Route path="/" element={<PrivateRoute requiredPermission="DASHBOARD_VIEW"><DashboardPage /></PrivateRoute>} />

                                {/* CONFIGURAÇÕES DA LOJA */}
                                <Route path="/admin/perfil-loja" element={<PrivateRoute requiredPermission="CONFIG_UNIDADES"><PerfilLoja /></PrivateRoute>} />
                                <Route path="/admin/customizer" element={<PrivateRoute requiredPermission="CONFIG_APARENCIA"><CustomizerPage /></PrivateRoute>} />
                                <Route path="/admin/domain" element={<PrivateRoute requiredPermission="CONFIG_DOMINIO"><DomainManager /></PrivateRoute>} />
                                <Route path="/admin/stores" element={<PrivateRoute requiredPermission="CONFIG_UNIDADES"><StoresManager /></PrivateRoute>} />
                                <Route path="/admin/shipping" element={<PrivateRoute requiredPermission="CONFIG_ENVIO"><ShippingManager /></PrivateRoute>} />
                                <Route path="/admin/pix-discount" element={<PrivateRoute requiredPermission="CONFIG_PIX"><PixDiscountModule /></PrivateRoute>} />
                                <Route path="/admin/email-smtp" element={<PrivateRoute requiredPermission="CONFIG_EMAIL"><EmailSettings /></PrivateRoute>} />
                                <Route path="/admin/impressoras" element={<PrivateRoute requiredPermission="CONFIG_UNIDADES"><ImpressorasPanel /></PrivateRoute>} />
                                
                                {/* 🟢 MÓDULO FISCAL COM A NOVA TRAVA requiredModule="FISCAL" */}
                                <Route path="/admin/notas-fiscais" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW" requiredModule="FISCAL"><ListaNotasFiscais /></PrivateRoute>} />
                                <Route path="/admin/notas-entrada" element={<PrivateRoute requiredPermission="ESTOQUE_MANAGE" requiredModule="FISCAL"><ImportadorXml /></PrivateRoute>} />
                                <Route path="/admin/nfce/:id" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW" requiredModule="FISCAL"><NfceView /></PrivateRoute>} />
                                <Route path="/admin/config-fiscal" element={<PrivateRoute requiredPermission="CONFIG_INTEGRATIONS" requiredModule="FISCAL"><ConfiguracoesFiscais /></PrivateRoute>} />
                                <Route path="/admin/danfe/:id" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW" requiredModule="FISCAL"><DanfeView /></PrivateRoute>} />

                                {/* MASTER SAAS */}
                                <Route path="/admin/saas/tenants" element={<PrivateRoute><TenantsPage /></PrivateRoute>} />
                                <Route path="/admin/saas/planos" element={<PrivateRoute><PlanosPage /></PrivateRoute>} />
                                <Route path="/admin/saas/whatsapp" element={<PrivateRoute><WhatsappMaster /></PrivateRoute>} />
                                <Route path="/admin/saas/modulos" element={<PrivateRoute><ModulosPage /></PrivateRoute>} />

                                {/* PRODUTOS */}
                                <Route path="/products" element={<PrivateRoute requiredPermission="PRODUTOS_VIEW"><ProductListPage /></PrivateRoute>} />
                                <Route path="/admin/product/create" element={<PrivateRoute requiredPermission="PRODUTOS_MANAGE"><ProductCreatePage /></PrivateRoute>} />
                                <Route path="/admin/product/:id/edit" element={<PrivateRoute requiredPermission="PRODUTOS_VIEW"><ProductEditPage /></PrivateRoute>} />

                                {/* PEDIDOS */}
                                <Route path="/orders" element={<PrivateRoute requiredPermission="PEDIDOS_VIEW"><OrderListPage /></PrivateRoute>} />
                                <Route path="/admin/order/:id" element={<PrivateRoute requiredPermission="PEDIDOS_VIEW"><OrderDetailPage /></PrivateRoute>} />
                                <Route path='/admin/mercadolivre/order/:id' element={<PrivateRoute requiredPermission="PEDIDOS_VIEW"><OrderDetailMLPage /></PrivateRoute>} />

                                {/* AVALIAÇÕES E FORNECEDORES */}
                                <Route path="/admin/reviews" element={<PrivateRoute requiredPermission="PRODUTOS_VIEW"><ReviewListPage /></PrivateRoute>} />
                                <Route path="/admin/suppliers" element={<PrivateRoute requiredPermission="ESTOQUE_MANAGE"><SupplierListPage /></PrivateRoute>} />

                                {/* MARKETING E RELATÓRIOS */}
                                <Route path="/admin/marketing" element={<PrivateRoute requiredPermission="MARKETING_VIEW"><MarketingPage /></PrivateRoute>} />
                                <Route path="/reports" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW"><ReportsPage /></PrivateRoute>} />

                                {/* FINANCEIRO E GATEWAYS */}
                                <Route path="/settings/dashboard" element={<PrivateRoute><DashboardSettingsPage /></PrivateRoute>} />
                                <Route path="/settings/gateways" element={<PrivateRoute requiredPermission="CONFIG_GATEWAYS"><GatewayConfigPage /></PrivateRoute>} />
                                <Route path="/admin/financeiro" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW"><FinancialAuditPage /></PrivateRoute>} />
                                <Route path="/admin/minha-fatura" element={<PrivateRoute requiredPermission="FINANCEIRO_VIEW"><FaturaPage /></PrivateRoute>} />
                                <Route path="/admin/gestao-financeira" element={<PrivateRoute requiredPermission="CONTAS_MANAGE"><FinancialModule /></PrivateRoute>} />

                                {/* EQUIPE E PERMISSÕES */}
                                <Route path="/admin/auditoria-global" element={<PrivateRoute requiredPermission="ESTOQUE_MANAGE"><GlobalAuditPage /></PrivateRoute>} />
                                <Route path="/admin/users" element={<PrivateRoute requiredPermission="EQUIPE_VIEW"><GerenciarUsuarios /></PrivateRoute>} />
                                <Route path="/admin/permissoes" element={<PrivateRoute requiredPermission="EQUIPE_VIEW"><GerenciarCargos /></PrivateRoute>} />

                                {/* INTEGRAÇÕES E API */}
                                <Route path="/admin/api-keys" element={<PrivateRoute requiredPermission="CONFIG_INTEGRATIONS"><ApiKeysPage /></PrivateRoute>} />
                                <Route path="/admin/public-api" element={<PrivateRoute requiredPermission="CONFIG_INTEGRATIONS"><IntegrationApiPage /></PrivateRoute>} />
                                <Route path="/admin/chat" element={<PrivateRoute requiredPermission="WHATSAPP_VIEW"><WhatsAppChatPage /></PrivateRoute>} />
                                <Route path="/admin/respostas-rapidas" element={<PrivateRoute requiredPermission="WHATSAPP_VIEW"><RespostasRapidasPage /></PrivateRoute>} />

                                <Route path="/admin/ifood" element={<PrivateRoute requiredPermission="IFOOD_VIEW"><IfoodDashboard /></PrivateRoute>} />

                                <Route path="/admin/mesas" element={<PrivateRoute requiredPermission="CONFIG_UNIDADES"><GerenciarMesas /></PrivateRoute>} />

                                {/* ROTA PADRÃO (FALLBACK) */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </AdminLayout>
                    } />
                </Routes>
            );
        }

        return (
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={<SignupPage />} />
                <Route path="/mp-callback" element={<MPCallback />} />
                <Route path="*" element={<GuardiaoDeURLLogin />} />
            </Routes>
        );
    };

    export default AppRoutes;