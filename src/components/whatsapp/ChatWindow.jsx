import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import api from '../../services/api';
import MessageBubble from './ChatWindowModule/MessageBubble';
import MessageInput from './ChatWindowModule/MessageInput';
import MediaModal from './ChatWindowModule/MediaModal';
import ChatHeader from './ChatWindowModule/ChatHeader';
import ContactInfoPanel from './ChatWindowModule/ContactInfoPanel';

const checkPermission = (permKey) => {
    try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        if (adminInfo.id_usuario === 'DONO' || adminInfo.role === 'ADMIN') return true;
        return (adminInfo.permissoes || []).includes(permKey);
    } catch (e) { return false; }
};

const ChatWindow = ({ selectedChat, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [modalShow, setModalShow] = useState(false);
    const [modalData, setModalData] = useState({ url: '', type: '' });
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const canSend = checkPermission('WHATSAPP_SEND');
    // Se não há ticket aberto/pendente, consideramos que precisa iniciar atendimento
    const requiresTicket = !activeTicket;

    const fetchMessages = useCallback(async () => {
        if (!selectedChat?.number) return;
        
        try {
            // 1. Puxa os tickets do Whazing para esse número
            const { data: tickets } = await api.post('/kanban/whazing/tickets', { 
                number: selectedChat.number 
            });
            
            // 2. Encontra um ticket ativo (open ou pending)
            const currentTicket = tickets.find(t => t.status === 'open' || t.status === 'pending');
            setActiveTicket(currentTicket || null);

            // 3. Se houver ticket, puxa as mensagens
            if (currentTicket) {
                const { data: msgs } = await api.get(`/kanban/whazing/tickets/${currentTicket.id}/messages`);
                setMessages(msgs);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Erro ao carregar mensagens do Whazing:", error);
        }
    }, [selectedChat]);

    useEffect(() => {
        if (selectedChat) {
            setLoading(true);
            fetchMessages().finally(() => setLoading(false));

            // Polling para mensagens novas
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedChat, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleAssumirAtendimento = async () => {
        try {
            setLoading(true);
            // 🟢 Cria um novo ticket (inicia o atendimento na fila)
            await api.post('/kanban/whazing/tickets/create', { number: selectedChat.number });
            await fetchMessages();
        } catch (error) {
            console.error("Erro ao iniciar atendimento:", error);
            alert("Erro ao iniciar atendimento. Verifique se as filas estão configuradas no CRM.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (text, file) => {
        if (requiresTicket || !canSend) return;

        if (text) {
            const tempMsg = { 
                id: 'temp-' + Date.now(), 
                body: text, 
                fromMe: true, 
                createdAt: new Date().toISOString(),
                mediaType: 'text'
            };
            setMessages(prev => [...prev, tempMsg]);
            
            try {
                // 🟢 Dispara a mensagem pela rota do Whazing
                await api.post('/kanban/whazing/message', { 
                    number: selectedChat.number, 
                    text: text 
                });
                fetchMessages();
            } catch (error) {
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
                alert("Erro ao enviar mensagem.");
            }
        }
        
        // Lógica de arquivo (file) precisará de uma rota /upload do seu backend futuramente
    };

    const getPureUrl = (content) => content; // Whazing geralmente já envia a URL pronta (mediaUrl)

    if (!selectedChat) return (
        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{ backgroundColor: 'var(--bg-main, #f8fafc)' }}>
            <i className="bi bi-whatsapp" style={{ fontSize: '4rem', opacity: 0.1 }}></i>
            <h4 className="mt-3 fw-bold">Ararinha CRM</h4>
            <p>Selecione um contato para iniciar.</p>
        </div>
    );

    return (
        <div className="d-flex flex-column h-100 shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)' }}>
            
            <ChatHeader 
                selectedChat={selectedChat}
                isPendente={activeTicket?.status === 'pending'}
                onBack={onBack}
                onInfoClick={() => setShowInfoPanel(true)}
            />

            <div className="flex-grow-1 p-3 overflow-auto chat-container" style={{ 
                backgroundColor: 'var(--chat-bg)', backgroundImage: 'var(--chat-bg-img)',
                backgroundSize: 'cover', backgroundAttachment: 'fixed' 
            }}>
                {loading && messages.length === 0 ? (
                    <div className="text-center mt-5"><Spinner animation="border" variant="success" /></div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            msg={msg}
                            canSend={canSend}
                            openMedia={(url, type) => { setModalData({url, type}); setModalShow(true); }}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* SE O TICKET AINDA NÃO EXISTE OU FOI FECHADO */}
            {requiresTicket ? (
                <div className="bg-warning bg-opacity-10 border-top border-warning p-3 d-flex justify-content-between align-items-center shadow-sm">
                    <span className="text-dark fw-bold small ms-2">
                        <i className="bi bi-person-lines-fill fs-5 me-2 align-middle"></i>
                        Este contato não possui um atendimento ativo.
                    </span>
                    {canSend && (
                        <Button variant="success" size="sm" className="fw-bold shadow-sm" onClick={handleAssumirAtendimento}>
                            <i className="bi bi-headset me-1"></i> Iniciar Atendimento
                        </Button>
                    )}
                </div>
            ) : !canSend ? (
                <div className="p-3 text-center border-top text-muted bg-light">
                    <i className="bi bi-eye-fill fs-4 me-2 text-primary"></i>
                    <span className="fw-bold">Modo Leitura.</span>
                </div>
            ) : (
                <MessageInput
                    onSendMessage={handleSendMessage}
                    inputRef={inputRef}
                    fileInputRef={fileInputRef}
                    number={selectedChat.number}
                />
            )}

            <MediaModal show={modalShow} onHide={() => setModalShow(false)} mediaUrl={modalData.url} mediaType={modalData.type} />
            <ContactInfoPanel show={showInfoPanel} onHide={() => setShowInfoPanel(false)} contact={selectedChat} />
        </div>
    );
};

export default ChatWindow;