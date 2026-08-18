import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, InputGroup, Spinner, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify'; // Opcional, se usar notificações

// 🟢 LISTA DE MODELOS PRÉ-CONFIGURADOS
const modelosProntos = [
    {
        id: 'pix',
        nome: '💳 PIX',
        atalho: 'pix',
        mensagem: 'Olá! Para finalizar o seu pedido, o pagamento pode ser feito via PIX.\n\n🔑 *Chave PIX:* [SUA CHAVE AQUI]\n👤 *Titular:* [SEU NOME DA LOJA]\n\nAssim que realizar o pagamento, por favor, me envie o comprovante aqui mesmo para eu confirmar e liberar o seu pedido! ✅'
    },
    {
        id: 'cobranca',
        nome: '⏳ Cobrança',
        atalho: 'cobranca',
        mensagem: 'Oi! Tudo bem?\n\nEstou passando rapidinho para lembrar que o seu pedido ainda está aguardando pagamento.\n\nSe precisar de ajuda com a forma de pagamento ou tiver alguma dúvida, é só me chamar aqui! Vamos garantir que seu pedido chegue logo. 📦'
    },
    {
        id: 'endereco',
        nome: '📍 Endereço',
        atalho: 'endereco',
        mensagem: 'Nossa loja física está de portas abertas para te receber! 🏪\n\n📍 *Endereço:* [SEU ENDEREÇO AQUI]\n🕒 *Horário de Funcionamento:* Segunda a Sexta, das 08h às 18h.\n\nVenha nos fazer uma visita!'
    },
    {
        id: 'catalogo',
        nome: '🛍️ Catálogo',
        atalho: 'catalogo',
        mensagem: 'Que legal que você tem interesse nos nossos produtos! 😍\n\nVocê pode conferir todo o nosso catálogo atualizado com fotos e preços diretamente neste link:\n🔗 [SEU LINK AQUI]\n\nSe gostar de algo, é só me mandar o print ou o link aqui que eu separo para você!'
    }
];

const RespostasRapidasPage = () => {
    const [respostas, setRespostas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Estados para o formulário
    const [editId, setEditingId] = useState(null);
    const [atalho, setAtalho] = useState('');
    const [mensagem, setMensagem] = useState('');

    const fetchRespostas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/whatsapp/respostas-rapidas');
            setRespostas(data);
        } catch (error) {
            console.error("Erro ao carregar respostas:", error);
            toast.error("Erro ao carregar lista de respostas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRespostas();
    }, []);

    const handleOpenModal = (res = null) => {
        if (res) {
            setEditingId(res.id);
            setAtalho(res.atalho);
            setMensagem(res.mensagem);
        } else {
            setEditingId(null);
            setAtalho('');
            setMensagem('');
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const payload = { atalho, mensagem };

        try {
            if (editId) {
                await api.put(`/whatsapp/respostas-rapidas/${editId}`, payload);
                toast.success("Resposta atualizada!");
            } else {
                await api.post('/whatsapp/respostas-rapidas', payload);
                toast.success("Resposta criada com sucesso!");
            }
            setShowModal(false);
            fetchRespostas();
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta resposta rápida?")) return;

        try {
            await api.delete(`/whatsapp/respostas-rapidas/${id}`);
            toast.success("Excluída com sucesso.");
            fetchRespostas();
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    };

    return (
        <Container fluid className="py-4" style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">⚡ Respostas Rápidas</h3>
                    <p className="text-muted small">Configure mensagens que podem ser enviadas usando o comando "/" no chat.</p>
                </div>
                <Button variant="primary" onClick={() => handleOpenModal()} className="shadow-sm rounded-pill px-4">
                    <i className="bi bi-plus-lg me-2"></i> Nova Resposta
                </Button>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center p-5 text-muted">
                            <Spinner animation="border" variant="primary" className="mb-3" />
                            <p>Carregando suas respostas...</p>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0 align-middle" style={{ color: 'var(--text-primary)' }}>
                            <thead className="bg-light" style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <tr>
                                    <th className="px-4 py-3">Atalho</th>
                                    <th className="py-3">Mensagem Completa</th>
                                    <th className="py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {respostas.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center p-5 text-muted">
                                            Nenhuma resposta configurada. Clique em "Nova Resposta" para começar.
                                        </td>
                                    </tr>
                                ) : (
                                    respostas.map((res) => (
                                        <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td className="px-4 fw-bold text-primary">
                                                <Badge bg="info" className="bg-opacity-10 text-primary border border-info px-2">/{res.atalho}</Badge>
                                            </td>
                                            <td className="text-truncate" style={{ maxWidth: '400px' }}>
                                                {res.mensagem}
                                            </td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="link" 
                                                    className="text-primary me-2 shadow-none" 
                                                    onClick={() => handleOpenModal(res)}
                                                    title="Editar"
                                                >
                                                    <i className="bi bi-pencil-square fs-5"></i>
                                                </Button>
                                                <Button 
                                                    variant="link" 
                                                    className="text-danger shadow-none" 
                                                    onClick={() => handleDelete(res.id)}
                                                    title="Excluir"
                                                >
                                                    <i className="bi bi-trash3 fs-5"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal de Criação/Edição */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-sidebar)', borderBottomColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <Modal.Title className="fs-5 fw-bold">
                        {editId ? '📝 Editar Resposta' : '✨ Nova Resposta Rápida'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                        
                        {/* 🟢 SEÇÃO DE MODELOS PRÉ-CONFIGURADOS (Aparece apenas ao criar uma nova) */}
                        {!editId && (
                            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px dashed var(--border-color)' }}>
                                <Form.Label className="small fw-bold text-muted mb-2">Carregar um modelo pronto:</Form.Label>
                                <div className="d-flex flex-wrap gap-2">
                                    {modelosProntos.map((modelo) => (
                                        <Button 
                                            key={modelo.id} 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="rounded-pill fw-bold shadow-none"
                                            onClick={() => {
                                                setAtalho(modelo.atalho);
                                                setMensagem(modelo.mensagem);
                                            }}
                                        >
                                            {modelo.nome}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Atalho (o comando que você vai digitar)</Form.Label>
                            <InputGroup className="shadow-sm rounded">
                                <InputGroup.Text className="bg-secondary text-white border-0">/</InputGroup.Text>
                                <Form.Control 
                                    type="text" 
                                    placeholder="ex: bomdia" 
                                    value={atalho}
                                    onChange={(e) => setAtalho(e.target.value.replace(/\s+/g, '').toLowerCase())} // Proteção básica para não dar espaço no atalho
                                    required
                                    className="border-0"
                                />
                            </InputGroup>
                            <Form.Text className="text-muted small">Não precisa incluir a barra. Apenas o nome do comando.</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Mensagem de Resposta</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={7} 
                                placeholder="O texto que será inserido automaticamente no chat..." 
                                value={mensagem}
                                onChange={(e) => setMensagem(e.target.value)}
                                required
                                className="shadow-sm border-0"
                                style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer style={{ backgroundColor: 'var(--bg-sidebar)', borderTopColor: 'var(--border-color)' }}>
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-pill px-3">Cancelar</Button>
                        <Button variant="primary" type="submit" className="rounded-pill px-4">Salvar Resposta</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style>{`
                .table-hover tbody tr:hover {
                    background-color: rgba(0, 0, 0, 0.02) !important;
                }
                .text-truncate {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </Container>
    );
};

export default RespostasRapidasPage;