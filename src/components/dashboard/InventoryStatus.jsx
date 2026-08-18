import React, { useState, useEffect } from 'react';
import { Table, Image, Tab, Tabs, ProgressBar, Spinner, Badge, Modal, Button, Row, Col, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const InventoryStatus = ({ dateRange }) => {
    const [data, setData] = useState({ lowStock: [], highStock: [], soldStock: [] });
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange || !dateRange.startDate) return;

            setLoading(true);
            try {
                const { data } = await api.get('/dashboard/inventory-status', {
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    }
                });
                setData(data);
            } catch (error) {
                console.error("Erro ao carregar estoque", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleRowClick = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    const InfoTooltip = ({ text }) => (
        <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
            <i className="bi bi-info-circle text-muted ms-1 opacity-50" style={{ fontSize: '12px', cursor: 'help' }}></i>
        </OverlayTrigger>
    );

    const renderStockRow = (product, type) => {
        let variant = 'primary';
        let progressValue = 0;
        const isOutOfStock = product.estoque === 0;

        if (type === 'low') {
            variant = isOutOfStock ? 'dark' : 'danger';
            progressValue = isOutOfStock ? 100 : (product.estoque / 10) * 100;
        } else {
            variant = 'success';
            progressValue = 100;
        }

        const marginColor = parseFloat(product.margem_percentual) > 30 ? 'success' : (parseFloat(product.margem_percentual) > 15 ? 'warning' : 'danger');

        return (
            <tr 
                key={product.id} 
                className={`align-middle cursor-pointer hover-effect border-bottom ${isOutOfStock ? 'opacity-75' : ''} inventory-row`} 
                onClick={() => handleRowClick(product)}
            >
                <td className="ps-4 py-3" style={{ width: '60px' }}>
                    <Image 
                        src={product.imagem || 'https://placehold.co/50x50?text=Img'} 
                        rounded 
                        style={{ 
                            width: '40px', height: '40px', objectFit: 'cover',
                            filter: isOutOfStock ? 'grayscale(100%)' : 'none',
                        }} 
                        className="border shadow-sm"
                    />
                </td>
                <td style={{ minWidth: '200px' }}>
                    <span className={`fw-semibold text-truncate d-block product-name ${isOutOfStock ? 'text-muted' : 'text-dark'}`} style={{ maxWidth: '200px', fontSize: '13px' }}>
                        {product.nome}
                    </span>
                    <small className="text-muted product-category" style={{ fontSize: '11px' }}>{product.categoria}</small>
                </td>
                <td className="text-center" style={{ width: '120px' }}>
                    <div className="d-flex flex-column align-items-center">
                        {isOutOfStock ? (
                            <Badge bg="danger" className="mb-1 bg-opacity-10 text-danger border border-danger border-opacity-25 fw-semibold px-2 py-1">ESGOTADO</Badge>
                        ) : (
                            <span className={`fw-bold mb-1" style={{fontSize: '12px'}} ${type === 'low' ? 'text-danger' : 'text-success'}`}>
                                {product.estoque} un.
                            </span>
                        )}
                        <ProgressBar now={progressValue} variant={variant} style={{ height: '4px', width: '80%' }} className="bg-opacity-25 rounded-pill" />
                    </div>
                </td>
                <td className="text-end">
                    <div className="d-flex flex-column">
                        <span className="fw-medium text-secondary" style={{ fontSize: '13px' }}>{formatCurrency(product.preco_custo)}</span>
                    </div>
                </td>
                <td className="text-end">
                    <div className="d-flex flex-column">
                        <span className="fw-bold text-dark product-price" style={{ fontSize: '13px' }}>{formatCurrency(product.preco_venda)}</span>
                    </div>
                </td>
                <td className="text-center">
                    <span className={`badge bg-${marginColor} bg-opacity-10 text-${marginColor} border border-${marginColor} border-opacity-25 fw-medium`}>
                        {product.margem_percentual}%
                    </span>
                </td>
                <td className="text-end pe-4">
                    <div className="d-flex flex-column">
                        <span className={`fw-bold ${isOutOfStock ? 'text-danger' : (type === 'high' ? 'text-danger' : 'text-dark')}`} style={{ fontSize: '13px' }}>
                            {type === 'high' 
                                ? formatCurrency(product.capital_parado) 
                                : formatCurrency(product.potencial_venda) 
                            }
                        </span>
                    </div>
                </td>
            </tr>
        );
    };

    const renderSoldRow = (product, index) => {
        return (
            <tr key={product.id} className="align-middle cursor-pointer hover-effect border-bottom inventory-row" onClick={() => handleRowClick(product)}>
                <td className="text-center fw-bold text-muted ps-4" style={{width: '40px', fontSize: '12px'}}>#{index + 1}</td>
                <td className="py-3" style={{ width: '60px' }}>
                    <Image src={product.imagem || 'https://placehold.co/50x50?text=Img'} rounded style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="border shadow-sm" />
                </td>
                <td style={{ minWidth: '180px' }}>
                    <span className="fw-semibold text-dark product-name text-truncate d-block" style={{ maxWidth: '200px', fontSize: '13px' }}>
                        {product.nome}
                    </span>
                    <small className="text-muted product-category" style={{ fontSize: '11px' }}>{product.categoria}</small>
                </td>
                <td className="text-center">
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 fw-semibold">
                        {product.qtd_vendida} un.
                    </span>
                </td>
                <td className="text-end text-muted fw-semibold" style={{ fontSize: '13px' }}>
                    {formatCurrency(product.receita_total)}
                </td>
                <td className="text-end pe-4">
                    <div className="d-flex flex-column">
                        <span className="fw-bold text-success" style={{ fontSize: '13px' }}>
                            {formatCurrency(product.lucro_realizado)}
                        </span>
                        <small className="text-muted" style={{fontSize: '10px'}}>Mg: {product.margem_media}%</small>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <>
            <div className="clean-card inventory-status-card h-100 d-flex flex-column overflow-hidden mb-4">
                <div className="p-4 pb-0">
                    <div className="section-title mb-1 d-flex justify-content-between align-items-center">
                        <div className="inventory-status-title">
                            <i className="bi bi-box-seam me-2 text-muted title-icon"></i>
                            Gestão de Estoque & Lucratividade
                        </div>
                    </div>
                </div>

                <div className="flex-grow-1 p-0 mt-3">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '300px' }}>
                            <Spinner animation="border" variant="secondary" size="sm" />
                        </div>
                    ) : (
                        <Tabs defaultActiveKey="sold" id="inventory-tabs" className="px-4 border-bottom-0 custom-tabs mb-0">
                            <Tab eventKey="sold" title={<span><i className="bi bi-trophy me-2"></i>Mais Vendidos</span>}>
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <Table className="mb-0 align-middle table-borderless">
                                        <thead className="table-header-sticky" style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th className="border-bottom ps-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>#</th>
                                                <th className="border-bottom text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Img</th>
                                                <th className="border-bottom text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Produto</th>
                                                <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Volume</th>
                                                <th className="border-bottom text-end text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Faturamento</th>
                                                <th className="border-bottom text-end pe-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Lucro Líquido</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.soldStock && data.soldStock.length > 0 ? (
                                                data.soldStock.map((p, i) => renderSoldRow(p, i))
                                            ) : (
                                                <tr><td colSpan="6" className="text-center py-5 text-muted" style={{fontSize:'13px'}}>Nenhuma venda no período selecionado.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                            <Tab eventKey="low" title={<span><i className="bi bi-arrow-down-circle me-2 text-danger"></i>Repor (Baixo)</span>}>
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <Table className="mb-0 align-middle table-borderless">
                                        <thead className="table-header-sticky" style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th className="border-bottom ps-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Img</th>
                                                <th className="border-bottom text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Produto</th>
                                                <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Nível</th>
                                                <th className="border-bottom text-end text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Compra</th>
                                                <th className="border-bottom text-end text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Venda</th>
                                                <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Margem</th>
                                                <th className="border-bottom text-end pe-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Impacto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.lowStock.length > 0 ? data.lowStock.map(p => renderStockRow(p, 'low')) : <tr><td colSpan="7" className="text-center py-5 text-muted" style={{fontSize:'13px'}}>Estoque em dia.</td></tr>}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                            <Tab eventKey="high" title={<span><i className="bi bi-arrow-up-circle me-2 text-warning"></i>Excedente</span>}>
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <Table className="mb-0 align-middle table-borderless">
                                        <thead className="table-header-sticky" style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                            <tr>
                                                <th className="border-bottom ps-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Img</th>
                                                <th className="border-bottom text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Produto</th>
                                                <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Nível</th>
                                                <th className="border-bottom text-end text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Compra</th>
                                                <th className="border-bottom text-end text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Venda</th>
                                                <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Margem</th>
                                                <th className="border-bottom text-end pe-4 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Capital Parado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.highStock.length > 0 ? data.highStock.map(p => renderStockRow(p, 'high')) : <tr><td colSpan="7" className="text-center py-5 text-muted" style={{fontSize:'13px'}}>Sem excessos no estoque.</td></tr>}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                        </Tabs>
                    )}
                </div>
            </div>

            {/* --- MODAL DETALHADO (NOVO DESIGN SAAS) --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedProduct && (
                    <>
                        <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                            <button 
                                onClick={handleCloseModal} 
                                className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}
                                title="Fechar"
                            >
                                <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                            </button>

                            <div className="d-flex align-items-center position-relative" style={{ zIndex: 1 }}>
                                <div className="bg-white p-1 rounded-3 shadow-sm me-4 flex-shrink-0">
                                    <Image src={selectedProduct.imagem || 'https://placehold.co/100x100?text=Img'} rounded style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <Badge bg="light" text="dark" className="mb-2 px-3 py-1 fw-medium text-uppercase" style={{fontSize: '11px', letterSpacing: '1px'}}>{selectedProduct.categoria}</Badge>
                                    <h4 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '350px' }}>{selectedProduct.nome}</h4>
                                    <small className="opacity-75">Ref/ID: #{selectedProduct.id_produto || selectedProduct.id}</small>
                                </div>
                                {selectedProduct.estoque === 0 && (
                                    <div className="text-end ps-3">
                                        <Badge bg="danger" className="fs-6 px-3 py-2 border border-white border-opacity-25 pulse">ESGOTADO</Badge>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Modal.Body className="p-4" style={{ backgroundColor: '#f8fafc' }}>
                            <Row className="g-4">
                                <Col md={6}>
                                    <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                                        <h6 className="fw-bold text-dark mb-4" style={{ fontSize: '14px' }}>Financeiro Unitário</h6>
                                        <div className="d-flex flex-column gap-3">
                                            <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                                <span className="text-muted fw-semibold text-uppercase" style={{ fontSize: '11px' }}>Custo Base</span>
                                                <span className="fw-bold text-secondary fs-6">{formatCurrency(selectedProduct.preco_custo_atual || selectedProduct.preco_custo || 0)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                                                <span className="text-muted fw-semibold text-uppercase" style={{ fontSize: '11px' }}>Preço de Venda</span>
                                                <span className="fw-bold text-dark fs-5">{formatCurrency(selectedProduct.preco_venda || selectedProduct.preco || 0)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center pt-2 px-1">
                                                <span className="text-dark fw-bold text-uppercase" style={{ fontSize: '12px' }}>Margem Operacional</span>
                                                <span className="fw-bold text-success fs-5">{selectedProduct.margem_media || selectedProduct.margem_percentual || 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="bg-white rounded-4 border p-4 h-100 shadow-sm d-flex flex-column">
                                        <h6 className="fw-bold text-dark mb-4" style={{ fontSize: '14px' }}>Estoque & Performance</h6>
                                        
                                        <div className="d-flex justify-content-between mb-3 align-items-center px-1">
                                            <span className="text-muted fw-medium" style={{ fontSize: '13px' }}>Disponível:</span>
                                            <span className={`fw-bold fs-6 ${selectedProduct.estoque === 0 ? 'text-danger' : 'text-dark'}`}>
                                                {selectedProduct.estoque} unidades
                                            </span>
                                        </div>

                                        {selectedProduct.receita_total !== undefined && (
                                            <>
                                                <div className="d-flex justify-content-between mb-3 align-items-center px-1">
                                                    <span className="text-muted fw-medium" style={{ fontSize: '13px' }}>Total Vendido:</span>
                                                    <span className="fw-bold text-dark fs-6">{selectedProduct.qtd_vendida} un.</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center px-1 pt-2 border-top">
                                                    <span className="text-success fw-bold" style={{ fontSize: '13px' }}>Lucro Realizado:</span>
                                                    <span className="fw-bold text-success fs-5">{formatCurrency(selectedProduct.lucro_realizado)}</span>
                                                </div>
                                            </>
                                        )}

                                        <Button as={Link} to={`/admin/product/${selectedProduct.id_produto || selectedProduct.id}/edit`} variant="dark" className="w-100 py-3 fw-medium rounded-3 mt-auto">
                                            <i className="bi bi-pencil-square me-2"></i>Editar Cadastro
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Modal.Body>
                    </>
                )}
            </Modal>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .custom-tabs { border-bottom: 1px solid #e2e8f0; padding: 0 1.5rem; }
                .custom-tabs .nav-link { border: none; color: #64748b; font-weight: 500; font-size: 13px; padding: 0.75rem 1rem; margin-bottom: -1px; }
                .custom-tabs .nav-link:hover { color: #0f172a; background: transparent; }
                .custom-tabs .nav-link.active { color: #0f172a; border-bottom: 2px solid #0f172a; background: transparent; }
                .hover-effect:hover td { background-color: #f8fafc !important; }
                .table-responsive::-webkit-scrollbar { width: 6px; height: 6px; }
                .table-responsive::-webkit-scrollbar-track { background: transparent; }
                .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse { animation: pulse 2s infinite; }

                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                .mobile-dashboard-wrapper .inventory-status-card {
                    padding: 0 !important; /* Reseta padding extra */
                }
                .mobile-dashboard-wrapper .inventory-status-title {
                    font-size: 12px !important;
                    font-weight: 800 !important;
                    color: #000 !important;
                    padding: 5px 0;
                }
                .mobile-dashboard-wrapper .title-icon {
                    display: none !important;
                }
                .mobile-dashboard-wrapper .table-header-sticky {
                    background-color: transparent !important;
                }
                .mobile-dashboard-wrapper .inventory-row {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
                }
                .mobile-dashboard-wrapper .product-name,
                .mobile-dashboard-wrapper .product-price {
                    color: #000 !important;
                    font-weight: 800 !important;
                }
                .mobile-dashboard-wrapper .product-category {
                    color: #555 !important;
                    font-weight: 600 !important;
                }
                .mobile-dashboard-wrapper .hover-effect:hover td {
                    background-color: transparent !important; /* Desativa hover branco no mobile */
                }
            `}</style>
        </>
    );
};

export default InventoryStatus;