import React, { useState, useEffect } from 'react';
import { Card, Table, Image, Tab, Tabs, ProgressBar, Spinner, Badge, Modal, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const InventoryStatus = ({ dateRange }) => {
    const [data, setData] = useState({ lowStock: [], highStock: [], soldStock: [] });
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DO MODAL ---
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

    // --- FUNÇÃO PARA ABRIR O MODAL ---
    const handleRowClick = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    // --- RENDERIZAÇÃO DAS LINHAS (ESTOQUE) ---
    const renderStockRow = (product, type) => {
        let variant = 'primary';
        let progressValue = 0;
        const isOutOfStock = product.estoque === 0;

        if (type === 'low') {
            // ✅ Se estoque for 0, usa cor preta (dark), se não, usa perigo (danger)
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
                className={`align-middle cursor-pointer hover-effect ${isOutOfStock ? 'bg-light bg-opacity-50' : ''}`} 
                onClick={() => handleRowClick(product)}
            >
                <td style={{ width: '60px' }}>
                    <Image 
                        src={product.imagem || 'https://placehold.co/50x50'} 
                        rounded 
                        style={{ 
                            width: '40px', 
                            height: '40px', 
                            objectFit: 'cover',
                            filter: isOutOfStock ? 'grayscale(100%)' : 'none', // ✅ Fica PB se esgotado
                            opacity: isOutOfStock ? 0.6 : 1
                        }} 
                    />
                </td>
                <td style={{ minWidth: '200px' }}>
                    <span className={`fw-bold text-truncate d-block ${isOutOfStock ? 'text-muted' : 'text-dark'}`} style={{ maxWidth: '200px' }}>
                        {product.nome}
                    </span>
                    <small className="text-muted">{product.categoria}</small>
                </td>
                <td className="text-center" style={{ width: '120px' }}>
                    <div className="d-flex flex-column align-items-center">
                        {/* ✅ Badge de ESGOTADO em destaque */}
                        {isOutOfStock ? (
                            <Badge bg="dark" className="mb-1">ESGOTADO</Badge>
                        ) : (
                            <span className={`fw-bold ${type === 'low' ? 'text-danger' : 'text-success'}`}>
                                {product.estoque} un.
                            </span>
                        )}
                        <ProgressBar now={progressValue} variant={variant} style={{ height: '3px', width: '80%' }} className="mt-1 bg-opacity-25" />
                    </div>
                </td>
                <td className="text-end">
                    <div className="d-flex flex-column">
                        <small className="text-muted" style={{fontSize: '0.7rem'}}>Custo</small>
                        <span className="fw-medium text-secondary">{formatCurrency(product.preco_custo)}</span>
                    </div>
                </td>
                <td className="text-end border-end">
                    <div className="d-flex flex-column">
                        <small className="text-muted" style={{fontSize: '0.7rem'}}>Venda</small>
                        <span className="fw-bold text-dark">{formatCurrency(product.preco_venda)}</span>
                    </div>
                </td>
                <td className="text-center">
                    <Badge bg={marginColor} className="fw-normal bg-opacity-75">
                        {product.margem_percentual}%
                    </Badge>
                </td>
                <td className="text-end bg-light border-start ps-3">
                    <div className="d-flex flex-column">
                        <small className="text-muted" style={{fontSize: '0.7rem'}}>
                            {type === 'high' ? 'Capital Investido' : 'Deixando de Ganhar'}
                        </small>
                        <span className={`fw-bolder ${isOutOfStock ? 'text-danger' : (type === 'high' ? 'text-danger' : 'text-dark')}`}>
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

    // --- RENDERIZAÇÃO LINHAS (VENDIDOS) ---
    const renderSoldRow = (product, index) => {
        return (
            <tr key={product.id} className="align-middle cursor-pointer hover-effect" onClick={() => handleRowClick(product)}>
                <td className="text-center fw-bold text-muted ps-3" style={{width: '40px'}}>#{index + 1}</td>
                <td style={{ width: '60px' }}>
                    <Image src={product.imagem || 'https://placehold.co/50x50'} rounded style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                </td>
                <td style={{ minWidth: '180px' }}>
                    <span className="fw-bold text-dark text-truncate d-block" style={{ maxWidth: '200px' }}>
                        {product.nome}
                    </span>
                    <small className="text-muted">{product.categoria}</small>
                </td>
                <td className="text-center">
                    <Badge bg="info" className="px-3 py-2 text-white">
                        {product.qtd_vendida} vendidos
                    </Badge>
                </td>
                <td className="text-end text-muted">
                    <small className="d-block" style={{fontSize: '0.7rem'}}>Receita Bruta</small>
                    {formatCurrency(product.receita_total)}
                </td>
                <td className="text-end bg-success bg-opacity-10 border-start ps-3 pe-4">
                    <div className="d-flex flex-column">
                        <small className="text-success fw-bold" style={{fontSize: '0.7rem'}}>Lucro Real</small>
                        <span className="fw-bolder text-success fs-6">
                            {formatCurrency(product.lucro_realizado)}
                        </span>
                        <small className="text-muted" style={{fontSize: '0.65rem'}}>Margem: {product.margem_media}%</small>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-0">Gestão de Estoque & Lucratividade</h5>
                        <small className="text-muted">Análise de reposição, excessos e produtos campeões.</small>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>
                    ) : (
                        <Tabs defaultActiveKey="sold" id="inventory-tabs" className="px-4 pt-3 border-bottom-0 mb-0 custom-tabs">
                            <Tab eventKey="sold" title={<span className="text-primary fw-bold"><i className="fas fa-trophy me-2"></i>Mais Vendidos</span>}>
                                <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light text-muted small text-uppercase" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr>
                                                <th className="border-0 ps-3 bg-light">#</th>
                                                <th className="border-0 bg-light">Img</th>
                                                <th className="border-0 bg-light">Produto</th>
                                                <th className="border-0 text-center bg-light">Volume</th>
                                                <th className="border-0 text-end bg-light">Faturamento</th>
                                                <th className="border-0 text-end pe-4 text-success bg-light">Lucro Líquido</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.soldStock && data.soldStock.length > 0 ? (
                                                data.soldStock.map((p, i) => renderSoldRow(p, i))
                                            ) : (
                                                <tr><td colSpan="6" className="text-center py-4 text-muted">Nenhuma venda no período selecionado.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                            <Tab eventKey="low" title={<span className="text-danger fw-bold"><i className="fas fa-arrow-down me-2"></i>Repor (Baixo)</span>}>
                                <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light text-muted small text-uppercase" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr><th className="border-0 ps-4 bg-light">Img</th><th className="border-0 bg-light">Produto</th><th className="border-0 text-center bg-light">Nível</th><th className="border-0 text-end bg-light">Compra</th><th className="border-0 text-end bg-light">Venda</th><th className="border-0 text-center bg-light">Margem</th><th className="border-0 text-end pe-4 bg-light">Impacto</th></tr>
                                        </thead>
                                        <tbody>
                                            {data.lowStock.length > 0 ? data.lowStock.map(p => renderStockRow(p, 'low')) : <tr><td colSpan="7" className="text-center py-4 text-muted">Estoque em dia.</td></tr>}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                            <Tab eventKey="high" title={<span className="text-secondary fw-bold"><i className="fas fa-arrow-up me-2"></i>Excedente</span>}>
                                <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                    <Table hover className="mb-0 align-middle">
                                        <thead className="bg-light text-muted small text-uppercase" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr><th className="border-0 ps-4 bg-light">Img</th><th className="border-0 bg-light">Produto</th><th className="border-0 text-center bg-light">Nível</th><th className="border-0 text-end bg-light">Compra</th><th className="border-0 text-end bg-light">Venda</th><th className="border-0 text-center bg-light">Margem</th><th className="border-0 text-end pe-4 bg-light">Dinheiro Parado</th></tr>
                                        </thead>
                                        <tbody>
                                            {data.highStock.length > 0 ? data.highStock.map(p => renderStockRow(p, 'high')) : <tr><td colSpan="7" className="text-center py-4 text-muted">Sem excessos.</td></tr>}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab>
                        </Tabs>
                    )}
                </Card.Body>
            </Card>

            {/* --- MODAL DE DETALHES DO PRODUTO --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedProduct && (
                    <>
                        {/* ✅ Cabeçalho do modal muda para PRETO se estiver esgotado */}
                        <div className={`p-4 text-white ${selectedProduct.estoque === 0 ? 'bg-dark' : 'bg-primary'} bg-gradient`}>
                            <div className="d-flex align-items-center">
                                <div className="bg-white p-1 rounded-3 me-3">
                                    <Image src={selectedProduct.imagem || 'https://placehold.co/80x80'} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <Badge bg="light" text="dark" className="mb-1">{selectedProduct.categoria}</Badge>
                                    <h4 className="fw-bold mb-0">{selectedProduct.nome}</h4>
                                </div>
                                {selectedProduct.estoque === 0 && (
                                    <Badge bg="danger" className="ms-auto fs-6 p-2 pulse">PRODUTO ESGOTADO</Badge>
                                )}
                            </div>
                        </div>
                        <Modal.Body className="p-4">
                            <Row className="g-4">
                                <Col md={6}>
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Financeiro Unitário</h6>
                                    <div className="bg-light p-3 rounded-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted small text-uppercase">Custo:</span>
                                            <span className="fw-bold text-secondary">{formatCurrency(selectedProduct.preco_custo_atual || selectedProduct.preco_custo)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted small text-uppercase">Venda:</span>
                                            <span className="fw-bold text-dark">{formatCurrency(selectedProduct.preco_venda || selectedProduct.preco)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between pt-2 border-top">
                                            <span className="fw-bold">MARGEM:</span>
                                            <span className="fw-bold text-success">{selectedProduct.margem_media || selectedProduct.margem_percentual}%</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Estoque & Performance</h6>
                                    <div className="bg-light p-3 rounded-3 h-100">
                                        <div className="d-flex justify-content-between mb-2 align-items-center">
                                            <span>Estoque Atual:</span>
                                            <Badge bg={selectedProduct.estoque === 0 ? 'danger' : 'warning'} className="fs-6">
                                                {selectedProduct.estoque === 0 ? 'ZERADO' : `${selectedProduct.estoque} unidades`}
                                            </Badge>
                                        </div>
                                        {selectedProduct.receita_total !== undefined && (
                                            <>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span>Total Vendido:</span>
                                                    <span className="fw-bold">{selectedProduct.qtd_vendida} un.</span>
                                                </div>
                                                <div className="d-flex justify-content-between text-success fw-bold">
                                                    <span>Lucro Real:</span>
                                                    <span>{formatCurrency(selectedProduct.lucro_realizado)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer className="bg-light border-0">
                            <Button variant="outline-secondary" onClick={handleCloseModal}>Fechar</Button>
                            <Button as={Link} to={`/admin/product/${selectedProduct.id_produto || selectedProduct.id}/edit`} variant="primary">
                                <i className="bi bi-pencil-square me-2"></i>Editar Produto
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            <style>{`
                .custom-tabs .nav-link { border: none; color: #999; border-bottom: 3px solid transparent; padding-bottom: 1rem; margin-right: 1rem; transition: all 0.2s; }
                .custom-tabs .nav-link:hover { color: #555; background: transparent; }
                .custom-tabs .nav-link.active { color: #000; border-bottom: 3px solid var(--bs-primary); background: transparent; }
                .hover-effect:hover td { background-color: #f8f9fa !important; transition: background-color 0.2s ease; }
                .cursor-pointer { cursor: pointer; }
                
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse { animation: pulse 2s infinite; }
            `}</style>
        </>
    );
};

export default InventoryStatus;