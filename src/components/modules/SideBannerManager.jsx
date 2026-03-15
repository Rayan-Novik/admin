import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, Image, Badge } from 'react-bootstrap';
import api from '../../services/api';

// --- Componente do Formulário ---
const BannerFormModal = ({ show, handleClose, onSave, banner }) => {
    const [formData, setFormData] = useState({ titulo: '', imagem_url: '', link_url: '', posicao: 'esquerda', tipo_filtro: 'categoria', valor_filtro: '', ativo: true });

    useEffect(() => {
        if (banner) { setFormData(banner); } 
        else { setFormData({ titulo: '', imagem_url: '', link_url: '', posicao: 'esquerda', tipo_filtro: 'categoria', valor_filtro: '', ativo: true }); }
    }, [banner]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>{banner ? 'Editar Banner' : 'Adicionar Banner'}</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3"><Form.Label>Título (para identificação)</Form.Label><Form.Control type="text" name="titulo" value={formData.titulo} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>URL da Imagem (318x650)</Form.Label><Form.Control type="text" name="imagem_url" value={formData.imagem_url} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Posição do Banner</Form.Label>
                        <Form.Select name="posicao" value={formData.posicao} onChange={handleChange}>
                            <option value="esquerda">Esquerda</option>
                            <option value="direita">Direita</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Tipo de Filtro dos Produtos</Form.Label>
                        <Form.Select name="tipo_filtro" value={formData.tipo_filtro} onChange={handleChange}>
                            <option value="categoria">Categoria</option>
                            <option value="marca">Marca</option>
                            <option value="desconto">Desconto (%)</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Valor do Filtro</Form.Label>
                        <Form.Control type="text" name="valor_filtro" value={formData.valor_filtro} onChange={handleChange} placeholder="Ex: notebooks, apple, 30" required />
                        <Form.Text>Use o nome exato (minúsculas) ou o valor do desconto.</Form.Text>
                    </Form.Group>
                    <Form.Check type="switch" label="Ativo" name="ativo" checked={formData.ativo} onChange={handleChange} />
                    <Button variant="primary" type="submit" className="mt-3">Guardar</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// --- Componente Principal de Gestão ---
const SideBannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentBanner, setCurrentBanner] = useState(null);

    const fetchBanners = async () => {
        try {
            const { data } = await api.get('/banners');
            setBanners(data);
        } catch (err) { setError('Não foi possível carregar os banners.'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleShowModal = (banner = null) => {
        setCurrentBanner(banner);
        setShowModal(true);
    };

    const handleSave = async (formData) => {
        try {
            if (currentBanner) {
                await api.put(`/banners/${currentBanner.id_banner}`, formData);
            } else {
                await api.post('/banners', formData);
            }
            fetchBanners();
            setShowModal(false);
        } catch (err) { alert('Não foi possível guardar o banner.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Tem a certeza?')) {
            try {
                await api.delete(`/banners/${id}`);
                fetchBanners();
            } catch (err) { alert('Não foi possível apagar o banner.'); }
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant='danger'>{error}</Alert>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Gerir Banners Laterais</h4>
                <Button onClick={() => handleShowModal()}><i className="fas fa-plus me-2"></i> Adicionar Banner</Button>
            </div>
            <Table striped bordered hover responsive>
                <thead><tr><th>Imagem</th><th>Título</th><th>Posição</th><th>Filtro</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    {banners.map(b => (
                        <tr key={b.id_banner}>
                            <td><Image src={b.imagem_url} thumbnail style={{ width: '80px' }} /></td>
                            <td>{b.titulo}</td>
                            <td>{b.posicao}</td>
                            <td>{b.tipo_filtro}: {b.valor_filtro}</td>
                            <td>{b.ativo ? <Badge bg="success">Ativo</Badge> : <Badge bg="secondary">Inativo</Badge>}</td>
                            <td>
                                <Button variant="light" className="btn-sm me-2" onClick={() => handleShowModal(b)}><i className="fas fa-edit"></i></Button>
                                <Button variant="danger" className="btn-sm" onClick={() => deleteHandler(b.id_banner)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {showModal && <BannerFormModal show={showModal} handleClose={() => setShowModal(false)} onSave={handleSave} banner={currentBanner} />}
        </>
    );
};

export default SideBannerManager;
