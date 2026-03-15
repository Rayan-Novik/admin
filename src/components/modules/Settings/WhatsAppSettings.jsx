import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const WhatsAppSettings = () => {
    const [status, setStatus] = useState('DISCONNECTED');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/whatsapp/status');
            setStatus(data.status);
            setQrCode(data.qrCode);
            
            // Se o backend avisar que já tem QR Code ou já conectou, paramos o loading do botão
            if (data.status === 'WAITING_FOR_SCAN' || data.status === 'CONNECTED') {
                setIsConnecting(false);
            }
        } catch (error) {
            console.error('Erro ao buscar status do WhatsApp', error);
        } finally {
            setLoading(false);
        }
    };

    // Fica checando o status a cada 3 segundos para ver se o admin escaneou
    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // ✅ NOVA FUNÇÃO: Solicita ao backend para gerar um QR Code AGORA
    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await api.post('/whatsapp/connect');
        } catch (err) {
            alert('Erro ao solicitar conexão. Verifique se o backend está rodando.');
            setIsConnecting(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;
        setLoading(true);
        try {
            await api.post('/whatsapp/logout');
            setStatus('DISCONNECTED');
            setQrCode(null);
            setIsConnecting(false);
        } catch (err) {
            alert('Erro ao desconectar');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !qrCode && status === 'DISCONNECTED' && !isConnecting) {
        return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;
    }

    return (
        <div className="whatsapp-settings">
            <Alert variant="info" className="border-0 shadow-sm rounded-4 mb-4">
                <i className="bi bi-info-circle-fill me-2"></i>
                Conecte o WhatsApp da sua loja para enviar notificações automáticas de envio e rastreio para os clientes.
            </Alert>

            <Card className="border-0 shadow-sm rounded-4 bg-light">
                <Card.Body className="text-center py-5">
                    {status === 'CONNECTED' ? (
                        <div>
                            <div className="mb-3">
                                <i className="bi bi-whatsapp text-success" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <h4 className="fw-bold text-success mb-2">WhatsApp Conectado!</h4>
                            <p className="text-muted mb-4">Seu bot está pronto e enviando mensagens automáticas.</p>
                            <Button variant="outline-danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right me-2"></i> Desconectar Celular
                            </Button>
                        </div>
                    ) : status === 'WAITING_FOR_SCAN' && qrCode ? (
                        <div>
                            <h5 className="fw-bold mb-3">Leia o QR Code</h5>
                            <p className="text-muted small mb-4">
                                Abra o WhatsApp no seu celular, vá em "Aparelhos conectados" e aponte a câmera para o código abaixo.
                            </p>
                            <div className="d-inline-block bg-white p-3 rounded-4 shadow-sm mb-3 border">
                                <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px' }} />
                            </div>
                            <p className="text-muted small"><Spinner animation="grow" size="sm" className="me-2 text-success" />Aguardando leitura no celular...</p>
                        </div>
                    ) : (
                        <div>
                            {isConnecting ? (
                                <>
                                    <Spinner animation="border" variant="success" className="mb-3" />
                                    <h5 className="fw-bold text-muted">Gerando QR Code...</h5>
                                    <p className="text-muted small">Conectando ao servidor do WhatsApp, aguarde.</p>
                                </>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <i className="bi bi-qr-code-scan text-secondary opacity-50" style={{ fontSize: '4rem' }}></i>
                                    </div>
                                    <h5 className="fw-bold mb-2">WhatsApp Desconectado</h5>
                                    <p className="text-muted small mb-4">Clique no botão abaixo para gerar um novo QR Code e conectar seu número.</p>
                                    <Button variant="success" className="rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={handleConnect}>
                                        <i className="bi bi-phone me-2"></i> Gerar QR Code
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default WhatsAppSettings;