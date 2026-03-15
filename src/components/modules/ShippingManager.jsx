import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import api from '../../services/api';

const ShippingManager = () => {
    const [settings, setSettings] = useState({
        CEP_ORIGEM: '',
        VALOR_MINIMO_FRETE_GRATIS_LOCAL: '',
        CUSTO_FRETE_LOCAL: '',
        VALOR_MINIMO_FRETE_GRATIS_NACIONAL: '',
        TIPO_CALCULO_NACIONAL: 'FIXO',
        CUSTO_FRETE_NACIONAL_FIXO: '',
        CORREIOS_COD_EMPRESA: '',
        CORREIOS_SENHA: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/frete/settings');
                if (data) setSettings(prev => ({ ...prev, ...data }));
            } catch (err) { setError('Não foi possível carregar as configurações.'); }
            finally { setLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSuccess('');
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.put('/frete/settings', settings);
            setSuccess('Configurações salvas com sucesso!');
        } catch (err) { setError('Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Form onSubmit={handleSubmit}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="mb-1 fw-bold">Configurações de Frete</h5>
                    <p className="text-muted small mb-0">Defina regras de envio e integração com Correios.</p>
                </div>
                <Button variant="primary" type="submit" disabled={saving} className="shadow-sm px-4">
                    {saving ? <Spinner as="span" animation="border" size="sm" /> : 'Salvar Alterações'}
                </Button>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Row className="g-4">
                {/* --- COLUNA ESQUERDA: REGRAS GERAIS E LOCAIS --- */}
                <Col lg={6}>
                    {/* Origem e Regra Geral */}
                    <Card className="shadow-sm border-0 rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                                <i className="bi bi-geo-alt-fill fs-5"></i> Origem
                            </h6>
                            <Form.Group controlId="cepOrigem">
                                <Form.Label className="fw-medium small">CEP de Origem</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-end-0 text-primary"><i className="bi bi-pin-map"></i></InputGroup.Text>
                                    <Form.Control 
                                        type="text" 
                                        name="CEP_ORIGEM" 
                                        value={settings.CEP_ORIGEM || ''} 
                                        onChange={handleChange} 
                                        placeholder="00000-000"
                                        className="bg-light border-start-0"
                                    />
                                </InputGroup>
                                <Form.Text className="text-muted small">Usado como base para todos os cálculos.</Form.Text>
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    {/* Frete Local */}
                    <Card className="shadow-sm border-0 rounded-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold mb-4 text-info d-flex align-items-center gap-2">
                                <i className="bi bi-bicycle fs-5"></i> Frete Local (Mesma Cidade)
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium small">Custo Fixo</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="bg-light border-end-0">R$</InputGroup.Text>
                                            <Form.Control type="number" step="0.01" name="CUSTO_FRETE_LOCAL" value={settings.CUSTO_FRETE_LOCAL || ''} onChange={handleChange} className="bg-light border-start-0" />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium small">Frete Grátis Acima De</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="bg-light border-end-0 text-success fw-bold">R$</InputGroup.Text>
                                            <Form.Control type="number" step="0.01" name="VALOR_MINIMO_FRETE_GRATIS_LOCAL" value={settings.VALOR_MINIMO_FRETE_GRATIS_LOCAL || ''} onChange={handleChange} className="bg-light border-start-0" />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- COLUNA DIREITA: FRETE NACIONAL E CORREIOS --- */}
                <Col lg={6}>
                    {/* Frete Nacional */}
                    <Card className="shadow-sm border-0 rounded-4 mb-4">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold mb-4 text-warning d-flex align-items-center gap-2">
                                <i className="bi bi-globe-americas fs-5"></i> Frete Nacional
                            </h6>
                            
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-medium small mb-2 d-block">Modo de Cálculo</Form.Label>
                                <div className="d-flex gap-3 bg-light p-2 rounded-3 border">
                                    <Form.Check 
                                        type="radio" 
                                        label="Custo Fixo" 
                                        id="calc-fixo" 
                                        name="TIPO_CALCULO_NACIONAL" 
                                        value="FIXO" 
                                        checked={settings.TIPO_CALCULO_NACIONAL === 'FIXO'} 
                                        onChange={handleChange}
                                        className="fw-medium"
                                    />
                                    <Form.Check 
                                        type="radio" 
                                        label="Automático (Correios)" 
                                        id="calc-auto" 
                                        name="TIPO_CALCULO_NACIONAL" 
                                        value="AUTOMATICO" 
                                        checked={settings.TIPO_CALCULO_NACIONAL === 'AUTOMATICO'} 
                                        onChange={handleChange}
                                        className="fw-medium"
                                    />
                                </div>
                            </Form.Group>

                            <Row className="g-3">
                                {settings.TIPO_CALCULO_NACIONAL === 'FIXO' && (
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-medium small">Valor do Frete Fixo</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light border-end-0">R$</InputGroup.Text>
                                                <Form.Control type="number" step="0.01" name="CUSTO_FRETE_NACIONAL_FIXO" value={settings.CUSTO_FRETE_NACIONAL_FIXO || ''} onChange={handleChange} className="bg-light border-start-0" />
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                )}
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium small">Frete Grátis Acima De</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text className="bg-light border-end-0 text-success fw-bold">R$</InputGroup.Text>
                                            <Form.Control type="number" step="0.01" name="VALOR_MINIMO_FRETE_GRATIS_NACIONAL" value={settings.VALOR_MINIMO_FRETE_GRATIS_NACIONAL || ''} onChange={handleChange} className="bg-light border-start-0" />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {settings.TIPO_CALCULO_NACIONAL === 'AUTOMATICO' && (
                                <Alert variant="info" className="mt-3 mb-0 small border-0 bg-info bg-opacity-10 text-info">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    O cálculo será feito com base no peso e dimensões dos produtos.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Credenciais Correios */}
                    <Card className="shadow-sm border-0 rounded-4 bg-light border">
                        <Card.Body className="p-4">
                            <h6 className="fw-bold mb-3 text-secondary d-flex align-items-center justify-content-between">
                                <span><i className="bi bi-key-fill me-2"></i> Contrato Correios</span>
                                <Badge bg="secondary" className="fw-normal" style={{fontSize: '0.65rem'}}>OPCIONAL</Badge>
                            </h6>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium small">Código Administrativo</Form.Label>
                                        <Form.Control type="text" name="CORREIOS_COD_EMPRESA" value={settings.CORREIOS_COD_EMPRESA || ''} onChange={handleChange} placeholder="Ex: 08082650" className="border-0 shadow-sm" />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-medium small">Senha do Contrato</Form.Label>
                                        <Form.Control type="password" name="CORREIOS_SENHA" value={settings.CORREIOS_SENHA || ''} onChange={handleChange} className="border-0 shadow-sm" />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Form>
    );
};

export default ShippingManager;