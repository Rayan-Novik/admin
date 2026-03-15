import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, InputGroup, Alert, Row, Col, Badge, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

// --- Estilos Locais (Incluindo os estilos exatos do Product Card) ---
const CustomStyles = () => (
    <style type="text/css">{`
        .form-control-modern {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 0.5rem;
            padding: 0.75rem;
            font-size: 0.9rem;
        }
        .form-control-modern:focus {
            background-color: #fff;
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }
        .bg-light-subtle {
            background-color: #f8f9fa;
        }

        /* --- ESTILOS DO PRODUCT CARD (Replicados do Frontend) --- */
        .preview-container .product-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: #fff;
            border: none !important;
        }
        .preview-container .image-wrapper {
            width: 100%;
            aspect-ratio: 1 / 1; 
            background-color: #f8f9fa;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .preview-container .product-image {
            width: 100%;
            height: 100%;
            object-fit: contain; 
            padding: 25px; 
            transition: transform 0.5s ease;
        }
        .preview-container .btn-favorite {
            z-index: 5;
            opacity: 1; /* Forçar visível na demo */
            box-shadow: 0 .125rem .25rem rgba(0,0,0,.075);
        }
        .preview-container .price-text {
            font-size: 1.2rem;
        }
        .preview-container .btn-add-cart {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #212529;
            border: none;
            color: white;
            box-shadow: 0 .125rem .25rem rgba(0,0,0,.075);
        }
    `}</style>
);

const PixDiscountModule = () => {
    const [loading, setLoading] = useState(true);
    const [ativo, setAtivo] = useState(false);
    const [porcentagem, setPorcentagem] = useState(0);

    // Carregar configurações atuais
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/configuracoes/pix-desconto');
                setAtivo(data.ativo);
                setPorcentagem(data.porcentagem);
            } catch (error) {
                console.error("Erro ao carregar config pix", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/configuracoes/pix-desconto', {
                ativo,
                porcentagem: Number(porcentagem)
            });
            toast.success('Regra de desconto Pix atualizada com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar configuração.');
        }
    };

    // Cálculos para a prévia visual
    const exemploPreco = 149.90;
    const installmentPrice = (exemploPreco / 10).toFixed(2);
    // Lógica real de cálculo
    const pixPrice = exemploPreco * (1 - (Number(porcentagem) / 100));

    return (
        <Container fluid className="p-0">
            <CustomStyles />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-1">
                        <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
                        Desconto à Vista / Pix
                    </h4>
                    <p className="text-muted small mb-0">Configure descontos automáticos para pagamentos instantâneos.</p>
                </div>
            </div>

            <Row className="g-4">
                {/* Coluna Esquerda: Formulário */}
                <Col lg={7}>
                    <Card className="shadow-sm border-0 rounded-4 overflow-hidden h-100">
                        <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                            <h6 className="fw-bold text-dark mb-0">Configurações da Regra</h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSave}>
                                
                                {/* Switch Destacado */}
                                <div className={`p-3 rounded-3 mb-4 border transition-all ${ativo ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-light'}`}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className={`rounded-circle p-2 me-3 ${ativo ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                                                <i className={`bi ${ativo ? 'bi-toggle-on' : 'bi-toggle-off'} fs-5`}></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">Status do Desconto</div>
                                                <div className="small text-muted">{ativo ? 'O desconto está ativo na loja.' : 'O desconto está desativado.'}</div>
                                            </div>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            id="pix-switch"
                                            checked={ativo}
                                            onChange={(e) => setAtivo(e.target.checked)}
                                            className="fs-4"
                                        />
                                    </div>
                                </div>

                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-bold text-muted mb-1">Porcentagem de Desconto (%)</Form.Label>
                                            <InputGroup>
                                                <Form.Control 
                                                    type="number" 
                                                    value={porcentagem}
                                                    onChange={(e) => setPorcentagem(e.target.value)}
                                                    placeholder="Ex: 5"
                                                    min="0"
                                                    max="100"
                                                    disabled={!ativo}
                                                    className="form-control-modern fw-bold fs-5 text-primary"
                                                />
                                                <InputGroup.Text className="bg-light border-0 text-muted fw-bold">% OFF</InputGroup.Text>
                                            </InputGroup>
                                            <Form.Text className="text-muted small">
                                                Este valor será aplicado sobre o total dos produtos quando o cliente selecionar "Pix".
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-flex justify-content-end pt-2 border-top">
                                    <Button variant="dark" type="submit" size="lg" className="px-5 rounded-pill fw-bold shadow-sm" disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : 'Salvar Alterações'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Coluna Direita: Prévia Visual Fiel */}
                <Col lg={5}>
                    <Card className="shadow-sm border-0 rounded-4 bg-light-subtle h-100">
                        <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center preview-container">
                            
                            <h6 className="fw-bold text-muted mb-4 small text-uppercase ls-1 align-self-start">
                                <i className="bi bi-eye me-2"></i>Como aparecerá na loja
                            </h6>
                            
                            {/* --- INÍCIO DO PRODUCT CARD FIEL --- */}
                            <Card className="product-card h-100 shadow-sm rounded-4 overflow-hidden w-100" style={{maxWidth: '300px'}}>
                                
                                {/* Container da Imagem */}
                                <div className="image-wrapper position-relative">
                                    <img
                                        src="https://placehold.co/400x400/f8f9fa/ccc?text=Produto+Exemplo"
                                        alt="Produto Exemplo"
                                        className="product-image"
                                    />

                                    {/* Overlay de Desconto */}
                                    {ativo && Number(porcentagem) > 0 && (
                                        <Badge bg="success" className="position-absolute top-0 start-0 m-3 shadow-sm px-2 py-1" style={{ fontSize: '0.75rem', zIndex: 5 }}>
                                            -{porcentagem}% PIX
                                        </Badge>
                                    )}

                                    {/* Botão de Favorito (Estático na Demo) */}
                                    <Button
                                        variant="light"
                                        className="btn-favorite position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                    >
                                        <i className="far fa-heart text-secondary" style={{ fontSize: '0.9rem' }}></i>
                                    </Button>
                                </div>

                                <Card.Body className="d-flex flex-column px-3 py-3 text-start">
                                    
                                    <small className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                                        Esportes
                                    </small>

                                    <h6 className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '0.95rem' }}>
                                        Tênis Esportivo Runner X
                                    </h6>

                                    <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                                        <div>
                                            {/* LÓGICA DE PREÇO (Idêntica ao Product.js) */}
                                            {ativo ? (
                                                // CENÁRIO COM PIX ATIVO
                                                <div className="lh-1">
                                                    <span className="text-decoration-line-through text-muted" style={{ fontSize: '0.75rem' }}>
                                                        R$ {exemploPreco.toFixed(2).replace('.', ',')}
                                                    </span>
                                                    
                                                    <span className="d-block fw-bolder text-success price-text mt-1">
                                                        R$ {pixPrice.toFixed(2).replace('.', ',')}
                                                    </span>
                                                    
                                                    <small className="d-block text-success fw-bold" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                                                        à vista no Pix
                                                    </small>
                                                </div>
                                            ) : (
                                                // CENÁRIO SEM PIX (PADRÃO)
                                                <>
                                                    <span className="d-block fw-bolder text-dark price-text lh-1">
                                                        R$ {exemploPreco.toFixed(2).replace('.', ',')}
                                                    </span>
                                                    <small className="d-block text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                                        10x R$ {installmentPrice.replace('.', ',')}
                                                    </small>
                                                </>
                                            )}
                                        </div>

                                        <button className="btn-add-cart">
                                            <i className="fas fa-shopping-bag" style={{ fontSize: '1rem' }}></i>
                                        </button>
                                    </div>
                                </Card.Body>
                            </Card>
                            {/* --- FIM DO PRODUCT CARD FIEL --- */}

                            <Alert variant="info" className="border-0 bg-white shadow-sm small mb-0 mt-4 rounded-3 w-100">
                                <div className="d-flex">
                                    <i className="bi bi-info-circle-fill text-info me-2 mt-1"></i>
                                    <div>
                                        <strong>Nota:</strong> Esta prévia mostra exatamente como o card do produto se comportará na vitrine quando o desconto estiver ativo.
                                    </div>
                                </div>
                            </Alert>

                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PixDiscountModule;