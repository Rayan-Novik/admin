import React, { useState, useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Importando nossos componentes universais
import { CustomInput } from '../../ui/SearchInput/SearchInput';
import { GreenSquareButton, RedSquareButton } from '../../ui/buttons/SquareButton';
import { FlatListContainer, FlatListHeader, FlatListItem } from '../../ui/listagem/FlatList';

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

    const selectedProduct = useMemo(() => 
        allProducts.find(p => p.id_produto === Number(selectedId)), 
    [selectedId, allProducts]);

    const availableUnits = useMemo(() => {
        if (!selectedProduct) return [];
        const baseUnit = selectedProduct.unidade || 'UN';
        return UNIT_CONVERSIONS[baseUnit]?.targets || [baseUnit];
    }, [selectedProduct]);

    useEffect(() => {
        if (selectedProduct) setSelectedUnit(availableUnits[0]);
    }, [selectedProduct, availableUnits]);

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
                const costPerBaseUnit = Number(originalProd.preco_custo || 0);
                const costOfItem = costPerBaseUnit * item.quantidade_real;
                totalCost += costOfItem;

                const currentStock = Number(originalProd.estoque || 0);
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

        const baseUnit = selectedProduct.unidade;
        const factor = UNIT_CONVERSIONS[baseUnit]?.factors[selectedUnit] || 1;
        const realQuantity = Number(qty) * factor;

        setComposition(prev => [...prev, {
            id_insumo: selectedProduct.id_produto,
            nome: selectedProduct.nome,
            unidade_estoque: baseUnit,
            unidade_usada: selectedUnit,
            quantidade_usada: Number(qty),
            quantidade_real: realQuantity,
            custo_unitario: Number(selectedProduct.preco_custo || 0)
        }]);

        setSelectedId('');
        setQty(1);
    };

    const handleRemove = (id) => {
        setComposition(prev => prev.filter(i => i.id_insumo !== id));
    };

    const flatSelectStyle = {
        height: '50px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)', color: 'var(--text-secondary, #64748B)',
        fontSize: '14px', boxShadow: 'none'
    };

    return (
        <div className="mb-4 mt-2">
            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-list-check me-2"></i>Receita e Composição
            </h6>
            
            <p className="text-muted small mb-4">
                Adicione insumos para formar este produto. O sistema calculará o custo e abaterá do estoque automaticamente na venda.
            </p>

            {/* ADICIONAR INGREDIENTE */}
            <div className="d-flex flex-column flex-md-row gap-2 mb-4">
                <Form.Select 
                    value={selectedId} 
                    onChange={(e) => setSelectedId(e.target.value)}
                    style={{...flatSelectStyle, flexGrow: 1 }}
                >
                    <option value="">Selecione um ingrediente...</option>
                    {allProducts.map(p => (
                        <option key={p.id_produto} value={p.id_produto}>
                            {p.nome} (Estoque: {Number(p.estoque)} {p.unidade})
                        </option>
                    ))}
                </Form.Select>

                <div style={{ width: '100px', flexShrink: 0 }}>
                    <CustomInput type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="0.001" step="0.001" placeholder="Qtd" />
                </div>

                <Form.Select 
                    style={{...flatSelectStyle, width: '100px', flexShrink: 0 }}
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={!selectedId}
                >
                    {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </Form.Select>

                <GreenSquareButton onClick={handleAdd} disabled={!selectedId} className="flex-shrink-0 w-md-auto">
                    <i className="bi bi-plus-lg fs-5"></i>
                </GreenSquareButton>
            </div>

            {/* 🟢 LISTAGEM FLAT DA RECEITA */}
            <FlatListContainer loading={false} empty={composition.length === 0} emptyMessage="Nenhum ingrediente adicionado à receita." emptyIcon="bi-receipt">
                <FlatListHeader>
                    <div style={{ width: '40%' }}>Ingrediente</div>
                    <div style={{ width: '20%' }}>Qtd Receita</div>
                    <div style={{ width: '20%' }}>Uso no Estoque</div>
                    <div style={{ width: '15%' }}>Custo Estim.</div>
                    <div style={{ width: '5%' }} className="text-end"></div>
                </FlatListHeader>

                {composition.map(item => {
                    const totalItemCost = item.quantidade_real * item.custo_unitario;
                    return (
                        <FlatListItem key={item.id_insumo} className="py-2">
                            <div style={{ width: '40%' }} className="fw-bold mb-1 mb-md-0">
                                {item.nome}
                            </div>
                            <div style={{ width: '20%' }} className="fw-bold mb-1 mb-md-0">
                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Na Receita:</span>
                                {item.quantidade_usada} {item.unidade_usada}
                            </div>
                            <div style={{ width: '20%' }} className="text-muted small mb-1 mb-md-0">
                                <span className="d-inline d-md-none me-1 fw-normal">Uso Real:</span>
                                -{item.quantidade_real} {item.unidade_estoque}
                            </div>
                            <div style={{ width: '15%' }} className="text-success fw-medium mb-2 mb-md-0">
                                <span className="d-inline d-md-none me-1 text-muted fw-normal">Custo:</span>
                                R$ {totalItemCost.toFixed(2)}
                            </div>
                            <div style={{ width: '5%' }} className="text-end">
                                <RedSquareButton size={36} radius={10} onClick={() => handleRemove(item.id_insumo)}>
                                    <i className="bi bi-trash"></i>
                                </RedSquareButton>
                            </div>
                        </FlatListItem>
                    );
                })}
            </FlatListContainer>
        </div>
    );
};

export default ProductRecipe;