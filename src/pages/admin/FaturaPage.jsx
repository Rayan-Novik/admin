import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Spinner, Alert, Row, Col, Badge, InputGroup, Form, Table, Collapse } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const FaturaPage = () => {
    const [statusInfo, setStatusInfo] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    const [pagamentoPix, setPagamentoPix] = useState(null);
    const [generating, setGenerating] = useState(false);

    const [selectedPixHistorico, setSelectedPixHistorico] = useState(null);

    const carregarDados = useCallback(async (silencioso = false) => {
        try {
            if (!silencioso) setLoadingData(true);
            const [statusRes, historicoRes] = await Promise.all([
                api.get('/fatura/status'),
                api.get('/fatura/historico')
            ]);
            setStatusInfo(statusRes.data);
            setHistorico(historicoRes.data);

            if (statusRes.data.status_assinatura === 'ATIVO' && pagamentoPix) {
                setPagamentoPix(null);
                setSelectedPixHistorico(null);
                toast.success("Pagamento confirmado com sucesso!");
            }
        } catch (err) {
            if (!silencioso) toast.error('Erro ao carregar os dados da assinatura.');
        } finally {
            if (!silencioso) setLoadingData(false);
        }
    }, [pagamentoPix]);

    useEffect(() => {
        let interval;
        if (pagamentoPix || selectedPixHistorico) {
            interval = setInterval(() => {
                carregarDados(true);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [pagamentoPix, selectedPixHistorico, carregarDados]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const handleGerarPix = async () => {
        setGenerating(true);
        try {
            const response = await api.post('/fatura/gerar');

            if (response.data.pix_copia_cola || response.data.url_pagamento) {
                setPagamentoPix(response.data);
                toast.success("Fatura gerada com sucesso!");
                carregarDados(true);
                
                // Abre o link do AbacatePay automaticamente em nova aba (opcional)
                // if(response.data.url_pagamento) window.open(response.data.url_pagamento, '_blank');
                
            } else {
                toast.error("Erro: A operadora de pagamentos não retornou o link da fatura.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erro ao gerar a fatura.');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyPix = (codigo) => {
        if (codigo) {
            navigator.clipboard.writeText(codigo);
            toast.info('Código Pix copiado!');
        }
    };

    const handleVerComprovante = (fatura) => {
        if (fatura.comprovante_url) {
            window.open(fatura.comprovante_url, '_blank');
        } else {
            toast.info("Pagamento registrado com sucesso! (ID: " + fatura.id + ")");
        }
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'Não definida';
        return new Date(dataString).toLocaleDateString('pt-BR');
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor / 100);
    };

    const hoje = new Date();

    const faturaPendente = historico.find(fat => fat.status === 'PENDENTE' && (fat.pix_copia_cola || fat.url_pagamento));

    const faturaPagaEsteMes = historico.find(fat => {
        if (fat.status !== 'PAGO') return false;
        const dataCriacao = new Date(fat.criado_em);
        return dataCriacao.getMonth() === hoje.getMonth() && dataCriacao.getFullYear() === hoje.getFullYear();
    });

    if (loadingData) {
        return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;
    }

    let badgeColor = 'secondary';
    if (statusInfo?.status_assinatura === 'ATIVO') badgeColor = 'success';
    if (statusInfo?.status_assinatura === 'TRIAL') badgeColor = 'primary';
    if (['BLOQUEADA', 'VENCIDA'].includes(statusInfo?.status_assinatura)) badgeColor = 'danger';

    // =========================================================
    // COMPONENTE DE RENDERIZAÇÃO DO BLOCO DE PAGAMENTO
    // =========================================================
    const PaymentBlock = ({ data }) => (
        <div className="w-100 animate__animated animate__fadeIn text-center">
            <h5 className="fw-bold text-success mb-4"><i className="bi bi-check-circle-fill me-2"></i>Fatura Disponível</h5>

            {/* OPÇÃO 1: PAGAMENTO DIRETO (Fica oculto no AbacatePay pois eles não mandam o código cru) */}
            {data.pix_copia_cola && (
                <div className="bg-light p-4 rounded-4 border shadow-sm mb-4 mx-auto" style={{ maxWidth: '450px' }}>
                    <h6 className="fw-bold text-dark mb-3"><i className="bi bi-qr-code-scan me-2"></i>Pagamento PIX Direto</h6>
                    
                    <div className="mb-3 p-3 bg-white rounded-4 d-inline-block border shadow-sm">
                        <QRCodeSVG value={data.pix_copia_cola} size={180} />
                    </div>

                    <p className="text-muted small mb-2">Escaneie o QR Code ou use o Copia e Cola:</p>

                    <InputGroup size="lg" className="shadow-sm">
                        <Form.Control
                            value={data.pix_copia_cola}
                            readOnly
                            className="font-monospace bg-white text-muted fs-6"
                        />
                        <Button variant="primary" onClick={() => handleCopyPix(data.pix_copia_cola)} className="fw-bold px-3">
                            <i className="bi bi-clipboard me-2"></i>Copiar
                        </Button>
                    </InputGroup>
                </div>
            )}

            {data.pix_copia_cola && data.url_pagamento && (
                <div className="d-flex align-items-center justify-content-center my-4 opacity-50 mx-auto" style={{ maxWidth: '450px' }}>
                    <div className="flex-grow-1 border-top border-secondary"></div>
                    <span className="mx-3 fw-bold small text-secondary">OU</span>
                    <div className="flex-grow-1 border-top border-secondary"></div>
                </div>
            )}

            {/* OPÇÃO 2: LINK DE PAGAMENTO (Principal para o AbacatePay) */}
            {data.url_pagamento && (
                <div className="mx-auto mb-4 mt-2" style={{ maxWidth: '450px' }}>
                    <p className="text-dark mb-3 fw-semibold fs-6">Clique no botão abaixo para acessar o checkout seguro e ver seu QR Code:</p>
                    <a
                        href={data.url_pagamento}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-success rounded-pill px-4 fw-bold w-100 py-3 shadow d-flex justify-content-center align-items-center fs-5"
                    >
                        <i className="bi bi-shield-lock-fill me-2"></i>
                        Pagar Fatura Agora
                    </a>
                </div>
            )}

            <div className="d-flex align-items-center justify-content-center text-success fw-bold small mt-4 bg-success bg-opacity-10 py-2 px-3 rounded-pill mx-auto" style={{ maxWidth: '300px' }}>
                <Spinner animation="grow" size="sm" variant="success" className="me-2" />
                Aguardando confirmação...
            </div>
            <p className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>A tela atualizará automaticamente após o pagamento.</p>
        </div>
    );

    return (
        <div className="fatura-page-wrapper mt-3 mx-2 pb-5">
            <h4 className="fw-bold mb-4">Minha Assinatura</h4>

            <Row className="g-4 mb-5">
                {/* COLUNA ESQUERDA: RESUMO */}
                <Col lg={5}>
                    <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 p-lg-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 className="text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '0.8rem' }}>Plano Atual</h6>
                                    <h4 className="fw-bold mb-0 text-dark">
                                        <i className="bi bi-rocket-takeoff-fill text-primary me-2"></i>
                                        {statusInfo?.plano === 'PRO' ? 'SaaS Profissional' : 'SaaS Básico'}
                                    </h4>
                                </div>
                                <Badge bg={badgeColor} className="px-3 py-2 rounded-pill shadow-sm">
                                    {statusInfo?.status_assinatura || 'DESCONHECIDO'}
                                </Badge>
                            </div>
                            <hr className="my-4" />
                            <div className="mb-4">
                                <p className="text-muted mb-1 small">Próximo Vencimento</p>
                                <h5 className="fw-bold text-dark mb-0">
                                    <i className="bi bi-calendar-check me-2 text-primary"></i>
                                    {formatarData(statusInfo?.data_vencimento)}
                                </h5>
                            </div>
                            <div className="mb-4">
                                <p className="text-muted mb-1 small">Valor da Mensalidade</p>
                                <h3 className="fw-bold text-dark mb-0">
                                    {statusInfo?.plano === 'PRO' ? 'R$ 89,90' : 'R$ 49,90'}
                                    <span className="fs-6 text-muted fw-normal"> /mês</span>
                                </h3>
                            </div>
                            <Alert variant="info" className="border-0 bg-primary bg-opacity-10 d-flex align-items-start mb-0 rounded-3">
                                <i className="bi bi-info-circle-fill text-primary me-3 mt-1"></i>
                                <p className="small text-primary mb-0 fw-semibold">
                                    Ao pagar, seu acesso é renovado por mais 30 dias automaticamente.
                                </p>
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>

                {/* COLUNA DIREITA: ÁREA DE GERAÇÃO */}
                <Col lg={7}>
                    <Card className="border-0 shadow-sm rounded-4 h-100 bg-white border border-primary border-opacity-10">
                        <Card.Body className="p-4 p-lg-5 d-flex flex-column justify-content-center align-items-center text-center">
                            {!pagamentoPix ? (
                                faturaPagaEsteMes ? (
                                    <div className="text-center">
                                        <div className="mb-4 bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-check2-all fs-1 text-success"></i>
                                        </div>
                                        <h5 className="fw-bold text-success mb-2">Mensalidade em Dia!</h5>
                                        <p className="text-muted mb-0">A fatura referente a este mês já foi paga com sucesso. Obrigado por continuar conosco!</p>
                                    </div>
                                ) : faturaPendente ? (
                                    <div className="text-center">
                                        <div className="mb-4 bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
                                        </div>
                                        <h5 className="fw-bold text-warning mb-2">Fatura já Gerada</h5>
                                        <p className="text-muted mb-0">Você já possui uma fatura pendente. Acesse o <strong>Histórico de Faturas</strong> abaixo para realizar o pagamento.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                            <i className="bi bi-shield-lock fs-1 text-primary"></i>
                                        </div>
                                        <h5 className="fw-bold mb-2">Sua fatura está pronta!</h5>
                                        <p className="text-muted mb-4">Gere sua fatura para acessar a página segura de pagamento da nossa operadora.</p>
                                        <Button
                                            variant="dark" size="lg" className="rounded-pill px-5 py-3 fw-bold shadow"
                                            onClick={handleGerarPix} disabled={generating}
                                        >
                                            {generating ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-box-arrow-up-right me-2"></i>}
                                            Acessar Pagamento Seguro
                                        </Button>
                                    </>
                                )
                            ) : (
                                <PaymentBlock data={pagamentoPix} />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* HISTÓRICO DE FATURAS */}
            <h5 className="fw-bold mb-3"><i className="bi bi-clock-history me-2 text-primary"></i>Histórico de Faturas</h5>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th className="py-3 px-4 text-muted small text-uppercase">Data</th>
                            <th className="py-3 text-muted small text-uppercase">Plano</th>
                            <th className="py-3 text-muted small text-uppercase">Valor</th>
                            <th className="py-3 text-muted small text-center text-uppercase">Status</th>
                            <th className="py-3 text-muted small text-end px-4 text-uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historico.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhuma fatura encontrada.</td></tr>
                        ) : (
                            historico.map((fat) => (
                                <React.Fragment key={fat.id}>
                                    <tr>
                                        <td className="px-4 py-3 fw-semibold">{formatarData(fat.criado_em)}</td>
                                        <td className="py-3 text-muted small">{fat.descricao || 'Mensalidade SaaS'}</td>
                                        <td className="py-3 fw-bold">{formatarMoeda(fat.valor)}</td>
                                        <td className="py-3 text-center">
                                            <Badge bg={fat.status === 'PAGO' ? 'success' : fat.status === 'PENDENTE' ? 'warning text-dark' : 'danger'} className="rounded-pill px-3 py-2">
                                                {fat.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-end px-4">
                                            {fat.status === 'PAGO' ? (
                                                <Button variant="outline-success" size="sm" className="rounded-pill" onClick={() => handleVerComprovante(fat)}>
                                                    <i className="bi bi-check-circle-fill me-1"></i> Comprovante
                                                </Button>
                                            ) : fat.status === 'PENDENTE' ? (
                                                <Button
                                                    variant="primary" size="sm" className="rounded-pill shadow-sm"
                                                    onClick={() => setSelectedPixHistorico(selectedPixHistorico === fat.id ? null : fat.id)}
                                                >
                                                    <i className={`bi ${selectedPixHistorico === fat.id ? 'bi-chevron-up' : 'bi-credit-card'} me-1`}></i>
                                                    {selectedPixHistorico === fat.id ? 'Fechar' : 'Pagar Agora'}
                                                </Button>
                                            ) : (
                                                <span className="text-muted small">Expirada</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* LINHA EXPANSÍVEL (HISTÓRICO) */}
                                    <tr>
                                        <td colSpan="5" className="p-0 border-0">
                                            <Collapse in={selectedPixHistorico === fat.id}>
                                                <div className="bg-white border-bottom pt-4 pb-4">
                                                    {fat.pix_copia_cola || fat.url_pagamento ? (
                                                        <PaymentBlock data={fat} />
                                                    ) : (
                                                        <Alert variant="warning" className="mx-auto border-0 text-start" style={{ maxWidth: '400px' }}>
                                                            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                                                            Esta fatura é antiga e o link não foi salvo. Feche e gere uma nova!
                                                        </Alert>
                                                    )}
                                                </div>
                                            </Collapse>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
};

export default FaturaPage;