import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spinner, Badge, Row, Col, Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import SideBannerFormModal from './SideBannerFormModal';

const SideBannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentBanner, setCurrentBanner] = useState(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/banners');
            setBanners(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchBanners(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: banners.length,
        ativos: banners.filter(b => b.ativo).length,
        esquerda: banners.filter(b => b.posicao === 'esquerda').length,
        direita: banners.filter(b => b.posicao === 'direita').length
    }), [banners]);

    // --- HANDLERS ---
    const handleSave = async (formData) => {
        try {
            if (currentBanner) await api.put(`/banners/${currentBanner.id_banner}`, formData);
            else await api.post('/banners', formData);
            fetchBanners();
            setShowModal(false);
        } catch (err) { alert('Erro ao salvar banner.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este banner?')) {
            try { await api.delete(`/banners/${id}`); fetchBanners(); } catch (err) { alert('Erro ao apagar.'); }
        }
    };

    const getPositionBadge = (pos) => {
        return pos === 'esquerda' 
            ? <Badge bg="primary" className="fw-normal"><i className="bi bi-arrow-left me-1"></i> Esquerda</Badge>
            : <Badge bg="info" className="fw-normal text-white"><i className="bi bi-arrow-right me-1"></i> Direita</Badge>;
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={5}>
                    <h2 className="fw-bold mb-0 text-dark">Banners Laterais</h2>
                    <p className="text-muted mb-0 small">Publicidade vertical nas listagens.</p>
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
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVOS</small>
                                    <span className="fw-bold text-success">{stats.ativos}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>POSIÇÕES</small>
                                    <span className="text-muted small">E: <b>{stats.esquerda}</b> | D: <b>{stats.direita}</b></span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={3}>
                            <Button 
                                variant="dark" 
                                onClick={() => { setCurrentBanner(null); setShowModal(true); }} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0"
                            >
                                <i className="bi bi-plus-lg fs-5"></i>
                                <span style={{fontSize:'0.7rem'}}>NOVO</span>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Grid de Banners */}
            <AnimatePresence>
                {banners.length === 0 ? (
                    <div className="text-center p-5 border rounded-4 bg-light text-muted">
                        <i className="bi bi-layout-sidebar-inset fs-1 mb-3 d-block opacity-25"></i>
                        <p>Nenhum banner lateral cadastrado.</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={4} className="g-4">
                        {banners.map((b) => (
                            <Col key={b.id_banner}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className={`h-100 shadow-sm border-0 rounded-4 overflow-hidden ${!b.ativo ? 'opacity-75' : ''}`}>
                                        {/* Área da Imagem Vertical */}
                                        <div className="position-relative bg-light" style={{ height: '300px', overflow: 'hidden' }}>
                                            <Card.Img 
                                                variant="top" 
                                                src={b.imagem_url} 
                                                className="w-100 h-100" 
                                                style={{ objectFit: 'cover' }} 
                                            />
                                            
                                            {/* Overlay Gradiente para texto */}
                                            <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                                <div className="d-flex justify-content-between align-items-end text-white">
                                                    <div>
                                                        {getPositionBadge(b.posicao)}
                                                    </div>
                                                    <Badge bg={b.ativo ? 'success' : 'secondary'} pill>
                                                        {b.ativo ? 'ON' : 'OFF'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <Card.Body className="p-3">
                                            <h6 className="fw-bold text-dark text-truncate mb-1" title={b.titulo}>{b.titulo}</h6>
                                            
                                            <div className="d-flex align-items-center text-muted small mb-3">
                                                <i className="bi bi-link-45deg me-1 fs-5"></i>
                                                <span className="text-truncate">
                                                    {b.tipo_filtro === 'url' ? 'Link Externo' : `${b.tipo_filtro}: ${b.valor_filtro}`}
                                                </span>
                                            </div>

                                            <div className="d-grid gap-2 d-flex">
                                                <Button variant="light" size="sm" className="flex-grow-1 border" onClick={() => { setCurrentBanner(b); setShowModal(true); }}>
                                                    <i className="bi bi-pencil me-1"></i> Editar
                                                </Button>
                                                <Button variant="light" size="sm" className="border text-danger" onClick={() => deleteHandler(b.id_banner)}>
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </AnimatePresence>

            {/* Modal */}
            {showModal && (
                <SideBannerFormModal 
                    show={showModal} 
                    handleClose={() => setShowModal(false)} 
                    onSave={handleSave} 
                    banner={currentBanner} 
                />
            )}
        </Container>
    );
};

export default SideBannerManager;