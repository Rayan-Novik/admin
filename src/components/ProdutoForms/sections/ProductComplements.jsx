import React from 'react';
import { Form, Row, Col, Card, Button, InputGroup } from 'react-bootstrap';
import { GreenSquareButton, RedSquareButton } from '../../ui/buttons/SquareButton';
import { CustomInput } from '../../ui/SearchInput/SearchInput';

const ProductComplements = ({ allProducts, groups, setGroups }) => {

    const handleAddGroup = () => {
        setGroups([...groups, { 
            nome: '', 
            minimo: 0, 
            maximo: 1, 
            tipo_grupo: 'CHOICE',
            complementos: [] 
        }]);
    };

    const handleRemoveGroup = (indexToRemove) => {
        setGroups(groups.filter((_, index) => index !== indexToRemove));
    };

    const handleGroupChange = (index, field, value) => {
        const newGroups = [...groups];
        newGroups[index][field] = value;
        setGroups(newGroups);
    };

    const handleAddOption = (groupIndex) => {
        const newGroups = [...groups];
        // 🟢 ADICIONADO: Inicia com Mínimo 0 e Máximo 1 por padrão
        newGroups[groupIndex].complementos.push({ id_produto_add: '', preco_adicional: 0, minimo: 0, maximo: 1 });
        setGroups(newGroups);
    };

    const handleRemoveOption = (groupIndex, optionIndex) => {
        const newGroups = [...groups];
        newGroups[groupIndex].complementos = newGroups[groupIndex].complementos.filter((_, idx) => idx !== optionIndex);
        setGroups(newGroups);
    };

    const handleOptionChange = (groupIndex, optionIndex, field, value) => {
        const newGroups = [...groups];
        newGroups[groupIndex].complementos[optionIndex][field] = value;
        setGroups(newGroups);
    };

    const flatSelectStyle = {
        height: '42px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '10px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)', color: 'var(--text-secondary, #64748B)',
        fontSize: '14px', boxShadow: 'none'
    };

    return (
        <div className="mb-5 mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h6 className="text-uppercase fw-bold mb-1 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <i className="bi bi-ui-radios me-2"></i>Personalização (Estilo iFood)
                    </h6>
                    <p className="text-muted small mb-0">
                        Crie grupos de escolhas para o cliente montar o pedido (Ex: Escolha o Pão, Adicionais, Retirar Ingredientes).
                    </p>
                </div>
                <GreenSquareButton onClick={handleAddGroup} className="flex-shrink-0">
                    <i className="bi bi-plus-lg fs-6"></i> Novo Grupo
                </GreenSquareButton>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-4 border rounded-3 bg-light text-muted opacity-75">
                    <i className="bi bi-grid-1x2 fs-2 mb-2 d-block"></i>
                    <span className="small">Nenhum grupo de personalização criado.</span>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {groups.map((group, gIndex) => (
                        <Card key={gIndex} className="border-0 shadow-sm rounded-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                            <Card.Header className="bg-transparent border-bottom-0 pt-3 pb-0 d-flex justify-content-between">
                                <Form.Control 
                                    type="text" 
                                    placeholder="Nome do Grupo (Ex: Adicionais de Carne)" 
                                    value={group.nome} 
                                    onChange={(e) => handleGroupChange(gIndex, 'nome', e.target.value)}
                                    className="fw-bold border-0 bg-light px-3"
                                    style={{ borderRadius: '10px', maxWidth: '400px' }}
                                />
                                <RedSquareButton size={38} radius={10} onClick={() => handleRemoveGroup(gIndex)} title="Remover Grupo">
                                    <i className="bi bi-trash"></i>
                                </RedSquareButton>
                            </Card.Header>
                            <Card.Body>
                                {/* 🟢 LIMITES DO GRUPO (Pai) */}
                                <div className="bg-light p-2 rounded-3 mb-3 border d-flex gap-3 align-items-center">
                                    <span className="small text-muted fw-bold text-uppercase ms-2" style={{fontSize: '10px'}}>Regras do Grupo:</span>
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Label className="small text-muted mb-0">Mín. Opções:</Form.Label>
                                        <CustomInput type="number" min="0" value={group.minimo} onChange={(e) => handleGroupChange(gIndex, 'minimo', e.target.value)} style={{width: '70px', height: '32px'}} />
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Label className="small text-muted mb-0">Máx. Opções:</Form.Label>
                                        <CustomInput type="number" min="1" value={group.maximo} onChange={(e) => handleGroupChange(gIndex, 'maximo', e.target.value)} style={{width: '70px', height: '32px'}} />
                                    </div>
                                    <div className="ms-auto pe-2">
                                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => handleAddOption(gIndex)}>
                                            <i className="bi bi-plus"></i> Adicionar Opção
                                        </Button>
                                    </div>
                                </div>

                                {/* LISTA DE OPÇÕES DO GRUPO (Filhos) */}
                                <div className="p-3 bg-light rounded-3 border">
                                    {group.complementos.length === 0 ? (
                                        <p className="text-muted small text-center mb-0">Adicione produtos como opção para este grupo.</p>
                                    ) : (
                                        group.complementos.map((option, oIndex) => (
                                            <Row key={oIndex} className="g-2 mb-2 align-items-center bg-white p-2 rounded-3 border mx-0">
                                                <Col md={5}>
                                                    <Form.Select 
                                                        value={option.id_produto_add} 
                                                        onChange={(e) => handleOptionChange(gIndex, oIndex, 'id_produto_add', e.target.value)}
                                                        style={flatSelectStyle}
                                                    >
                                                        <option value="">Selecione o produto...</option>
                                                        {allProducts.map(p => (
                                                            <option key={p.id_produto} value={p.id_produto}>
                                                                {p.nome} (Estoque: {Number(p.estoque)} {p.unidade})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                                
                                                {/* 🟢 NOVOS CAMPOS: Mínimo e Máximo do Item */}
                                                <Col md={2}>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-muted" style={{fontSize: '9px', fontWeight: 'bold'}}>MÍN. DESTE ITEM</span>
                                                        <CustomInput type="number" min="0" value={option.minimo !== undefined ? option.minimo : 0} onChange={(e) => handleOptionChange(gIndex, oIndex, 'minimo', e.target.value)} />
                                                    </div>
                                                </Col>
                                                <Col md={2}>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-muted" style={{fontSize: '9px', fontWeight: 'bold'}}>MÁX. DESTE ITEM</span>
                                                        <CustomInput type="number" min="1" value={option.maximo !== undefined ? option.maximo : 1} onChange={(e) => handleOptionChange(gIndex, oIndex, 'maximo', e.target.value)} />
                                                    </div>
                                                </Col>

                                                <Col md={2}>
                                                    <div className="d-flex flex-column">
                                                        <span className="text-muted" style={{fontSize: '9px', fontWeight: 'bold'}}>PREÇO ADICIONAL</span>
                                                        <InputGroup style={{ height: '42px' }}>
                                                            <InputGroup.Text className="bg-white text-muted border-end-0 px-2" style={{ borderRadius: '10px 0 0 10px', borderColor: 'rgba(100, 116, 139, 0.2)' }}>R$</InputGroup.Text>
                                                            <Form.Control 
                                                                type="number" min="0" step="0.01" placeholder="0.00"
                                                                value={option.preco_adicional} 
                                                                onChange={(e) => handleOptionChange(gIndex, oIndex, 'preco_adicional', e.target.value)}
                                                                className="border-start-0 px-1"
                                                                style={{ borderRadius: '0 10px 10px 0', borderColor: 'rgba(100, 116, 139, 0.2)' }}
                                                            />
                                                        </InputGroup>
                                                    </div>
                                                </Col>
                                                <Col md={1} className="text-end d-flex align-items-end justify-content-end">
                                                    <RedSquareButton size={36} radius={8} onClick={() => handleRemoveOption(gIndex, oIndex)}>
                                                        <i className="bi bi-x"></i>
                                                    </RedSquareButton>
                                                </Col>
                                            </Row>
                                        ))
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductComplements;