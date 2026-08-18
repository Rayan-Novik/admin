import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

const IntegrationApiPage = () => {
    const [activeTab, setActiveTab] = useState('apikeys');

    // Estados: API Keys
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [isTestKey, setIsTestKey] = useState(false); 
    
    // 🚀 ATUALIZADO: Todos os grupos de permissões padronizados
    const [permissoes, setPermissoes] = useState({
        READ_PRODUTOS: true, WRITE_PRODUTOS: false, 
        READ_PEDIDOS: true, WRITE_PEDIDOS: false,
        READ_CLIENTES: true, WRITE_CLIENTES: false,
        READ_FINANCEIRO: false, WRITE_FINANCEIRO: false
    });

    // Estados: Webhook
    const [webhookUrl, setWebhookUrl] = useState('');
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);

    useEffect(() => {
        fetchApiKeys();
        fetchWebhookSettings();
    }, []);

    const fetchApiKeys = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/apikeys/public-keys');
            setApiKeys(data || []);
        } catch (error) {
            setApiKeys([]);
            console.log("Nenhuma chave encontrada ou acesso bloqueado.");
        } finally {
            setLoading(false);
        }
    };

    const fetchWebhookSettings = async () => {
        try {
            const { data } = await api.get('/apikeys/webhooks/settings');
            if (data && data.url) setWebhookUrl(data.url);
        } catch (error) {
            console.log("Webhook ainda não configurado.");
        }
    };

    const handleCreateKey = async (e) => {
        e.preventDefault();
        if (!newKeyName.trim()) return toast.warning("Dê um nome para a integração.");

        const permissoesSelecionadas = Object.keys(permissoes).filter(key => permissoes[key]);
        if (permissoesSelecionadas.length === 0) return toast.warning("Selecione pelo menos uma permissão.");

        setCreating(true);
        try {
            await api.post('/apikeys/public-keys', { 
                nome: newKeyName, 
                permissoes: permissoesSelecionadas,
                isTest: isTestKey 
            });
            toast.success("Chave gerada com sucesso!");
            setNewKeyName('');
            setIsTestKey(false);
            
            // 🚀 ATUALIZADO: Reseta o formulário com o novo padrão
            setPermissoes({ 
                READ_PRODUTOS: true, WRITE_PRODUTOS: false, 
                READ_PEDIDOS: true, WRITE_PEDIDOS: false,
                READ_CLIENTES: true, WRITE_CLIENTES: false,
                READ_FINANCEIRO: false, WRITE_FINANCEIRO: false
            });
            
            setShowModal(false);
            fetchApiKeys();
        } catch (error) {
            toast.error(error.response?.data?.error || "Erro ao gerar chave.");
        } finally {
            setCreating(false);
        }
    };

    const handleRevokeKey = async (id, nome) => {
        if (!window.confirm(`ATENÇÃO: Revogar a chave "${nome}" fará com que o sistema conectado pare de funcionar. Tem certeza?`)) return;
        try {
            await api.delete(`/apikeys/public-keys/${id}`);
            toast.success("Integração revogada!");
            fetchApiKeys();
        } catch (error) { toast.error("Erro ao revogar chave."); }
    };

    const handleCopy = (chave) => {
        navigator.clipboard.writeText(chave);
        toast.info("Chave copiada!", { autoClose: 2000 });
    };

    const handleSaveWebhook = async (e) => {
        e.preventDefault();
        if (!webhookUrl.trim()) return toast.warning("Informe uma URL válida.");

        setSavingWebhook(true);
        try {
            await api.post('/apikeys/webhooks/settings', { url: webhookUrl });
            toast.success("Webhook salvo com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar webhook.");
        } finally {
            setSavingWebhook(false);
        }
    };

    const handleTestWebhook = async () => {
        setTestingWebhook(true);
        try {
            await api.get('/apikeys/webhooks/testar');
            toast.success("Disparo de teste enviado!");
        } catch (error) {
            toast.error("Erro ao disparar teste.");
        } finally {
            setTestingWebhook(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const renderPermissoesBadges = (perms) => {
        let permArray = [];
        if (typeof perms === 'string') { try { permArray = JSON.parse(perms); } catch (e) { } } 
        else if (Array.isArray(perms)) { permArray = perms; }

        if (permArray.length === 0) return <span className="small text-muted fst-italic">Nenhuma Permissão</span>;

        // 🚀 ATUALIZADO: Labels legíveis para as novas chaves
        const labelMap = { 
            'READ_PRODUTOS': 'Ler Produtos', 'WRITE_PRODUTOS': 'Editar Produtos', 
            'READ_PEDIDOS': 'Ler Pedidos', 'WRITE_PEDIDOS': 'Editar Pedidos',
            'READ_CLIENTES': 'Ler Clientes', 'WRITE_CLIENTES': 'Editar Clientes',
            'READ_FINANCEIRO': 'Ler Financeiro', 'WRITE_FINANCEIRO': 'Editar Financeiro'
        };

        return permArray.map((p, index) => (
            <Badge key={index} bg="light" text="dark" className="border me-1 mb-1 fw-normal text-secondary" style={{ fontSize: '0.65rem' }}>{labelMap[p] || p}</Badge>
        ));
    };

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="dark" /></div>;

    return (
        <Container fluid className="p-3 p-md-4">
            <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border border-light mb-4">
                <Row className="align-items-center g-3">
                    <Col xs={12} md={8} className="d-flex align-items-center gap-3">
                        <div className="d-none d-sm-flex align-items-center justify-content-center bg-dark bg-opacity-10 rounded-circle flex-shrink-0" style={{ width: '56px', height: '56px' }}>
                            <i className="bi bi-braces-asterisk text-dark fs-4"></i>
                        </div>
                        <div>
                            <h4 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>API para Desenvolvedores</h4>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                Conecte seu ERP ou Agente de IA. Gere chaves de API e configure um Webhook para receber avisos em tempo real.
                            </p>
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="d-flex gap-2 mb-4 pb-3 border-bottom overflow-auto" style={{ whiteSpace: 'nowrap' }}>
                <Button variant={activeTab === 'apikeys' ? 'dark' : 'light'} className={`rounded-pill fw-bold px-4 ${activeTab !== 'apikeys' ? 'text-muted border' : 'shadow-sm'}`} onClick={() => setActiveTab('apikeys')}>
                    <i className="bi bi-key-fill me-2"></i> Chaves de API
                </Button>
                <Button variant={activeTab === 'webhooks' ? 'dark' : 'light'} className={`rounded-pill fw-bold px-4 ${activeTab !== 'webhooks' ? 'text-muted border' : 'shadow-sm'}`} onClick={() => setActiveTab('webhooks')}>
                    <i className="bi bi-globe2 me-2"></i> Configurar Webhook
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'apikeys' && (
                    <motion.div key="apikeys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold text-dark mb-0">Integrações Ativas</h5>
                            <Button variant="dark" onClick={() => setShowModal(true)} size="sm" className="rounded-pill px-3 fw-bold shadow-sm btn-hover-scale">
                                <i className="bi bi-plus-lg me-1"></i> Nova Chave
                            </Button>
                        </div>
                        
                        {apiKeys.length === 0 ? (
                            <div className="text-center p-5 border border-dashed rounded-4 bg-light text-muted mt-2">
                                <i className="bi bi-key fs-1 mb-3 d-block opacity-25"></i>
                                <h6 className="fw-bold text-dark">Nenhuma integração ativa</h6>
                                <p className="mb-0 small">Você ainda não gerou nenhuma chave de API.</p>
                            </div>
                        ) : (
                            <Row xs={1} md={2} xl={3} className="g-3 g-md-4">
                                {apiKeys.map((key) => {
                                    const isSandboxKey = key.chave.includes('test_');

                                    return (
                                    <Col key={key.id}>
                                        <Card className={`border-0 shadow-sm rounded-4 h-100 ${isSandboxKey ? 'border border-warning border-opacity-50 bg-warning bg-opacity-10' : ''}`}>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <Badge bg={key.ativo ? 'success' : 'secondary'} className="mb-2 bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 fw-medium me-2">
                                                            {key.ativo ? 'Ativo' : 'Inativo'}
                                                        </Badge>
                                                        {isSandboxKey && (
                                                            <Badge bg="warning" text="dark" className="mb-2 rounded-pill px-2 fw-bold shadow-sm">
                                                                <i className="bi bi-cone-striped me-1"></i> SANDBOX
                                                            </Badge>
                                                        )}
                                                        <h6 className="fw-bold text-dark mb-0">{key.nome}</h6>
                                                    </div>
                                                </div>

                                                <div className="bg-light border rounded-3 p-2 mb-3 d-flex align-items-center justify-content-between">
                                                    <span className="font-monospace text-muted small ms-2 user-select-all">{key.chave.substring(0, 16)}••••••••</span>
                                                    <Button variant="white" size="sm" className="border shadow-sm rounded-2 text-primary p-1 px-2" onClick={() => handleCopy(key.chave)}><i className="bi bi-clipboard"></i></Button>
                                                </div>

                                                <div className="mb-4">
                                                    <span className="d-block small text-muted mb-1" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>PERMISSÕES:</span>
                                                    <div className="d-flex flex-wrap gap-1">{renderPermissoesBadges(key.permissoes)}</div>
                                                </div>

                                                <div className="mt-auto pt-3 border-top border-opacity-25">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="small text-muted" style={{ fontSize: '0.7rem' }}>Criada em:</span>
                                                        <span className="small fw-medium text-dark" style={{ fontSize: '0.7rem' }}>{formatDate(key.criado_em)}</span>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                            <Card.Footer className="bg-transparent border-top-0 p-3 pt-0 d-flex gap-2">
                                                <Button variant="outline-danger" size="sm" className="w-100 fw-bold rounded-pill" onClick={() => handleRevokeKey(key.id, key.nome)}>Revogar Acesso</Button>
                                            </Card.Footer>
                                        </Card>
                                    </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </motion.div>
                )}

                {activeTab === 'webhooks' && (
                    <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Card className="border-0 shadow-sm rounded-4 mb-5">
                            <Card.Body className="p-4 p-md-5">
                                <Row>
                                    <Col lg={5} className="mb-4 mb-lg-0 pe-lg-5">
                                        <h6 className="fw-bold text-dark">Webhook: Pedido Pago</h6>
                                        <p className="text-muted small mb-4">
                                            Quer que o seu ERP saiba instantaneamente quando um pedido for aprovado? Cadastre a URL do seu sistema aqui.
                                        </p>
                                        <Alert variant="info" className="bg-opacity-10 border-0 rounded-3 small">
                                            <i className="bi bi-info-circle-fill me-2"></i>
                                            Nós enviaremos um POST em formato JSON contendo todos os dados do cliente e produtos comprados sempre que houver um pagamento aprovado.
                                        </Alert>
                                    </Col>
                                    
                                    <Col lg={7}>
                                        <Form onSubmit={handleSaveWebhook}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="small fw-bold text-muted">URL DE DESTINO DO SEU ERP (ENDPOINT)</Form.Label>
                                                <Form.Control 
                                                    type="url" 
                                                    placeholder="https://seu-erp.com.br/api/callback/ararinha" 
                                                    value={webhookUrl}
                                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                                    className="bg-light py-2 border-0 shadow-sm"
                                                    required 
                                                />
                                            </Form.Group>

                                            <div className="d-flex flex-column flex-sm-row gap-2">
                                                <Button variant="primary" type="submit" className="fw-bold px-4 py-2 rounded-3 shadow-sm d-flex justify-content-center align-items-center" disabled={savingWebhook}>
                                                    {savingWebhook ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="bi bi-save me-2"></i>}
                                                    Salvar URL do Webhook
                                                </Button>
                                                
                                                <Button variant="outline-secondary" onClick={handleTestWebhook} className="fw-bold px-4 py-2 rounded-3 d-flex justify-content-center align-items-center bg-white border-2" disabled={testingWebhook}>
                                                    {testingWebhook ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="bi bi-play-circle me-2"></i>}
                                                    Disparar Teste
                                                </Button>
                                            </div>
                                        </Form>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg">
                <Form onSubmit={handleCreateKey}>
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fw-bold h5">Nova Integração de API</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <p className="text-muted small mb-4">Dê um nome para a integração e defina quais dados esse sistema poderá acessar.</p>
                        
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">NOME DA INTEGRAÇÃO</Form.Label>
                            <Form.Control type="text" placeholder="Ex: Agente de IA n8n" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="bg-light border-0 py-2" autoFocus required />
                        </Form.Group>

                        <div className={`p-3 rounded-4 mb-4 border ${isTestKey ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light border-light'}`} style={{ transition: '0.3s' }}>
                            <Form.Check 
                                type="switch" 
                                id="sandbox-switch" 
                                label={
                                    <div>
                                        <strong className="d-block text-dark">Gerar como Chave de Teste (Sandbox)</strong>
                                        <span className="small text-muted" style={{ fontSize: '0.8rem' }}>Ações feitas com essa chave não vão alterar o seu estoque real e serão marcadas como testes.</span>
                                    </div>
                                } 
                                checked={isTestKey} 
                                onChange={(e) => setIsTestKey(e.target.checked)} 
                            />
                        </div>

                        <Form.Label className="small fw-bold text-muted">PERMISSÕES (SCOPES)</Form.Label>
                        <div className="bg-light p-3 rounded-4 border-0">
                            {/* 🚀 ATUALIZADO: Grid de 4 Grupos (2x2) com os IDs e chaves corretos */}
                            <Row className="g-3">
                                <Col md={6}>
                                    <h6 className="fw-bold text-dark small mb-3 border-b pb-2"><i className="bi bi-box-seam me-2"></i>Catálogo</h6>
                                    <Form.Check type="switch" id="read_produtos" label={<span className="small">Visualizar produtos e estoque</span>} checked={permissoes.READ_PRODUTOS} onChange={(e) => setPermissoes({...permissoes, READ_PRODUTOS: e.target.checked})} className="mb-2" />
                                    <Form.Check type="switch" id="write_produtos" label={<span className="small">Criar/Atualizar produtos</span>} checked={permissoes.WRITE_PRODUTOS} onChange={(e) => setPermissoes({...permissoes, WRITE_PRODUTOS: e.target.checked})} />
                                </Col>
                                
                                <Col md={6}>
                                    <h6 className="fw-bold text-dark small mb-3 border-b pb-2"><i className="bi bi-cart3 me-2"></i>Pedidos</h6>
                                    <Form.Check type="switch" id="read_pedidos" label={<span className="small">Visualizar lista de vendas</span>} checked={permissoes.READ_PEDIDOS} onChange={(e) => setPermissoes({...permissoes, READ_PEDIDOS: e.target.checked})} className="mb-2" />
                                    <Form.Check type="switch" id="write_pedidos" label={<span className="small">Gerar novos pedidos</span>} checked={permissoes.WRITE_PEDIDOS} onChange={(e) => setPermissoes({...permissoes, WRITE_PEDIDOS: e.target.checked})} />
                                </Col>
                                
                                <Col md={6}>
                                    <h6 className="fw-bold text-dark small mb-3 border-b pb-2"><i className="bi bi-people me-2"></i>Clientes</h6>
                                    <Form.Check type="switch" id="read_clientes" label={<span className="small">Buscar dados de clientes</span>} checked={permissoes.READ_CLIENTES} onChange={(e) => setPermissoes({...permissoes, READ_CLIENTES: e.target.checked})} className="mb-2" />
                                    <Form.Check type="switch" id="write_clientes" label={<span className="small">Cadastrar novos clientes</span>} checked={permissoes.WRITE_CLIENTES} onChange={(e) => setPermissoes({...permissoes, WRITE_CLIENTES: e.target.checked})} />
                                </Col>

                                <Col md={6}>
                                    <h6 className="fw-bold text-dark small mb-3 border-b pb-2"><i className="bi bi-wallet2 me-2"></i>Financeiro</h6>
                                    <Form.Check type="switch" id="read_financeiro" label={<span className="small">Visualizar transações</span>} checked={permissoes.READ_FINANCEIRO} onChange={(e) => setPermissoes({...permissoes, READ_FINANCEIRO: e.target.checked})} className="mb-2" />
                                    <Form.Check type="switch" id="write_financeiro" label={<span className="small">Gerar movimentações</span>} checked={permissoes.WRITE_FINANCEIRO} onChange={(e) => setPermissoes({...permissoes, WRITE_FINANCEIRO: e.target.checked})} />
                                </Col>
                            </Row>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
                        <Button variant="light" onClick={() => setShowModal(false)} className="fw-medium">Cancelar</Button>
                        <Button variant={isTestKey ? "warning" : "dark"} type="submit" className="px-4 fw-bold shadow-sm rounded-pill" disabled={creating}>
                            {creating ? <Spinner size="sm" animation="border" /> : (isTestKey ? 'Gerar Chave de Teste' : 'Gerar Chave')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style>{`
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                .btn-hover-scale { transition: transform 0.2s; }
                .btn-hover-scale:hover:not(:disabled) { transform: scale(1.03); }
                .w-md-auto { width: auto !important; }
                @media (min-width: 768px) {
                    .w-md-auto { width: auto !important; }
                }
            `}</style>
        </Container>
    );
};

export default IntegrationApiPage;