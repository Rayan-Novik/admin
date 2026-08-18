import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const SideBannerFormModal = ({ show, handleClose, onSave, banner }) => {
    const [formData, setFormData] = useState({ 
        titulo: '', imagem_url: '', link_url: '', posicao: 'esquerda', 
        tipo_filtro: 'categoria', valor_filtro: '', ativo: true 
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
        if (banner) setFormData(banner);
        else setFormData({ titulo: '', imagem_url: '', link_url: '', posicao: 'esquerda', tipo_filtro: 'categoria', valor_filtro: '', ativo: true });
    }, [show, banner]);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target; 
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); 
    };

    const handleValueSelectChange = (e) => {
        const selectedValue = e.target.value;
        let update = { valor_filtro: selectedValue };
        if (formData.tipo_filtro === 'categoria') update.link_url = `/search?category=${selectedValue}`;
        else if (formData.tipo_filtro === 'marca') update.link_url = `/search?brand=${selectedValue}`;
        else if (formData.tipo_filtro === 'produto') update.link_url = `/produto/${selectedValue}`;
        else if (formData.tipo_filtro === 'subcategoria') update.link_url = `/search?subcategoria=${selectedValue}`;
        setFormData(prev => ({ ...prev, ...update }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">{banner ? 'Editar Banner' : 'Novo Banner'}</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
                {loadingData ? <div className="text-center py-4"><Spinner animation="border" size="sm" /> Carregando opções...</div> : (
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={12}><ImageUploader label="Imagem (318x650)" imageUrl={formData.imagem_url} onImageUpload={url => setFormData({...formData, imagem_url: url})} /></Col>
                            <Col md={8}><Form.Group><Form.Label className="fw-medium">Título (Interno)</Form.Label><Form.Control name="titulo" value={formData.titulo} onChange={handleChange} required /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label className="fw-medium">Posição</Form.Label><Form.Select name="posicao" value={formData.posicao} onChange={handleChange}><option value="esquerda">Esquerda</option><option value="direita">Direita</option></Form.Select></Form.Group></Col>
                            
                            <Col md={12}><hr className="my-0 text-muted" /></Col>
                            <Col md={12}><h6 className="text-primary mb-0">Ação do Clique</h6></Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-medium">Tipo de Destino</Form.Label>
                                    <Form.Select name="tipo_filtro" value={formData.tipo_filtro} onChange={(e) => { handleChange(e); setFormData(prev => ({...prev, valor_filtro: ''})); }}>
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
                                    {formData.tipo_filtro === 'categoria' && <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{categorias.map(cat => <option key={cat.id_categoria} value={cat.nome}>{cat.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'subcategoria' && <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{categorias.map(cat => <optgroup key={cat.id_categoria} label={cat.nome}>{cat.subcategorias?.map(sub => <option key={sub.id_subcategoria} value={sub.nome}>{sub.nome}</option>)}</optgroup>)}</Form.Select>}
                                    {formData.tipo_filtro === 'marca' && <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{marcas.map(m => <option key={m.id_marca} value={m.nome}>{m.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'produto' && <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required><option value="">-- Selecione --</option>{produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>)}</Form.Select>}
                                    {formData.tipo_filtro === 'url' && <Form.Control name="link_url" value={formData.link_url} onChange={handleChange} placeholder="https://..." required />}
                                </Form.Group>
                            </Col>
                            <Col md={12}><Form.Check type="switch" label="Banner Ativo" name="ativo" checked={formData.ativo} onChange={handleChange} className="fw-bold mt-2" /></Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4 pt-2 border-top gap-2"><Button variant="light" onClick={handleClose}>Cancelar</Button><Button type="submit">Salvar</Button></div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default SideBannerFormModal;