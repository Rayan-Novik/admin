import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Card, Form, InputGroup, Spinner, Badge, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// --- TEMPLATES PADRÃO (Estratégia de Copywriting) ---
const DEFAULT_TEMPLATES = {
    abandoned_cart: `
        <p>Olá, <strong>{nome}</strong>!</p>
        <p>Notamos que você esqueceu alguns itens incríveis no seu carrinho. Eles estão reservados para você por tempo limitado!</p>
        {lista_produtos}
        <p>Não perca essa oportunidade. Clique abaixo para finalizar:</p>
        <p>{botao_acao}</p>
        <p><em>Equipe de Suporte</em></p>
    `,
    pending_payment: `
        <p>Oi, <strong>{nome}</strong>.</p>
        <p>Recebemos o seu pedido <strong>#{id_pedido}</strong> no valor de <strong>{valor_total}</strong>.</p>
        <p>Estamos aguardando a confirmação do pagamento para iniciar o envio imediato.</p>
        <p>Se você já pagou, desconsidere este e-mail. Caso contrário, clique abaixo:</p>
        <p>{botao_acao}</p>
    `,
    order_confirmed: `
        <h2 style="color: #28a745;">Pagamento Aprovado! 🎉</h2>
        <p>Olá, <strong>{nome}</strong>!</p>
        <p>Ótima notícia! O pagamento do seu pedido <strong>#{id_pedido}</strong> foi confirmado com sucesso.</p>
        <p>Nossa equipe já está separando seus produtos. Em breve enviaremos o código de rastreio.</p>
        <p><strong>Resumo do Pedido:</strong><br>Total: {valor_total}</p>
        <p>{botao_acao}</p>
    `,
    reset_password: `
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Para criar uma nova senha segura, clique no botão abaixo:</p>
        <p>{botao_acao}</p>
        <p><small>Se não foi você, ignore este e-mail.</small></p>
    `
};

const AUTOMATION_TYPES = [
    { id: 'abandoned_cart', title: 'Carrinho Abandonado', icon: 'bi-cart-x', color: 'warning', desc: 'Recupera vendas enviando lembrete com os produtos esquecidos.' },
    { id: 'pending_payment', title: 'Pagamento Pendente', icon: 'bi-qr-code', color: 'info', desc: 'Lembra o cliente de pagar o Boleto ou Pix antes que expire.' },
    { id: 'order_confirmed', title: 'Pedido Confirmado', icon: 'bi-bag-check', color: 'success', desc: 'Notifica aprovação do pagamento e envia recibo.' },
    { id: 'reset_password', title: 'Recuperação de Senha', icon: 'bi-shield-lock', color: 'secondary', desc: 'E-mail transacional para redefinição de senha.' }
];

const AutomationManager = ({ show, onHide }) => {
    const [view, setView] = useState('list');
    const [selectedType, setSelectedType] = useState(null);
    const [config, setConfig] = useState({ ativo: false, tempo_espera: 1, assunto: '', corpo: '' });
    const [statuses, setStatuses] = useState({}); 
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'clean']
        ],
    };

    // --- CARREGAMENTO ---
    useEffect(() => {
        if (show && view === 'list') fetchAllStatuses();
    }, [show, view]);

    const fetchAllStatuses = async () => {
        setListLoading(true);
        try {
            const promises = AUTOMATION_TYPES.map(type => api.get(`/automation/${type.id}`));
            const results = await Promise.all(promises);
            const newStatuses = {};
            results.forEach((res, index) => {
                newStatuses[AUTOMATION_TYPES[index].id] = res.data?.ativo || false;
            });
            setStatuses(newStatuses);
        } catch (error) {
            console.error("Erro status", error);
        } finally {
            setListLoading(false);
        }
    };

    // --- NAVEGAÇÃO ---
    const handleSelectAutomation = async (typeData) => {
        setLoading(true);
        setSelectedType(typeData);
        setView('edit');
        try {
            const { data } = await api.get(`/automation/${typeData.id}`);
            
            // Se o corpo estiver vazio, usa o template padrão automaticamente
            const corpoInicial = (data.corpo && data.corpo.length > 10) ? data.corpo : DEFAULT_TEMPLATES[typeData.id];
            
            setConfig({
                ativo: data.ativo || false,
                tempo_espera: data.tempo_espera || 1,
                assunto: data.assunto || '',
                corpo: corpoInicial
            });
        } catch (error) {
            toast.error("Erro ao carregar.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedType(null);
        fetchAllStatuses();
    };

    // --- AÇÕES ---
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/automation/${selectedType.id}`, config);
            toast.success('Salvo com sucesso!');
            setStatuses(prev => ({...prev, [selectedType.id]: config.ativo}));
        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            await api.post('/automation/test', { type: selectedType.id, ...config });
            toast.success(`Teste enviado para seu e-mail!`);
        } catch (error) {
            toast.error("Erro ao enviar teste.");
        } finally {
            setTesting(false);
        }
    };

    const handleQuickToggle = async (e, typeId) => {
        e.stopPropagation();
        try {
            const { data } = await api.get(`/automation/${typeId}`);
            const newState = !data.ativo;
            await api.put(`/automation/${typeId}`, { ...data, ativo: newState });
            setStatuses(prev => ({...prev, [typeId]: newState}));
            toast.success(newState ? 'Ativado!' : 'Pausado.');
        } catch (error) {
            toast.error("Erro ao alterar.");
        }
    };

    // Reseta o editor para o texto padrão do sistema
    const handleRestoreTemplate = () => {
        if(window.confirm("Isso irá substituir o texto atual pelo modelo padrão. Continuar?")) {
            setConfig({ ...config, corpo: DEFAULT_TEMPLATES[selectedType.id] });
            toast.info("Modelo padrão restaurado.");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.info(`Copiado: ${text}`, { autoClose: 1000, hideProgressBar: true, position: "bottom-center" });
    };

    // --- RENDERIZADORES ---

    const renderList = () => (
        <Row className="g-4">
            {listLoading ? (
                <div className="text-center py-5 w-100"><Spinner animation="border" variant="primary"/></div>
            ) : (
                AUTOMATION_TYPES.map((item) => {
                    const isActive = statuses[item.id];
                    return (
                        <Col md={6} key={item.id}>
                            <Card 
                                className={`h-100 border-0 shadow-sm card-hover cursor-pointer ${isActive ? 'active-card' : ''}`}
                                onClick={() => handleSelectAutomation(item)}
                                style={{ transition: 'all 0.3s ease', overflow: 'hidden' }}
                            >
                                <Card.Body className="p-4 d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className={`icon-box bg-${item.color} bg-opacity-10 text-${item.color} rounded-4 p-3`}>
                                            <i className={`bi ${item.icon} fs-4`}></i>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            className="custom-switch fs-4"
                                            checked={isActive || false}
                                            onChange={(e) => handleQuickToggle(e, item.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <h6 className="fw-bold text-dark mb-2">{item.title}</h6>
                                    <p className="text-muted small mb-4 flex-grow-1" style={{lineHeight: '1.5'}}>{item.desc}</p>
                                    <div className="d-flex align-items-center text-primary fw-bold small mt-auto">
                                        <span className="me-2">Editar Configurações</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </div>
                                </Card.Body>
                                {isActive && <div className={`position-absolute bottom-0 start-0 w-100 py-1 bg-${item.color}`}></div>}
                            </Card>
                        </Col>
                    );
                })
            )}
        </Row>
    );

    const renderEdit = () => {
        const variables = [
            { key: '{nome}', label: 'Nome' },
            { key: '{nome_completo}', label: 'Nome Completo' },
        ];
        if (selectedType.id === 'abandoned_cart') {
            variables.push({ key: '{lista_produtos}', label: 'Produtos' });
            variables.push({ key: '{link_carrinho}', label: 'Link Carrinho' });
        }
        if (['pending_payment', 'order_confirmed'].includes(selectedType.id)) {
            variables.push({ key: '{id_pedido}', label: '# Pedido' });
            variables.push({ key: '{valor_total}', label: 'Valor' });
            variables.push({ key: '{link_pedido}', label: 'Link Pedido' });
        }
        variables.push({ key: '{botao_acao}', label: 'Botão' });

        return (
            <>
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
                ) : (
                    <Form>
                        {/* Header Status */}
                        <Card className="border-0 bg-light rounded-4 mb-4">
                            <Card.Body className="d-flex align-items-center justify-content-between p-3">
                                <div className="d-flex align-items-center">
                                    <div className={`bg-${selectedType.color} text-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center`} style={{width:40, height:40}}>
                                        <i className={`bi ${selectedType.icon}`}></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0 text-dark">{selectedType.title}</h6>
                                        <div className="d-flex align-items-center mt-1">
                                            <span className={`badge rounded-pill ${config.ativo ? 'bg-success' : 'bg-secondary'} me-2`}>
                                                {config.ativo ? 'ATIVO' : 'PAUSADO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="border-end pe-3 me-1 text-end d-none d-md-block">
                                        <span className="d-block text-muted small fw-bold text-uppercase">Tempo de Espera</span>
                                        <span className="text-dark small">Após o evento</span>
                                    </div>
                                    <InputGroup style={{width: '130px'}}>
                                        <Form.Control 
                                            type="number" min="0" className="fw-bold text-center border-0 shadow-sm"
                                            value={config.tempo_espera}
                                            onChange={e => setConfig({...config, tempo_espera: e.target.value})}
                                        />
                                        <InputGroup.Text className="bg-white border-0 shadow-sm text-muted small">h</InputGroup.Text>
                                    </InputGroup>
                                </div>
                            </Card.Body>
                        </Card>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Assunto do E-mail</Form.Label>
                            <Form.Control 
                                type="text" className="form-control-lg border-0 bg-light shadow-sm fs-6"
                                value={config.assunto}
                                onChange={e => setConfig({...config, assunto: e.target.value})}
                                placeholder="Ex: Oi {nome}, finalize sua compra!"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="small fw-bold text-muted text-uppercase mb-0">Corpo da Mensagem</Form.Label>
                                <Button variant="link" size="sm" className="text-decoration-none p-0 small text-primary" onClick={handleRestoreTemplate}>
                                    <i className="bi bi-arrow-counterclockwise me-1"></i> Restaurar Modelo
                                </Button>
                            </div>
                            
                            {/* Tags de Variáveis */}
                            <div className="d-flex flex-wrap gap-2 mb-3 bg-white p-2 border rounded shadow-sm">
                                <span className="small text-muted align-self-center me-2">Clique para copiar:</span>
                                {variables.map(v => (
                                    <OverlayTrigger key={v.key} placement="top" overlay={<Tooltip>Copiar {v.key}</Tooltip>}>
                                        <Badge 
                                            bg="light" text="dark" 
                                            className="border cursor-pointer fw-normal px-2 py-2 user-select-none text-primary"
                                            onClick={() => copyToClipboard(v.key)}
                                            style={{cursor: 'pointer'}}
                                        >
                                            <i className="bi bi-code-slash me-1"></i>{v.label}
                                        </Badge>
                                    </OverlayTrigger>
                                ))}
                            </div>

                            <div className="border rounded shadow-sm overflow-hidden bg-white">
                                <ReactQuill 
                                    theme="snow" value={config.corpo} onChange={(val) => setConfig({...config, corpo: val})}
                                    modules={modules} style={{ height: '300px', border: 'none' }}
                                />
                                <div style={{height: '42px', backgroundColor: '#f8f9fa'}}></div> 
                            </div>
                        </Form.Group>
                    </Form>
                )}
            </>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="bg-white px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    {view === 'edit' && (
                        <Button variant="light" className="rounded-circle me-3 border-0 bg-light text-secondary" onClick={handleBackToList} style={{width: 40, height: 40}}>
                            <i className="bi bi-arrow-left"></i>
                        </Button>
                    )}
                    <div>
                        <h5 className="fw-bold mb-0 text-dark">
                            <i className="bi bi-robot me-2 text-primary"></i> 
                            {view === 'list' ? 'Central de Automação' : `Editando: ${selectedType.title}`}
                        </h5>
                    </div>
                </div>
                <Button variant="close" onClick={onHide}></Button>
            </div>
            
            <Modal.Body className="px-4 py-4" style={{ minHeight: '550px', backgroundColor: '#f9fafb' }}>
                {view === 'list' ? renderList() : renderEdit()}
            </Modal.Body>

            {view === 'edit' && (
                <div className="bg-white border-top px-4 py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <Form.Check 
                            type="switch" id="footer-active-switch"
                            label={config.ativo ? "Automação Ativa" : "Automação Pausada"}
                            checked={config.ativo}
                            onChange={(e) => setConfig({...config, ativo: e.target.checked})}
                            className={`fw-bold ${config.ativo ? 'text-success' : 'text-muted'}`}
                        />
                    </div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={handleTest} disabled={testing || saving || loading}>
                            {testing ? <Spinner size="sm"/> : <><i className="bi bi-send me-2"></i> Testar Envio</>}
                        </Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving || loading} className="px-4 fw-bold shadow-sm">
                            {saving ? <Spinner size="sm"/> : <><i className="bi bi-check-lg me-2"></i> Salvar</>}
                        </Button>
                    </div>
                </div>
            )}
            
            <style>{`
                .card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.08)!important; }
                .active-card { border: 1px solid #19875420 !important; background-color: #f8fffb; }
                .icon-box { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
                .cursor-pointer { cursor: pointer; }
                .custom-switch .form-check-input { cursor: pointer; width: 3em; height: 1.5em; }
            `}</style>
        </Modal>
    );
};

export default AutomationManager;