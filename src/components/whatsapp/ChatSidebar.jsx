import React, { useState, useEffect } from 'react';
import { ListGroup, Badge, Nav, Modal, Button, Form } from 'react-bootstrap';
import ChatOptions from './ChatSidebarModule/ChatOptions';
import api from '../../services/api';

const ChatSidebar = ({ chats, selectedJid, onSelectChat, fetchChats, socket }) => {
    const [hoveredJid, setHoveredJid] = useState(null);
    const [activeTab, setActiveTab] = useState('atendimento');
    const [tipoFiltro, setTipoFiltro] = useState('privado');

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [chatToTransfer, setChatToTransfer] = useState(null);
    const [equipe, setEquipe] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    const [isBotEnabled, setIsBotEnabled] = useState(false);

    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const roleUsuario = adminInfo.role || 'USER';
    const meuId = (adminInfo.id_usuario === 'DONO' || roleUsuario === 'ADMIN') ? 0 : Number(adminInfo.id_usuario || -1);

    useEffect(() => {
        const fetchAiConfig = async () => {
            try {
                const { data } = await api.get('/whatsapp/ai-config');
                setIsBotEnabled(data.ia_ativada);
                if (!data.ia_ativada && activeTab === 'bot') {
                    setActiveTab('pendentes');
                }
            } catch (error) {
                console.error("Erro ao carregar config da IA", error);
            }
        };
        fetchAiConfig();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleStatusUpdated = (data) => {
                if (data.id_tenant === Number(adminInfo.id_tenant)) {
                    console.log("Status atualizado via socket:", data);
                    if (fetchChats) fetchChats();
                }
            };

            socket.on('chat_status_updated', handleStatusUpdated);

            return () => {
                socket.off('chat_status_updated', handleStatusUpdated);
            };
        }
    }, [socket, fetchChats, adminInfo.id_tenant]);

    const handleChatAction = async (action, chat) => {
        if (action === 'abrir_transferencia') {
            setChatToTransfer(chat);
            buscarEquipe();
            setShowTransferModal(true);
            return;
        }

        let payload = {
            status: '',
            responsavelId: null 
        };

        if (action === 'arquivar' || action === 'finalizar') {
            payload.status = 'arquivados';
            payload.responsavelId = null; 
        } 
        else if (action === 'transferir') {
            payload.status = 'pendentes';
            payload.responsavelId = null;
        } 
        else if (action === 'atender') {
            payload.status = 'atendimento';
            payload.responsavelId = meuId;
        } 
        else if (action === 'enviar_bot') {
            payload.status = 'bot';
            payload.responsavelId = null; 
        }

        if (!payload.status) return;

        try {
            await api.put(`/whatsapp/chats/${chat.jid}/status`, payload);
            if (fetchChats) fetchChats();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };

    const buscarEquipe = async () => {
        try {
            const { data } = await api.get('/usuarios/staff');
            const listaFuncionarios = data.map(f => ({
                id: Number(f.id_funcionario),
                nome: f.nome_completo
            }));
            const donoDaLoja = { id: 0, nome: 'Proprietário (Dono)' };
            setEquipe([donoDaLoja, ...listaFuncionarios]);
        } catch (error) {
            console.error("Erro ao buscar equipe:", error);
        }
    };

    const confirmarTransferencia = async () => {
        if (selectedUserId === '') return;
        try {
            await api.put(`/whatsapp/chats/${chatToTransfer.jid}/status`, {
                status: 'atendimento',
                responsavelId: Number(selectedUserId)
            });
            setShowTransferModal(false);
            if (fetchChats) fetchChats();
        } catch (error) {
            console.error("Erro ao transferir:", error);
        }
    };

    const formatNumber = (jid) => {
        if (!jid) return 'Desconhecido';
        if (jid === 'status@broadcast') return 'Status (Stories)';
        if (jid.endsWith('@newsletter')) return 'Canal / Newsletter';
        if (jid.endsWith('@g.us')) return 'Grupo do WhatsApp';

        const num = jid.split('@')[0].replace(/^55/, '');
        if (num.length >= 10) {
            return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
        }
        return jid.split('@')[0];
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderPreviewText = (text) => {
        if (!text) return '📎 Mensagem de mídia';
        
        // 🟢 Remove as tags da função e seu conteúdo da pré-visualização da IA
        let cleanText = text.replace(/<function[^>]*>[\s\S]*?<\/function>/g, '').trim();
        
        // Se após a limpeza não sobrar nada, significa que a mensagem foi puramente sistêmica
        if (!cleanText) return 'Ação do Assistente';

        if (cleanText.includes('[Imagem]')) return <span><i className="bi bi-image me-1"></i> Imagem</span>;
        if (cleanText.includes('[Audio]')) return <span><i className="bi bi-mic me-1"></i> Áudio</span>;
        if (cleanText.includes('[Video]')) return <span><i className="bi bi-camera-video me-1"></i> Vídeo</span>;
        if (cleanText.includes('[Documento]')) return <span><i className="bi bi-file-earmark-text me-1"></i> Documento</span>;

        if (cleanText.includes('\n')) {
            const parts = cleanText.split('\n');
            return parts[parts.length - 1].trim();
        }
        return cleanText;
    };

    const isGrupo = (jid) => jid?.endsWith('@g.us');
    const isStatus = (jid) => jid === 'status@broadcast' || jid?.endsWith('@newsletter');
    const isPrivado = (jid) => !isGrupo(jid) && !isStatus(jid);

    const isPendente = (chat) => {
        const chatStatus = chat.status || 'atendimento';
        const temDono = chat.responsavelId !== null && chat.responsavelId !== undefined;
        return chatStatus === 'pendentes' || (!temDono && chatStatus !== 'arquivados' && chatStatus !== 'bot');
    };
    
    const isArquivado = (chat) => {
        return chat.status === 'arquivados';
    };

    const isAtendimento = (chat) => {
        const chatStatus = chat.status || 'atendimento';
        const temDono = chat.responsavelId !== null && chat.responsavelId !== undefined;
        return chatStatus === 'atendimento' && temDono && Number(chat.responsavelId) === meuId;
    };
    
    const isBot = (chat) => chat.status === 'bot';

    const filteredChats = chats.filter(chat => {
        if (tipoFiltro === 'privado' && !isPrivado(chat.jid)) return false;
        if (tipoFiltro === 'grupos' && !isGrupo(chat.jid)) return false;
        if (tipoFiltro === 'status' && !isStatus(chat.jid)) return false;

        if (activeTab === 'pendentes') return isPendente(chat);
        if (activeTab === 'arquivados') return isArquivado(chat);
        if (activeTab === 'atendimento') return isAtendimento(chat);
        if (activeTab === 'bot') return isBot(chat);
        return false;
    });

    const temMensagemNaoLida = (chat) => chat.naoLidas > 0 && selectedJid !== chat.jid;

    const baseChats = chats.filter(chat => {
        if (tipoFiltro === 'privado') return isPrivado(chat.jid);
        if (tipoFiltro === 'grupos') return isGrupo(chat.jid);
        if (tipoFiltro === 'status') return isStatus(chat.jid);
        return false;
    });

    const unreadAtendimentoCount = baseChats.filter(c => isAtendimento(c) && temMensagemNaoLida(c)).length;
    const unreadPendentesCount = baseChats.filter(c => isPendente(c) && temMensagemNaoLida(c)).length;
    const unreadArquivadosCount = baseChats.filter(c => isArquivado(c) && temMensagemNaoLida(c)).length;
    const unreadBotCount = baseChats.filter(c => isBot(c) && temMensagemNaoLida(c)).length;

    return (
        <div className="d-flex flex-column h-100 border-end transition-all position-relative" style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)', borderColor: 'var(--border-color, #e2e8f0)', color: 'var(--text-primary, #0f172a)' }}>
            <div className="p-2 border-bottom" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <div className="d-flex p-1 rounded-pill" style={{ backgroundColor: 'var(--bg-main, #f1f5f9)', border: '1px solid var(--border-color)' }}>
                    <button className={`btn btn-sm flex-grow-1 rounded-pill fw-bold border-0 transition-all ${tipoFiltro === 'privado' ? 'btn-primary shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.75rem' }} onClick={() => setTipoFiltro('privado')}>
                        <i className="bi bi-person-fill me-1"></i>Privado
                    </button>
                    <button className={`btn btn-sm flex-grow-1 rounded-pill fw-bold border-0 transition-all ${tipoFiltro === 'grupos' ? 'btn-primary shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.75rem' }} onClick={() => setTipoFiltro('grupos')}>
                        <i className="bi bi-people-fill me-1"></i>Grupos
                    </button>
                    <button className={`btn btn-sm flex-grow-1 rounded-pill fw-bold border-0 transition-all ${tipoFiltro === 'status' ? 'btn-primary shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.75rem' }} onClick={() => setTipoFiltro('status')}>
                        <i className="bi bi-circle-dashed me-1"></i>Status
                    </button>
                </div>
            </div>

            <div className="border-bottom overflow-auto" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <Nav variant="underline" activeKey={activeTab} className="flex-nowrap small pt-1 px-2" style={{ whiteSpace: 'nowrap' }}>
                    <Nav.Item>
                        <Nav.Link eventKey="atendimento" onClick={() => setActiveTab('atendimento')} className={`border-0 d-flex align-items-center justify-content-center ${activeTab === 'atendimento' ? "fw-bold text-success" : "text-muted opacity-75"}`} style={{ color: activeTab === 'atendimento' ? '#198754' : 'var(--text-secondary)', padding: '0.5rem 0.4rem' }}>
                            Humanos
                            {unreadAtendimentoCount > 0 && <Badge bg="danger" pill className="ms-1" style={{ fontSize: '0.65rem' }}>{unreadAtendimentoCount}</Badge>}
                        </Nav.Link>
                    </Nav.Item>

                    {isBotEnabled && (
                        <Nav.Item>
                            <Nav.Link eventKey="bot" onClick={() => setActiveTab('bot')} className={`border-0 d-flex align-items-center justify-content-center ${activeTab === 'bot' ? "fw-bold text-info" : "text-muted opacity-75"}`} style={{ color: activeTab === 'bot' ? '#0dcaf0' : 'var(--text-secondary)', padding: '0.5rem 0.4rem' }}>
                                <i className="bi bi-robot me-1"></i> IA
                                {unreadBotCount > 0 && <Badge bg="danger" pill className="ms-1" style={{ fontSize: '0.65rem' }}>{unreadBotCount}</Badge>}
                            </Nav.Link>
                        </Nav.Item>
                    )}

                    <Nav.Item>
                        <Nav.Link eventKey="pendentes" onClick={() => setActiveTab('pendentes')} className={`border-0 d-flex align-items-center justify-content-center ${activeTab === 'pendentes' ? "fw-bold text-warning" : "text-muted opacity-75"}`} style={{ color: activeTab === 'pendentes' ? '#ffc107' : 'var(--text-secondary)', padding: '0.5rem 0.4rem' }}>
                            Pendentes
                            {unreadPendentesCount > 0 && <Badge bg="danger" pill className="ms-1" style={{ fontSize: '0.65rem' }}>{unreadPendentesCount}</Badge>}
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="arquivados" onClick={() => setActiveTab('arquivados')} className={`border-0 d-flex align-items-center justify-content-center ${activeTab === 'arquivados' ? "fw-bold text-primary" : "text-muted opacity-75"}`} style={{ color: activeTab === 'arquivados' ? '#0d6efd' : 'var(--text-secondary)', padding: '0.5rem 0.4rem' }}>
                            Arquivados
                            {unreadArquivadosCount > 0 && <Badge bg="danger" pill className="ms-1" style={{ fontSize: '0.65rem' }}>{unreadArquivadosCount}</Badge>}
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {filteredChats.length === 0 ? (
                    <div className="text-center p-5 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                        <i className="bi bi-chat-dots fs-1"></i>
                        <p className="mt-2 small">
                            {activeTab === 'atendimento' && `Nenhum ${tipoFiltro} em andamento com humanos.`}
                            {activeTab === 'bot' && `Nenhum ${tipoFiltro} sendo atendido pela IA.`}
                            {activeTab === 'pendentes' && `Nenhum ${tipoFiltro} pendente.`}
                            {activeTab === 'arquivados' && `Nenhum ${tipoFiltro} arquivado.`}
                        </p>
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {filteredChats.map((chat) => (
                            <ListGroup.Item
                                key={chat.jid}
                                action
                                active={selectedJid === chat.jid}
                                onClick={() => onSelectChat(chat)}
                                onMouseEnter={() => setHoveredJid(chat.jid)}
                                onMouseLeave={() => setHoveredJid(null)}
                                className="p-3 border-bottom border-0 position-relative transition-all"
                                style={{
                                    backgroundColor: selectedJid === chat.jid ? 'var(--bg-active, #86efac)' : 'transparent',
                                    borderBottom: '1px solid var(--border-color)',
                                    color: selectedJid === chat.jid ? 'var(--text-active, #14532d)' : 'var(--text-primary)'
                                }}
                            >
                                <div className="d-flex w-100 align-items-center">
                                    <div className="me-3 position-relative flex-shrink-0">
                                        {chat.foto ? (
                                            <img
                                                src={chat.foto}
                                                alt="Perfil"
                                                className="rounded-circle border"
                                                style={{ width: 48, height: 48, objectFit: 'cover', borderColor: 'var(--border-color)' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="bg-secondary rounded-circle align-items-center justify-content-center text-white"
                                            style={{ width: 48, height: 48, display: chat.foto ? 'none' : 'flex' }}
                                        >
                                            <i className={isGrupo(chat.jid) ? "bi bi-people-fill fs-5" : isStatus(chat.jid) ? "bi bi-megaphone-fill fs-5" : "bi bi-person-fill fs-5"}></i>
                                        </div>
                                    </div>

                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <strong className={`text-truncate ${temMensagemNaoLida(chat) ? 'fw-bold' : ''}`} style={{ maxWidth: '70%', fontSize: '0.95rem' }}>
                                                {chat.nome || formatNumber(chat.jid)}
                                            </strong>

                                            <div className="d-flex align-items-center flex-shrink-0">
                                                {(hoveredJid === chat.jid || selectedJid === chat.jid) ? (
                                                    <ChatOptions chat={chat} onAction={handleChatAction} isBotEnabled={isBotEnabled} />
                                                ) : (
                                                    <small
                                                        className="opacity-75"
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            color: selectedJid === chat.jid ? 'inherit' : (temMensagemNaoLida(chat) ? '#198754' : 'var(--text-secondary)'),
                                                            fontWeight: temMensagemNaoLida(chat) ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {formatTime(chat.dataUltima)}
                                                    </small>
                                                )}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                            <small
                                                className={`text-truncate opacity-75 ${temMensagemNaoLida(chat) ? 'fw-bold' : ''}`}
                                                style={{ maxWidth: '85%', color: selectedJid === chat.jid ? 'inherit' : 'var(--text-secondary)' }}
                                            >
                                                {renderPreviewText(chat.ultimaMensagem)}
                                            </small>

                                            {temMensagemNaoLida(chat) && (
                                                <Badge bg="danger" pill className="ms-2 shadow-sm">{chat.naoLidas}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>

            <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                    <Modal.Title className="fs-5">Transferir Atendimento</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                    <p className="small text-muted mb-3">Selecione para qual atendente deseja enviar a conversa de <strong>{chatToTransfer?.nome || formatNumber(chatToTransfer?.jid)}</strong>.</p>
                    <Form.Select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                        <option value="">Selecione um membro da equipe...</option>
                        {equipe.map(membro => (
                            <option key={membro.id} value={membro.id}>
                                {membro.nome} {membro.id === meuId ? '(Você)' : ''}
                            </option>
                        ))}
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer style={{ backgroundColor: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={confirmarTransferencia} disabled={selectedUserId === ''}>Transferir Agora</Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .nav-underline .nav-link.active {
                    color: var(--text-primary) !important;
                    border-bottom-color: var(--text-primary) !important;
                }
                .list-group-item-action:hover {
                    background-color: var(--bg-hover, #f1f5f9) !important;
                    color: var(--text-primary) !important;
                }
                .transition-all {
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ChatSidebar;