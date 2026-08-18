import React from 'react';
import { Tab, Nav } from 'react-bootstrap';
import HeroBannerManager from './HeroBannerManager';
import SideBannerManager from './SideBannerManager';
import ComunicadoManager from './ComunicadoManager';

const BannerManager = () => {
    return (
        <Tab.Container defaultActiveKey="hero-banner">
            {/* Menu de Abas Responsivo */}
            <div className="d-flex overflow-auto pb-2 mb-3 no-scrollbar" style={{ gap: '10px' }}>
                <Nav variant="pills" className="flex-nowrap bg-light p-1 rounded-3">
                    <Nav.Item>
                        <Nav.Link eventKey="hero-banner" className="rounded-3 px-4 text-nowrap">
                            Banner Principal
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="side-banners" className="rounded-3 px-4 text-nowrap">
                            Banners Laterais
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="comunicados" className="rounded-3 px-4 text-nowrap">
                            Comunicados
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>

            <Tab.Content>
                <Tab.Pane eventKey="hero-banner">
                    <HeroBannerManager />
                </Tab.Pane>
                <Tab.Pane eventKey="side-banners">
                    <SideBannerManager />
                </Tab.Pane>
                <Tab.Pane eventKey="comunicados">
                    <ComunicadoManager />
                </Tab.Pane>
            </Tab.Content>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Tab.Container>
    );
};

export default BannerManager;