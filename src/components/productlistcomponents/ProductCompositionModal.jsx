import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Row, Col, Alert } from 'react-bootstrap';
import api from '../../services/api';

const ProductCompositionModal = ({ show, onHide, product, allProducts }) => {
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estados do formulário de adição
    const [selectedInsumoId, setSelectedInsumoId] = useState('');
    const [qtdInput, setQtdInput] = useState('');

    useEffect(() => {
        if (show && product) {
            fetchComposition();
        } else {
            setItens([]);
        }
    }, [show, product]);

    const fetchComposition = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/produtos/${product.id_produto}/composicao`);
            setItens(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (!selectedInsumoId || !qtdInput) return;
        
        // Verifica se já existe
        if (itens.some(i => i.id_insumo === Number(selectedInsumoId))) {
            alert("Este insumo já está na lista.");
            return;
        }

        const insumoObj = allProducts.find(p => p.id_produto === Number(selectedInsumoId));
        
        setItens([
            ...itens,
            {
                id_insumo: Number(selectedInsumoId),
                nome: insumoObj?.nome || 'Insumo',
                unidade: insumoObj?.unidade || 'UN',
                quantidade_necessaria: Number(qtdInput)
            }
        ]);
        
        setSelectedInsumoId('');
        setQtdInput('');
    };

    const handleRemove = (id) => {
        setItens(itens.filter(i => i.id_insumo !== id));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Formata para o backend: { itens: [{id_insumo, quantidade}, ...] }
            const payload = {
                itens: itens.map(i => ({
                    id_insumo: i.id_insumo,
                    quantidade: i.quantidade_necessaria
                }))
            };

            await api.post(`/produtos/${product.id_produto}/composicao`, payload);
            alert("Receita salva com sucesso!");
            onHide();
        } catch (error) {
            alert("Erro ao salvar receita: " + (error.response?.data?.message || 'Erro interno'));
        } finally {
            setLoading(false);
        }
    };

    // Filtra lista de insumos disponíveis (remove o próprio produto e itens já adicionados visualmente se quiser)
    const availableInsumos = allProducts.filter(p => p.id_produto !== product?.id_produto);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Receita de Fabricação: <span className="text-primary">{product?.nome}</span></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="bg-light p-3 rounded mb-3">
                    <h6>Adicionar Ingrediente</h6>
                    <Row className="g-2">
                        <Col md={7}>
                            <Form.Select 
                                value={selectedInsumoId} 
                                onChange={e => setSelectedInsumoId(e.target.value)}
                            >
                                <option value="">Selecione um insumo...</option>
                                {availableInsumos.map(p => (
                                    <option key={p.id_produto} value={p.id_produto}>
                                        {p.nome} (Estoque: {Number(p.estoque).toFixed(2)} {p.unidade})
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Control 
                                type="number" 
                                placeholder="Qtd necessária" 
                                value={qtdInput}
                                onChange={e => setQtdInput(e.target.value)}
                            />
                        </Col>
                        <Col md={2}>
                            <Button variant="success" className="w-100" onClick={handleAdd}>
                                <i className="bi bi-plus-lg"></i> Add
                            </Button>
                        </Col>
                    </Row>
                </div>

                <Table striped hover bordered className="align-middle">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th style={{width: '150px'}}>Qtd Necessária</th>
                            <th style={{width: '100px'}}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itens.length === 0 ? (
                            <tr><td colSpan="3" className="text-center text-muted">Nenhum ingrediente definido.</td></tr>
                        ) : (
                            itens.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.nome}</td>
                                    <td>{Number(item.quantidade_necessaria).toFixed(3)} {item.unidade}</td>
                                    <td>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleRemove(item.id_insumo)}>
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Receita'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProductCompositionModal;