import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const IfoodModal = ({ show, onHide, onUpdateSuccess, isConfigured }) => {
    const [formData, setFormData] = useState({
        clientId: '',
        clientSecret: '',
        merchantId: '' // Opcional, mas bom para validação
    });
    const [loading, setLoading] = useState(false);

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
            // Chama a rota que cria/atualiza as credenciais
            // Nota: No backend, isso vai gerar o primeiro token automaticamente
            await api.post('/apikeys/ifood', formData);
            
            toast.success('iFood conectado com sucesso!');
            onUpdateSuccess('Integração iFood salva.');
            onHide();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao conectar com iFood.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold text-danger">
                    <i className="bi bi-shop me-2"></i>Configurar iFood
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Alert variant="info" className="small">
                        Você precisa das credenciais do <strong>Portal do Desenvolvedor iFood</strong>. 
                        Certifique-se de que seu aplicativo é do tipo <em>Centralizado</em> ou tenha o fluxo configurado.
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
        </Modal>
    );
};

export default IfoodModal;