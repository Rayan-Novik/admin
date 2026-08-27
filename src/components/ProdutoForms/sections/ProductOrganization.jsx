import React from 'react';
import { Row, Col, Button, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductOrganization = ({ 
    formData, handleChange, handleCategoryChange, categorias, 
    filteredSubcategories, marcas, fornecedores, 
    setShowCategoryManager, setShowBrandManager 
}) => {
    return (
        <div className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3 ls-1 mt-4" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-diagram-3 me-2"></i>Classificação e Fornecimento
            </h6>
            
            <Row className="g-3">
                {/* CATEGORIA */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">Categoria</Form.Label>
                        <InputGroup className="flat-input-group">
                            <Form.Select 
                                name="id_categoria" 
                                value={formData.id_categoria || ''} 
                                onChange={handleCategoryChange} 
                                required
                            >
                                <option value="">Selecione...</option>
                                {categorias.map(c => (<option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>))}
                            </Form.Select>
                            <Button 
                                variant="none" 
                                onClick={() => setShowCategoryManager(true)} 
                                title="Gerenciar Categorias"
                            >
                                <i className="bi bi-gear-fill"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* SUBCATEGORIA */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">Subcategoria</Form.Label>
                        <InputGroup className="flat-input-group">
                            <Form.Select 
                                name="id_subcategoria" 
                                value={formData.id_subcategoria || ''} 
                                onChange={handleChange} 
                                disabled={!formData.id_categoria || filteredSubcategories.length === 0} 
                            >
                                <option value="">{filteredSubcategories.length === 0 ? 'Sem subcategorias' : 'Selecione...'}</option>
                                {filteredSubcategories.map(sub => (<option key={sub.id_subcategoria} value={sub.id_subcategoria}>{sub.nome}</option>))}
                            </Form.Select>
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* MARCA */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">Marca</Form.Label>
                        <InputGroup className="flat-input-group">
                            <Form.Select 
                                name="id_marca" 
                                value={formData.id_marca || ''} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">Selecione...</option>
                                {marcas.map(m => (<option key={m.id_marca} value={m.id_marca}>{m.nome}</option>))}
                            </Form.Select>
                            <Button 
                                variant="none" 
                                onClick={() => setShowBrandManager(true)} 
                                title="Gerenciar Marcas"
                            >
                                <i className="bi bi-gear-fill"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Col>

                {/* FORNECEDOR */}
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-semibold small text-dark mb-1">Fornecedor</Form.Label>
                        <InputGroup className="flat-input-group">
                            <Form.Select 
                                name="id_fornecedor" 
                                value={formData.id_fornecedor || ''} 
                                onChange={handleChange} 
                            >
                                <option value="">Nenhum...</option>
                                {fornecedores.map(f => (<option key={f.id_fornecedor} value={f.id_fornecedor}>{f.nome_loja}</option>))}
                            </Form.Select>
                            <Button 
                                variant="none" 
                                as={Link} 
                                to="/admin/suppliers" 
                                target="_blank" 
                                title="Adicionar Novo Fornecedor"
                            >
                                <i className="bi bi-plus-lg"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Col>
            </Row>

            <hr className="opacity-25 my-4 mt-5" style={{ borderColor: 'var(--border-color)' }} />

            <style>{`
                /* ====== ESTILOS FLAT PARA GRUPOS DE INPUT ====== */
                .flat-input-group {
                    height: 50px;
                    border: 1px solid rgba(100, 116, 139, 0.2);
                    border-radius: 14px;
                    background-color: var(--bg-sidebar, #F4F6FA);
                    transition: all 0.2s ease;
                    overflow: hidden;
                    flex-wrap: nowrap;
                }
                
                .flat-input-group:focus-within {
                    border-color: rgba(100, 116, 139, 0.4);
                    background-color: var(--bg-main, #FFFFFF);
                }

                .flat-input-group .form-select {
                    background-color: transparent !important;
                    border: none !important;
                    color: var(--text-primary, #0F172A) !important;
                    font-size: 14px;
                    box-shadow: none !important;
                    cursor: pointer;
                    height: 100%;
                }

                .flat-input-group .form-select:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* O botão anexado ao input (engrenagem / mais) */
                .flat-input-group .btn {
                    background-color: transparent;
                    border: none;
                    color: var(--text-secondary, #64748B);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 1rem;
                    transition: color 0.2s ease;
                }

                .flat-input-group .btn:hover {
                    color: #0A84FF; /* Azul padrão ao passar o mouse */
                }
            `}</style>
        </div>
    );
};

export default ProductOrganization;