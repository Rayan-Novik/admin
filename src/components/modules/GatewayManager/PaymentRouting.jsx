import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge, InputGroup } from 'react-bootstrap';
import { FaQrcode, FaCreditCard, FaBarcode, FaMoneyCheckAlt, FaSync, FaGlobe, FaCog, FaWallet, FaMoneyBillWave, FaBitcoin, FaCalendarCheck } from 'react-icons/fa';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const methodMetadata = {
    PIX: { label: 'PIX Instantâneo', icon: <FaQrcode className="text-success" size={24} /> },
    CREDITCARD: { label: 'Cartão de Crédito', icon: <FaCreditCard className="text-primary" size={24} /> },
    CREDIT_CARD: { label: 'Cartão de Crédito', icon: <FaCreditCard className="text-primary" size={24} /> },
    BOLETO: { label: 'Boleto Bancário', icon: <FaBarcode className="text-dark" size={24} /> },
    DEBITCARD: { label: 'Cartão de Débito', icon: <FaMoneyCheckAlt className="text-info" size={24} /> },
    DEBIT_CARD: { label: 'Cartão de Débito', icon: <FaMoneyCheckAlt className="text-info" size={24} /> },
    WALLET: { label: 'Carteira Digital', icon: <FaWallet className="text-warning" size={24} /> },
    CRYPTO: { label: 'Criptomoedas', icon: <FaBitcoin className="text-warning" size={24} /> }, 
    
    OFFLINE_CASH: { label: 'Dinheiro', icon: <FaMoneyBillWave className="text-success" size={24} /> },
    OFFLINE_CREDIT: { label: 'Crédito (Maquininha)', icon: <FaCreditCard className="text-warning" size={24} /> },
    OFFLINE_DEBIT: { label: 'Débito (Maquininha)', icon: <FaCreditCard className="text-secondary" size={24} /> },
    OFFLINE_PIX: { label: 'PIX (Maquininha)', icon: <FaQrcode className="text-info" size={24} /> }
};

const PaymentRouting = ({ rules, availableProviders, keyStatus, onUpdateRule, onApplyGlobal, onOpenModal }) => {
    const onlineRules = rules.filter(r => !r.method.startsWith('OFFLINE_'));
    const offlineRules = rules.filter(r => r.method.startsWith('OFFLINE_'));

    const [sinalPercent, setSinalPercent] = useState(100);
    const [savingSinal, setSavingSinal] = useState(false);
    
    // 🟢 ESTADO PARA AS FORMAS DE PAGAMENTO DO MÓDULO FISCAL
    const [formasFiscais, setFormasFiscais] = useState([]);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                // Busca o Sinal de Agendamento
                const resSinal = await api.get('/payment-gateways/config/AGENDAMENTO_SINAL_PERCENT');
                if (resSinal.data && resSinal.data.valor !== undefined) {
                    setSinalPercent(Number(resSinal.data.valor));
                }

                // 🟢 Busca as Formas de Pagamento Fiscais cadastradas na Sefaz
                const resFiscal = await api.get('/fiscal/formas-pagamento');
                setFormasFiscais(Array.isArray(resFiscal.data) ? resFiscal.data : (resFiscal.data.data || []));
            } catch (error) {
                console.error("Erro ao carregar configurações de pagamento:", error);
            }
        };
        fetchConfigs();
    }, []);

    const handleSaveSinal = async () => {
        setSavingSinal(true);
        try {
            await api.post('/payment-gateways/config', { 
                chave: 'AGENDAMENTO_SINAL_PERCENT', 
                valor: String(sinalPercent) 
            });
            toast.success("Regra de sinal salva com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar configuração.");
        } finally {
            setSavingSinal(false);
        }
    };

    return (
        <>
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">2. Pagamentos Online (Site)</h6>
            
            <Row className="g-4 mb-4">
                <Col lg={7}>
                    <Card className="h-100 border-primary shadow-sm bg-primary bg-opacity-10 border-0">
                        <Card.Body className="d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-3">
                                <FaGlobe className="text-primary fs-3 me-3" />
                                <div>
                                    <h6 className="fw-bold text-primary mb-0">Roteamento Rápido (Global)</h6>
                                    <small className="text-muted">Use um único processador para todas as transações online.</small>
                                </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {keyStatus.MERCADOPAGO && <Button variant="outline-primary" size="sm" onClick={() => onApplyGlobal('MERCADOPAGO')}>Tudo Mercado Pago</Button>}
                                {keyStatus.ASAAS && <Button variant="outline-primary" size="sm" onClick={() => onApplyGlobal('ASAAS')}>Tudo Asaas</Button>}
                                {keyStatus.ABACATEPAY && <Button variant="outline-primary" size="sm" onClick={() => onApplyGlobal('ABACATEPAY')}>Tudo AbacatePay</Button>}
                                {keyStatus.CIELO && <Button variant="outline-primary" size="sm" onClick={() => onApplyGlobal('CIELO')}>Tudo Cielo</Button>}
                                
                                {!keyStatus.MERCADOPAGO && !keyStatus.ASAAS && !keyStatus.ABACATEPAY && !keyStatus.CIELO && (
                                    <span className="text-muted small">Configure as chaves acima para habilitar o atalho global.</span>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="h-100 border-warning shadow-sm bg-warning bg-opacity-10 border-0">
                        <Card.Body className="d-flex flex-column justify-content-between">
                            <div className="d-flex align-items-center mb-3">
                                <FaCalendarCheck className="text-warning fs-3 me-3" />
                                <div>
                                    <h6 className="fw-bold text-warning mb-0" style={{ color: '#d97706' }}>Sinal Antecipado (Agendamento)</h6>
                                    <small className="text-muted" style={{ fontSize: '11px' }}>Exija um pagamento parcial para confirmar reservas no site.</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <InputGroup size="sm" className="w-50 shadow-sm rounded-pill overflow-hidden">
                                    <Form.Control 
                                        type="number" min="0" max="100" 
                                        value={sinalPercent} onChange={(e) => setSinalPercent(e.target.value)} 
                                        className="border-0 bg-white text-center fw-bold text-dark"
                                    />
                                    <InputGroup.Text className="border-0 bg-white text-secondary fw-bold">%</InputGroup.Text>
                                </InputGroup>
                                <Button 
                                    variant="warning" size="sm" 
                                    className="rounded-pill fw-bold px-3 text-dark shadow-sm"
                                    onClick={handleSaveSinal} disabled={savingSinal}
                                >
                                    {savingSinal ? 'Salvando...' : 'Salvar Regra'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4 mb-5">
                {onlineRules.map((rule) => {
                    const meta = methodMetadata[rule.method] || { label: rule.method, icon: <FaSync /> };
                    const normalizedMethod = rule.method.replace(/_/g, '');
                    const rawOptions = availableProviders[normalizedMethod] || availableProviders[rule.method] || [];
                    const connectedOptions = rawOptions.filter(opt => keyStatus[opt.value]);

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
                                            type="switch" checked={rule.is_active}
                                            onChange={(e) => onUpdateRule(rule.method, 'is_active', e.target.checked)}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </div>
                                    
                                    <hr className="opacity-10 my-3"/>

                                    <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="small text-muted fw-bold text-uppercase mb-0">Processador</Form.Label>
                                            <div 
                                                className="text-primary small cursor-pointer" title={`Configurar chaves do ${rule.provider}`}
                                                style={{cursor: 'pointer'}} onClick={() => onOpenModal(rule.provider)}
                                            >
                                                <FaCog className="me-1" /> Configurar
                                            </div>
                                        </div>

                                        <Form.Select 
                                            value={rule.provider || ''} 
                                            onChange={(e) => onUpdateRule(rule.method, 'provider', e.target.value)}
                                            disabled={!rule.is_active}
                                            className="form-select shadow-none border-secondary border-opacity-25 mb-1"
                                        >
                                            {connectedOptions.length > 0 ? (
                                                <>
                                                    <option value="">Selecione um processador...</option>
                                                    {connectedOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </>
                                            ) : <option value="">Nenhum gateway configurado</option>}
                                        </Form.Select>
                                        
                                        {!keyStatus[rule.provider] && rule.provider && rule.provider !== 'OFFLINE' && (
                                            <div className="text-danger small fw-bold" style={{fontSize: '0.75rem'}}>
                                                <i className="bi bi-exclamation-triangle-fill me-1"></i>Atenção: A chave conectada foi removida!
                                            </div>
                                        )}
                                    </Form.Group>

                                    {/* 🟢 CAIXA DE VÍNCULO COM O MÓDULO FISCAL */}
                                    <Form.Group>
                                        <Form.Label className="small text-muted fw-bold text-uppercase mb-1" style={{fontSize: '10px'}}>
                                            <i className="bi bi-receipt-cutoff me-1"></i>Vincular NF-e / NFC-e (SEFAZ)
                                        </Form.Label>
                                        <Form.Select 
                                            value={rule.fiscal_payment_id || ''} 
                                            onChange={(e) => onUpdateRule(rule.method, 'fiscal_payment_id', e.target.value)}
                                            disabled={!rule.is_active}
                                            className="form-select form-select-sm shadow-none bg-light"
                                        >
                                            <option value="">Sem Vínculo Fiscal</option>
                                            {formasFiscais.map(f => (
                                                <option key={f.id} value={f.id}>{f.descricao} (Sefaz: {f.codigo_sefaz})</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <hr className="my-5 opacity-10" />
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">3. Pagamento na Entrega (Motoboy/Retirada)</h6>
            
            <Row className="g-4">
                {offlineRules.map((rule) => {
                    const meta = methodMetadata[rule.method];

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
                                            type="switch" checked={rule.is_active}
                                            onChange={(e) => onUpdateRule(rule.method, 'is_active', e.target.checked)}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </div>
                                    
                                    <hr className="opacity-10 my-3"/>

                                    {/* 🟢 CAIXA DE VÍNCULO COM O MÓDULO FISCAL OFFLINE */}
                                    <Form.Group>
                                        <Form.Label className="small text-muted fw-bold text-uppercase mb-1" style={{fontSize: '10px'}}>
                                            <i className="bi bi-receipt-cutoff me-1"></i>Vincular NF-e / NFC-e (SEFAZ)
                                        </Form.Label>
                                        <Form.Select 
                                            value={rule.fiscal_payment_id || ''} 
                                            onChange={(e) => onUpdateRule(rule.method, 'fiscal_payment_id', e.target.value)}
                                            disabled={!rule.is_active}
                                            className="form-select form-select-sm shadow-none bg-light"
                                        >
                                            <option value="">Sem Vínculo Fiscal</option>
                                            {formasFiscais.map(f => (
                                                <option key={f.id} value={f.id}>{f.descricao} (Sefaz: {f.codigo_sefaz})</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </>
    );
};

export default PaymentRouting;