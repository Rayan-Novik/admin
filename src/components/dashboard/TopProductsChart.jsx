import React, { useState, useEffect } from 'react';
import { Card, Spinner, Modal, Button, Row, Col, Badge, Table, Image as BsImage, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopProductsChart = ({ dateRange }) => {
    const [chartData, setChartData] = useState(null);
    const [fullProductsData, setFullProductsData] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [productImages, setProductImages] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange || !dateRange.startDate) return;
            setLoading(true);
            try {
                const { data } = await api.get(`/dashboard/top-products`, {
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    }
                });
                
                const imagesElements = data.images.map((url) => {
                    const img = new Image();
                    img.src = url || 'https://placehold.co/50x50?text=Prod';
                    return img;
                });
                setProductImages(imagesElements);
                setFullProductsData(data.fullData);

                setChartData({
                    labels: data.labels,
                    datasets: [{
                        label: 'Vendas',
                        data: data.values,
                        backgroundColor: '#0d6efd',
                        hoverBackgroundColor: '#0b5ed7',
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 30,
                    }]
                });
            } catch (err) {
                console.error("Erro Top 10:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const handleChartClick = (event, elements) => {
        if (elements && elements.length > 0) {
            const index = elements[0].index;
            const product = fullProductsData[index];
            if (product) {
                setSelectedProduct(product);
                setShowModal(true);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit' });

    // --- PLUGIN DE IMAGENS ---
    const imageXAxisPlugin = {
        id: 'imageXAxisTop',
        afterDraw: (chart) => {
            if (!productImages.length || !chart.data.datasets[0].data.length) return;
            const { ctx, scales: { x } } = chart;
            x.ticks.forEach((value, index) => {
                const img = productImages[index];
                if (img && img.complete && img.naturalHeight !== 0) {
                    const xPos = x.getPixelForTick(index);
                    const yPos = x.bottom;
                    const size = 32;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(xPos, yPos + 20, size / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(img, xPos - size / 2, yPos + 4, size, size);
                    ctx.restore();
                }
            });
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 25 } },
        onClick: handleChartClick,
        onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default'; },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top 10 Produtos Mais Vendidos', align: 'start', font: { size: 16, weight: 'bold', family: "'Inter', sans-serif" }, padding: { bottom: 20 }, color: '#212529' },
            tooltip: { backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#212529', bodyColor: '#6c757d', borderColor: '#e9ecef', borderWidth: 1, callbacks: { label: (c) => ` ${c.parsed.y} vendas` } }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f8f9fa' }, ticks: { stepSize: 1, font: { size: 10 }, color: '#adb5bd' }, border: { display: false } },
            x: { grid: { display: false }, ticks: { display: false } }
        }
    };

    // --- HELPER PARA TOOLTIPS INFORMATIVOS ---
    const InfoTooltip = ({ text }) => (
        <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
            <i className="bi bi-question-circle-fill text-muted ms-1 opacity-50" style={{ fontSize: '0.75rem', cursor: 'help' }}></i>
        </OverlayTrigger>
    );

    return (
        <>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
                <Card.Body className="p-4">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <div style={{ height: '350px', width: '100%' }}>
                            {chartData && chartData.labels.length > 0 ? (
                                <Bar options={options} data={chartData} plugins={[imageXAxisPlugin]} />
                            ) : (
                                <div className="text-center text-muted h-100 d-flex flex-column justify-content-center"><small>Nenhum dado disponível.</small></div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* --- MODAL DETALHADO (VISUAL NOVO & INFORMATIVO) --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedProduct && (
                    <>
                        {/* 1. Cabeçalho Gradiente com Botão Fechar Melhorado */}
                        <div className="bg-primary bg-gradient p-4 text-white position-relative">
                            {/* Botão de Fechar Circular Branco */}
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
                                    <BsImage src={selectedProduct.imagem || 'https://placehold.co/100x100'} rounded style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <Badge bg="light" text="primary" className="mb-2 px-3 py-1 fw-bold text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>{selectedProduct.categoria}</Badge>
                                    <h4 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '350px' }}>{selectedProduct.nome}</h4>
                                    <small className="opacity-75">Ref/ID: #{selectedProduct.id_produto}</small>
                                </div>
                                <div className="text-end d-none d-md-block ps-3 border-start border-white border-opacity-25">
                                    <div className="d-flex align-items-center justify-content-end mb-1">
                                        <small className="opacity-75 text-uppercase fw-bold me-1" style={{fontSize: '0.7rem'}}>Receita Gerada</small>
                                        <OverlayTrigger placement="left" overlay={<BsTooltip>Soma do valor de venda de todos os itens deste produto no período selecionado.</BsTooltip>}>
                                            <i className="bi bi-info-circle text-white opacity-50" style={{ cursor: 'help' }}></i>
                                        </OverlayTrigger>
                                    </div>
                                    <span className="display-6 fw-bold">{formatCurrency(selectedProduct.receita_gerada)}</span>
                                </div>
                            </div>
                        </div>

                        <Modal.Body className="p-4 bg-light">
                            <Row className="g-4">
                                {/* 2. Coluna Esquerda: Histórico com Tabela Clara */}
                                <Col md={8}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                                            <h6 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-primary"></i>Histórico de Vendas</h6>
                                            <Badge bg="secondary" className="fw-normal bg-opacity-10 text-secondary border">Últimos registros</Badge>
                                        </Card.Header>
                                        <Card.Body className="p-3">
                                            <div className="table-responsive rounded-3 border" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                                <Table hover className="mb-0 align-middle small">
                                                    <thead className="bg-light text-muted text-uppercase sticky-top">
                                                        <tr>
                                                            <th className="ps-4 border-0 py-2">Data da Venda</th>
                                                            <th className="text-center border-0 py-2">Qtd</th>
                                                            <th className="text-end pe-4 border-0 py-2">Ver Pedido</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedProduct.historico_vendas.length > 0 ? (
                                                            selectedProduct.historico_vendas.map((venda, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="ps-4 text-muted fw-medium">{formatDate(venda.data)}</td>
                                                                    <td className="text-center">
                                                                        <Badge bg="light" text="dark" className="border fw-bold px-2">{venda.qtd}</Badge>
                                                                    </td>
                                                                    <td className="text-end pe-4">
                                                                        <Link to={`/admin/order/${venda.id_pedido}`} className="text-decoration-none fw-bold text-primary btn-link-hover">
                                                                            #{venda.id_pedido} <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                                                                        </Link>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="3" className="text-center py-4 text-muted">Sem detalhes de histórico.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* 3. Coluna Direita: Cards de Métricas com Explicações */}
                                <Col md={4}>
                                    <div className="d-flex flex-column gap-3 h-100">
                                        {/* Card Volume */}
                                        <Card className="border-0 shadow-sm flex-fill">
                                            <Card.Body className="d-flex align-items-center p-3">
                                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                                                    <i className="bi bi-box-seam fs-4"></i>
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center">
                                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Total de Itens</small>
                                                        <InfoTooltip text="Soma da quantidade de unidades vendidas em todos os pedidos." />
                                                    </div>
                                                    <h4 className="fw-bold mb-0 text-dark">{selectedProduct.total_vendido} <span className="fs-6 text-muted fw-normal">un.</span></h4>
                                                </div>
                                            </Card.Body>
                                        </Card>

                                        {/* Card Pedidos Únicos */}
                                        <Card className="border-0 shadow-sm flex-fill">
                                            <Card.Body className="d-flex align-items-center p-3">
                                                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3 text-info">
                                                    <i className="bi bi-cart-check fs-4"></i>
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center">
                                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Pedidos Únicos</small>
                                                        <InfoTooltip text="Quantidade de pedidos diferentes que contêm este produto. Ex: Se 1 cliente compra 5 unidades, conta como 1 Pedido Único." />
                                                    </div>
                                                    <h4 className="fw-bold mb-0 text-dark">{selectedProduct.pedidos_ids.length}</h4>
                                                </div>
                                            </Card.Body>
                                        </Card>

                                        {/* Botão de Ação */}
                                        <Button as={Link} to={`/admin/product/${selectedProduct.id_produto}/edit`} variant="outline-dark" className="w-100 py-3 border-dashed mt-auto fw-medium">
                                            <i className="bi bi-pencil-square me-2"></i>Gerenciar Produto
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Modal.Body>
                    </>
                )}
            </Modal>
            
            <style>{`
                .border-dashed { border: 1px dashed #dee2e6; }
                .btn-link-hover:hover { text-decoration: underline !important; }
                
                /* Scrollbar personalizada */
                .table-responsive::-webkit-scrollbar { width: 6px; }
                .table-responsive::-webkit-scrollbar-track { background: #f8f9fa; }
                .table-responsive::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
                .table-responsive::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
            `}</style>
        </>
    );
};

export default TopProductsChart;