import React, { useState, useEffect } from 'react';
import { Tab, Nav, Container, Spinner } from 'react-bootstrap';
import api from '../services/api';

import MarketingCampaigns from '../components/modules/BannerManager/MarketingCampaigns';
import HeroBannerManager from '../components/modules/BannerManager/HeroBannerManager';
import SideBannerManager from '../components/modules/BannerManager/SideBannerManager';
import ComunicadoManager from '../components/modules/BannerManager/ComunicadoManager';
import CategoryFeaturesManager from '../components/modules/BannerManager/CategoryFeaturesManager';
import CarouselManager from '../components/modules/BannerManager/CarouselManager';
import CouponsModule from '../components/modules/BannerManager/CouponsModule';
import AgendaBannerManager from '../components/modules/BannerManager/AgendaBannerManager';
import LandingPageManager from '../components/modules/BannerManager/LandingPageManager';
import GaleriaManager from '../components/modules/BannerManager/GaleriaManager';

const MarketingPage = () => {
    const [layoutStyle, setLayoutStyle] = useState('ECOMMERCE');
    const [loadingConfig, setLoadingConfig] = useState(true);
    
    // 🟢 1. Estado controlado para saber qual aba está ativa no momento
    const [activeTab, setActiveTab] = useState('marketing');

    const fetchLayoutConfig = async () => {
        try {
            const res = await api.get('/configuracoes/STORE_LAYOUT_STYLE').catch(() => ({ data: null }));
            if (res.data && res.data.valor) {
                // 🟢 2. Garante que sempre vai ser lido em MAIÚSCULO para não falhar na verificação
                const newLayout = res.data.valor.toUpperCase();
                setLayoutStyle(newLayout);

                // 🟢 3. Atualiza a aba ativa automaticamente ao trocar o layout
                if (newLayout === 'AGENDAMENTO') {
                    setActiveTab('landing-page');
                } else {
                    setActiveTab('marketing');
                }
            }
        } catch (error) {
            console.error("Erro ao buscar configuração de layout:", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => {
        fetchLayoutConfig();

        // 🟢 4. BÔNUS: Se você mudar o layout em outra tela e voltar pra cá, ele atualiza sozinho
        window.addEventListener('focus', fetchLayoutConfig);
        return () => window.removeEventListener('focus', fetchLayoutConfig);
    }, []);

    const isAgendamento = layoutStyle === 'AGENDAMENTO';
    const isEmDesenvolvimento = layoutStyle === 'CARDAPIO' || layoutStyle === 'MERCADINHO';
    const isEcommerce = !isAgendamento && !isEmDesenvolvimento;

    if (loadingConfig) {
        return (
            <Container fluid className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="grow" variant="primary" />
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-lg-5">
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Central de Marketing e Vitrine</h2>
                <p className="text-muted small">Gerencie campanhas, banners, carrosséis, destaques e cupons da loja.</p>
            </div>

            {isEmDesenvolvimento ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 mt-4 bg-white rounded-4 shadow-sm border p-4">
                    <img
                        src="/images/desenvolvimento.png"
                        alt="Em Desenvolvimento"
                        style={{ width: '280px', maxWidth: '100%' }}
                        className="mb-4"
                    />
                    <h3 className="fw-bold text-dark mb-2">Módulo em Desenvolvimento</h3>
                    <p className="text-muted" style={{ maxWidth: '600px' }}>
                        As configurações de vitrine personalizadas para os layouts de <strong>{layoutStyle}</strong> ainda estão sendo construídas pela nossa equipe. Em breve teremos novidades!
                    </p>
                </div>
            ) : (
                /* 🟢 5. Mudamos de "defaultActiveKey" para "activeKey" e "onSelect" */
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <div className="d-flex overflow-auto pb-2 mb-3 no-scrollbar" style={{ gap: '10px' }}>
                        <Nav variant="pills" className="flex-nowrap bg-light p-1 rounded-4 border shadow-sm">

                            {isEcommerce && (
                                <>
                                    <Nav.Item>
                                        <Nav.Link eventKey="marketing" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-megaphone-fill me-2"></i> Campanhas
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="cupons" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-ticket-perforated-fill me-2"></i> Cupons
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="hero-banner" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-image-fill me-2"></i> Banner Principal
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="side-banners" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-layout-sidebar-inset me-2"></i> Banners Laterais
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="carousels" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-view-stacked me-2"></i> Carrosséis
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="category-features" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-grid-3x3-gap-fill me-2"></i> Destaques Categorias
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="comunicados" className="rounded-3 px-4 text-nowrap d-flex align-items-center">
                                            <i className="bi bi-chat-square-dots-fill me-2"></i> Comunicados
                                        </Nav.Link>
                                    </Nav.Item>
                                </>
                            )}

                            {isAgendamento && (
                                <>
                                    <Nav.Item>
                                        <Nav.Link eventKey="landing-page" className="rounded-3 px-4 text-nowrap d-flex align-items-center text-success fw-bold">
                                            <i className="bi bi-layout-template me-2"></i> Custom Landing Page
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="agenda-banner" className="rounded-3 px-4 text-nowrap d-flex align-items-center text-primary">
                                            <i className="bi bi-calendar2-check-fill me-2"></i> Banner Topo Grade
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="galeria-agendamento" className="rounded-3 px-4 text-nowrap d-flex align-items-center text-info fw-bold">
                                            <i className="bi bi-images me-2"></i> Galeria de Trabalhos
                                        </Nav.Link>
                                    </Nav.Item>
                                </>
                            )}
                        </Nav>
                    </div>

                    <Tab.Content className="mt-4">
                        {isEcommerce && (
                            <>
                                <Tab.Pane eventKey="marketing"><MarketingCampaigns /></Tab.Pane>
                                <Tab.Pane eventKey="cupons"><div className="bg-white p-3 rounded-4 shadow-sm border"><CouponsModule /></div></Tab.Pane>
                                <Tab.Pane eventKey="hero-banner"><div className="bg-white p-3 rounded-4 shadow-sm border"><HeroBannerManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="side-banners"><div className="bg-white p-3 rounded-4 shadow-sm border"><SideBannerManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="carousels"><div className="bg-white p-3 rounded-4 shadow-sm border"><CarouselManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="category-features"><div className="bg-white p-3 rounded-4 shadow-sm border"><CategoryFeaturesManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="comunicados"><div className="bg-white p-3 rounded-4 shadow-sm border"><ComunicadoManager /></div></Tab.Pane>
                            </>
                        )}

                        {isAgendamento && (
                            <>
                                <Tab.Pane eventKey="landing-page"><div className="bg-white p-3 rounded-4 shadow-sm border"><LandingPageManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="agenda-banner"><div className="bg-white p-3 rounded-4 shadow-sm border"><AgendaBannerManager /></div></Tab.Pane>
                                <Tab.Pane eventKey="galeria-agendamento"><div className="bg-white p-3 rounded-4 shadow-sm border"><GaleriaManager /></div></Tab.Pane>
                            </>
                        )}
                    </Tab.Content>
                </Tab.Container>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .nav-pills .nav-link { color: #6c757d; font-weight: 600; transition: all 0.3s ease; border: 1px solid transparent; font-size: 0.85rem; }
                .nav-pills .nav-link.active { background-color: #0d6efd; color: white !important; box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2); }
                .nav-pills .nav-link:hover:not(.active) { background-color: #e9ecef; color: #0d6efd; }
            `}</style>
        </Container>
    );
};

export default MarketingPage;