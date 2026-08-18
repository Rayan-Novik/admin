import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const mercadoLivreIconUrl = 'https://logospng.org/download/mercado-livre/logo-mercado-livre-256.png';

const RecentOrders = ({ dateRange }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

            setLoading(true);
            try {
                const { data } = await api.get(`/dashboard/recent-confirmed-orders?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                setOrders(data);
            } catch (err) {
                setError('Erro ao carregar pedidos.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [dateRange]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        // Adicionada a classe clean-card e recent-orders-card para ancorar a padronização
        <div className="clean-card recent-orders-card d-flex flex-column h-100 p-4 mb-4">
            <div className="section-title mb-4 d-flex justify-content-between align-items-center">
                <div className="recent-orders-title">
                    <i className="bi bi-cart2 me-2 text-muted title-icon"></i>
                    Pedidos recentes
                </div>
                <Link to="/orders" className="text-decoration-none small text-primary fw-medium">
                    Ver todos
                </Link>
            </div>

            <div className="flex-grow-1 position-relative">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '200px' }}>
                        <Spinner animation="border" size="sm" variant="secondary" />
                    </div>
                ) : error ? (
                    <Alert variant="danger" className="m-0 border-0">{error}</Alert>
                ) : orders.length > 0 ? (
                    <div className="list-group list-group-flush custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {orders.map((order, index) => {
                            const isMercadoLivre = order.origem === 'mercadolivre';
                            const orderLink = isMercadoLivre 
                                ? `/admin/mercadolivre/order/${order.id_pedido}` 
                                : `/admin/order/${order.id_pedido}`;

                            return (
                                <Link 
                                    key={`${order.origem}-${order.id_pedido}`}
                                    to={orderLink}
                                    className="list-group-item list-group-item-action border-0 px-2 py-3 d-flex align-items-center justify-content-between transition-hover bg-transparent order-item"
                                >
                                    <div className="d-flex align-items-center">
                                        <div 
                                            className="d-flex align-items-center justify-content-center rounded-circle me-3" 
                                            style={{ 
                                                width: '36px', height: '36px', 
                                                backgroundColor: isMercadoLivre ? '#fef3c7' : '#f1f5f9',
                                                minWidth: '36px'
                                            }}
                                        >
                                            {isMercadoLivre ? (
                                                <Image src={mercadoLivreIconUrl} style={{ width: '18px' }} />
                                            ) : (
                                                <i className="bi bi-bag text-secondary"></i>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="fw-medium text-dark text-truncate customer-name" style={{ maxWidth: '180px', fontSize: '14px' }}>
                                                {order.nome_completo || 'Cliente'}
                                            </div>
                                            <div className="text-muted d-flex align-items-center order-meta" style={{ fontSize: '12px' }}>
                                                <span className="me-2">#{order.id_pedido}</span>
                                                {order.data_pedido && (
                                                    <span>{formatDate(order.data_pedido)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-end">
                                        <div className="fw-bold text-dark order-price" style={{ fontSize: '14px' }}>
                                            R$ {parseFloat(order.preco_total).toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '11px' }}>
                                            <span className={`fw-medium ${order.status_pagamento === 'approved' || order.status_pagamento === 'PAGO' ? 'text-success' : 'text-warning'}`}>
                                                {order.status_pagamento === 'approved' ? 'Pago' : order.status_pagamento || 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted" style={{ fontSize: '14px' }}>
                        Nenhum pedido neste período.
                    </div>
                )}
            </div>
            
            <style>{`
                /* ====== ESTILOS GERAIS (Computador) ====== */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                .transition-hover:hover { background-color: #f8fafc !important; border-radius: 8px; }
                
                .order-item { border-bottom: 1px solid #f1f5f9; }
                .order-item:last-child { border-bottom: none; }

                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                /* As regras abaixo SÓ funcionam quando a tela está dentro do Mobile Dashboard */
                
                .mobile-dashboard-wrapper .recent-orders-card {
                    background-color: #e6e6e6 !important;
                    border-radius: 20px !important;
                    padding: 25px 20px !important;
                    box-shadow: none !important;
                }
                
                .mobile-dashboard-wrapper .recent-orders-title {
                    font-size: 12px !important;
                    font-weight: 800 !important;
                    color: #000 !important;
                }
                
                .mobile-dashboard-wrapper .title-icon {
                    display: none !important; /* Esconde o ícone de carrinho para combinar com o layout limpo */
                }
                
                .mobile-dashboard-wrapper .order-item {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
                }
                .mobile-dashboard-wrapper .order-item:last-child {
                    border-bottom: none !important;
                }
                
                .mobile-dashboard-wrapper .customer-name,
                .mobile-dashboard-wrapper .order-price {
                    color: #000 !important;
                    font-weight: 800 !important;
                }
                
                .mobile-dashboard-wrapper .order-meta {
                    color: #555 !important;
                    font-weight: 600 !important;
                }
            `}</style>
        </div>
    );
};

export default RecentOrders;