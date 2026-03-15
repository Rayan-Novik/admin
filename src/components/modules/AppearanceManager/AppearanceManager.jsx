import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col, Tab, Nav, Card, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';

// Imports
import ColorSettings from './ColorSettings';
import LogoSettings from './LogoSettings';
import GeneralSettings from './GeneralSettings'; 
import LivePreview from './LivePreview';
import FooterManager from './FooterManager'; 
import SocialMediaManager from './SocialMediaManager'; 
import PageLayoutManager from './PageLayoutManager'; 

// --- COMPONENTE INTERNO DE DOMÍNIO ---
const DomainSettings = () => {
    const [dominio, setDominio] = useState('');
    const [dominioSalvo, setDominioSalvo] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchDomain = async () => {
            try {
                const { data } = await api.get('/tenants/dominio'); 
                if (data && data.dominio_customizado) {
                    setDominio(data.dominio_customizado);
                    setDominioSalvo(data.dominio_customizado);
                }
            } catch (err) {
                console.error("Erro ao buscar domínio:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDomain();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        // Limpa o domínio (tira http://, https:// e barras)
        let cleanDomain = dominio.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        try {
            await api.put('/tenants/dominio', { dominio_customizado: cleanDomain });
            setDominio(cleanDomain);
            setDominioSalvo(cleanDomain);
            setSuccess('Domínio salvo com sucesso!');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar o domínio.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-4"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4 p-lg-5">
                <h5 className="fw-bold mb-2">Domínio Personalizado</h5>
                <p className="text-muted small mb-4">
                    Conecte o seu próprio endereço web (ex: <strong>www.minhaloja.com.br</strong>) para passar mais credibilidade e profissionalismo aos seus clientes.
                </p>

                {error && <Alert variant="danger" className="border-0 shadow-sm rounded-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}
                {success && <Alert variant="success" className="border-0 shadow-sm rounded-3"><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>}

                <Form onSubmit={handleSubmit} className="mb-5">
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark">Qual será o endereço da sua loja?</Form.Label>
                        <InputGroup className="shadow-sm">
                            <InputGroup.Text className="bg-light border-end-0 text-muted">
                                <i className="bi bi-globe2"></i>
                            </InputGroup.Text>
                            <Form.Control 
                                type="text" 
                                placeholder="ex: www.minhaloja.com.br" 
                                value={dominio}
                                onChange={(e) => setDominio(e.target.value)}
                                className="border-start-0 ps-0"
                                style={{ height: '48px' }}
                            />
                            <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={saving}
                                className="px-4 fw-bold"
                            >
                                {saving ? <Spinner size="sm" animation="border" /> : 'Salvar Domínio'}
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Não digite https://, apenas o www e o nome do seu site.
                        </Form.Text>
                    </Form.Group>
                </Form>

                {/* Instruções de DNS só aparecem se tiver domínio salvo */}
                {dominioSalvo && (
                    <div className="bg-light p-4 rounded-4 border border-primary border-opacity-10 position-relative overflow-hidden">
                        <div className="position-absolute top-0 start-0 w-100 bg-primary bg-opacity-10" style={{ height: '4px' }}></div>
                        
                        <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                            <i className="bi bi-router text-primary me-2 fs-5"></i> 
                            Configuração de DNS (Obrigatório)
                        </h6>
                        <p className="small text-muted mb-4">
                            Para o seu site ir ao ar, você precisa acessar o painel da empresa onde comprou este domínio (como Registro.br, GoDaddy, etc) e criar o apontamento abaixo:
                        </p>
                        
                        <div className="table-responsive rounded-3 border shadow-sm mb-3">
                            <table className="table table-hover bg-white mb-0 align-middle text-center">
                                <thead className="table-light">
                                    <tr className="small text-muted text-uppercase">
                                        <th className="fw-semibold">Tipo</th>
                                        <th className="fw-semibold">Nome (Host)</th>
                                        <th className="fw-semibold">Destino / Aponta para</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><span className="badge bg-secondary px-3 py-2 rounded-pill">CNAME</span></td>
                                        <td className="fw-bold text-dark">www</td>
                                        <td>
                                            <span className="text-primary font-monospace bg-primary bg-opacity-10 px-3 py-1 rounded-2 fw-semibold">
                                                cname.manateechat.shop
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="d-flex align-items-start mt-3">
                            <i className="bi bi-clock-history text-warning me-2 fs-5"></i>
                            <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                <strong>Atenção:</strong> Após criar o registro CNAME no seu provedor, a internet pode levar de <strong>1 a 24 horas</strong> para propagar a mudança e o cadeado de segurança ser ativado.
                            </p>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};
// --- FIM DO COMPONENTE INTERNO DE DOMÍNIO ---


const AppearanceManager = ({ hideTabs, onUpdate }) => {
    const [settings, setSettings] = useState({
        SITE_TITLE: '',        
        FAVICON_URL: '',       
        HEADER_PRIMARY_COLOR: '#ffc107',
        HEADER_SECONDARY_COLOR: '#0d6efd',
        FOOTER_COLOR: '#212529',
        LOGO_URL: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/configuracoes/appearance');
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                setError('Não foi possível carregar as configurações.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSuccess(''); 
        const { name, value } = e.target;
        const newSettings = { ...settings, [name]: value };
        setSettings(newSettings);

        // Notifica o Customizer/Sandbox em tempo real
        if (onUpdate) {
            onUpdate(newSettings);
        }
    };

    // 🚀 NOVO: Recebe a URL diretamente do ImageUpload (Cloudinary ou Rota Local)
    const handleLogoUploadSuccess = (imageUrl) => {
        const updated = { ...settings, LOGO_URL: imageUrl };
        setSettings(updated);
        
        if (onUpdate) onUpdate(updated);
        setSuccess('Logo alterado! Não esqueça de Salvar Tudo no final.');
    };

    // 🟢 ATUALIZADO: Usando a nova rota inteligente de UPLOAD LOCAL
    const uploadFaviconHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file); 
        setUploadingFavicon(true);
        try {
            // 🟢 Apontamos para a nova rota de imagens locais passando o parametro favicon
            const { data } = await api.post('/upload/favicon', formData); 
            
            const updated = { ...settings, FAVICON_URL: data.imagePath };
            setSettings(updated);
            if (onUpdate) onUpdate(updated);
            
            // Avisa o usuário que a imagem subiu e ele deve confirmar o salvamento
            setSuccess('Favicon enviado com sucesso! Clique em Salvar Tudo para concluir.');
        } catch (error) { 
            console.error("Erro no upload do Favicon:", error);
            setError('Erro no upload do Favicon. Verifique sua conexão e tente novamente.'); 
        } finally { 
            setUploadingFavicon(false); 
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.put('/configuracoes/appearance', settings);
            setSuccess('Configurações salvas!');
        } catch (err) { 
            setError('Erro ao salvar.'); 
        } finally { 
            setSaving(false); 
        }
    };

    const apiBaseUrl = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace('/api', '') 
        : 'http://localhost:5000';

    let previewLogoUrl = '/logo-placeholder.png';
    if (settings.LOGO_URL) {
        const cleanPath = settings.LOGO_URL.startsWith('/') ? settings.LOGO_URL : `/${settings.LOGO_URL}`;
        previewLogoUrl = settings.LOGO_URL.startsWith('http') ? settings.LOGO_URL : `${apiBaseUrl}${cleanPath}`;
    }

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    if (hideTabs) {
        return (
            <div className="compact-appearance-editor">
                <GeneralSettings 
                    settings={settings} 
                    handleChange={handleChange} 
                    uploadFaviconHandler={uploadFaviconHandler}
                    uploadingFavicon={uploadingFavicon}
                    apiBaseUrl={apiBaseUrl}
                />
                <hr className="my-4" />
                <ColorSettings settings={settings} handleChange={handleChange} />
                <hr className="my-4" />
                
                {/* 🚀 Passando a URL e a função nova */}
                <LogoSettings 
                    uploadFileHandler={handleLogoUploadSuccess} 
                    uploading={uploading} 
                    currentLogoUrl={previewLogoUrl}
                />
                
                <button id="btn-save-appearance" onClick={handleSubmit} style={{ display: 'none' }}></button>
            </div>
        );
    }

    return (
        <Tab.Container defaultActiveKey="identidade">
            <div className="d-flex overflow-auto pb-2 mb-4 no-scrollbar">
                <Nav variant="pills" className="bg-light p-2 rounded-3 d-inline-flex flex-nowrap">
                    <Nav.Item><Nav.Link eventKey="identidade" className="px-4 text-nowrap">Identidade Visual</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="organizacao" className="px-4 text-nowrap">Organização da Home</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="rodape" className="px-4 text-nowrap">Rodapé</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="redes" className="px-4 text-nowrap">Redes Sociais</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="dominio" className="px-4 text-nowrap">Domínio</Nav.Link></Nav.Item>
                </Nav>
            </div>

            <Tab.Content>
                <Tab.Pane eventKey="identidade">
                    <Form onSubmit={handleSubmit}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="mb-0 fw-bold">Personalização Básica</h5>
                            <Button type="submit" disabled={saving}>
                                {saving ? <Spinner size="sm" animation="border" /> : 'Salvar Tudo'}
                            </Button>
                        </div>
                        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                        <Row className="g-4">
                            <Col lg={7}>
                                <GeneralSettings settings={settings} handleChange={handleChange} uploadFaviconHandler={uploadFaviconHandler} uploadingFavicon={uploadingFavicon} apiBaseUrl={apiBaseUrl} />
                                <ColorSettings settings={settings} handleChange={handleChange} />
                                
                                <LogoSettings 
                                    uploadFileHandler={handleLogoUploadSuccess} 
                                    uploading={uploading} 
                                    currentLogoUrl={previewLogoUrl}
                                />
                                
                            </Col>
                            <Col lg={5}>
                                <LivePreview settings={settings} previewLogoUrl={previewLogoUrl} />
                            </Col>
                        </Row>
                    </Form>
                </Tab.Pane>

                <Tab.Pane eventKey="organizacao">
                    <div className="bg-white p-3 rounded-3 border shadow-sm">
                        <PageLayoutManager />
                    </div>
                </Tab.Pane>

                <Tab.Pane eventKey="rodape"><FooterManager /></Tab.Pane>
                <Tab.Pane eventKey="redes"><SocialMediaManager /></Tab.Pane>
                
                <Tab.Pane eventKey="dominio">
                    <div className="bg-white p-3 rounded-3 border shadow-sm">
                        <DomainSettings />
                    </div>
                </Tab.Pane>

            </Tab.Content>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .nav-pills .nav-link { color: #6c757d; font-weight: 500; transition: 0.3s; }
                .nav-pills .nav-link.active { background-color: #0d6efd; color: white; box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2); }
                
                .compact-appearance-editor .card { border: none !important; padding: 0 !important; background: transparent !important; }
                .compact-appearance-editor .row { margin: 0; }
                .compact-appearance-editor .col-lg-7 { width: 100% !important; padding: 0; }
            `}</style>
        </Tab.Container>
    );
};

export default AppearanceManager;