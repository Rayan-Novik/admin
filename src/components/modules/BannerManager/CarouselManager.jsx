import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Alert, Modal, Form, Card, Row, Col, Badge, Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

// --- Modal de Edição/Criação (MANTIDO E OTIMIZADO) ---
const SlideFormModal = ({ show, handleClose, onSave, slide }) => {
    const [formData, setFormData] = useState({
        imagem_url: '',
        link_url: '',
        titulo: '',
        subtitulo: '',
        ativo: true,
    });

    useEffect(() => {
        if (slide) {
            setFormData({
                imagem_url: slide.imagem_url || '',
                link_url: slide.link_url || '',
                titulo: slide.titulo || '',
                subtitulo: slide.subtitulo || '',
                ativo: slide.ativo !== undefined ? slide.ativo : true,
            });
        } else {
            setFormData({ imagem_url: '', link_url: '', titulo: '', subtitulo: '', ativo: true });
        }
    }, [slide]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">{slide ? 'Editar Slide' : 'Novo Slide'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                    <Row className="g-4">
                        <Col md={12}>
                            <ImageUploader
                                label="Imagem do Banner (Recomendado: 1920x600px)"
                                imageUrl={formData.imagem_url}
                                onImageUpload={(newUrl) => setFormData(prev => ({ ...prev, imagem_url: newUrl }))}
                            />
                        </Col>
                        
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-bold small text-muted text-uppercase">Link de Destino</Form.Label>
                                <Form.Control type="text" name="link_url" value={formData.link_url} onChange={handleChange} placeholder="Ex: /categoria/promocao" />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small text-muted text-uppercase">Título (Opcional)</Form.Label>
                                <Form.Control type="text" name="titulo" value={formData.titulo} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small text-muted text-uppercase">Subtítulo (Opcional)</Form.Label>
                                <Form.Control type="text" name="subtitulo" value={formData.subtitulo} onChange={handleChange} />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Check 
                                type="switch" 
                                id="ativo-switch"
                                label="Slide Ativo" 
                                name="ativo" 
                                checked={formData.ativo} 
                                onChange={handleChange} 
                                className="fw-bold text-success"
                            />
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4 pt-3 border-top gap-2">
                        <Button variant="light" onClick={handleClose}>Cancelar</Button>
                        <Button variant="primary" type="submit" className="px-4 fw-bold shadow-sm">Salvar</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// --- Componente Principal ---
const CarouselManager = () => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(null);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/carrossel');
            setSlides(data);
        } catch (err) { setError('Não foi possível carregar os slides.'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSlides(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: slides.length,
        ativos: slides.filter(s => s.ativo).length,
    }), [slides]);

    // --- HANDLERS ---
    const handleShowModal = (slide = null) => {
        setCurrentSlide(slide);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        try {
            if (currentSlide) await api.put(`/carrossel/${currentSlide.id_slide}`, formData);
            else await api.post('/carrossel', formData);
            fetchSlides();
            setShowModal(false);
        } catch (err) { alert('Erro ao salvar slide.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este slide?')) {
            try { await api.delete(`/carrossel/${id}`); fetchSlides(); } 
            catch (err) { alert('Erro ao apagar slide.'); }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant='danger' className="m-4 rounded-3 shadow-sm">{error}</Alert>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={6}>
                    <h2 className="fw-bold mb-0 text-dark">Carrossel Principal</h2>
                    <p className="text-muted mb-0 small">Banners rotativos da página inicial.</p>
                </Col>
                <Col md={12} lg={6}>
                    <Row className="g-2 justify-content-lg-end">
                        <Col xs={6} sm={4} lg={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>TOTAL</small>
                                    <span className="fw-bold text-dark">{stats.total}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6} sm={4} lg={3}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="p-2 text-center">
                                    <small className="text-muted fw-bold d-block" style={{fontSize: '0.65rem'}}>ATIVOS</small>
                                    <span className="fw-bold text-success">{stats.ativos}</span>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={4} lg={4}>
                            <Button 
                                variant="dark" 
                                onClick={() => handleShowModal()} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-bold"
                            >
                                <i className="bi bi-plus-lg me-2"></i> Novo Slide
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Grid de Slides */}
            <AnimatePresence>
                {slides.length === 0 ? (
                    <div className="text-center p-5 border rounded-4 bg-light text-muted">
                        <i className="bi bi-images fs-1 mb-3 d-block opacity-25"></i>
                        <p>Nenhum slide cadastrado.</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} xl={3} className="g-4">
                        {slides.map(slide => (
                            <Col key={slide.id_slide}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className={`h-100 shadow-sm border-0 overflow-hidden ${!slide.ativo ? 'opacity-75' : ''}`}>
                                        
                                        {/* Área da Imagem */}
                                        <div className="position-relative bg-light" style={{ height: '180px' }}>
                                            <Card.Img 
                                                variant="top" 
                                                src={slide.imagem_url} 
                                                className="w-100 h-100 object-fit-cover"
                                                alt={slide.titulo || 'Slide'}
                                            />
                                            <div className="position-absolute top-0 end-0 p-2">
                                                <Badge bg={slide.ativo ? 'success' : 'secondary'} pill className="shadow-sm">
                                                    {slide.ativo ? 'ON' : 'OFF'}
                                                </Badge>
                                            </div>
                                            {/* Gradiente para texto legível */}
                                            <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                                <h6 className="fw-bold text-white text-truncate mb-0 text-shadow">{slide.titulo || '(Sem Título)'}</h6>
                                            </div>
                                        </div>

                                        <Card.Body className="d-flex flex-column p-3">
                                            <div className="mb-3">
                                                <small className="text-muted d-block text-truncate">
                                                    <i className="bi bi-card-text me-1"></i> {slide.subtitulo || '-'}
                                                </small>
                                                <small className="text-primary d-block text-truncate" title={slide.link_url}>
                                                    <i className="bi bi-link-45deg me-1"></i> {slide.link_url || 'Sem link'}
                                                </small>
                                            </div>

                                            <div className="mt-auto d-flex gap-2">
                                                <Button variant="light" size="sm" className="flex-grow-1 border" onClick={() => handleShowModal(slide)}>
                                                    <i className="bi bi-pencil me-1"></i> Editar
                                                </Button>
                                                <Button variant="light" size="sm" className="border text-danger" onClick={() => deleteHandler(slide.id_slide)}>
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
                <SlideFormModal
                    show={showModal}
                    handleClose={() => setShowModal(false)}
                    onSave={handleSave}
                    slide={currentSlide}
                />
            )}
        </Container>
    );
};

export default CarouselManager;