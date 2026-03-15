import React, { useState, useEffect } from 'react';
import { Card, Spinner, Modal, Button, Row, Col, Badge, Image as BsImage, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
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

const MostViewedProductsChart = ({ dateRange }) => {
    const [chartData, setChartData] = useState(null);
    const [fullProductsData, setFullProductsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productImages, setProductImages] = useState([]);

    // --- ESTADOS DO MODAL ---
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange || !dateRange.startDate) return;

            setLoading(true);
            try {
                const { data } = await api.get('/dashboard/most-viewed-products', {
                    params: {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    }
                });
                
                // Pré-carrega imagens
                const imagesElements = data.images.map((url) => {
                    const img = new Image();
                    img.src = url || 'https://placehold.co/50x50?text=View';
                    return img;
                });
                setProductImages(imagesElements);
                
                setFullProductsData(data.fullData); 

                setChartData({
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Visualizações',
                            data: data.values,
                            backgroundColor: '#6610f2', // Roxo
                            hoverBackgroundColor: '#520dc2',
                            borderRadius: 6,
                            borderSkipped: false,
                            barThickness: 30,
                        }
                    ]
                });
            } catch (err) {
                console.error("Erro ao carregar mais vistos:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [dateRange]);

    // --- INTERAÇÃO DE CLIQUE (SEM ERROS) ---
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

    // --- PLUGIN DE IMAGENS ---
    const imageXAxisPlugin = {
        id: 'imageXAxisViewed',
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
        onHover: (event, chartElement) => {
            event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
        },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Top 10 Produtos Mais Visitados',
                align: 'start',
                font: { size: 16, weight: 'bold', family: "'Inter', sans-serif" },
                padding: { bottom: 20 },
                color: '#212529'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#212529',
                bodyColor: '#6c757d',
                borderColor: '#e9ecef',
                borderWidth: 1,
                callbacks: { label: (c) => ` ${c.parsed.y} views` }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f8f9fa' },
                ticks: { font: { size: 10 }, color: '#adb5bd' },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { display: false }
            }
        }
    };

    // --- HELPER PARA TOOLTIPS ---
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
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <div style={{ height: '350px', width: '100%' }}>
                            {chartData && chartData.labels.length > 0 ? (
                                <Bar 
                                    options={options} 
                                    data={chartData} 
                                    plugins={[imageXAxisPlugin]} 
                                />
                            ) : (
                                <div className="text-center text-muted h-100 d-flex flex-column justify-content-center">
                                    <i className="bi bi-eye-slash fs-1 opacity-25 mb-2"></i>
                                    <small>Nenhuma visualização registrada no período.</small>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* --- MODAL DETALHADO --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {selectedProduct && (
                    <>
                        {/* 1. Cabeçalho Gradiente */}
                        <div className="bg-primary bg-gradient p-4 text-white position-relative" style={{ background: 'linear-gradient(135deg, #6610f2 0%, #520dc2 100%)' }}>
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
                                    {/* ✅ CORREÇÃO AQUI: Usando imagem_url em vez de imagem */}
                                    <BsImage src={selectedProduct.imagem_url || 'https://placehold.co/100x100'} rounded style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                </div>
                                <div className="flex-grow-1">
                                    <Badge bg="light" text="dark" className="mb-2 px-3 py-1 fw-bold text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>{selectedProduct.categoria_nome}</Badge>
                                    <h4 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '350px' }}>{selectedProduct.nome}</h4>
                                    <small className="opacity-75">Ref/ID: #{selectedProduct.id_produto}</small>
                                </div>
                                <div className="text-end d-none d-md-block ps-3 border-start border-white border-opacity-25">
                                    <div className="d-flex align-items-center justify-content-end mb-1">
                                        <small className="opacity-75 text-uppercase fw-bold me-1" style={{fontSize: '0.7rem'}}>Total Views</small>
                                        <OverlayTrigger placement="left" overlay={<BsTooltip>Quantidade total de vezes que a página deste produto foi acessada no período.</BsTooltip>}>
                                            <i className="bi bi-info-circle text-white opacity-50" style={{ cursor: 'help' }}></i>
                                        </OverlayTrigger>
                                    </div>
                                    <span className="display-6 fw-bold">{selectedProduct.total_views}</span>
                                </div>
                            </div>
                        </div>

                        <Modal.Body className="p-4 bg-light">
                            <Row className="g-4">
                                {/* Coluna Esquerda: Dados do Produto */}
                                <Col md={8}>
                                    <Card className="border-0 shadow-sm h-100">
                                        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                                            <h6 className="fw-bold text-dark mb-0"><i className="bi bi-tag me-2 text-primary"></i>Detalhes do Item</h6>
                                        </Card.Header>
                                        <Card.Body className="p-4">
                                            <Row className="g-3">
                                                <Col xs={6}>
                                                    <div className="p-3 border rounded bg-light">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Preço Atual</small>
                                                            <InfoTooltip text="Valor de venda atual cadastrado no sistema." />
                                                        </div>
                                                        <span className="fw-bold text-dark fs-5">{formatCurrency(selectedProduct.preco)}</span>
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className={`p-3 border rounded ${selectedProduct.estoque > 0 ? 'bg-light' : 'bg-danger bg-opacity-10 border-danger'}`}>
                                                        <div className="d-flex align-items-center mb-1">
                                                            <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Estoque Disponível</small>
                                                            <InfoTooltip text="Quantidade física disponível para venda imediata." />
                                                        </div>
                                                        <span className={`fw-bold fs-5 ${selectedProduct.estoque === 0 ? 'text-danger' : 'text-dark'}`}>
                                                            {selectedProduct.estoque} un.
                                                        </span>
                                                    </div>
                                                </Col>
                                            </Row>
                                            
                                            <div className="mt-4 pt-3 border-top">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-lightbulb text-warning me-2 fs-5"></i>
                                                    <small className="text-muted">
                                                        Este produto tem <strong className="text-dark">{selectedProduct.total_views}</strong> visualizações. 
                                                        {selectedProduct.estoque === 0 
                                                            ? " Considere repor o estoque para aproveitar o tráfego." 
                                                            : " Verifique se a conversão em vendas está adequada ao número de visitas."}
                                                    </small>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* Coluna Direita: Ações */}
                                <Col md={4}>
                                    <div className="d-flex flex-column gap-3 h-100">
                                        <Card className="border-0 shadow-sm flex-fill">
                                            <Card.Body className="d-flex align-items-center p-3">
                                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary">
                                                    <i className="bi bi-eye fs-4"></i>
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center">
                                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Interesse</small>
                                                    </div>
                                                    <h5 className="fw-bold mb-0 text-dark">Alto</h5>
                                                </div>
                                            </Card.Body>
                                        </Card>

                                        <Card className="border-0 shadow-sm flex-fill">
                                            <Card.Body className="d-flex align-items-center p-3">
                                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                                                    <i className="bi bi-currency-dollar fs-4"></i>
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center">
                                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Custo Base</small>
                                                    </div>
                                                    <h5 className="fw-bold mb-0 text-dark">{formatCurrency(selectedProduct.preco_custo || 0)}</h5>
                                                </div>
                                            </Card.Body>
                                        </Card>

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
            `}</style>
        </>
    );
};

export default MostViewedProductsChart;