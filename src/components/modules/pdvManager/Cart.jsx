import React from 'react';
import { Trash2, ShoppingCart, Minus, Plus, User, ShieldCheck, FileText, XCircle } from 'lucide-react';
import { Badge } from 'react-bootstrap';

export default function Cart({
    cart,
    onUpdateQuantity,
    onRemove,
    onClearCart,
    onCheckout,
    isMobile,
    clienteSelecionado,
    onOpenClienteModal,
    onClearCliente,
    cpfCnpjNota = '',
    onChangeCpfCnpjNota,
    pdvConfig,
    onToggleFiscalMode
}) {
    const total = cart.reduce((acc, item) => acc + (Number(item.preco) * (Number(item.quantidade) || 0)), 0);
    const totalItens = cart.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
    const UNIDADES_FRACIONADAS = ['KG', 'M', 'L', 'ML', 'M2', 'G', 'CM'];
    const isDecimal = (unidade) => UNIDADES_FRACIONADAS.includes(unidade);

    const isFiscal = pdvConfig?.modo_fiscal && pdvConfig.modo_fiscal !== 'NAO_FISCAL';

    const handleManualInput = (e, item) => {
        const value = e.target.value;
        if (value === '') { onUpdateQuantity(item.id_produto, ''); return; }
        if (!isDecimal(item.unidade) && (value.includes('.') || value.includes(','))) return;
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) onUpdateQuantity(item.id_produto, value);
    };

    const handleBlur = (item) => {
        const val = Number(item.quantidade);
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

    const formatCpfCnpj = (val = '') => {
        const digits = String(val).replace(/\D/g, '').slice(0, 14);
        if (digits.length <= 11) {
            return digits
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return digits
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    return (
        <div
            className={`d-flex flex-column h-100 ${!isMobile ? 'border-start shadow-sm' : ''}`}
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
        >
            {/* Cabeçalho da Cesta */}
            {!isMobile && (
                <div
                    className="p-3 d-flex align-items-center justify-content-between border-bottom"
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                >
                    <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <ShoppingCart size={20} className="text-primary" />
                        <h6 className="mb-0 fw-bold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '13px' }}>
                            Cupom / Cesta
                        </h6>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        {cart.length > 0 && onClearCart && (
                            <button
                                type="button"
                                onClick={onClearCart}
                                className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0 border-0"
                                style={{ fontSize: '11px' }}
                                title="Limpar todos os itens da cesta"
                            >
                                Limpar
                            </button>
                        )}
                        <Badge
                            bg="primary"
                            className="bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold px-2 py-1 rounded-pill"
                            style={{ fontSize: '11px' }}
                        >
                            {cart.length} {cart.length === 1 ? 'ITEM' : 'ITENS'}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Barra Rápida de Cliente / CPF na Nota */}
            <div
                className="px-3 py-2 border-bottom"
                style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
            >
                {clienteSelecionado ? (
                    <div className="d-flex justify-content-between align-items-center bg-primary bg-opacity-10 rounded-3 px-2 py-1">
                        <div className="d-flex align-items-center gap-2 text-primary fw-bold text-truncate" style={{ fontSize: '12px' }}>
                            <User size={15} />
                            <span className="text-truncate">{clienteSelecionado.nome || clienteSelecionado.nome_completo}</span>
                        </div>
                        {onClearCliente && (
                            <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0 border-0"
                                onClick={onClearCliente}
                                title="Remover cliente"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="d-flex gap-2 align-items-center">
                        {pdvConfig?.pedir_cpf_nota !== false && onChangeCpfCnpjNota && (
                            <div className="input-group input-group-sm flex-grow-1">
                                <span
                                    className="input-group-text border-end-0 fw-bold"
                                    style={{
                                        fontSize: '10px',
                                        backgroundColor: 'var(--bg-main)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    CPF/CNPJ
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-1"
                                    placeholder="CPF na Nota (Opcional)"
                                    style={{
                                        fontSize: '12px',
                                        backgroundColor: 'var(--bg-main)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-primary)',
                                        boxShadow: 'none'
                                    }}
                                    value={formatCpfCnpj(cpfCnpjNota)}
                                    onChange={(e) => onChangeCpfCnpjNota(e.target.value.replace(/\D/g, '').slice(0, 14))}
                                />
                            </div>
                        )}
                        {onOpenClienteModal && (
                            <button
                                type="button"
                                onClick={onOpenClienteModal}
                                className="btn btn-sm border rounded-3 d-flex align-items-center gap-1 fw-semibold text-nowrap"
                                style={{
                                    fontSize: '11px',
                                    backgroundColor: 'var(--bg-main)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)'
                                }}
                                title="Selecionar Cliente Cadastrado (Atalho: F3)"
                            >
                                <User size={13} className="text-primary" /> F3
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Lista de Itens */}
            <div className="flex-grow-1 overflow-auto p-3">
                {cart.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center opacity-50" style={{ color: 'var(--text-secondary)' }}>
                        <ShoppingCart size={48} className="mb-2 stroke-1" />
                        <p className="fw-bold mb-1" style={{ fontSize: '14px' }}>Cesta vazia</p>
                        <small style={{ fontSize: '11px' }}>Clique nos produtos ao lado ou bipe o código de barras</small>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {cart.map((item, idx) => (
                            <div
                                key={item.id_produto}
                                className="border rounded-4 p-2 px-3 shadow-sm"
                                style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <div className="text-truncate pe-2" style={{ maxWidth: '85%' }}>
                                        <span className="text-muted me-1" style={{ fontSize: '10px', fontWeight: 700 }}>
                                            #{idx + 1}
                                        </span>
                                        <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                            {item.nome}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.id_produto)}
                                        className="btn btn-link p-0 text-danger opacity-75 hover-opacity-100 border-0"
                                        title="Remover item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <div
                                        className="btn-group border rounded-pill overflow-hidden"
                                        role="group"
                                        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleChangeQty(item, -1)}
                                            className="btn btn-light border-0 px-2 py-1 d-flex align-items-center"
                                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                                        >
                                            <Minus size={14} />
                                        </button>

                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="form-control border-0 text-center fw-bold px-1 py-0"
                                            style={{
                                                width: '50px',
                                                height: '28px',
                                                boxShadow: 'none',
                                                backgroundColor: 'transparent',
                                                appearance: 'textfield',
                                                color: 'var(--text-primary)',
                                                fontSize: '13.5px'
                                            }}
                                            value={item.quantidade}
                                            onChange={(e) => handleManualInput(e, item)}
                                            onBlur={() => handleBlur(item)}
                                            step={isDecimal(item.unidade) ? '0.001' : '1'}
                                            min="0"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleChangeQty(item, 1)}
                                            className="btn btn-light border-0 px-2 py-1 d-flex align-items-center"
                                            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-end">
                                        <small className="d-block text-muted" style={{ fontSize: '10px' }}>
                                            {Number(item.quantidade)}x R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                        </small>
                                        <span className="fw-bold text-primary" style={{ fontSize: '14.5px' }}>
                                            R$ {(Number(item.preco) * (Number(item.quantidade) || 0)).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rodapé do Caixa */}
            {!isMobile && (
                <div
                    className="p-3 border-top shadow-sm z-2"
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                >
                    {/* Indicador clicável do Modo Fiscal / Não Fiscal */}
                    {onToggleFiscalMode && (
                        <div
                            onClick={onToggleFiscalMode}
                            className={`d-flex align-items-center justify-content-between px-3 py-2 rounded-3 mb-3 cursor-pointer border transition-all ${
                                isFiscal
                                    ? 'bg-success bg-opacity-10 border-success border-opacity-25 text-success'
                                    : 'bg-secondary bg-opacity-10 border-secondary border-opacity-25 text-secondary'
                            }`}
                            title="Clique ou pressione F9 para alternar entre Fiscal e Não Fiscal"
                        >
                            <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '11.5px' }}>
                                {isFiscal ? <ShieldCheck size={16} /> : <FileText size={16} />}
                                <span>
                                    {isFiscal ? `MODO FISCAL (${pdvConfig.modo_fiscal})` : 'MODO NÃO FISCAL (RECIBO)'}
                                </span>
                            </div>
                            <Badge bg={isFiscal ? 'success' : 'secondary'} className="rounded-pill" style={{ fontSize: '9px' }}>
                                F9 Alternar
                            </Badge>
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-baseline mb-3">
                        <div>
                            <span className="text-uppercase fw-bold d-block" style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.8px' }}>
                                Total a Pagar
                            </span>
                            <small className="text-muted" style={{ fontSize: '11px' }}>
                                {totalItens} {totalItens === 1 ? 'volume' : 'volumes'}
                            </small>
                        </div>
                        <div className="fw-bolder text-primary" style={{ fontSize: '1.75rem', lineHeight: '1' }}>
                            <span className="fs-6 me-1" style={{ color: 'var(--text-primary)' }}>R$</span>
                            {total.toFixed(2).replace('.', ',')}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                        className="btn btn-success btn-lg w-100 py-3 rounded-4 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
                        style={{ fontSize: '1rem' }}
                    >
                        <span>FINALIZAR VENDA</span>
                        <Badge bg="light" text="dark" className="ms-1 px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
                            F2
                        </Badge>
                    </button>
                </div>
            )}

            <style>{`
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
}