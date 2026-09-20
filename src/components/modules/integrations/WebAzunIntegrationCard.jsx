import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Badge } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const WebAzunIntegrationCard = ({ statusConfigurado, onConfigureClick }) => {
    const [statusWpp, setStatusWpp] = useState('LOADING'); // LOADING, CONNECTED, DISCONNECTED, NOT_CONFIGURED
    const [qrCodeData, setQrCodeData] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [loadingQr, setLoadingQr] = useState(false);

    // ==========================================
    // 1. CHECAGEM DE STATUS DO WHATSAPP
    // ==========================================
    useEffect(() => {
        if (statusConfigurado) {
            checkStatus();
            const interval = setInterval(checkStatus, 10000);
            return () => clearInterval(interval);
        } else {
            setStatusWpp('NOT_CONFIGURED');
        }
    }, [statusConfigurado]);

    const checkStatus = async () => {
        try {
            const { data } = await api.get('/kanban/whazing/status');
            if (data && (data.status === 'CONNECTED' || data.connected)) {
                setStatusWpp('CONNECTED');
            } else {
                setStatusWpp('DISCONNECTED');
            }
        } catch (error) {
            setStatusWpp('DISCONNECTED');
        }
    };

    // ==========================================
    // 2. FUNÇÃO PARA ABRIR E GERAR O QR CODE
    // ==========================================
    const handleOpenWhatsAppModal = async (e) => {
        if (e) e.stopPropagation();
        
        setShowQrModal(true);

        // Se já estiver conectado, apenas mostra o modal de sucesso, não precisa gerar QR Code
        if (statusWpp === 'CONNECTED') return;

        try {
            setLoadingQr(true);
            setQrCodeData(null);

            const { data } = await api.post('/kanban/whazing/qrcode');

            if (data && data.qrcode) {
                setQrCodeData(data.qrcode);
            } else if (data && data.base64) {
                setQrCodeData(data.base64);
            } else {
                toast.error("Não foi possível renderizar o QR Code recebido.");
            }
        } catch (error) {
            toast.error("Erro ao gerar QR Code do WhatsApp.");
            setShowQrModal(false);
        } finally {
            setLoadingQr(false);
        }
    };

    // ==========================================
    // 3. BADGES E UI
    // ==========================================
    const renderStatusBadge = () => {
        if (!statusConfigurado || statusWpp === 'NOT_CONFIGURED') {
            return (
                <Badge bg="light" text="muted" className="fw-normal rounded-pill px-2 py-1 text-center" style={{ fontSize: '0.6rem' }}>
                    Configurar
                </Badge>
            );
        }

        if (statusWpp === 'LOADING') {
            return (
                <Badge bg="secondary" text="white" className="fw-normal rounded-pill px-2 py-1 text-center" style={{ fontSize: '0.6rem' }}>
                    Checando...
                </Badge>
            );
        }

        if (statusWpp === 'CONNECTED') {
            return (
                <Badge 
                    bg="success" 
                    text="white" 
                    className="fw-normal rounded-pill px-2 py-1 text-center shadow-sm" 
                    style={{ fontSize: '0.6rem', cursor: 'pointer' }}
                    onClick={handleOpenWhatsAppModal}
                >
                    Conectado
                </Badge>
            );
        }

        // Desconectado
        return (
            <Badge 
                bg="danger" 
                text="white" 
                className="fw-normal rounded-pill px-2 py-1 text-center shadow-sm" 
                style={{ fontSize: '0.6rem', cursor: 'pointer' }} 
                onClick={handleOpenWhatsAppModal}
            >
                <i className="bi bi-qr-code-scan me-1"></i> Desconectado
            </Badge>
        );
    };

    return (
        <>
            <div
                className="h-100 p-3 p-md-4 rounded-4 position-relative transition-all bg-white border border-light d-flex flex-column shadow-hover"
                style={{ transition: 'all 0.2s ease-in-out', cursor: 'pointer' }}
                onClick={onConfigureClick}
            >
                {/* TOPO: ÍCONE + BADGE */}
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-3 gap-2">
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: '40px', height: '40px', backgroundColor: '#0A84FF15' }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>
                            <i className="bi bi-kanban text-primary"></i>
                        </span>
                    </div>

                    {renderStatusBadge()}
                </div>

                {/* TÍTULO */}
                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>
                    WebAzun
                </h6>

                {/* DESCRIÇÃO */}
                <p className="text-muted mb-3 d-none d-sm-block flex-grow-1" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                    Integração de pedidos e clientes com o funil de vendas e Multi Atendimento por WhatsApp.
                </p>

                {/* 🟢 RODAPÉ COM OS DOIS BOTÕES (LADO A LADO) */}
                <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                    
                    {/* BOTÃO 1: CONFIGURAR */}
                    <div 
                        className="text-secondary fw-bold text-uppercase d-flex align-items-center" 
                        style={{ fontSize: '0.65rem', letterSpacing: '0.5px', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); onConfigureClick(); }}
                    >
                        <i className="bi bi-gear-fill me-1"></i> <span className="d-none d-sm-inline">Configurar</span>
                    </div>

                    {/* BOTÃO 2: CONEXÃO WPP (Abre o Modal de QR Code / Status) */}
                    {statusConfigurado && (
                        <div 
                            className="text-primary fw-bold text-uppercase d-flex align-items-center" 
                            style={{ fontSize: '0.65rem', letterSpacing: '0.5px', cursor: 'pointer' }}
                            onClick={handleOpenWhatsAppModal}
                        >
                            <i className="bi bi-qr-code-scan me-1"></i> <span className="d-none d-sm-inline">Conexão WPP</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ==========================================
                🟢 MODAL DO QR CODE / STATUS
            ========================================== */}
            <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold"><i className="bi bi-whatsapp text-success me-2"></i>Gerenciar WhatsApp</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    {statusWpp === 'CONNECTED' ? (
                        <div className="py-4">
                            <div className="mb-3 text-success">
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <h5 className="fw-bold text-dark">WhatsApp Conectado!</h5>
                            <p className="text-muted small px-3">Seu canal já está sincronizado e operando normalmente.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted small mb-4">Aponte a câmera do seu celular para ler o código abaixo e conectar o CRM.</p>

                            {loadingQr ? (
                                <div className="py-5 d-flex flex-column align-items-center">
                                    <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
                                    <span className="mt-3 fw-bold text-secondary">Gerando QR Code...</span>
                                </div>
                            ) : qrCodeData ? (
                                <div className="p-3 bg-white border rounded-4 d-inline-block shadow-sm">
                                    <img 
                                        src={qrCodeData.includes('base64') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} 
                                        alt="QR Code WhatsApp" 
                                        style={{ width: '250px', height: '250px' }} 
                                    />
                                </div>
                            ) : (
                                <div className="py-5 text-danger fw-bold">
                                    <i className="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                                    Falha ao carregar o código. Tente novamente.
                                </div>
                            )}

                            {qrCodeData && (
                                <div className="mt-4">
                                    <Spinner animation="grow" variant="success" size="sm" className="me-2" />
                                    <span className="text-success fw-bold small">Aguardando leitura no celular...</span>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default WebAzunIntegrationCard;