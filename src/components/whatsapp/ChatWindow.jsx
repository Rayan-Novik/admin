import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner, Badge, Button } from 'react-bootstrap';
import api from '../../services/api';
import MessageBubble from './ChatWindowModule/MessageBubble';
import MessageInput from './ChatWindowModule/MessageInput';
import MediaModal from './ChatWindowModule/MediaModal';
import ChatHeader from './ChatWindowModule/ChatHeader';
import ContactInfoPanel from './ChatWindowModule/ContactInfoPanel';

// 🟢 HELPER DE PERMISSÃO FRONTEND
const checkPermission = (permKey) => {
    try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        if (adminInfo.id_usuario === 'DONO' || adminInfo.role === 'ADMIN') return true;
        const permissoes = adminInfo.permissoes || []; // Ajuste caso seu array de permissões tenha outro nome
        return permissoes.includes(permKey);
    } catch (e) {
        return false;
    }
};

const ChatWindow = ({ selectedChat, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState(null);

    const [modalShow, setModalShow] = useState(false);
    const [modalData, setModalData] = useState({ url: '', type: '' });

    const [aiModalShow, setAiModalShow] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const [showInfoPanel, setShowInfoPanel] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // 🟢 IDENTIFICAÇÃO DE STATUS E PERMISSÕES
    const isPendente = selectedChat?.status === 'pendentes';
    const isBot = selectedChat?.status === 'bot';
    
    // Verifica se o usuário logado tem permissão para ENVIAR mensagens
    const canSend = checkPermission('WHATSAPP_SEND');

    const getBackendUrl = () => {
        return api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
    };

    const fetchMessages = useCallback(async () => {
        if (!selectedChat) return;
        try {
            const { data } = await api.get(`/whatsapp/chats/${selectedChat.jid}`);
            setMessages(data);
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        }
    }, [selectedChat]);

    useEffect(() => {
        if (selectedChat) {
            setLoading(true);
            fetchMessages().finally(() => setLoading(false));

            const interval = setInterval(() => {
                if (!editingMsgId) fetchMessages();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedChat, editingMsgId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const openMedia = (content, type) => {
        const fullUrl = getPureUrl(content);
        if (!fullUrl) return;
        setModalData({ url: fullUrl, type: type });
        setModalShow(true);
    };

    const handleAnalyzeAI = async (msg) => {
        setAiResult('');
        setAiLoading(true);
        setAiModalShow(true); 
        
        try {
            const { data } = await api.post(`/whatsapp/chats/${selectedChat.jid}/messages/${msg.whatsappId}/ai`);
            setAiResult(data.result);
        } catch (error) {
            setAiResult(error.response?.data?.message || 'Ocorreu um erro ao processar a IA.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleTranscribeAudio = async (msgId) => {
        const { data } = await api.post(`/whatsapp/chats/${selectedChat.jid}/messages/${msgId}/ai`);
        return data.result;
    };

    const getPureUrl = (content) => {
        if (!content) return '';
        const backendUrl = getBackendUrl();
        const cleanText = content.replace(/\\n/g, '\n').replace(/\[.*?\]/g, '').trim();
        const firstLine = cleanText.split('\n')[0];
        const urlPart = firstLine.split(' ').find(part => part.startsWith('/uploads/') || part.startsWith('http'));
        
        if (!urlPart) return '';
        return urlPart.startsWith('http') ? urlPart : `${backendUrl}${urlPart}`;
    };

    const handleAssumirAtendimento = async () => {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const roleUsuario = adminInfo.role || 'USER';
        const meuId = (adminInfo.id_usuario === 'DONO' || roleUsuario === 'ADMIN') ? 0 : Number(adminInfo.id_usuario || -1);

        try {
            await api.put(`/whatsapp/chats/${selectedChat.jid}/status`, { 
                status: 'atendimento', 
                responsavelId: meuId 
            });
            window.location.reload(); 
        } catch (error) {
            console.error("Erro ao assumir atendimento:", error);
        }
    };

    const handleSendMessage = async (text, file) => {
        if (isPendente || !canSend) return; // Trava dupla de segurança

        if (editingMsgId) {
            const msgId = editingMsgId;
            setEditingMsgId(null);
            setMessages(prev => prev.map(m => m.whatsappId === msgId ? { ...m, conteudo: text } : m));
            try {
                await api.put(`/whatsapp/chats/${selectedChat.jid}/messages/${msgId}`, { newText: text });
            } catch (error) {
                fetchMessages();
            }
        } else if (file) {
            const tempMsg = { id: Date.now(), whatsappId: 'temp-' + Date.now(), conteudo: `⏳ Enviando: ${file.name}`, fromMe: true, data_envio: new Date().toISOString(), tipo: 'document' };
            setMessages(prev => [...prev, tempMsg]);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('phone', selectedChat.jid);
            if (text) formData.append('caption', text);
            try {
                await api.post('/whatsapp/chats/send-media', formData);
            } catch (error) {
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            }
        } else {
            const tempMsg = { id: Date.now(), whatsappId: 'temp-' + Date.now(), conteudo: text, fromMe: true, data_envio: new Date().toISOString(), tipo: 'text' };
            setMessages(prev => [...prev, tempMsg]);
            try {
                await api.post('/whatsapp/chats/send', { phone: selectedChat.jid, message: text });
            } catch (error) {
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            }
        }
    };

    const handleOpenContactInfo = () => {
        setShowInfoPanel(true);
    };

    if (!selectedChat) return (
        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{ backgroundColor: 'var(--bg-main, #f8fafc)' }}>
            <i className="bi bi-whatsapp" style={{ fontSize: '4rem', opacity: 0.1 }}></i>
            <h4 className="mt-3 fw-bold" style={{ color: 'var(--text-secondary)' }}>Ararinha CRM</h4>
            <p>Selecione um contato para iniciar.</p>
        </div>
    );

    return (
        <div className="d-flex flex-column h-100 shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)', transition: 'background-color 0.2s ease' }}>
            
            <ChatHeader 
                selectedChat={selectedChat}
                isPendente={isPendente}
                onBack={onBack}
                onInfoClick={handleOpenContactInfo}
            />

            <div className="flex-grow-1 p-3 overflow-auto chat-container" style={{ 
                backgroundColor: 'var(--chat-bg)',
                backgroundImage: 'var(--chat-bg-img)',
                backgroundSize: 'cover', 
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed' 
            }}>
                {loading && messages.length === 0 ? (
                    <div className="text-center mt-5"><Spinner animation="border" variant="success" /></div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            msg={msg}
                            canSend={canSend} // 🟢 Passando a permissão para a bolha
                            onEdit={(m) => setEditingMsgId(m.whatsappId)}
                            onDelete={(id) => api.delete(`/whatsapp/chats/${selectedChat.jid}/messages/${id}`).then(() => fetchMessages())}
                            getPureUrl={getPureUrl}
                            openMedia={openMedia}
                            onAnalyzeAI={handleAnalyzeAI}
                            onTranscribeAudio={handleTranscribeAudio}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 🟢 FEEDBACK VISUAL SE O BOT ESTIVER ATENDENDO */}
            {isBot && (
                <div className="bg-info bg-opacity-10 border-top border-info p-2 d-flex justify-content-between align-items-center shadow-sm">
                    <span className="text-info fw-bold small ms-2">
                        <i className="bi bi-robot fs-5 me-2 align-middle"></i>
                        A Inteligência Artificial está conversando com este cliente.
                    </span>
                    {canSend && ( // Só mostra o botão de assumir se tiver permissão de enviar mensagem
                        <Button variant="info" size="sm" className="fw-bold text-white shadow-sm" onClick={handleAssumirAtendimento}>
                            <i className="bi bi-person-fill me-1"></i> Assumir
                        </Button>
                    )}
                </div>
            )}

            {/* 🟢 CONTROLE DO INPUT DE MENSAGENS COM BASE NAS PERMISSÕES */}
            {isPendente ? (
                <div 
                    className="p-3 text-center d-flex flex-column justify-content-center align-items-center" 
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', minHeight: '70px' }}
                >
                    <div className="d-flex align-items-center fw-bold opacity-75">
                        <i className="bi bi-lock-fill fs-4 me-2 text-warning"></i>
                        <span>Inicie o atendimento pela barra lateral para interagir com este contato.</span>
                    </div>
                </div>
            ) : !canSend ? (
                <div 
                    className="p-3 text-center d-flex flex-column justify-content-center align-items-center" 
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', minHeight: '70px' }}
                >
                    <div className="d-flex align-items-center fw-bold opacity-75">
                        <i className="bi bi-eye-fill fs-4 me-2 text-primary"></i>
                        <span>Modo Leitura. Você não possui permissão para enviar mensagens.</span>
                    </div>
                </div>
            ) : (
                <div style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        editingMsg={messages.find(m => m.whatsappId === editingMsgId)}
                        onCancelEdit={() => setEditingMsgId(null)}
                        inputRef={inputRef}
                        fileInputRef={fileInputRef}
                        jid={selectedChat.jid}
                    />
                </div>
            )}

            <MediaModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                mediaUrl={modalData.url}
                mediaType={modalData.type}
            />

            {aiModalShow && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header text-white border-0" style={{ backgroundColor: '#10a37f' }}>
                                <h5 className="modal-title d-flex align-items-center fw-bold">
                                    <i className="bi bi-robot me-2 fs-4"></i> Análise com IA Groq
                                </h5>
                                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setAiModalShow(false)}></button>
                            </div>
                            <div className="modal-body p-4" style={{ minHeight: '150px' }}>
                                {aiLoading ? (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                        <Spinner animation="grow" style={{ color: '#10a37f' }} className="mb-3" />
                                        <span>A Inteligência Artificial está analisando o arquivo...</span>
                                    </div>
                                ) : (
                                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                        {aiResult}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light border-0">
                                <button type="button" className="btn btn-secondary shadow-sm" onClick={() => setAiModalShow(false)}>Fechar</button>
                                {!aiLoading && (
                                    <button type="button" className="btn shadow-sm text-white" style={{ backgroundColor: '#10a37f' }} onClick={() => navigator.clipboard.writeText(aiResult)}>
                                        <i className="bi bi-copy me-2"></i>Copiar Texto
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ContactInfoPanel 
                show={showInfoPanel} 
                onHide={() => setShowInfoPanel(false)} 
                contact={selectedChat} 
            />

            <style>{`
                :root { --chat-bg: #e5ddd5; --chat-bg-img: url("/backgroundlight.png"); }
                body.dark-mode { --chat-bg: #0b141a; --chat-bg-img: url("/backgrounddark.png"); }
                .chat-container::-webkit-scrollbar { width: 6px; }
                .chat-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 10px; }
                .chat-container { position: relative; }
            `}</style>
        </div>
    );
};

export default ChatWindow;