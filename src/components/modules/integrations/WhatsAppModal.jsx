import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const WhatsAppModal = ({ show, onHide, onUpdateSuccess }) => {
    const [status, setStatus] = useState('LOADING');
    const [qrCode, setQrCode] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    const [loginMode, setLoginMode] = useState('qrcode');
    const [phoneNumber, setPhoneNumber] = useState('');

    const prevStatusRef = useRef('LOADING');
    const connectTimeoutRef = useRef(null); // 🟢 REFERÊNCIA PARA A TRAVA DE SEGURANÇA

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteMode, setDeleteMode] = useState('all'); // 'all' ou 'date'
    const [deleteDate, setDeleteDate] = useState('');

    const handleLimparDados = async () => {
        if (!window.confirm("ATENÇÃO: Esta ação é irreversível. Todas as conversas e contatos serão apagados!")) return;

        setLoading(true);
        try {
            // Chamada da rota que criamos no seu backend
            await api.delete('/whatsapp/chats/limpar-tudo', {
                data: { mode: deleteMode, date: deleteDate }
            });
            toast.success("Histórico limpo com sucesso!");
            setShowDeleteConfirm(false);
        } catch (err) {
            toast.error("Erro ao limpar o histórico.");
        } finally {
            setLoading(false);
        }
    };


    const fetchStatus = async () => {
        if (!show) return;
        try {
            const { data } = await api.get('/whatsapp/status');
            const currentStatus = data.status || 'DISCONNECTED';

            setStatus(currentStatus);
            setQrCode(data.qrCode || null);
            setPairingCode(data.pairingCode || null);

            if (currentStatus === 'WAITING_FOR_SCAN' || currentStatus === 'WAITING_FOR_CODE' || currentStatus === 'CONNECTED') {
                setIsConnecting(false);
                if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current); // 🟢 Limpa a trava se deu certo
            }

            if (currentStatus === 'CONNECTED' && prevStatusRef.current && prevStatusRef.current.includes('WAITING')) {
                onUpdateSuccess();
            }

            prevStatusRef.current = currentStatus;

        } catch (error) {
            console.error('Erro ao buscar status do WhatsApp', error);
            setStatus('DISCONNECTED');
            prevStatusRef.current = 'DISCONNECTED';
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (show) {
            setLoading(true);
            fetchStatus();
            interval = setInterval(fetchStatus, 3000);
        } else {
            setIsConnecting(false);
            setStatus('LOADING');
            prevStatusRef.current = 'LOADING';
            setQrCode(null);
            setPairingCode(null);
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        }
        return () => {
            clearInterval(interval);
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

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

    const handleReconnect = async () => {
        setIsConnecting(true);
        toast.info('Tentando restaurar a sessão anterior...');
        try {
            await api.post('/whatsapp/connect', {});
            setTimeout(() => fetchStatus(), 2500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Falha ao reconectar. Será necessário gerar um novo código.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectNew = async (usePhone = false) => {
        const rawPhone = phoneNumber.replace(/\D/g, '');
        if (usePhone && rawPhone.length < 10) {
            toast.error('Digite um número de celular válido com DDD.');
            return;
        }

        setIsConnecting(true);
        setQrCode(null);
        setPairingCode(null);
        setStatus('LOADING');

        // 🟢 TRAVA DE SEGURANÇA DE 15 SEGUNDOS (Evita o Loading Infinito se o Node reiniciar)
        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = setTimeout(() => {
            setIsConnecting(prev => {
                if (prev) toast.warning('Aviso: O código demorou para chegar. Se o Nodemon reiniciou, tente novamente.');
                return false;
            });
        }, 15000);

        try {
            const payload = usePhone ? { phone: rawPhone, forceNew: true } : { forceNew: true };
            await api.post('/whatsapp/connect', payload);

            if (usePhone) {
                setTimeout(() => fetchStatus(), 2500);
            }
        } catch (err) {
            toast.error('Erro ao solicitar conexão. Verifique o backend.');
            setIsConnecting(false);
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Tem certeza que deseja desconectar o WhatsApp? (Sua sessão será apagada do servidor)")) return;
        setLoading(true);
        try {
            await api.post('/whatsapp/logout');
            setStatus('DISCONNECTED');
            prevStatusRef.current = 'DISCONNECTED';
            setQrCode(null);
            setPairingCode(null);
            setIsConnecting(false);
            onUpdateSuccess();
            toast.success('WhatsApp desconectado com sucesso!');
        } catch (err) {
            toast.error('Erro ao desconectar');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setLoading(true);
        try {
            await api.post('/whatsapp/logout');
            setStatus('DISCONNECTED');
            prevStatusRef.current = 'DISCONNECTED';
            setQrCode(null);
            setPairingCode(null);
            setIsConnecting(false);
            toast.info('Tentativa de conexão cancelada.');
        } catch (err) {
            toast.error('Erro ao cancelar a conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleSafeClose = async () => {
        if (status === 'WAITING_FOR_SCAN' || status === 'WAITING_FOR_CODE') {
            await handleCancel();
        }
        onHide();
    };

    const renderContent = () => {
        if (status === 'CONNECTED') {
            return (
                <div className="animate__animated animate__fadeIn">
                    <div className="mb-3 d-inline-flex bg-success bg-opacity-10 p-4 rounded-circle">
                        <i className="bi bi-check-lg text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h4 className="fw-bold text-success mb-2">WhatsApp Conectado!</h4>
                    <p className="text-muted small mb-4">Seu bot está pronto e ativo para enviar notificações automáticas.</p>
                    <Button variant="outline-danger" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Desconectar Celular
                    </Button>
                    <div className="mt-4 pt-3 border-top text-start">
                        <Button
                            variant="link"
                            className="text-danger small fw-bold p-0 text-decoration-none"
                            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        >
                            <i className="bi bi-trash me-1"></i> {showDeleteConfirm ? 'Ocultar opções de limpeza' : 'Limpar Histórico de Mensagens'}
                        </Button>

                        {showDeleteConfirm && (
                            <div className="mt-3 p-3 bg-danger bg-opacity-10 rounded-3 animate__animated animate__fadeIn">
                                <Form.Select size="sm" className="mb-2" value={deleteMode} onChange={(e) => setDeleteMode(e.target.value)}>
                                    <option value="all">Apagar TUDO (Mensagens e Contatos)</option>
                                    <option value="date">Apagar antes de uma data específica</option>
                                </Form.Select>

                                {deleteMode === 'date' && (
                                    <Form.Control
                                        type="date"
                                        size="sm"
                                        className="mb-2"
                                        onChange={(e) => setDeleteDate(e.target.value)}
                                    />
                                )}

                                <Button variant="danger" size="sm" className="w-100 fw-bold" onClick={handleLimparDados}>
                                    Confirmar Limpeza Permanente
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (status === 'WAITING_FOR_CODE' && pairingCode) {
            return (
                <div className="animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-3">Código de Pareamento</h5>
                    <p className="text-muted small mb-4">
                        Abra o WhatsApp {">"} Aparelhos Conectados {">"} Vincular com número de telefone. Digite o código abaixo:
                    </p>
                    <div className="bg-light p-3 rounded-4 border mb-4 pairing-code-box" style={{ letterSpacing: '6px', fontSize: '26px', fontWeight: '900', fontFamily: 'monospace', color: '#1f2937' }}>
                        {pairingCode.toUpperCase()}
                    </div>
                    <div className="d-flex flex-column align-items-center justify-content-center mt-2">
                        <p className="text-muted small fw-medium text-success mb-3">
                            <Spinner animation="grow" size="sm" className="me-2" />
                            Aguardando vinculação...
                        </p>
                        <Button variant="light" size="sm" className="rounded-pill px-4 fw-medium text-secondary border shadow-sm btn-cancel-custom" onClick={handleCancel}>
                            <i className="bi bi-x-circle me-1"></i> Cancelar Conexão
                        </Button>
                    </div>
                </div>
            );
        }

        if (status === 'WAITING_FOR_SCAN' && qrCode) {
            return (
                <div className="animate__animated animate__fadeIn">
                    <h5 className="fw-bold mb-3">Leia o QR Code</h5>
                    <p className="text-muted small mb-4">
                        Abra o WhatsApp no seu celular, vá em "Aparelhos conectados" e aponte a câmera para o código abaixo.
                    </p>
                    <div className="d-inline-block bg-white p-3 rounded-4 shadow-sm mb-3 border qr-box">
                        <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px' }} />
                    </div>
                    <div className="d-flex flex-column align-items-center justify-content-center mt-2">
                        <p className="text-muted small fw-medium text-success mb-3">
                            <Spinner animation="grow" size="sm" className="me-2" />
                            Aguardando vinculação...
                        </p>
                        <Button variant="light" size="sm" className="rounded-pill px-4 fw-medium text-secondary border shadow-sm btn-cancel-custom" onClick={handleCancel}>
                            <i className="bi bi-x-circle me-1"></i> Cancelar Conexão
                        </Button>
                    </div>
                </div>
            );
        }

        if (isConnecting || loading || status === 'LOADING') {
            return (
                <div className="py-4">
                    <Spinner animation="border" variant="success" className="mb-3" />
                    <h5 className="fw-bold text-body">Gerando credenciais...</h5>
                    <p className="text-muted small">Conectando ao servidor, aguarde.</p>
                </div>
            );
        }

        return (
            <div className="py-2 px-1 animate__animated animate__fadeIn">
                <div className="mb-3">
                    <i className="bi bi-whatsapp text-secondary opacity-25" style={{ fontSize: '3.5rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2 text-body">WhatsApp Desconectado</h5>
                <p className="text-muted small mb-4">Conecte o WhatsApp da sua loja para enviar notificações automáticas de envio e rastreio.</p>

                <Button
                    variant="success"
                    className="w-100 py-3 mb-4 fw-bold rounded-3 shadow-sm d-flex justify-content-center align-items-center gap-2"
                    onClick={handleReconnect}
                    disabled={isConnecting}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    Tentar Reconectar Sessão Salva
                </Button>

                <div className="position-relative mb-4">
                    <hr className="text-muted" />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small clean-card fw-bold" style={{ fontSize: '11px' }}>
                        OU CRIAR NOVA CONEXÃO
                    </span>
                </div>

                <div className="d-flex bg-light rounded-3 p-1 mb-4 mode-btn-container">
                    <button
                        className={`btn flex-grow-1 border-0 fw-bold rounded-3 mode-btn ${loginMode === 'qrcode' ? 'bg-white shadow-sm text-body' : 'text-muted'}`}
                        onClick={() => setLoginMode('qrcode')}
                    >
                        QR Code
                    </button>
                    <button
                        className={`btn flex-grow-1 border-0 fw-bold rounded-3 mode-btn ${loginMode === 'phone' ? 'bg-white shadow-sm text-body' : 'text-muted'}`}
                        onClick={() => setLoginMode('phone')}
                    >
                        Por Número
                    </button>
                </div>

                {loginMode === 'qrcode' ? (
                    <Button variant="outline-success" className="rounded-pill px-4 py-2 fw-bold shadow-sm w-100" onClick={() => handleConnectNew(false)}>
                        <i className="bi bi-qr-code-scan me-2"></i> Gerar Novo QR Code
                    </Button>
                ) : (
                    <div className="text-start">
                        <label className="form-label text-muted small fw-bold ms-2">Número do WhatsApp da Loja</label>
                        <Form.Control
                            type="tel"
                            placeholder="(92) 99999-9999"
                            className="py-2 px-4 rounded-pill bg-light border-0 mb-3 phone-input fw-bold"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            maxLength={15}
                        />
                        <Button
                            variant="outline-success"
                            className="rounded-pill px-4 py-2 fw-bold shadow-sm w-100"
                            onClick={() => handleConnectNew(true)}
                            disabled={phoneNumber.replace(/\D/g, '').length < 10}
                        >
                            <i className="bi bi-phone me-2"></i> Receber Novo Código
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal show={show} onHide={handleSafeClose} centered backdrop="static" size="md">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold d-flex align-items-center">
                    <i className="bi bi-whatsapp text-success me-2"></i> WhatsApp Bot
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 text-center">
                {renderContent()}
            </Modal.Body>

            <style>{`
                /* Adaptações para o Modo Escuro no Modal */
                body.dark-mode .modal-content { background-color: #0f172a; border-color: #1e293b; color: #f8fafc; }
                body.dark-mode .mode-btn-container { background-color: #1e293b !important; }
                body.dark-mode .pairing-code-box,
                body.dark-mode .phone-input { background-color: #1e293b !important; color: #f8fafc !important; border-color: #334155 !important; }
                body.dark-mode .phone-input::placeholder { color: #64748b !important; }
                body.dark-mode .mode-btn.bg-white { background-color: #334155 !important; color: #f8fafc !important; }
                body.dark-mode .mode-btn.text-muted { color: #94a3b8 !important; }
                body.dark-mode .qr-box { background-color: #ffffff !important; padding: 10px; }
                body.dark-mode .btn-cancel-custom { background-color: #1e293b !important; color: #f8fafc !important; border-color: #334155 !important; }
                body.dark-mode .btn-cancel-custom:hover { background-color: #334155 !important; }
                body.dark-mode .clean-card { background-color: #0f172a !important; }
            `}</style>
        </Modal>
    );
};

export default WhatsAppModal;