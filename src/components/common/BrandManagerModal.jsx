// Em /components/admin/BrandManagerModal.jsx

import { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import api from '../../services/api';

const BrandManagerModal = ({ show, handleClose, initialBrands, onUpdate }) => {
    const [brands, setBrands] = useState(initialBrands);
    const [newBrandName, setNewBrandName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setBrands(initialBrands);
    }, [initialBrands]);

    const handleAddBrand = async (e) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        setLoading(true);
        setError('');
        try {
            await api.post('/marcas', { nome: newBrandName });
            setNewBrandName('');
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao adicionar marca.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBrand = async (brandId) => {
        if (window.confirm('Tem a certeza que quer remover esta marca? Isto pode afetar produtos existentes.')) {
            try {
                await api.delete(`/marcas/${brandId}`);
                onUpdate();
            } catch (err) {
                alert(err.response?.data?.message || 'Não foi possível remover a marca.');
            }
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Gerir Marcas</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <h5>Adicionar Nova Marca</h5>
                <Form onSubmit={handleAddBrand}>
                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Nome da nova marca"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                        />
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Adicionar'}
                        </Button>
                    </InputGroup>
                </Form>
                <hr />

                <h5>Marcas Existentes</h5>
                <ListGroup>
                    {brands.map(brand => (
                        <ListGroup.Item key={brand.id_marca} className="d-flex justify-content-between align-items-center">
                            {brand.nome}
                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveBrand(brand.id_marca)}>
                                <i className="fas fa-trash"></i>
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
};

export default BrandManagerModal;