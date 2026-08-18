import React, { useState } from 'react';
import { Card, Row, Col, InputGroup, Form, Button, Spinner, Collapse } from 'react-bootstrap';

const ProductFilters = ({ 
    searchTerm, setSearchTerm, 
    searchCode, setSearchCode, 
    filterCategory, categorias, handleCategoryChange, 
    filterSubCategory, setFilterSubCategory, availableSubcategories, 
    filterBrand, setFilterBrand, marcas, 
    filterType, setFilterType, 
    fetchData, loading 
}) => {
    const [openFilters, setOpenFilters] = useState(false);

    const clearSearchTerm = () => setSearchTerm('');
    const clearSearchCode = () => setSearchCode && setSearchCode('');

    return (
        <Card className="clean-card mb-4 border-0 shadow-sm filter-card-mobile-transparent">
            <Card.Body className="p-3 p-lg-3">
                <Row className="g-3 align-items-center">
                    
                    {/* --- BUSCA (NOME + CÓDIGO) --- */}
                    <Col xs={12} lg={5}>
                        <div className="d-flex gap-2">
                            {/* Busca por Nome */}
                            <InputGroup className="search-group rounded-4 overflow-hidden flex-grow-1 shadow-sm mobile-search-bar">
                                <InputGroup.Text className="border-0 bg-transparent ps-3" style={{ color: 'var(--text-secondary)' }}>
                                    <i className="bi bi-search"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar produto por nome..."
                                    className="form-dark-input border-0 shadow-none px-2 bg-transparent"
                                    style={{ fontSize: '14px', padding: '12px 10px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button variant="link" className="border-0 pe-3 text-secondary text-decoration-none bg-transparent" onClick={clearSearchTerm}>
                                        <i className="bi bi-x-lg"></i>
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Busca por Código/SKU - Desktop apenas para economizar espaço no mobile */}
                            <InputGroup className="search-group rounded-3 overflow-hidden d-none d-sm-flex shadow-sm" style={{ maxWidth: '150px' }}>
                                <InputGroup.Text className="border-0 bg-transparent ps-2 pe-1" style={{ color: 'var(--text-secondary)' }}>
                                    <i className="bi bi-upc-scan"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="SKU/ID"
                                    className="form-dark-input border-0 shadow-none px-1 bg-transparent text-center"
                                    style={{ fontSize: '13px' }}
                                    value={searchCode || ''}
                                    onChange={(e) => setSearchCode && setSearchCode(e.target.value)}
                                />
                            </InputGroup>

                            {/* Botão Filtro Mobile (Desativado se usarmos Scroll Horizontal direto) */}
                            <Button 
                                variant={openFilters ? "primary" : "light"} 
                                className="d-none rounded-3 shadow-none btn-mobile-filter"
                                onClick={() => setOpenFilters(!openFilters)}
                            >
                                <i className={`bi bi-${openFilters ? 'funnel-fill text-white' : 'funnel'}`}></i>
                            </Button>
                        </div>
                    </Col>

                    {/* --- FILTROS (SCROLL HORIZONTAL NO MOBILE) --- */}
                    <Col xs={12} lg={7} className="filter-collapse-override">
                        <Collapse in={openFilters} className="d-lg-block collapse-override">
                            <div id="filter-collapse">
                                <div className="filters-scroll-wrapper d-flex flex-row flex-lg-row gap-2 justify-content-lg-end pt-2 pt-lg-0">
                                    
                                    <Form.Select 
                                        className="form-dark-input shadow-none custom-select-filter fw-semibold" 
                                        value={filterType} 
                                        onChange={(e) => setFilterType(e.target.value)} 
                                    >
                                        <option value="">📦 Todos Tipos</option>
                                        <option value="FINAL">Venda</option>
                                        <option value="INSUMO">Insumo</option>
                                        <option value="MISTO">Misto</option>
                                        <option value="CONSUMO_INTERNO">Uso Interno</option>
                                    </Form.Select>

                                    <Form.Select 
                                        className="form-dark-input shadow-none custom-select-filter fw-semibold" 
                                        value={filterCategory} 
                                        onChange={handleCategoryChange} 
                                    >
                                        <option value="">📁 Categorias</option>
                                        <option value="none" disabled>──────────</option>
                                        {categorias.map(c => (
                                            <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>
                                        ))}
                                    </Form.Select>
                                    
                                    <Form.Select 
                                        className="form-dark-input shadow-none custom-select-filter fw-semibold" 
                                        value={filterBrand} 
                                        onChange={e => setFilterBrand(e.target.value)} 
                                    >
                                        <option value="">🏷️ Marcas</option>
                                        <option value="none" disabled>──────────</option>
                                        {marcas.map(m => (
                                            <option key={m.id_marca} value={m.id_marca}>{m.nome}</option>
                                        ))}
                                    </Form.Select>

                                    {/* Botão de Refresh */}
                                    <Button 
                                        variant="light" 
                                        className="btn-refresh rounded-circle shadow-none d-flex align-items-center justify-content-center flex-shrink-0" 
                                        onClick={fetchData} 
                                        disabled={loading}
                                        title="Atualizar"
                                    >
                                        {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise fs-6"></i>}
                                    </Button>
                                </div>
                            </div>
                        </Collapse>
                    </Col>
                </Row>
            </Card.Body>

            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0) !important;
                    border-radius: 12px;
                }

                .search-group {
                    background-color: var(--bg-main, #f8fafc);
                    border: 1px solid var(--border-color, #e2e8f0);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .search-group:focus-within {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
                }

                .form-dark-input {
                    background-color: transparent !important;
                    color: var(--text-primary, #0f172a) !important;
                }
                .form-dark-input::placeholder { color: var(--text-secondary, #64748b); opacity: 0.7; }

                .custom-select-filter {
                    background-color: var(--bg-main, #f8fafc) !important;
                    border: 1px solid var(--border-color, #e2e8f0) !important;
                    font-size: 13px !important;
                    width: auto;
                    min-width: 130px;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .btn-refresh {
                    background-color: var(--bg-main, #f8fafc);
                    border: 1px solid var(--border-color, #e2e8f0);
                    color: var(--text-primary, #0f172a);
                    width: 40px; height: 40px;
                }

                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                @media (max-width: 991px) {
                    .filter-card-mobile-transparent {
                        background-color: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .filter-card-mobile-transparent .card-body {
                        padding: 0 0 10px 0 !important;
                    }
                    .mobile-search-bar {
                        background-color: #ffffff !important;
                        border: none !important;
                    }
                    .filter-collapse-override {
                        display: block !important;
                    }
                    .collapse-override {
                        display: block !important;
                        height: auto !important;
                    }
                    .filters-scroll-wrapper {
                        display: flex;
                        overflow-x: auto;
                        gap: 10px;
                        padding-bottom: 5px;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .filters-scroll-wrapper::-webkit-scrollbar { display: none; }
                    .filters-scroll-wrapper .form-select {
                        flex: 0 0 auto;
                        border-radius: 20px !important;
                        background-color: #e6e6e6 !important; /* Estilo cinza padronizado */
                        border: none !important;
                        padding: 8px 30px 8px 15px !important;
                    }
                    .filters-scroll-wrapper .btn-refresh {
                        background-color: #e6e6e6 !important;
                        border: none !important;
                    }
                }
            `}</style>
        </Card>
    );
};

export default ProductFilters;