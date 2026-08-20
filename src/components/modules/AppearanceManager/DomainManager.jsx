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

    // Domínio base do sistema (ex: azun.com.br)
    const baseDomain = process.env.REACT_APP_BASE_DOMAIN;
    const cnameTarget = `cname.${baseDomain}`;

    // 🟢 LÓGICA INTELIGENTE PARA DESCOBRIR O "HOST" DO DNS
    const getDnsHost = (fullDomain) => {
        if (!fullDomain) return '';
        const parts = fullDomain.split('.');
        
        // Domínios Brasileiros (.com.br, .net.br)
        if (fullDomain.includes('.br')) {
            if (parts.length <= 3) return '@'; // Ex: lojaon.com.br
            return parts.slice(0, parts.length - 3).join('.'); // Ex: loja.lojaon.com.br -> loja
        }
        
        // Domínios Internacionais (.com, .net, .org)
        if (parts.length <= 2) return '@'; // Ex: lojaon.com
        return parts.slice(0, parts.length - 2).join('.'); // Ex: web.lojaon.com -> web
    };

    const hostDns = getDnsHost(dominioSalvo);
    const isRootDomain = hostDns === '@';

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

        // Limpa apenas o https e barras, mas MANTÉM exatamente o que o cliente digitou (com ou sem www)
        let cleanDomain = dominio.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        try {
            await api.put('/tenants/dominio', { dominio_customizado: cleanDomain });
            setDominio(cleanDomain);
            setDominioSalvo(cleanDomain);
            setSuccess('Domínio registrado no nosso sistema! Siga o Passo 2 para finalizar a ligação.');
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
                    <h4 className="fw-bold mb-2">Conectar Domínio Próprio</h4>
                    <p className="text-muted">
                        Utilize o seu próprio endereço oficial (ex: <strong>loja.seusite.com.br</strong> ou <strong>seusite.com</strong>). Siga os dois passos abaixo para realizar a conexão.
                    </p>
                </div>

                {error && <Alert variant="danger" className="border-0 shadow-sm rounded-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}
                {success && <Alert variant="success" className="border-0 shadow-sm rounded-3"><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>}

                <Row className="g-5">
                    {/* COLUNA ESQUERDA: AVISAR O SISTEMA */}
                    <Col lg={6}>
                        <div className="mb-4">
                            <h6 className="fw-bold text-primary d-flex align-items-center mb-3">
                                <span className="badge bg-primary rounded-circle p-2 me-2">1º</span> 
                                Informe como os clientes vão te achar
                            </h6>
                            <p className="small text-muted mb-3">
                                Digite exatamente o endereço que seus clientes usarão para acessar a sua loja. Pode ser com www, sem www, ou um subdomínio (como "loja." ou "app.").
                            </p>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group>
                                    <InputGroup className="shadow-sm">
                                        <InputGroup.Text className="bg-light border-end-0 text-muted">
                                            <i className="bi bi-globe2"></i>
                                        </InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="ex: loja.meusite.com.br" 
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
                                        Não digite <code>https://</code>.
                                    </Form.Text>
                                </Form.Group>
                            </Form>
                        </div>
                    </Col>

                    {/* COLUNA DIREITA: CONFIGURAR O PROVEDOR */}
                    <Col lg={6}>
                        <div className={`h-100 ${!dominioSalvo ? 'opacity-50' : ''}`} style={{ transition: 'all 0.3s' }}>
                            <h6 className="fw-bold text-primary d-flex align-items-center mb-3">
                                <span className="badge bg-primary rounded-circle p-2 me-2">2º</span> 
                                Crie a "Ponte" no seu Provedor
                            </h6>
                            <p className="small text-muted mb-3">
                                Acesse o site onde você comprou o seu domínio (ex: Registro.br, Hostinger, GoDaddy). Vá na aba de <strong>Zona de DNS</strong> e crie um novo apontamento com os dados abaixo:
                            </p>

                            {!dominioSalvo ? (
                                <div className="bg-light p-4 rounded-4 border border-secondary border-opacity-25 text-center text-muted">
                                    <i className="bi bi-lock-fill fs-2 opacity-25 mb-2 d-block"></i>
                                    <p className="small mb-0">Conclua o Passo 1 para liberar os dados de conexão gerados para você.</p>
                                </div>
                            ) : (
                                <div className="bg-light p-4 rounded-4 border border-primary border-opacity-25 position-relative">
                                    <div className="table-responsive rounded-3 border shadow-sm bg-white mb-3">
                                        <table className="table mb-0 align-middle">
                                            <thead className="table-light">
                                                <tr className="small text-muted text-uppercase text-center">
                                                    <th className="fw-semibold py-3 border-end">Tipo</th>
                                                    <th className="fw-semibold py-3 border-end">Nome (Host)</th>
                                                    <th className="fw-semibold py-3">Destino (Valor)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="text-center">
                                                    <td className="py-3 border-end">
                                                        <span className="badge bg-dark px-3 py-2 rounded-pill">CNAME</span>
                                                    </td>
                                                    <td className="py-3 fw-bold text-dark fs-5 border-end">
                                                        {hostDns}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="font-monospace fw-bold text-primary bg-primary bg-opacity-10 px-3 py-2 rounded">
                                                            {cnameTarget}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {isRootDomain && (
                                        <Alert variant="info" className="border-0 shadow-sm small py-2 mb-3">
                                            <i className="bi bi-info-circle-fill me-2 fs-5 float-start"></i>
                                            <strong>Aviso:</strong> Como você optou por não usar "www" ou outro subdomínio (o Host é <strong>@</strong>), alguns provedores antigos podem não aceitar o tipo CNAME. Se o seu provedor der erro, tente criar um apontamento do tipo <strong>ALIAS</strong> apontando para o mesmo destino.
                                        </Alert>
                                    )}

                                    <Alert variant="warning" className="border-0 shadow-sm small py-3 mb-0">
                                        <i className="bi bi-hourglass-split me-2 fs-5 float-start"></i>
                                        <strong>Pronto! Agora é só aguardar.</strong> A internet pode levar de 1 a 24 horas para propagar (espalhar) essa configuração. O SSL será gerado automaticamente.
                                    </Alert>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default DomainManager;