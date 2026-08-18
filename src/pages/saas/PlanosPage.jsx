import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Form, Modal, InputGroup } from 'react-bootstrap';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const PlanosPage = () => {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Controle do Modal
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        nome: '',
        preco_mensal: '',
        dias_teste: 7, 
        limite_produtos: 100,
        limite_usuarios: 1,
        limite_lojas: 1, // 🟢 ADICIONADO AQUI
        destaque: false,
        ativo: true,
        descricao: ''
    });

    // 🚀 1. BUSCAR PLANOS
    const fetchPlanos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tenants/saas/planos');
            setPlanos(data);
        } catch (error) {
            console.error("Erro ao buscar planos:", error);
            // Fallback com o novo limite
            setPlanos([
                { id: 1, nome: 'TRIAL', preco_mensal: 0, dias_teste: 7, limite_produtos: 50, limite_usuarios: 1, limite_lojas: 1, destaque: false, ativo: true, descricao: 'Para conhecer a plataforma' },
                { id: 2, nome: 'BASICO', preco_mensal: 49.90, dias_teste: 0, limite_produtos: 500, limite_usuarios: 3, limite_lojas: 1, destaque: false, ativo: true, descricao: 'Ideal para quem está começando' },
                { id: 3, nome: 'PRO', preco_mensal: 89.90, dias_teste: 0, limite_produtos: 9999, limite_usuarios: 10, limite_lojas: 3, destaque: true, ativo: true, descricao: 'Para lojas consolidadas' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanos();
    }, []);

    // 🚀 2. ABRIR MODAL (Para Criar ou Editar)
    const handleOpenModal = (plano = null) => {
        if (plano) {
            setEditingId(plano.id);
            setFormData({
                nome: plano.nome,
                preco_mensal: plano.preco_mensal,
                dias_teste: plano.dias_teste,
                limite_produtos: plano.limite_produtos,
                limite_usuarios: plano.limite_usuarios,
                limite_lojas: plano.limite_lojas || 1, // 🟢 MAPEADO AQUI
                destaque: plano.destaque,
                ativo: plano.ativo,
                descricao: plano.descricao || ''
            });
        } else {
            setEditingId(null);
            setFormData({ nome: '', preco_mensal: '', dias_teste: 7, limite_produtos: 100, limite_usuarios: 1, limite_lojas: 1, destaque: false, ativo: true, descricao: '' });
        }
        setShowModal(true);
    };

    // 🚀 3. SALVAR PLANO (Criar ou Atualizar)
    const handleSavePlano = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/tenants/saas/planos/${editingId}`, formData);
                toast.success('Plano atualizado com sucesso!');
            } else {
                await api.post('/tenants/saas/planos', formData);
                toast.success('Novo plano criado!');
            }
            setShowModal(false);
            fetchPlanos();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar o plano.');
        } finally {
            setSaving(false);
        }
    };

    // 🚀 4. DELETAR PLANO
    const handleDeletePlano = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja apagar o plano "${nome}"? Lojas que usam este plano podem ser afetadas.`)) {
            try {
                await api.delete(`/tenants/saas/planos/${id}`);
                toast.success('Plano removido com sucesso!');
                fetchPlanos();
            } catch (error) {
                toast.error('Erro ao remover plano.');
            }
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Gerenciar Planos</h4>
                    <p className="text-muted mb-0">Crie regras, defina preços e configure os limites do seu SaaS.</p>
                </div>
                <Button variant="primary" className="fw-bold shadow-sm rounded-pill px-4" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-lg me-2"></i> Criar Novo Plano
                </Button>
            </div>

            <Row className="g-4">
                {planos.map((plano) => (
                    <Col md={6} lg={4} key={plano.id}>
                        <Card className={`h-100 border-0 shadow-sm rounded-4 position-relative ${plano.destaque ? 'border-primary border-2' : ''}`} style={plano.destaque ? { borderStyle: 'solid' } : {}}>
                            
                            {plano.destaque && (
                                <div className="position-absolute top-0 start-50 translate-middle badge bg-primary rounded-pill px-3 py-2 text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>
                                    Mais Popular
                                </div>
                            )}

                            <Card.Body className="p-4 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h5 className="fw-bold text-dark text-uppercase mb-0">{plano.nome}</h5>
                                    <Badge bg={plano.ativo ? 'success' : 'secondary'} className="rounded-pill">
                                        {plano.ativo ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>

                                <div className="mb-4">
                                    <span className="fs-6 text-muted fw-bold align-top">R$</span>
                                    <span className="display-5 fw-bold text-dark">{Number(plano.preco_mensal).toFixed(2).replace('.', ',')}</span>
                                    <span className="text-muted small">/mês</span>
                                </div>

                                <div className="bg-light p-3 rounded-3 mb-4 flex-grow-1">
                                    <ul className="list-unstyled mb-0 small text-muted d-flex flex-column gap-2">
                                        <li>
                                            <i className="bi bi-clock-history text-primary me-2"></i> 
                                            <strong>{plano.dias_teste}</strong> Dias de Teste Grátis
                                        </li>
                                        <li>
                                            <i className="bi bi-box-seam text-primary me-2"></i> 
                                            Limite de <strong>{plano.limite_produtos === 9999 ? 'Ilimitados' : plano.limite_produtos}</strong> Produtos
                                        </li>
                                        <li>
                                            <i className="bi bi-people text-primary me-2"></i> 
                                            Até <strong>{plano.limite_usuarios}</strong> Usuários (Staff)
                                        </li>
                                        {/* 🟢 ADICIONADO VISUAL DA LOJA NO CARD */}
                                        <li>
                                            <i className="bi bi-shop text-primary me-2"></i> 
                                            Até <strong>{plano.limite_lojas || 1}</strong> Loja(s) / Filiais
                                        </li>
                                        {plano.descricao && (
                                            <li className="mt-2 pt-2 border-top border-secondary border-opacity-25">
                                                <i className="bi bi-info-circle text-primary me-2"></i> 
                                                {plano.descricao}
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <div className="d-flex gap-2 mt-auto">
                                    <Button variant="outline-dark" className="flex-grow-1 rounded-pill fw-bold" onClick={() => handleOpenModal(plano)}>
                                        <i className="bi bi-pencil-square me-2"></i> Editar
                                    </Button>
                                    <Button variant="outline-danger" className="rounded-pill px-3" onClick={() => handleDeletePlano(plano.id, plano.nome)}>
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* MODAL CRIAR/EDITAR PLANO */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{editingId ? 'Editar Plano' : 'Criar Novo Plano'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleSavePlano}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Nome do Plano</Form.Label>
                                    <Form.Control required name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Básico, Pro, VIP" className="text-uppercase" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Valor Mensal (R$)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>R$</InputGroup.Text>
                                        <Form.Control required type="number" step="0.01" name="preco_mensal" value={formData.preco_mensal} onChange={handleChange} placeholder="0.00" />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* 🟢 AQUI FORAM DIVIDIDOS EM md={3} PARA CABER OS 4 CAMPOS */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Dias de Teste</Form.Label>
                                    <InputGroup>
                                        <Form.Control required type="number" name="dias_teste" value={formData.dias_teste} onChange={handleChange} min="0" />
                                        <InputGroup.Text>Dias</InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Limite de Produtos</Form.Label>
                                    <Form.Control required type="number" name="limite_produtos" value={formData.limite_produtos} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Limite Usuários</Form.Label>
                                    <Form.Control required type="number" name="limite_usuarios" value={formData.limite_usuarios} onChange={handleChange} min="1"/>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Limite de Lojas</Form.Label>
                                    <Form.Control required type="number" name="limite_lojas" value={formData.limite_lojas} onChange={handleChange} min="1"/>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Descrição Curta (Opcional)</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: O plano perfeito para lojas em crescimento." />
                                </Form.Group>
                            </Col>

                            <Col md={6} className="mt-4">
                                <Form.Check 
                                    type="switch"
                                    id="destaque-switch"
                                    name="destaque"
                                    label={<span className="fw-bold">Destacar este plano na vitrine?</span>}
                                    checked={formData.destaque}
                                    onChange={handleChange}
                                />
                            </Col>
                            <Col md={6} className="mt-4">
                                <Form.Check 
                                    type="switch"
                                    id="ativo-switch"
                                    name="ativo"
                                    label={<span className="fw-bold">Plano Ativo (Disponível para vendas)</span>}
                                    checked={formData.ativo}
                                    onChange={handleChange}
                                />
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <Button variant="light" onClick={() => setShowModal(false)} disabled={saving} className="rounded-pill px-4">Cancelar</Button>
                            <Button variant="dark" type="submit" disabled={saving} className="rounded-pill px-4 fw-bold shadow-sm">
                                {saving ? <Spinner size="sm" /> : 'Salvar Plano'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default PlanosPage;