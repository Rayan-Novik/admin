// Frontend: src/components/modules/integrations/TaxManagerModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const TaxManagerModal = ({ show, onHide }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estrutura inicial das taxas
    const [taxes, setTaxes] = useState({
        MAQUININHA_CREDITO: { porcentagem: 4.5, fixo: 0.0 },
        MAQUININHA_DEBITO: { porcentagem: 1.99, fixo: 0.0 },
        MAQUININHA_PIX: { porcentagem: 0.0, fixo: 0.0 },
        MERCADOPAGO: { porcentagem: 4.99, fixo: 0.0 },
        STRIPE: { porcentagem: 3.99, fixo: 0.39 },
        ASAAS: { porcentagem: 1.99, fixo: 0.0 },
        ABACATEPAY: { porcentagem: 2.0, fixo: 0.0 }
    });

    useEffect(() => {
        if (show) fetchTaxes();
    }, [show]);

    const fetchTaxes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/payment-gateways/taxes');
            if (data && Object.keys(data).length > 0) {
                // Mescla os dados do banco com a estrutura inicial (garante que não quebre se faltar algum)
                setTaxes(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error("Erro ao buscar taxas", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (gateway, field, value) => {
        setTaxes(prev => ({
            ...prev,
            [gateway]: {
                ...prev[gateway],
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/payment-gateways/taxes', { taxes });
            toast.success("Taxas atualizadas com sucesso! Elas já serão aplicadas nas próximas vendas.");
            onHide();
        } catch (error) {
            toast.error("Erro ao salvar taxas.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold"><i className="bi bi-percent me-2 text-primary"></i>Configuração de Taxas</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted small mb-4">
                    Defina as taxas cobradas pelas suas maquininhas e gateways. Isso é fundamental para que o sistema calcule corretamente o seu Lucro Líquido no DRE.
                </p>

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <>
                        <h6 className="fw-bold text-uppercase mb-3 ls-1" style={{ fontSize: '11px', color: '#64748b' }}>Pagamento Presencial (Maquininha)</h6>
                        {['MAQUININHA_CREDITO', 'MAQUININHA_DEBITO', 'MAQUININHA_PIX'].map(gw => (
                            <Row key={gw} className="align-items-center mb-3">
                                <Col sm={4} className="fw-medium text-dark">{gw.replace('MAQUININHA_', 'Cartão de ').replace('PIX', 'PIX na Máquina')}</Col>
                                <Col sm={4}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-light border-end-0">%</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" value={taxes[gw].porcentagem} onChange={(e) => handleChange(gw, 'porcentagem', e.target.value)} />
                                    </InputGroup>
                                </Col>
                                <Col sm={4}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-light border-end-0">R$</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" placeholder="Taxa Fixa" value={taxes[gw].fixo} onChange={(e) => handleChange(gw, 'fixo', e.target.value)} />
                                    </InputGroup>
                                </Col>
                            </Row>
                        ))}

                        <hr className="my-4 opacity-25" />

                        <h6 className="fw-bold text-uppercase mb-3 ls-1" style={{ fontSize: '11px', color: '#64748b' }}>Gateways Online</h6>
                        {['MERCADOPAGO', 'STRIPE', 'ASAAS', 'ABACATEPAY'].map(gw => (
                            <Row key={gw} className="align-items-center mb-3">
                                <Col sm={4} className="fw-medium text-dark">{gw}</Col>
                                <Col sm={4}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-light border-end-0">%</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" value={taxes[gw].porcentagem} onChange={(e) => handleChange(gw, 'porcentagem', e.target.value)} />
                                    </InputGroup>
                                </Col>
                                <Col sm={4}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-light border-end-0">R$</InputGroup.Text>
                                        <Form.Control type="number" step="0.01" value={taxes[gw].fixo} onChange={(e) => handleChange(gw, 'fixo', e.target.value)} />
                                    </InputGroup>
                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Spinner size="sm" animation="border" /> : 'Salvar Taxas'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TaxManagerModal;