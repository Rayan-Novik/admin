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
    // Controla se os filtros extras aparecem no mobile
    const [openFilters, setOpenFilters] = useState(false);

    const clearSearchTerm = () => setSearchTerm('');
    const clearSearchCode = () => setSearchCode && setSearchCode('');

    return (
        <Card className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
            <Card.Body className="p-3 bg-white">
                <Row className="g-2 align-items-center">
                    
                    {/* --- BUSCA (NOME + CÓDIGO) --- */}
                    <Col xs={12} lg={5}>
                        <div className="d-flex gap-2">
                            {/* Busca por Nome */}
                            <InputGroup className="shadow-sm rounded-pill overflow-hidden border flex-grow-1">
                                <InputGroup.Text className="bg-white border-0 ps-3 text-muted">
                                    <i className="bi bi-search"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar nome..."
                                    className="border-0 shadow-none bg-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button variant="link" className="text-muted border-0 pe-3" onClick={clearSearchTerm}>
                                        <i className="bi bi-x-circle-fill"></i>
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Busca por Código (Menor) */}
                            <InputGroup className="shadow-sm rounded-pill overflow-hidden border" style={{ maxWidth: '140px' }}>
                                <InputGroup.Text className="bg-white border-0 ps-3 text-muted">
                                    <i className="bi bi-upc-scan"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="SKU/ID"
                                    className="border-0 shadow-none bg-transparent px-1"
                                    value={searchCode || ''}
                                    onChange={(e) => setSearchCode && setSearchCode(e.target.value)}
                                />
                                {searchCode && (
                                    <Button variant="link" className="text-muted border-0 pe-2" onClick={clearSearchCode}>
                                        <i className="bi bi-x"></i>
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Botão Filtro Mobile */}
                            <Button 
                                variant={openFilters ? "primary" : "light"} 
                                className="d-lg-none rounded-circle shadow-sm border"
                                onClick={() => setOpenFilters(!openFilters)}
                            >
                                <i className={`bi bi-${openFilters ? 'funnel-fill' : 'funnel'}`}></i>
                            </Button>
                        </div>
                    </Col>

                    {/* --- FILTROS (DROPDOWNS) --- */}
                    <Col xs={12} lg={7}>
                        <Collapse in={openFilters} className="d-lg-block">
                            <div id="filter-collapse">
                                <div className="d-flex flex-column flex-lg-row gap-2 justify-content-lg-end pt-2 pt-lg-0">
                                    
                                    <Form.Select 
                                        className="rounded-pill border shadow-sm bg-light text-muted" 
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
                                        className="rounded-pill border shadow-sm bg-light text-muted" 
                                        value={filterCategory} 
                                        onChange={handleCategoryChange} 
                                    >
                                        <option value="">📁 Categorias</option>
                                        {categorias.map(c => (
                                            <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>
                                        ))}
                                    </Form.Select>
                                    
                                    <Form.Select 
                                        className="rounded-pill border shadow-sm bg-light text-muted" 
                                        value={filterSubCategory} 
                                        onChange={e => setFilterSubCategory(e.target.value)} 
                                        disabled={!filterCategory} 
                                    >
                                        <option value="">📂 Subs</option>
                                        {availableSubcategories.map(s => (
                                            <option key={s.id_subcategoria} value={s.id_subcategoria}>{s.nome}</option>
                                        ))}
                                    </Form.Select>

                                    <Form.Select 
                                        className="rounded-pill border shadow-sm bg-light text-muted" 
                                        value={filterBrand} 
                                        onChange={e => setFilterBrand(e.target.value)} 
                                    >
                                        <option value="">🏷️ Marcas</option>
                                        {marcas.map(m => (
                                            <option key={m.id_marca} value={m.id_marca}>{m.nome}</option>
                                        ))}
                                    </Form.Select>

                                    <Button 
                                        variant="light" 
                                        className="rounded-circle shadow-sm border d-none d-lg-flex align-items-center justify-content-center flex-shrink-0" 
                                        onClick={fetchData} 
                                        disabled={loading}
                                        title="Atualizar"
                                        style={{ width: '38px', height: '38px' }}
                                    >
                                        {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}
                                    </Button>
                                </div>
                            </div>
                        </Collapse>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default ProductFilters;