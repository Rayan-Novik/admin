import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const TikTokModal = ({ show, onHide, onUpdateSuccess }) => {
    const [keys, setKeys] = useState({ TIKTOK_APP_KEY: '', TIKTOK_APP_SECRET: '', TIKTOK_SHOP_ID: '', TIKTOK_ACCESS_TOKEN: '', TIKTOK_REFRESH_TOKEN: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setKeys(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            await api.put('/apikeys/tiktok', keys);
            onUpdateSuccess('Chaves do TikTok Shop atualizadas!');
            onHide();
        } catch (err) {
            setError('Erro ao guardar as chaves do TikTok.');
        } finally { setSaving(false); }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">TikTok Shop</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col md={12}><Form.Group><Form.Label className="fw-medium">App Key</Form.Label><Form.Control name="TIKTOK_APP_KEY" value={keys.TIKTOK_APP_KEY} onChange={handleChange} /></Form.Group></Col>
                        <Col md={12}><Form.Group><Form.Label className="fw-medium">App Secret</Form.Label><Form.Control type="password" name="TIKTOK_APP_SECRET" value={keys.TIKTOK_APP_SECRET} onChange={handleChange} /></Form.Group></Col>
                        <Col md={12}><Form.Group><Form.Label className="fw-medium">Access Token</Form.Label><Form.Control as="textarea" rows={2} name="TIKTOK_ACCESS_TOKEN" value={keys.TIKTOK_ACCESS_TOKEN} onChange={handleChange} /></Form.Group></Col>
                    </Row>
                    <div className="d-grid mt-4"><Button variant="primary" type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Salvar Conexão'}</Button></div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default TikTokModal;