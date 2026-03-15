import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api'; 
import { toast } from 'react-toastify';

const GoogleSettings = () => {
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Busca o valor atual
                const { data } = await api.get('/usuarios/google-client-id');
                if (data.clientId) setClientId(data.clientId);
            } catch (error) {
                // Silencia erro se não tiver config ainda
                console.warn("Google Client ID não configurado ainda.");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/usuarios/google-client-id', { clientId });
            toast.success('Google Client ID salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>;

    return (
        <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 text-danger">
                    <i className="bi bi-google me-2"></i> Configuração Google Login
                </h5>
                
                <Alert variant="info" className="small">
                    Para obter este ID, crie um projeto no <strong>Google Cloud Console</strong> &gt; Credenciais &gt; ID do Cliente OAuth (Aplicação Web).
                </Alert>

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Google Client ID</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={clientId} 
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Ex: 123456789-abcde...apps.googleusercontent.com"
                            required 
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? <Spinner size="sm" animation="border" /> : 'Salvar Configuração'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default GoogleSettings;