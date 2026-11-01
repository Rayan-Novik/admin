import React, { useState, useEffect } from 'react';
import { getHistoricoVendas, emitirNotaFiscalVendaPdv, getPdvConfig } from './pdvService';
import {
    Search,
    Receipt,
    RefreshCw,
    Printer,
    FileText,
    ShieldCheck,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import EmissorNotaPedido from '../../EmissorNotaPedido';

export default function SalesHistory() {
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [vendaSelecionada, setVendaSelecionada] = useState(null);
    const [emitindoId, setEmitindoId] = useState(null);

    useEffect(() => {
        carregarVendas();
    }, []);

    const carregarVendas = async () => {
        setLoading(true);
        try {
            const data = await getHistoricoVendas();
            setVendas(data || []);
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
        } finally {
            setLoading(false);
        }
    };

    const vendasFiltradas = vendas.filter(v =>
        String(v.id_pedido).includes(filtro) ||
        (v.usuarios?.nome_completo || 'Consumidor').toLowerCase().includes(filtro.toLowerCase()) ||
        (v.fiscal_nota?.chave_acesso || '').includes(filtro)
    );

    const formatBRL = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

    const handlePrintThermal = (venda) => {
        setVendaSelecionada(venda);
        setTimeout(() => window.print(), 200);
    };

    const handleAbrirDanfe = async (notaId) => {
        if (!notaId) return;
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<div style="font-family:sans-serif;padding:24px;text-align:center;">Carregando DANFCE / DANFE...</div>');
        }
        try {
            const response = await api.get(`/fiscal/notas/${notaId}/pdf`, { responseType: 'blob' });
            const contentType = response.headers?.['content-type'] || '';
            if (contentType.includes('application/pdf')) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                if (pdfWindow) pdfWindow.location.href = blobUrl;
                return;
            }
            const text = await response.data.text();
            const data = JSON.parse(text);
            const urlPdf = data.url || data.pdf_url || data.link || data.danfe_url;
            const base64Pdf = data.base64 || data.pdf_base64 || data.danfe_base64;
            if (urlPdf && pdfWindow) pdfWindow.location.href = urlPdf;
            else if (base64Pdf && pdfWindow) pdfWindow.location.href = `data:application/pdf;base64,${base64Pdf}`;
            else if (pdfWindow) pdfWindow.close();
        } catch (err) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao abrir PDF da Nota Fiscal.');
        }
    };

    const handleEmitirFiscalRapido = async (venda, tipo = 'NFCE') => {
        setEmitindoId(venda.id_pedido);
        try {
            const pdvConfig = getPdvConfig();
            const res = await emitirNotaFiscalVendaPdv(venda.id_pedido, {
                tipo_documento_fiscal: tipo,
                cenario_id: pdvConfig.cenario_id || undefined,
                ambiente_fiscal: pdvConfig.ambiente_fiscal || undefined
            });
            if (res.fiscal?.success && res.fiscal?.status === 'AUTORIZADA') {
                toast.success(`${tipo} #${res.fiscal.numero} autorizada na SEFAZ!`);
            } else {
                toast.warning(res.fiscal?.motivo_sefaz || 'Nota processada, verifique o status.');
            }
            await carregarVendas();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Erro ao emitir nota fiscal.');
        } finally {
            setEmitindoId(null);
        }
    };

    const renderBadgeFiscal = (venda) => {
        const fn = venda.fiscal_nota;
        const nfLegado = venda.nota_fiscal;

        if (fn && fn.status === 'AUTORIZADA') {
            return (
                <Badge bg="success" className="rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1">
                    <ShieldCheck size={12} /> {fn.tipo} #{fn.numero}
                </Badge>
            );
        }
        if (fn && fn.status === 'REJEITADA') {
            return (
                <Badge bg="danger" className="rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" title={fn.motivo_sefaz}>
                    <AlertTriangle size={12} /> Rejeitada SEFAZ
                </Badge>
            );
        }
        if (nfLegado && nfLegado.status === 'AUTORIZADA') {
            return (
                <Badge bg="success" className="rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1">
                    <ShieldCheck size={12} /> {nfLegado.tipo} #{nfLegado.numero}
                </Badge>
            );
        }
        return (
            <Badge bg="secondary" className="bg-opacity-25 text-secondary border rounded-pill px-2 py-1">
                Não Fiscal (Recibo)
            </Badge>
        );
    };

    return (
        <div className="h-100 d-flex flex-column">
            {/* Cabeçalho */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 d-print-none">
                <div>
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Receipt size={20} className="text-primary" /> Histórico de Vendas do PDV (F6)
                    </h5>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        Consulte vendas realizadas, reimprima recibos térmicos ou emita NFC-e / NF-e com 1 clique
                    </small>
                </div>

                <div className="d-flex gap-2">
                    <div className="input-group shadow-sm rounded-3 overflow-hidden" style={{ maxWidth: '300px' }}>
                        <span className="input-group-text border-end-0" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            placeholder="Buscar Pedido, Cliente ou Chave..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={carregarVendas}
                        className="btn btn-light border rounded-3 shadow-sm"
                        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        title="Atualizar histórico"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Tabela de Vendas */}
            <div
                className="flex-grow-1 overflow-auto rounded-4 shadow-sm border d-print-none"
                style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
            >
                <table className="table table-hover mb-0 align-middle" style={{ color: 'var(--text-primary)' }}>
                    <thead className="sticky-top" style={{ backgroundColor: 'var(--bg-main)' }}>
                        <tr style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <th className="py-3 ps-4">Pedido</th>
                            <th>Data / Hora</th>
                            <th>Cliente</th>
                            <th>Pagamento</th>
                            <th>Status Fiscal</th>
                            <th className="text-end">Total</th>
                            <th className="text-center pe-4">Ações Rápidas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5">
                                    <Spinner size="sm" className="text-primary me-2" /> Carregando histórico...
                                </td>
                            </tr>
                        ) : vendasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5 text-muted">
                                    Nenhuma venda encontrada.
                                </td>
                            </tr>
                        ) : (
                            vendasFiltradas.map((venda) => {
                                const fn = venda.fiscal_nota;
                                const isAutorizada = fn?.status === 'AUTORIZADA';
                                const isEmitindo = emitindoId === venda.id_pedido;

                                return (
                                    <tr key={venda.id_pedido}>
                                        <td className="ps-4 fw-bold text-primary">#{venda.id_pedido}</td>
                                        <td className="small text-muted">
                                            {new Date(venda.data_pedido).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                            <span className="small fw-semibold text-uppercase">
                                                {venda.usuarios?.nome_completo || 'CONSUMIDOR FINAL'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge bg-light text-dark border fw-semibold">
                                                {venda.metodo_pagamento?.replace('_', ' ') || 'DINHEIRO'}
                                            </span>
                                        </td>
                                        <td>{renderBadgeFiscal(venda)}</td>
                                        <td className="text-end fw-bold text-success">
                                            {formatBRL(venda.preco_total)}
                                        </td>
                                        <td className="text-center pe-4">
                                            <div className="d-flex justify-content-center gap-1 flex-wrap">
                                                {isAutorizada ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1 fw-semibold"
                                                        onClick={() => handleAbrirDanfe(fn.id)}
                                                        title="Abrir DANFCE / DANFE em PDF"
                                                    >
                                                        <ExternalLink size={13} /> DANFCE
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={isEmitindo}
                                                        className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1 fw-semibold"
                                                        onClick={() => handleEmitirFiscalRapido(venda, 'NFCE')}
                                                        title="Emitir Cupom Fiscal NFC-e para esta venda"
                                                    >
                                                        {isEmitindo ? <Spinner size="sm" /> : <ShieldCheck size={13} />}
                                                        Emitir NFC-e
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary rounded-pill px-2"
                                                    onClick={() => handlePrintThermal(venda)}
                                                    title="Imprimir Recibo Não Fiscal (Térmica)"
                                                >
                                                    <Printer size={14} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                                    onClick={() => setVendaSelecionada(venda)}
                                                >
                                                    <FileText size={13} /> Detalhes
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Detalhes e Faturamento */}
            {vendaSelecionada && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 position-relative overflow-hidden" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                            <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center d-print-none" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                                <h5 className="mb-0 fw-bold text-primary d-flex align-items-center gap-2">
                                    <Receipt size={20} /> Pedido #{vendaSelecionada.id_pedido}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setVendaSelecionada(null)}></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="d-print-none">
                                    <EmissorNotaPedido
                                        idPedido={vendaSelecionada.id_pedido}
                                        notaInicial={vendaSelecionada.notas_fiscais || vendaSelecionada.nota_fiscal || []}
                                    />

                                    <hr className="my-4 border-secondary opacity-25" />

                                    <div className="d-flex justify-content-between align-items-center p-3 border rounded-4 shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                                        <div>
                                            <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Recibo Interno (Não Fiscal)</h6>
                                            <span className="text-muted small">Impressão térmica 80mm para conferência no balcão</span>
                                        </div>
                                        <button className="btn btn-dark rounded-3 d-flex align-items-center gap-2" onClick={() => window.print()}>
                                            <Printer size={18} /> Imprimir Recibo
                                        </button>
                                    </div>
                                </div>

                                {/* Área Oculta para Impressão Térmica */}
                                <div className="d-none d-print-block font-monospace" id="printable-area" style={{ width: '80mm', color: '#000', fontSize: '11px', lineHeight: '1.2' }}>
                                    <div className="text-center mb-3">
                                        <h6 className="fw-bold text-uppercase mb-0">CUPOM NÃO FISCAL</h6>
                                        <small>Comprovante de Venda PDV</small>
                                    </div>

                                    <div className="text-start border-top border-bottom border-dark border-opacity-25 py-2 my-2">
                                        <div className="d-flex justify-content-between">
                                            <span>DATA:</span>
                                            <span>{new Date(vendaSelecionada.data_pedido).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span>PEDIDO:</span>
                                            <span>#{vendaSelecionada.id_pedido}</span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span>CLIENTE:</span>
                                            <span className="text-truncate" style={{ maxWidth: '130px' }}>
                                                {vendaSelecionada.usuarios?.nome_completo?.substring(0, 18) || 'CONSUMIDOR'}
                                            </span>
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', fontSize: '11px' }} className="mb-2">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', borderBottom: '1px dashed #000' }}>ITEM</th>
                                                <th style={{ textAlign: 'center', width: '30px', borderBottom: '1px dashed #000' }}>QTD</th>
                                                <th style={{ textAlign: 'right', borderBottom: '1px dashed #000' }}>TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendaSelecionada.pedido_items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ paddingTop: '4px' }}>{String(item.nome || '').substring(0, 18)}</td>
                                                    <td style={{ textAlign: 'center', paddingTop: '4px' }}>{Number(item.quantidade)}</td>
                                                    <td style={{ textAlign: 'right', paddingTop: '4px' }}>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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