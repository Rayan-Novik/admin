import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Alert, Modal, Form, Image, Badge, Row, Col, Card, Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

// --- Modal de Edição (MANTIDO) ---
const DestaqueFormModal = ({ show, handleClose, onSave, destaque }) => {
    const [formData, setFormData] = useState({ imagem_url: '', link_url: '', titulo: '', ativo: true });

    useEffect(() => {
        if (destaque) { setFormData(destaque); }
        else { setFormData({ imagem_url: '', link_url: '', titulo: '', ativo: true }); }
    }, [destaque]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="md" backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">{destaque ? 'Editar Destaque' : 'Novo Destaque'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                    <div className="mb-4 d-flex justify-content-center">
                        <div style={{width: '120px'}}>
                             <ImageUploader
                                label="Ícone (Circular)"
                                imageUrl={formData.imagem_url}
                                onImageUpload={(newUrl) => setFormData(prev => ({ ...prev, imagem_url: newUrl }))}
                            />
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">TÍTULO</Form.Label>
                        <Form.Control type="text" name="titulo" value={formData.titulo} onChange={handleChange} required placeholder="Ex: Notebooks" className="border-0 shadow-sm bg-light" />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">LINK DE DESTINO</Form.Label>
                        <Form.Control type="text" name="link_url" value={formData.link_url} onChange={handleChange} placeholder="/categoria/notebooks" required className="border-0 shadow-sm bg-light" />
                        <Form.Text className="text-muted small">
                            Use <code>/categoria/nome</code> ou <code>/marca/nome</code>
                        </Form.Text>
                    </Form.Group>
                    
                    <Form.Check 
                        type="switch" 
                        id="ativo-switch"
                        label="Ativo no site" 
                        name="ativo" 
                        checked={formData.ativo} 
                        onChange={handleChange} 
                        className="mb-4 fw-bold text-primary"
                    />
                    
                    <div className="d-grid gap-2">
                        <Button variant="dark" type="submit" className="shadow-sm fw-bold rounded-pill">Salvar Destaque</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// --- Componente Principal ---
const CategoryFeaturesManager = () => {
    const [destaques, setDestaques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentDestaque, setCurrentDestaque] = useState(null);

    const fetchDestaques = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/destaques');
            setDestaques(data);
        } catch (err) { setError('Erro ao carregar destaques.'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDestaques(); }, []);

    // --- ESTATÍSTICAS ---
    const stats = useMemo(() => ({
        total: destaques.length,
        ativos: destaques.filter(d => d.ativo).length,
    }), [destaques]);

    // --- HANDLERS ---
    const handleShowModal = (destaque = null) => {
        setCurrentDestaque(destaque);
        setShowModal(true);
    };

    // ✅ CORREÇÃO: A função handleCloseModal foi adicionada aqui
    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentDestaque(null);
    };

    const handleSave = async (formData) => {
        try {
            if (currentDestaque) await api.put(`/destaques/${currentDestaque.id_destaque}`, formData);
            else await api.post('/destaques', formData);
            fetchDestaques();
            handleCloseModal(); // Usa a função para fechar e limpar estado
        } catch (err) { alert('Erro ao salvar destaque.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Apagar este destaque?')) {
            try { await api.delete(`/destaques/${id}`); fetchDestaques(); } 
            catch (err) { alert('Erro ao apagar.'); }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Alert variant='danger' className="m-4 shadow-sm rounded-3">{error}</Alert>;

    return (
        <Container fluid className="px-md-4 py-4">
            
            {/* 1. Header & Stats */}
            <Row className="align-items-center mb-4 g-3">
                <Col md={12} lg={6}>
                    <h2 className="fw-bold mb-0 text-dark">Destaques de Categoria</h2>
                    <p className="text-muted mb-0 small">Ícones de acesso rápido na home.</p>
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
                                onClick={() => handleShowModal()} 
                                className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0 fw-bold"
                            >
                                <i className="bi bi-plus-lg fs-5"></i>
                                <span style={{fontSize:'0.7rem'}}>ADICIONAR</span>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 2. Grid de Destaques */}
            <AnimatePresence>
                {destaques.length === 0 ? (
                    <div className="text-center p-5 border rounded-4 bg-light text-muted">
                        <i className="bi bi-grid-fill fs-1 mb-3 d-block opacity-25"></i>
                        <p>Nenhum destaque cadastrado.</p>
                    </div>
                ) : (
                    <Row xs={2} md={4} lg={6} xl={8} className="g-3">
                        {destaques.map(d => (
                            <Col key={d.id_destaque}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className={`h-100 shadow-sm border-0 text-center py-4 position-relative overflow-hidden ${!d.ativo ? 'opacity-75 bg-light' : ''}`}>
                                        
                                        {/* Status Badge */}
                                        <div className="position-absolute top-0 end-0 p-2">
                                            <div className={`rounded-circle ${d.ativo ? 'bg-success' : 'bg-secondary'}`} style={{width: '8px', height: '8px'}}></div>
                                        </div>

                                        <div className="mx-auto mb-3 position-relative" style={{ width: '70px', height: '70px' }}>
                                            <Image 
                                                src={d.imagem_url} 
                                                roundedCircle 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover',
                                                    border: '3px solid #f8f9fa',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                }} 
                                            />
                                        </div>
                                        
                                        <h6 className="fw-bold text-dark mb-1 text-truncate px-2" style={{fontSize: '0.9rem'}}>{d.titulo}</h6>
                                        <small className="text-muted text-truncate px-2 d-block mb-3" style={{fontSize: '0.7rem'}}>
                                            {d.link_url}
                                        </small>
                                        
                                        <div className="d-flex justify-content-center gap-2 px-3">
                                            <Button variant="light" size="sm" className="rounded-circle p-0 d-flex align-items-center justify-content-center border" style={{width: '32px', height: '32px'}} onClick={() => handleShowModal(d)}>
                                                <i className="bi bi-pencil-fill small text-secondary"></i>
                                            </Button>
                                            <Button variant="light" size="sm" className="rounded-circle p-0 d-flex align-items-center justify-content-center border text-danger" style={{width: '32px', height: '32px'}} onClick={() => deleteHandler(d.id_destaque)}>
                                                <i className="bi bi-trash-fill small"></i>
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                )}
            </AnimatePresence>

            {/* Modal */}
            {showModal && (
                <DestaqueFormModal 
                    show={showModal} 
                    handleClose={handleCloseModal} // Agora a função existe
                    onSave={handleSave} 
                    destaque={currentDestaque} 
                />
            )}
        </Container>
    );
};

export default CategoryFeaturesManager;