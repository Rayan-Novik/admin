import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const FacebookModal = ({ show, onHide, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        FB_PIXEL_ID: '',
        FB_PAGE_ID: '',
        FB_PAGE_TOKEN: '',
        FB_CATALOG_ID: '',
        FB_AD_ACCOUNT_ID: ''
    });

    useEffect(() => {
        if (show) {
            api.get('/apikeys/facebook')
                .then(res => {
                    if (res.data) setFormData(res.data);
                })
                .finally(() => setFetching(false));
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/apikeys/facebook', formData);
            onUpdateSuccess('Configurações do Facebook atualizadas!');
            onHide();
        } catch (err) {
            alert('Erro ao salvar configurações.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Configurações do Facebook & Meta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {fetching ? <Spinner animation="border" /> : (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>ID do Pixel do Facebook</Form.Label>
                                <Form.Control 
                                    value={formData.FB_PIXEL_ID} 
                                    onChange={e => setFormData({...formData, FB_PIXEL_ID: e.target.value})}
                                    placeholder="Ex: 934198299113795"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>ID da Página (Facebook Page ID)</Form.Label>
                                <Form.Control 
                                    value={formData.FB_PAGE_ID} 
                                    onChange={e => setFormData({...formData, FB_PAGE_ID: e.target.value})}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Token de Acesso da Página (Page Access Token)</Form.Label>
                                <Form.Control 
                                    as="textarea" rows={2}
                                    value={formData.FB_PAGE_TOKEN} 
                                    onChange={e => setFormData({...formData, FB_PAGE_TOKEN: e.target.value})}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>ID do Catálogo de Produtos</Form.Label>
                                <Form.Control 
                                    value={formData.FB_CATALOG_ID} 
                                    onChange={e => setFormData({...formData, FB_CATALOG_ID: e.target.value})}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>ID da Conta de Anúncios (act_XXX)</Form.Label>
                                <Form.Control 
                                    value={formData.FB_AD_ACCOUNT_ID} 
                                    onChange={e => setFormData({...formData, FB_AD_ACCOUNT_ID: e.target.value})}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancelar</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default FacebookModal;