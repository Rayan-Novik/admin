import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, Modal, Form, ListGroup, Spinner, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api'; 
import ImageUploader from '../../common/ImageUploader'; // 🚀 NOVO IMPORT AQUI

const MarketingCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState(null);
    
    // Configuração do Facebook
    const [fbConfig, setFbConfig] = useState({
        FB_PIXEL_ID: '',
        FB_PAGE_ID: '',
        FB_PAGE_TOKEN: '',
        FB_CATALOG_ID: '',
        FB_AD_ACCOUNT_ID: ''
    });

    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [newCamp, setNewCamp] = useState({ 
        nome: '', slug: '', data_inicio: '', data_fim: '', 
        ids_produtos: [], imagem_url: '' 
    });

    const isFacebookReady = fbConfig.FB_PAGE_TOKEN && fbConfig.FB_PAGE_ID;

    // --- CARREGAMENTO DE DADOS ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [campRes, prodRes, fbRes] = await Promise.all([
                api.get('/marketing/campaigns'),
                api.get('/produtos'),
                api.get('/apikeys/facebook').catch(() => ({ data: null }))
            ]);
            setCampaigns(campRes.data);
            setProducts(prodRes.data);
            if (fbRes.data) setFbConfig(fbRes.data);
        } catch (err) {
            console.error("Erro ao buscar dados", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: campaigns.length,
        ativas: campaigns.filter(c => c.ativo).length,
        finalizadas: campaigns.filter(c => !c.ativo).length
    }), [campaigns]);

    // --- HANDLERS ---
    const handlePostOrganico = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Publicar banner desta campanha na página do Facebook?")) return;
        
        try {
            setProcessingAction(id);
            await api.post(`/marketing/campaigns/${id}/postar-organico`);
            alert("✅ Postagem realizada com sucesso no Feed!");
        } catch (err) {
            alert("❌ Erro ao postar: " + (err.response?.data?.error || "Verifique as chaves."));
        } finally {
            setProcessingAction(null);
        }
    };

    const handleAnuncioPago = async (e, id) => {
        e.stopPropagation();
        const valor = window.prompt("Orçamento diário (R$):", "5.00");
        if (!valor) return;

        try {
            setProcessingAction(id);
            await api.post(`/marketing/campaigns/${id}/criar-anuncio-pago`, { orcamento: valor });
            alert("🚀 Campanha enviada para análise!");
        } catch (err) {
            alert("❌ Erro ao criar anúncio.");
        } finally {
            setProcessingAction(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/marketing/campaigns', newCamp);
            setShowModal(false);
            setNewCamp({ nome: '', slug: '', data_inicio: '', data_fim: '', ids_produtos: [], imagem_url: '' });
            fetchData();
        } catch (err) { alert("Erro ao criar."); }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Deseja realmente excluir?")) {
            try { await api.delete(`/marketing/campaigns/${id}`); fetchData(); } catch (err) { alert("Erro ao excluir."); }
        }
    };

    const toggleProduct = (id) => {
        const selected = newCamp.ids_produtos.includes(id)
            ? newCamp.ids_produtos.filter(pId => pId !== id)
            : [...newCamp.ids_produtos, id];
        setNewCamp({ ...newCamp, ids_produtos: selected });
    };

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-3 p-md-4">
            
            {/* 1. Header & Stats */}
            <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border border-light mb-4 mb-md-5">
                <Row className="align-items-center g-4">
                    <Col xs={12} lg={5} className="d-flex align-items-center gap-3">
                        <div className="d-none d-sm-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle flex-shrink-0" style={{ width: '56px', height: '56px' }}>
                            <i className="bi bi-megaphone-fill text-primary fs-4"></i>
                        </div>
                        <div>
                            <h4 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Campanhas</h4>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                Crie promoções, direcione o tráfego e impulsione suas vendas.
                            </p>
                        </div>
                    </Col>
                    
                    <Col xs={12} lg={7}>
                        <Row className="g-2 g-md-3 justify-content-lg-end">
                            {/* 🚀 CORREÇÃO: Usando lg="auto" com aspas */}
                            <Col xs={4} sm={3} lg="auto">
                                <div className="bg-light p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>TOTAL</small>
                                    <span className="fw-bold text-dark fs-5">{stats.total}</span>
                                </div>
                            </Col>
                            <Col xs={4} sm={3} lg="auto">
                                <div className="bg-success bg-opacity-10 p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center">
                                    <small className="text-success fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVAS</small>
                                    <span className="fw-bold text-success fs-5">{stats.ativas}</span>
                                </div>
                            </Col>
                            <Col xs={4} sm={3} lg="auto">
                                <div className="bg-secondary bg-opacity-10 p-2 rounded-3 text-center h-100 d-flex flex-column justify-content-center">
                                    <small className="text-secondary fw-bold d-block" style={{fontSize: '0.65rem'}}>OFF</small>
                                    <span className="fw-bold text-secondary fs-5">{stats.finalizadas}</span>
                                </div>
                            </Col>
                            <Col xs={12} sm={3} lg="auto" className="mt-3 mt-sm-0">
                                <Button 
                                    variant="dark" 
                                    onClick={() => setShowModal(true)} 
                                    className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-2 fw-bold"
                                    style={{ minHeight: '60px' }}
                                >
                                    <i className="bi bi-plus-lg fs-6 mb-1"></i>
                                    <span style={{fontSize:'0.65rem', letterSpacing: '0.5px'}}>NOVA</span>
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>

            {/* 2. Grid de Campanhas */}
            <AnimatePresence>
                {campaigns.length === 0 ? (
                    <div className="text-center p-5 border border-dashed rounded-4 bg-light text-muted">
                        <i className="bi bi-megaphone fs-1 mb-3 d-block opacity-25"></i>
                        <p className="mb-0">Nenhuma campanha encontrada.</p>
                        <Button variant="link" onClick={() => setShowModal(true)} className="fw-bold text-decoration-none mt-2 p-0">Criar a primeira campanha</Button>
                    </div>
                ) : (
                    <Row xs={1} sm={2} lg={3} xl={4} className="g-3 g-md-4">
                        {campaigns.map(c => (
                            <Col key={c.id_campanha}>
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-100"
                                >
                                    <Card 
                                        className={`border-0 shadow-sm rounded-4 h-100 overflow-hidden d-flex flex-column ${!c.ativo ? 'opacity-75' : ''}`}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                        onClick={() => navigate(`/admin/marketing/${c.id_campanha}`)}
                                    >
                                        <div className="position-relative" style={{ height: '150px', backgroundColor: '#f8f9fa' }}>
                                            {c.imagem_url ? (
                                                <Card.Img variant="top" src={c.imagem_url} className="w-100 h-100 object-fit-cover" />
                                            ) : (
                                                <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: c.cor_tema || '#e9ecef' }}>
                                                    <i className="bi bi-image text-dark opacity-25 display-4"></i>
                                                </div>
                                            )}
                                            
                                            {/* Badge de Status flutuante */}
                                            <div className="position-absolute top-0 start-0 m-2">
                                                <Badge bg={c.ativo ? "success" : "secondary"} className="shadow-sm px-2 py-1 rounded-pill" style={{fontSize: '0.65rem'}}>
                                                    {c.ativo ? "ATIVO" : "INATIVO"}
                                                </Badge>
                                            </div>

                                            {/* Botão de excluir */}
                                            <Button 
                                                variant="light" 
                                                className="position-absolute top-0 end-0 m-2 text-danger p-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center border-0 opacity-75 btn-hover-full"
                                                style={{ zIndex: 10, width: '30px', height: '30px' }}
                                                onClick={(e) => handleDelete(e, c.id_campanha)}
                                            >
                                                <i className="bi bi-trash-fill small"></i>
                                            </Button>
                                        </div>

                                        <Card.Body className="d-flex flex-column p-3">
                                            
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-bold text-dark mb-0 text-truncate pe-2">{c.nome}</h6>
                                            </div>
                                            
                                            <div className="mb-3 d-flex flex-column gap-1">
                                                <span className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                                                    <i className="bi bi-link-45deg me-1"></i> /campanha/{c.slug}
                                                </span>
                                                <span className="text-primary fw-medium" style={{ fontSize: '0.75rem' }}>
                                                    <i className="bi bi-box-seam me-1"></i> {c.campanha_marketing_produtos?.length || 0} produtos
                                                </span>
                                            </div>
                                            
                                            {/* Barra de Progresso de Cliques */}
                                            <div className="bg-light p-2 rounded-3 mb-3 border-start border-primary border-3 mt-auto">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>Cliques</span>
                                                    <span className="fw-bold text-dark" style={{ fontSize: '0.7rem' }}>{c.cliques || 0}</span>
                                                </div>
                                                <ProgressBar now={c.cliques} max={1000} variant="primary" style={{height: '4px'}} className="rounded-pill bg-white" />
                                            </div>

                                            {/* Ações de Marketing (Facebook) */}
                                            {isFacebookReady && (
                                                <div className="pt-2 border-top d-flex flex-column gap-2">
                                                    <Button 
                                                        variant="light" 
                                                        size="sm" 
                                                        className="rounded-3 border border-secondary text-secondary fw-medium d-flex align-items-center justify-content-center"
                                                        style={{ fontSize: '0.75rem' }}
                                                        disabled={processingAction === c.id_campanha}
                                                        onClick={(e) => handlePostOrganico(e, c.id_campanha)}
                                                    >
                                                        {processingAction === c.id_campanha ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-facebook me-2 text-primary"></i>}
                                                        Postar no Feed
                                                    </Button>
                                                    
                                                    {fbConfig.FB_AD_ACCOUNT_ID && (
                                                        <Button 
                                                            variant="success" 
                                                            size="sm" 
                                                            className="rounded-3 shadow-sm fw-bold d-flex align-items-center justify-content-center bg-opacity-10"
                                                            style={{ fontSize: '0.75rem' }}
                                                            disabled={processingAction === c.id_campanha}
                                                            onClick={(e) => handleAnuncioPago(e, c.id_campanha)}
                                                        >
                                                            <i className="bi bi-rocket-takeoff-fill me-2"></i> Impulsionar Ads
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </AnimatePresence>

            {/* Modal de Criação (Responsivo) */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static" fullscreen="md-down">
                <Form onSubmit={handleCreate}>
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fw-bold h5">Nova Campanha</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-3 p-md-4">
                        <Row className="g-3 mb-4">
                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">NOME DA CAMPANHA</Form.Label>
                                    <Form.Control required placeholder="Ex: Black Friday" className="border-0 bg-light" onChange={e => setNewCamp({...newCamp, nome: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">SLUG (URL)</Form.Label>
                                    <Form.Control required placeholder="ex: black-friday" className="border-0 bg-light font-monospace" style={{ fontSize: '0.85rem' }} onChange={e => setNewCamp({...newCamp, slug: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* 🚀 O UPLOADER LINDÃO AQUI */}
                        <div className="mb-4">
                            <ImageUploader 
                                label="BANNER PRINCIPAL DA CAMPANHA"
                                imageUrl={newCamp.imagem_url}
                                onImageUpload={(url) => setNewCamp({...newCamp, imagem_url: url})}
                            />
                        </div>

                        <Row className="g-3 mb-4">
                            <Col xs={6} md={6}>
                                <Form.Label className="small fw-bold text-muted mb-1">INÍCIO</Form.Label>
                                <Form.Control type="datetime-local" size="sm" className="border-0 bg-light" required onChange={e => setNewCamp({...newCamp, data_inicio: e.target.value})} />
                            </Col>
                            <Col xs={6} md={6}>
                                <Form.Label className="small fw-bold text-muted mb-1">FIM</Form.Label>
                                <Form.Control type="datetime-local" size="sm" className="border-0 bg-light" required onChange={e => setNewCamp({...newCamp, data_fim: e.target.value})} />
                            </Col>
                        </Row>

                        <Form.Group>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="small fw-bold text-muted mb-0">PRODUTOS INCLUÍDOS</Form.Label>
                                <Badge bg="primary" className="rounded-pill">{newCamp.ids_produtos.length}</Badge>
                            </div>
                            <div className="border rounded-3 bg-light overflow-auto p-2 shadow-inner" style={{maxHeight: '200px'}}>
                                <ListGroup variant="flush" className="bg-transparent">
                                    {products.map(p => (
                                        <ListGroup.Item 
                                            key={p.id_produto} 
                                            className="d-flex justify-content-between align-items-center py-2 bg-transparent border-bottom border-light" 
                                            action 
                                            onClick={() => toggleProduct(p.id_produto)}
                                        >
                                            <div className="d-flex align-items-center small text-truncate pe-2">
                                                <Form.Check type="checkbox" className="me-2" checked={newCamp.ids_produtos.includes(p.id_produto)} readOnly />
                                                <span className="text-truncate">{p.nome}</span>
                                            </div>
                                            <Badge bg="white" text="dark" className="border shadow-sm flex-shrink-0">R$ {parseFloat(p.preco).toFixed(2)}</Badge>
                                        </ListGroup.Item>
                                    ))}
                                    {products.length === 0 && <div className="text-center py-3 text-muted small">Nenhum produto disponível.</div>}
                                </ListGroup>
                            </div>
                        </Form.Group>

                    </Modal.Body>
                    <Modal.Footer className="border-top-0 pt-0 px-3 px-md-4 pb-3 pb-md-4">
                        <Button variant="light" onClick={() => setShowModal(false)} className="fw-medium">Cancelar</Button>
                        <Button variant="dark" type="submit" className="px-4 fw-bold shadow-sm rounded-pill">Salvar Campanha</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style>{`
                .border-dashed { border-style: dashed !important; }
                .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
                .btn-hover-full:hover { opacity: 1 !important; transform: scale(1.1); transition: all 0.2s; }
            `}</style>
        </Container>
    );
};

export default MarketingCampaigns;