import React, { useState, useEffect } from 'react';
import { getHistoricoVendas } from './pdvService';
import { Search, Package, Receipt, RefreshCw, Printer, X, Calendar } from 'lucide-react';

export default function SalesHistory() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [vendaSelecionada, setVendaSelecionada] = useState(null);

    // Carrega vendas ao montar
    useEffect(() => {
        carregarVendas();
    }, []);

    const carregarVendas = async () => {
        setLoading(true);
        try {
            const data = await getHistoricoVendas();
            setVendas(data || []);
        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
        } finally {
            setLoading(false);
        }
    };

    const vendasFiltradas = vendas.filter(v => 
        String(v.id_pedido).includes(filtro) || 
        (v.usuarios?.nome_completo || 'Consumidor').toLowerCase().includes(filtro.toLowerCase())
    );

    const formatBRL = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    // Função para imprimir
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-100 d-flex flex-column">
            {/* Header da Página */}
            <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
                <h4 className="fw-bold text-uppercase small mb-0 d-flex align-items-center gap-2">
                    <Receipt size={20} className="text-primary"/> Histórico de Vendas
                </h4>
                <div className="d-flex gap-2">
                    <div className="input-group shadow-sm" style={{ maxWidth: '300px' }}>
                        <span className="input-group-text bg-white border-end-0"><Search size={16}/></span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0" 
                            placeholder="Buscar ID ou Cliente..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                    <button onClick={carregarVendas} className="btn btn-light border shadow-sm" title="Atualizar">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Tabela de Vendas (Escondida na impressão) */}
            <div className="flex-grow-1 overflow-auto rounded-3 shadow-sm border bg-white d-print-none">
                <table className="table table-hover mb-0 align-middle">
                    <thead className="bg-light sticky-top">
                        <tr>
                            <th className="py-3 ps-4">Cupom</th>
                            <th>Horário</th>
                            <th>Cliente</th>
                            <th>Pagamento</th>
                            <th className="text-end">Total</th>
                            <th className="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-5">Carregando...</td></tr>
                        ) : vendasFiltradas.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-5 text-muted">Nenhuma venda encontrada.</td></tr>
                        ) : (
                            vendasFiltradas.map((venda) => (
                                <tr key={venda.id_pedido}>
                                    <td className="ps-4 fw-bold text-primary">#{venda.id_pedido}</td>
                                    <td className="small text-muted">
                                        {new Date(venda.data_pedido).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td>
                                        <span className="small fw-semibold text-uppercase">
                                            {venda.usuarios?.nome_completo || 'CONSUMIDOR FINAL'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark border fw-normal">
                                            {venda.metodo_pagamento?.replace('_', ' ') || 'DINHEIRO'}
                                        </span>
                                    </td>
                                    <td className="text-end fw-bold text-success">
                                        {formatBRL(venda.preco_total)}
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            className="btn btn-sm btn-outline-dark rounded-pill px-3"
                                            onClick={() => setVendaSelecionada(venda)}
                                        >
                                            <Receipt size={14} className="me-1"/> Ver Cupom
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ========================================================== */}
            {/* 🧾 MODAL ESTILO CUPOM (IGUAL FINANCIAL AUDIT)              */}
            {/* ========================================================== */}
            {vendaSelecionada && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        
                        <div className="modal-content border-0 shadow-lg rounded-0 position-relative" 
                             style={{ 
                                 backgroundColor: '#fffdf0', // Fundo Creme/Amarelo
                                 fontFamily: '"Courier New", Courier, monospace', // Fonte Monospace
                                 color: '#000'
                             }}>
                            
                            {/* Botão Fechar (Fora do fluxo de impressão) */}
                            <button 
                                type="button" 
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 d-print-none rounded-circle p-1" 
                                style={{zIndex: 10}}
                                onClick={() => setVendaSelecionada(null)}
                            >
                                <X size={16} />
                            </button>

                            <div className="modal-body p-4" id="printable-area">
                                {/* Cabeçalho */}
                                <div className="text-center mb-3">
                                    <h5 className="fw-bold text-uppercase mb-0">CUPOM NÃO FISCAL</h5>
                                    <small className="text-muted">Ararinha E-commerce & Loja</small>
                                </div>

                                {/* Info Básica */}
                                <div className="text-start border-top border-bottom border-dark border-opacity-25 py-3 my-3 small font-monospace">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>DATA:</span>
                                        <span>{new Date(vendaSelecionada.data_pedido).toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>PEDIDO:</span>
                                        <span>#{vendaSelecionada.id_pedido}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>CLIENTE:</span>
                                        <span className="text-truncate" style={{maxWidth: '120px'}}>
                                            {vendaSelecionada.usuarios?.nome_completo.substring(0, 15) || 'CONSUMIDOR'}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabela de Itens */}
                                <div className="border-bottom border-dark border-opacity-25 border-dashed mb-3 pb-2 font-monospace small text-start">
                                    <table style={{width: '100%', fontSize: '11px'}}>
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: 'left', borderBottom: '1px dashed #000'}}>ITEM</th>
                                                <th style={{textAlign: 'center', width: '30px', borderBottom: '1px dashed #000'}}>QTD</th>
                                                <th style={{textAlign: 'right', borderBottom: '1px dashed #000'}}>TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendaSelecionada.pedido_items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{paddingTop: '4px'}}>{item.nome.substring(0, 18)}</td>
                                                    <td style={{textAlign: 'center', paddingTop: '4px'}}>{Number(item.quantidade)}</td>
                                                    <td style={{textAlign: 'right', paddingTop: '4px'}}>
                                                        {formatBRL(Number(item.preco) * Number(item.quantidade))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totais */}
                                <div className="text-start font-monospace mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="fw-bold">SUBTOTAL:</span>
                                        <span className="fw-bold">{formatBRL(vendaSelecionada.preco_total)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-top border-dark border-opacity-25 pt-2 mt-2">
                                        <span className="fw-bold fs-5">TOTAL A PAGAR:</span>
                                        <span className="fw-bold fs-5">{formatBRL(vendaSelecionada.preco_total)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1 text-muted small">
                                        <span>Forma de Pagamento:</span>
                                        <span className="text-uppercase">{vendaSelecionada.metodo_pagamento}</span>
                                    </div>
                                </div>

                                {/* Rodapé */}
                                <div className="mt-4 pt-3 border-top border-dark border-dashed text-center">
                                    <div className="border border-dark d-inline-block px-3 py-1 fw-bold text-uppercase mb-2">
                                        VENDA PRESENCIAL
                                    </div>
                                    <p className="small text-muted mb-0" style={{fontSize: '10px'}}>
                                        Obrigado pela preferência!
                                    </p>
                                    
                                    {/* Código de Barras Fake */}
                                    <div className="mt-3 pt-2 bg-dark" style={{height: '35px', width: '90%', margin: '0 auto', opacity: 0.9}}></div>
                                    <div className="mt-1 font-monospace" style={{letterSpacing: '3px', fontSize: '9px'}}>
                                        {vendaSelecionada.id_pedido}000123456789
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Imprimir */}
                            <div className="modal-footer justify-content-center border-0 pt-0 pb-3 d-print-none bg-light">
                                <button className="btn btn-dark w-100 btn-sm d-flex align-items-center justify-content-center gap-2" onClick={handlePrint}>
                                    <Printer size={16} /> IMPRIMIR CUPOM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estilos Globais para Impressão */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .modal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 0;
                        background: white !important;
                    }
                    .modal-dialog {
                        margin: 0;
                        width: 100%;
                        max-width: 100%;
                    }
                    .modal-content {
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}