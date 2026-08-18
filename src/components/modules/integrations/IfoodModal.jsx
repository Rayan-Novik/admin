import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const IfoodModal = ({ show, onHide, onUpdateSuccess, isConfigured }) => {
    const [formData, setFormData] = useState({
        clientId: '',
        clientSecret: '',
        merchantId: ''
    });
    const [loading, setLoading] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // Limpa o form ao abrir
    useEffect(() => {
        if (show && !isConfigured) {
            setFormData({ clientId: '', clientSecret: '', merchantId: '' });
        }
    }, [show, isConfigured]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Chama a rota específica do seu novo módulo iFood no backend
            await api.post('/ifood/auth', formData);
            
            toast.success('iFood conectado com sucesso!');
            onUpdateSuccess('Integração iFood salva.');
            onHide();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Erro ao conectar com iFood.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Tem certeza que deseja desconectar o iFood? Seus produtos vinculados pararão de sincronizar.")) {
            return;
        }

        setIsDisconnecting(true);
        try {
            await api.delete('/ifood/auth');
            toast.success('iFood desconectado.');
            onUpdateSuccess('Integração iFood removida.');
            onHide();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao desconectar iFood.');
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold text-danger">
                    <i className="bi bi-shop me-2"></i>Integração iFood
                </Modal.Title>
            </Modal.Header>
            
            {isConfigured ? (
                // TELA QUANDO JÁ ESTÁ CONECTADO
                <div className="p-4 text-center">
                    <div className="mb-3">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h5 className="fw-bold">Loja Conectada</h5>
                    <p className="text-muted small mb-4">
                        Sua loja já está autenticada e sincronizando com o iFood. 
                        Para alterar as credenciais, você precisa desconectar primeiro.
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="secondary" onClick={onHide} disabled={isDisconnecting}>
                            Fechar
                        </Button>
                        <Button variant="outline-danger" onClick={handleDisconnect} disabled={isDisconnecting}>
                            {isDisconnecting ? <Spinner size="sm" animation="border" /> : 'Desconectar iFood'}
                        </Button>
                    </div>
                </div>
            ) : (
                // TELA DE FORMULÁRIO PARA CONECTAR
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Alert variant="info" className="small">
                            Você precisa das credenciais do <strong>Portal do Desenvolvedor iFood</strong>. 
                            Certifique-se de que seu aplicativo possui as permissões necessárias para leitura de catálogo e pedidos.
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label>Client ID</Form.Label>
                            <Form.Control
                                type="text"
                                name="clientId"
                                value={formData.clientId}
                                onChange={handleChange}
                                placeholder="Ex: 9ce8ac3e-..."
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Client Secret</Form.Label>
                            <Form.Control
                                type="password"
                                name="clientSecret"
                                value={formData.clientSecret}
                                onChange={handleChange}
                                placeholder="Chave secreta..."
                                required
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Merchant ID (ID da Loja)</Form.Label>
                            <Form.Control
                                type="text"
                                name="merchantId"
                                value={formData.merchantId}
                                onChange={handleChange}
                                placeholder="Ex: 21fc9faf-..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Encontrado na URL do portal do parceiro ou na API.
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button variant="danger" type="submit" disabled={loading}>
                            {loading ? <Spinner size="sm" animation="border" /> : 'Conectar e Salvar'}
                        </Button>
                    </Modal.Footer>
                </Form>
            )}
        </Modal>
    );
};

export default IfoodModal;