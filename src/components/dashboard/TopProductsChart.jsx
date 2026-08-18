import React, { useState, useEffect } from 'react';
import { Spinner, Modal, Button, Row, Col, Badge, Table, Image as BsImage, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
                        backgroundColor: '#3b82f6', 
                        hoverBackgroundColor: '#2563eb',
                        borderRadius: 6,
                        borderSkipped: false,
                        barThickness: 20,
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

    // 🟢 NOVO PLUGIN: Desenha as imagens no eixo Y (Esquerda) para gráficos horizontais
    const imageYAxisPlugin = {
        id: 'imageYAxisTop',
        afterDraw: (chart) => {
            if (!productImages.length || !chart.data.datasets[0].data.length) return;
            const { ctx, scales: { y } } = chart;
            
            y.ticks.forEach((value, index) => {
                const img = productImages[index];
                if (img && img.complete && img.naturalHeight !== 0) {
                    const yPos = y.getPixelForTick(index);
                    const size = 26; // Tamanho da imagem
                    const xPos = y.right - size - 8; // Posiciona a imagem entre o texto e a barra
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(xPos + size / 2, yPos, size / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(img, xPos, yPos - size / 2, size, size);
                    ctx.restore();
                }
            });
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', 
        layout: { padding: { right: 25 } },
        onClick: handleChartClick,
        onHover: (event, chartElement) => { event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default'; },
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                titleColor: '#0f172a', 
                bodyColor: '#475569', 
                borderColor: '#e2e8f0', 
                borderWidth: 1, 
                callbacks: { label: (c) => ` ${c.parsed.x} vendas` } 
            }
        },
        scales: {
            x: { 
                beginAtZero: true, 
                grid: { color: '#f1f5f9', tickLength: 0 }, 
                ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8', padding: 10 }, 
                border: { display: false, dash: [4, 4] } 
            },
            y: { 
                grid: { display: false }, 
                ticks: { 
                    font: { size: 11, family: "'Inter', sans-serif" }, 
                    color: '#64748b',
                    padding: 42, // 🟢 Cria espaço para a imagem caber!
                    callback: function(value) {
                        const label = this.getLabelForValue(value);
                        return label.length > 20 ? label.substr(0, 20) + '...' : label;
                    }
                },
                border: { display: false }
            }
        }
    };

    const InfoTooltip = ({ text }) => (
        <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
            <i className="bi bi-info-circle text-muted ms-1 opacity-50" style={{ fontSize: '12px', cursor: 'help' }}></i>
        </OverlayTrigger>
    );

    return (
        <>
            <div className="d-flex flex-column h-100 p-4">
                <div className="section-title mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <i className="bi bi-trophy me-2 text-muted"></i>
                        Top 10 Produtos Mais Vendidos
                    </div>
                    <InfoTooltip text="Clique nas barras para ver detalhes da conversão de cada produto." />
                </div>

                <div className="flex-grow-1 position-relative">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '200px' }}>
                            <Spinner animation="border" variant="secondary" size="sm" />
                        </div>
                    ) : (
                        <div style={{ height: '350px', width: '100%' }}>
                            {chartData && chartData.labels.length > 0 ? (
                                <Bar options={options} data={chartData} plugins={[imageYAxisPlugin]} />
                            ) : (
                                <div className="text-center text-muted h-100 d-flex flex-column justify-content-center" style={{ fontSize: '13px' }}>
                                    Nenhum dado disponível.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DETALHADO OCULTO P/ ECONOMIZAR ESPAÇO NA RESPOSTA (IGUAL AO SEU) */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedProduct && (
                    <>
                        <div className="p-4 text-white position-relative" style={{ backgroundColor: '#0f172a' }}>
                            <button onClick={handleCloseModal} className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }} title="Fechar">
                                <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                            </button>
                            <div className="d-flex align-items-center position-relative" style={{ zIndex: 1 }}>
                                <div className="bg-white p-1 rounded-3 shadow-sm me-4 flex-shrink-0">
                                    <BsImage src={selectedProduct.imagem_url || 'https://placehold.co/100x100?text=Img'} rounded style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <Badge bg="light" text="dark" className="mb-2 px-3 py-1 fw-medium text-uppercase" style={{fontSize: '11px', letterSpacing: '1px'}}>{selectedProduct.categoria_nome}</Badge>
                                    <h4 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '350px' }}>{selectedProduct.nome}</h4>
                                    <small className="opacity-75">Ref/ID: #{selectedProduct.id_produto || selectedProduct.id}</small>
                                </div>
                                <div className="text-end d-none d-md-block ps-3 border-start border-white border-opacity-25">
                                    <div className="d-flex align-items-center justify-content-end mb-1">
                                        <small className="opacity-75 text-uppercase fw-medium me-1" style={{fontSize: '11px'}}>Total Vendido</small>
                                    </div>
                                    <span className="display-6 fw-bold">{selectedProduct.total_vendido}</span>
                                </div>
                            </div>
                        </div>

                        <Modal.Body className="p-4" style={{ backgroundColor: '#f8fafc' }}>
                            <Row className="g-4">
                                <Col md={8}>
                                    <div className="bg-white rounded-4 border p-4 h-100 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>Histórico de Vendas</h6>
                                            <span className="text-muted" style={{ fontSize: '12px' }}>Últimos registros</span>
                                        </div>
                                        <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            <Table className="mb-0 align-middle table-borderless">
                                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                                                    <tr>
                                                        <th className="border-bottom ps-2 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Data da Venda</th>
                                                        <th className="border-bottom text-center text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Qtd</th>
                                                        <th className="border-bottom text-end pe-2 text-muted fw-semibold text-uppercase" style={{fontSize: '11px'}}>Ver Pedido</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedProduct.historico_vendas.length > 0 ? (
                                                        selectedProduct.historico_vendas.map((venda, idx) => (
                                                            <tr key={idx} className="border-bottom hover-effect">
                                                                <td className="ps-2 py-3 text-dark fw-medium" style={{ fontSize: '13px' }}>{formatDate(venda.data)}</td>
                                                                <td className="text-center"><Badge bg="light" text="dark" className="border fw-semibold px-2">{venda.qtd}</Badge></td>
                                                                <td className="text-end pe-2">
                                                                    <Link to={`/admin/order/${venda.id_pedido}`} className="text-decoration-none fw-medium text-primary btn-link-hover" style={{ fontSize: '13px' }}>
                                                                        #{venda.id_pedido} <i className="bi bi-arrow-right-short ms-1"></i>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="3" className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>Sem detalhes de histórico.</td></tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="d-flex flex-column gap-3 h-100">
                                        <div className="bg-white rounded-4 border p-3 flex-fill d-flex align-items-center shadow-sm">
                                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success"><i className="bi bi-box-seam fs-4"></i></div>
                                            <div>
                                                <div className="d-flex align-items-center"><small className="text-muted text-uppercase fw-bold" style={{fontSize: '11px'}}>Total de Itens</small></div>
                                                <h4 className="fw-bold mb-0 text-dark">{selectedProduct.total_vendido} <span className="fs-6 text-muted fw-normal">un.</span></h4>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-4 border p-3 flex-fill d-flex align-items-center shadow-sm">
                                            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3 text-info"><i className="bi bi-cart-check fs-4"></i></div>
                                            <div>
                                                <div className="d-flex align-items-center"><small className="text-muted text-uppercase fw-bold" style={{fontSize: '11px'}}>Pedidos Únicos</small></div>
                                                <h4 className="fw-bold mb-0 text-dark">{selectedProduct.pedidos_ids.length}</h4>
                                            </div>
                                        </div>
                                        <Button as={Link} to={`/admin/product/${selectedProduct.id_produto || selectedProduct.id}/edit`} variant="dark" className="w-100 py-3 fw-medium rounded-3 mt-auto">
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
                .hover-effect:hover td { background-color: #f8fafc !important; }
                .btn-link-hover:hover { text-decoration: underline !important; }
                .table-responsive::-webkit-scrollbar { width: 4px; }
                .table-responsive::-webkit-scrollbar-track { background: transparent; }
                .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </>
    );
};

export default TopProductsChart;