import React, { useEffect, useState } from 'react';
import { Form, Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api'; 
import { toast } from 'react-toastify'; 

// 🟢 NOSSOS COMPONENTES UNIVERSAIS DE UI (SEM BOOTSTRAP)
import { CtaButton, LightButton } from '../components/ui/buttons/CtaButton';
import { SquareButton } from '../components/ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../components/ui/listagem/FlatList';

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
            // 1. E-commerce
            const reviewsRes = await api.get('/produtos/admin/all').catch(() => ({ data: [] }));
            setReviews(reviewsRes.data || []);

            // 2. Mercado Livre
            try {
                const mlRes = await api.get('/mercadolivre/questions');
                const questionsData = Array.isArray(mlRes.data) ? mlRes.data : (mlRes.data.questions || []);
                setMlQuestions(questionsData);
                setIsMlConfigured(true); 
            } catch (mlErr) {
                console.warn("Mercado Livre não configurado ou sem acesso:", mlErr);
                setIsMlConfigured(false);
                setMlQuestions([]);
            }
            
            if (activeTab === 'mercadolivre' && isMlConfigured) {
                toast.info('Mensagens sincronizadas!');
            }
        } catch (err) {
            console.error("Erro inesperado na tela de reviews:", err);
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
                await api.put(`/produtos/admin/${selectedReview.id_avaliacao}/reply`, { resposta: replyText });
                toast.success('Resposta salva no E-commerce!');
            } else if (selectedQuestion) {
                await api.post('/mercadolivre/questions/answer', { question_id: selectedQuestion.id, text: replyText });
                toast.success('Pergunta respondida com sucesso!');
            }
            
            setShowModal(false);
            fetchAllData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Acesso negado ou erro ao salvar resposta.';
            toast.error(msg);
        } finally {
            setReplying(false);
        }
    };

    const renderStars = (nota) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star-fill ${i < nota ? 'text-warning' : 'opacity-25'}`} style={{ fontSize: '14px', marginRight: '2px', color: i >= nota ? 'var(--text-secondary)' : '#f59e0b' }}></i>
        ));
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <div className="w-100 mx-auto pt-lg-4 pt-3" style={{ maxWidth: '1200px' }}>
                
                {/* ========================================================= */}
                {/* CABEÇALHO */}
                {/* ========================================================= */}
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 px-3 px-lg-0 gap-3">
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
                        <span className="bg-secondary bg-opacity-10 text-secondary border px-3 py-2 rounded-pill fw-medium" style={{ borderColor: 'var(--border-color)', fontSize: '12px' }}>
                            {activeTab === 'ecommerce' ? `Avaliações: ${reviews.length}` : `Perguntas: ${mlQuestions.length}`}
                        </span>
                        
                        <CtaButton onClick={fetchAllData} disabled={loading} className="px-4" style={{ height: '42px', borderRadius: '12px' }}>
                            {loading ? <i className="bi bi-arrow-clockwise me-2 d-inline-block" style={{ animation: 'spin 1s linear infinite' }}></i> : <i className="bi bi-arrow-clockwise me-2"></i>} 
                            Sincronizar
                        </CtaButton>
                    </div>
                </div>

                {error && (
                    <div className="bg-danger bg-opacity-10 text-danger p-3 mx-3 mx-lg-0 mb-4 rounded-4 fw-bold border border-danger border-opacity-25 shadow-sm">
                        {error}
                    </div>
                )}

                {/* ========================================================= */}
                {/* ABAS (TABS) - SCROLLÁVEIS NO MOBILE */}
                {/* ========================================================= */}
                <div className="d-flex gap-2 px-3 py-3 border-bottom overflow-auto mb-4" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                    {activeTab === 'ecommerce' 
                        ? <CtaButton onClick={() => setActiveTab('ecommerce')} className="px-4 text-white" style={{ height: '38px', borderRadius: '50px', fontSize: '13px' }}><i className="bi bi-shop me-2"></i>E-commerce</CtaButton>
                        : <LightButton onClick={() => setActiveTab('ecommerce')} className="px-4" style={{ height: '38px', borderRadius: '50px', fontSize: '13px' }}><i className="bi bi-shop me-2"></i>E-commerce</LightButton>
                    }
                    
                    {isMlConfigured && (
                        activeTab === 'mercadolivre' 
                            ? <CtaButton color="#ffc107" onClick={() => setActiveTab('mercadolivre')} className="px-4 text-dark" style={{ height: '38px', borderRadius: '50px', fontSize: '13px' }}>
                                <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/favicon.svg" width="14" className="me-2" alt="ML"/>
                                Mercado Livre
                              </CtaButton>
                            : <LightButton onClick={() => setActiveTab('mercadolivre')} className="px-4 text-warning" style={{ height: '38px', borderRadius: '50px', fontSize: '13px' }}>
                                <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/favicon.svg" width="14" className="me-2" style={{ filter: 'grayscale(1)' }} alt="ML"/>
                                Mercado Livre
                              </LightButton>
                    )}
                </div>

                {/* ========================================================= */}
                {/* CONTEÚDO */}
                {/* ========================================================= */}
                <div className="p-0 px-lg-0">
                    <AnimatePresence mode='wait'>
                        {/* ESTADO DE CARREGAMENTO */}
                        {loading && ((activeTab === 'ecommerce' && reviews.length === 0) || (activeTab === 'mercadolivre' && mlQuestions.length === 0)) ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="d-flex flex-column align-items-center justify-content-center py-5 mt-4">
                                <i className="bi bi-arrow-clockwise display-4 text-primary" style={{ animation: 'spin 1s linear infinite' }}></i>
                                <p className="mt-3 text-secondary fw-medium">Carregando mensagens...</p>
                            </motion.div>
                        ) : activeTab === 'ecommerce' ? (
                            /* 🟢 LISTA DO E-COMMERCE */
                            <FlatListContainer 
                                loading={false} 
                                empty={reviews.length === 0} 
                                emptyMessage="Nenhuma avaliação recebida ainda." 
                                emptyIcon="bi-star"
                            >
                                <FlatListHeader>
                                    <div className="col-lg-2 ps-2">Data</div>
                                    <div className="col-lg-3">Produto</div>
                                    <div className="col-lg-2">Cliente</div>
                                    <div className="col-lg-3">Avaliação</div>
                                    <div className="col-lg-2 text-end pe-2">Ação</div>
                                </FlatListHeader>

                                {reviews.map((review) => (
                                    <motion.div key={review.id_avaliacao} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-100">
                                        <FlatListItem className="py-3">
                                            <div className="row w-100 m-0 align-items-center">
                                                
                                                <div className="col-12 col-lg-2 p-0 mb-2 mb-lg-0 text-secondary" style={{ fontSize: '13px' }}>
                                                    {new Date(review.data_avaliacao).toLocaleDateString('pt-BR')}
                                                </div>

                                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0 d-flex align-items-center">
                                                    <div 
                                                        className="rounded-3 me-3 border flex-shrink-0 cursor-pointer overflow-hidden bg-white d-flex justify-content-center align-items-center" 
                                                        style={{ width: 44, height: 44, borderColor: 'var(--border-color)' }} 
                                                        onClick={() => handleOpenImageModal(review.produtos?.imagem_url)}
                                                    >
                                                        <img src={review.produtos?.imagem_url || 'https://placehold.co/44x44?text=Img'} alt="Produto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div className="text-truncate fw-bold text-dark" style={{ fontSize: '13px' }}>
                                                        {review.produtos?.nome}
                                                    </div>
                                                </div>

                                                <div className="col-12 col-lg-2 p-0 mb-2 mb-lg-0">
                                                    <span className="d-inline d-lg-none text-muted fw-normal me-1 small">Cliente:</span>
                                                    <span className="fw-medium text-dark" style={{ fontSize: '13px' }}>{review.usuarios?.nome_completo || 'Cliente'}</span>
                                                </div>

                                                <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0">
                                                    <div className="mb-1">{renderStars(review.nota)}</div>
                                                    <div className="fst-italic text-dark mt-1" style={{ fontSize: '13px' }}>"{review.comentario}"</div>
                                                    
                                                    {review.resposta_admin && (
                                                        <div className="mt-2 p-2 rounded-3" style={{ fontSize: '12px', backgroundColor: 'var(--bg-sidebar)', borderLeft: '3px solid #3b82f6', color: 'var(--text-primary)' }}>
                                                            <span className="fw-bold" style={{ color: '#3b82f6' }}>R:</span> {review.resposta_admin}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-12 col-lg-2 p-0 d-flex justify-content-lg-end">
                                                    {review.resposta_admin ? (
                                                        <span className="bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 fw-bold rounded-pill" style={{ fontSize: '12px' }}>Respondido</span>
                                                    ) : (
                                                        <LightButton onClick={() => handleOpenReplyModal(review)} className="px-4" style={{ height: '36px', borderRadius: '50px', fontSize: '12px' }}>
                                                            Responder
                                                        </LightButton>
                                                    )}
                                                </div>

                                            </div>
                                        </FlatListItem>
                                    </motion.div>
                                ))}
                            </FlatListContainer>

                        ) : (
                            /* 🟢 LISTA DO MERCADO LIVRE */
                            <FlatListContainer 
                                loading={false} 
                                empty={mlQuestions.length === 0} 
                                emptyMessage="Nenhuma pergunta pendente no Mercado Livre." 
                                emptyIcon="bi-chat-dots"
                            >
                                <FlatListHeader>
                                    <div className="col-lg-2 ps-2">Recebida</div>
                                    <div className="col-lg-3">Produto</div>
                                    <div className="col-lg-5">Pergunta / Resposta</div>
                                    <div className="col-lg-2 text-end pe-2">Ação</div>
                                </FlatListHeader>

                                {mlQuestions.map((q) => {
                                    const imgUrl = q.product_image || (q.from && q.from.thumbnail) || `https://http2.mlstatic.com/D_NQ_NP_${q.item_id}-O.jpg`;
                                    
                                    return (
                                        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-100">
                                            <FlatListItem className="py-3">
                                                <div className="row w-100 m-0 align-items-center">
                                                    
                                                    <div className="col-12 col-lg-2 p-0 mb-2 mb-lg-0 text-secondary" style={{ fontSize: '13px' }}>
                                                        {new Date(q.date_created).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </div>

                                                    <div className="col-12 col-lg-3 p-0 mb-3 mb-lg-0 d-flex align-items-center">
                                                        <div 
                                                            className="rounded-3 me-3 border flex-shrink-0 cursor-pointer overflow-hidden bg-white d-flex justify-content-center align-items-center" 
                                                            style={{ width: 44, height: 44, borderColor: 'var(--border-color)' }} 
                                                            onClick={() => handleOpenImageModal(imgUrl)}
                                                        >
                                                            <img 
                                                                src={imgUrl} 
                                                                alt="ML" 
                                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                                                onError={(e) => { e.target.src = 'https://placehold.co/44x44?text=ML'; }} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-truncate fw-bold text-dark" style={{ maxWidth: '180px', fontSize: '13px' }}>{q.product_title || `Produto ${q.item_id}`}</div>
                                                            <span className="bg-warning bg-opacity-25 border border-warning text-dark px-2 py-0 rounded-1 d-inline-block mt-1 fw-bold" style={{ fontSize: '10px' }}>{q.item_id}</span>
                                                        </div>
                                                    </div>

                                                    <div className="col-12 col-lg-5 p-0 mb-3 mb-lg-0">
                                                        <div className="fw-medium text-dark" style={{ fontSize: '13px' }}>
                                                            <span className="fw-bold opacity-50 me-1">P:</span> {q.text}
                                                        </div>
                                                        
                                                        {(q.answer || q.status === 'ANSWERED') && (
                                                            <div className="mt-2 p-2 rounded-3" style={{ fontSize: '12px', backgroundColor: 'var(--bg-sidebar)', borderLeft: '3px solid #eab308', color: 'var(--text-primary)' }}>
                                                                <span className="fw-bold text-warning">R:</span> {q.answer ? q.answer.text : 'Respondida externamente'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="col-12 col-lg-2 p-0 d-flex justify-content-lg-end">
                                                        {(q.status === 'ANSWERED' || q.answer) ? (
                                                            <span className="bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-1 fw-bold rounded-pill" style={{ fontSize: '12px' }}>Respondido</span>
                                                        ) : (
                                                            <CtaButton color="#ffc107" onClick={() => handleOpenMLReplyModal(q)} className="px-4 text-dark" style={{ height: '36px', borderRadius: '50px', fontSize: '12px' }}>
                                                                Responder
                                                            </CtaButton>
                                                        )}
                                                    </div>

                                                </div>
                                            </FlatListItem>
                                        </motion.div>
                                    );
                                })}
                            </FlatListContainer>
                        )}
                    </AnimatePresence>
                </div>

                {/* ========================================================= */}
                {/* MODAL DE RESPOSTA */}
                {/* ========================================================= */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                        <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}>
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
                                className="shadow-none p-3"
                                style={{ 
                                    resize: 'none', fontSize: '14px', borderRadius: '12px',
                                    backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderColor: 'var(--border-color)'
                                }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 p-4 pt-0 d-flex gap-2" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <LightButton className="flex-grow-1" onClick={() => setShowModal(false)}>
                            Cancelar
                        </LightButton>
                        <CtaButton 
                            color={selectedQuestion ? "#ffc107" : "#0d6efd"} 
                            className={`flex-grow-1 ${selectedQuestion ? 'text-dark' : 'text-white'}`}
                            onClick={submitReplyHandler} 
                            disabled={replying || !replyText.trim()}
                        >
                            {replying ? <i className="bi bi-arrow-clockwise me-2 d-inline-block" style={{ animation: 'spin 1s linear infinite' }}></i> : <i className="bi bi-send me-2"></i>}
                            Enviar Resposta
                        </CtaButton>
                    </Modal.Footer>
                </Modal>

                {/* ========================================================= */}
                {/* MODAL LIGHTBOX PARA IMAGENS */}
                {/* ========================================================= */}
                <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg" contentClassName="bg-transparent border-0 shadow-none">
                    <div className="position-relative text-center">
                        <button 
                            onClick={() => setShowImageModal(false)} 
                            className="position-absolute top-0 end-0 m-3 bg-dark rounded-circle d-flex align-items-center justify-content-center shadow" 
                            style={{ zIndex: 10, width: '40px', height: '40px', opacity: 0.8, border: 'none' }}
                        >
                            <i className="bi bi-x-lg text-white"></i>
                        </button>
                        <img src={selectedImage} alt="Ampliada" className="img-fluid rounded-4 shadow-lg" style={{ maxHeight: '85vh', objectFit: 'contain', backgroundColor: '#fff' }} />
                    </div>
                </Modal>

            </div>
        </div>
    );
};

export default ReviewListPage;