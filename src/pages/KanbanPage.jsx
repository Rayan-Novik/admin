import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Spinner, Badge, Card, Modal, Button, InputGroup, ListGroup, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
// 🟢 IMPORTA O COMPONENTE DO CHAT
import ChatPopup from '../components/whazing/ChatPopup'; 

const KanbanPage = () => {
    const [boards, setBoards] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState('');
    const [columns, setColumns] = useState([]);
    const [cards, setCards] = useState([]);
    // 🟢 ESTADO DOS RÓTULOS DO BOARD
    const [boardLabels, setBoardLabels] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Listas do sistema
    const [produtosLista, setProdutosLista] = useState([]);

    // Estados para o Modal de Edição
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('detalhes');

    // Estados para o Checklist
    const [checklists, setChecklists] = useState([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState('');

    // Estado para controle visual do Drag and Drop
    const [dragOverColId, setDragOverColId] = useState(null);

    // ESTADOS DO AUTOCOMPLETE ESTILO WHATICKET
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingContacts, setIsSearchingContacts] = useState(false);
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // 🟢 ESTADOS PARA O CHAT
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatCard, setChatCard] = useState(null);

    // 🟢 CACHE DE MEMÓRIA
    const [contactCache, setContactCache] = useState(() => {
        try {
            const saved = localStorage.getItem('whazing_contacts_cache');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const saveToCache = (id, name, number) => {
        if (!id) return;
        setContactCache(prev => {
            const novoCache = { ...prev, [id]: { name, number } };
            localStorage.setItem('whazing_contacts_cache', JSON.stringify(novoCache));
            return novoCache;
        });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [boardsRes, produtosRes] = await Promise.all([
                    api.get('/kanban/boards'),
                    api.get('/produtos')
                ]);

                const boardsArray = Array.isArray(boardsRes.data) ? boardsRes.data : (boardsRes.data?.boards || []);
                setBoards(boardsArray);
                if (boardsArray.length > 0) setSelectedBoard(boardsArray[0].id);

                setProdutosLista(produtosRes.data || []);
            } catch (error) {
                toast.error('Erro ao carregar dados iniciais');
                setBoards([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchKanbanData = async () => {
        if (!selectedBoard) return;
        try {
            setLoading(true);
            const [colsRes, cardsRes, labelsRes] = await Promise.all([
                api.get(`/kanban/boards/${selectedBoard}/columns`),
                api.get(`/kanban/boards/${selectedBoard}/cards`),
                api.get(`/kanban/boards/${selectedBoard}/labels`).catch(() => ({ data: [] }))
            ]);

            const colsArray = Array.isArray(colsRes.data) ? colsRes.data : (colsRes.data?.columns || []);
            let cardsArray = Array.isArray(cardsRes.data) ? cardsRes.data : (cardsRes.data?.cards || []);
            const labelsArray = Array.isArray(labelsRes.data) ? labelsRes.data : (labelsRes.data?.labels || []);

            // 🟢 MAGIA ACONTECENDO AQUI: Associa os Rótulos Visuais aos IDs do Card!
            cardsArray = cardsArray.map(card => {
                if (card.labelIds && Array.isArray(card.labelIds)) {
                    // Pega os objetos inteiros de labels do Board cujo ID está no card.labelIds
                    card.labelsObjects = labelsArray.filter(lbl => card.labelIds.includes(lbl.id));
                } else {
                    card.labelsObjects = [];
                }
                return card;
            });

            setColumns(colsArray.sort((a, b) => a.sortOrder - b.sortOrder));
            setCards(cardsArray);
            setBoardLabels(labelsArray);
        } catch (error) {
            toast.error('Erro ao carregar dados do quadro');
            setColumns([]); setCards([]); setBoardLabels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKanbanData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBoard]);

    const fetchChecklistsForCard = async (cardId) => {
        try {
            setLoadingChecklists(true);
            const { data } = await api.get(`/kanban/cards/${cardId}/checklists`);
            const list = Array.isArray(data) ? data : (data?.items || data?.checklists || []);
            setChecklists(list);
        } catch (error) {
            setChecklists([]);
        } finally {
            setLoadingChecklists(false);
        }
    };

    const extrairTelefoneDoCard = (card) => {
        const realContactId = card.contactId || (card.contact ? card.contact.id : '');
        const cachedInfo = contactCache[realContactId] || {};
        let fone = cachedInfo.number || '';
        
        if (!fone) {
            const matchContato = (card.note || '').match(/Contato:\s*(.+) - (\d+)/i);
            const matchFone = (card.note || '').match(/WhatsApp:\s*(\d+)/i);
            if (matchContato) fone = matchContato[2];
            else if (matchFone) fone = matchFone[1];
        }
        return fone;
    };

    const handleOpenChat = (card) => {
        const fone = extrairTelefoneDoCard(card);
        const nomeExibe = contactCache[card.contactId]?.name || card.contactName || 'Cliente';

        if (!fone) {
            return toast.warning("Edite o card e adicione um contato primeiro!");
        }

        setChatCard({ ...card, telefone: fone, nomeExibicao: nomeExibe });
        setShowChatModal(true);
    };

    const handleOpenEdit = (card) => {
        const realContactId = card.contactId || (card.contact ? card.contact.id : '');
        
        const cachedInfo = contactCache[realContactId] || {};
        const nomeExtraido = cachedInfo.name || card.contactName || '';
        const telefoneExtraido = extrairTelefoneDoCard(card);

        let textoBarraPesquisa = realContactId ? String(realContactId) : '';
        if (nomeExtraido && telefoneExtraido) {
            textoBarraPesquisa = `${nomeExtraido} (${telefoneExtraido})`;
        } else if (telefoneExtraido) {
            textoBarraPesquisa = telefoneExtraido;
        }

        setEditingCard({
            ...card,
            note: card.note || '',
            value: card.value || card.dealValue || '',
            startDate: card.startDate || '',
            assigneeId: card.assigneeId || '',
            contactId: realContactId,
            telefone: telefoneExtraido,
            contactName: nomeExtraido,
            // 🟢 Injeta os rótulos do estado do Card no Modal!
            labels: card.labelsObjects || [] 
        });

        setSearchTerm(textoBarraPesquisa);
        setShowContactDropdown(false);
        setActiveTab('detalhes');
        setChecklists([]);
        fetchChecklistsForCard(card.id);
        setShowEditModal(true);
    };

    const handleToggleLabel = (label) => {
        setEditingCard(prev => {
            const currentLabels = prev.labels || [];
            const hasLabel = currentLabels.some(l => l.id === label.id);
            
            let newLabels;
            if (hasLabel) {
                newLabels = currentLabels.filter(l => l.id !== label.id); 
            } else {
                newLabels = [...currentLabels, label]; 
            }

            return { ...prev, labels: newLabels };
        });
    };

    const valorCalculado = checklists.reduce((total, item) => {
        const itemName = item.text || item.title || "";
        const produto = produtosLista.find(p => p.nome === itemName);
        return total + (produto && produto.preco ? Number(produto.preco) : 0);
    }, 0);

    useEffect(() => {
        if (checklists.length > 0) {
            setEditingCard(prev => {
                if (prev && Number(prev.value) !== valorCalculado) {
                    return { ...prev, value: valorCalculado };
                }
                return prev;
            });
        }
    }, [valorCalculado, checklists.length]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 3 && showContactDropdown) {
                setIsSearchingContacts(true);
                try {
                    const { data } = await api.get(`/kanban/whazing/contacts/search?q=${searchTerm}`);
                    setSearchResults(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Erro na busca de contatos", error);
                    setSearchResults([]);
                } finally {
                    setIsSearchingContacts(false);
                }
            } else if (searchTerm.length < 3) {
                setSearchResults([]);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, showContactDropdown]);

    const handleSelectContact = (contact) => {
        const telExtraido = contact.telefone || contact.number || '';
        const nomeExtraido = contact.nome_completo || contact.name || contact.email || 'Sem Nome';
        const cId = contact.id || contact.id_usuario || '';

        setEditingCard(prev => ({
            ...prev,
            contactId: cId,
            telefone: telExtraido,
            contactName: nomeExtraido 
        }));

        saveToCache(cId, nomeExtraido, telExtraido);
        
        setSearchTerm(`${nomeExtraido} (${telExtraido})`);
        setShowContactDropdown(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowContactDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDragStart = (e, card) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('draggedCard', JSON.stringify(card));
        setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
    };
    const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDragOverColId(null); };
    const handleDragOver = (e, colId) => { e.preventDefault(); if (dragOverColId !== colId) setDragOverColId(colId); };

    const handleDrop = async (e, newColumnId) => {
        e.preventDefault();
        setDragOverColId(null);
        const cardStr = e.dataTransfer.getData('draggedCard');
        if (!cardStr) return;
        const draggedCard = JSON.parse(cardStr);
        if (Number(draggedCard.columnId) === Number(newColumnId)) return;

        const backupCards = [...cards];
        setCards(prevCards => prevCards.map(c => c.id === draggedCard.id ? { ...c, columnId: newColumnId } : c));

        try {
            let numericValue = parseFloat(String(draggedCard.value || draggedCard.dealValue || 0).replace(',', '.'));
            const payload = {
                title: draggedCard.title,
                priority: draggedCard.priority,
                columnId: Number(newColumnId),
                dealValue: numericValue
            };
            if (draggedCard.assigneeId && !isNaN(Number(draggedCard.assigneeId))) payload.assigneeId = Number(draggedCard.assigneeId);
            if (draggedCard.contactId) payload.contactId = String(draggedCard.contactId);
            if (draggedCard.note && draggedCard.note.trim() !== '') payload.note = draggedCard.note;
            if (draggedCard.dueDate) payload.dueDate = draggedCard.dueDate.split('T')[0];

            await api.put(`/kanban/cards/${draggedCard.id}`, payload);
        } catch (error) {
            toast.error('Erro ao mover card.');
            setCards(backupCards);
        }
    };

    const handleSaveCard = async () => {
        try {
            setSaving(true);
            let numericValue = parseFloat(String(editingCard.value || 0).replace(',', '.'));
            const payload = {
                title: editingCard.title,
                priority: editingCard.priority,
                columnId: Number(editingCard.columnId),
                dealValue: numericValue,
                // 🟢 MANDA OS IDS DOS RÓTULOS (Labels)
                labelIds: editingCard.labels?.map(l => l.id) || [] 
            };

            if (editingCard.assigneeId && !isNaN(Number(editingCard.assigneeId))) payload.assigneeId = Number(editingCard.assigneeId);

            if (editingCard.contactId && !isNaN(Number(editingCard.contactId))) {
                payload.contactId = Number(editingCard.contactId);
            }

            payload.note = editingCard.note || '';
            if (editingCard.dueDate) payload.dueDate = editingCard.dueDate.split('T')[0];

            await api.put(`/kanban/cards/${editingCard.id}`, payload);
            toast.success('Card atualizado com sucesso!');
            setShowEditModal(false);
            fetchKanbanData(); // Atualiza a tela puxando o getCards de novo
        } catch (error) {
            toast.error('Erro ao atualizar card. Verifique o console.');
        } finally {
            setSaving(false);
        }
    };

    const handleArchiveCard = async () => {
        if (!window.confirm("Deseja arquivar este card?")) return;
        try {
            setSaving(true);
            await api.delete(`/kanban/cards/${editingCard.id}`);
            toast.success('Card arquivado!');
            setShowEditModal(false);
            fetchKanbanData();
        } catch (error) {
            toast.error('Erro ao arquivar card.');
        } finally {
            setSaving(false);
        }
    };

    const handleSendQuote = async () => {
        let numeroDestino = editingCard.telefone;
        if (!numeroDestino && searchTerm) {
            numeroDestino = searchTerm.replace(/\D/g, '');
        }

        if (!numeroDestino || numeroDestino.length < 10) {
            return toast.warning("Selecione um contato na pesquisa para enviar a mensagem!");
        }

        try {
            setSaving(true);

            let itensTexto = '';
            if (checklists && checklists.length > 0) {
                itensTexto = checklists.map(item => {
                    const itemName = item.text || item.title || "";
                    const produtoOriginal = produtosLista.find(p => p.nome === itemName);
                    const preco = produtoOriginal && produtoOriginal.preco ? Number(produtoOriginal.preco) : 0;
                    return `▫️ ${itemName} — R$ ${preco.toFixed(2)}`;
                }).join('\n');
            } else {
                itensTexto = '▫️ Nenhum produto especificado.';
            }

            const textMsg = `✅ *Orçamento de Pedido*\n\nOlá! Segue o detalhamento do atendimento referente a: *${editingCard.title}*.\n\n📦 *Produtos/Itens:*\n${itensTexto}\n\n💰 *Valor Total:* R$ ${Number(editingCard.value || 0).toFixed(2)}\n\nSe precisar de algo, estamos à disposição!`;

            await api.post('/kanban/whazing/message', { 
                number: numeroDestino, 
                message: textMsg 
            });
            
            toast.success("Orçamento detalhado enviado ao WhatsApp do cliente!");
        } catch (error) {
            toast.error("Falha ao enviar orçamento via WhatsApp.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddChecklist = async () => {
        if (!newChecklistTitle || !newChecklistTitle.trim()) return;
        try {
            await api.post(`/kanban/cards/${editingCard.id}/checklists`, { text: newChecklistTitle, isCompleted: false });
            setNewChecklistTitle('');
            fetchChecklistsForCard(editingCard.id);
        } catch (error) { toast.error('Erro ao adicionar produto no checklist.'); }
    };

    const handleToggleChecklist = async (item) => {
        try {
            setChecklists(checklists.map(c => c.id === item.id ? { ...c, isCompleted: !item.isCompleted } : c));
            await api.put(`/kanban/checklists/${item.id}`, { text: item.text || item.title, isCompleted: !item.isCompleted });
        } catch (error) {
            toast.error('Erro ao atualizar produto.');
            fetchChecklistsForCard(editingCard.id);
        }
    };

    const handleDeleteChecklist = async (itemId) => {
        if (!window.confirm('Deletar este produto?')) return;
        try {
            await api.delete(`/kanban/checklists/${itemId}`);
            setChecklists(checklists.filter(c => c.id !== itemId));
        } catch (error) { toast.error('Erro ao deletar produto.'); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    const formatDate = (dateString) => dateString ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString)) : null;
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RC';

    return (
        <Container fluid className="p-4 d-flex flex-column h-100" style={{ backgroundColor: '#f4f5f7' }}>
            
            <ChatPopup 
                show={showChatModal} 
                onHide={() => setShowChatModal(false)} 
                card={chatCard} 
            />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-0 text-dark">Kanban / CRM</h2>
                    <p className="text-muted mb-0">Acompanhe o funil de pedidos e clientes (Integração WebAzun)</p>
                </div>
                <div style={{ minWidth: '250px' }}>
                    <Form.Select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} disabled={loading || boards.length === 0} className="shadow-sm border-0">
                        {boards.length === 0 && <option value="">Nenhum quadro encontrado</option>}
                        {boards.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}
                    </Form.Select>
                </div>
            </div>

            {loading && columns.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center flex-grow-1"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <div className="flex-grow-1 overflow-auto pb-3" style={{ whiteSpace: 'nowrap' }}>
                    <div className="d-inline-flex h-100 align-items-start gap-3">
                        {columns.map(col => {
                            const columnCards = cards.filter(card => card.columnId === col.id);
                            return (
                                <div key={col.id} className="d-inline-block rounded-3 h-100" onDragOver={(e) => handleDragOver(e, col.id)} onDragLeave={() => setDragOverColId(null)} onDrop={(e) => handleDrop(e, col.id)} style={{ width: '300px', backgroundColor: dragOverColId === col.id ? '#dfe1e6' : '#ebecf0', verticalAlign: 'top', maxHeight: '100%', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s ease' }}>
                                    <div className="p-3 pb-2 fw-bold d-flex justify-content-between align-items-center">
                                        <span className="text-dark" style={{ borderLeft: `4px solid ${col.color || '#0079bf'}`, paddingLeft: '8px', fontSize: '0.9rem' }}>{col.name.toUpperCase()}</span>
                                        <Badge bg="secondary" pill>{columnCards.length}</Badge>
                                    </div>
                                    <div className="p-2 overflow-auto flex-grow-1" style={{ whiteSpace: 'normal', minHeight: '150px' }}>
                                        {columnCards.map(card => {
                                            const realContactId = card.contactId || (card.contact ? card.contact.id : '');
                                            const cachedInfo = contactCache[realContactId] || {};
                                            
                                            let displayContactInfo = 'Sem contato';
                                            if (cachedInfo.name && cachedInfo.number) {
                                                displayContactInfo = `${cachedInfo.name} - ${cachedInfo.number}`;
                                            } else if (card.contactName) {
                                                displayContactInfo = card.contactName;
                                            } else if (realContactId) {
                                                displayContactInfo = `ID: ${realContactId}`;
                                            }

                                            return (
                                                <Card key={card.id} className="mb-2 shadow-sm border-0 rounded-2" style={{ cursor: 'grab', transition: 'background-color 0.2s' }} draggable={true} onDragStart={(e) => handleDragStart(e, card)} onDragEnd={handleDragEnd} onClick={() => handleOpenEdit(card)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                                    <Card.Body className="p-2 px-3">
                                                        
                                                        {/* 🟢 RENDEREIZAÇÃO DOS RÓTULOS (BARRINHAS DE COR) */}
                                                        {card.labelsObjects && card.labelsObjects.length > 0 && (
                                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                                {card.labelsObjects.map(lbl => (
                                                                    <div key={lbl.id} style={{ backgroundColor: lbl.color || '#0079bf', height: '8px', width: '40px', borderRadius: '4px' }} title={lbl.name}></div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <Card.Title className="h6 mb-2 fw-bold" style={{ fontSize: '0.95rem', color: '#0052cc' }}>{card.title || 'Teste'}</Card.Title>
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span style={{ fontSize: '0.85rem', color: '#172b4d', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                <i className="bi bi-person-circle text-teal me-1" style={{ color: '#00b8d9' }}></i>
                                                                {displayContactInfo}
                                                            </span>
                                                            <div>
                                                                <Button 
                                                                    variant="light" 
                                                                    size="sm" 
                                                                    className="p-1 me-1 text-primary shadow-sm rounded-circle" 
                                                                    style={{ width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenChat(card); }}
                                                                    title="Abrir Chat"
                                                                >
                                                                    <i className="bi bi-chat-text-fill" style={{ fontSize: '0.8rem' }}></i>
                                                                </Button>
                                                                <i className="bi bi-whatsapp text-success" style={{ fontSize: '1rem' }}></i>
                                                            </div>

                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.8rem' }}><i className="bi bi-calendar3 me-2"></i>{formatDate(card.dueDate) || 'Sem prazo'}</span>
                                                            <div className="rounded-circle d-flex justify-content-center align-items-center text-white fw-bold" style={{ width: '20px', height: '20px', fontSize: '0.55rem', backgroundColor: '#0079bf' }}>{getInitials(card.assigneeName)}</div>
                                                        </div>
                                                        <div className="fw-bold mt-1" style={{ color: '#36b37e', fontSize: '0.9rem' }}>{formatCurrency(card.value || card.dealValue || 0)}</div>
                                                    </Card.Body>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" backdrop="static">
                <Modal.Header closeButton closeVariant="white" style={{ backgroundColor: '#0052cc', color: 'white', borderBottom: 'none' }}>
                    <Modal.Title className="fw-bold fs-5">
                        {editingCard?.title || 'Novo Atendimento'}
                        <div className="fw-normal" style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}><i className="bi bi-kanban me-1"></i> em <Badge bg="light" text="dark" className="ms-1">{columns.find(c => c.id === Number(editingCard?.columnId))?.name || 'Etapa'}</Badge></div>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-0">
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-3 pt-2 border-bottom shadow-sm" style={{ backgroundColor: '#f4f5f7' }}>
                        <Tab eventKey="detalhes" title={<span className="fw-bold" style={{ fontSize: '0.85rem' }}><i className="bi bi-info-circle me-2"></i>DETALHES</span>}>
                            <div className="p-4">
                                {editingCard && (
                                    <Form>

                                        <Form.Group className="mb-4 position-relative" ref={dropdownRef}>
                                            <Form.Label className="fw-bold text-muted small mb-1">
                                                <i className="bi bi-person-lines-fill me-1"></i> CONTATO (WHAZING)
                                            </Form.Label>
                                            <InputGroup className="shadow-sm">
                                                <InputGroup.Text className="bg-white border-end-0">
                                                    <i className="bi bi-search text-primary"></i>
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    className="border-start-0 ps-0"
                                                    placeholder="Buscar por nome ou número..."
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setShowContactDropdown(true);
                                                        if (e.target.value === '') {
                                                            setEditingCard({ ...editingCard, contactId: '', telefone: '', contactName: '' });
                                                        }
                                                    }}
                                                    onFocus={() => { if (searchTerm.length >= 2) setShowContactDropdown(true); }}
                                                />
                                                {searchTerm && (
                                                    <Button variant="outline-secondary" className="border-start-0 bg-white border" onClick={() => {
                                                        setSearchTerm('');
                                                        setSearchResults([]);
                                                        setEditingCard({ ...editingCard, contactId: '', telefone: '', contactName: '' });
                                                    }}>
                                                        <i className="bi bi-x fs-5 text-muted"></i>
                                                    </Button>
                                                )}
                                            </InputGroup>

                                            {showContactDropdown && (
                                                <ListGroup className="position-absolute w-100 shadow rounded mt-1 border" style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto' }}>
                                                    {isSearchingContacts ? (
                                                        <ListGroup.Item className="text-center py-3 text-muted bg-light">
                                                            <Spinner size="sm" className="me-2" /> Buscando no banco...
                                                        </ListGroup.Item>
                                                    ) : searchResults.length > 0 ? (
                                                        searchResults.map(contact => (
                                                            <ListGroup.Item
                                                                key={contact.id}
                                                                action
                                                                onClick={() => handleSelectContact(contact)}
                                                                className="d-flex align-items-center py-2 border-bottom"
                                                            >
                                                                <div className="rounded-circle bg-secondary d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px' }}>
                                                                    <i className="bi bi-person-fill fs-4 text-white"></i>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{contact.name || 'Sem Nome'}</div>
                                                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{contact.number}</div>
                                                                </div>
                                                            </ListGroup.Item>
                                                        ))
                                                    ) : searchTerm.length >= 3 ? (
                                                        <ListGroup.Item className="text-center py-3 text-muted bg-light">
                                                            Nenhum contato encontrado.
                                                        </ListGroup.Item>
                                                    ) : null}
                                                </ListGroup>
                                            )}
                                        </Form.Group>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-flag me-1"></i> PRIORIDADE</Form.Label>
                                                <Form.Select value={editingCard.priority || 'none'} onChange={(e) => setEditingCard({ ...editingCard, priority: e.target.value })}>
                                                    <option value="none">Nenhuma</option>
                                                    <option value="low">Baixa</option>
                                                    <option value="medium">Média</option>
                                                    <option value="high">Alta</option>
                                                    <option value="urgent">Urgente</option>
                                                </Form.Select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-person me-1"></i> RESPONSÁVEL</Form.Label>
                                                <Form.Select value={editingCard.assigneeId || ''} onChange={(e) => setEditingCard({ ...editingCard, assigneeId: e.target.value })}>
                                                    <option value="">Selecione...</option>
                                                    <option value="3">Rayan Chaves</option>
                                                </Form.Select>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-play-circle me-1"></i> DATA INÍCIO</Form.Label>
                                                <Form.Control type="date" value={editingCard.startDate ? editingCard.startDate.split('T')[0] : ''} onChange={(e) => setEditingCard({ ...editingCard, startDate: e.target.value })} disabled title="Não suportado pela API atualmente" />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-calendar me-1"></i> DATA LIMITE</Form.Label>
                                                <Form.Control type="date" value={editingCard.dueDate ? editingCard.dueDate.split('T')[0] : ''} onChange={(e) => setEditingCard({ ...editingCard, dueDate: e.target.value })} />
                                            </div>
                                        </div>

                                        {/* 🟢 SEÇÃO DE RÓTULOS (NO MODAL) */}
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-tags me-1"></i> RÓTULOS</Form.Label>
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                                
                                                {editingCard.labels?.map(lbl => (
                                                    <Badge 
                                                        key={lbl.id} 
                                                        style={{ backgroundColor: lbl.color || '#0079bf', cursor: 'pointer', padding: '6px 10px' }} 
                                                        onClick={() => handleToggleLabel(lbl)}
                                                        title="Clique para remover"
                                                    >
                                                        {lbl.name} <i className="bi bi-x fs-6 ms-1" style={{ verticalAlign: 'middle' }}></i>
                                                    </Badge>
                                                ))}
                                                
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="link" className="p-0 text-decoration-none fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                                        <i className="bi bi-plus fs-5" style={{ verticalAlign: 'middle' }}></i> ADICIONAR
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="shadow border-0" style={{ minWidth: '220px' }}>
                                                        <div className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Rótulos do Quadro</div>
                                                        {boardLabels.length === 0 && <Dropdown.Item disabled>Nenhum rótulo disponível</Dropdown.Item>}
                                                        {boardLabels.map(lbl => {
                                                            const isActive = editingCard.labels?.some(l => l.id === lbl.id);
                                                            return (
                                                                <Dropdown.Item key={lbl.id} onClick={() => handleToggleLabel(lbl)} className="d-flex align-items-center justify-content-between py-2">
                                                                    <div className="d-flex align-items-center">
                                                                        <span style={{ display: 'inline-block', width: '14px', height: '14px', backgroundColor: lbl.color || '#ccc', borderRadius: '4px', marginRight: '10px' }}></span>
                                                                        <span className="fw-medium text-dark">{lbl.name}</span>
                                                                    </div>
                                                                    {isActive && <i className="bi bi-check text-primary fs-5"></i>}
                                                                </Dropdown.Item>
                                                            );
                                                        })}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3 w-50">
                                            <Form.Label className="fw-bold text-muted small mb-1"><i className="bi bi-currency-dollar me-1"></i> VALOR DA NEGOCIAÇÃO</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>R$</InputGroup.Text>
                                                <Form.Control type="number" step="0.01" placeholder="0.00" value={editingCard.value || ''} onChange={(e) => setEditingCard({ ...editingCard, value: e.target.value })} readOnly={checklists.length > 0} style={{ backgroundColor: checklists.length > 0 ? '#e9ecef' : '#fff' }} />
                                            </InputGroup>
                                            {checklists.length > 0 && <Form.Text className="text-success fw-bold" style={{ fontSize: '0.75rem' }}><i className="bi bi-calculator me-1"></i> Valor somado automaticamente pelos produtos do checklist.</Form.Text>}
                                        </Form.Group>

                                        <Form.Group className="mb-3 border-top pt-3">
                                            <Form.Label className="fw-bold text-muted small mb-1">ALTERAR ETAPA ATUAL</Form.Label>
                                            <Form.Select value={editingCard.columnId} onChange={(e) => setEditingCard({ ...editingCard, columnId: e.target.value })}>
                                                {columns.map(col => <option key={col.id} value={col.id}>{col.name}</option>)}
                                            </Form.Select>
                                        </Form.Group>

                                        <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#e6fcff', border: '1px solid #b3e6ff' }}>
                                            <h6 className="fw-bold text-dark mb-2" style={{ color: '#0052cc' }}>
                                                <i className="bi bi-whatsapp text-success me-2"></i>Ações do WhatsApp
                                            </h6>
                                            <p className="text-muted small mb-3">Dispare o Orçamento para o cliente preenchido acima.</p>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={handleSendQuote}
                                                disabled={!editingCard.telefone || saving}
                                                className="fw-bold px-3 shadow-sm"
                                            >
                                                {saving ? <Spinner size="sm" /> : <><i className="bi bi-send me-2"></i> Enviar Orçamento</>}
                                            </Button>
                                            {!editingCard.telefone && (
                                                <div className="text-danger small mt-2 fw-bold"><i className="bi bi-exclamation-triangle me-1"></i>Selecione o contato acima para habilitar!</div>
                                            )}
                                        </div>

                                    </Form>
                                )}
                            </div>
                        </Tab>

                        <Tab eventKey="checklist" title={<span className="fw-bold" style={{ fontSize: '0.85rem' }}><i className="bi bi-check2-square me-2"></i>PRODUTOS (CHECKLIST)</span>}>
                            <div className="p-4">
                                <InputGroup className="mb-4 shadow-sm">
                                    <Form.Select value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)}>
                                        <option value="">Selecione um Produto do Sistema...</option>
                                        {produtosLista.map(produto => <option key={produto.id_produto} value={produto.nome}>{produto.nome} — {formatCurrency(produto.preco)}</option>)}
                                    </Form.Select>
                                    <Button variant="primary" onClick={handleAddChecklist} disabled={!newChecklistTitle}><i className="bi bi-plus-lg"></i> Adicionar</Button>
                                </InputGroup>

                                {loadingChecklists ? <div className="text-center p-3"><Spinner animation="border" variant="primary" /></div> : (
                                    <ListGroup variant="flush">
                                        {checklists.map(item => {
                                            const itemName = item.text || item.title || "";
                                            const produtoOriginal = produtosLista.find(p => p.nome === itemName);
                                            return (
                                                <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center px-2 py-3 border-bottom">
                                                    <Form.Check type="checkbox" id={`check-${item.id}`} label={<div className="d-flex align-items-center ms-2"><span style={{ textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? '#adb5bd' : '#172b4d', fontWeight: '500' }}>{itemName}</span>{produtoOriginal && produtoOriginal.preco && <Badge bg="success" className="ms-2 fw-normal">{formatCurrency(produtoOriginal.preco)}</Badge>}</div>} checked={item.isCompleted} onChange={() => handleToggleChecklist(item)} />
                                                    <Button variant="light" size="sm" className="text-danger border-0" onClick={() => handleDeleteChecklist(item.id)}><i className="bi bi-trash"></i></Button>
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>
                                )}
                            </div>
                        </Tab>

                        <Tab eventKey="comentarios" title={<span className="fw-bold" style={{ fontSize: '0.85rem' }}><i className="bi bi-chat-left-text me-2"></i>COMENTÁRIOS</span>}>
                            <div className="p-4">
                                <Form.Group className="mb-4">
                                    <Form.Control as="textarea" rows={3} placeholder="Escreva um comentário ou histórico de atendimento..." value={editingCard?.note || ''} onChange={(e) => setEditingCard({ ...editingCard, note: e.target.value })} className="shadow-sm" />
                                </Form.Group>
                                <div className="text-end">
                                    <Button variant="primary" size="sm" onClick={handleSaveCard}>Salvar Comentário</Button>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </Modal.Body>

                <Modal.Footer className="bg-light d-flex justify-content-between">
                    <Button variant="outline-danger" onClick={handleArchiveCard} disabled={saving} className="fw-bold" style={{ fontSize: '0.85rem' }}><i className="bi bi-archive me-2"></i>Arquivar Card</Button>
                    <div>
                        <Button variant="link" className="text-muted text-decoration-none fw-bold me-3" style={{ fontSize: '0.85rem' }} onClick={() => setShowEditModal(false)} disabled={saving}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveCard} disabled={saving} className="fw-bold px-4" style={{ fontSize: '0.85rem', backgroundColor: '#0052cc', borderColor: '#0052cc' }}>{saving ? <Spinner size="sm" /> : 'Salvar Alterações'}</Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default KanbanPage;