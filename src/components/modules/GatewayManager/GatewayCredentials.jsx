import React from 'react';
import { Row, Col, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaBitcoin } from 'react-icons/fa';

// Componente interno apenas para renderizar os cards
const CredentialCard = ({ title, icon, status, onClick, color, description, customIcon, locked }) => {
    const isConfigured = !!status;
    return (
        <Col md={6} lg={3}>
            <div 
                className={`h-100 p-3 rounded-4 bg-white border border-light shadow-hover d-flex flex-column justify-content-between ${locked ? 'opacity-75' : ''}`}
                style={{ transition: 'all 0.2s ease-in-out', cursor: locked ? 'not-allowed' : 'pointer' }}
                onClick={locked ? () => toast.info('A integração com a Coinbase estará disponível em breve!') : onClick}
            >
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div 
                            className="d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
                            style={{ width: '40px', height: '40px', backgroundColor: locked ? '#e9ecef' : `${color}15` }} 
                        >
                            {customIcon ? (
                                <span style={{ fontSize: '1.5rem', color: locked ? '#6c757d' : undefined }}>{customIcon}</span> 
                            ) : (
                                <img 
                                    src={icon} 
                                    alt={title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: locked ? 'grayscale(100%) opacity(60%)' : 'none' }} 
                                />
                            )}
                        </div>
                        
                        {locked ? (
                            <Badge bg="warning" text="dark" className="fw-bold rounded-pill px-2 py-1 small" style={{ fontSize: '0.65rem' }}>
                                EM BREVE
                            </Badge>
                        ) : (
                            <Badge bg={isConfigured ? 'success' : 'light'} text={isConfigured ? 'white' : 'muted'} className="fw-normal rounded-pill px-2 py-1 small">
                                {isConfigured ? 'OK' : 'Off'}
                            </Badge>
                        )}
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{title}</h6>
                    <p className="text-muted small mb-0" style={{fontSize: '0.75rem', lineHeight: '1.3'}}>{description}</p>
                </div>
                <div className="mt-3 border-top pt-2">
                    <span className={`${locked ? 'text-muted' : 'text-primary'} small fw-bold text-uppercase`} style={{fontSize: '0.7rem'}}>
                        {locked ? <><i className="bi bi-lock-fill me-1"></i> Em Desenvolvimento</> : <><i className="bi bi-gear-fill me-1"></i> Configurar Chaves</>}
                    </span>
                </div>
            </div>
        </Col>
    );
};

// Componente Exportado
const GatewayCredentials = ({ keyStatus, onOpenModal }) => {
    return (
        <>
            <h6 className="fw-bold text-uppercase text-secondary mb-3 small ls-1">1. Credenciais dos Gateways</h6>
            <Row className="g-3 mb-5">
                <CredentialCard title="Mercado Pago" status={keyStatus.MERCADOPAGO} icon="/images/mercado-pago-logo.png" color="#009EE3" description="Access Token e Public Key." onClick={() => onOpenModal('MERCADOPAGO')} />
                <CredentialCard title="Stripe" status={keyStatus.STRIPE} icon="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" color="#635BFF" description="Secret e Public Keys." onClick={() => onOpenModal('STRIPE')} />
                <CredentialCard title="Asaas" status={keyStatus.ASAAS} icon="/images/asaas-logo.png" color="#0030b9" description="API Key de produção." onClick={() => onOpenModal('ASAAS')} />
                <CredentialCard title="AbacatePay" status={keyStatus.ABACATEPAY} icon="/images/abacatepay.ico"  color="#83C635" description="Chave de API." onClick={() => onOpenModal('ABACATEPAY')} />
                <CredentialCard title="Cielo 3.0" status={keyStatus.CIELO} icon="/images/unnamed.png" color="#00A4E3" description="Merchant ID e Key." onClick={() => onOpenModal('CIELO')} />
                
                <CredentialCard title="Coinbase" locked={true} icon="/images/coinbase.png" color="#0052FF" description="Receba pagamentos com Criptomoedas." onClick={() => {}} />
            </Row>
        </>
    );
};

export default GatewayCredentials;