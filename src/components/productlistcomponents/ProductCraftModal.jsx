import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Table } from 'react-bootstrap';
import api from '../../services/api';

const ProductCraftModal = ({ show, onHide, product, onSuccess }) => {
    const [qtd, setQtd] = useState(1);
    const [receita, setReceita] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Calcula quantos é possível fazer no máximo
    const [maxPossible, setMaxPossible] = useState(0);

    useEffect(() => {
        if (show && product) {
            setQtd(1);
            setError('');
            fetchData();
        }
    }, [show, product]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/produtos/${product.id_produto}/composicao`);
            setReceita(data);
            
            if (data.length > 0) {
                // Calcula o máximo possível baseado no estoque dos insumos
                const limits = data.map(item => {
                    const stock = Number(item.estoque_atual_insumo || 0);
                    const needed = Number(item.quantidade_necessaria);
                    if (needed === 0) return 999999;
                    return Math.floor(stock / needed);
                });
                setMaxPossible(Math.min(...limits));
            } else {
                setMaxPossible(0);
                setError("Este produto não possui receita definida. Configure a composição primeiro.");
            }
        } catch (err) {
            setError("Erro ao carregar receita.");
        } finally {
            setLoading(false);
        }
    };

    const handleCraft = async () => {
        try {
            setLoading(true);
            setError('');
            await api.post(`/produtos/${product.id_produto}/fabricar`, { quantidade: Number(qtd) });
            alert(`Sucesso! ${qtd} unidades adicionadas ao estoque.`);
            onSuccess(); // Fecha modal e recarrega lista
        } catch (err) {
            setError(err.response?.data?.message || "Erro ao fabricar produto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Fabricar: {product?.nome}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <div className="mb-4 text-center">
                    <h5>Quantas unidades deseja produzir?</h5>
                    <div className="d-flex justify-content-center align-items-center gap-2 my-3">
                        <Button variant="outline-secondary" onClick={() => setQtd(q => Math.max(1, q - 1))}>-</Button>
                        <Form.Control 
                            type="number" 
                            value={qtd} 
                            onChange={e => setQtd(Math.max(1, Number(e.target.value)))}
                            style={{ width: '100px', textAlign: 'center', fontSize: '1.2rem' }}
                        />
                        <Button variant="outline-secondary" onClick={() => setQtd(q => q + 1)}>+</Button>
                    </div>
                    <small className="text-muted">
                        Máximo possível com estoque atual: <strong>{maxPossible} unidades</strong>
                    </small>
                </div>

                <h6>Resumo de Consumo:</h6>
                <Table size="sm" className="small text-muted">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Por Unidade</th>
                            <th>Total Gasto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receita.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.nome}</td>
                                <td>{Number(item.quantidade_necessaria).toFixed(3)}</td>
                                <td className="fw-bold text-dark">
                                    {(Number(item.quantidade_necessaria) * qtd).toFixed(3)} {item.unidade}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancelar</Button>
                <Button 
                    variant="primary" 
                    onClick={handleCraft} 
                    disabled={loading || maxPossible === 0 || qtd > maxPossible || receita.length === 0}
                >
                    {loading ? 'Processando...' : 'Confirmar Fabricação'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProductCraftModal;