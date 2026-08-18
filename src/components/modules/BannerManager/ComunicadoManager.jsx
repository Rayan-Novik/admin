import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spinner, Badge, Row, Col, Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import ComunicadoFormModal from './ComunicadoFormModal';

const ComunicadoManager = () => {
    const [comunicados, setComunicados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentComunicado, setCurrentComunicado] = useState(null);

    const fetchComunicados = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/comunicados');
            setComunicados(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchComunicados(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: comunicados.length,
        ativos: comunicados.filter(c => c.ativo).length,
    }), [comunicados]);

    // --- HANDLERS ---
    const handleSave = async (formData) => {
        const dataToSend = { ...formData };
        delete dataToSend.tipo_filtro;
        delete dataToSend.valor_filtro;

        try {
            if (currentComunicado) await api.put(`/comunicados/${currentComunicado.id_comunicado}`, dataToSend);
            else await api.post('/comunicados', dataToSend);
            fetchComunicados();
            setShowModal(false);
        } catch (err) { alert('Erro ao salvar.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Apagar comunicado?')) {
            try { await api.delete(`/comunicados/${id}`); fetchComunicados(); } catch (err) { alert('Erro ao apagar.'); }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={6}>
                    <h2 className="fw-bold mb-0 text-dark">Comunicados (Pop-ups)</h2>
                    <p className="text-muted mb-0 small">Avisos que aparecem ao entrar na loja.</p>
                </Col>
                <Col md={12} lg={6}>
                    <Row className="g-2 justify-content-lg-end">
                        <Col xs={6} sm={4}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>TOTAL</small>
                                    <span className="fw-bold text-dark">{stats.total}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVOS</small>
                                    <span className="fw-bold text-success">{stats.ativos}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={4}>
                            <Button 
                                variant="dark" 
                                onClick={() => { setCurrentComunicado(null); setShowModal(true); }} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0 fw-bold"
                            >
                                <i className="bi bi-plus-lg fs-5"></i>
                                <span style={{fontSize:'0.7rem'}}>NOVO</span>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Grid de Comunicados */}
            <AnimatePresence>
                {comunicados.length === 0 ? (
                    <div className="text-center p-5 border rounded-4 bg-light text-muted">
                        <i className="bi bi-chat-square-text fs-1 mb-3 d-block opacity-25"></i>
                        <p>Nenhum comunicado cadastrado.</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                        {comunicados.map(c => (
                            <Col key={c.id_comunicado}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className={`h-100 shadow-sm border-0 rounded-4 overflow-hidden ${!c.ativo ? 'opacity-75' : ''}`}>
                                        
                                        {/* Área da Imagem */}
                                        <div className="position-relative bg-light" style={{ height: '180px' }}>
                                            <Card.Img 
                                                variant="top" 
                                                src={c.imagem_url} 
                                                className="w-100 h-100 object-fit-cover" 
                                            />
                                            <div className="position-absolute top-0 end-0 p-2">
                                                <Badge bg={c.ativo ? 'success' : 'secondary'} pill className="shadow-sm">
                                                    {c.ativo ? 'ON' : 'OFF'}
                                                </Badge>
                                            </div>
                                            
                                            {/* Gradiente para texto legível */}
                                            <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                                <h6 className="fw-bold text-white text-truncate mb-0 text-shadow">{c.titulo}</h6>
                                            </div>
                                        </div>

                                        <Card.Body className="p-3">
                                            <div className="mb-3">
                                                <small className="text-muted d-flex align-items-center text-truncate" title={c.link_url}>
                                                    <i className="bi bi-link-45deg me-1 fs-5"></i>
                                                    {c.link_url || 'Sem link'}
                                                </small>
                                            </div>

                                            <div className="mt-auto d-flex gap-2">
                                                <Button variant="light" size="sm" className="flex-grow-1 border" onClick={() => { setCurrentComunicado(c); setShowModal(true); }}>
                                                    <i className="bi bi-pencil me-1"></i> Editar
                                                </Button>
                                                <Button variant="light" size="sm" className="border text-danger" onClick={() => deleteHandler(c.id_comunicado)}>
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
                <ComunicadoFormModal 
                    show={showModal} 
                    handleClose={() => setShowModal(false)} 
                    onSave={handleSave} 
                    comunicado={currentComunicado} 
                />
            )}
        </Container>
    );
};

export default ComunicadoManager;