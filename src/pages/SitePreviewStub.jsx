import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Badge, Spinner, Navbar, Nav, Image, Form, InputGroup, Button, Card } from 'react-bootstrap';
import api from '../services/api';

const SitePreviewStub = () => {
    const [layoutOrder, setLayoutOrder] = useState([]);
    const [allSideBanners, setAllSideBanners] = useState([]);
    const [appearance, setAppearance] = useState({
        HEADER_PRIMARY_COLOR: '#ffc107',
        HEADER_SECONDARY_COLOR: '#0d6efd',
        FOOTER_COLOR: '#212529',
        BODY_BG_COLOR: '#f8f9fa',
        SITE_TEXT_COLOR: '#212529',
        BTN_PRIMARY_BG: '#0d6efd',
        BTN_PRIMARY_TEXT: '#ffffff',
        LOGO_URL: '',
        FAVICON_URL: '',
        SITE_TITLE: 'Minha Loja'
    });
    const [loading, setLoading] = useState(true);

    const mockCategorias = [
        { id_categoria: 1, nome: 'Eletrônicos' },
        { id_categoria: 2, nome: 'Moda' },
        { id_categoria: 3, nome: 'Casa' }
    ];

    // 🟢 Função inteligente para montar a URL da imagem (Local ou Nuvem)
    const apiBaseUrl = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace('/api', '') 
        : 'http://localhost:5000';

    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${apiBaseUrl}${cleanPath}`;
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const tenantId = localStorage.getItem('tenantId') || '1';

                const [layoutRes, appRes, bannersRes] = await Promise.all([
                    api.get('/configuracoes/homepage-layout').catch(() => ({ data: [] })),
                    api.get('/configuracoes/appearance').catch(() => ({ data: {} })),
                    api.get(`/banners/active/${tenantId}`).catch(() => ({ data: [] })) 
                ]);
                
                if (layoutRes.data) setLayoutOrder(layoutRes.data);
                if (appRes.data) setAppearance(prev => ({ ...prev, ...appRes.data }));
                
                const fetchedBanners = Array.isArray(bannersRes.data) ? bannersRes.data : [];
                setAllSideBanners(fetchedBanners);

            } catch (err) {
                console.error("Erro ao carregar sandbox", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const handleMessage = (event) => {
            if (event.data.type === 'UPDATE_LAYOUT') {
                setLayoutOrder(event.data.data);
            }
            if (event.data.type === 'UPDATE_APPEARANCE') {
                setAppearance(prev => ({ ...prev, ...event.data.data }));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const dynamicButtonStyle = {
        backgroundColor: appearance.BTN_PRIMARY_BG,
        color: appearance.BTN_PRIMARY_TEXT,
        border: 'none',
        transition: 'all 0.3s ease'
    };

    // ========================================================
    // 🌐 FAKE BROWSER TAB (Barra de Navegação Falsa do Chrome)
    // ========================================================
    const BrowserTabMock = () => (
        <div style={{ backgroundColor: '#dee1e6', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '8px 12px 0 12px', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #ccc' }}>
            {/* Bolinhas estilo Mac OS */}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '10px', marginRight: '15px', marginLeft: '5px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
            </div>
            
            {/* A Aba do Navegador com o Favicon e Título */}
            <div style={{ 
                backgroundColor: appearance.BODY_BG_COLOR || '#fff', 
                padding: '8px 15px', 
                borderTopLeftRadius: '8px', 
                borderTopRightRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                minWidth: '220px', 
                maxWidth: '280px',
                boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
            }}>
                {appearance.FAVICON_URL ? (
                    <img src={getFullUrl(appearance.FAVICON_URL)} alt="favicon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                ) : (
                    <i className="bi bi-globe2 text-muted" style={{ fontSize: '14px' }}></i>
                )}
                <span style={{ fontSize: '12px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                    {appearance.SITE_TITLE || 'Minha Loja'}
                </span>
            </div>
        </div>
    );

    const MockHeader = () => (
        <header style={{ position: "sticky", top: 0, zIndex: 1050 }}>
            <Navbar style={{ backgroundColor: appearance.HEADER_PRIMARY_COLOR }} variant="light" className="py-2 shadow-sm border-bottom">
                <Container>
                    <Navbar.Brand className="d-flex align-items-center">
                        <Image src={getFullUrl(appearance.LOGO_URL) || 'https://via.placeholder.com/150x50?text=LOGO'} alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
                    </Navbar.Brand>
                    <div className="flex-grow-1 mx-4 d-none d-lg-block" style={{ maxWidth: '500px' }}>
                        <InputGroup className="bg-white rounded-pill overflow-hidden border">
                            <Form.Control placeholder={`Buscar em ${appearance.SITE_TITLE}...`} disabled className="border-0 shadow-none ps-3" />
                            <InputGroup.Text className="bg-transparent border-0"><i className="bi bi-search"></i></InputGroup.Text>
                        </InputGroup>
                    </div>
                    <Nav className="ms-auto gap-3 flex-row align-items-center">
                        <i className="bi bi-heart fs-4 text-dark opacity-50"></i>
                        <div className="d-flex align-items-center opacity-50">
                            <i className="bi bi-bag fs-4 text-dark"></i>
                            <Badge pill bg="danger" className="ms-1" style={{fontSize: '0.6rem'}}>3</Badge>
                        </div>
                    </Nav>
                </Container>
            </Navbar>
            <Navbar style={{ backgroundColor: appearance.HEADER_SECONDARY_COLOR }} variant="dark" className="py-0 d-none d-lg-block shadow-sm">
                <Container className="justify-content-center">
                    <Nav>
                        {mockCategorias.map(cat => (
                            <Nav.Link key={cat.id_categoria} className="px-3 py-2 small fw-bold text-white text-uppercase" style={{fontSize: '0.7rem'}}>
                                {cat.nome}
                            </Nav.Link>
                        ))}
                    </Nav>
                </Container>
            </Navbar>
        </header>
    );

    const MockFooter = () => (
        <footer style={{ backgroundColor: appearance.FOOTER_COLOR }} className="text-white mt-5 p-5 text-center">
            <Container>
                <Image src={getFullUrl(appearance.LOGO_URL) || 'https://via.placeholder.com/150x50?text=LOGO'} style={{ height: '30px' }} className="mb-3 opacity-75" />
                <p className="small opacity-50 mb-0">Visualização em tempo real: {appearance.SITE_TITLE}</p>
                <small className="opacity-25">© 2026 - Editor de Aparência</small>
            </Container>
        </footer>
    );

    const renderSection = (sectionId) => {
        const SectionWrapper = ({ children, title }) => (
            <div className="section-transition" style={{ marginBottom: '40px', color: appearance.SITE_TEXT_COLOR }}>
                <Container>
                    {title && <h5 className="fw-bold mb-3 border-start border-4 ps-2" style={{ borderColor: appearance.HEADER_SECONDARY_COLOR }}>{title}</h5>}
                    {children}
                </Container>
            </div>
        );

        if (String(sectionId).startsWith('side_banner_')) {
            const idString = String(sectionId).replace('side_banner_', '');
            
            const banner = allSideBanners.find(b => String(b.id_banner) === idString || String(b.id_campanha) === idString || String(b.id) === idString);

            if (banner) {
                const isEsquerda = banner.posicao === 'esquerda';
                return (
                    <SectionWrapper key={sectionId} title={banner.titulo || 'Banner Lateral'}>
                        <Row className="align-items-stretch g-3">
                            {isEsquerda ? (
                                <>
                                    <Col md={4}><div className="d-flex align-items-center justify-content-center h-100 rounded-4 shadow-sm overflow-hidden" style={{minHeight: '300px'}}><img src={banner.imagem_url || 'https://via.placeholder.com/400x500?text=Banner'} alt="banner" style={{width:'100%', height:'100%', objectFit:'cover'}} /></div></Col>
                                    <Col md={8}><div className="h-100 bg-white border rounded-4 p-3 shadow-sm d-flex align-items-center justify-content-center text-muted fw-bold">VITRINE DE {banner.tipo_filtro === 'categoria' ? 'CATEGORIA' : 'PRODUTOS'}</div></Col>
                                </>
                            ) : (
                                <>
                                    <Col md={8}><div className="h-100 bg-white border rounded-4 p-3 shadow-sm d-flex align-items-center justify-content-center text-muted fw-bold">VITRINE DE {banner.tipo_filtro === 'categoria' ? 'CATEGORIA' : 'PRODUTOS'}</div></Col>
                                    <Col md={4}><div className="d-flex align-items-center justify-content-center h-100 rounded-4 shadow-sm overflow-hidden" style={{minHeight: '300px'}}><img src={banner.imagem_url || 'https://via.placeholder.com/400x500?text=Banner'} alt="banner" style={{width:'100%', height:'100%', objectFit:'cover'}} /></div></Col>
                                </>
                            )}
                        </Row>
                    </SectionWrapper>
                );
            }
            return null; 
        }

        switch (sectionId) {
            case 'carousel':
                return <div key="carousel" className="section-transition shadow-sm" style={{ height: '300px', background: appearance.HEADER_PRIMARY_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', marginBottom: '40px', opacity: 0.7 }}>BANNERS DO TOPO</div>;
            case 'features':
                return <SectionWrapper key="features"><div className="d-flex justify-content-around p-4 bg-white shadow-sm rounded-4 border">{[1,2,3,4,5].map(i => <div key={i} style={{width: '60px', height: '60px', borderRadius: '50%', background: '#f0f0f0'}}></div>)}</div></SectionWrapper>;
            case 'hero_banner':
                return <SectionWrapper key="hero"><div style={{height: '180px', background: appearance.HEADER_SECONDARY_COLOR, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>BANNER INSTITUCIONAL</div></SectionWrapper>;
            case 'products':
                return (
                    <SectionWrapper key="products" title="🛒 Vitrine de Produtos">
                        <Row className="g-3">
                            {[1,2,3,4].map(i => (
                                <Col key={i} xs={6} md={3}>
                                    <Card className="border-0 shadow-sm rounded-3 h-100">
                                        <div style={{height: '140px', background: '#f9f9f9'}} className="rounded-top"></div>
                                        <Card.Body className="p-2 text-center">
                                            <div className="small fw-bold mb-1">Produto Exemplo {i}</div>
                                            <div className="text-success fw-bold mb-2">R$ 99,90</div>
                                            <Button size="sm" className="w-100 rounded-pill" style={dynamicButtonStyle}>Comprar</Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </SectionWrapper>
                );
            case 'marketing':
                return <SectionWrapper key="marketing" title="🔥 Ofertas"><Row className="g-3">{[1,2].map(i => <Col key={i} md={6}><div style={{height:'140px', background:'#eee', borderRadius:'10px'}}></div></Col>)}</Row></SectionWrapper>;
            default: return null;
        }
    };

    if (loading) return (
        <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white text-primary">
            <Spinner animation="grow" />
            <p className="mt-3 fw-bold">Sincronizando Sandbox...</p>
        </div>
    );

    return (
        <div className="sandbox-wrapper" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            {/* 🟢 Renderiza a Barra de Navegador Falsa no topo */}
            <BrowserTabMock />
            
            <div className="sandbox-canvas" style={{ backgroundColor: appearance.BODY_BG_COLOR, height: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                <MockHeader />
                <main className="py-5" style={{ color: appearance.SITE_TEXT_COLOR }}>
                    {layoutOrder.length > 0 ? (
                        layoutOrder.map(section => renderSection(section.id))
                    ) : (
                        <div className="text-center p-5 text-muted">Aguardando organização do layout...</div>
                    )}
                </main>
                <MockFooter />
            </div>

            <style>{`
                .sandbox-wrapper { background: #fff; height: 100%; border: 1px solid #dee2e6; }
                .sandbox-canvas { transition: background-color 0.4s ease; }
                .sandbox-canvas::-webkit-scrollbar { width: 6px; }
                .sandbox-canvas::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
                .section-transition { animation: slideUp 0.5s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .card { transition: transform 0.3s; }
                .card:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    );
};

export default SitePreviewStub;