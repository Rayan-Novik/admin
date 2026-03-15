import React from 'react';
import { Tab, Nav, Container } from 'react-bootstrap';

// ✅ Módulo de Campanhas (Caminho mantido conforme solicitado)
import MarketingCampaigns from '../components/modules/BannerManager/MarketingCampaigns'; 

// ✅ Gerenciadores localizados em src/components/modules/BannerManager/
import HeroBannerManager from '../components/modules/BannerManager/HeroBannerManager';
import SideBannerManager from '../components/modules/BannerManager/SideBannerManager';
import ComunicadoManager from '../components/modules/BannerManager/ComunicadoManager';
import CategoryFeaturesManager from '../components/modules/BannerManager/CategoryFeaturesManager';
import CarouselManager from '../components/modules/BannerManager/CarouselManager';
import CouponsModule from '../components/modules/BannerManager/CouponsModule'; // ✅ Novo Módulo

const MarketingPage = () => {
    return (
        <Container fluid className="py-4 px-lg-5">
            {/* Título Principal */}
            <div className="mb-4">
                <h2 className="fw-bold text-dark mb-1">Central de Marketing e Vitrine</h2>
                <p className="text-muted small">Gerencie campanhas, banners, carrosséis, destaques e cupons da loja.</p>
            </div>

            <Tab.Container defaultActiveKey="marketing">
                {/* Menu de Abas Unificado (Scroll horizontal automático em telas pequenas) */}
                <div className="d-flex overflow-auto pb-2 mb-3 no-scrollbar" style={{ gap: '10px' }}>
                    <Nav variant="pills" className="flex-nowrap bg-light p-1 rounded-4 border shadow-sm">
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
                    </Nav>
                </div>

                {/* Conteúdo das Abas */}
                <Tab.Content className="mt-4">
                    {/* 1. Campanhas de Marketing */}
                    <Tab.Pane eventKey="marketing">
                        <MarketingCampaigns />
                    </Tab.Pane>

                    {/* 2. Cupons de Desconto */}
                    <Tab.Pane eventKey="cupons">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <CouponsModule />
                        </div>
                    </Tab.Pane>

                    {/* 3. Banner Principal */}
                    <Tab.Pane eventKey="hero-banner">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <HeroBannerManager />
                        </div>
                    </Tab.Pane>

                    {/* 4. Banners Laterais */}
                    <Tab.Pane eventKey="side-banners">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <SideBannerManager />
                        </div>
                    </Tab.Pane>

                    {/* 5. Carrosséis de Produtos/Categorias */}
                    <Tab.Pane eventKey="carousels">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <CarouselManager />
                        </div>
                    </Tab.Pane>

                    {/* 6. Destaques por Categoria */}
                    <Tab.Pane eventKey="category-features">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <CategoryFeaturesManager />
                        </div>
                    </Tab.Pane>

                    {/* 7. Comunicados */}
                    <Tab.Pane eventKey="comunicados">
                        <div className="bg-white p-3 rounded-4 shadow-sm border">
                            <ComunicadoManager />
                        </div>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .nav-pills .nav-link {
                    color: #6c757d;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                    font-size: 0.85rem;
                }
                
                .nav-pills .nav-link.active {
                    background-color: #0d6efd;
                    color: white !important;
                    box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2);
                }

                .nav-pills .nav-link:hover:not(.active) {
                    background-color: #e9ecef;
                    color: #0d6efd;
                }
            `}</style>
        </Container>
    );
};

export default MarketingPage;