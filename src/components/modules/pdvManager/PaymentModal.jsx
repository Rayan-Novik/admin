import React, { useState, useEffect } from 'react';
import { realizarVenda } from './pdvService';
import { CreditCard, Banknote, QrCode, Info } from 'lucide-react';

export default function PaymentModal({ isOpen, cart, total, onClose, onFinishSuccess }) {
    const [method, setMethod] = useState('DINHEIRO');
    const [recebido, setRecebido] = useState('');
    const [troco, setTroco] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMethod('DINHEIRO');
            setRecebido('');
            setTroco(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (method === 'DINHEIRO' && recebido) {
            setTroco(Number(recebido) - total);
        } else {
            setTroco(0);
        }
    }, [recebido, method, total]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (method === 'DINHEIRO' && Number(recebido) < total) {
            alert('Valor recebido é menor que o total!');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                itens: cart.map(item => ({
                    id_produto: item.id_produto,
                    quantidade: item.quantidade
                })),
                metodo_pagamento: method,
                valor_recebido: method === 'DINHEIRO' ? Number(recebido) : total
            };

            const result = await realizarVenda(payload);
            onFinishSuccess(result);
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao finalizar venda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    
                    {/* Cabeçalho Estilo PDV */}
                    <div className="modal-header bg-dark text-white border-0 p-4">
                        <div className="w-100">
                            <h4 className="modal-title fw-bold text-uppercase">Pagamento</h4>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <span className="text-secondary small text-uppercase fw-semibold">Total do Cupom</span>
                                <span className="h3 mb-0 fw-bold text-info">R$ {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        {/* Seleção de Método com Botões Grandes (Grid Bootstrap) */}
                        <label className="form-label small fw-bold text-muted text-uppercase mb-3">Selecione o Meio de Pagamento</label>
                        <div className="row g-3 mb-4">
                            <div className="col-4">
                                <button
                                    onClick={() => setMethod('DINHEIRO')}
                                    className={`btn w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-2 shadow-sm border-2 transition-all ${
                                        method === 'DINHEIRO' ? 'btn-primary border-primary' : 'btn-outline-secondary border-light bg-white text-dark'
                                    }`}
                                >
                                    <Banknote size={28} />
                                    <span className="fw-bold small">Dinheiro</span>
                                </button>
                            </div>
                            <div className="col-4">
                                <button
                                    onClick={() => setMethod('PIX')}
                                    className={`btn w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-2 shadow-sm border-2 transition-all ${
                                        method === 'PIX' ? 'btn-primary border-primary' : 'btn-outline-secondary border-light bg-white text-dark'
                                    }`}
                                >
                                    <QrCode size={28} />
                                    <span className="fw-bold small">Pix</span>
                                </button>
                            </div>
                            <div className="col-4">
                                <button
                                    onClick={() => setMethod('CARTAO_CREDITO')}
                                    className={`btn w-100 py-3 rounded-3 d-flex flex-column align-items-center gap-2 shadow-sm border-2 transition-all ${
                                        method === 'CARTAO_CREDITO' ? 'btn-primary border-primary' : 'btn-outline-secondary border-light bg-white text-dark'
                                    }`}
                                >
                                    <CreditCard size={28} />
                                    <span className="fw-bold small">Cartão</span>
                                </button>
                            </div>
                        </div>

                        {/* Área de Valores - Dinheiro */}
                        {method === 'DINHEIRO' && (
                            <div className="card border-0 rounded-4 shadow-sm mb-4">
                                <div className="card-body p-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-muted small text-uppercase">Valor Recebido (R$)</label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-white border-end-0 text-muted fw-bold">R$</span>
                                            <input
                                                type="number"
                                                className="form-control border-start-0 ps-0 fw-bold text-primary"
                                                style={{ fontSize: '1.8rem' }}
                                                autoFocus
                                                placeholder="0,00"
                                                value={recebido}
                                                onChange={(e) => setRecebido(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border">
                                        <span className="fw-bold text-muted">TROCO:</span>
                                        <span className={`h2 mb-0 fw-bold ${troco < 0 ? 'text-danger' : 'text-success'}`}>
                                            R$ {troco.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alertas para PIX/Cartão */}
                        {(method === 'PIX' || method === 'CARTAO_CREDITO') && (
                            <div className="alert alert-warning border-0 rounded-3 shadow-sm d-flex align-items-center gap-3 mb-4" role="alert">
                                <Info size={24} className="flex-shrink-0" />
                                <div className="small fw-semibold">
                                    Confirme o recebimento no terminal (maquininha) ou aplicativo antes de confirmar a venda no sistema.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rodapé de Ações */}
                    <div className="modal-footer border-0 p-4 bg-white shadow-sm">
                        <div className="row w-100 g-3">
                            <div className="col-6">
                                <button
                                    onClick={onClose}
                                    className="btn btn-light btn-lg w-100 py-3 rounded-3 fw-bold text-muted border shadow-sm text-uppercase"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    Cancelar
                                </button>
                            </div>
                            <div className="col-6">
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="btn btn-success btn-lg w-100 py-3 rounded-3 fw-bold shadow text-uppercase"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    ) : 'Finalizar (F2)'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}