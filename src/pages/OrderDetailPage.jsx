import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Spinner, Alert, Badge, Button, Container } from 'react-bootstrap';
import api from '../services/api';
import CryptoJS from 'crypto-js';

// --- FUNÇÃO DE DESCRIPTOGRAFIA ROBUSTA ---
const decryptData = (encryptedData) => {
    if (!encryptedData) return 'Não informado';
    
    // 1. Tenta pegar do .env
    // 2. Se não achar, usa a chave fixa (Hardcoded) para garantir que funcione
    const keyString = process.env.REACT_APP_ENCRYPTION_KEY || 'a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8';
    const ivString = process.env.REACT_APP_ENCRYPTION_IV || 'a1b2c3d4e5f6a7b8';
    
    try {
        const key = CryptoJS.enc.Utf8.parse(keyString);
        const iv = CryptoJS.enc.Utf8.parse(ivString);
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: CryptoJS.enc.Hex.parse(encryptedData) },
            key,
            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedText) return "Falha na descriptografia";
        return decryptedText;
    } catch (e) {
        console.error("Erro Crypto:", e);
        return "Erro dados";
    }
};

const OrderDetailPage = () => {
    const { id: orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/pedidos/${orderId}`);
                setOrder(data);
            } catch (err) {
                setError('Pedido não encontrado.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);
    
    const getStatusVariant = (status) => {
        if (!status) return 'secondary';
        status = status.toUpperCase();
        if (status === 'PAGO') return 'success';
        if (status === 'CANCELADO' || status === 'REJEITADO' || status === 'ERRO') return 'danger';
        if (status === 'PENDENTE' || status === 'AGUARDANDO_PAGAMENTO') return 'warning';
        return 'info';
    };
    
    const getDeliveryStatusVariant = (status) => {
         if (!status) return 'secondary';
         status = status.toUpperCase();
         if (status === 'ENTREGUE' || status === 'RETIRADO') return 'success';
         if (status === 'ENVIADO') return 'info';
         return 'secondary';
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!order) return null;

    const pedidoInfo = order.pedido || {};
    const clienteInfo = order.cliente || {};
    const enderecoInfo = order.endereco || {};
    const itemsInfo = order.items || [];
    
    // ✅ DESCRIPTOGRAFA CPF E TELEFONE
    // Se o backend enviar "telefone_criptografado", usamos ele.
    const cpfCliente = decryptData(clienteInfo.cpf_criptografado);
    const telefoneCliente = decryptData(clienteInfo.telefone_criptografado); 

    const statusPagamento = pedidoInfo.status_pagamento ? pedidoInfo.status_pagamento.toUpperCase() : '';
    const isPago = statusPagamento === 'PAGO';
    const isPendente = statusPagamento === 'PENDENTE' || statusPagamento === 'AGUARDANDO_PAGAMENTO';
    const isFalha = statusPagamento === 'CANCELADO' || statusPagamento === 'REJEITADO' || statusPagamento === 'ERRO';
    const isRetirada = !pedidoInfo.id_endereco_entrega;

    return (
        <Container className="my-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1 className="h3 mb-0">Admin: Pedido #{pedidoInfo.id_pedido}</h1>
                    <small className="text-muted">
                        Data: {pedidoInfo.data_pedido ? new Date(pedidoInfo.data_pedido).toLocaleDateString('pt-BR') : 'N/A'}
                    </small>
                </Col>
                <Col className="text-end">
                    <Button as={Link} to="/admin/orderlist" variant="outline-secondary">
                        <i className="fas fa-arrow-left me-2"></i> Voltar à Lista
                    </Button>
                </Col>
            </Row>

            <div className="mb-4">
                {isPago && (
                    <Alert variant="success" className="d-flex align-items-center shadow-sm">
                        <i className="fas fa-check-circle fa-2x me-3"></i>
                        <div>
                            <h5 className="alert-heading mb-1">Pagamento Aprovado</h5>
                            <p className="mb-0">Pedido seguro para {isRetirada ? 'liberação de retirada' : 'envio'}.</p>
                        </div>
                    </Alert>
                )}
                {isPendente && (
                    <Alert variant="warning" className="d-flex align-items-center shadow-sm border-warning">
                        <i className="fas fa-exclamation-triangle fa-2x me-3 text-warning"></i>
                        <div>
                            <h5 className="alert-heading mb-1">Atenção: Pagamento Pendente</h5>
                            <p className="mb-0 fw-bold">NÃO envie ou entregue este produto. Aguarde a aprovação.</p>
                        </div>
                    </Alert>
                )}
                {isFalha && (
                    <Alert variant="danger" className="d-flex align-items-center shadow-sm">
                        <i className="fas fa-ban fa-2x me-3"></i>
                        <div>
                            <h5 className="alert-heading mb-1">Pagamento Falhou/Cancelado</h5>
                            <p className="mb-0 fw-bold">Pedido cancelado. Não realize o envio.</p>
                        </div>
                    </Alert>
                )}
            </div>

            <Row className="g-4">
                <Col lg={8}>
                    {/* Itens */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white p-3 fw-bold">Itens do Pedido</Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                {itemsInfo.map((item) => (
                                    <ListGroup.Item key={item.id_item} className="d-flex align-items-center px-0">
                                        <Image 
                                            src={item.imagem_url || '/placeholder.png'} 
                                            alt={item.nome} 
                                            rounded 
                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                                            className="me-3"
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">{item.nome || 'Nome Indisponível'}</div>
                                            <div className="text-muted small">
                                                {item.quantidade} x R$ {parseFloat(item.preco || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="fw-bold ms-3">
                                            R$ {(item.quantidade * parseFloat(item.preco || 0)).toFixed(2)}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* Ações */}
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white p-3 fw-bold">Ações Administrativas</Card.Header>
                        <Card.Body>
                            <div className="d-flex gap-2 flex-wrap">
                                <Button variant="primary" disabled={!isPago}>
                                    <i className="fas fa-box me-2"></i> 
                                    {isRetirada ? 'Marcar como Pronto para Retirada' : 'Marcar como Enviado'}
                                </Button>
                                <Button variant="outline-dark" as={Link} to={`/admin/etiqueta/${pedidoInfo.id_pedido}`} disabled={!isPago}>
                                    <i className="fas fa-print me-2"></i> Imprimir Declaração
                                </Button>
                                {!isPago && !isFalha && (
                                    <Button variant="outline-danger">Cancelar Pedido</Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Resumo Financeiro</h5>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between px-0">
                                    <span>Subtotal</span>
                                    <span>R$ {parseFloat(pedidoInfo.preco_itens || 0).toFixed(2)}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between px-0">
                                    <span>{isRetirada ? 'Taxa Retirada' : 'Frete'}</span>
                                    {parseFloat(pedidoInfo.preco_frete) === 0 ? (
                                        <span className="text-success">Grátis</span>
                                    ) : (
                                        <span>R$ {parseFloat(pedidoInfo.preco_frete || 0).toFixed(2)}</span>
                                    )}
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between px-0 pt-3 border-top">
                                    <strong className="h5">Total</strong>
                                    <strong className="h5">R$ {parseFloat(pedidoInfo.preco_total || 0).toFixed(2)}</strong>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    {/* DADOS DO CLIENTE - CORRIGIDO */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                             <h5 className="mb-3">Dados do Cliente</h5>
                             <p className="mb-1"><strong>Nome:</strong> {clienteInfo.nome_completo}</p>
                             <p className="mb-1"><strong>Email:</strong> {clienteInfo.email}</p>
                             
                             {/* ✅ Telefone com descriptografia */}
                             <p className="mb-1">
                                <strong>Telefone:</strong> {telefoneCliente}
                             </p>
                             
                             {/* ✅ CPF com descriptografia */}
                             <p className="mb-0"><strong>CPF:</strong> {cpfCliente}</p>
                        </Card.Body>
                    </Card>

                    {/* Status */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="mb-3">Status Atual</h5>
                            <div className="mb-2 d-flex justify-content-between">
                                <span className="text-muted">Pagamento:</span>
                                <Badge bg={getStatusVariant(pedidoInfo.status_pagamento)} className="fs-6">
                                    {pedidoInfo.status_pagamento || 'Indefinido'}
                                </Badge>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Logística:</span>
                                <Badge bg={getDeliveryStatusVariant(pedidoInfo.status_entrega)} className="fs-6">
                                    {pedidoInfo.status_entrega || 'Indefinido'}
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Endereço / Retirada */}
                    <Card className="shadow-sm border-0">
                         <Card.Body>
                             <h5 className="mb-3">
                                {isRetirada ? <><i className="fas fa-store me-2"></i>Local de Retirada</> : <><i className="fas fa-truck me-2"></i>Endereço de Entrega</>}
                             </h5>
                             {isRetirada && enderecoInfo.complemento && (
                                 <div className="alert alert-info py-2 mb-2 fw-bold text-center">
                                     {enderecoInfo.complemento}
                                 </div>
                             )}
                             <address className="mb-0 text-muted">
                                 {enderecoInfo.logradouro}, {enderecoInfo.numero}<br/>
                                 {enderecoInfo.bairro}<br/>
                                 {enderecoInfo.cidade} - {enderecoInfo.estado}<br/>
                                 CEP: {enderecoInfo.cep}
                             </address>
                          </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default OrderDetailPage;