import React, { useState, useEffect } from 'react';
import { 
    Card, Form, Button, Row, Col, Spinner, InputGroup, Badge, OverlayTrigger, Tooltip 
} from 'react-bootstrap';
import api from '../../../services/api'; 
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// ✅ Importa o Gerenciador Completo 
import AutomationManager from './AutomationManager';

const EmailSettings = () => {
    const [loading, setLoading] = useState(true); 
    const [testingConnection, setTestingConnection] = useState(false); 
    const [saving, setSaving] = useState(false);   
    const [uploading, setUploading] = useState(false); 
    const [showPass, setShowPass] = useState(false); 
    
    // Estado para abrir o Modal de Automação
    const [showAutomationModal, setShowAutomationModal] = useState(false);

    const [formData, setFormData] = useState({
        SMTP_HOST: '', SMTP_PORT: '587', SMTP_USER: '', SMTP_PASS: '',
        SMTP_SECURE: 'false', SMTP_FROM_NAME: '', SMTP_FROM_EMAIL: '',
        SMTP_SIGNATURE: '', SMTP_SIGNATURE_IMAGE: '' 
    });

    // Toolbar simplificada para a assinatura
    const modulesSignature = {
        toolbar: [
            ['bold', 'italic', 'underline'], 
            [{ 'color': [] }],
            ['link', 'clean']
        ],
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/config/email');
                setFormData(prev => ({ ...prev, ...data, SMTP_PASS: '' }));
            } catch (error) {
                toast.error('Erro ao carregar configurações.');
            } finally {
                setLoading(false); 
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSwitchChange = (e) => {
        setFormData({ ...formData, SMTP_SECURE: e.target.checked ? 'true' : 'false' });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('image', file);
        try {
            setUploading(true);
            const { data } = await api.post('/uploadimages', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, SMTP_SIGNATURE_IMAGE: data.imagePath }));
            toast.success('Imagem enviada!');
        } catch (error) {
            toast.error('Erro no upload.');
        } finally {
            setUploading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!formData.SMTP_HOST || !formData.SMTP_USER) return toast.warning('Preencha Host e Usuário.');
        setTestingConnection(true);
        try {
            await api.post('/config/email/test', formData);
            toast.success('Conexão SMTP OK! ✅');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Falha na conexão.');
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setSaving(true); 
        try {
            await api.put('/config/email', formData);
            toast.success('Configurações salvas!');
        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false); 
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <>
            <Row className="g-4">
                {/* --- COLUNA ESQUERDA: CONFIGURAÇÃO TÉCNICA --- */}
                <Col lg={6} xl={5}>
                    <Card className="shadow-sm border-0 rounded-4 h-100 clean-card">
                        <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0 custom-title">
                                <i className="bi bi-hdd-network me-2 text-primary"></i> Servidor SMTP
                            </h5>
                            <OverlayTrigger overlay={<Tooltip>Testar credenciais</Tooltip>}>
                                <Button variant="outline-secondary" size="sm" className="rounded-pill fw-bold btn-test" onClick={handleTestConnection} disabled={testingConnection}>
                                    {testingConnection ? <Spinner size="sm" animation="border"/> : <><i className="bi bi-plug-fill me-1 text-success"></i> Testar</>}
                                </Button>
                            </OverlayTrigger>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">Host do Servidor</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="custom-input-bg custom-border border-end-0"><i className="bi bi-cloud text-muted"></i></InputGroup.Text>
                                                <Form.Control className="custom-input-bg custom-border border-start-0" type="text" name="SMTP_HOST" value={formData.SMTP_HOST} onChange={handleChange} placeholder="smtp.exemplo.com" />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">Usuário</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="custom-input-bg custom-border border-end-0"><i className="bi bi-person text-muted"></i></InputGroup.Text>
                                                <Form.Control className="custom-input-bg custom-border border-start-0" type="text" name="SMTP_USER" value={formData.SMTP_USER} onChange={handleChange} />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">Porta</Form.Label>
                                            <Form.Select 
                                                name="SMTP_PORT" 
                                                value={formData.SMTP_PORT} 
                                                onChange={handleChange}
                                                className="custom-input-bg custom-border fw-bold custom-select-text"
                                            >
                                                <option value="587">587 (TLS)</option>
                                                <option value="465">465 (SSL)</option>
                                                <option value="25">25</option>
                                                <option value="2525">2525</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">Senha</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="custom-input-bg custom-border border-end-0"><i className="bi bi-lock text-muted"></i></InputGroup.Text>
                                                <Form.Control className="custom-input-bg custom-border border-start-0 border-end-0" type={showPass?"text":"password"} name="SMTP_PASS" value={formData.SMTP_PASS} onChange={handleChange} placeholder="••••••" />
                                                <Button variant="outline-secondary" className="custom-border border-start-0 custom-input-bg text-muted" onClick={()=>setShowPass(!showPass)}>
                                                    <i className={`bi ${showPass?'bi-eye-slash':'bi-eye'}`}></i>
                                                </Button>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>

                                    <Col md={12} className="py-2">
                                        <Form.Check 
                                            type="switch" 
                                            id="secure-switch" 
                                            label={<span className="custom-text-body">Usar Conexão Segura (SSL/TLS)</span>} 
                                            checked={formData.SMTP_SECURE === 'true'} 
                                            onChange={handleSwitchChange} 
                                        />
                                    </Col>

                                    <div className="border-top custom-border-divider my-2"></div>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">Nome Exibição</Form.Label>
                                            <Form.Control type="text" name="SMTP_FROM_NAME" value={formData.SMTP_FROM_NAME} onChange={handleChange} placeholder="Minha Loja" className="custom-input-bg custom-border" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted fw-bold text-uppercase">E-mail Envio</Form.Label>
                                            <Form.Control type="email" name="SMTP_FROM_EMAIL" value={formData.SMTP_FROM_EMAIL} onChange={handleChange} placeholder="no-reply@..." className="custom-input-bg custom-border" />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Editor de Assinatura Clean */}
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="small text-muted fw-bold text-uppercase">Assinatura de Rodapé</label>
                                        <Badge bg="secondary" className="fw-normal">HTML Ativo</Badge>
                                    </div>
                                    <div className="border custom-border rounded overflow-hidden editor-container">
                                        <ReactQuill theme="snow" value={formData.SMTP_SIGNATURE || ''} onChange={(val) => setFormData({...formData, SMTP_SIGNATURE: val})} modules={modulesSignature} style={{ height: '100px', border: 'none' }} />
                                        <div style={{height: '42px'}} className="editor-spacer"></div>
                                    </div>
                                    
                                    <InputGroup className="mt-2" size="sm">
                                        <InputGroup.Text className="custom-input-bg custom-border text-muted">Banner URL</InputGroup.Text>
                                        <Form.Control type="text" name="SMTP_SIGNATURE_IMAGE" value={formData.SMTP_SIGNATURE_IMAGE || ''} onChange={handleChange} placeholder="https://..." className="custom-input-bg custom-border" />
                                        <div style={{width: '36px', position: 'relative', overflow: 'hidden'}} className="btn btn-outline-secondary custom-border custom-input-bg">
                                            <i className="bi bi-upload"></i>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{position: 'absolute', top:0, left:0, opacity:0, width:'100%', cursor: 'pointer'}} />
                                        </div>
                                    </InputGroup>
                                    {uploading && <small className="text-primary d-block mt-1"><Spinner size="sm" animation="border" className="me-1"/> Uploading...</small>}
                                </div>

                                <div className="d-grid mt-4">
                                    <Button type="submit" variant="primary" size="lg" disabled={saving} className="rounded-pill fw-bold shadow-sm">
                                        {saving ? <Spinner size="sm" animation="border"/> : 'Salvar Configurações'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- COLUNA DIREITA: PREVIEW E AUTOMAÇÃO --- */}
                <Col lg={6} xl={7}>
                    <div className="d-flex flex-column gap-4 h-100">
                        
                        {/* 1. CARD DE AUTOMAÇÃO (ROBÔ) - BOTÃO GRANDE */}
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden text-white" style={{background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'}}>
                            <Card.Body className="p-4 p-md-5 position-relative">
                                <div className="position-absolute top-0 end-0 p-3 opacity-25 d-none d-sm-block">
                                    <i className="bi bi-robot" style={{fontSize: '8rem', transform: 'rotate(15deg)'}}></i>
                                </div>
                                <div className="position-relative" style={{zIndex: 2}}>
                                    <div className="d-flex align-items-center mb-3">
                                        <Badge bg="white" text="primary" className="px-3 py-2 rounded-pill fw-bold shadow-sm">
                                            <i className="bi bi-lightning-fill me-1"></i> AUTOMAÇÃO PRO
                                        </Badge>
                                    </div>
                                    <h2 className="fw-bold mb-2">Robô de Vendas</h2>
                                    <p className="lead mb-4 opacity-75" style={{maxWidth: '450px', fontSize: '1rem'}}>
                                        Configure fluxos automáticos para recuperar carrinhos abandonados, cobrar pagamentos pendentes e confirmar pedidos.
                                    </p>
                                    <Button 
                                        variant="light" 
                                        size="lg" 
                                        className="fw-bold text-primary px-4 py-3 rounded-pill shadow-lg border-0 hover-scale"
                                        onClick={() => setShowAutomationModal(true)}
                                    >
                                        <i className="bi bi-gear-wide-connected me-2"></i> Gerenciar Automações
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* 2. CARD DE PREVIEW (Simulação de E-mail) */}
                        <Card className="shadow-sm border-0 rounded-4 flex-grow-1 clean-card">
                            <Card.Header className="custom-preview-header border-0 py-3 px-4 d-flex justify-content-between align-items-center rounded-top-4">
                                <div className="d-flex gap-2">
                                    <div className="rounded-circle bg-danger" style={{width:10, height:10}}></div>
                                    <div className="rounded-circle bg-warning" style={{width:10, height:10}}></div>
                                    <div className="rounded-circle bg-success" style={{width:10, height:10}}></div>
                                </div>
                                <small className="text-muted fw-bold text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Preview Visual</small>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {/* 🟢 O fundo do Preview SEMPRE fica branco para simular um email real, mas a borda respeita o tema */}
                                <div className="p-4 rounded-bottom-4" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', color: '#333333' }}>
                                    
                                    {/* Simulação Header Email */}
                                    <div className="border-bottom pb-3 mb-3" style={{borderColor: '#eeeeee !important'}}>
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 me-3" style={{width: '48px', height: '48px'}}>
                                                {formData.SMTP_FROM_NAME ? formData.SMTP_FROM_NAME.charAt(0).toUpperCase() : 'L'}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{formData.SMTP_FROM_NAME || 'Minha Loja'}</div>
                                                <div className="text-secondary small">&lt;{formData.SMTP_FROM_EMAIL || 'loja@email.com'}&gt;</div>
                                            </div>
                                            <div className="ms-auto text-secondary small">10:45 AM</div>
                                        </div>
                                        <div className="fw-bold fs-5 text-dark mt-1">Pedido #9923 Confirmado! 🚀</div>
                                    </div>

                                    {/* Simulação Corpo */}
                                    <div className="py-2" style={{lineHeight: '1.6', color: '#555555'}}>
                                        <p>Olá <strong>Cliente</strong>,</p>
                                        <p>Seu pedido foi processado com sucesso! Abaixo segue a assinatura configurada que aparecerá em todos os seus e-mails transacionais.</p>
                                    </div>

                                    {/* Assinatura Renderizada */}
                                    <div className="mt-4 pt-3 border-top rounded" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderColor: '#eeeeee !important' }}>
                                        <small className="text-secondary d-block mb-2 text-uppercase" style={{fontSize: '0.65rem'}}>Rodapé do E-mail</small>
                                        <div dangerouslySetInnerHTML={{ __html: formData.SMTP_SIGNATURE || '<span class="text-secondary fst-italic">Sua assinatura aparecerá aqui...</span>' }} />
                                        {formData.SMTP_SIGNATURE_IMAGE && (
                                            <img src={formData.SMTP_SIGNATURE_IMAGE} alt="Banner" className="mt-3 img-fluid rounded shadow-sm" style={{maxHeight: '80px'}} onError={(e)=>e.target.style.display='none'} />
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* --- MODAL DE AUTOMAÇÃO --- */}
            <AutomationManager show={showAutomationModal} onHide={() => setShowAutomationModal(false)} />
            
            <style>{`
                .hover-scale:hover { transform: scale(1.02); transition: transform 0.2s; }
                
                /* LIGHT MODE (Default) */
                .custom-title { color: #212529; }
                .custom-input-bg { background-color: #f8f9fa; color: #212529; }
                .custom-border { border-color: #dee2e6; }
                .custom-select-text { color: #6c757d; }
                .custom-border-divider { border-color: #dee2e6 !important; }
                .custom-text-body { color: #212529; }
                .custom-preview-header { background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; }
                .editor-spacer { background-color: #f8f9fa; border-top: 1px solid #ccc; }
                .btn-test { background-color: #f8f9fa; border-color: #dee2e6; color: #212529;}

                /* MODO ESCURO */
                body.dark-mode .clean-card { background-color: #0f172a !important; }
                body.dark-mode .custom-title, body.dark-mode .custom-text-body { color: #f8fafc !important; }
                
                body.dark-mode .custom-input-bg {
                    background-color: #1e293b !important;
                    color: #f8fafc !important;
                }
                
                body.dark-mode .custom-border, body.dark-mode .custom-border-divider {
                    border-color: #334155 !important;
                }
                
                body.dark-mode .custom-select-text {
                    color: #cbd5e1 !important;
                }
                
                body.dark-mode .form-control::placeholder {
                    color: #64748b !important;
                }

                body.dark-mode .custom-preview-header {
                    background-color: #1e293b !important;
                    border-bottom: 1px solid #334155 !important;
                }

                body.dark-mode .btn-test {
                    background-color: #1e293b !important;
                    border-color: #334155 !important;
                    color: #f8fafc !important;
                }
                body.dark-mode .btn-test:hover { background-color: #334155 !important; }

                /* Forçando o painel do ReactQuill a ficar legível no modo escuro */
                body.dark-mode .ql-toolbar.ql-snow,
                body.dark-mode .ql-container.ql-snow {
                    border-color: #334155 !important;
                }
                body.dark-mode .ql-editor {
                    color: #f8fafc !important;
                }
                body.dark-mode .ql-snow .ql-stroke {
                    stroke: #cbd5e1 !important;
                }
                body.dark-mode .ql-snow .ql-fill {
                    fill: #cbd5e1 !important;
                }
                body.dark-mode .editor-spacer {
                    background-color: #1e293b !important;
                    border-top-color: #334155 !important;
                }
            `}</style>
        </>
    );
};

export default EmailSettings;