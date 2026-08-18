import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Badge, Button, Container } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Imports dos Modais
import MercadoLivreModal from '../../components/modules/integrations/MercadoLivreModal';
import TikTokModal from '../../components/modules/integrations/TikTokModal';
import SqlLegacyModal from '../../components/modules/integrations/SqlLegacyModal';
import ImgBBModal from '../../components/modules/integrations/ImgBBModal';
import CloudinaryModal from '../../components/modules/integrations/CloudinaryModal';
import GoogleModal from '../../components/modules/integrations/GoogleModal';
import FacebookModal from '../../components/modules/integrations/FacebookModal';
import WhatsAppModal from '../../components/modules/integrations/WhatsAppModal';
import IfoodModal from '../../components/modules/integrations/IfoodModal';
import AiConfigModal from '../../components/modules/integrations/AiConfigModal';

// ============================================================================
// 💳 COMPONENTE CARD MINIMALISTA
// ============================================================================
const MinimalCard = ({ title, icon, status, onClick, color, description, customIcon, disabled = false }) => {
    const isConfigured = !!status;
    return (
        <Col xs={12} sm={6} lg={4} xl={3}>
            <div
                className={`h-100 p-3 p-md-4 rounded-4 position-relative transition-all bg-white border border-light d-flex flex-column ${!disabled ? 'shadow-hover' : ''}`}
                style={{
                    transition: 'all 0.2s ease-in-out',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1
                }}
                onClick={!disabled ? onClick : undefined}
            >
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 gap-2">
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: '40px', height: '40px', backgroundColor: `${color}15`, filter: disabled ? 'grayscale(100%)' : 'none' }}
                    >
                        {customIcon ? (
                            <span style={{ fontSize: '1.2rem' }}>{customIcon}</span>
                        ) : (
                            <img src={icon} alt={title} width="20" style={{ objectFit: 'contain', filter: disabled ? 'grayscale(100%)' : 'none' }} />
                        )}
                    </div>

                    {disabled ? (
                        <Badge bg="warning" text="dark" className="fw-bold rounded-pill px-2 py-1 text-center" style={{ fontSize: '0.6rem' }}>
                            Em Breve
                        </Badge>
                    ) : (
                        <Badge bg={isConfigured ? 'success' : 'light'} text={isConfigured ? 'white' : 'muted'} className="fw-normal rounded-pill px-2 py-1 text-center" style={{ fontSize: '0.6rem' }}>
                            {isConfigured ? 'Conectado' : 'Configurar'}
                        </Badge>
                    )}
                </div>

                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{title}</h6>

                {description && (
                    <p className="text-muted mb-3 d-none d-sm-block" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                        {description}
                    </p>
                )}

                {!disabled && (
                    <div className="mt-auto pt-2 border-top">
                        <span className="text-primary fw-bold text-uppercase d-flex align-items-center justify-content-center justify-content-sm-start" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                            <i className="bi bi-gear-fill me-1"></i> <span className="d-none d-sm-inline">Gerenciar</span>
                        </span>
                    </div>
                )}
            </div>
        </Col>
    );
};

// ============================================================================
// 🚀 PÁGINA PRINCIPAL
// ============================================================================
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
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [showIfood, setShowIfood] = useState(false); // 🍔 NOVO ESTADO AQUI
    const [legacyData, setLegacyData] = useState(null);
    const [showAi, setShowAi] = useState(false);

    const fetchKeyStatus = async (isBackground = false) => {
        // Só mostra o Spinner se NÃO for background
        if (!isBackground) setLoading(true);

        try {
            const [
                mlRes, tiktokRes, legacyRes, imgbbRes, cloudRes, googleRes, fbRes, imgProviderRes, whatsappRes, ifoodRes // 🍔 ADICIONADO ifoodRes
            ] = await Promise.all([
                api.get('/apikeys/mercadolivre').catch(() => ({ data: {} })),
                api.get('/apikeys/tiktok').catch(() => ({ data: {} })),
                api.get('/integracao').catch(() => ({ data: {} })),
                api.get('/apikeys/imgbb').catch(() => ({ data: {} })),
                api.get('/apikeys/cloudinary').catch(() => ({ data: {} })),
                api.get('/usuarios/google-client-id').catch(() => ({ data: {} })),
                api.get('/apikeys/facebook').catch(() => ({ data: {} })),
                api.get('/configuracoes/UPLOAD_PROVIDER').catch(() => ({ data: { valor: 'imgbb' } })),
                api.get('/whatsapp/status').catch(() => ({ data: { status: 'DISCONNECTED' } })),
                api.get('/ifood/status').catch(() => ({ data: { connected: false } })) // 🍔 NOVA CHAMADA AQUI
            ]);

            setKeyStatus({
                MERCADO_LIVRE_CONFIGURED: mlRes.data?.MERCADO_LIVRE_ACCESS_TOKEN || mlRes.data?.MERCADO_LIVRE_REFRESH_TOKEN,
                TIKTOK_APP_KEY: tiktokRes.data?.TIKTOK_APP_KEY,
                IS_LEGACY_CONFIGURED: legacyRes.data && legacyRes.data.host,
                IMGBB_API_KEY: imgbbRes.data?.IMGBB_API_KEY,
                CLOUDINARY_CONFIGURED: cloudRes.data?.CLOUDINARY_CLOUD_NAME,
                GOOGLE_CLIENT_ID: googleRes.data?.clientId,
                FACEBOOK_CONFIGURED: fbRes.data?.FB_PIXEL_ID,
                WHATSAPP_CONFIGURED: whatsappRes.data?.status === 'CONNECTED',
                IFOOD_CONFIGURED: ifoodRes.data?.connected // 🍔 NOVO STATUS AQUI
            });

            setActiveImgProvider(imgProviderRes.data?.valor || 'imgbb');
            if (legacyRes.data) setLegacyData(legacyRes.data);

        } catch (err) {
            console.warn("Erro ao buscar status:", err);
            setError("Algumas configurações não puderam ser carregadas.");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => { fetchKeyStatus(false); }, []);

    // 🟢 2. Passe true para fazer em background e não piscar a tela
    const handleSuccess = (msg) => {
        if (msg) setSuccess(msg);
        fetchKeyStatus(true);
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

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-3 p-md-4">
            {/* CABEÇALHO MOBILE-FIRST */}
            <div className="mb-4 mb-md-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Conexões & Integrações</h4>
                    <p className="text-muted mb-0 small">Gerencie integrações de marketing, comunicação e armazenamento.</p>
                </div>
                <Button
                    variant="dark"
                    onClick={() => navigate('/admin/gateway-config')}
                    className="fw-bold shadow-sm w-100 w-md-auto py-2 py-md-1"
                >
                    <i className="bi bi-credit-card-2-front me-2"></i> Configurar Pagamentos
                </Button>
            </div>

            {error && <Alert variant="danger" className="border-0 rounded-3 small">{error}</Alert>}
            {success && <Alert variant="success" className="border-0 rounded-3 small">{success}</Alert>}

            {/* COMUNICAÇÃO & ATENDIMENTO */}
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small" style={{ letterSpacing: '1px' }}>Comunicação & Atendimento</h6>
            <Row className="g-3 g-md-4 mb-5">
                <MinimalCard
                    title="WhatsApp Bot"
                    status={keyStatus.WHATSAPP_CONFIGURED}
                    customIcon={<i className="bi bi-whatsapp text-success"></i>}
                    color="#25D366"
                    onClick={() => setShowWhatsApp(true)}
                    description="Notificações e rastreio automáticos."
                />
                <MinimalCard
                    title="Configuração da IA (BETA)"
                    status={true}
                    // 🟢 MUDANÇA: Use a prop 'icon' para que o componente trate o tamanho e o círculo automaticamente
                    icon="/images/groq.png"
                    color="#0D6EFD"
                    onClick={() => setShowAi(true)}
                    description="Controle o comportamento e automação do robô."
                />
            </Row>

            {/* MARKETPLACE & MARKETING */}
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small" style={{ letterSpacing: '1px' }}>Marketplace & Marketing</h6>
            <Row className="g-3 g-md-4 mb-5">
                <MinimalCard title="Mercado Livre" status={keyStatus.MERCADO_LIVRE_CONFIGURED} icon="/images/mercado-livre-logo-vertical-2.png" color="#FFE600" onClick={() => setShowML(true)} description="Sincronize produtos e pedidos." />

                {/* 🍔 NOVO CARD DO IFOOD AQUI */}
                <MinimalCard
                    title="iFood"
                    status={keyStatus.IFOOD_CONFIGURED}
                    // 🟢 MUDANÇA: Agora usando o ícone local do iFood
                    icon="/images/ifood.png"
                    color="#EA1D2C"
                    onClick={() => setShowIfood(true)}
                    description="Gestão de delivery e catálogo."
                />

                <MinimalCard disabled title="Facebook Pixel" status={keyStatus.FACEBOOK_CONFIGURED} icon="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png" color="#1877F2" onClick={() => setShowFacebook(true)} description="Rastreamento e catálogo." />
                <MinimalCard disabled title="TikTok Shop" status={keyStatus.TIKTOK_APP_KEY} icon="/images/tiktok.avif" color="#000000" onClick={() => setShowTikTok(true)} description="Integração social commerce." />
                <MinimalCard title="Google Login" status={keyStatus.GOOGLE_CLIENT_ID} icon="/images/google-color.png" color="#EA4335" onClick={() => setShowGoogle(true)} description="Autenticação rápida para clientes." />
                <MinimalCard title="ERP Legacy" status={keyStatus.IS_LEGACY_CONFIGURED} icon="/images/sql-server-logo.png" color="#4B5563" onClick={() => setShowLegacy(true)} description="Conexão com banco SQL." />
            </Row>

            {/* ARMAZENAMENTO */}
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small" style={{ letterSpacing: '1px' }}>Armazenamento</h6>
            <Row className="g-3 g-md-4 mb-4">
                <MinimalCard title="ImgBB" icon="/images/imgbb.png" color="#2a2e37" status={keyStatus.IMGBB_API_KEY} onClick={() => setShowImgBB(true)} description="Hospedagem básica gratuita." />
                <MinimalCard title="Cloudinary" icon="https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo_for_white_bg.svg" color="#3448C5" status={keyStatus.CLOUDINARY_CONFIGURED} onClick={() => setShowCloudinary(true)} description="Otimização de imagens." />
            </Row>

            {/* BOTÕES DE ARMAZENAMENTO RESPONSIVOS */}
            <div className="p-3 p-md-4 bg-white rounded-4 border border-light shadow-sm d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-5">
                <div className="d-flex flex-column">
                    <span className="text-muted small mb-1">Armazenamento Padrão</span>
                    <strong className="text-dark fs-6">{activeImgProvider === 'imgbb' ? 'ImgBB' : 'Cloudinary'}</strong>
                </div>
                <div className="d-flex w-100 w-md-auto gap-2">
                    <Button
                        variant={activeImgProvider === 'imgbb' ? 'primary' : 'light'}
                        className={`flex-fill fw-medium ${activeImgProvider !== 'imgbb' ? 'text-muted border' : ''}`}
                        onClick={() => handleSetImgProvider('imgbb')}
                    >
                        ImgBB
                    </Button>
                    <Button
                        variant={activeImgProvider === 'cloudinary' ? 'primary' : 'light'}
                        className={`flex-fill fw-medium ${activeImgProvider !== 'cloudinary' ? 'text-muted border' : ''}`}
                        onClick={() => handleSetImgProvider('cloudinary')}
                    >
                        Cloudinary
                    </Button>
                </div>
            </div>

            {/* MODAIS */}
            <MercadoLivreModal show={showML} onHide={() => setShowML(false)} isConfigured={keyStatus.MERCADO_LIVRE_CONFIGURED} onUpdateSuccess={handleSuccess} />
            <TikTokModal show={showTikTok} onHide={() => setShowTikTok(false)} onUpdateSuccess={handleSuccess} />
            <SqlLegacyModal show={showLegacy} onHide={() => setShowLegacy(false)} initialData={legacyData} onUpdateSuccess={handleSuccess} />
            <GoogleModal show={showGoogle} onHide={() => setShowGoogle(false)} onUpdateSuccess={handleSuccess} />
            <FacebookModal show={showFacebook} onHide={() => setShowFacebook(false)} onUpdateSuccess={handleSuccess} />
            <ImgBBModal show={showImgBB} onHide={() => setShowImgBB(false)} isConfigured={keyStatus.IMGBB_API_KEY} onUpdateSuccess={handleSuccess} />
            <CloudinaryModal show={showCloudinary} onHide={() => setShowCloudinary(false)} isConfigured={keyStatus.CLOUDINARY_CONFIGURED} onUpdateSuccess={handleSuccess} />
            <WhatsAppModal show={showWhatsApp} onHide={() => setShowWhatsApp(false)} onUpdateSuccess={handleSuccess} />
            <IfoodModal show={showIfood} onHide={() => setShowIfood(false)} isConfigured={keyStatus.IFOOD_CONFIGURED} onUpdateSuccess={handleSuccess} /> {/* 🍔 NOVO MODAL AQUI */}
            <AiConfigModal show={showAi} onHide={() => setShowAi(false)} onUpdateSuccess={handleSuccess} />

            <style>{`
                .shadow-hover:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.08)!important; }
                .w-md-auto { width: auto !important; }
                @media (min-width: 768px) {
                    .w-md-auto { width: auto !important; }
                }
            `}</style>
        </Container>
    );
};

export default ApiKeysPage;