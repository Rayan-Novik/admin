import React, { useState, useEffect } from 'react';
import { Card, Row, Col, ProgressBar, Spinner, Badge, Image, ListGroup, Modal, Button, Alert, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ReviewsSummary = ({ dateRange }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DO POPUP ---
    const [showModal, setShowModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [dateRange]);

    const fetchReviews = async () => {
        if (!dateRange?.startDate) return;
        setLoading(true);
        try {
            const { data } = await api.get('/dashboard/reviews-summary', {
                params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
            });
            setData(data);
        } catch (err) { 
            console.error("Erro ao buscar avaliações:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    // ✅ Função para extrair todas as imagens (trata String e JSON Array)
    const parseImages = (imgSource) => {
        if (!imgSource) return [];
        try {
            if (typeof imgSource === 'string' && imgSource.startsWith('[')) {
                return JSON.parse(imgSource);
            }
            return [imgSource];
        } catch (e) {
            return [imgSource];
        }
    };

    const handleOpenReview = (rev) => {
        setSelectedReview(rev);
        setReplyText(rev.resposta_admin || ''); 
        setShowModal(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || selectedReview.resposta_admin) return;
        
        setSending(true);
        try {
            await api.put(`/produtos/admin/${selectedReview.id_avaliacao}/reply`, {
                resposta: replyText
            });
            setShowModal(false);
            fetchReviews(); 
        } catch (error) {
            console.error("Erro ao responder:", error);
            alert("Não foi possível salvar a resposta.");
        } finally {
            setSending(false);
        }
    };

    const renderStars = (nota, size = '0.85rem') => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star-fill ${i < nota ? 'text-warning' : 'text-secondary opacity-25'}`} style={{ fontSize: size, marginRight: '2px' }}></i>
        ));
    };

    if (loading) return (
        <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="grow" variant="warning" />
            </Card.Body>
        </Card>
    );

    return (
        <>
            <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-0">Satisfação Geral</h5>
                        <small className="text-muted">Feedbacks dos consumidores</small>
                    </div>
                    <Badge bg="primary" className="bg-opacity-10 text-primary px-3">Review Panel</Badge>
                </Card.Header>

                <Card.Body className="p-4">
                    <div className="bg-light rounded-4 p-3 mb-4 border border-white shadow-sm text-center">
                        <span className="display-5 fw-bold text-dark d-block">{data?.mediaGeral}</span>
                        {renderStars(Math.round(data?.mediaGeral), '1.1rem')}
                        <div className="text-muted small mt-1">{data?.total} avaliações</div>
                    </div>

                    <h6 className="fw-bold text-uppercase small text-muted mb-3">Feedbacks Recentes</h6>
                    <div className="custom-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <ListGroup variant="flush">
                            {data?.recentes?.map((rev) => {
                                const customerImages = parseImages(rev.imagem_url);
                                return (
                                    <ListGroup.Item 
                                        key={rev.id_avaliacao} 
                                        className={`px-0 py-3 border-light bg-transparent hover-item cursor-pointer ${rev.resposta_admin ? 'opacity-75' : ''}`}
                                        onClick={() => handleOpenReview(rev)}
                                    >
                                        <div className="d-flex align-items-start">
                                            <Image 
                                                src={rev.produtos?.imagem_url || 'https://placehold.co/45x45?text=Prod'} 
                                                rounded 
                                                style={{ width: '45px', height: '45px', objectFit: 'cover' }} 
                                                className="me-3 border shadow-sm" 
                                            />
                                            <div className="flex-grow-1 min-width-0">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-bold text-dark small text-truncate" style={{maxWidth: '120px'}}>
                                                        {rev.usuarios?.nome_completo || 'Cliente'}
                                                    </span>
                                                    <div className="d-flex align-items-center">
                                                        {customerImages.length > 0 && (
                                                            <div className="position-relative me-2">
                                                                <i className="bi bi-camera-fill text-primary"></i>
                                                                <small className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.5rem'}}>{customerImages.length}</small>
                                                            </div>
                                                        )}
                                                        {rev.resposta_admin && <i className="bi bi-patch-check-fill text-success me-2" title="Já respondido"></i>}
                                                        <small className="text-muted" style={{fontSize: '0.65rem'}}>
                                                            {rev.data_avaliacao ? new Date(rev.data_avaliacao).toLocaleDateString() : 'n/a'}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="mb-1">{renderStars(rev.nota, '0.75rem')}</div>
                                                <p className="text-muted small mb-0 text-truncate">"{rev.comentario || 'Sem comentário'}"</p>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedReview && (
                    <>
                        <div className="p-4 text-white position-relative" style={{ background: selectedReview.resposta_admin ? '#212529' : 'linear-gradient(135deg, #ffc107 0%, #f39c12 100%)' }}>
                            <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                <i className="bi bi-x-lg text-dark"></i>
                            </button>
                            <div className="d-flex align-items-center">
                                <Image src={selectedReview.produtos?.imagem_url || 'https://placehold.co/60x60'} roundedCircle style={{ width: '60px', height: '60px', objectFit: 'cover' }} className="me-3 border border-2 border-white" />
                                <div>
                                    <h5 className="fw-bold mb-0">{selectedReview.usuarios?.nome_completo || 'Cliente'}</h5>
                                    <small className="opacity-75">{selectedReview.produtos?.nome}</small>
                                </div>
                            </div>
                        </div>

                        <Modal.Body className="p-4 bg-light">
                            <Row className="g-4">
                                <Col md={parseImages(selectedReview.imagem_url).length > 0 ? 7 : 12}>
                                    <div className="mb-4 text-center text-md-start">
                                        <div className="display-6 mb-2">{renderStars(selectedReview.nota, '1.5rem')}</div>
                                        <Badge bg="white" text="dark" className="border shadow-sm px-3 py-2 mb-3">
                                            Avaliado em: {selectedReview.data_avaliacao ? new Date(selectedReview.data_avaliacao).toLocaleDateString() : 'Data n/a'}
                                        </Badge>
                                        <h6 className="fw-bold text-muted small text-uppercase mb-2">Comentário do Cliente:</h6>
                                        <p className="p-3 bg-white rounded-3 border mb-0 text-dark shadow-sm fst-italic">
                                            "{selectedReview.comentario || 'O cliente não deixou um comentário escrito.'}"
                                        </p>
                                    </div>

                                    <div>
                                        {selectedReview.resposta_admin ? (
                                            <>
                                                <h6 className="fw-bold text-success small text-uppercase mb-2">Sua Resposta Enviada</h6>
                                                <Alert variant="success" className="border-0 shadow-sm rounded-3">
                                                    <i className="bi bi-chat-dots-fill me-2"></i>
                                                    "{selectedReview.resposta_admin}"
                                                </Alert>
                                            </>
                                        ) : (
                                            <>
                                                <h6 className="fw-bold text-primary small text-uppercase mb-2">Sua Resposta para o Cliente</h6>
                                                <Form.Control 
                                                    as="textarea" 
                                                    rows={4} 
                                                    placeholder="Agradeça o feedback..."
                                                    className="border-0 shadow-sm rounded-3 p-3"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </Col>

                                {/* ✅ GALERIA DE TODAS AS IMAGENS ENVIADAS */}
                                {parseImages(selectedReview.imagem_url).length > 0 && (
                                    <Col md={5} className="text-center border-start">
                                        <h6 className="fw-bold text-muted small text-uppercase mb-3">Fotos enviadas pelo cliente ({parseImages(selectedReview.imagem_url).length})</h6>
                                        <Row className="g-2">
                                            {parseImages(selectedReview.imagem_url).map((img, idx) => (
                                                <Col xs={6} key={idx}>
                                                    <Image 
                                                        src={img} 
                                                        fluid 
                                                        rounded 
                                                        className="shadow-sm border review-img" 
                                                        style={{ height: '120px', width: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                                                        onClick={() => window.open(img, '_blank')}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                        <div className="mt-3">
                                            <small className="text-muted"><i className="bi bi-zoom-in me-1"></i> Clique na foto para ampliar</small>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Modal.Body>

                        <Modal.Footer className="bg-white border-0 p-3">
                            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">Fechar</Button>
                            {!selectedReview.resposta_admin && (
                                <Button 
                                    variant="primary" 
                                    className="rounded-pill px-4 fw-bold"
                                    onClick={handleSendReply}
                                    disabled={sending || !replyText.trim()}
                                >
                                    {sending ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-send-fill me-2"></i>}
                                    Salvar Resposta
                                </Button>
                            )}
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .hover-item { transition: all 0.2s; border-radius: 12px; margin-bottom: 5px; }
                .hover-item:hover { background-color: #f8f9fa !important; transform: scale(1.01); }
                .cursor-pointer { cursor: pointer; }
                .review-img:hover { filter: brightness(0.8); }
            `}</style>
        </>
    );
};

export default ReviewsSummary;