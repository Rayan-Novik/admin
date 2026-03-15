import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal, Badge, Image, Container, Spinner, Alert, Card, Tabs, Tab } from 'react-bootstrap';
// ✅ CORREÇÃO DO IMPORT
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const ReviewListPage = () => {
    const [reviews, setReviews] = useState([]);
    const [mlQuestions, setMlQuestions] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ecommerce'); 
    
    // ✅ NEW STATE: Controls visibility of the Mercado Livre tab
    const [isMlConfigured, setIsMlConfigured] = useState(false);

    // Estado para Modal de Resposta
    const [showModal, setShowModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null); 
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    // Estado para Modal de Imagem (Lightbox)
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const fetchAllData = async () => {
        try {
            setLoading(true);
            // Fetch reviews (always expected to work)
            const reviewsRes = await api.get('/produtos/admin/all');
            setReviews(reviewsRes.data);

            // Try to fetch ML questions separately to handle errors gracefully
            try {
                const mlRes = await api.get('/mercadolivre/questions');
                const questionsData = Array.isArray(mlRes.data) ? mlRes.data : (mlRes.data.questions || []);
                setMlQuestions(questionsData);
                setIsMlConfigured(true); // Success means it is configured
            } catch (mlErr) {
                console.warn("Mercado Livre API error:", mlErr);
                // Check if the error is specifically about configuration
                if (mlErr.response?.data?.message?.includes("não configurado") || mlErr.response?.status === 400) {
                    setIsMlConfigured(false);
                } else {
                    // For other errors (network, etc), we might still want to show the tab but empty, 
                    // or hide it. Let's hide it if we can't connect properly to be safe.
                    setIsMlConfigured(false); 
                }
            }
            
            if (activeTab === 'mercadolivre' && isMlConfigured) {
                toast.info('Mensagens sincronizadas!');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleOpenReplyModal = (review) => {
        if (review.resposta_admin) return;
        setSelectedQuestion(null);
        setSelectedReview(review);
        setReplyText('');
        setShowModal(true);
    };

    const handleOpenMLReplyModal = (question) => {
        if (question.status === 'ANSWERED' || question.answer) {
            toast.info('Esta pergunta já foi respondida.');
            return;
        }
        setSelectedReview(null);
        setSelectedQuestion(question);
        setReplyText('');
        setShowModal(true);
    };

    // const handleOpenImageModal = (imgUrl) => { ... } // (Not used in the snippet provided but good to keep)

    const submitReplyHandler = async () => {
        if (!replyText.trim()) return;
        
        setReplying(true);
        try {
            if (selectedReview) {
                await api.put(`/produtos/admin/${selectedReview.id_avaliacao}/reply`, {
                    resposta: replyText
                });
                toast.success('Resposta salva no E-commerce!');
            } else if (selectedQuestion) {
                await api.post('/mercadolivre/questions/answer', {
                    question_id: selectedQuestion.id,
                    text: replyText
                });
                toast.success('Pergunta respondida com sucesso!');
            }
            
            setShowModal(false);
            fetchAllData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Erro ao salvar resposta.';
            toast.error(msg);
        } finally {
            setReplying(false);
        }
    };

    const renderStars = (nota) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`fas fa-star ${i < nota ? 'text-warning' : 'text-muted opacity-25'}`} style={{fontSize: '0.8rem'}}></i>
        ));
    };

    return (
        <Container fluid className="py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Central de Mensagens</h2>
                    <p className="text-muted mb-0 small">
                        Ecommerce {isMlConfigured && '& Mercado Livre'}
                    </p>
                </div>
                
                <div className="d-flex align-items-center gap-3">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="rounded-pill px-3 shadow-sm fw-bold" 
                        onClick={fetchAllData}
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" className="me-2"/> : <i className="fas fa-sync-alt me-2"></i>}
                        Sincronizar Tudo
                    </Button>

                    <Badge bg="white" text="dark" className="shadow-sm px-3 py-2 rounded-pill border fw-normal">
                        {activeTab === 'ecommerce' ? `Avaliações: ${reviews.length}` : `Perguntas: ${mlQuestions.length}`}
                    </Badge>
                </div>
            </div>

            {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{error}</Alert>}

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4 custom-tabs border-0"
            >
                {/* ABA ECOMMERCE */}
                <Tab eventKey="ecommerce" title={<span><i className="bi bi-shop me-2"></i>E-commerce</span>}>
                    {loading && reviews.length === 0 ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0 custom-table">
                                    <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 py-3">Data</th>
                                                <th>Produto</th>
                                                <th>Cliente</th>
                                                <th>Comentário / Resposta</th>
                                                <th className="pe-4 text-end">Ação</th>
                                            </tr>
                                    </thead>
                                    <tbody>
                                            {reviews.map((review) => (
                                                <tr key={review.id_avaliacao} className="transition-hover">
                                                    <td className="ps-4 small text-muted">{new Date(review.data_avaliacao).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="rounded-3 me-2 border bg-light shadow-sm" style={{width: 48, height: 48, overflow: 'hidden'}}>
                                                                <Image src={review.produtos?.imagem_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                            </div>
                                                            <div className="text-truncate fw-bold text-dark small" style={{maxWidth: '150px'}}>{review.produtos?.nome}</div>
                                                        </div>
                                                    </td>
                                                    <td className="small">{review.usuarios?.nome_completo}</td>
                                                    <td className="small">
                                                        <div className="mb-1">{renderStars(review.nota)}</div>
                                                        <div className="text-dark">"{review.comentario}"</div>
                                                        {review.resposta_admin && (
                                                            <div className="mt-2 p-2 bg-light rounded border-start border-3 border-primary" style={{fontSize: '0.8rem'}}>
                                                                <span className="text-primary fw-bold">Resposta:</span> {review.resposta_admin}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        {review.resposta_admin ? (
                                                            <Badge bg="secondary" className="text-white px-3 py-2 rounded-pill shadow-sm">Respondido</Badge>
                                                        ) : (
                                                            <Button variant="dark" size="sm" className="rounded-pill px-3 shadow-sm" onClick={() => handleOpenReplyModal(review)}>
                                                                Responder
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card>
                    )}
                </Tab>

                {/* ABA MERCADO LIVRE - CONDITIONAL RENDER */}
                {isMlConfigured && (
                    <Tab eventKey="mercadolivre" title={<span><img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/favicon.svg" width="16" className="me-2" alt="ML"/>Mercado Livre</span>}>
                        {loading && mlQuestions.length === 0 ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
                        ) : (
                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden border-start border-warning border-4">
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0 custom-table">
                                        <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-4 py-3">Recebida</th>
                                                    <th>Produto</th>
                                                    <th>Pergunta / Resposta</th>
                                                    <th className="pe-4 text-end">Ação</th>
                                                </tr>
                                        </thead>
                                        <tbody>
                                                {mlQuestions.map((q) => (
                                                    <tr key={q.id} className="transition-hover">
                                                        <td className="ps-4 small text-muted">{new Date(q.date_created).toLocaleString()}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                {/* ✅ Lógica de Imagem Local com Fallback ML */}
                                                                <div className="rounded-3 me-2 border bg-white shadow-sm" style={{width: 48, height: 48, overflow: 'hidden'}}>
                                                                    <Image 
                                                                        src={q.product_image || (q.from && q.from.thumbnail) || `https://http2.mlstatic.com/D_NQ_NP_${q.item_id}-O.jpg`} 
                                                                        style={{width: '100%', height: '100%', objectFit: 'contain'}} 
                                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=ML'; }}
                                                                    />
                                                                </div>
                                                                <div style={{maxWidth: '180px'}}>
                                                                    <div className="text-truncate fw-bold text-dark small" title={q.product_title}>{q.product_title || `ID: ${q.item_id}`}</div>
                                                                    <Badge bg="light" text="dark" className="border" style={{fontSize: '0.6rem'}}>{q.item_id}</Badge>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="small">
                                                            <div className="fw-bold text-dark">P: "{q.text}"</div>
                                                            {(q.answer || q.status === 'ANSWERED') && (
                                                                <div className="mt-2 p-2 bg-light rounded border-start border-3 border-success" style={{fontSize: '0.8rem'}}>
                                                                    <span className="text-success fw-bold">R:</span> {q.answer ? q.answer.text : 'Respondida'}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            {/* ✅ Badge Respondido Escuro (Contraste Máximo) */}
                                                            {(q.status === 'ANSWERED' || q.answer) ? (
                                                                <Badge bg="secondary" className="text-white px-3 py-2 rounded-pill shadow-sm">
                                                                    <i className="fas fa-check-circle me-1"></i> Respondido
                                                                </Badge>
                                                            ) : (
                                                                <Button 
                                                                    variant="warning" 
                                                                    size="sm" 
                                                                    className="rounded-pill px-4 fw-bold shadow-sm text-dark" 
                                                                    onClick={() => handleOpenMLReplyModal(q)}
                                                                >
                                                                    RESPONDER
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card>
                        )}
                    </Tab>
                )}
            </Tabs>

            {/* MODAL DE RESPOSTA */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered className="modal-modern">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-5">
                        {selectedReview ? 'Responder E-commerce' : 'Responder Mercado Livre'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <div className="bg-light p-3 rounded-4 mb-4 border border-light">
                        <small className="text-muted d-block mb-1 fw-bold">MENSAGEM DO CLIENTE:</small>
                        <p className="mb-0 text-dark small fw-bold">
                            "{selectedReview?.comentario || selectedQuestion?.text}"
                        </p>
                    </div>
                    
                    <Form.Group>
                        <Form.Label className="fw-bold text-dark small mb-2">Sua resposta</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={5} 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escreva uma mensagem cordial e profissional..."
                            className="bg-white border shadow-sm rounded-3 p-3"
                            style={{resize: 'none', fontSize: '0.9rem'}}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 pb-4 px-4">
                    <Button variant="link" onClick={() => setShowModal(false)} className="text-muted text-decoration-none me-auto fw-bold small">Cancelar</Button>
                    <Button 
                        variant={selectedQuestion ? "warning" : "dark"} 
                        onClick={submitReplyHandler} 
                        disabled={replying} 
                        className="rounded-pill px-4 fw-bold shadow-sm"
                    >
                        {replying ? <Spinner size="sm" /> : 'ENVIAR AGORA'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL LIGHTBOX */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg" contentClassName="bg-transparent border-0 shadow-none">
                <div className="position-relative text-center">
                    <Button variant="dark" onClick={() => setShowImageModal(false)} className="position-absolute top-0 end-0 m-3 rounded-circle shadow" style={{zIndex: 10, width: 40, height: 40, opacity: 0.8}}><i className="fas fa-times"></i></Button>
                    <Image src={selectedImage} fluid className="rounded-4 shadow-lg" style={{maxHeight: '85vh', objectFit: 'contain', backgroundColor: '#fff'}} />
                </div>
            </Modal>

            <style>{`
                .custom-tabs .nav-link { color: #6c757d; border: none; font-weight: 600; padding: 1rem 1.5rem; transition: 0.3s; cursor: pointer; }
                .custom-tabs .nav-link.active { color: #0d6efd; background: transparent; border-bottom: 3px solid #0d6efd; }
                .custom-tabs .nav-link:hover:not(.active) { color: #0d6efd; background-color: rgba(13, 110, 253, 0.05); }
                .custom-table th { font-weight: 600; letter-spacing: 0.5px; border-bottom: 0; font-size: 0.75rem; color: #6c757d; text-transform: uppercase; }
                .transition-hover:hover { background-color: #f8f9fa; }
                .modal-modern .modal-content { border: none; border-radius: 1.25rem; box-shadow: 0 15px 50px rgba(0,0,0,0.1); }
            `}</style>
        </Container>
    );
};

export default ReviewListPage;