import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal, Badge, Image as BsImage, Container, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

const ReviewListPage = () => {
    const [reviews, setReviews] = useState([]);
    const [mlQuestions, setMlQuestions] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ecommerce'); 
    
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
        setLoading(true);
        setError('');
        try {
            // 🟢 1. Blindagem nas Avaliações (Se der Erro 403 ou vazio, retorna array vazio e segue a vida)
            const reviewsRes = await api.get('/produtos/admin/all').catch(() => ({ data: [] }));
            setReviews(reviewsRes.data || []);

            // 🟢 2. Busca do Mercado Livre 100% isolada
            try {
                const mlRes = await api.get('/mercadolivre/questions');
                const questionsData = Array.isArray(mlRes.data) ? mlRes.data : (mlRes.data.questions || []);
                setMlQuestions(questionsData);
                setIsMlConfigured(true); 
            } catch (mlErr) {
                console.warn("Mercado Livre não configurado ou sem acesso:", mlErr);
                setIsMlConfigured(false);
                setMlQuestions([]); // Garante que a lista não quebra
            }
            
            if (activeTab === 'mercadolivre' && isMlConfigured) {
                toast.info('Mensagens sincronizadas!');
            }
        } catch (err) {
            console.error("Erro inesperado na tela de reviews:", err);
            // Só vai dar esse erro genérico se a internet cair ou o servidor explodir de vez
            setError('Erro inesperado ao carregar dados.'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleOpenImageModal = (imgUrl) => {
        if (!imgUrl) return;
        setSelectedImage(imgUrl);
        setShowImageModal(true);
    };

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
            // 🟢 Se o cara tentar responder sem permissão, o Toast vai avisar ele gentilmente aqui!
            const msg = err.response?.data?.message || 'Acesso negado ou erro ao salvar resposta.';
            toast.error(msg);
        } finally {
            setReplying(false);
        }
    };

    const renderStars = (nota) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star-fill ${i < nota ? 'text-warning' : 'opacity-25'}`} style={{ fontSize: '12px', marginRight: '2px', color: i >= nota ? 'var(--text-secondary)' : '' }}></i>
        ));
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', transition: 'background-color 0.2s ease', paddingBottom: '2rem' }}>
            <Container fluid="lg" className="pt-4">
                
                {/* --- CABEÇALHO LIMPO --- */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-chat-left-text me-3 opacity-75"></i>
                            Central de Mensagens
                        </h4>
                        <small className="mt-1 d-block" style={{ color: 'var(--text-secondary)' }}>
                            Ecommerce {isMlConfigured && '& Mercado Livre'}
                        </small>
                    </div>
                    
                    <div className="d-flex align-items-center gap-3">
                        <Badge bg="secondary" className="bg-opacity-10 text-secondary border px-3 py-2 rounded-pill fw-medium" style={{ borderColor: 'var(--border-color)' }}>
                            {activeTab === 'ecommerce' ? `Avaliações: ${reviews.length}` : `Perguntas: ${mlQuestions.length}`}
                        </Badge>
                        <Button 
                            variant="dark" 
                            onClick={fetchAllData} 
                            disabled={loading} 
                            className="rounded-3 d-flex align-items-center px-4 border-0 shadow-sm" 
                            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}
                        >
                            {loading ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-arrow-clockwise me-2"></i>} Sincronizar
                        </Button>
                    </div>
                </div>

                {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{error}</Alert>}

                <div className="clean-card mb-4">
                    <div className="border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(k) => setActiveTab(k)}
                            className="custom-tabs border-0"
                        >
                            {/* ABA ECOMMERCE */}
                            <Tab eventKey="ecommerce" title={<span><i className="bi bi-shop me-2"></i>E-commerce</span>}>
                                <div className="p-0">
                                    {loading && reviews.length === 0 ? (
                                        <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                            <i className="bi bi-inbox display-4 mb-3 opacity-25"></i>
                                            <p>Nenhuma avaliação recebida.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            <Table className="align-middle mb-0 table-borderless">
                                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-sidebar)' }}>
                                                    <tr>
                                                        <th className="ps-4 py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Data</th>
                                                        <th className="py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Produto</th>
                                                        <th className="py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Cliente</th>
                                                        <th className="py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Comentário / Resposta</th>
                                                        <th className="pe-4 py-3 text-end text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Ação</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reviews.map((review) => (
                                                        <tr key={review.id_avaliacao} className="hover-effect border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                                                            <td className="ps-4" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                                {new Date(review.data_avaliacao).toLocaleDateString('pt-BR')}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="rounded-3 me-3 border shadow-sm flex-shrink-0 cursor-pointer" style={{ width: 44, height: 44, overflow: 'hidden', borderColor: 'var(--border-color)' }} onClick={() => handleOpenImageModal(review.produtos?.imagem_url)}>
                                                                        <BsImage src={review.produtos?.imagem_url || 'https://placehold.co/44x44?text=Img'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </div>
                                                                    <div className="text-truncate fw-medium" style={{ maxWidth: '180px', fontSize: '13px', color: 'var(--text-primary)' }}>{review.produtos?.nome}</div>
                                                                </div>
                                                            </td>
                                                            <td style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{review.usuarios?.nome_completo || 'Cliente'}</td>
                                                            <td className="py-3">
                                                                <div className="mb-1">{renderStars(review.nota)}</div>
                                                                <div className="fst-italic" style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.9 }}>"{review.comentario}"</div>
                                                                {review.resposta_admin && (
                                                                    <div className="mt-2 p-2 rounded-3" style={{ fontSize: '12px', backgroundColor: 'var(--bg-main)', borderLeft: '3px solid #3b82f6', color: 'var(--text-primary)' }}>
                                                                        <span className="fw-bold" style={{ color: '#3b82f6' }}>R:</span> {review.resposta_admin}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="text-end pe-4">
                                                                {review.resposta_admin ? (
                                                                    <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-medium rounded-pill">Respondido</Badge>
                                                                ) : (
                                                                    <Button variant="light" size="sm" className="rounded-pill px-4 fw-medium border shadow-sm" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} onClick={() => handleOpenReplyModal(review)}>
                                                                        Responder
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </Tab>

                            {/* ABA MERCADO LIVRE */}
                            {isMlConfigured && (
                                <Tab eventKey="mercadolivre" title={<span><img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/favicon.svg" width="16" className="me-2" alt="ML"/>Mercado Livre</span>}>
                                    <div className="p-0">
                                        {loading && mlQuestions.length === 0 ? (
                                            <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                                        ) : mlQuestions.length === 0 ? (
                                            <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                                <i className="bi bi-inbox display-4 mb-3 opacity-25"></i>
                                                <p>Nenhuma pergunta do Mercado Livre.</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                                <Table className="align-middle mb-0 table-borderless">
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--bg-sidebar)' }}>
                                                        <tr>
                                                            <th className="ps-4 py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Recebida</th>
                                                            <th className="py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Produto</th>
                                                            <th className="py-3 text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Pergunta / Resposta</th>
                                                            <th className="pe-4 py-3 text-end text-uppercase fw-semibold border-bottom" style={{ fontSize: '11px', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {mlQuestions.map((q) => {
                                                            const imgUrl = q.product_image || (q.from && q.from.thumbnail) || `https://http2.mlstatic.com/D_NQ_NP_${q.item_id}-O.jpg`;
                                                            return (
                                                                <tr key={q.id} className="hover-effect border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <td className="ps-4" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(q.date_created).toLocaleString('pt-BR')}</td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="rounded-3 me-3 border shadow-sm flex-shrink-0 cursor-pointer" style={{ width: 44, height: 44, overflow: 'hidden', borderColor: 'var(--border-color)', backgroundColor: '#fff' }} onClick={() => handleOpenImageModal(imgUrl)}>
                                                                                <BsImage 
                                                                                    src={imgUrl} 
                                                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                                                                    onError={(e) => { e.target.src = 'https://placehold.co/44x44?text=ML'; }}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-truncate fw-medium" title={q.product_title} style={{ maxWidth: '180px', fontSize: '13px', color: 'var(--text-primary)' }}>{q.product_title || `ID: ${q.item_id}`}</div>
                                                                                <Badge bg="warning" text="dark" className="bg-opacity-25 border border-warning fw-medium mt-1" style={{ fontSize: '10px', color: '#b45309' }}>{q.item_id}</Badge>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3">
                                                                        <div className="fw-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>P: "{q.text}"</div>
                                                                        {(q.answer || q.status === 'ANSWERED') && (
                                                                            <div className="mt-2 p-2 rounded-3" style={{ fontSize: '12px', backgroundColor: 'var(--bg-main)', borderLeft: '3px solid #eab308', color: 'var(--text-primary)' }}>
                                                                                <span className="fw-bold text-warning">R:</span> {q.answer ? q.answer.text : 'Respondida externamente'}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-end pe-4">
                                                                        {(q.status === 'ANSWERED' || q.answer) ? (
                                                                            <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-2 fw-medium rounded-pill">Respondido</Badge>
                                                                        ) : (
                                                                            <Button variant="warning" size="sm" className="rounded-pill px-4 fw-bold shadow-sm border-0 text-dark" onClick={() => handleOpenMLReplyModal(q)}>
                                                                                RESPONDER
                                                                            </Button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </Tab>
                            )}
                        </Tabs>
                    </div>
                </div>

                {/* MODAL DE RESPOSTA (SAAS STYLE) */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
                            <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                        </button>
                        <h5 className="fw-bold mb-1">Responder {selectedReview ? 'Avaliação' : 'Pergunta ML'}</h5>
                        <small className="opacity-75">Envie uma resposta pública para o cliente</small>
                    </div>
                    <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                            <small className="d-block text-uppercase fw-bold mb-2" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Mensagem original:</small>
                            <p className="mb-0 fst-italic" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                "{selectedReview?.comentario || selectedQuestion?.text}"
                            </p>
                        </div>
                        
                        <Form.Group>
                            <Form.Label className="fw-bold small mb-2" style={{ color: 'var(--text-primary)' }}>Sua Resposta Profissional</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={4} 
                                value={replyText} 
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Dica: Comece agradecendo o contato..."
                                className="shadow-none p-3 form-dark-input"
                                style={{ resize: 'none', fontSize: '14px' }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <Button variant="link" onClick={() => setShowModal(false)} className="text-decoration-none me-auto fw-bold small" style={{ color: 'var(--text-secondary)' }}>Cancelar</Button>
                        <Button 
                            variant={selectedQuestion ? "warning" : "primary"} 
                            onClick={submitReplyHandler} 
                            disabled={replying || !replyText.trim()} 
                            className={`rounded-pill px-4 fw-bold shadow-sm border-0 ${selectedQuestion ? 'text-dark' : ''}`}
                        >
                            {replying ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-send me-2"></i>}
                            ENVIAR RESPOSTA
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* MODAL LIGHTBOX PARA IMAGENS */}
                <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg" contentClassName="bg-transparent border-0 shadow-none">
                    <div className="position-relative text-center">
                        <button 
                            onClick={() => setShowImageModal(false)} 
                            className="position-absolute top-0 end-0 m-3 btn btn-dark rounded-circle d-flex align-items-center justify-content-center shadow" 
                            style={{ zIndex: 10, width: '40px', height: '40px', opacity: 0.8, border: 'none' }}
                        >
                            <i className="bi bi-x-lg text-white"></i>
                        </button>
                        <BsImage src={selectedImage} fluid className="rounded-4 shadow-lg" style={{ maxHeight: '85vh', objectFit: 'contain', backgroundColor: '#fff' }} />
                    </div>
                </Modal>

            </Container>

            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    box-shadow: none;
                    overflow: hidden;
                }
                .custom-tabs .nav-link { border: none; color: var(--text-secondary, #64748b); font-weight: 500; font-size: 13px; padding: 1rem 1.5rem; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .custom-tabs .nav-link:hover { color: var(--text-primary, #0f172a); }
                .custom-tabs .nav-link.active { color: var(--text-primary, #0f172a); border-bottom-color: var(--text-primary, #0f172a); background: transparent; }
                
                .hover-effect:hover td { background-color: var(--bg-hover, #f8fafc) !important; }
                .cursor-pointer { cursor: pointer; }

                /* Força os filhos da tabela Desktop a respeitarem o dark mode */
                body.dark-mode table { color: var(--text-primary) !important; border-color: var(--border-color) !important; }
                body.dark-mode thead th { background-color: var(--bg-sidebar) !important; color: var(--text-secondary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody td { background-color: var(--bg-sidebar) !important; color: var(--text-primary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody tr:hover td { background-color: var(--bg-hover) !important; }

                /* Ajustes Forms Dark Mode */
                body.dark-mode .form-dark-input { background-color: var(--bg-main) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important; }
                body.dark-mode .form-dark-input:focus { background-color: var(--bg-main); color: var(--text-primary); }
                body.dark-mode .form-dark-input::placeholder { color: var(--text-secondary); opacity: 0.7; }
                
                /* Scrollbar personalizada */
                .table-responsive::-webkit-scrollbar { width: 6px; height: 6px; }
                .table-responsive::-webkit-scrollbar-track { background: transparent; }
                .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ReviewListPage;