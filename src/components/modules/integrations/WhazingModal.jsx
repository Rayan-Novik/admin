import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, Alert, Collapse } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const KanbanModal = ({ show, onHide, onUpdateSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Nomes exatos das colunas do Prisma!
    const [formData, setFormData] = useState({
        base_url: 'https://core.azun.com.br/v1/api/external',
        api_id: '',
        token: '',
        whazing_tenant_id: '1',
        board_pedidos_id: '',
        col_pendente_id: '',
        col_pago_id: '',
        col_recusado_id: ''
    });

    useEffect(() => {
        if (show) {
            setShowAdvanced(false);
            fetchConfiguracoes();
        }
    }, [show]);

    const fetchConfiguracoes = async () => {
        setLoading(true);
        try {
            // 🟢 Puxa tudo da nova tabela whazing_configuracoes
            const { data } = await api.get('/whazing-config');
            if (data && Object.keys(data).length > 0) {
                setFormData(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            toast.error("Erro ao carregar configurações do Whazing.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 🟢 Salva na nova rota
            await api.post('/whazing-config', formData);
            
            toast.success("Whazing configurado com sucesso!");
            onUpdateSuccess("Integração com CRM atualizada!");
            onHide();
        } catch (error) {
            toast.error("Erro ao salvar as configurações.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
            <Modal.Header closeButton className="bg-light border-0">
                <Modal.Title className="fw-bold fs-5 d-flex align-items-center">
                    <div className="rounded-circle bg-primary d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px', color: 'white' }}>
                        <i className="bi bi-kanban"></i>
                    </div>
                    KanbanPro (WebAzun CRM)
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <Form>
                        <Alert variant="info" className="border-0 rounded-4 small">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Conecte o KanbanPro para que seus pedidos gerem Cards automaticamente.
                        </Alert>

                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Label className="small fw-bold text-muted">API ID</Form.Label>
                                <Form.Control name="api_id" value={formData.api_id || ''} onChange={handleChange} placeholder="Ex: 707a1346-7071..." className="bg-light border-0" />
                            </Col>
                            <Col md={12} className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Bearer Token</Form.Label>
                                <Form.Control name="token" value={formData.token || ''} onChange={handleChange} as="textarea" rows={2} className="bg-light border-0" />
                            </Col>
                        </Row>

                        <div className="mt-3 border-top pt-3">
                            <Button 
                                variant="link" 
                                className="text-decoration-none text-secondary p-0 fw-bold d-flex align-items-center"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} me-2`}></i>
                                Configurações de Roteamento (Avançado)
                            </Button>
                        </div>

                        <Collapse in={showAdvanced}>
                            <div className="mt-3 p-3 bg-light rounded-4 border">
                                <Alert variant="warning" className="small border-0 py-2 d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
                                    <div>
                                        <strong>Requer Suporte Técnico:</strong> Estes dados são exclusivos da estrutura interna. Entre em contato com nossa equipe para preenchê-los.
                                    </div>
                                </Alert>

                                <Row>
                                    <Col md={12} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">URL Base da API</Form.Label>
                                        <Form.Control name="base_url" value={formData.base_url || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">ID da Empresa (Whazing Tenant)</Form.Label>
                                        <Form.Control name="whazing_tenant_id" value={formData.whazing_tenant_id || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">ID do Board de Pedidos</Form.Label>
                                        <Form.Control name="board_pedidos_id" value={formData.board_pedidos_id || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">ID Coluna: PENDENTE</Form.Label>
                                        <Form.Control name="col_pendente_id" value={formData.col_pendente_id || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">ID Coluna: PAGO</Form.Label>
                                        <Form.Control name="col_pago_id" value={formData.col_pago_id || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">ID Coluna: RECUSADO</Form.Label>
                                        <Form.Control name="col_recusado_id" value={formData.col_recusado_id || ''} onChange={handleChange} className="border-0" />
                                    </Col>
                                </Row>
                            </div>
                        </Collapse>

                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 bg-light d-flex justify-content-between">
                <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading} className="fw-bold px-4 rounded-3">
                    {saving ? <Spinner size="sm" /> : 'Salvar Configurações'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default KanbanModal;