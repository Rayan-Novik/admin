import React, { useState, useEffect, useRef } from 'react';

import { Container, Spinner, Card, Button, Form } from 'react-bootstrap';

import { toast } from 'react-toastify';

import api from '../../services/api';


export const WhatsappMaster = () => {

    const [status, setStatus] = useState('LOADING'); 

    const [qrCode, setQrCode] = useState(null);

    const [pairingCode, setPairingCode] = useState(null); 

    const [isLoadingAction, setIsLoadingAction] = useState(false);

    

    const [loginMode, setLoginMode] = useState('qrcode'); 

    const [phoneNumber, setPhoneNumber] = useState('');

    

    const pollingInterval = useRef(null);


    const fetchStatus = async () => {

        try {

            const { data } = await api.get('/whatsapp/status');

            setStatus(data.status || 'DISCONNECTED');

            setQrCode(data.qrCode || null);

            setPairingCode(data.pairingCode || null); 

        } catch (error) {

            console.error("Erro ao buscar status:", error);

            setStatus('DISCONNECTED');

        }

    };


    const startPolling = () => {

        if (pollingInterval.current) clearInterval(pollingInterval.current);

        fetchStatus();

        pollingInterval.current = setInterval(fetchStatus, 3000); 

    };


    useEffect(() => {

        startPolling();

        return () => {

            if (pollingInterval.current) clearInterval(pollingInterval.current);

        };

    }, []);


    const handlePhoneChange = (e) => {

        let val = e.target.value.replace(/\D/g, '');

        if (val.length > 11) val = val.slice(0, 11);

        

        let formatted = val;

        if (val.length > 2 && val.length <= 7) {

            formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;

        } else if (val.length > 7) {

            formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;

        }

        setPhoneNumber(formatted);

    };


    // 🟢 FUNÇÃO DE RECONECTAR (Tenta usar a sessão salva)

    const handleReconnect = async () => {

        setIsLoadingAction(true);

        toast.info('Tentando restaurar a sessão anterior...');

        try {

            // Chama a rota de conexão sem forçar a criação de um novo pareamento

            // (O seu backend deve estar preparado para ler a pasta auth_info se não receber parâmetros forçando novo QR)

            await api.post('/whatsapp/connect');

            

            setTimeout(() => {

                fetchStatus();

            }, 2500);

        } catch (error) {

            toast.error(error.response?.data?.message || 'Falha ao reconectar. Você precisará gerar um novo código.');

        } finally {

            setIsLoadingAction(false);

        }

    };


    // Função para gerar um código NOVO do zero (Apaga a sessão velha)

    const handleConnectNew = async (usePhone = false) => {

        const rawPhone = phoneNumber.replace(/\D/g, '');

        if (usePhone && rawPhone.length < 10) {

            toast.error('Digite um número de celular válido com DDD.');

            return;

        }


        if (!window.confirm('Isso irá criar uma nova conexão e pode desconectar o aparelho atual. Deseja continuar?')) {

            return;

        }


        setIsLoadingAction(true);

        try {

            // Se você quiser garantir que é uma conexão limpa, o ideal seria o backend 

            // limpar a pasta auth_info antes. Algumas APIs usam um parâmetro tipo { forceNew: true }

            const payload = usePhone ? { phone: rawPhone, forceNew: true } : { forceNew: true };

            await api.post('/whatsapp/connect', payload);

            

            if (usePhone) {

                toast.info('Solicitando código ao WhatsApp...', { autoClose: 2000 });

                setTimeout(() => {

                    fetchStatus();

                }, 2500); 

            } else {

                toast.info('Iniciando conexão. Aguarde o QR Code...');

                fetchStatus();

            }

            

        } catch (error) {

            toast.error(error.response?.data?.message || 'Erro ao conectar.');

        } finally {

            setIsLoadingAction(false);

        }

    };


    const handleDisconnect = async () => {

        if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp? (Sua sessão será apagada)')) return;

        

        setIsLoadingAction(true);

        try {

            await api.post('/whatsapp/logout');

            toast.success('WhatsApp desconectado e sessão apagada!');

            setQrCode(null);

            setPairingCode(null);

            setStatus('DISCONNECTED');

        } catch (error) {

            toast.error('Erro ao desconectar.');

        } finally {

            setIsLoadingAction(false);

        }

    };


    const handleCancelScan = async () => {

        setIsLoadingAction(true);

        try {

            await api.post('/whatsapp/logout');

            setQrCode(null);

            setPairingCode(null);

            setStatus('DISCONNECTED');

        } catch (error) {} finally {

            setIsLoadingAction(false);

        }

    };


    if (status === 'LOADING') {

        return (

            <Container fluid className="p-3 text-center mt-5">

                <Spinner animation="border" variant="primary" />

            </Container>

        );

    }


    return (

        <Container fluid className="p-3 p-md-4">

            <div className="mb-4 mb-md-5">

                <h4 className="fw-bolder text-dark mb-1 custom-title">WhatsApp Master (SaaS)</h4>

                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>

                    Conecte o número central do ArarinhaCloud para enviar os recibos.

                </p>

            </div>


            <Card className="border-0 shadow-sm rounded-4 text-center p-4 p-md-5 mx-auto clean-card" style={{ maxWidth: '650px' }}>

                <Card.Body className="d-flex flex-column align-items-center">

                    

                    <div className="position-relative d-inline-block mb-4">

                        <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${

                            status === 'CONNECTED' ? 'bg-success bg-opacity-10 text-success' : 

                            status.includes('WAITING') ? 'bg-warning bg-opacity-10 text-warning' : 

                            'bg-light text-secondary icon-bg-disconnected'

                        }`} style={{ width: '88px', height: '88px' }}>

                            <i className="bi bi-whatsapp" style={{ fontSize: '40px' }}></i>

                        </div>

                        {status === 'CONNECTED' && (

                            <div className="position-absolute top-0 start-100 translate-middle p-2 bg-success border border-white rounded-circle border-3 pulse-animation"></div>

                        )}

                    </div>


                    <h5 className="fw-bolder text-dark mb-2 custom-title">

                        {status === 'DISCONNECTED' && 'Sistema Desconectado'}

                        {status === 'WAITING_FOR_SCAN' && 'Aguardando Leitura do QR'}

                        {status === 'WAITING_FOR_CODE' && 'Código de Pareamento Pronto'}

                        {status === 'CONNECTED' && 'WhatsApp Conectado e Ativo!'}

                    </h5>


                    {status === 'DISCONNECTED' && (

                        <div className="w-100 mt-4" style={{ maxWidth: '350px' }}>

                            

                            {/* 🟢 BOTÃO DE RECONECTAR (Tenta puxar a sessão salva) */}

                            <Button 

                                variant="success"

                                className="w-100 py-3 mb-4 fw-bold rounded-3 shadow-sm d-flex justify-content-center align-items-center gap-2"

                                onClick={handleReconnect}

                                disabled={isLoadingAction}

                            >

                                {isLoadingAction ? <Spinner as="span" animation="border" size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}

                                Tentar Reconectar

                            </Button>


                            <div className="position-relative mb-4">

                                <hr className="text-muted" />

                                <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small clean-card custom-title" style={{fontSize: '12px'}}>

                                    OU CRIAR NOVA CONEXÃO

                                </span>

                            </div>


                            <div className="d-flex bg-light rounded-3 p-1 mb-4 mode-btn-container">

                                <button 

                                    className={`btn flex-grow-1 border-0 fw-bold rounded-3 mode-btn ${loginMode === 'qrcode' ? 'bg-white shadow-sm custom-active-text' : 'text-muted'}`}

                                    onClick={() => setLoginMode('qrcode')}

                                >

                                    QR Code

                                </button>

                                <button 

                                    className={`btn flex-grow-1 border-0 fw-bold rounded-3 mode-btn ${loginMode === 'phone' ? 'bg-white shadow-sm custom-active-text' : 'text-muted'}`}

                                    onClick={() => setLoginMode('phone')}

                                >

                                    Por Número

                                </button>

                            </div>


                            {loginMode === 'qrcode' ? (

                                <Button 

                                    variant="outline-primary"

                                    className="w-100 py-3 fw-bold rounded-3 d-flex justify-content-center align-items-center gap-2"

                                    onClick={() => handleConnectNew(false)}

                                    disabled={isLoadingAction}

                                >

                                    {isLoadingAction ? <Spinner as="span" animation="border" size="sm" /> : <i className="bi bi-qr-code-scan"></i>}

                                    Gerar Novo QR Code

                                </Button>

                            ) : (

                                <div className="text-start">

                                    <label className="form-label text-muted small fw-bold">Seu número de WhatsApp</label>

                                    <Form.Control 

                                        type="tel" 

                                        placeholder="(92) 99999-9999" 

                                        className="py-3 px-4 rounded-[16px] bg-light border-0 mb-3 phone-input fw-bold custom-input-bg"

                                        value={phoneNumber}

                                        onChange={handlePhoneChange}

                                        maxLength={15}

                                    />

                                    <Button 

                                        variant="outline-primary"

                                        className="w-100 py-3 fw-bold rounded-3 d-flex justify-content-center align-items-center gap-2"

                                        onClick={() => handleConnectNew(true)}

                                        disabled={isLoadingAction || phoneNumber.replace(/\D/g, '').length < 10}

                                    >

                                        {isLoadingAction ? <Spinner as="span" animation="border" size="sm" /> : <i className="bi bi-phone"></i>}

                                        Receber Novo Código

                                    </Button>

                                </div>

                            )}

                        </div>

                    )}


                    {status === 'WAITING_FOR_SCAN' && qrCode && (

                        <div className="d-inline-block p-3 bg-white border rounded-4 shadow-sm mb-4 qr-box">

                            <img src={qrCode} alt="QR Code WhatsApp" className="img-fluid rounded" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />

                        </div>

                    )}


                    {status === 'WAITING_FOR_CODE' && pairingCode && (

                        <div className="w-100 mb-4">

                            <p className="text-muted small mb-3 custom-instructions">

                                1. Abra o WhatsApp no seu celular<br/>

                                2. Vá em <strong>Aparelhos Conectados</strong> {">"} Vincular um Aparelho<br/>

                                3. Toque em <strong>"Vincular com número de telefone"</strong><br/>

                                4. Digite o código abaixo:

                            </p>

                            <div className="bg-light p-4 rounded-4 border pairing-code-box fw-bolder" style={{ letterSpacing: '8px', fontSize: '32px', color: '#1f2937', fontFamily: 'monospace' }}>

                                {pairingCode.toUpperCase()}

                            </div>

                        </div>

                    )}


                    {(status === 'WAITING_FOR_SCAN' || status === 'WAITING_FOR_CODE') && !qrCode && !pairingCode && (

                        <div className="d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded-4 mb-4 border-light-dark" style={{ width: '246px', height: '246px' }}>

                            <Spinner animation="border" variant="primary" className="mb-2" />

                            <small className="text-muted">Gerando credenciais...</small>

                        </div>

                    )}


                    <div className="d-flex gap-3 mt-2">

                        {(status === 'WAITING_FOR_SCAN' || status === 'WAITING_FOR_CODE') && (

                            <Button 

                                variant="outline-secondary"

                                className="px-4 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2"

                                onClick={handleCancelScan}

                                disabled={isLoadingAction}

                            >

                                Cancelar Conexão

                            </Button>

                        )}


                        {status === 'CONNECTED' && (

                            <Button 

                                variant="danger"

                                className="px-4 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2"

                                onClick={handleDisconnect}

                                disabled={isLoadingAction}

                            >

                                <i className="bi bi-plug"></i> Desconectar

                            </Button>

                        )}

                    </div>


                </Card.Body>

            </Card>


            <style>{`

                @keyframes pulse-green {

                    0% { transform: translate(-50%, -50%) scale(0.95); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }

                    70% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 8px rgba(25, 135, 84, 0); }

                    100% { transform: translate(-50%, -50%) scale(0.95); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }

                }

                .pulse-animation { animation: pulse-green 2s infinite; position: absolute; top: 0; left: 100%; }


                .custom-title, .custom-active-text { color: #212529; }

                .mode-btn-container, .custom-input-bg { background-color: #f8f9fa; }

                .icon-bg-disconnected { background-color: #f8f9fa; color: #6c757d; }


                body.dark-mode .clean-card { background-color: #0f172a !important; border-color: #1e293b !important; }

                body.dark-mode .custom-title, 

                body.dark-mode .custom-active-text,

                body.dark-mode .custom-instructions { color: #f8fafc !important; }

                

                body.dark-mode .mode-btn-container { background-color: #1e293b !important; }

                body.dark-mode .pairing-code-box,

                body.dark-mode .phone-input,

                body.dark-mode .custom-input-bg {

                    background-color: #1e293b !important;

                    color: #f8fafc !important;

                    border-color: #334155 !important;

                }

                body.dark-mode .phone-input::placeholder { color: #64748b !important; }

                body.dark-mode .mode-btn.bg-white { background-color: #334155 !important; color: #f8fafc !important; }

                body.dark-mode .mode-btn.text-muted { color: #94a3b8 !important; }

                body.dark-mode .qr-box { background-color: #ffffff !important; padding: 15px; }

                body.dark-mode .border-light-dark { border-color: #334155 !important; }

                body.dark-mode .icon-bg-disconnected { background-color: #1e293b !important; color: #94a3b8 !important; }

            `}</style>

        </Container>

    );

};


export default WhatsappMaster;