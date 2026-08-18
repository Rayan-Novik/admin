import React from 'react';
import { Row, Col, Button, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductOrganization = ({ formData, handleChange, handleCategoryChange, categorias, filteredSubcategories, marcas, fornecedores, setShowCategoryManager, setShowBrandManager }) => {
    return (
        <div className="mb-4">
            <h6 className="text-uppercase fw-bold mb-4 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><i className="bi bi-diagram-3 me-2"></i>Classificação</h6>
            
            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold mb-1 text-uppercase" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Categoria</Form.Label>
                <InputGroup className="border rounded-3 overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <Form.Select name="id_categoria" value={formData.id_categoria || ''} onChange={handleCategoryChange} className="form-dark-input border-0 shadow-none" style={{fontSize: '13px'}} required>
                        <option value="">Selecione...</option>
                        {categorias.map(c => (<option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>))}
                    </Form.Select>
                    <Button variant="light" size="sm" onClick={() => setShowCategoryManager(true)} className="border-0 bg-transparent" style={{ color: 'var(--text-secondary)' }}><i className="bi bi-gear"></i></Button>
                </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold mb-1 text-uppercase" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Subcategoria</Form.Label>
                <Form.Select name="id_subcategoria" value={formData.id_subcategoria || ''} onChange={handleChange} disabled={!formData.id_categoria || filteredSubcategories.length === 0} className="form-dark-input border rounded-3 shadow-none" style={{fontSize: '13px'}}>
                    <option value="">{filteredSubcategories.length === 0 ? 'Sem subcategorias' : 'Selecione...'}</option>
                    {filteredSubcategories.map(sub => (<option key={sub.id_subcategoria} value={sub.id_subcategoria}>{sub.nome}</option>))}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold mb-1 text-uppercase" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Marca</Form.Label>
                <InputGroup className="border rounded-3 overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <Form.Select name="id_marca" value={formData.id_marca || ''} onChange={handleChange} className="form-dark-input border-0 shadow-none" style={{fontSize: '13px'}} required>
                        <option value="">Selecione...</option>
                        {marcas.map(m => (<option key={m.id_marca} value={m.id_marca}>{m.nome}</option>))}
                    </Form.Select>
                    <Button variant="light" size="sm" onClick={() => setShowBrandManager(true)} className="border-0 bg-transparent" style={{ color: 'var(--text-secondary)' }}><i className="bi bi-gear"></i></Button>
                </InputGroup>
            </Form.Group>

            <Form.Group>
                <Form.Label className="fw-semibold mb-1 text-uppercase" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fornecedor</Form.Label>
                <InputGroup className="border rounded-3 overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <Form.Select name="id_fornecedor" value={formData.id_fornecedor || ''} onChange={handleChange} className="form-dark-input border-0 shadow-none" style={{fontSize: '13px'}}>
                        <option value="">Nenhum...</option>
                        {fornecedores.map(f => (<option key={f.id_fornecedor} value={f.id_fornecedor}>{f.nome_loja}</option>))}
                    </Form.Select>
                    <Button variant="light" as={Link} to="/admin/suppliers" target="_blank" className="border-0 bg-transparent" style={{ color: 'var(--text-primary)' }}><i className="bi bi-plus-circle"></i></Button>
                </InputGroup>
            </Form.Group>

            <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />
        </div>
    );
};

export default ProductOrganization;