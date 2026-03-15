import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Badge, Button, Container } from 'react-bootstrap';
import api from '../services/api'; 
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Imports dos Modais (Caminhos Ajustados)
import MercadoLivreModal from '../components/modules/integrations/MercadoLivreModal';
import TikTokModal from '../components/modules/integrations/TikTokModal';
import SqlLegacyModal from '../components/modules/integrations/SqlLegacyModal';
import ImgBBModal from '../components/modules/integrations/ImgBBModal';
import CloudinaryModal from '../components/modules/integrations/CloudinaryModal';
import GoogleModal from '../components/modules/integrations/GoogleModal';
import FacebookModal from '../components/modules/integrations/FacebookModal';

// Componente de Card Minimalista
const MinimalCard = ({ title, icon, status, onClick, color, description, customIcon }) => {
    const isConfigured = !!status;
    return (
        <Col md={6} lg={4} xl={3}>
            <div 
                className="h-100 p-4 rounded-4 position-relative transition-all bg-white border border-light shadow-hover"
                style={{ transition: 'all 0.2s ease-in-out', cursor: 'pointer' }}
                onClick={onClick}
            >
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: '48px', height: '48px', backgroundColor: `${color}15` }} 
                    >
                        {customIcon ? <span style={{ fontSize: '1.5rem' }}>{customIcon}</span> : <img src={icon} alt={title} width="24" style={{ objectFit: 'contain' }} />}
                    </div>
                    <Badge bg={isConfigured ? 'success' : 'light'} text={isConfigured ? 'white' : 'muted'} className="fw-normal rounded-pill px-3 py-2">
                        {isConfigured ? 'Conectado' : 'Não Configurado'}
                    </Badge>
                </div>
                <h6 className="fw-bold text-dark mb-1">{title}</h6>
                {description && <p className="text-muted small mb-3" style={{fontSize: '0.85rem', lineHeight: '1.4'}}>{description}</p>}
                <div className="mt-3">
                    <span className="text-primary small fw-bold text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
                        <i className="bi bi-gear-fill me-1"></i> Gerenciar Chaves
                    </span>
                </div>
            </div>
        </Col>
    );
};

const ApiKeysPage = () => {
    const navigate = useNavigate();
    const [keyStatus, setKeyStatus] = useState({});
    const [activeImgProvider, setActiveImgProvider] = useState('imgbb');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados dos Modais
    const [showML, setShowML] = useState(false);
    const [showTikTok, setShowTikTok] = useState(false);
    const [showLegacy, setShowLegacy] = useState(false);
    const [showGoogle, setShowGoogle] = useState(false);
    const [showFacebook, setShowFacebook] = useState(false);
    const [showImgBB, setShowImgBB] = useState(false);
    const [showCloudinary, setShowCloudinary] = useState(false);
    const [legacyData, setLegacyData] = useState(null);

    const fetchKeyStatus = async () => {
        setLoading(true);
        try {
            const [
                mlRes, tiktokRes, legacyRes, imgbbRes, cloudRes, googleRes, fbRes, imgProviderRes 
            ] = await Promise.all([
                api.get('/apikeys/mercadolivre').catch(() => ({ data: {} })),
                api.get('/apikeys/tiktok').catch(() => ({ data: {} })),
                api.get('/integracao').catch(() => ({ data: {} })),
                api.get('/apikeys/imgbb').catch(() => ({ data: {} })),
                api.get('/apikeys/cloudinary').catch(() => ({ data: {} })),
                api.get('/usuarios/google-client-id').catch(() => ({ data: {} })),
                api.get('/apikeys/facebook').catch(() => ({ data: {} })),
                api.get('/configuracoes/UPLOAD_PROVIDER').catch(() => ({ data: { valor: 'imgbb' } }))
            ]);

            setKeyStatus({
                MERCADO_LIVRE_APP_ID: mlRes.data?.MERCADO_LIVRE_APP_ID,
                TIKTOK_APP_KEY: tiktokRes.data?.TIKTOK_APP_KEY,
                IS_LEGACY_CONFIGURED: legacyRes.data && legacyRes.data.host,
                IMGBB_API_KEY: imgbbRes.data?.IMGBB_API_KEY,
                CLOUDINARY_CONFIGURED: cloudRes.data?.CLOUDINARY_CLOUD_NAME,
                GOOGLE_CLIENT_ID: googleRes.data?.clientId,
                FACEBOOK_CONFIGURED: fbRes.data?.FB_PIXEL_ID,
            });

            setActiveImgProvider(imgProviderRes.data?.valor || 'imgbb');
            if (legacyRes.data) setLegacyData(legacyRes.data);

        } catch (err) {
            console.warn("Erro ao buscar status:", err);
            setError("Algumas configurações não puderam ser carregadas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKeyStatus(); }, []);

    const handleSuccess = (msg) => {
        setSuccess(msg);
        fetchKeyStatus();
        setTimeout(() => setSuccess(''), 3000); 
    };

    const handleSetImgProvider = async (provider) => {
        try {
            await api.post('/configuracoes', { chave: 'UPLOAD_PROVIDER', valor: provider });
            setActiveImgProvider(provider);
            toast.success('Provedor de imagem alterado!');
        } catch (err) {
            toast.error("Erro ao alterar provedor de imagem.");
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-4">
            <div className="mb-5 d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Conexões & Integrações</h4>
                    <p className="text-muted mb-0">Gerencie integrações de marketing e armazenamento.</p>
                </div>
                <Button variant="dark" onClick={() => navigate('/admin/gateway-config')} className="fw-bold shadow-sm">
                    <i className="bi bi-credit-card-2-front me-2"></i> Configurar Pagamentos
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">Marketplace & Marketing</h6>
            <Row className="g-4 mb-5">
                <MinimalCard title="Mercado Livre" status={keyStatus.MERCADO_LIVRE_APP_ID} icon="/images/mercado-livre-logo-vertical-2.png" color="#FFE600" onClick={() => setShowML(true)} description="Sincronize produtos e pedidos." />
                <MinimalCard title="Facebook Pixel" status={keyStatus.FACEBOOK_CONFIGURED} icon="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png" color="#1877F2" onClick={() => setShowFacebook(true)} description="Rastreamento e catálogo de anúncios." />
                <MinimalCard title="TikTok Shop" status={keyStatus.TIKTOK_APP_KEY} icon="/images/tiktok.png" color="#000000" onClick={() => setShowTikTok(true)} description="Integração social commerce." />
                <MinimalCard title="Google Login" status={keyStatus.GOOGLE_CLIENT_ID} icon="/images/google-color.png" color="#EA4335" onClick={() => setShowGoogle(true)} description="Autenticação rápida para clientes." />
                <MinimalCard title="ERP Legacy" status={keyStatus.IS_LEGACY_CONFIGURED} icon="/images/sql-server-logo.png" color="#4B5563" onClick={() => setShowLegacy(true)} description="Conexão com banco de dados SQL." />
            </Row>

            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">Armazenamento</h6>
            <Row className="g-4 mb-4">
                <MinimalCard title="ImgBB" icon="/images/imgbb.png" color="#2a2e37" status={keyStatus.IMGBB_API_KEY} onClick={() => setShowImgBB(true)} description="Hospedagem básica gratuita." />
                <MinimalCard title="Cloudinary" icon="https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo_for_white_bg.svg" color="#3448C5" status={keyStatus.CLOUDINARY_CONFIGURED} onClick={() => setShowCloudinary(true)} description="Otimização automática de imagens." />
            </Row>
            
            <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mb-5">
                <span className="text-muted small">Provedor Ativo: <strong>{activeImgProvider === 'imgbb' ? 'ImgBB' : 'Cloudinary'}</strong></span>
                <div>
                    <Button variant={activeImgProvider === 'imgbb' ? 'primary' : 'outline-secondary'} size="sm" className="me-2" onClick={() => handleSetImgProvider('imgbb')}>Usar ImgBB</Button>
                    <Button variant={activeImgProvider === 'cloudinary' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => handleSetImgProvider('cloudinary')}>Usar Cloudinary</Button>
                </div>
            </div>

            <MercadoLivreModal show={showML} onHide={() => setShowML(false)} isConfigured={keyStatus.MERCADO_LIVRE_APP_ID} onUpdateSuccess={handleSuccess} />
            <TikTokModal show={showTikTok} onHide={() => setShowTikTok(false)} onUpdateSuccess={handleSuccess} />
            <SqlLegacyModal show={showLegacy} onHide={() => setShowLegacy(false)} initialData={legacyData} onUpdateSuccess={handleSuccess} />
            <GoogleModal show={showGoogle} onHide={() => setShowGoogle(false)} onUpdateSuccess={handleSuccess} />
            <FacebookModal show={showFacebook} onHide={() => setShowFacebook(false)} onUpdateSuccess={handleSuccess} />
            <ImgBBModal show={showImgBB} onHide={() => setShowImgBB(false)} isConfigured={keyStatus.IMGBB_API_KEY} onUpdateSuccess={handleSuccess} />
            <CloudinaryModal show={showCloudinary} onHide={() => setShowCloudinary(false)} isConfigured={keyStatus.CLOUDINARY_CONFIGURED} onUpdateSuccess={handleSuccess} />

            <style>{`
                .shadow-hover:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }
            `}</style>
        </Container>
    );
};

export default ApiKeysPage;