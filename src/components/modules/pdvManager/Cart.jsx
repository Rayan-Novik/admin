import React from 'react';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';

export default function Cart({ cart, onUpdateQuantity, onRemove, onCheckout }) {
    
    // Proteção no cálculo do total para caso o usuário esteja digitando e o valor seja vazio/inválido temporariamente
    const total = cart.reduce((acc, item) => acc + (Number(item.preco) * (Number(item.quantidade) || 0)), 0);

    // Lista atualizada conforme seu ENUM do Prisma
    // Unidades que permitem decimais (Ex: 1.5 KG)
    const UNIDADES_FRACIONADAS = ['KG', 'M', 'L', 'ML', 'M2', 'G', 'CM'];

    // Função para determinar o passo de incremento (e validação do input)
    const isDecimal = (unidade) => UNIDADES_FRACIONADAS.includes(unidade);

    // Manipula a digitação manual
    const handleManualInput = (e, item) => {
        let value = e.target.value;

        // Se o usuário apagar tudo, manda string vazia para permitir digitação, 
        // mas o componente pai deve tratar isso ou o onBlur vai corrigir depois
        if (value === '') {
            onUpdateQuantity(item.id_produto, '');
            return;
        }

        // Se a unidade não permite decimal e o usuário digitou ponto/vírgula, ignoramos
        if (!isDecimal(item.unidade) && (value.includes('.') || value.includes(','))) {
            return; 
        }

        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            onUpdateQuantity(item.id_produto, value); // Passa o value como string/number para permitir "0." enquanto digita
        }
    };

    // Quando o usuário sai do campo (Blur), garantimos que o valor é válido
    const handleBlur = (item) => {
        let val = Number(item.quantidade);
        
        // Se for inválido ou 0, reseta para o mínimo (passo)
        if (!val || val <= 0) {
            const step = isDecimal(item.unidade) ? 0.100 : 1;
            onUpdateQuantity(item.id_produto, step);
        } else {
            // Se for unidade inteira, força arredondamento caso tenha passado decimal de alguma forma
            if (!isDecimal(item.unidade)) {
                onUpdateQuantity(item.id_produto, Math.round(val));
            } else {
                // Se for decimal, garante formatação correta no estado final
                onUpdateQuantity(item.id_produto, val);
            }
        }
    };

    // Incremento/Decremento pelos botões
    const handleChangeQty = (item, change) => {
        const step = isDecimal(item.unidade) ? 0.100 : 1;
        const current = Number(item.quantidade) || 0;
        let next = current + change * step;

        if (next < step) next = step; 

        // Arredonda para evitar erros de ponto flutuante do JS (0.300000004)
        next = Math.round(next * 1000) / 1000;

        onUpdateQuantity(item.id_produto, next);
    };

    return (
        <div className="d-flex flex-column h-100 bg-white border-start shadow">
            
            {/* Cabeçalho do Carrinho */}
            <div className="p-3 bg-dark text-white d-flex align-items-center justify-content-between shadow-sm">
                <div className="d-flex align-items-center gap-2">
                    <ShoppingCart size={20} className="text-warning" />
                    <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Cesta de Compras</h6>
                </div>
                <span className="badge rounded-pill bg-secondary px-3 py-2 border border-light border-opacity-25">
                    {cart.length} ITENS
                </span>
            </div>

            {/* Lista de Itens */}
            <div className="flex-grow-1 overflow-auto p-3 bg-light">
                {cart.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50">
                        <ShoppingCart size={64} className="mb-3" />
                        <p className="fw-bold">A cesta está vazia</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {cart.map((item) => (
                            <div key={item.id_produto} className="card border-0 shadow-sm rounded-3 overflow-hidden">
                                <div className="card-body p-2">
                                    <div className="d-flex gap-2">
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <h6 className="card-title mb-0 small fw-bold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                                                    {item.nome}
                                                </h6>
                                                <button 
                                                    onClick={() => onRemove(item.id_produto)}
                                                    className="btn btn-sm p-0 text-danger opacity-75 hover-opacity-100 border-0"
                                                    title="Remover item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="small text-muted mb-2 d-flex justify-content-between">
                                                <span>Unit: R$ {Number(item.preco).toFixed(2)}</span>
                                                <span className="badge bg-light text-dark border">{item.unidade || 'UN'}</span>
                                            </div>

                                            <div className="d-flex align-items-center justify-content-between">
                                                {/* Controles de Quantidade Inteligentes */}
                                                <div className="btn-group shadow-sm border rounded-pill overflow-hidden bg-white align-items-center" role="group">
                                                    <button 
                                                        onClick={() => handleChangeQty(item, -1)}
                                                        className="btn btn-sm btn-light border-0 px-2 py-1 h-100"
                                                    >
                                                        <Minus size={12} className="text-dark" />
                                                    </button>
                                                    
                                                    {/* INPUT EDITÁVEL AQUI */}
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm border-0 text-center fw-bold px-1"
                                                        style={{ 
                                                            width: '60px', 
                                                            boxShadow: 'none', 
                                                            backgroundColor: 'transparent',
                                                            appearance: 'textfield', // Remove setinhas padrão do navegador
                                                            margin: 0
                                                        }}
                                                        value={item.quantidade}
                                                        onChange={(e) => handleManualInput(e, item)}
                                                        onBlur={() => handleBlur(item)}
                                                        step={isDecimal(item.unidade) ? "0.001" : "1"}
                                                        min="0"
                                                    />
                                                    
                                                    <button 
                                                        onClick={() => handleChangeQty(item, 1)}
                                                        className="btn btn-sm btn-light border-0 px-2 py-1 h-100"
                                                    >
                                                        <Plus size={12} className="text-dark" />
                                                    </button>
                                                </div>

                                                {/* Subtotal do Item */}
                                                <span className="fw-bold text-primary">
                                                    R$ {(Number(item.preco) * (Number(item.quantidade) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rodapé: Totais e Botão de Finalizar */}
            <div className="p-4 bg-white border-top shadow-lg rounded-top-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex flex-column">
                        <span className="text-muted small fw-bold text-uppercase">Total a Pagar</span>
                        <div className="h2 mb-0 fw-bold text-primary">
                            <span className="small fs-6 fw-normal me-1 text-dark">R$</span>
                            {total.toFixed(2)}
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="btn btn-success btn-lg w-100 py-3 rounded-3 shadow fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                    style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}
                >
                    FINALIZAR VENDA (F2)
                </button>
                
                {cart.length > 0 && (
                    <div className="text-center mt-3">
                        <small className="text-muted fw-semibold">Pressione <span className="badge bg-light text-dark border">F2</span> para pagar</small>
                    </div>
                )}
            </div>
            
            {/* CSS inline para remover setinhas do input number */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
}