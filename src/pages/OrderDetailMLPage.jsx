import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Spinner, Alert, Badge, Form, Button } from 'react-bootstrap';
import api from '../services/api';

const OrderDetailMLPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [xmlFile, setXmlFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/mercadolivre/orders/${id}`);
                setOrder(data);
            } catch (err) {
                setError('Não foi possível carregar os detalhes do pedido.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [id]);

    const getStatusVariant = (status) => {
        if (status === 'paid') return 'success';
        if (status === 'cancelled') return 'danger';
        return 'warning';
    };

    const handleFileChange = (e) => setXmlFile(e.target.files[0]);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!xmlFile) { return alert('Por favor, selecione um arquivo XML.'); }
        const shipmentId = order?.shipping?.id;
        if (!shipmentId) { return alert('Erro: ID de envio não encontrado.'); }

        const formData = new FormData();
        formData.append('invoice_xml', xmlFile);
        setUploading(true);
        try {
            await api.post(`/mercadolivre/shipments/${shipmentId}/invoice`, formData);
            alert('Nota Fiscal enviada com sucesso!');
        } catch (error) {
            alert('Falha ao enviar a Nota Fiscal.');
            console.error(error.response?.data || error);
        } finally {
            setUploading(false);
        }
    };

    const canUploadInvoice = order && order.status === 'paid' && order.shipping && order.shipping.id;

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!order) return null;

    return (
        <>
            <Row className="align-items-center mb-4">
                <Col>
                    <h1 className="h3 mb-0">Pedido do Mercado Livre #{order.id}</h1>
                    <small className="text-muted">
                        Realizado em {new Date(order.date_created).toLocaleString('pt-BR')}
                    </small>
                </Col>
                <Col className="text-end">
                    <Button as={Link} to="/orders" variant="light">Voltar</Button>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Coluna Principal (Esquerda) */}
                <Col lg={8}>
                    <Card className="shadow-sm border-0" style={{ borderRadius: '0.75rem' }}>
                        <Card.Header className="bg-white p-3 fw-bold border-0">
                            Itens do Pedido ({order.order_items.length})
                        </Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                {order.order_items.map((item, index) => (
                                    <ListGroup.Item key={index} className="d-flex align-items-center px-0">
                                        <Image
                                            src={item.item.picture_url || `https://http2.mlstatic.com/D_NQ_NP_${item.item.id}-F.jpg`}
                                            alt={item.item.title}
                                            rounded
                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                            className="me-3"
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">{item.item.title}</div>
                                            <div className="text-muted small">
                                                {item.quantity} x R$ {item.unit_price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="fw-bold ms-3">
                                            R$ {(item.quantity * item.unit_price).toFixed(2)}
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Coluna da Direita (Sidebar) */}
                <Col lg={4}>
                    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '0.75rem' }}>
                        <Card.Body>
                            <h5 className="mb-3">Resumo do Pedido</h5>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between px-0"><span>Subtotal</span><span>R$ {order.total_amount.toFixed(2)}</span></ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between px-0"><span>Frete</span><span>R$ {order.shipping.cost ? order.shipping.cost.toFixed(2) : '0.00'}</span></ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between px-0 pt-3">
                                    <strong className="h5">Total</strong>
                                    <strong className="h5">R$ {(order.total_amount + (order.shipping.cost || 0)).toFixed(2)}</strong>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '0.75rem' }}>
                        <Card.Body>
                             <h5 className="mb-3">Comprador</h5>
                             <p className="mb-0"><strong>Nickname:</strong> {order.buyer.nickname}</p>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '0.75rem' }}>
                        <Card.Body>
                            <h5 className="mb-3">Status</h5>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span>Pagamento:</span> <Badge bg={getStatusVariant(order.status)} pill>{order.status}</Badge>
                            </div>
                             <div className="d-flex justify-content-between align-items-center">
                                <span>Entrega:</span> <Badge bg={order.shipping.status === 'shipped' || order.shipping.status === 'delivered' ? 'success' : 'secondary'} pill>{order.shipping.status || 'Não enviado'}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                    
                    <Card className="shadow-sm border-0" style={{ borderRadius: '0.75rem' }}>
                        <Card.Body>
                            <h5 className="mb-3">Enviar Nota Fiscal (NF-e)</h5>
                            {canUploadInvoice ? (
                                <Form onSubmit={handleUploadSubmit}>
                                    <Form.Group controlId="xml-upload" className="mb-3">
                                        <Form.Control type="file" accept=".xml, application/xml" onChange={handleFileChange} size="sm" />
                                    </Form.Group>
                                    <div className="d-grid">
                                        <Button type="submit" variant="primary" disabled={uploading || !xmlFile}>
                                            {uploading ? <Spinner as="span" animation="border" size="sm" /> : 'Enviar NF-e'}
                                        </Button>
                                    </div>
                                </Form>
                            ) : (
                                <Alert variant="secondary" className="mb-0 text-center small p-2">
                                    {order.status !== 'paid' ? 'Envio de NF-e liberado após confirmação do pagamento.' : 'Pedido sem envio para anexar NF-e.'}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default OrderDetailMLPage;