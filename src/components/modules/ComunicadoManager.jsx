import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, Image, Badge } from 'react-bootstrap';
import api from '../../services/api';

const ComunicadoFormModal = ({ show, handleClose, onSave, comunicado }) => {
    const [formData, setFormData] = useState({ titulo: '', imagem_url: '', link_url: '', ativo: false });
    useEffect(() => {
        if (comunicado) { setFormData(comunicado); } 
        else { setFormData({ titulo: '', imagem_url: '', link_url: '', ativo: false }); }
    }, [comunicado]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>{comunicado ? 'Editar Comunicado' : 'Adicionar Comunicado'}</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3"><Form.Label>Título (para sua identificação)</Form.Label><Form.Control type="text" name="titulo" value={formData.titulo} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>URL da Imagem</Form.Label><Form.Control type="text" name="imagem_url" value={formData.imagem_url} onChange={handleChange} required /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Link de Destino (Opcional)</Form.Label><Form.Control type="text" name="link_url" value={formData.link_url} onChange={handleChange} placeholder="/categoria/promocoes" /></Form.Group>
                    <Form.Check type="switch" label="Ativar este comunicado na loja" name="ativo" checked={formData.ativo} onChange={handleChange} />
                    <Button variant="primary" type="submit" className="mt-3">Guardar</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

const ComunicadoManager = () => {
    const [comunicados, setComunicados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentComunicado, setCurrentComunicado] = useState(null);

    const fetchComunicados = async () => {
        try {
            const { data } = await api.get('/comunicados');
            setComunicados(data);
        } catch (err) { setError('Não foi possível carregar os comunicados.'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchComunicados(); }, []);

    const handleShowModal = (comunicado = null) => {
        setCurrentComunicado(comunicado);
        setShowModal(true);
    };
    const handleSave = async (formData) => {
        try {
            if (currentComunicado) {
                await api.put(`/comunicados/${currentComunicado.id_comunicado}`, formData);
            } else {
                await api.post('/comunicados', formData);
            }
            fetchComunicados();
            setShowModal(false);
        } catch (err) { alert('Não foi possível guardar o comunicado.'); }
    };
    const deleteHandler = async (id) => {
        if (window.confirm('Tem a certeza?')) {
            try {
                await api.delete(`/comunicados/${id}`);
                fetchComunicados();
            } catch (err) { alert('Não foi possível apagar o comunicado.'); }
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant='danger'>{error}</Alert>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Gerir Comunicados (Pop-up)</h4>
                <Button onClick={() => handleShowModal()}><i className="fas fa-plus me-2"></i> Adicionar Comunicado</Button>
            </div>
            <Table striped bordered hover responsive>
                <thead><tr><th>Imagem</th><th>Título</th><th>Link</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    {comunicados.map(c => (
                        <tr key={c.id_comunicado}>
                            <td><Image src={c.imagem_url} thumbnail style={{ width: '100px' }} /></td>
                            <td>{c.titulo}</td>
                            <td>{c.link_url || '-'}</td>
                            <td>{c.ativo ? <Badge bg="success">Ativo</Badge> : <Badge bg="secondary">Inativo</Badge>}</td>
                            <td>
                                <Button variant="light" className="btn-sm me-2" onClick={() => handleShowModal(c)}><i className="fas fa-edit"></i></Button>
                                <Button variant="danger" className="btn-sm" onClick={() => deleteHandler(c.id_comunicado)}><i className="fas fa-trash"></i></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {showModal && <ComunicadoFormModal show={showModal} handleClose={() => setShowModal(false)} onSave={handleSave} comunicado={currentComunicado} />}
        </>
    );
};

export default ComunicadoManager;
