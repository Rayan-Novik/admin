import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, Modal, Form, ListGroup, Spinner, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api'; 

const MarketingCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
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
                api.get('/apikeys/facebook')
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

    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            setUploading(true);
            const { data } = await api.post('/uploadimages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setNewCamp({ ...newCamp, imagem_url: data.imagePath });
        } catch (err) { alert("Erro no upload."); } finally { setUploading(false); }
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

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={5}>
                    <h2 className="fw-bold mb-0 text-dark">Campanhas</h2>
                    <p className="text-muted mb-0 small">Gerencie promoções e impulsione vendas.</p>
                </Col>
                <Col md={12} lg={7}>
                    <Row className="g-2">
                        <Col xs={6} sm={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>TOTAL</small>
                                    <span className="fw-bold text-dark">{stats.total}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVAS</small>
                                    <span className="fw-bold text-success">{stats.ativas}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>OFF</small>
                                    <span className="fw-bold text-secondary">{stats.finalizadas}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={3}>
                            <Button 
                                variant="primary" 
                                onClick={() => setShowModal(true)} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0 fw-bold"
                            >
                                <i className="bi bi-megaphone fs-5"></i>
                                <span style={{fontSize:'0.7rem'}}>NOVA</span>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Grid de Campanhas */}
            <AnimatePresence>
                <Row className="g-4">
                    {campaigns.map(c => (
                        <Col md={6} lg={4} key={c.id_campanha}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card 
                                    className="border-0 shadow-sm rounded-4 h-100 overflow-hidden" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/admin/marketing/${c.id_campanha}`)}
                                >
                                    <div className="position-relative" style={{ height: '180px', backgroundColor: '#f8f9fa' }}>
                                        {c.imagem_url ? (
                                            <Card.Img variant="top" src={c.imagem_url} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: c.cor_tema || '#0d6efd' }}>
                                                <i className="bi bi-image text-white opacity-50 display-4"></i>
                                            </div>
                                        )}
                                        
                                        <Button 
                                            variant="white" 
                                            className="position-absolute top-0 end-0 m-2 text-danger p-1 shadow-sm rounded-circle"
                                            style={{ zIndex: 10, width: '32px', height: '32px' }}
                                            onClick={(e) => handleDelete(e, c.id_campanha)}
                                        >
                                            <i className="bi bi-trash3-fill"></i>
                                        </Button>
                                    </div>

                                    <Card.Body className="d-flex flex-column">
                                        <div className="d-flex justify-content-between mb-2">
                                            <Badge bg={c.ativo ? "success" : "secondary"} className="rounded-pill px-2 fw-normal">
                                                {c.ativo ? "Ativa" : "Inativa"}
                                            </Badge>
                                            <span className="text-muted small">
                                                {c.campanha_marketing_produtos?.length || 0} produtos
                                            </span>
                                        </div>
                                        
                                        <h5 className="fw-bold text-dark mb-1 text-truncate">{c.nome}</h5>
                                        <code className="text-primary d-block mb-3 small text-truncate">/campanha/{c.slug}</code>
                                        
                                        {/* Barra de Progresso de Cliques */}
                                        <div className="bg-light p-3 rounded-3 mb-3 border-start border-primary border-4">
                                            <div className="d-flex justify-content-between small mb-1 fw-bold text-muted text-uppercase" style={{ fontSize: '10px' }}>
                                                <span>Cliques</span>
                                                <span>{c.cliques || 0}</span>
                                            </div>
                                            <ProgressBar now={c.cliques} max={1000} variant="primary" style={{height: '6px'}} className="rounded-pill" />
                                        </div>

                                        {/* Ações de Marketing */}
                                        {isFacebookReady && (
                                            <div className="mt-auto pt-3 border-top d-grid gap-2">
                                                <Button 
                                                    variant="outline-dark" 
                                                    size="sm" 
                                                    className="rounded-pill border"
                                                    disabled={processingAction === c.id_campanha}
                                                    onClick={(e) => handlePostOrganico(e, c.id_campanha)}
                                                >
                                                    {processingAction === c.id_campanha ? <Spinner size="sm"/> : <><i className="bi bi-facebook me-2"></i>Postar Orgânico</>}
                                                </Button>
                                                
                                                {fbConfig.FB_AD_ACCOUNT_ID && (
                                                    <Button 
                                                        variant="success" 
                                                        size="sm" 
                                                        className="rounded-pill border-0 shadow-sm"
                                                        disabled={processingAction === c.id_campanha}
                                                        onClick={(e) => handleAnuncioPago(e, c.id_campanha)}
                                                    >
                                                        <i className="bi bi-cash-stack me-2"></i>Criar Anúncio (Ads)
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
            </AnimatePresence>

            {/* Modal de Criação */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
                <Form onSubmit={handleCreate}>
                    <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold h5">Nova Campanha</Modal.Title></Modal.Header>
                    <Modal.Body className="p-4">
                        <Row className="g-3 mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">NOME</Form.Label>
                                    <Form.Control required onChange={e => setNewCamp({...newCamp, nome: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">SLUG (URL)</Form.Label>
                                    <Form.Control required placeholder="ex: ofertas-verao" onChange={e => setNewCamp({...newCamp, slug: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-primary">BANNER (UPLOAD)</Form.Label>
                            <div className="d-flex gap-3 align-items-center">
                                <Form.Control type="file" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
                                {uploading && <Spinner animation="border" size="sm" variant="primary" />}
                            </div>
                            {newCamp.imagem_url && (
                                <div className="mt-2 border rounded overflow-hidden" style={{ height: '100px', width: '200px' }}>
                                    <img src={newCamp.imagem_url} alt="Preview" className="w-100 h-100 object-fit-cover" />
                                </div>
                            )}
                        </Form.Group>

                        <Row className="g-3 mb-4">
                            <Col md={6}><Form.Label className="small fw-bold text-muted">INÍCIO</Form.Label><Form.Control type="datetime-local" required onChange={e => setNewCamp({...newCamp, data_inicio: e.target.value})} /></Col>
                            <Col md={6}><Form.Label className="small fw-bold text-muted">FIM</Form.Label><Form.Control type="datetime-local" required onChange={e => setNewCamp({...newCamp, data_fim: e.target.value})} /></Col>
                        </Row>

                        <Form.Label className="small fw-bold text-muted">SELECIONAR PRODUTOS ({newCamp.ids_produtos.length})</Form.Label>
                        <div className="border rounded-3 bg-light overflow-auto p-2" style={{maxHeight: '200px'}}>
                            <ListGroup variant="flush" className="bg-transparent">
                                {products.map(p => (
                                    <ListGroup.Item key={p.id_produto} className="d-flex justify-content-between align-items-center py-2 bg-transparent border-bottom" action onClick={() => toggleProduct(p.id_produto)}>
                                        <div className="d-flex align-items-center small">
                                            <Form.Check type="checkbox" className="me-2" checked={newCamp.ids_produtos.includes(p.id_produto)} readOnly />
                                            {p.nome}
                                        </div>
                                        <Badge bg="light" text="dark" className="border">R$ {parseFloat(p.preco).toFixed(2)}</Badge>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm" disabled={uploading}>Criar Campanha</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default MarketingCampaigns;