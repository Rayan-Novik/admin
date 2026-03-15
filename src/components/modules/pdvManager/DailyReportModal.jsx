import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPrint, FaCalendarAlt, FaCashRegister, FaSearch } from 'react-icons/fa';
import { listarCaixas, buscarRelatorioCaixa } from './pdvService';

export default function DailyReportModal({ isOpen, onClose }) {
    const [caixas, setCaixas] = useState([]);
    const [selectedCaixaId, setSelectedCaixaId] = useState('');
    const [relatorio, setRelatorio] = useState(null);
    const [loadingList, setLoadingList] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    // 1. Ao abrir o modal, carrega a lista de caixas
    useEffect(() => {
        if (isOpen) {
            loadCaixas();
            setRelatorio(null);
            setSelectedCaixaId('');
        }
    }, [isOpen]);

    const loadCaixas = async () => {
        setLoadingList(true);
        try {
            const data = await listarCaixas();
            setCaixas(data);
            // Seleciona automaticamente o primeiro (mais recente)
            if (data.length > 0) {
                setSelectedCaixaId(data[0].id_caixa);
                handleSelectCaixa(data[0].id_caixa);
            }
        } catch (error) {
            console.error("Erro ao listar caixas:", error);
        } finally {
            setLoadingList(false);
        }
    };

    // 2. Ao selecionar um caixa, busca os dados completos dele
    const handleSelectCaixa = async (id) => {
        setSelectedCaixaId(id);
        setLoadingReport(true);
        try {
            const data = await buscarRelatorioCaixa(id);
            setRelatorio(data);
        } catch (error) {
            console.error("Erro ao carregar relatório:", error);
        } finally {
            setLoadingReport(false);
        }
    };

    // 3. Função de Impressão
    const handlePrint = () => {
        if (!relatorio) return;

        const printWindow = window.open('', '_blank');
        const { info, financeiro, vendas, detalhamento_pagamentos } = relatorio;
        
        // Parse da observação de fechamento
        const closingDetails = info.observacoes && info.observacoes.includes('Detalhes:') 
            ? JSON.parse(info.observacoes.match(/Detalhes: ({.*?})/)?.[1] || '{}') 
            : null;

        const htmlContent = `
            <html>
            <head>
                <title>Relatório Caixa #${info.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
                    .section { margin-bottom: 25px; }
                    .section-title { font-weight: bold; background: #eee; padding: 5px; margin-bottom: 5px; border-left: 5px solid #000; }
                    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 2px 0; }
                    .total-row { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 5px; }
                    th { text-align: left; border-bottom: 1px solid #000; }
                    td { padding: 4px 0; border-bottom: 1px dotted #ccc; }
                    .text-right { text-align: right; }
                    .status-fechado { color: red; font-weight: bold; }
                    .status-aberto { color: green; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin:0">RELATÓRIO DE CAIXA</h2>
                    <div>ID: #${info.id} | Status: ${info.status}</div>
                    <div>Abertura: ${new Date(info.abertura).toLocaleString()}</div>
                    <div>Fechamento: ${info.fechamento ? new Date(info.fechamento).toLocaleString() : '---'}</div>
                    <div>Operador: ${info.operador}</div>
                </div>

                <div class="section">
                    <div class="section-title">1. RESUMO FINANCEIRO</div>
                    <div class="row"><span>Saldo Inicial (Fundo de Troco):</span> <span>R$ ${financeiro.saldo_inicial.toFixed(2)}</span></div>
                    <div class="row"><span>(+) Vendas Totais:</span> <span>R$ ${financeiro.total_vendas.toFixed(2)}</span></div>
                    <div class="row"><span>(+) Suprimentos:</span> <span>R$ ${financeiro.total_suprimentos.toFixed(2)}</span></div>
                    <div class="row"><span>(-) Sangrias:</span> <span>R$ ${financeiro.total_sangrias.toFixed(2)}</span></div>
                    <div class="total-row"><span>(=) SALDO SISTEMA (ESPERADO):</span> <span>R$ ${financeiro.saldo_sistema_calculado.toFixed(2)}</span></div>
                </div>

                <div class="section">
                    <div class="section-title">2. DETALHAMENTO DE VENDAS</div>
                    ${detalhamento_pagamentos.map(p => `
                        <div class="row"><span>${p.metodo.replace('_', ' ')}:</span> <span>R$ ${p.total.toFixed(2)}</span></div>
                    `).join('')}
                </div>

                ${info.status === 'FECHADO' ? `
                <div class="section">
                    <div class="section-title">3. CONFERÊNCIA DE FECHAMENTO</div>
                    ${closingDetails ? `
                        <div class="row"><span>Dinheiro Contado:</span> <span>R$ ${Number(closingDetails.DINHEIRO || 0).toFixed(2)}</span></div>
                        <div class="row"><span>Pix Contado:</span> <span>R$ ${Number(closingDetails.PIX || 0).toFixed(2)}</span></div>
                        <div class="row"><span>Cartão Contado:</span> <span>R$ ${Number(Number(closingDetails.CREDITO||0) + Number(closingDetails.DEBITO||0)).toFixed(2)}</span></div>
                    ` : ''}
                    <div class="total-row"><span>SALDO INFORMADO (GAVETA):</span> <span>R$ ${financeiro.saldo_informado_fechamento.toFixed(2)}</span></div>
                    
                    <div class="total-row" style="margin-top: 10px; font-size: 14px;">
                        <span>DIFERENÇA (QUEBRA/SOBRA):</span> 
                        <span>R$ ${financeiro.quebra_caixa.toFixed(2)}</span>
                    </div>
                    ${financeiro.quebra_caixa !== 0 ? `<div style="font-size:10px; margin-top:5px;">* Valor negativo indica falta de dinheiro (Quebra). Valor positivo indica sobra.</div>` : ''}
                    
                    <div style="margin-top: 10px; border: 1px dashed #000; padding: 5px;">
                        <strong>Observações de Fechamento:</strong><br>
                        ${info.observacoes || 'Nenhuma observação.'}
                    </div>
                </div>
                ` : ''}

                <div class="section">
                    <div class="section-title">4. EXTRATO DE VENDAS (${vendas.length})</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th>Pagamento</th>
                                <th class="text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vendas.map(v => `
                                <tr>
                                    <td>${new Date(v.data_pedido).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                    <td>#${v.id_pedido}</td>
                                    <td>${v.usuarios?.nome_completo?.substring(0,15) || 'Consumidor'}</td>
                                    <td>${v.metodo_pagamento}</td>
                                    <td class="text-right">${Number(v.preco_total).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 40px; text-align: center; border-top: 1px solid #000; padding-top: 5px; width: 200px; margin-left: auto; margin-right: auto;">
                    Visto do Gerente
                </div>
                
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <Modal show={isOpen} onHide={onClose} centered size="md">
            <Modal.Header closeButton>
                <Modal.Title className="h6 fw-bold d-flex align-items-center">
                    <FaPrint className="me-2"/> Central de Relatórios
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* 1. SELEÇÃO DO CAIXA */}
                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small text-muted"><FaCalendarAlt className="me-1"/> Selecione o Período/Caixa</Form.Label>
                    {loadingList ? (
                        <div className="text-center py-2"><Spinner animation="border" size="sm"/> Carregando histórico...</div>
                    ) : (
                        <Form.Select 
                            value={selectedCaixaId} 
                            onChange={(e) => handleSelectCaixa(e.target.value)}
                            className="shadow-sm"
                        >
                            {caixas.map(caixa => (
                                <option key={caixa.id_caixa} value={caixa.id_caixa}>
                                    {new Date(caixa.data_abertura).toLocaleDateString()} - 
                                    {caixa.status === 'ABERTO' ? ' (ABERTO AGORA)' : ` Fechado às ${new Date(caixa.data_fechamento).toLocaleTimeString()}`} 
                                    {caixa.status === 'FECHADO' ? ` [R$ ${Number(caixa.saldo_final).toFixed(2)}]` : ''}
                                </option>
                            ))}
                        </Form.Select>
                    )}
                </Form.Group>

                {/* 2. PREVIEW DOS DADOS */}
                {loadingReport ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary"/>
                        <p className="mt-2 small text-muted">Gerando dados...</p>
                    </div>
                ) : relatorio ? (
                    <div className="bg-light p-3 rounded border">
                        <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                            <span className="small text-muted">Status</span>
                            <Badge bg={relatorio.info.status === 'ABERTO' ? 'success' : 'dark'}>{relatorio.info.status}</Badge>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="small">Vendas Totais</span>
                            <span className="fw-bold text-success">R$ {relatorio.financeiro.total_vendas.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="small">Saldo Esperado</span>
                            <span className="fw-bold">R$ {relatorio.financeiro.saldo_sistema_calculado.toFixed(2)}</span>
                        </div>
                        {relatorio.info.status === 'FECHADO' && (
                            <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                <span className="small fw-bold">Quebra/Sobra</span>
                                <span className={`fw-bold ${relatorio.financeiro.quebra_caixa < 0 ? 'text-danger' : 'text-success'}`}>
                                    R$ {relatorio.financeiro.quebra_caixa.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="mt-3 text-center">
                            <small className="text-muted">{relatorio.vendas.length} vendas registradas neste caixa.</small>
                        </div>
                    </div>
                ) : (
                    <Alert variant="info">Selecione um caixa acima para visualizar.</Alert>
                )}

            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button variant="dark" onClick={handlePrint} disabled={!relatorio || loadingReport}>
                    <FaPrint className="me-2" /> Imprimir Relatório
                </Button>
            </Modal.Footer>
        </Modal>
    );
}