import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Card, InputGroup, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';

const DomainManager = () => {
    const [dominio, setDominio] = useState('');
    const [dominioSalvo, setDominioSalvo] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchDomain = async () => {
            try {
                const { data } = await api.get('/tenants/dominio'); 
                if (data && data.dominio_customizado) {
                    setDominio(data.dominio_customizado);
                    setDominioSalvo(data.dominio_customizado);
                }
            } catch (err) {
                console.error("Erro ao buscar domínio:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDomain();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        // Limpa o domínio (tira http://, https://, espaços e barras no final)
        let cleanDomain = dominio.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        try {
            await api.put('/tenants/dominio', { dominio_customizado: cleanDomain });
            setDominio(cleanDomain);
            setDominioSalvo(cleanDomain);
            setSuccess('Domínio salvo com sucesso! Siga as instruções abaixo para colocar sua loja no ar.');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar o domínio.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="p-4 p-lg-5">
                
                {/* CABEÇALHO */}
                <div className="mb-4">
                    <h4 className="fw-bold mb-2">Domínio Personalizado</h4>
                    <p className="text-muted">
                        Substitua o endereço padrão da plataforma pelo seu próprio endereço profissional (ex: <strong>www.sualoja.com.br</strong>). 
                        Siga o passo a passo abaixo para realizar a conexão.
                    </p>
                </div>

                {error && <Alert variant="danger" className="border-0 shadow-sm rounded-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}
                {success && <Alert variant="success" className="border-0 shadow-sm rounded-3"><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>}

                <Row className="g-5">
                    {/* COLUNA ESQUERDA: FORMULÁRIO E PASSO A PASSO */}
                    <Col lg={6}>
                        {/* PASSO 1 */}
                        <div className="mb-4">
                            <h6 className="fw-bold text-primary d-flex align-items-center mb-3">
                                <span className="badge bg-primary rounded-circle p-2 me-2">1</span> 
                                Informe o seu domínio
                            </h6>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group>
                                    <InputGroup className="shadow-sm">
                                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                                            <i className="bi bi-globe2"></i>
                                        </InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="ex: www.minhaloja.com.br" 
                                            value={dominio}
                                            onChange={(e) => setDominio(e.target.value)}
                                            className="border-start-0 ps-0"
                                            style={{ height: '48px' }}
                                        />
                                        <Button 
                                            type="submit" 
                                            variant="dark" 
                                            disabled={saving}
                                            className="px-4 fw-bold"
                                        >
                                            {saving ? <Spinner size="sm" animation="border" /> : 'Salvar'}
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        Não digite <code>https://</code>, apenas o <code>www</code> e o nome do seu site.
                                    </Form.Text>
                                </Form.Group>
                            </Form>
                        </div>

                        {/* PASSO 2 */}
                        <div className={`mb-4 ${!dominioSalvo ? 'opacity-50' : ''}`}>
                            <h6 className="fw-bold text-primary d-flex align-items-center mb-3">
                                <span className="badge bg-primary rounded-circle p-2 me-2">2</span> 
                                Configure o DNS
                            </h6>
                            <p className="small text-muted mb-2">
                                Acesse o painel da empresa onde você comprou o domínio (ex: <strong>Registro.br, GoDaddy, Hostinger</strong>) e crie um apontamento com os dados abaixo:
                            </p>
                        </div>

                        {/* PASSO 3 */}
                        <div className={`mb-4 ${!dominioSalvo ? 'opacity-50' : ''}`}>
                            <h6 className="fw-bold text-primary d-flex align-items-center mb-3">
                                <span className="badge bg-primary rounded-circle p-2 me-2">3</span> 
                                Aguarde a propagação
                            </h6>
                            <p className="small text-muted mb-0">
                                Após salvar no seu provedor, a internet pode levar de <strong>1 hora até 24 horas</strong> para reconhecer a mudança. O seu cadeado de segurança (SSL) será gerado automaticamente.
                            </p>
                        </div>
                    </Col>

                    {/* COLUNA DIREITA: A TABELA DE DNS (SÓ FICA NÍTIDA SE TIVER SALVO O DOMÍNIO) */}
                    <Col lg={6}>
                        <div className={`bg-light p-4 rounded-4 border ${dominioSalvo ? 'border-primary' : 'border-secondary'} border-opacity-25 h-100 position-relative overflow-hidden`} style={{ transition: 'all 0.3s' }}>
                            {/* Faixa superior de cor */}
                            <div className={`position-absolute top-0 start-0 w-100 ${dominioSalvo ? 'bg-primary' : 'bg-secondary'} bg-opacity-25`} style={{ height: '4px' }}></div>
                            
                            <h6 className="fw-bold text-dark mb-4 text-center">
                                <i className="bi bi-router text-primary me-2"></i> 
                                Dados para o seu Provedor
                            </h6>

                            {!dominioSalvo ? (
                                <div className="text-center text-muted p-4">
                                    <i className="bi bi-shield-lock fs-1 opacity-25 mb-3 d-block"></i>
                                    <p className="small mb-0">Salve o seu domínio no <strong>Passo 1</strong> para liberar as instruções de DNS.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive rounded-3 border shadow-sm bg-white mb-3">
                                        <table className="table mb-0 align-middle text-center">
                                            <thead className="table-light">
                                                <tr className="small text-muted text-uppercase">
                                                    <th className="fw-semibold py-3">Tipo</th>
                                                    <th className="fw-semibold py-3">Nome (Host)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="py-3"><span className="badge bg-dark px-3 py-2 rounded-pill">CNAME</span></td>
                                                    <td className="py-3 fw-bold text-dark fs-5">www</td>
                                                </tr>
                                                <tr className="table-light">
                                                    <td colSpan="2" className="text-start px-4 py-2 small fw-semibold text-muted text-uppercase">
                                                        Destino / Valor / Aponta para:
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2" className="py-3">
                                                        <div className="d-inline-flex align-items-center bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-3 border border-primary border-opacity-25">
                                                            <span className="font-monospace fw-bold fs-6 me-3">
                                                                cname.manateechat.shop
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <Alert variant="warning" className="border-0 shadow-sm small py-2 d-flex align-items-center mb-0">
                                        <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                                        <div><strong>Dica:</strong> Se o seu provedor pedir "TTL", deixe no automático ou em 3600.</div>
                                    </Alert>
                                </>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default DomainManager;