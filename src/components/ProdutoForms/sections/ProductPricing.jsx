import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';

const ProductPricing = ({ formData, handleChange, estoqueOriginal, isCrafting }) => {
    
    // Estado local para a margem
    const [margemInput, setMargemInput] = useState('');

    // Sincroniza a margem local quando os preços mudam externamente (ex: carregamento inicial)
    // MAS ignora se o usuário estiver digitando no campo de margem para não "pular" o cursor
    useEffect(() => {
        const custo = parseFloat(formData.preco_custo) || 0;
        const venda = parseFloat(formData.preco) || 0;
        
        if (venda > 0 && custo > 0) {
            // Cálculo reverso: (Lucro / Custo) * 100 para achar a porcentagem de Markup
            const lucro = venda - custo;
            const markup = ((lucro / custo) * 100).toFixed(1); // Mudamos para base Custo (Markup) que é mais intuitivo para "Lucrar em cima"
            
            if (document.activeElement.name !== 'margem_percentual') {
                setMargemInput(markup);
            }
        } else if (venda === 0) {
            setMargemInput('');
        }
    }, [formData.preco, formData.preco_custo]);

    // 1. Usuário altera a PORCENTAGEM DE LUCRO -> Calcula o PREÇO DE VENDA
    const handleMargemChange = (e) => {
        let novaMargem = e.target.value;
        setMargemInput(novaMargem); // Atualiza o visual imediatamente

        const custo = parseFloat(formData.preco_custo) || 0;
        
        // Removemos a trava de < 100. Agora aceita 100%, 200%, etc.
        if (custo > 0 && novaMargem !== '') {
            const porcentagem = parseFloat(novaMargem);
            
            // Fórmula de Markup: Custo + (Custo * %)
            // Ex: Custo 100 + 50% = 150
            // Ex: Custo 100 + 100% = 200
            const novoPrecoVenda = custo * (1 + (porcentagem / 100));
            
            handleChange({ target: { name: 'preco', value: novoPrecoVenda.toFixed(2) } });
        }
    };

    // 2. Usuário altera o CUSTO -> Recalcula Venda mantendo a Margem atual
    const handleCustoChange = (e) => {
        const novoCusto = parseFloat(e.target.value);
        handleChange(e); // Atualiza o custo no pai

        if (margemInput && !isNaN(margemInput) && novoCusto > 0) {
             const porcentagem = parseFloat(margemInput);
             const novoPrecoVenda = novoCusto * (1 + (porcentagem / 100));
             handleChange({ target: { name: 'preco', value: novoPrecoVenda.toFixed(2) } });
        }
    };

    // 3. Usuário altera o PREÇO DE VENDA -> Recalcula a Margem (Visualmente via useEffect)
    // O handleChange padrão passado via props já cuida de atualizar o 'preco', 
    // e o useEffect lá em cima vai atualizar o 'margemInput' sozinho.

    // --- Cálculos Visuais ---
    const custo = parseFloat(formData.preco_custo) || 0;
    const venda = parseFloat(formData.preco) || 0;
    const lucroReais = venda - custo;
    
    // Verifica se o estoque mudou
    const estoqueAlterado = Number(formData.estoque) !== Number(estoqueOriginal);
    const permiteDecimais = ['KG', 'M', 'L', 'ML', 'G', 'CM', 'M2'].includes(formData.unidade);
    const stepEstoque = permiteDecimais ? "0.001" : "1";

    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 text-secondary">
                    <i className="bi bi-tag-fill me-2"></i>Precificação e Estoque
                </h5>

                {/* --- PREÇOS --- */}
                <Row className="g-3 mb-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold">Preço de Custo</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">R$</InputGroup.Text>
                                <Form.Control 
                                    type='number' 
                                    name="preco_custo" 
                                    step="0.01" 
                                    value={formData.preco_custo} 
                                    onChange={isCrafting ? () => {} : handleCustoChange} 
                                    readOnly={isCrafting}
                                    className={isCrafting ? "bg-light border-start-0" : "border-start-0"}
                                    placeholder="0,00"
                                />
                            </InputGroup>
                            {isCrafting && <Form.Text className="text-muted small">Calculado via receita</Form.Text>}
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold">Lucro Desejado (%)</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type='number' 
                                    name="margem_percentual"
                                    value={margemInput} 
                                    onChange={handleMargemChange}
                                    placeholder="Ex: 100"
                                    className="border-end-0 fw-bold text-primary"
                                />
                                <InputGroup.Text className="bg-white border-start-0 text-primary">%</InputGroup.Text>
                            </InputGroup>
                            <Form.Text className="text-muted small">
                                {custo > 0 && margemInput ? `Adiciona R$ ${(custo * (parseFloat(margemInput)/100)).toFixed(2)} ao custo.` : ''}
                            </Form.Text>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold">Preço de Venda Final</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-success text-white border-success">R$</InputGroup.Text>
                                <Form.Control 
                                    type='number' 
                                    name="preco" 
                                    step="0.01" 
                                    value={formData.preco} 
                                    onChange={handleChange} 
                                    className="fw-bold text-success border-success"
                                    placeholder="0,00"
                                />
                            </InputGroup>
                        </Form.Group>
                    </Col>
                </Row>

                {/* --- CARD DE LUCRO REAL --- */}
                {venda > 0 && (
                    <div className={`p-3 rounded-3 mb-4 border ${lucroReais > 0 ? 'bg-success-subtle border-success-subtle' : 'bg-danger-subtle border-danger-subtle'}`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <small className="text-muted d-block">Lucro Líquido (R$)</small>
                                <span className={`fw-bold fs-5 ${lucroReais > 0 ? 'text-success-emphasis' : 'text-danger'}`}>
                                    R$ {lucroReais.toFixed(2)}
                                </span>
                            </div>
                            <div className="text-end">
                                <small className="text-muted d-block">Resultado</small>
                                <Badge bg={lucroReais > 0 ? 'success' : 'danger'} className="px-3 py-2">
                                    {lucroReais > 0 ? 'Lucrativo' : 'Prejuízo'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                <hr className="text-muted opacity-25 my-4" />

                {/* --- ESTOQUE E UNIDADE --- */}
                <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-box-seam me-2"></i>Controle de Estoque</h6>
                
                <Row className="g-3">
                    <Col xs={4}>
                        <Form.Group>
                            <Form.Label className="small text-muted">Unidade</Form.Label>
                            <Form.Select 
                                name="unidade" 
                                value={formData.unidade || 'UN'} 
                                onChange={handleChange}
                            >
                                <option value="UN">UN</option>
                                <option value="KG">KG</option>
                                <option value="G">G</option>
                                <option value="M">M</option>
                                <option value="CM">CM</option>
                                <option value="L">L</option>
                                <option value="ML">ML</option>
                                <option value="CX">CX</option>
                                <option value="PCT">PCT</option>
                                <option value="M2">M²</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col xs={8}>
                        <Form.Group>
                            <Form.Label className="small text-muted">Quantidade em Estoque</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type='number' 
                                    name="estoque" 
                                    value={formData.estoque} 
                                    onChange={handleChange} 
                                    step={stepEstoque} 
                                    readOnly={isCrafting}
                                    className={estoqueAlterado || isCrafting ? "border-warning bg-warning bg-opacity-10 fw-bold" : ""}
                                />
                                <InputGroup.Text className="text-muted small">{formData.unidade || 'UN'}</InputGroup.Text>
                            </InputGroup>
                            {isCrafting && (
                                <Form.Text className="text-warning small d-block mt-1">
                                    <i className="bi bi-lock-fill me-1"></i> Calculado pela receita.
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

                {/* --- MOTIVO DA ALTERAÇÃO (APARECE SÓ SE MUDAR O ESTOQUE MANUALMENTE) --- */}
                {estoqueAlterado && !isCrafting && (
                    <div className="mt-3 animate__animated animate__fadeIn">
                        <div className="alert alert-warning py-2 px-3 d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <small className="fw-bold">
                                Estoque alterado: {estoqueOriginal} ➝ {formData.estoque}
                            </small>
                        </div>
                        
                        <Form.Group>
                            <Form.Label className="small text-muted fw-bold">Motivo da Alteração (Auditoria)</Form.Label>
                            <Form.Control 
                                type="text"
                                name="motivo_rastreio"
                                value={formData.motivo_rastreio || ''}
                                onChange={handleChange}
                                placeholder="Ex: Entrada de nota fiscal..."
                                required
                                className="border-warning"
                            />
                        </Form.Group>
                    </div>
                )}

            </Card.Body>
        </Card>
    );
};

export default ProductPricing;