import React, { useState, useEffect } from 'react';
import { getHistoricoVendas } from './pdvService';
import { Search, Package, Receipt, RefreshCw, Printer, X, FileText } from 'lucide-react';
// 🟢 IMPORTANTE: Ajuste o caminho abaixo para onde você salvou o EmissorNotaPedido.jsx
import EmissorNotaPedido from '../../EmissorNotaPedido'; 

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

    // Função para imprimir o recibo interno (Não fiscal)
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

            {/* Tabela de Vendas */}
            <div className="flex-grow-1 overflow-auto rounded-3 shadow-sm border bg-white d-print-none">
                <table className="table table-hover mb-0 align-middle">
                    <thead className="bg-light sticky-top">
                        <tr>
                            <th className="py-3 ps-4">Pedido</th>
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
                                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                            onClick={() => setVendaSelecionada(venda)}
                                        >
                                            <FileText size={14} className="me-1"/> Faturamento / Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ========================================================== */}
            {/* 🧾 MODAL DE DETALHES E EMISSÃO FISCAL                      */}
            {/* ========================================================== */}
            {vendaSelecionada && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    {/* Modal um pouco mais largo para acomodar o Emissor */}
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        
                        <div className="modal-content border-0 shadow-lg rounded-4 position-relative overflow-hidden bg-white">
                            
                            {/* Header do Modal */}
                            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light d-print-none">
                                <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                                    <Receipt size={20} /> Pedido #{vendaSelecionada.id_pedido}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setVendaSelecionada(null)}></button>
                            </div>

                            <div className="modal-body p-4 bg-light">
                                
                                {/* 🟢 SESSÃO VISÍVEL NA TELA: O NOSSO EMISSOR DE NOTAS */}
                                <div className="d-print-none">
                                    {/* Aqui injetamos o componente que criamos! Ele já tem todas as regras de negócio */}
                                    <EmissorNotaPedido 
                                        idPedido={vendaSelecionada.id_pedido} 
                                        // Passa o array de notas fiscais se o seu backend 'getHistoricoVendas' fizer o JOIN (include) na tabela notas_fiscais
                                        notaInicial={vendaSelecionada.notas_fiscais || vendaSelecionada.nota_fiscal || []} 
                                    />

                                    <hr className="my-4 border-secondary opacity-25" />
                                    
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-white border rounded shadow-sm">
                                        <div>
                                            <h6 className="fw-bold mb-1">Recibo Interno (Não Fiscal)</h6>
                                            <span className="text-muted small">Para uso no balcão ou conferência</span>
                                        </div>
                                        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={handlePrint}>
                                            <Printer size={18} /> Imprimir Recibo
                                        </button>
                                    </div>
                                </div>

                                {/* 🟢 SESSÃO OCULTA NA TELA (Só aparece na impressão da bobina) */}
                                <div className="d-none d-print-block font-monospace" id="printable-area" style={{ width: '80mm', color: '#000', fontSize: '11px', lineHeight: '1.2' }}>
                                    <div className="text-center mb-3">
                                        <h6 className="fw-bold text-uppercase mb-0">CUPOM NÃO FISCAL</h6>
                                        <small>ArarinhaCloud SaaS</small>
                                    </div>

                                    <div className="text-start border-top border-bottom border-dark border-opacity-25 py-2 my-2">
                                        <div className="d-flex justify-content-between">
                                            <span>DATA:</span>
                                            <span>{new Date(vendaSelecionada.data_pedido).toLocaleString()}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
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

                                    <table style={{width: '100%', fontSize: '11px'}} className="mb-2">
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

                                    <div className="d-flex justify-content-between fw-bold pt-2 border-top border-dark border-dashed">
                                        <span>TOTAL A PAGAR:</span>
                                        <span>{formatBRL(vendaSelecionada.preco_total)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mt-1 mb-3">
                                        <span>PAGAMENTO:</span>
                                        <span className="text-uppercase">{vendaSelecionada.metodo_pagamento}</span>
                                    </div>

                                    <div className="text-center border-top border-dark border-dashed pt-2">
                                        <div className="border border-dark d-inline-block px-2 py-1 fw-bold text-uppercase mb-2" style={{fontSize: '10px'}}>
                                            VENDA PRESENCIAL
                                        </div>
                                        <div className="mt-1" style={{letterSpacing: '2px', fontSize: '9px'}}>
                                            {vendaSelecionada.id_pedido}000123456789
                                        </div>
                                    </div>
                                </div>
                                {/* FIM SESSÃO IMPRESSÃO */}

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estilos Globais para Impressão */}
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body { background: white !important; }
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        padding: 5mm;
                        margin: 0;
                    }
                    .modal { background: white !important; position: absolute; left: 0; top: 0; }
                    .modal-dialog, .modal-content { border: none !important; box-shadow: none !important; margin: 0; width: 100%; max-width: 100%; }
                }
            `}</style>
        </div>
    );
}