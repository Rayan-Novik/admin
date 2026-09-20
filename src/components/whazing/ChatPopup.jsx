import React, { useState, useEffect, useRef } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api'; 
// 🟢 MÓDULOS DE UI DO DESIGN SYSTEM
import { CustomInput } from '../ui/SearchInput/SearchInput';
import { SquareButton, GreenSquareButton } from '../ui/buttons/SquareButton'; 
// 🟢 MÓDULO DA MAQUININHA
import PaymentModal from '../whatsapp/ChatWindowModule/PaymentModule/PaymentModal';

const ChatPopup = ({ show, onHide, card }) => {
    const [chatTicket, setChatTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const chatBodyRef = useRef(null);

    // 🟢 ESTADOS DA RESPONSIVIDADE E BOTÃO FLUTUANTE
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false); // No mobile, controla se a janela está aberta ou é só a bolinha
    const [floatingPos, setFloatingPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const theme = {
        primary: '#038bfe',
        bgSidebar: '#F4F6FA',
        bgWhite: '#ffffff',
        textMain: '#0F172A',
        textMuted: '#64748B',
        borderColor: 'rgba(100, 116, 139, 0.15)'
    };

    // --- DETECÇÃO DE TELA MOBILE ---
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth <= 768) {
                setFloatingPos({ x: window.innerWidth - 70, y: window.innerHeight - 70 });
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. CARREGAMENTO INICIAL
    useEffect(() => {
        if (show && card && card.telefone) {
            setChatTicket(null);
            setChatMessages([]);
            setChatInput('');
            setIsMinimized(false);
            if (isMobile) setShowMobileChat(true); // Se abriu no mobile, já mostra a janela
            loadTicketsAndMessages(card.telefone);
        }
    }, [show, card, isMobile]);

    const loadTicketsAndMessages = async (numero) => {
        try {
            setLoadingChat(true);
            const { data } = await api.post('/kanban/whazing/tickets', { number: numero });
            const tickets = Array.isArray(data) ? data : (data.tickets || []);
            const ticketAberto = tickets.find(t => t.status === 'open' || t.status === 'pending');
            
            if (ticketAberto) {
                setChatTicket(ticketAberto);
                await fetchMessagesSilently(ticketAberto.id, true);
            } else {
                setChatTicket(null);
            }
        } catch (error) {
            toast.error("Erro ao buscar tickets na Whazing.");
        } finally {
            setLoadingChat(false);
        }
    };

    // 2. BUSCA SILENCIOSA (TEMPO REAL)
    const fetchMessagesSilently = async (ticketId, initialLoad = false) => {
        try {
            const msgRes = await api.get(`/kanban/whazing/tickets/${ticketId}/messages`);
            const mensagensOrdenadas = Array.isArray(msgRes.data) 
                ? msgRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) 
                : [];
            
            setChatMessages(prev => {
                if (initialLoad || prev.length !== mensagensOrdenadas.length) {
                    setTimeout(scrollToBottom, 100);
                    return mensagensOrdenadas;
                }
                return prev;
            });
        } catch (e) {}
    };

    // 3. LOOP DE TEMPO REAL
    useEffect(() => {
        let intervalId;
        // Só busca no loop se a janela estiver visível ativamente
        const isWindowOpen = isMobile ? showMobileChat : (!isMinimized && show);
        
        if (isWindowOpen && chatTicket) {
            intervalId = setInterval(() => {
                fetchMessagesSilently(chatTicket.id);
            }, 3000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [show, isMinimized, showMobileChat, chatTicket, isMobile]);

    // 4. AÇÕES E EVENTOS
    const handleCreateTicket = async () => {
        try {
            setLoadingChat(true);
            await api.post('/kanban/whazing/tickets/create', { number: card.telefone });
            toast.success("Ticket criado!");
            loadTicketsAndMessages(card.telefone);
        } catch (error) {
            toast.error("Erro ao criar ticket.");
            setLoadingChat(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !card) return;
        const textoEnviado = chatInput;
        setChatInput(''); 
        
        try {
            setChatMessages(prev => [...prev, { body: textoEnviado, fromMe: true, createdAt: new Date() }]);
            scrollToBottom();

            await api.post('/kanban/whazing/message', { number: card.telefone, message: textoEnviado });
        } catch (error) {
            toast.error("Falha ao enviar mensagem.");
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatBodyRef.current) {
                chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
        }, 50);
    };

    useEffect(() => {
        if (!isMinimized && (!isMobile || showMobileChat)) scrollToBottom();
    }, [isMinimized, showMobileChat, isMobile]);


    // --- LÓGICA DE DRAG (ARRASTAR NO MOBILE) ---
    const handleTouchStart = (e) => {
        isDragging.current = true;
        const touch = e.touches[0];
        dragOffset.current = {
            x: touch.clientX - floatingPos.x,
            y: touch.clientY - floatingPos.y
        };
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        // Previne o scroll da tela enquanto arrasta
        e.preventDefault(); 
        const touch = e.touches[0];
        
        // Limita na tela
        let newX = touch.clientX - dragOffset.current.x;
        let newY = touch.clientY - dragOffset.current.y;
        
        if (newX < 10) newX = 10;
        if (newX > window.innerWidth - 70) newX = window.innerWidth - 70;
        if (newY < 10) newY = 10;
        if (newY > window.innerHeight - 70) newY = window.innerHeight - 70;

        setFloatingPos({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        // Efeito de "grudar" nas bordas (opcional)
        if (floatingPos.x > window.innerWidth / 2) {
            setFloatingPos(prev => ({ ...prev, x: window.innerWidth - 70 }));
        } else {
            setFloatingPos(prev => ({ ...prev, x: 10 }));
        }
    };


    // ==========================================
    // 🟢 RENDERIZADOR DE MÍDIA
    // ==========================================
    const renderMessageContent = (msg, fromMe) => {
        const hasMediaUrl = Boolean(msg.mediaUrl);
        const isAudioLinkInBody = msg.body && msg.body.startsWith('http') && msg.body.match(/\.(ogg|mp3|wav|m4a)/i);

        if (msg.mediaType === 'audio' || msg.type === 'audio' || isAudioLinkInBody || (msg.mediaUrl && msg.mediaUrl.match(/\.(ogg|mp3|wav|m4a)/i))) {
            const audioSrc = msg.mediaUrl || msg.body;
            return (
                <div className="d-flex flex-column gap-1">
                    <audio controls controlsList="nodownload" style={{ height: '40px', width: '230px', maxWidth: '100%', outline: 'none' }}>
                        <source src={audioSrc} />
                    </audio>
                    {msg.body && !msg.body.includes('http') && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</span>}
                </div>
            );
        }

        if (msg.mediaType === 'image' || msg.type === 'image' || (msg.mediaUrl && msg.mediaUrl.match(/\.(jpeg|jpg|png|webp|gif)/i))) {
            return (
                <div className="d-flex flex-column gap-1">
                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                        <img src={msg.mediaUrl} alt="Imagem" style={{ width: '100%', borderRadius: '8px' }} />
                    </a>
                    {msg.body && !msg.body.includes('http') && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</span>}
                </div>
            );
        }

        if (hasMediaUrl) {
            return (
                <div className="d-flex flex-column gap-1">
                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center text-decoration-none p-2 rounded" style={{ backgroundColor: fromMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: fromMe ? '#fff' : theme.primary }}>
                        <i className="bi bi-file-earmark-arrow-down fs-4 me-2"></i>
                        <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Baixar Arquivo</span>
                    </a>
                    {msg.body && !msg.body.includes('http') && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</span>}
                </div>
            );
        }

        return <span style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</span>;
    };

    if (!show || !card) return null;

    const profilePic = chatTicket?.contact?.profilePicUrl || card?.contact?.profilePicUrl || card?.profilePicUrl;

    // 🟢 RENDERIZAÇÃO NO MOBILE (BOLINHA FLUTUANTE)
    if (isMobile && !showMobileChat) {
        return (
            <div 
                style={{
                    position: 'fixed',
                    left: `${floatingPos.x}px`,
                    top: `${floatingPos.y}px`,
                    width: '60px',
                    height: '60px',
                    backgroundColor: theme.primary,
                    borderRadius: '50%',
                    boxShadow: '0 8px 24px rgba(3,139,254,0.4)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'grab'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => setShowMobileChat(true)}
            >
                {profilePic && profilePic !== '' ? (
                    <img 
                        src={profilePic} 
                        alt="Perfil" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
                    />
                ) : null}
                <i className="bi bi-chat-fill fs-3" style={{ display: (profilePic && profilePic !== '') ? 'none' : 'block' }}></i>
                
                {/* Indicador visual para fechar totalmente ao invés de minimizar */}
                <div 
                    className="position-absolute bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ top: '-5px', right: '-5px', width: '22px', height: '22px', fontSize: '12px' }}
                    onClick={(e) => { e.stopPropagation(); onHide(); }}
                >
                    <i className="bi bi-x"></i>
                </div>
            </div>
        );
    }

    // 🟢 RENDERIZAÇÃO DA JANELA (Desktop ou Mobile Aberto)
    return (
        <>
            <div style={{
                position: 'fixed',
                // Responsividade: No mobile ocupa a tela quase toda, no desktop fica no canto
                bottom: isMobile ? '0' : '24px',
                right: isMobile ? '0' : '24px',
                width: isMobile ? '100%' : '360px',
                height: isMobile ? '100%' : 'auto',
                backgroundColor: theme.bgWhite,
                borderRadius: isMobile ? '0' : '16px', 
                boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.12)', 
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'height 0.3s ease, transform 0.3s ease',
                border: isMobile ? 'none' : `1px solid ${theme.borderColor}`
            }}>
                
                {/* CABEÇALHO DO CHAT */}
                <div 
                    className="d-flex justify-content-between align-items-center p-3" 
                    style={{ backgroundColor: theme.primary, color: 'white', cursor: 'pointer' }}
                    onClick={() => {
                        if (isMobile) {
                            setShowMobileChat(false); // No mobile vira bolinha
                        } else {
                            setIsMinimized(!isMinimized); // No pc encolhe
                        }
                    }}
                >
                    <div className="fw-bold text-truncate d-flex align-items-center" style={{ maxWidth: isMobile ? '70%' : '230px', fontSize: '0.95rem' }}>
                        <div 
                            className="rounded-circle bg-white d-flex justify-content-center align-items-center me-2 overflow-hidden" 
                            style={{ width: '32px', height: '32px', color: theme.primary, flexShrink: 0 }}
                        >
                            {profilePic && profilePic !== '' ? (
                                <img 
                                    src={profilePic} 
                                    alt="Perfil" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                            ) : null}
                            <i className="bi bi-person-fill fs-5" style={{ display: (profilePic && profilePic !== '') ? 'none' : 'block' }}></i>
                        </div>
                        {card.nomeExibicao}
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <i 
                            className={`bi ${isMobile ? 'bi-box-arrow-down-right' : (isMinimized ? 'bi-chevron-up' : 'bi-dash-lg')}`} 
                            style={{ cursor: 'pointer', fontSize: '1.2rem', opacity: 0.9 }} 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isMobile) setShowMobileChat(false); else setIsMinimized(!isMinimized); 
                            }}
                        ></i>
                        <i 
                            className="bi bi-x-lg" 
                            style={{ cursor: 'pointer', fontSize: '1.2rem', opacity: 0.9 }} 
                            onClick={(e) => { e.stopPropagation(); onHide(); }}
                        ></i>
                    </div>
                </div>

                {/* CORPO DO CHAT */}
                {(!isMinimized || (isMobile && showMobileChat)) && (
                    <>
                        <div 
                            ref={chatBodyRef}
                            className="p-3 overflow-auto flex-grow-1" 
                            style={{ height: isMobile ? 'calc(100vh - 130px)' : '420px', backgroundColor: theme.bgSidebar }}
                        >
                            {loadingChat && chatMessages.length === 0 ? (
                                <div className="text-center mt-5"><Spinner animation="border" style={{ color: theme.primary }} /></div>
                            ) : !chatTicket ? (
                                <div className="text-center py-4 px-3 mt-4 rounded-4 bg-white" style={{ border: `1px solid ${theme.borderColor}` }}>
                                    <i className="bi bi-inboxes fs-1 d-block mb-3" style={{ color: theme.textMuted }}></i>
                                    <h6 className="fw-bold" style={{ color: theme.textMain }}>Nenhum ticket aberto</h6>
                                    <p className="small mb-4" style={{ color: theme.textMuted }}>Crie um atendimento para começar a conversar.</p>
                                    <Button 
                                        onClick={handleCreateTicket} 
                                        style={{ backgroundColor: theme.primary, border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '600' }}
                                    >
                                        <i className="bi bi-plus-lg me-2"></i>Criar Ticket
                                    </Button>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center mt-4 p-3 rounded-4" style={{ backgroundColor: 'white', border: `1px solid ${theme.borderColor}`, color: theme.textMuted, fontSize: '0.85rem' }}>
                                    Nenhuma mensagem neste ticket ainda. Comece dizendo olá! 👋
                                </div>
                            ) : (
                                chatMessages.map((msg, index) => {
                                    const fromMe = msg.fromMe === true || msg.isFromMe === true || msg.userId !== null;
                                    return (
                                        <div key={index} className={`d-flex mb-3 ${fromMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div 
                                                className="p-3 shadow-sm" 
                                                style={{ 
                                                    maxWidth: '85%', 
                                                    fontSize: '0.9rem', 
                                                    backgroundColor: fromMe ? theme.primary : theme.bgWhite, 
                                                    color: fromMe ? '#fff' : theme.textMain,
                                                    border: fromMe ? 'none' : `1px solid ${theme.borderColor}`,
                                                    borderRadius: fromMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                    wordWrap: 'break-word'
                                                }}
                                            >
                                                {renderMessageContent(msg, fromMe)}
                                                <div className="text-end mt-1" style={{ fontSize: '0.65rem', opacity: fromMe ? 0.8 : 0.5 }}>
                                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* ÁREA DE INPUT */}
                        {chatTicket && (
                            <div className="p-2 bg-white d-flex gap-2 align-items-center" style={{ borderTop: `1px solid ${theme.borderColor}`, paddingBottom: isMobile ? '20px' : '10px' }}>
                                
                                <GreenSquareButton
                                    onClick={() => setShowPaymentModal(true)}
                                    title="Maquininha Virtual"
                                >
                                    <i className="bi bi-cash-coin fs-5"></i>
                                </GreenSquareButton>

                                <CustomInput
                                    placeholder="Escreva a mensagem..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()}
                                    style={{ height: '50px', flex: 1 }}
                                />
                                
                                <SquareButton 
                                    color={theme.primary} 
                                    onClick={handleSendChatMessage} 
                                    disabled={!chatInput.trim() || loadingChat}
                                    style={{ opacity: (!chatInput.trim() || loadingChat) ? 0.6 : 1 }}
                                >
                                    <i className="bi bi-send-fill fs-6"></i>
                                </SquareButton>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* COMPONENTE DA MAQUININHA */}
            <PaymentModal 
                show={showPaymentModal} 
                onHide={() => setShowPaymentModal(false)} 
                jid={card.telefone} 
            />
        </>
    );
};

export default ChatPopup;