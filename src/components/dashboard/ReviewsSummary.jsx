import React, { useState, useEffect } from 'react';
import { Spinner, Modal, Button, Row, Col, Badge, Image as BsImage, Form, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const renderStars = (nota, size = '14px') => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star-fill ${i < nota ? 'text-warning' : 'text-secondary opacity-25'}`} style={{ fontSize: size, marginRight: '3px' }}></i>
        ));
    };

    const InfoTooltip = ({ text }) => (
        <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
            <i className="bi bi-info-circle text-muted ms-1 opacity-50" style={{ fontSize: '12px', cursor: 'help' }}></i>
        </OverlayTrigger>
    );

    return (
        <>
            {/* Adicionado "clean-card reviews-summary-card mb-4" na div principal */}
            <div className="clean-card reviews-summary-card d-flex flex-column h-100 p-4 mb-4">
                <div className="section-title mb-4 d-flex justify-content-between align-items-center">
                    <div className="reviews-summary-title">
                        <i className="bi bi-star me-2 text-muted title-icon"></i>
                        Satisfação Geral
                    </div>
                    <span className="text-muted" style={{fontSize: '12px'}}>Feedbacks</span>
                </div>

                <div className="flex-grow-1 position-relative d-flex flex-column">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: '250px' }}>
                            <Spinner animation="border" variant="secondary" size="sm" />
                        </div>
                    ) : (
                        <>
                            {/* CAIXA DE MÉDIA GERAL LIMPA */}
                            <div className="d-flex align-items-center p-3 mb-4 rounded bg-light bg-light-override" style={{ border: '1px solid #f1f5f9' }}>
                                <div className="display-4 fw-bold text-dark me-4 lh-1">{data?.mediaGeral || '0.0'}</div>
                                <div>
                                    <div className="mb-1">{renderStars(Math.round(data?.mediaGeral || 0), '16px')}</div>
                                    <div className="text-muted" style={{ fontSize: '12px' }}>Baseado em {data?.total || 0} avaliações no período</div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '13px' }}>Feedbacks Recentes</h6>
                            </div>

                            {/* LISTA DE AVALIAÇÕES */}
                            <div className="flex-grow-1 custom-scroll" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                {data?.recentes?.length > 0 ? (
                                    data.recentes.map((rev) => {
                                        const customerImages = parseImages(rev.imagem_url);
                                        const isAnswered = !!rev.resposta_admin;

                                        return (
                                            <div 
                                                key={rev.id_avaliacao} 
                                                className={`d-flex align-items-start p-3 border-bottom review-item hover-effect cursor-pointer ${isAnswered ? 'opacity-75' : ''}`}
                                                onClick={() => handleOpenReview(rev)}
                                            >
                                                <BsImage 
                                                    src={rev.produtos?.imagem_url || 'https://placehold.co/45x45?text=Prod'} 
                                                    rounded 
                                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }} 
                                                    className="me-3 border shadow-sm flex-shrink-0" 
                                                />
                                                <div className="flex-grow-1 min-width-0">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="fw-semibold text-dark customer-name text-truncate" style={{ fontSize: '13px', maxWidth: '160px' }}>
                                                            {rev.usuarios?.nome_completo || 'Cliente'}
                                                        </span>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {customerImages.length > 0 && (
                                                                <i className="bi bi-image text-muted" title="Contém fotos" style={{ fontSize: '12px' }}></i>
                                                            )}
                                                            <span className="text-muted" style={{ fontSize: '11px' }}>
                                                                {rev.data_avaliacao ? new Date(rev.data_avaliacao).toLocaleDateString() : 'n/a'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mb-1">{renderStars(rev.nota, '11px')}</div>
                                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                                        <span className="text-muted text-truncate" style={{ fontSize: '12px', maxWidth: '200px' }}>
                                                            "{rev.comentario || 'Avaliação sem texto'}"
                                                        </span>
                                                        {isAnswered ? (
                                                            <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fw-medium" style={{ fontSize: '10px' }}>Respondido</Badge>
                                                        ) : (
                                                            <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1 fw-medium" style={{ fontSize: '10px' }}>Pendente</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-5 text-muted" style={{ fontSize: '13px' }}>
                                        Nenhuma avaliação neste período.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- MODAL DETALHADO (NOVO DESIGN SAAS) --- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedReview && (
                    <>
                        <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}
                                title="Fechar"
                            >
                                <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                            </button>

                            <div className="d-flex align-items-center position-relative" style={{ zIndex: 1 }}>
                                <div className="bg-white p-1 rounded-3 shadow-sm me-4 flex-shrink-0">
                                    <BsImage src={selectedReview.produtos?.imagem_url || 'https://placehold.co/60x60?text=Img'} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '350px' }}>{selectedReview.usuarios?.nome_completo || 'Cliente'}</h4>
                                    <small className="opacity-75 d-flex align-items-center gap-2">
                                        Avaliou: <strong className="text-white">{selectedReview.produtos?.nome}</strong>
                                    </small>
                                </div>
                            </div>
                        </div>

                        <Modal.Body className="p-4" style={{ backgroundColor: '#f8fafc' }}>
                            <Row className="g-4">
                                <Col md={parseImages(selectedReview.imagem_url).length > 0 ? 7 : 12}>
                                    <div className="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div>{renderStars(selectedReview.nota, '20px')}</div>
                                            <Badge bg="light" text="dark" className="border text-muted fw-medium px-2 py-1" style={{ fontSize: '11px' }}>
                                                {selectedReview.data_avaliacao ? new Date(selectedReview.data_avaliacao).toLocaleDateString() : 'Data n/a'}
                                            </Badge>
                                        </div>
                                        
                                        <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '13px' }}>Comentário do Cliente</h6>
                                        <div className="p-3 bg-light rounded-3 border-0 text-secondary flex-grow-1 fst-italic" style={{ fontSize: '13px' }}>
                                            "{selectedReview.comentario || 'O cliente avaliou o produto sem deixar um texto explicativo.'}"
                                        </div>

                                        <hr className="my-4" style={{ borderColor: '#e2e8f0', borderTopStyle: 'dashed' }} />

                                        <div>
                                            {selectedReview.resposta_admin ? (
                                                <>
                                                    <h6 className="fw-bold text-success mb-2" style={{ fontSize: '13px' }}>Sua Resposta</h6>
                                                    <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 text-success" style={{ fontSize: '13px' }}>
                                                        {selectedReview.resposta_admin}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '13px' }}>Responder ao Cliente</h6>
                                                        <InfoTooltip text="A resposta ficará pública na página do produto." />
                                                    </div>
                                                    <Form.Control 
                                                        as="textarea" 
                                                        rows={3} 
                                                        placeholder="Escreva um agradecimento ou solução..."
                                                        className="border shadow-none rounded-3 p-3 mb-3 text-dark"
                                                        style={{ fontSize: '13px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    />
                                                    <div className="text-end">
                                                        <Button 
                                                            variant="dark" 
                                                            size="sm"
                                                            className="rounded-pill px-4 fw-medium"
                                                            onClick={handleSendReply}
                                                            disabled={sending || !replyText.trim()}
                                                        >
                                                            {sending ? <Spinner size="sm" className="me-2" /> : null}
                                                            Enviar Resposta
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Col>

                                {/* GALERIA DE FOTOS (Se houver) */}
                                {parseImages(selectedReview.imagem_url).length > 0 && (
                                    <Col md={5}>
                                        <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                                            <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '13px' }}>Fotos do Cliente</h6>
                                            <Row className="g-2">
                                                {parseImages(selectedReview.imagem_url).map((img, idx) => (
                                                    <Col xs={6} key={idx}>
                                                        <BsImage 
                                                            src={img} 
                                                            fluid 
                                                            rounded 
                                                            className="border review-img" 
                                                            style={{ height: '110px', width: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                                                            onClick={() => window.open(img, '_blank')}
                                                        />
                                                    </Col>
                                                ))}
                                            </Row>
                                            <div className="mt-3 text-center">
                                                <small className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-zoom-in me-1"></i> Clique na foto para ampliar</small>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Modal.Body>
                    </>
                )}
            </Modal>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .hover-effect { transition: background-color 0.2s ease; border-radius: 8px; margin-bottom: 2px; }
                .hover-effect:hover { background-color: #f8fafc !important; }
                .review-img { transition: filter 0.2s; }
                .review-img:hover { filter: brightness(0.8); }

                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                .mobile-dashboard-wrapper .reviews-summary-card {
                    padding: 25px 20px !important;
                }
                .mobile-dashboard-wrapper .reviews-summary-title {
                    font-size: 12px !important;
                    font-weight: 800 !important;
                    color: #000 !important;
                }
                .mobile-dashboard-wrapper .title-icon {
                    display: none !important;
                }
                .mobile-dashboard-wrapper .bg-light-override {
                    background-color: rgba(255, 255, 255, 0.4) !important;
                    border: none !important;
                }
                .mobile-dashboard-wrapper .review-item {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
                }
                .mobile-dashboard-wrapper .customer-name {
                    color: #000 !important;
                    font-weight: 800 !important;
                }
            `}</style>
        </>
    );
};

export default ReviewsSummary;