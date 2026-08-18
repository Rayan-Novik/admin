import React from 'react';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Badge } from 'react-bootstrap';

export default function Cart({ cart, onUpdateQuantity, onRemove, onCheckout, isMobile }) {
    const total = cart.reduce((acc, item) => acc + (Number(item.preco) * (Number(item.quantidade) || 0)), 0);
    const UNIDADES_FRACIONADAS = ['KG', 'M', 'L', 'ML', 'M2', 'G', 'CM'];
    const isDecimal = (unidade) => UNIDADES_FRACIONADAS.includes(unidade);

    const handleManualInput = (e, item) => {
        let value = e.target.value;
        if (value === '') { onUpdateQuantity(item.id_produto, ''); return; }
        if (!isDecimal(item.unidade) && (value.includes('.') || value.includes(','))) return; 
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) onUpdateQuantity(item.id_produto, value); 
    };

    const handleBlur = (item) => {
        let val = Number(item.quantidade);
        if (!val || val <= 0) {
            const step = isDecimal(item.unidade) ? 0.100 : 1;
            onUpdateQuantity(item.id_produto, step);
        } else {
            onUpdateQuantity(item.id_produto, !isDecimal(item.unidade) ? Math.round(val) : val);
        }
    };

    const handleChangeQty = (item, change) => {
        const step = isDecimal(item.unidade) ? 0.100 : 1;
        const current = Number(item.quantidade) || 0;
        let next = current + change * step;
        if (next < step) next = step; 
        next = Math.round(next * 1000) / 1000;
        onUpdateQuantity(item.id_produto, next);
    };

    return (
        <div className={`d-flex flex-column h-100 ${!isMobile ? 'border-start shadow' : ''}`} style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            
            {!isMobile && (
                <div className="p-4 d-flex align-items-center justify-content-between border-bottom" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <ShoppingCart size={22} className="text-primary" />
                        <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Cesta</h6>
                    </div>
                    <Badge bg="secondary" className="bg-opacity-10 text-secondary border fw-medium px-3 py-2 rounded-pill" style={{ borderColor: 'var(--border-color)' }}>
                        {cart.length} ITENS
                    </Badge>
                </div>
            )}

            <div className="flex-grow-1 overflow-auto p-3 p-md-4">
                {cart.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                        <ShoppingCart size={56} className="mb-3" />
                        <p className="fw-bold">A cesta está vazia</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {cart.map((item) => (
                            <div key={item.id_produto} className="border rounded-4 p-3 shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="fw-bold text-truncate pe-2 mb-0" style={{ maxWidth: '80%', color: 'var(--text-primary)', fontSize: '14px' }}>
                                        {item.nome}
                                    </h6>
                                    <button onClick={() => onRemove(item.id_produto)} className="btn btn-link p-0 text-danger opacity-75 hover-opacity-100 border-0">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-end mt-3">
                                    <div className="btn-group border rounded-pill overflow-hidden shadow-sm" role="group" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                                        <button onClick={() => handleChangeQty(item, -1)} className="btn btn-light border-0 px-3 py-2 d-flex align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}>
                                            <Minus size={16} />
                                        </button>
                                        
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="form-control border-0 text-center fw-bold px-1"
                                            style={{ width: '60px', boxShadow: 'none', backgroundColor: 'transparent', appearance: 'textfield', color: 'var(--text-primary)', fontSize: '15px' }}
                                            value={item.quantidade}
                                            onChange={(e) => handleManualInput(e, item)}
                                            onBlur={() => handleBlur(item)}
                                            step={isDecimal(item.unidade) ? "0.001" : "1"}
                                            min="0"
                                        />
                                        
                                        <button onClick={() => handleChangeQty(item, 1)} className="btn btn-light border-0 px-3 py-2 d-flex align-items-center" style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className="text-end">
                                        <small className="d-block text-muted" style={{ fontSize: '10px' }}>Unit: R$ {Number(item.preco).toFixed(2)}</small>
                                        <span className="fw-bold text-primary fs-6">R$ {(Number(item.preco) * (Number(item.quantidade) || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rodapé Desktop (Oculto no mobile pela prop isMobile) */}
            {!isMobile && (
                <div className="p-4 border-top shadow-lg z-2" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-uppercase fw-bold" style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Total a Pagar</span>
                        <div className="fw-bold text-primary" style={{ fontSize: '1.75rem', lineHeight: '1' }}>
                            <span className="fs-6 me-1" style={{ color: 'var(--text-primary)' }}>R$</span>{total.toFixed(2)}
                        </div>
                    </div>
                    
                    <button onClick={onCheckout} disabled={cart.length === 0} className="btn btn-success btn-lg w-100 py-3 rounded-4 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 border-0" style={{ fontSize: '1.1rem' }}>
                        FINALIZAR VENDA
                    </button>
                    {cart.length > 0 && (
                        <div className="text-center mt-3">
                            <small className="fw-semibold" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Pressione <Badge bg="secondary" className="bg-opacity-25 text-secondary border px-2 py-1 mx-1" style={{borderColor: 'var(--border-color)'}}>F2</Badge> para pagar</small>
                        </div>
                    )}
                </div>
            )}
            
            <style>{`
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
}