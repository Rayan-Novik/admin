import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, InputGroup, Button, Table, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Tabela de Conversão Simples
const UNIT_CONVERSIONS = {
    'KG':  { targets: ['KG', 'G'],       factors: { 'KG': 1, 'G': 0.001 } },
    'G':   { targets: ['G', 'KG'],       factors: { 'G': 1, 'KG': 1000 } },
    'L':   { targets: ['L', 'ML'],       factors: { 'L': 1, 'ML': 0.001 } },
    'ML':  { targets: ['ML', 'L'],       factors: { 'ML': 1, 'L': 1000 } },
    'M':   { targets: ['M', 'CM'],       factors: { 'M': 1, 'CM': 0.01 } },
    'CM':  { targets: ['CM', 'M'],       factors: { 'CM': 1, 'M': 100 } },
    'UN':  { targets: ['UN'],            factors: { 'UN': 1 } }
};

const ProductRecipe = ({ allProducts, composition, setComposition, onUpdateCalculations }) => {
    const [selectedId, setSelectedId] = useState('');
    const [qty, setQty] = useState(1);
    const [selectedUnit, setSelectedUnit] = useState('');

    // Busca o produto selecionado na lista completa
    const selectedProduct = useMemo(() => 
        allProducts.find(p => p.id_produto === Number(selectedId)), 
    [selectedId, allProducts]);

    // Define as unidades disponíveis com base na unidade do estoque do produto
    const availableUnits = useMemo(() => {
        if (!selectedProduct) return [];
        const baseUnit = selectedProduct.unidade || 'UN';
        return UNIT_CONVERSIONS[baseUnit]?.targets || [baseUnit];
    }, [selectedProduct]);

    // Reseta unidade ao trocar produto
    useEffect(() => {
        if (selectedProduct) setSelectedUnit(availableUnits[0]);
    }, [selectedProduct, availableUnits]);

    // ✅ LÓGICA DE CÁLCULO GERAL (Custo e Estoque Potencial)
    // Envia os dados calculados para o Pai sempre que a receita muda
    useEffect(() => {
        let totalCost = 0;
        let minStockPossible = Infinity;

        if (composition.length === 0) {
            onUpdateCalculations(0, 0);
            return;
        }

        composition.forEach(item => {
            const originalProd = allProducts.find(p => p.id_produto === item.id_insumo);
            if (originalProd) {
                // Custo
                const costPerBaseUnit = Number(originalProd.preco_custo || 0);
                const costOfItem = costPerBaseUnit * item.quantidade_real; // quantidade já convertida
                totalCost += costOfItem;

                // Estoque (Gargalo)
                const currentStock = Number(originalProd.estoque || 0);
                // Quantos consigo fazer? (Estoque / Qtd que gasta por item)
                const possible = Math.floor(currentStock / item.quantidade_real);
                if (possible < minStockPossible) minStockPossible = possible;
            }
        });

        onUpdateCalculations(totalCost.toFixed(2), minStockPossible === Infinity ? 0 : minStockPossible);
    // eslint-disable-next-line
    }, [composition, allProducts]);

    const handleAdd = () => {
        if (!selectedProduct || qty <= 0) return;

        if (composition.some(item => item.id_insumo === selectedProduct.id_produto)) {
            toast.warning('Ingrediente já adicionado.');
            return;
        }

        // CALCULA A QUANTIDADE REAL QUE SERÁ BAIXADA DO ESTOQUE
        // Ex: Estoque é KG. Uso é G. Fator é 0.001. 
        // Se usar 500G -> 500 * 0.001 = 0.5 KG debitado do estoque.
        const baseUnit = selectedProduct.unidade;
        const factor = UNIT_CONVERSIONS[baseUnit]?.factors[selectedUnit] || 1;
        const realQuantity = Number(qty) * factor;

        setComposition(prev => [...prev, {
            id_insumo: selectedProduct.id_produto,
            nome: selectedProduct.nome,
            unidade_estoque: baseUnit,
            unidade_usada: selectedUnit,
            quantidade_usada: Number(qty),     // O que aparece na receita (ex: 500 g)
            quantidade_real: realQuantity,     // O que debita do estoque (ex: 0.5 kg)
            custo_unitario: Number(selectedProduct.preco_custo || 0)
        }]);

        setSelectedId('');
        setQty(1);
    };

    const handleRemove = (id) => {
        setComposition(prev => prev.filter(i => i.id_insumo !== id));
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4 border-start border-primary border-4">
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-3 text-primary"><i className="bi bi-list-check me-2"></i>Receita / Composição</h5>
                <p className="text-muted small mb-4">
                    Defina os ingredientes e as quantidades. O sistema converterá automaticamente se as unidades forem compatíveis (Ex: KG para G).
                </p>

                <div className="d-flex flex-column flex-md-row gap-2 mb-3">
                    <Form.Select 
                        value={selectedId} 
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="bg-light flex-grow-1"
                    >
                        <option value="">Selecione um ingrediente...</option>
                        {allProducts.map(p => (
                            <option key={p.id_produto} value={p.id_produto}>
                                {p.nome} (Em estoque: {Number(p.estoque)} {p.unidade})
                            </option>
                        ))}
                    </Form.Select>

                    <InputGroup style={{ maxWidth: '140px' }}>
                        <Form.Control type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="0.001" step="0.001" />
                    </InputGroup>

                    {/* SELETOR DE UNIDADE INTELIGENTE */}
                    <Form.Select 
                        style={{ maxWidth: '100px' }}
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        disabled={!selectedId}
                    >
                        {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>

                    <Button variant="success" onClick={handleAdd} disabled={!selectedId}>
                        <i className="bi bi-plus-lg"></i>
                    </Button>
                </div>

                <Table responsive hover size="sm" className="mb-0 align-middle">
                    <thead className="bg-light text-secondary small">
                        <tr>
                            <th>Ingrediente</th>
                            <th className="text-center">Qtd Receita</th>
                            <th className="text-center">Consumo Real (Estoque)</th>
                            <th className="text-end">Custo Est.</th>
                            <th className="text-end">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {composition.length === 0 ? (
                            <tr><td colSpan="5" className="text-center text-muted py-3">Nenhum ingrediente.</td></tr>
                        ) : (
                            composition.map(item => {
                                const totalItemCost = item.quantidade_real * item.custo_unitario;
                                return (
                                    <tr key={item.id_insumo}>
                                        <td className="fw-medium">{item.nome}</td>
                                        <td className="text-center fw-bold text-primary">
                                            {item.quantidade_usada} {item.unidade_usada}
                                        </td>
                                        <td className="text-center text-muted small">
                                            - {item.quantidade_real} {item.unidade_estoque}
                                        </td>
                                        <td className="text-end text-muted">
                                            R$ {totalItemCost.toFixed(2)}
                                        </td>
                                        <td className="text-end">
                                            <Button variant="link" className="text-danger p-0" onClick={() => handleRemove(item.id_insumo)}>
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default ProductRecipe;