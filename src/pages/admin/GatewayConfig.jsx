import React, { useState, useEffect } from 'react';
import { Container, Spinner, Button } from 'react-bootstrap';
import api from '../../services/api'; 
import { toast } from 'react-toastify';

// Importando os novos sub-componentes que criamos
import GatewayCredentials from '../../components/modules/GatewayManager/GatewayCredentials';
import PaymentRouting from '../../components/modules/GatewayManager/PaymentRouting';

// Imports dos Modais de Pagamento
import MercadoPagoModal from '../../components/modules/integrations/MercadoPagoModal';
import StripeModal from '../../components/modules/integrations/StripeModal.jsx'; 
import AsaasModal from '../../components/modules/integrations/AsaasModal.jsx';
import AbacatePayModal from '../../components/modules/integrations/AbacatePayModal';
import CieloModal from '../../components/modules/integrations/CieloModal';
// 🟢 NOVO MODAL DE TAXAS
import TaxManagerModal from '../../components/modules/integrations/TaxManagerModal';

const GatewayConfig = () => {
    const [rules, setRules] = useState([]);
    const [availableProviders, setAvailableProviders] = useState({}); 
    const [keyStatus, setKeyStatus] = useState({});

    const [loading, setLoading] = useState(true);
    
    // Controle dos Modais
    const [showMP, setShowMP] = useState(false);
    const [showStripe, setShowStripe] = useState(false);
    const [showAsaas, setShowAsaas] = useState(false);
    const [showAbacate, setShowAbacate] = useState(false);
    const [showCielo, setShowCielo] = useState(false);
    // 🟢 ESTADO DO NOVO MODAL DE TAXAS
    const [showTaxModal, setShowTaxModal] = useState(false);

    const fetchData = async () => {
        try {
            // 🟢 BLINDAGEM APLICADA NAS TRÊS ROTAS!
            const [rulesRes, optionsRes, credsRes] = await Promise.all([
                api.get('/payment-gateways/gateways').catch(() => ({ data: [] })),
                api.get('/payment-gateways/gateways/options').catch(() => ({ data: {} })),
                api.get('/payment-gateways/credentials').catch(() => ({ data: {} }))
            ]);

            let loadedRules = rulesRes.data || [];
            
            const onlineTypes = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'WALLET'];
            onlineTypes.forEach(type => {
                if (!loadedRules.find(r => r.method === type)) {
                    loadedRules.push({ method: type, provider: '', is_active: false });
                }
            });

            const offlineTypes = ['OFFLINE_CASH', 'OFFLINE_CREDIT', 'OFFLINE_DEBIT', 'OFFLINE_PIX'];
            offlineTypes.forEach(type => {
                if (!loadedRules.find(r => r.method === type)) {
                    loadedRules.push({ method: type, provider: 'OFFLINE', is_active: false });
                }
            });

            setRules(loadedRules);
            setAvailableProviders(optionsRes.data || {});

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
            // Só vai cair aqui se a internet cair de verdade
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

    // 🚀 MÁGICA DO AUTO-SAVE AQUI
    const handleLocalUpdate = async (method, field, value) => {
        // 1. Atualiza a tela instantaneamente (Optimistic UI)
        const newRules = rules.map(r => 
            r.method === method ? { ...r, [field]: value } : r
        );
        setRules(newRules);

        // 2. Salva silenciosamente no backend
        try {
            await api.post('/payment-gateways/gateways/update', { rules: newRules });
            // Um toast rápido e discreto para confirmar a ação
            toast.success('Alteração salva automaticamente!', { 
                autoClose: 1000, 
                hideProgressBar: true,
                position: "bottom-right"
            });
        } catch (error) {
            toast.error('Erro ao salvar alteração. Recarregue a página.');
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

    if (loading) return <div className="text-center p-5 mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container fluid className="p-3 p-md-4">
            
            {/* 🚀 CABEÇALHO COM O NOVO BOTÃO */}
            <div className="d-flex justify-content-between align-items-center mb-4 mb-md-5">
                <div>
                    <h4 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Gateways & Roteamento</h4>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                        Configure suas credenciais e os métodos de pagamento (Online e na Entrega). As alterações são salvas automaticamente.
                    </p>
                </div>
                {/* 🟢 BOTÃO PARA ABRIR O MODAL DE TAXAS */}
                <Button 
                    variant="outline-primary" 
                    className="fw-bold bg-white shadow-sm rounded-pill px-4" 
                    onClick={() => setShowTaxModal(true)}
                >
                    <i className="bi bi-percent me-2"></i> Ajustar Taxas
                </Button>
            </div>

            {/* SEÇÃO 1: Credenciais */}
            <GatewayCredentials 
                keyStatus={keyStatus} 
                onOpenModal={openConfigModal} 
            />

            <hr className="my-5 opacity-10" />

            {/* SEÇÕES 2 e 3: Roteamento com Auto-Save */}
            <PaymentRouting 
                rules={rules}
                availableProviders={availableProviders}
                keyStatus={keyStatus}
                onUpdateRule={handleLocalUpdate} 
                onApplyGlobal={handleApplyGlobal}
                onOpenModal={openConfigModal}
            />

            {/* Modais de Configuração */}
            <MercadoPagoModal show={showMP} onHide={() => setShowMP(false)} isConfigured={keyStatus.MERCADOPAGO} onUpdateSuccess={handleSuccess} />
            <StripeModal show={showStripe} onHide={() => setShowStripe(false)} isConfigured={keyStatus.STRIPE} onUpdateSuccess={handleSuccess} />
            <AsaasModal show={showAsaas} onHide={() => setShowAsaas(false)} isConfigured={keyStatus.ASAAS} onUpdateSuccess={handleSuccess} />
            <AbacatePayModal show={showAbacate} onHide={() => setShowAbacate(false)} isConfigured={keyStatus.ABACATEPAY} onUpdateSuccess={handleSuccess} />
            <CieloModal show={showCielo} onHide={() => setShowCielo(false)} isConfigured={keyStatus.CIELO} onUpdateSuccess={handleSuccess} />
            
            {/* 🟢 NOVO MODAL RENDERIZADO AQUI */}
            <TaxManagerModal show={showTaxModal} onHide={() => setShowTaxModal(false)} />

            {/* CSS Global da página com as regras responsivas */}
            <style>{`
                .shadow-hover:hover { transform: translateY(-5px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08)!important; }
                .ls-1 { letter-spacing: 1px; }
            `}</style>
        </Container>
    );
};

export default GatewayConfig;