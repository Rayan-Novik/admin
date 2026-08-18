// src/components/ifood/IfoodEditModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const IfoodEditModal = ({ show, onHide, produto, onSave }) => {
    const [restricoes, setRestricoes] = useState([]);
    const [serving, setServing] = useState('NOT_APPLICABLE');
    const [peso, setPeso] = useState('0');
    const [unidadePeso, setUnidadePeso] = useState('g');

    useEffect(() => {
        if (show && produto) {
            // Se o produto já tiver esses dados salvos, carregamos aqui.
            setServing(produto.ifood_serving || 'NOT_APPLICABLE');
            setPeso(produto.peso || '0');
            setUnidadePeso(produto.unidade || 'g');
            // Vamos supor que as restrições vêm como um array de strings ou string separada por vírgula
            setRestricoes(produto.ifood_restricoes ? produto.ifood_restricoes.split(',') : []);
        }
    }, [show, produto]);

    const toggleRestricao = (tag) => {
        if (restricoes.includes(tag)) {
            setRestricoes(restricoes.filter(r => r !== tag));
        } else {
            setRestricoes([...restricoes, tag]);
        }
    };

    const handleSave = () => {
        const dadosAtualizados = {
            ifood_serving: serving,
            peso: Number(peso),
            unidade: unidadePeso,
            ifood_restricoes: restricoes.join(',') // Salva como "VEGAN,GLUTEN_FREE" no banco
        };
        onSave(produto.id_produto, dadosAtualizados);
    };

    // Lista de Tags baseada no print do iFood
    const tagsAlimentares = [
        { id: 'VEGAN', icon: '🌱', label: 'Vegano' },
        { id: 'VEGETARIAN', icon: '🥚', label: 'Vegetariano' },
        { id: 'ORGANIC', icon: '🌿', label: 'Orgânico' },
        { id: 'SUGAR_FREE', icon: '🚫', label: 'Sem açúcar' },
        { id: 'LACTOSE_FREE', icon: '🥛', label: 'Sem lactose' },
        { id: 'GLUTEN_FREE', icon: '🌾', label: 'Sem glúten' }
    ];

    const tagsBebidas = [
        { id: 'COLD_DRINK', icon: '❄️', label: 'Bebida gelada' },
        { id: 'ALCOHOLIC', icon: '🍾', label: 'Bebida alcoólica' },
        { id: 'NATURAL', icon: '🍹', label: 'Natural' }
    ];

    const renderTagButton = (tag) => {
        const isAtivo = restricoes.includes(tag.id);
        return (
            <Button
                key={tag.id}
                variant={isAtivo ? "primary" : "outline-secondary"}
                className={`rounded-pill px-3 py-2 me-2 mb-2 border-light-subtle fw-medium ${!isAtivo ? 'bg-white ifood-text-secondary' : 'shadow-sm'}`}
                onClick={() => toggleRestricao(tag.id)}
            >
                <span className="me-2">{tag.icon}</span> {tag.label}
            </Button>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered contentClassName="modal-dark-fix border-0 shadow-lg">
            <Modal.Header closeButton className="border-bottom border-light-subtle py-3 px-4">
                <Modal.Title className="ifood-text-primary fw-bold">Detalhes do Item no iFood</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                
                {/* RESTRIÇÕES ALIMENTARES */}
                <div className="bg-white p-4 rounded-4 shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <h6 className="fw-bold ifood-text-primary mb-1">RESTRIÇÕES ALIMENTARES</h6>
                    <p className="small ifood-text-secondary mb-3">Informe se seu produto é adequado a restrições alimentares e ajude seus clientes a encontrá-lo</p>
                    <div className="d-flex flex-wrap">
                        {tagsAlimentares.map(renderTagButton)}
                    </div>
                </div>

                {/* EM CASO DE BEBIDAS */}
                <div className="bg-white p-4 rounded-4 shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <h6 className="fw-bold ifood-text-primary mb-3">EM CASO DE BEBIDAS</h6>
                    <div className="d-flex flex-wrap">
                        {tagsBebidas.map(renderTagButton)}
                    </div>
                </div>

                {/* TAMANHO DO ITEM */}
                <div className="bg-white p-4 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <h6 className="fw-bold ifood-text-primary mb-1">TAMANHO DO ITEM</h6>
                    <p className="small ifood-text-secondary mb-3">Dê mais detalhes para que o cliente possa planejar a refeição</p>
                    
                    <Row className="g-3 align-items-end">
                        <Col md={6}>
                            <Form.Label className="ifood-text-secondary fw-bold small">Serve até</Form.Label>
                            <Form.Select className="form-dark-fix rounded-3" value={serving} onChange={(e) => setServing(e.target.value)}>
                                <option value="NOT_APPLICABLE">Não se aplica</option>
                                <option value="SERVES_1">1 pessoa</option>
                                <option value="SERVES_2">2 pessoas</option>
                                <option value="SERVES_3">3 pessoas</option>
                                <option value="SERVES_4">4 pessoas</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="ifood-text-secondary fw-bold small">Peso/Volume</Form.Label>
                            <Form.Control type="number" min="0" className="form-dark-fix rounded-3" value={peso} onChange={(e) => setPeso(e.target.value)} />
                        </Col>
                        <Col md={3}>
                            <Form.Select className="form-dark-fix rounded-3" value={unidadePeso} onChange={(e) => setUnidadePeso(e.target.value)}>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">L</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </div>

            </Modal.Body>
            <Modal.Footer className="border-top border-light-subtle py-3 px-4" style={{ backgroundColor: 'var(--bg-main)' }}>
                <Button variant="secondary" className="rounded-3 px-4" onClick={onHide}>Cancelar</Button>
                <Button variant="success" className="rounded-3 px-4 fw-bold" onClick={handleSave}>Salvar e Sincronizar</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default IfoodEditModal;