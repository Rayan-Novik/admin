import React from 'react';
import { Card, Form, InputGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductOrganization = ({ 
    formData, 
    handleChange, 
    handleCategoryChange, 
    categorias, 
    filteredSubcategories, 
    marcas, 
    fornecedores,
    setShowCategoryManager,
    setShowBrandManager
}) => {
    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 text-secondary"><i className="bi bi-tags me-2"></i>Organização</h5>
                
                {/* ✅ NOVO: Tipo de Produto */}
                <Form.Group controlId='tipo_produto' className="mb-3">
                    <Form.Label className="fw-medium">Tipo de Produto</Form.Label>
                    <Form.Select 
                        name="tipo_produto" 
                        value={formData.tipo_produto || 'FINAL'} 
                        onChange={handleChange}
                        className="bg-light border-secondary border-opacity-25"
                    >
                        <option value="FINAL">Produto Final (Venda)</option>
                        <option value="INSUMO">Insumo (Matéria Prima)</option>
                        <option value="MISTO">Misto (Venda + Insumo)</option>
                        <option value="CONSUMO_INTERNO">Uso Interno</option>
                    </Form.Select>
                    <Form.Text className="text-muted small">
                        Insumos não aparecem na loja pública.
                    </Form.Text>
                </Form.Group>

                <hr className="my-3 opacity-25" />

                {/* Categoria */}
                <Form.Group controlId='categoria' className="mb-3">
                    <Form.Label className="fw-medium">Categoria</Form.Label>
                    <InputGroup>
                        <Form.Select name="id_categoria" value={formData.id_categoria || ''} onChange={handleCategoryChange} required>
                            <option value="">Selecione...</option>
                            {categorias.map(c => (<option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>))}
                        </Form.Select>
                        <Button variant="outline-secondary" onClick={() => setShowCategoryManager(true)} title="Gerenciar Categorias">
                            <i className="bi bi-gear"></i>
                        </Button>
                    </InputGroup>
                </Form.Group>

                {/* Subcategoria */}
                <Form.Group controlId='subcategoria' className="mb-3">
                    <Form.Label className="fw-medium">Subcategoria</Form.Label>
                    <Form.Select name="id_subcategoria" value={formData.id_subcategoria || ''} onChange={handleChange} disabled={!formData.id_categoria || filteredSubcategories.length === 0}>
                        <option value="">{filteredSubcategories.length === 0 ? 'Sem subcategorias' : 'Selecione...'}</option>
                        {filteredSubcategories.map(sub => (<option key={sub.id_subcategoria} value={sub.id_subcategoria}>{sub.nome}</option>))}
                    </Form.Select>
                </Form.Group>

                {/* Marca */}
                <Form.Group controlId='marca' className="mb-3">
                    <Form.Label className="fw-medium">Marca</Form.Label>
                    <InputGroup>
                        <Form.Select name="id_marca" value={formData.id_marca || ''} onChange={handleChange} required>
                            <option value="">Selecione...</option>
                            {marcas.map(m => (<option key={m.id_marca} value={m.id_marca}>{m.nome}</option>))}
                        </Form.Select>
                        <Button variant="outline-secondary" onClick={() => setShowBrandManager(true)} title="Gerenciar Marcas">
                            <i className="bi bi-gear"></i>
                        </Button>
                    </InputGroup>
                </Form.Group>

                {/* Fornecedor */}
                <Form.Group controlId='fornecedor'>
                    <Form.Label className="fw-medium text-primary">Fornecedor</Form.Label>
                    <InputGroup>
                        <Form.Select name="id_fornecedor" value={formData.id_fornecedor || ''} onChange={handleChange}>
                            <option value="">Nenhum...</option>
                            {fornecedores.map(f => (<option key={f.id_fornecedor} value={f.id_fornecedor}>{f.nome_loja}</option>))}
                        </Form.Select>
                        <Button variant="outline-primary" as={Link} to="/admin/suppliers" target="_blank" title="Novo Fornecedor">
                            <i className="bi bi-plus-circle"></i>
                        </Button>
                    </InputGroup>
                </Form.Group>
            </Card.Body>
        </Card>
    );
};

export default ProductOrganization;