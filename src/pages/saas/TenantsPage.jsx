import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Form, InputGroup, Modal } from 'react-bootstrap';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

const TenantsPage = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Lista de Planos Dinâmica
    const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
    const [loadingPlanos, setLoadingPlanos] = useState(false);
    
    // Modal de Cadastro
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        razao_social: '',
        documento: '',
        email: '',
        telefone_contato: '',
        senha: '',
        plano: '' 
    });

    // 🚀 1. BUSCAR TODAS AS EMPRESAS 
    const fetchTenants = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tenants/saas');
            setTenants(data);
        } catch (error) {
            console.error("Erro ao buscar empresas:", error);
            toast.error("Erro ao carregar a lista de empresas.");
        } finally {
            setLoading(false);
        }
    };

    // 🚀 BUSCAR OS PLANOS PARA O SELECT
    const fetchPlanos = async () => {
        setLoadingPlanos(true);
        try {
            const { data } = await api.get('/tenants/planos-publicos');
            const planosAtivos = data.filter(p => p.ativo);
            setPlanosDisponiveis(planosAtivos);
            
            if (planosAtivos.length > 0) {
                setFormData(prev => ({ ...prev, plano: planosAtivos[0].nome }));
            }
        } catch (error) {
            console.error("Erro ao buscar planos disponíveis", error);
        } finally {
            setLoadingPlanos(false);
        }
    };

    useEffect(() => {
        fetchTenants();
        fetchPlanos();
    }, []);

    // 🚀 2. FILTRAR EMPRESAS NA BUSCA
    const filteredTenants = tenants.filter(t => 
        t.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.documento?.includes(searchTerm) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 🚀 3. CRIAR NOVA EMPRESA MANUAMENTE
    const handleSaveTenant = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/tenants/register', formData);
            toast.success('Empresa criada com sucesso!');
            setShowModal(false);
            setFormData({ 
                nome_fantasia: '', razao_social: '', documento: '', email: '', 
                telefone_contato: '', senha: '', 
                plano: planosDisponiveis.length > 0 ? planosDisponiveis[0].nome : '' 
            });
            fetchTenants(); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao criar empresa.');
        } finally {
            setSaving(false);
        }
    };

    // 🚀 4. BLOQUEAR / DELETAR EMPRESA
    const handleDeleteTenant = async (id, nome) => {
        if (window.confirm(`⚠️ TEM CERTEZA que deseja APAGAR a empresa "${nome}"? Isso apagará todos os produtos e pedidos dela!`)) {
            try {
                await api.delete(`/tenants/saas/${id}`);
                toast.success('Empresa removida com sucesso!');
                fetchTenants();
            } catch (error) {
                toast.error('Erro ao remover empresa. Verifique se existem produtos vinculados a ela.');
            }
        }
    };

    // 🟢 5. RENOVAÇÃO MANUAL DE ASSINATURA
    const handleRenovarAssinatura = async (id, nome) => {
        if (window.confirm(`Deseja registrar o pagamento e RENOVAR a assinatura da loja "${nome}" por +30 dias?`)) {
            try {
                await api.post(`/tenants/saas/${id}/renovar`, { dias: 30 });
                toast.success(`Assinatura de ${nome} renovada com sucesso!`);
                fetchTenants(); // Recarrega a tabela para atualizar a data de vencimento
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erro ao renovar a assinatura.');
            }
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Função utilitária para checar vencimento
    const isVencido = (dataVencimento) => {
        if (!dataVencimento) return false;
        return new Date(dataVencimento) < new Date();
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Gestão de Empresas (SaaS)</h4>
                    <p className="text-muted mb-0">Gerencie todos os clientes e assinaturas do seu sistema.</p>
                </div>
                <Button variant="primary" className="fw-bold shadow-sm rounded-pill px-4" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg me-2"></i> Nova Empresa
                </Button>
            </div>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <Card.Body className="p-4">
                    <Row className="mb-4">
                        <Col md={6} lg={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                                    className="bg-light border-start-0 shadow-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col className="d-flex justify-content-end align-items-center">
                            <Badge bg="primary" className="p-2 fs-6 rounded-3">
                                Total: {tenants.length} Lojas
                            </Badge>
                        </Col>
                    </Row>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-3">Carregando carteira de clientes...</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                                <thead className="bg-light text-muted small text-uppercase">
                                    <tr>
                                        <th className="py-3 px-3 rounded-start">Loja / Cliente</th>
                                        <th className="py-3">Contato</th>
                                        <th className="py-3">Plano</th>
                                        <th className="py-3">Status da Assinatura</th>
                                        <th className="py-3 text-end rounded-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTenants.length > 0 ? filteredTenants.map((tenant) => {
                                        const vencido = isVencido(tenant.data_vencimento);
                                        const statusColor = tenant.ativo !== false ? (vencido ? 'warning' : 'success') : 'danger';
                                        const statusText = tenant.ativo !== false ? (vencido ? 'Inadimplente' : 'Ativo') : 'Bloqueado';

                                        return (
                                            <tr key={tenant.id || tenant.id_tenant}>
                                                <td className="px-3 py-3">
                                                    <div className="fw-bold text-dark">{tenant.nome_fantasia}</div>
                                                    <div className="text-muted small">Doc: {tenant.documento}</div>
                                                    <div className="text-muted small" style={{ fontSize: '0.7rem' }}>ID: {tenant.id || tenant.id_tenant}</div>
                                                </td>
                                                <td>
                                                    <div className="text-dark small"><i className="bi bi-envelope me-1 text-muted"></i>{tenant.email}</div>
                                                    <div className="text-dark small mt-1"><i className="bi bi-whatsapp me-1 text-muted"></i>{tenant.telefone_contato || 'N/A'}</div>
                                                </td>
                                                <td>
                                                    <Badge bg="dark" className="rounded-pill px-3 py-1 fw-normal text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                                        {tenant.plano || 'TRIAL'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={statusColor} className="rounded-pill px-3 py-1 fw-normal mb-1">
                                                        {statusText}
                                                    </Badge>
                                                    <div className={`small ${vencido ? 'text-danger fw-bold' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                                                        Vence: {tenant.data_vencimento ? new Date(tenant.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    {/* 🟢 Botão de Renovação Manual */}
                                                    <Button 
                                                        variant="light" 
                                                        size="sm" 
                                                        className="me-2 text-success"
                                                        title="Renovar Assinatura (+30 dias)"
                                                        disabled={(tenant.id || tenant.id_tenant) === 1}
                                                        onClick={() => handleRenovarAssinatura((tenant.id || tenant.id_tenant), tenant.nome_fantasia)}
                                                    >
                                                        <i className="bi bi-calendar-check-fill"></i>
                                                    </Button>

                                                    <Button 
                                                        variant="light" 
                                                        size="sm" 
                                                        className="me-2 text-primary"
                                                        title="Acessar Painel"
                                                        onClick={() => window.open(`/?store=${tenant.slug}`, '_blank')}
                                                    >
                                                        <i className="bi bi-box-arrow-up-right"></i>
                                                    </Button>
                                                    
                                                    <Button 
                                                        variant="light" 
                                                        size="sm" 
                                                        className="text-danger"
                                                        disabled={(tenant.id || tenant.id_tenant) === 1}
                                                        onClick={() => handleDeleteTenant((tenant.id || tenant.id_tenant), tenant.nome_fantasia)}
                                                        title={(tenant.id || tenant.id_tenant) === 1 ? "Você não pode deletar a loja principal" : "Remover Loja"}
                                                    >
                                                        <i className="bi bi-trash3-fill"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-muted">
                                                <i className="bi bi-buildings fs-1 d-block mb-3 text-light"></i>
                                                Nenhuma empresa encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* MODAL DE NOVA EMPRESA */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Cadastrar Nova Loja</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleSaveTenant}>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Nome Fantasia da Loja</Form.Label>
                                    <Form.Control required name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} placeholder="Ex: Ararinha Modas" />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Razão Social / Titular</Form.Label>
                                    <Form.Control required name="razao_social" value={formData.razao_social} onChange={handleChange} placeholder="Ex: Ararinha Modas LTDA" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">CPF ou CNPJ</Form.Label>
                                    <Form.Control required name="documento" value={formData.documento} onChange={handleChange} placeholder="Apenas números" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">WhatsApp</Form.Label>
                                    <Form.Control required name="telefone_contato" value={formData.telefone_contato} onChange={handleChange} placeholder="(00) 00000-0000" />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">E-mail de Acesso (Login)</Form.Label>
                                    <Form.Control required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="admin@loja.com" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Senha Inicial</Form.Label>
                                    <Form.Control required type="password" name="senha" value={formData.senha} onChange={handleChange} minLength={6} placeholder="Mínimo 6 chars" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Plano</Form.Label>
                                    {loadingPlanos ? (
                                        <div className="d-flex align-items-center mt-2">
                                            <Spinner animation="border" size="sm" variant="primary" />
                                            <span className="ms-2 small text-muted">Carregando...</span>
                                        </div>
                                    ) : (
                                        <Form.Select name="plano" value={formData.plano} onChange={handleChange}>
                                            {planosDisponiveis.map(plano => (
                                                <option key={plano.id} value={plano.nome}>{plano.nome}</option>
                                            ))}
                                            {planosDisponiveis.length === 0 && (
                                                <option value="BASICO">Básico (Fallback)</option>
                                            )}
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                            <Button variant="light" onClick={() => setShowModal(false)} disabled={saving} className="rounded-pill px-4">Cancelar</Button>
                            <Button variant="primary" type="submit" disabled={saving || loadingPlanos} className="rounded-pill px-4 fw-bold shadow-sm">
                                {saving ? <Spinner size="sm" /> : 'Criar Conta da Loja'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default TenantsPage;