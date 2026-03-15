import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { FaQrcode, FaCreditCard, FaBarcode, FaMoneyCheckAlt, FaSave, FaSync, FaGlobe, FaCog, FaWallet, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

// Imports dos Modais de Pagamento
import MercadoPagoModal from '../../components/modules/integrations/MercadoPagoModal';
import StripeModal from '../../components/modules/integrations/StripeModal.jsx'; 
import AsaasModal from '../../components/modules/integrations/AsaasModal.jsx';
import AbacatePayModal from '../../components/modules/integrations/AbacatePayModal';
import CieloModal from '../../components/modules/integrations/CieloModal';

// --- COMPONENTE DE CARD PARA CREDENCIAIS ---
const CredentialCard = ({ title, icon, status, onClick, color, description, customIcon }) => {
    const isConfigured = !!status;
    return (
        <Col md={6} lg={3}>
            <div 
                className="h-100 p-3 rounded-4 bg-white border border-light shadow-hover d-flex flex-column justify-content-between"
                style={{ transition: 'all 0.2s ease-in-out', cursor: 'pointer' }}
                onClick={onClick}
            >
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div 
                            className="d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
                            style={{ width: '40px', height: '40px', backgroundColor: `${color}15` }} 
                        >
                            {customIcon ? (
                                <span style={{ fontSize: '1.5rem' }}>{customIcon}</span> 
                            ) : (
                                <img 
                                    src={icon} 
                                    alt={title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                />
                            )}
                        </div>
                        
                        <Badge bg={isConfigured ? 'success' : 'light'} text={isConfigured ? 'white' : 'muted'} className="fw-normal rounded-pill px-2 py-1 small">
                            {isConfigured ? 'OK' : 'Off'}
                        </Badge>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{title}</h6>
                    <p className="text-muted small mb-0" style={{fontSize: '0.75rem', lineHeight: '1.3'}}>{description}</p>
                </div>
                <div className="mt-3 border-top pt-2">
                    <span className="text-primary small fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>
                        <i className="bi bi-gear-fill me-1"></i> Configurar Chaves
                    </span>
                </div>
            </div>
        </Col>
    );
};

const GatewayConfig = () => {
    const [rules, setRules] = useState([]);
    const [availableProviders, setAvailableProviders] = useState({}); 
    const [keyStatus, setKeyStatus] = useState({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [showMP, setShowMP] = useState(false);
    const [showStripe, setShowStripe] = useState(false);
    const [showAsaas, setShowAsaas] = useState(false);
    const [showAbacate, setShowAbacate] = useState(false);
    const [showCielo, setShowCielo] = useState(false);

    const methodMetadata = {
        PIX: { label: 'PIX Instantâneo', icon: <FaQrcode className="text-success" size={24} /> },
        CREDITCARD: { label: 'Cartão de Crédito', icon: <FaCreditCard className="text-primary" size={24} /> },
        CREDIT_CARD: { label: 'Cartão de Crédito', icon: <FaCreditCard className="text-primary" size={24} /> },
        BOLETO: { label: 'Boleto Bancário', icon: <FaBarcode className="text-dark" size={24} /> },
        DEBITCARD: { label: 'Cartão de Débito', icon: <FaMoneyCheckAlt className="text-info" size={24} /> },
        DEBIT_CARD: { label: 'Cartão de Débito', icon: <FaMoneyCheckAlt className="text-info" size={24} /> },
        WALLET: { label: 'Carteira Digital', icon: <FaWallet className="text-warning" size={24} /> },
        
        OFFLINE_CASH: { label: 'Dinheiro', icon: <FaMoneyBillWave className="text-success" size={24} /> },
        OFFLINE_CREDIT: { label: 'Crédito (Maquininha)', icon: <FaCreditCard className="text-warning" size={24} /> },
        OFFLINE_DEBIT: { label: 'Débito (Maquininha)', icon: <FaCreditCard className="text-secondary" size={24} /> },
        OFFLINE_PIX: { label: 'PIX (Maquininha)', icon: <FaQrcode className="text-info" size={24} /> }
    };

    const fetchData = async () => {
        try {
            const [rulesRes, optionsRes, credsRes] = await Promise.all([
                api.get('/payment-gateways/gateways'),
                api.get('/payment-gateways/gateways/options'),
                api.get('/payment-gateways/credentials').catch(() => ({ data: {} }))
            ]);

            let loadedRules = rulesRes.data || [];
            
            // 🟢 INJEÇÃO DOS MÉTODOS ONLINE (Caso o banco não tenha ainda)
            const onlineTypes = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'WALLET'];
            onlineTypes.forEach(type => {
                if (!loadedRules.find(r => r.method === type)) {
                    loadedRules.push({ method: type, provider: '', is_active: false });
                }
            });

            // 🟢 INJEÇÃO DOS MÉTODOS OFFLINE (Caso o banco não tenha ainda)
            const offlineTypes = ['OFFLINE_CASH', 'OFFLINE_CREDIT', 'OFFLINE_DEBIT', 'OFFLINE_PIX'];
            offlineTypes.forEach(type => {
                if (!loadedRules.find(r => r.method === type)) {
                    loadedRules.push({ method: type, provider: 'OFFLINE', is_active: false });
                }
            });

            setRules(loadedRules);
            setAvailableProviders(optionsRes.data);

            const creds = credsRes.data || {};
            setKeyStatus({
                MERCADOPAGO: !!creds.MERCADOPAGO_ACCESS_TOKEN,
                STRIPE: !!creds.STRIPE_SECRET_KEY,
                ASAAS: !!creds.ASAAS_API_KEY,
                ABACATEPAY: !!creds.ABACATEPAY_API_KEY,
                CIELO: !!creds.CIELO_MERCHANT_ID 
            });

        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            toast.error('Erro ao carregar configurações do servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSuccess = () => {
        fetchData();
        toast.success("Chaves atualizadas com sucesso!");
    };

    const handleLocalUpdate = (method, field, value) => {
        setRules(prevRules => prevRules.map(r => 
            r.method === method ? { ...r, [field]: value } : r
        ));
    };

    const handleSaveModular = async () => {
        setSaving(true);
        try {
            await api.post('/payment-gateways/gateways/update', { rules });
            toast.success('Roteamento de pagamentos atualizado!');
        } catch (error) {
            toast.error('Erro ao salvar roteamento.');
        } finally {
            setSaving(false);
        }
    };

    const handleApplyGlobal = async (providerName) => {
        if (!keyStatus[providerName]) {
            toast.warning(`Configure as chaves do ${providerName} antes de ativar o modo global.`);
            return;
        }

        if(!window.confirm(`Tem certeza que deseja processar TUDO pelo ${providerName}?`)) return;
        
        setLoading(true); 
        try {
            await api.post('/payment-gateways/gateways/preset', { provider: providerName });
            await fetchData(); 
            toast.success(`Modo Global ativado: Tudo via ${providerName}`);
        } catch (error) {
            toast.error('Erro ao aplicar preset global.');
            setLoading(false);
        }
    };

    const openConfigModal = (provider) => {
        if (provider === 'MERCADOPAGO') setShowMP(true);
        if (provider === 'STRIPE') setShowStripe(true);
        if (provider === 'ASAAS') setShowAsaas(true);
        if (provider === 'ABACATEPAY') setShowAbacate(true);
        if (provider === 'CIELO') setShowCielo(true);
    };

    const onlineRules = rules.filter(r => !r.method.startsWith('OFFLINE_'));
    const offlineRules = rules.filter(r => r.method.startsWith('OFFLINE_'));

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Gateways & Roteamento</h4>
                    <p className="text-muted mb-0">Configure suas credenciais e os métodos de pagamento (Online e na Entrega).</p>
                </div>
                <Button variant="success" size="lg" onClick={handleSaveModular} disabled={saving} className="shadow-sm rounded-pill px-4 fw-bold">
                    {saving ? <Spinner size="sm" animation="border"/> : <><FaSave className="me-2"/> Salvar Regras</>}
                </Button>
            </div>

            {/* SEÇÃO 1: CREDENCIAIS */}
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">1. Credenciais dos Gateways</h6>
            <Row className="g-3 mb-5">
                <CredentialCard title="Mercado Pago" status={keyStatus.MERCADOPAGO} icon="/images/mercado-pago-logo.png" color="#009EE3" description="Access Token e Public Key." onClick={() => setShowMP(true)} />
                <CredentialCard title="Stripe" status={keyStatus.STRIPE} icon="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" color="#635BFF" description="Secret e Public Keys." onClick={() => setShowStripe(true)} />
                <CredentialCard title="Asaas" status={keyStatus.ASAAS} icon="/images/asaas-logo.png" color="#0030b9" description="API Key de produção." onClick={() => setShowAsaas(true)} />
                <CredentialCard title="AbacatePay" status={keyStatus.ABACATEPAY} icon="/images/abacatepay.ico"  color="#83C635" description="Chave de API." onClick={() => setShowAbacate(true)} />
                <CredentialCard title="Cielo 3.0" status={keyStatus.CIELO} icon="/images/unnamed.png" color="#00A4E3" description="Merchant ID e Key." onClick={() => setShowCielo(true)} />
            </Row>

            <hr className="my-5 opacity-10" />

            {/* SEÇÃO 2: ROTEAMENTO ONLINE */}
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">2. Pagamentos Online (Site)</h6>
            
            <Card className="mb-4 border-primary shadow-sm bg-primary bg-opacity-10 border-0">
                <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                        <FaGlobe className="text-primary fs-3 me-3" />
                        <div>
                            <h6 className="fw-bold text-primary mb-0">Roteamento Rápido (Global)</h6>
                            <small className="text-muted">Use um único processador para tudo que for online.</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        {keyStatus.MERCADOPAGO && <Button variant="outline-primary" size="sm" onClick={() => handleApplyGlobal('MERCADOPAGO')}>Tudo MP</Button>}
                        {keyStatus.ASAAS && <Button variant="outline-primary" size="sm" onClick={() => handleApplyGlobal('ASAAS')}>Tudo Asaas</Button>}
                        {keyStatus.ABACATEPAY && <Button variant="outline-primary" size="sm" onClick={() => handleApplyGlobal('ABACATEPAY')}>Tudo Abacate</Button>}
                        {keyStatus.CIELO && <Button variant="outline-primary" size="sm" onClick={() => handleApplyGlobal('CIELO')}>Tudo Cielo</Button>}
                        
                        {!keyStatus.MERCADOPAGO && !keyStatus.ASAAS && !keyStatus.ABACATEPAY && !keyStatus.CIELO && (
                            <span className="text-muted small">Configure as chaves acima para habilitar.</span>
                        )}
                    </div>
                </Card.Body>
            </Card>

            <Row className="g-4 mb-5">
                {onlineRules.map((rule) => {
                    const meta = methodMetadata[rule.method] || { label: rule.method, icon: <FaSync /> };
                    const normalizedMethod = rule.method.replace(/_/g, '');
                    const rawOptions = availableProviders[normalizedMethod] || availableProviders[rule.method] || [];

                    return (
                        <Col key={rule.method} md={6} lg={4} xl={3}>
                            <Card className={`h-100 shadow-sm border-0 ${!rule.is_active ? 'bg-light opacity-75' : ''}`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center">
                                            <div className="me-3 fs-4 p-2 bg-white rounded shadow-sm text-center" style={{minWidth: '50px'}}>
                                                {meta.icon}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0">{meta.label}</h6>
                                                <Badge bg="secondary" className="fw-normal">{rule.method}</Badge>
                                            </div>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            checked={rule.is_active}
                                            onChange={(e) => handleLocalUpdate(rule.method, 'is_active', e.target.checked)}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </div>
                                    
                                    <hr className="opacity-10 my-3"/>

                                    <Form.Group>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="small text-muted fw-bold text-uppercase mb-0">Processador</Form.Label>
                                            <div 
                                                className="text-primary small cursor-pointer" 
                                                title={`Configurar chaves do ${rule.provider}`}
                                                style={{cursor: 'pointer'}}
                                                onClick={() => openConfigModal(rule.provider)}
                                            >
                                                <FaCog /> Configurar
                                            </div>
                                        </div>

                                        {/* 🟢 CORREÇÃO: Mostra todas as opções, marcando as que estão sem chave */}
                                        <Form.Select 
                                            value={rule.provider || ''} 
                                            onChange={(e) => handleLocalUpdate(rule.method, 'provider', e.target.value)}
                                            disabled={!rule.is_active}
                                            className="form-select"
                                        >
                                            <option value="">Selecione um processador...</option>
                                            {rawOptions.map(opt => {
                                                const hasKey = keyStatus[opt.value];
                                                return (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label} {!hasKey ? '(⚠️ Sem Chave)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </Form.Select>
                                        
                                        {!keyStatus[rule.provider] && rule.provider && rule.provider !== 'OFFLINE' && (
                                            <div className="mt-2 text-danger small fw-bold" style={{fontSize: '0.75rem'}}>
                                                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                Atenção: A chave do {rule.provider} não está configurada!
                                            </div>
                                        )}
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* SEÇÃO 3: PAGAMENTO NA ENTREGA (OFFLINE) */}
            <hr className="my-5 opacity-10" />
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">3. Pagamento na Entrega (Motoboy/Retirada)</h6>
            
            <Row className="g-4">
                {offlineRules.map((rule) => {
                    const meta = methodMetadata[rule.method];

                    return (
                        <Col key={rule.method} md={6} lg={4} xl={3}>
                            <Card className={`h-100 shadow-sm border-0 ${!rule.is_active ? 'bg-light opacity-75' : ''}`}>
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <div className="me-3 fs-4 p-2 bg-white rounded shadow-sm text-center" style={{minWidth: '50px'}}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0">{meta.label}</h6>
                                            <small className="text-muted">No ato da entrega</small>
                                        </div>
                                    </div>
                                    <Form.Check 
                                        type="switch"
                                        checked={rule.is_active}
                                        onChange={(e) => handleLocalUpdate(rule.method, 'is_active', e.target.checked)}
                                        style={{ transform: 'scale(1.3)' }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Modais de Configuração */}
            <MercadoPagoModal show={showMP} onHide={() => setShowMP(false)} isConfigured={keyStatus.MERCADOPAGO} onUpdateSuccess={handleSuccess} />
            <StripeModal show={showStripe} onHide={() => setShowStripe(false)} isConfigured={keyStatus.STRIPE} onUpdateSuccess={handleSuccess} />
            <AsaasModal show={showAsaas} onHide={() => setShowAsaas(false)} isConfigured={keyStatus.ASAAS} onUpdateSuccess={handleSuccess} />
            <AbacatePayModal show={showAbacate} onHide={() => setShowAbacate(false)} isConfigured={keyStatus.ABACATEPAY} onUpdateSuccess={handleSuccess} />
            <CieloModal show={showCielo} onHide={() => setShowCielo(false)} isConfigured={keyStatus.CIELO} onUpdateSuccess={handleSuccess} />

            <style>{`
                .shadow-hover:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }
                .ls-1 { letter-spacing: 1px; }
            `}</style>
        </Container>
    );
};

export default GatewayConfig;