import React, { useState } from 'react';
import { ListGroup, Badge, Nav, InputGroup, Form } from 'react-bootstrap';
import ChatOptions from './ChatSidebarModule/ChatOptions';

const ChatSidebar = ({ chats, selectedJid, onSelectChat, onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('open'); // open, pending, closed

    // 🟢 MÁSCARA DE NÚMERO
    const formatNumber = (num) => {
        if (!num) return 'Desconhecido';
        const n = String(num).replace(/^55/, '');
        if (n.length >= 10) return `(${n.substring(0, 2)}) ${n.substring(2, 7)}-${n.substring(7)}`;
        return num;
    };

    // 🟢 FILTRAGEM DE TICKETS POR STATUS (Padrão Whazing: open, pending, closed)
    const filteredChats = (chats || []).filter(ticket => {
        // Se estiver pesquisando, ignora a aba e busca em todos
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const name = (ticket.contact?.name || '').toLowerCase();
            const number = (ticket.contact?.number || '').toLowerCase();
            return name.includes(term) || number.includes(term);
        }

        // Mapeia os status do Whazing para as abas
        if (activeTab === 'open') return ticket.status === 'open' || ticket.status === 'atendimento';
        if (activeTab === 'pending') return ticket.status === 'pending' || ticket.status === 'pendentes';
        if (activeTab === 'closed') return ticket.status === 'closed' || ticket.status === 'arquivados';
        return false;
    });

    // 🟢 CONTADORES DAS ABAS
    const getCount = (statusArr) => (chats || []).filter(t => statusArr.includes(t.status)).length;
    const countOpen = getCount(['open', 'atendimento']);
    const countPending = getCount(['pending', 'pendentes']);
    const countClosed = getCount(['closed', 'arquivados']);

    return (
        <div className="d-flex flex-column h-100 border-end position-relative" style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)', borderColor: 'var(--border-color, #e2e8f0)' }}>
            
            {/* 🟢 BARRA DE PESQUISA */}
            <div className="p-3 border-bottom shadow-sm z-1">
                <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0 text-muted"><i className="bi bi-search"></i></InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="Buscar atendimento..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (onSearch) onSearch(e.target.value);
                        }}
                        className="bg-light border-start-0 shadow-none"
                    />
                </InputGroup>
            </div>

            {/* 🟢 ABAS DE STATUS (Só aparecem se não estiver pesquisando) */}
            {!searchTerm && (
                <div className="border-bottom" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    <Nav variant="underline" activeKey={activeTab} className="flex-nowrap small pt-1 px-2 d-flex justify-content-between">
                        
                        <Nav.Item className="flex-grow-1 text-center">
                            <Nav.Link eventKey="pending" onClick={() => setActiveTab('pending')} className={`border-0 d-flex flex-column align-items-center ${activeTab === 'pending' ? "fw-bold text-warning" : "text-muted opacity-75"}`}>
                                <span>Pendentes</span>
                                {countPending > 0 && <Badge bg="warning" text="dark" pill className="mt-1 shadow-sm">{countPending}</Badge>}
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item className="flex-grow-1 text-center">
                            <Nav.Link eventKey="open" onClick={() => setActiveTab('open')} className={`border-0 d-flex flex-column align-items-center ${activeTab === 'open' ? "fw-bold text-success" : "text-muted opacity-75"}`}>
                                <span>Abertos</span>
                                {countOpen > 0 && <Badge bg="success" pill className="mt-1 shadow-sm">{countOpen}</Badge>}
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item className="flex-grow-1 text-center">
                            <Nav.Link eventKey="closed" onClick={() => setActiveTab('closed')} className={`border-0 d-flex flex-column align-items-center ${activeTab === 'closed' ? "fw-bold text-primary" : "text-muted opacity-75"}`}>
                                <span>Fechados</span>
                                {countClosed > 0 && <Badge bg="primary" pill className="mt-1 shadow-sm">{countClosed}</Badge>}
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>
            )}

            {/* 🟢 LISTA DE TICKETS (ATENDIMENTOS) */}
            <div className="flex-grow-1 overflow-auto">
                {filteredChats.length === 0 ? (
                    <div className="text-center p-5 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                        <i className="bi bi-inbox fs-1"></i>
                        <p className="mt-2 small">Nenhum atendimento encontrado nesta aba.</p>
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {filteredChats.map((ticket) => {
                            const contato = ticket.contact || ticket; // Fallback caso a API retorne misturado
                            const num = contato.number || ticket.number;
                            const isSelected = selectedJid === num;
                            const naoLidas = ticket.unreadMessages || 0;

                            return (
                                <ListGroup.Item
                                    key={ticket.id || num}
                                    action
                                    active={isSelected}
                                    onClick={() => onSelectChat(contato)}
                                    className="p-3 border-bottom border-0 transition-all"
                                    style={{
                                        backgroundColor: isSelected ? 'var(--bg-active, #e2e8f0)' : 'transparent',
                                        borderBottom: '1px solid var(--border-color)',
                                        color: isSelected ? 'var(--text-active, #0f172a)' : 'var(--text-primary)'
                                    }}
                                >
                                    <div className="d-flex w-100 align-items-center">
                                        
                                        {/* FOTO DO PERFIL */}
                                        <div className="me-3 position-relative flex-shrink-0">
                                            {contato.profilePicUrl ? (
                                                <img
                                                    src={contato.profilePicUrl}
                                                    alt="Perfil"
                                                    className="rounded-circle border"
                                                    style={{ width: 48, height: 48, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="bg-secondary rounded-circle align-items-center justify-content-center text-white d-flex" style={{ width: 48, height: 48 }}>
                                                    <i className="bi bi-person-fill fs-5"></i>
                                                </div>
                                            )}
                                            {naoLidas > 0 && !isSelected && (
                                                <Badge bg="danger" pill className="position-absolute bottom-0 end-0 border border-white">
                                                    {naoLidas}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* DADOS E ÚLTIMA MENSAGEM */}
                                        <div className="flex-grow-1 overflow-hidden">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <strong className={`text-truncate ${naoLidas > 0 ? 'fw-bold' : ''}`} style={{ maxWidth: '75%', fontSize: '0.95rem' }}>
                                                    {contato.name || contato.pushname || formatNumber(num)}
                                                </strong>
                                                
                                                {/* Menu de 3 pontinhos */}
                                                <ChatOptions chat={ticket} />
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className={`text-truncate opacity-75 ${naoLidas > 0 ? 'fw-bold text-success' : 'text-muted'}`} style={{ maxWidth: '85%' }}>
                                                    {ticket.lastMessage || `+${num}`}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                )}
            </div>

            <style>{`
                .nav-underline .nav-link { color: var(--text-secondary); padding-bottom: 0.5rem; }
                .nav-underline .nav-link.active { border-bottom-width: 3px; }
                .list-group-item-action:hover { background-color: var(--bg-hover, #f8fafc) !important; }
            `}</style>
        </div>
    );
};

export default ChatSidebar;