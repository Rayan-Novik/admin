import React, { useState, useEffect } from 'react';
import { Form, Modal, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

// 🟢 Nossos Componentes Universais Limpos
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { SquareButton } from '../../components/ui/buttons/SquareButton';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';

const IntegrationApiPage = () => {
    const [activeTab, setActiveTab] = useState('apikeys');

    // Estados: API Keys
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [isTestKey, setIsTestKey] = useState(false); 
    
    // Todos os grupos de permissões padronizados
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

        const labelMap = { 
            'READ_PRODUTOS': 'Ler Produtos', 'WRITE_PRODUTOS': 'Editar Produtos', 
            'READ_PEDIDOS': 'Ler Pedidos', 'WRITE_PEDIDOS': 'Editar Pedidos',
            'READ_CLIENTES': 'Ler Clientes', 'WRITE_CLIENTES': 'Editar Clientes',
            'READ_FINANCEIRO': 'Ler Financeiro', 'WRITE_FINANCEIRO': 'Editar Financeiro'
        };

        return permArray.map((p, index) => (
            <span key={index} className="badge bg-secondary bg-opacity-10 border border-secondary border-opacity-25 me-1 mb-1 fw-medium text-secondary" style={{ fontSize: '10px' }}>
                {labelMap[p] || p}
            </span>
        ));
    };

    if (loading) return <div className="text-center d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><Spinner animation="border" style={{ color: '#0A84FF' }} /></div>;

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem' }}>
            <div className="w-100 mx-auto pt-lg-4 pt-3 px-3 px-lg-4" style={{ maxWidth: '1200px' }}>
                
                {/* CABEÇALHO */}
                <div className="mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-none d-sm-flex align-items-center justify-content-center bg-dark bg-opacity-10 rounded-circle flex-shrink-0" style={{ width: '56px', height: '56px' }}>
                            <i className="bi bi-braces-asterisk text-dark fs-4"></i>
                        </div>
                        <div>
                            <h4 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>API para Desenvolvedores</h4>
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                Conecte seu ERP ou Agente de IA. Gere chaves de API e configure um Webhook para receber avisos em tempo real.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABS NATIVAS */}
                <div className="d-flex gap-2 mb-4 pb-3 border-bottom overflow-auto" style={{ whiteSpace: 'nowrap', borderColor: 'var(--border-color)' }}>
                    {activeTab === 'apikeys' ? (
                        <CtaButton onClick={() => setActiveTab('apikeys')} className="px-4">
                            <i className="bi bi-key-fill me-2"></i> Chaves de API
                        </CtaButton>
                    ) : (
                        <LightButton onClick={() => setActiveTab('apikeys')} className="px-4">
                            <i className="bi bi-key-fill me-2"></i> Chaves de API
                        </LightButton>
                    )}
                    
                    {activeTab === 'webhooks' ? (
                        <CtaButton onClick={() => setActiveTab('webhooks')} className="px-4">
                            <i className="bi bi-globe2 me-2"></i> Configurar Webhook
                        </CtaButton>
                    ) : (
                        <LightButton onClick={() => setActiveTab('webhooks')} className="px-4">
                            <i className="bi bi-globe2 me-2"></i> Configurar Webhook
                        </LightButton>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {/* TAB: CHAVES DE API */}
                    {activeTab === 'apikeys' && (
                        <motion.div key="apikeys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold text-dark mb-0">Integrações Ativas</h5>
                                <CtaButton onClick={() => setShowModal(true)} className="px-4">
                                    <i className="bi bi-plus-lg me-1"></i> Nova Chave
                                </CtaButton>
                            </div>
                            
                            {apiKeys.length === 0 ? (
                                <div className="text-center p-5 rounded-4 text-secondary mt-2" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '2px dashed rgba(100, 116, 139, 0.2)' }}>
                                    <i className="bi bi-key fs-1 mb-3 d-block opacity-25"></i>
                                    <h6 className="fw-bold text-dark">Nenhuma integração ativa</h6>
                                    <p className="mb-0 small">Você ainda não gerou nenhuma chave de API.</p>
                                </div>
                            ) : (
                                <div className="row g-3 g-md-4">
                                    {apiKeys.map((key) => {
                                        const isSandboxKey = key.chave.includes('test_');

                                        return (
                                        <div key={key.id} className="col-12 col-md-6 col-xl-4">
                                            <div className="d-flex flex-column h-100 rounded-4 shadow-sm border" style={{ backgroundColor: isSandboxKey ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-sidebar, #FFFFFF)', borderColor: isSandboxKey ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)' }}>
                                                <div className="p-4 flex-grow-1 d-flex flex-column">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <span className={`badge rounded-pill px-2 fw-medium me-2 mb-2 bg-opacity-10 border border-opacity-25 ${key.ativo ? 'bg-success text-success border-success' : 'bg-secondary text-secondary border-secondary'}`}>
                                                                {key.ativo ? 'Ativo' : 'Inativo'}
                                                            </span>
                                                            {isSandboxKey && (
                                                                <span className="badge bg-warning text-dark rounded-pill px-2 fw-bold shadow-sm mb-2">
                                                                    <i className="bi bi-cone-striped me-1"></i> SANDBOX
                                                                </span>
                                                            )}
                                                            <h6 className="fw-bold text-dark mb-0">{key.nome}</h6>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-3" style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', border: '1px solid var(--border-color)' }}>
                                                        <span className="font-monospace text-muted small ms-2 user-select-all" style={{ fontSize: '12px' }}>{key.chave.substring(0, 16)}••••••••</span>
                                                        <SquareButton onClick={() => handleCopy(key.chave)}>
                                                            <i className="bi bi-clipboard"></i>
                                                        </SquareButton>
                                                    </div>

                                                    <div className="mb-4">
                                                        <span className="d-block text-muted mb-1 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>PERMISSÕES:</span>
                                                        <div className="d-flex flex-wrap gap-1">{renderPermissoesBadges(key.permissoes)}</div>
                                                    </div>

                                                    <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span className="text-muted" style={{ fontSize: '11px' }}>Criada em:</span>
                                                            <span className="fw-bold text-dark" style={{ fontSize: '11px' }}>{formatDate(key.criado_em)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 pt-0 d-flex gap-2">
                                                    <RedButton onClick={() => handleRevokeKey(key.id, key.nome)} className="w-100 fw-bold">
                                                        Revogar Acesso
                                                    </RedButton>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* TAB: WEBHOOKS */}
                    {activeTab === 'webhooks' && (
                        <motion.div key="webhooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <div className="bg-white border-0 shadow-sm rounded-4 mb-5 p-4 p-md-5" style={{ backgroundColor: 'var(--bg-sidebar, #FFFFFF)' }}>
                                <div className="row">
                                    <div className="col-lg-5 mb-4 mb-lg-0 pe-lg-5">
                                        <h6 className="fw-bold text-dark mb-3">Webhook: Pedido Pago</h6>
                                        <p className="text-secondary small mb-4">
                                            Quer que o seu ERP saiba instantaneamente quando um pedido for aprovado? Cadastre a URL do seu sistema aqui.
                                        </p>
                                        <div className="bg-info bg-opacity-10 text-info p-3 rounded-3 small fw-medium">
                                            <i className="bi bi-info-circle-fill me-2"></i>
                                            Nós enviaremos um POST em formato JSON contendo todos os dados do cliente e produtos comprados sempre que houver um pagamento aprovado.
                                        </div>
                                    </div>
                                    
                                    <div className="col-lg-7">
                                        <form onSubmit={handleSaveWebhook}>
                                            <div className="mb-4">
                                                <label className="fw-bold text-secondary mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>URL DE DESTINO DO SEU ERP (ENDPOINT)</label>
                                                <CustomInput 
                                                    type="url" 
                                                    placeholder="https://seu-erp.com.br/api/callback/ararinha" 
                                                    value={webhookUrl}
                                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                                    required 
                                                />
                                            </div>

                                            <div className="d-flex flex-column flex-sm-row gap-2">
                                                <CtaButton type="submit" disabled={savingWebhook} className="px-4" style={{ height: '46px', borderRadius: '12px' }}>
                                                    {savingWebhook ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-save me-2"></i>}
                                                    Salvar URL do Webhook
                                                </CtaButton>
                                                
                                                <LightButton onClick={handleTestWebhook} disabled={testingWebhook} className="px-4 border-2" style={{ height: '46px', borderRadius: '12px' }}>
                                                    {testingWebhook ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-play-circle me-2"></i>}
                                                    Disparar Teste
                                                </LightButton>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* MODAL (Mantido Form.Check para switches pois é complexo criar switches nativos sem CSS extra) */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                    <form onSubmit={handleCreateKey}>
                        <div className="p-4 pb-3" style={{ backgroundColor: '#0f172a' }}>
                            <h5 className="fw-bold text-white mb-1">Nova Integração de API</h5>
                            <p className="mb-0 text-white opacity-75 small">Dê um nome para a integração e defina quais dados esse sistema poderá acessar.</p>
                        </div>

                        <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            
                            <div className="mb-4">
                                <label className="fw-bold text-secondary mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME DA INTEGRAÇÃO</label>
                                <CustomInput 
                                    placeholder="Ex: Agente de IA n8n" 
                                    value={newKeyName} 
                                    onChange={(e) => setNewKeyName(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="p-3 rounded-4 mb-4" style={{ backgroundColor: isTestKey ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-main, #F8FAFC)', border: `1px solid ${isTestKey ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`, transition: '0.3s' }}>
                                <Form.Check 
                                    type="switch" 
                                    id="sandbox-switch" 
                                    label={
                                        <div>
                                            <strong className="d-block text-dark">Gerar como Chave de Teste (Sandbox)</strong>
                                            <span className="small text-secondary" style={{ fontSize: '12px' }}>Ações feitas com essa chave não vão alterar o seu estoque real e serão marcadas como testes.</span>
                                        </div>
                                    } 
                                    checked={isTestKey} 
                                    onChange={(e) => setIsTestKey(e.target.checked)} 
                                />
                            </div>

                            <label className="fw-bold text-secondary mb-3" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>PERMISSÕES (SCOPES)</label>
                            <div className="p-4 rounded-4" style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', border: '1px solid var(--border-color)' }}>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <h6 className="fw-bold text-dark small mb-3 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}><i className="bi bi-box-seam me-2"></i>Catálogo</h6>
                                        <Form.Check type="switch" id="read_produtos" label={<span className="small text-dark">Visualizar produtos e estoque</span>} checked={permissoes.READ_PRODUTOS} onChange={(e) => setPermissoes({...permissoes, READ_PRODUTOS: e.target.checked})} className="mb-2" />
                                        <Form.Check type="switch" id="write_produtos" label={<span className="small text-dark">Criar/Atualizar produtos</span>} checked={permissoes.WRITE_PRODUTOS} onChange={(e) => setPermissoes({...permissoes, WRITE_PRODUTOS: e.target.checked})} />
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <h6 className="fw-bold text-dark small mb-3 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}><i className="bi bi-cart3 me-2"></i>Pedidos</h6>
                                        <Form.Check type="switch" id="read_pedidos" label={<span className="small text-dark">Visualizar lista de vendas</span>} checked={permissoes.READ_PEDIDOS} onChange={(e) => setPermissoes({...permissoes, READ_PEDIDOS: e.target.checked})} className="mb-2" />
                                        <Form.Check type="switch" id="write_pedidos" label={<span className="small text-dark">Gerar novos pedidos</span>} checked={permissoes.WRITE_PEDIDOS} onChange={(e) => setPermissoes({...permissoes, WRITE_PEDIDOS: e.target.checked})} />
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <h6 className="fw-bold text-dark small mb-3 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}><i className="bi bi-people me-2"></i>Clientes</h6>
                                        <Form.Check type="switch" id="read_clientes" label={<span className="small text-dark">Buscar dados de clientes</span>} checked={permissoes.READ_CLIENTES} onChange={(e) => setPermissoes({...permissoes, READ_CLIENTES: e.target.checked})} className="mb-2" />
                                        <Form.Check type="switch" id="write_clientes" label={<span className="small text-dark">Cadastrar novos clientes</span>} checked={permissoes.WRITE_CLIENTES} onChange={(e) => setPermissoes({...permissoes, WRITE_CLIENTES: e.target.checked})} />
                                    </div>

                                    <div className="col-md-6">
                                        <h6 className="fw-bold text-dark small mb-3 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}><i className="bi bi-wallet2 me-2"></i>Financeiro</h6>
                                        <Form.Check type="switch" id="read_financeiro" label={<span className="small text-dark">Visualizar transações</span>} checked={permissoes.READ_FINANCEIRO} onChange={(e) => setPermissoes({...permissoes, READ_FINANCEIRO: e.target.checked})} className="mb-2" />
                                        <Form.Check type="switch" id="write_financeiro" label={<span className="small text-dark">Gerar movimentações</span>} checked={permissoes.WRITE_FINANCEIRO} onChange={(e) => setPermissoes({...permissoes, WRITE_FINANCEIRO: e.target.checked})} />
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>

                        <Modal.Footer className="border-0 pt-0 px-4 pb-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            <LightButton onClick={() => setShowModal(false)} className="px-4" style={{ height: '42px', borderRadius: '50px' }}>
                                Cancelar
                            </LightButton>
                            <CtaButton type="submit" color={isTestKey ? "#ffc107" : undefined} className={`px-4 ${isTestKey ? 'text-dark' : ''}`} style={{ height: '42px', borderRadius: '50px' }} disabled={creating}>
                                {creating ? <Spinner size="sm" /> : (isTestKey ? 'Gerar Chave de Teste' : 'Gerar Chave')}
                            </CtaButton>
                        </Modal.Footer>
                    </form>
                </Modal>

            </div>
        </div>
    );
};

export default IntegrationApiPage;