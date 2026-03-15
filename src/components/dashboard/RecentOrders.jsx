import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const mercadoLivreIconUrl = 'https://logospng.org/download/mercado-livre/logo-mercado-livre-256.png';

// ✅ Recebe 'dateRange' como propriedade
const RecentOrders = ({ dateRange }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            // Evita chamada se não tiver data definida
            if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

            setLoading(true);
            try {
                // ✅ Passa as datas para o backend filtrar os pedidos
                const { data } = await api.get(`/dashboard/recent-confirmed-orders?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                setOrders(data);
            } catch (err) {
                setError('Erro ao carregar pedidos.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [dateRange]); // ✅ Reage quando a data muda

    // Função auxiliar para formatar data
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-dark m-0" style={{ fontFamily: "'Inter', sans-serif" }}>Pedidos Recentes</h5>
                <Link to="/admin/orderlist" className="text-decoration-none small fw-bold text-primary">
                    Ver todos
                </Link>
            </Card.Header>

            <Card.Body className="p-0">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center p-5">
                        <Spinner animation="border" size="sm" variant="primary" />
                    </div>
                ) : error ? (
                    <Alert variant="danger" className="m-3">{error}</Alert>
                ) : orders.length > 0 ? (
                    <div className="list-group list-group-flush custom-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {orders.map((order, index) => {
                            const isMercadoLivre = order.origem === 'mercadolivre';
                            const orderLink = isMercadoLivre 
                                ? `/admin/mercadolivre/order/${order.id_pedido}` 
                                : `/admin/order/${order.id_pedido}`;

                            return (
                                <Link 
                                    key={`${order.origem}-${order.id_pedido}`}
                                    to={orderLink}
                                    className="list-group-item list-group-item-action border-0 px-4 py-3 d-flex align-items-center justify-content-between transition-hover"
                                    style={{ borderBottom: index !== orders.length - 1 ? '1px solid #f8f9fa' : 'none' }}
                                >
                                    <div className="d-flex align-items-center">
                                        {/* Ícone de Origem */}
                                        <div 
                                            className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                            style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                backgroundColor: isMercadoLivre ? '#fff3cd' : '#e7f1ff',
                                                minWidth: '40px'
                                            }}
                                        >
                                            {isMercadoLivre ? (
                                                <Image src={mercadoLivreIconUrl} style={{ width: '20px' }} />
                                            ) : (
                                                <i className="fas fa-shopping-bag text-primary"></i>
                                            )}
                                        </div>
                                        
                                        {/* Info do Pedido */}
                                        <div>
                                            <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '150px' }}>
                                                {order.nome_completo || 'Cliente'}
                                            </div>
                                            <div className="small text-muted d-flex align-items-center">
                                                <span className="me-2">#{order.id_pedido}</span>
                                                {order.data_pedido && (
                                                    <span className="badge bg-light text-secondary border fw-normal" style={{fontSize: '0.65rem'}}>
                                                        {formatDate(order.data_pedido)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Valor e Status */}
                                    <div className="text-end">
                                        <div className="fw-bold text-dark">
                                            R$ {parseFloat(order.preco_total).toFixed(2)}
                                        </div>
                                        <div className="small">
                                            <span className={`badge ${order.status_pagamento === 'approved' || order.status_pagamento === 'PAGO' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                                {order.status_pagamento === 'approved' ? 'Pago' : order.status_pagamento || 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                        Nenhum pedido neste período.
                    </div>
                )}
            </Card.Body>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
                .transition-hover:hover { background-color: #f8f9fa; }
            `}</style>
        </Card>
    );
};

export default RecentOrders;