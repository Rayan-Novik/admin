import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const ComunicadoFormModal = ({ show, handleClose, onSave, comunicado }) => {
    const [formData, setFormData] = useState({ 
        titulo: '', imagem_url: '', link_url: '', ativo: false,
        tipo_filtro: 'url', valor_filtro: '' 
    });
    
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [catRes, marcaRes, prodRes] = await Promise.all([
                    api.get('/categorias'),
                    api.get('/marcas').catch(() => ({ data: [] })),
                    api.get('/produtos?limit=100').catch(() => ({ data: [] }))
                ]);
                setCategorias(catRes.data || []);
                setMarcas(marcaRes.data || []);
                setProdutos(prodRes.data.products || prodRes.data || []);
            } catch (error) { console.error(error); } finally { setLoadingData(false); }
        };
        if (show) fetchData();
        
        if (comunicado) setFormData({ ...comunicado, tipo_filtro: 'url', valor_filtro: '' }); 
        else setFormData({ titulo: '', imagem_url: '', link_url: '', ativo: false, tipo_filtro: 'categoria', valor_filtro: '' });
    }, [show, comunicado]);

    const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

    const handleValueSelectChange = (e) => {
        const selectedValue = e.target.value;
        let newLink = '';
        if (formData.tipo_filtro === 'categoria') newLink = `/search?category=${selectedValue}`;
        else if (formData.tipo_filtro === 'subcategoria') newLink = `/search?subcategoria=${selectedValue}`;
        else if (formData.tipo_filtro === 'marca') newLink = `/search?brand=${selectedValue}`;
        else if (formData.tipo_filtro === 'produto') newLink = `/produto/${selectedValue}`;
        
        setFormData(prev => ({ ...prev, valor_filtro: selectedValue, link_url: newLink }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">{comunicado ? 'Editar' : 'Novo'}</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
                {loadingData ? <Spinner animation="border" /> : (
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={12}><ImageUploader label="Imagem" imageUrl={formData.imagem_url} onImageUpload={url => setFormData({...formData, imagem_url: url})} /></Col>
                            <Col md={12}><Form.Group><Form.Label className="fw-medium">Título</Form.Label><Form.Control value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required /></Form.Group></Col>
                            
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Tipo de Destino</Form.Label>
                                    <Form.Select name="tipo_filtro" value={formData.tipo_filtro} onChange={e => setFormData({...formData, tipo_filtro: e.target.value, valor_filtro: ''})}>
                                        <option value="categoria">Abrir Categoria</option>
                                        <option value="subcategoria">Abrir Subcategoria</option>
                                        <option value="marca">Abrir Marca</option>
                                        <option value="produto">Abrir Produto</option>
                                        <option value="url">Link Personalizado</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Selecione o Destino</Form.Label>
                                    {formData.tipo_filtro === 'categoria' && <Form.Select value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{categorias.map(cat => <option key={cat.id_categoria} value={cat.nome}>{cat.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'subcategoria' && <Form.Select value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{categorias.map(cat => <optgroup key={cat.id_categoria} label={cat.nome}>{cat.subcategorias?.map(sub => <option key={sub.id_subcategoria} value={sub.nome}>{sub.nome}</option>)}</optgroup>)}</Form.Select>}
                                    {formData.tipo_filtro === 'marca' && <Form.Select value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{marcas.map(m => <option key={m.id_marca} value={m.nome}>{m.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'produto' && <Form.Select value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'url' && <Form.Control value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} placeholder="https://..." required />}
                                </Form.Group>
                            </Col>
                            <Col md={12} className="text-muted small">Link Final Gerado: {formData.link_url}</Col>

                            <Col md={12}><Form.Check type="switch" label="Ativo" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="fw-bold" /></Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4 gap-2"><Button variant="light" onClick={handleClose}>Cancelar</Button><Button type="submit">Salvar</Button></div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ComunicadoFormModal;