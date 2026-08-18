import React, { useState, useEffect } from 'react';
import { Form, Button, Dropdown, ListGroup, Card } from 'react-bootstrap';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import api from '../../../services/api';
import PaymentModal from './PaymentModule/PaymentModal';

const MessageInput = ({ 
    onSendMessage, 
    editingMsg, 
    onCancelEdit, 
    inputRef, 
    fileInputRef,
    jid
}) => {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileAccept, setFileAccept] = useState("*");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [respostas, setRespostas] = useState([]);
    const [showRespostas, setShowRespostas] = useState(false);
    const [filtroResposta, setFiltroResposta] = useState('');

    useEffect(() => {
        const carregarRespostas = async () => {
            try {
                const { data } = await api.get('/whatsapp/respostas-rapidas');
                setRespostas(data);
            } catch (error) {
                console.error("Erro ao carregar respostas rápidas:", error);
            }
        };
        carregarRespostas();
    }, []);

    useEffect(() => {
        if (editingMsg) setText(editingMsg.conteudo);
        else setText('');
    }, [editingMsg]);

    const onEmojiClick = (emojiData) => {
        setText((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleTextChange = (e) => {
        const valor = e.target.value;
        setText(valor);

        const palavras = valor.split(' ');
        const ultimaPalavra = palavras[palavras.length - 1];

        if (ultimaPalavra.startsWith('/')) {
            setShowRespostas(true);
            setFiltroResposta(ultimaPalavra.substring(1).toLowerCase());
        } else {
            setShowRespostas(false);
        }
    };

    const aplicarResposta = (mensagemCompleta) => {
        if (showRespostas) {
            const palavras = text.split(' ');
            palavras.pop(); 
            setText([...palavras, mensagemCompleta].join(' ').trim() + ' ');
        } else {
            setText(prev => prev.trim() === '' ? mensagemCompleta : prev + ' ' + mensagemCompleta);
        }
        setShowRespostas(false);
        inputRef.current?.focus();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            inputRef.current?.focus();
        }
    };

    const triggerFileSelect = (accept) => {
        setFileAccept(accept);
        setTimeout(() => fileInputRef.current.click(), 50);
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!text.trim() && !selectedFile) return;

        let finalMessage = text;

        if (!editingMsg && text.trim()) {
            const adminInfo = localStorage.getItem('adminInfo');
            if (adminInfo) {
                try {
                    const userData = JSON.parse(adminInfo);
                    const atendenteNome = userData.nome_completo || 'Atendente';
                    finalMessage = `*${atendenteNome}:*\n${text}`;
                } catch (err) {
                    console.error("Erro ao recuperar nome do atendente:", err);
                }
            }
        }

        onSendMessage(finalMessage, selectedFile);
        setText('');
        setSelectedFile(null);
        setShowEmojiPicker(false);
        setShowRespostas(false);
    };

    const respostasFiltradas = respostas.filter(r => 
        r.atalho.toLowerCase().includes(filtroResposta) || 
        r.mensagem.toLowerCase().includes(filtroResposta)
    );

    return (
        <div 
            className="p-3 border-top position-relative" 
            style={{ 
                backgroundColor: 'var(--bg-sidebar, #ffffff)', 
                borderColor: 'var(--border-color, #e2e8f0)',
                transition: 'all 0.2s ease',
                zIndex: 10
            }}
        >
            {/* CARDS DE ATALHO (BALÕES) SEMPRE VISÍVEIS */}
            {!showRespostas && respostas.length > 0 && (
                <div 
                    className="d-flex gap-2 overflow-auto no-scroll mb-2 pb-1" 
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {respostas.map((r) => (
                        <Card 
                            key={`quick-${r.id}`}
                            onClick={() => aplicarResposta(r.mensagem)}
                            className="flex-row align-items-center px-3 py-1 border shadow-sm btn-quick-reply"
                            style={{ 
                                cursor: 'pointer', 
                                borderRadius: '20px', 
                                backgroundColor: 'var(--bg-main)', 
                                borderColor: 'var(--border-color)',
                                minWidth: 'fit-content'
                            }}
                        >
                            <i className="bi bi-lightning-charge-fill text-warning me-2" style={{ fontSize: '0.8rem' }}></i>
                            <span style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                {r.atalho}
                            </span>
                        </Card>
                    ))}
                </div>
            )}

            {/* LISTA FLUTUANTE QUANDO DIGITA / */}
            {showRespostas && respostasFiltradas.length > 0 && (
                <div 
                    className="position-absolute shadow-lg rounded-3 border overflow-hidden" 
                    style={{ 
                        bottom: 'calc(100% - 5px)', 
                        left: '15px', 
                        right: '15px', 
                        marginBottom: '15px', 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-sidebar)',
                        borderColor: 'var(--border-color)',
                        zIndex: 1100,
                        animation: 'fadeInUp 0.2s ease-out'
                    }}
                >
                    <div className="p-2 border-bottom small fw-bold text-muted bg-light bg-opacity-10">
                        <i className="bi bi-search me-2"></i>Atalhos: /{filtroResposta}
                    </div>
                    <ListGroup variant="flush">
                        {respostasFiltradas.map((r) => (
                            <ListGroup.Item 
                                key={r.id} 
                                action 
                                onClick={() => aplicarResposta(r.mensagem)}
                                className="py-2 border-0 dropdown-item-custom"
                                style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                            >
                                <div className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--text-active, #2563eb)' }}>/{r.atalho}</div>
                                <div className="small text-muted text-truncate">{r.mensagem}</div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            )}

            {/* Seletor de Emoji */}
            {showEmojiPicker && (
                <div className="position-absolute" style={{ bottom: '80px', left: '20px', zIndex: 1000 }}>
                    <EmojiPicker 
                        onEmojiClick={onEmojiClick} 
                        theme={document.body.classList.contains('dark-mode') ? Theme.DARK : Theme.LIGHT} 
                        searchPlaceholder="Pesquisar emoji..."
                        width={300}
                        height={400}
                    />
                </div>
            )}

            {/* Preview Edição */}
            {editingMsg && (
                <div className="d-flex justify-content-between align-items-center p-2 rounded mb-2 border small shadow-sm" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', color: '#fbbf24', borderColor: 'var(--border-color)' }}>
                    <span><i className="bi bi-pencil-fill me-2"></i>Editando mensagem...</span>
                    <Button variant="link" className="p-0 text-danger shadow-none" onClick={onCancelEdit}><i className="bi bi-x-circle"></i></Button>
                </div>
            )}

            {/* PREVIEW ANEXO */}
            {selectedFile && (
                <div className="d-flex justify-content-between align-items-center p-2 rounded mb-2 border small shadow-sm" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', color: '#10b981', borderColor: 'var(--border-color)' }}>
                    <span className="text-truncate" style={{ color: 'var(--text-primary)' }}>
                        <i className="bi bi-file-earmark-check me-2" style={{ color: '#10b981' }}></i>{selectedFile.name}
                    </span>
                    <Button variant="link" className="p-0 text-danger shadow-none" onClick={() => setSelectedFile(null)}>
                        <i className="bi bi-trash"></i>
                    </Button>
                </div>
            )}

            <Form onSubmit={handleSubmit} className="d-flex align-items-center gap-2">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={fileAccept} onChange={handleFileChange} />
                
                <Button variant="link" className="p-0 border-0 shadow-none d-flex align-items-center" style={{ color: 'var(--text-secondary)' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <i className={`bi ${showEmojiPicker ? 'bi-emoji-smile-fill text-warning' : 'bi-emoji-smile'} fs-4`}></i>
                </Button>

                <Dropdown drop="up">
                    <Dropdown.Toggle variant="link" className="p-0 border-0 shadow-none hide-caret d-flex align-items-center" style={{ color: 'var(--text-secondary)' }} disabled={!!editingMsg}>
                        <i className="bi bi-paperclip fs-4"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow border-0 mb-2 p-2" style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
                        <Dropdown.Item className="rounded-2 py-2" style={{ color: 'var(--text-primary)' }} onClick={() => triggerFileSelect("image/*")}><i className="bi bi-image text-primary me-2"></i> Imagem</Dropdown.Item>
                        <Dropdown.Item className="rounded-2 py-2" style={{ color: 'var(--text-primary)' }} onClick={() => triggerFileSelect("video/*")}><i className="bi bi-camera-video text-danger me-2"></i> Vídeo</Dropdown.Item>
                        <Dropdown.Item className="rounded-2 py-2" style={{ color: 'var(--text-primary)' }} onClick={() => triggerFileSelect("audio/*")}><i className="bi bi-mic text-success me-2"></i> Áudio</Dropdown.Item>
                        <Dropdown.Item className="rounded-2 py-2" style={{ color: 'var(--text-primary)' }} onClick={() => triggerFileSelect(".pdf,.doc,.docx")}><i className="bi bi-file-earmark-text text-info me-2"></i> Documento</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Button 
                    variant="link" 
                    className="p-0 border-0 shadow-none d-flex align-items-center" 
                    style={{ color: 'var(--text-secondary)' }} 
                    onClick={() => setShowPaymentModal(true)}
                    title="Cobrar via WhatsApp"
                    disabled={!!editingMsg}
                >
                    <i className="bi bi-cash-coin fs-4 text-success"></i>
                </Button>

                <Form.Control
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    placeholder={selectedFile ? "Legenda..." : "Mensagem..."}
                    value={text}
                    onChange={handleTextChange}
                    className="border-0 shadow-none"
                    style={{ 
                        backgroundColor: 'var(--bg-main, #f1f5f9)', 
                        color: 'var(--text-primary, #0f172a)', 
                        borderRadius: '12px',
                        padding: '10px 16px',
                        fontSize: '14px'
                    }}
                />

                <Button 
                    type="submit" 
                    variant={editingMsg ? "warning" : "success"} 
                    className="rounded-circle shadow-sm d-flex align-items-center justify-content-center btn-send-fix" 
                    style={{ width: 42, height: 42, flexShrink: 0 }} 
                    disabled={!text.trim() && !selectedFile}
                >
                    <i className={`bi ${editingMsg ? "bi-check-lg" : "bi-send-fill"}`}></i>
                </Button>
            </Form>

            <PaymentModal 
                show={showPaymentModal} 
                onHide={() => setShowPaymentModal(false)} 
                jid={jid} 
            />

            <style>{`
                .no-scroll::-webkit-scrollbar { display: none; }
                .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                
                .btn-quick-reply:hover {
                    background-color: var(--bg-hover) !important;
                    transform: translateY(-1px);
                    transition: all 0.2s;
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dropdown-item-custom:hover {
                    background-color: var(--bg-hover, #f1f5f9) !important;
                }

                .btn-send-fix:disabled {
                    opacity: 0.5;
                    background-color: var(--text-secondary) !important;
                }
                .hide-caret::after { display: none !important; }
            `}</style>
        </div>
    );
};

export default MessageInput;