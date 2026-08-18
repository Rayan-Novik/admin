import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function NfceView() {
    const { id } = useParams();
    const [nota, setNota] = useState(null);
    const [lojaInfo, setLojaInfo] = useState({});
    const [tenantInfo, setTenantInfo] = useState({});
    const [appearance, setAppearance] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const [notasRes, appRes, tenantRes, lojasRes] = await Promise.all([
                    api.get('/fiscal/notas'),
                    api.get('/configuracoes/appearance').catch(() => ({ data: {} })),
                    api.get('/tenants/info').catch(() => ({ data: {} })),
                    api.get('/lojas').catch(() => ({ data: [] }))
                ]);

                const notaEncontrada = notasRes.data.find(n => n.id_nota === Number(id));
                setNota(notaEncontrada);
                setAppearance(appRes.data || {});
                setTenantInfo(tenantRes.data || {});
                
                if (lojasRes.data && lojasRes.data.length > 0) {
                    setLojaInfo(lojasRes.data[0]);
                }
            } catch (err) {
                console.error("Erro ao buscar dados da NFC-e", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDados();
    }, [id]);

    if (loading) return <div className="p-5 text-center mt-5">Gerando Cupom NFC-e...</div>;
    if (!nota) return <div className="p-5 text-center text-danger fw-bold">Nota Fiscal não encontrada.</div>;

    // ==========================================
    // EXTRAÇÃO DE DADOS
    // ==========================================
    const pedido = nota.pedidos || {};
    const cliente = pedido.usuarios || {};
    const itens = pedido.pedido_items || [];
    
    const dataEmissao = new Date(nota.data_emissao).toLocaleDateString('pt-BR');
    const horaEmissao = new Date(nota.data_emissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const nomeEmitente = tenantInfo.razao_social || tenantInfo.nome_fantasia || appearance.SITE_TITLE || 'Empresa Emissora';
    const cnpjEmitente = tenantInfo.documento ? tenantInfo.documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : '00.000.000/0000-00';
    
    const logradouroLoja = lojaInfo.logradouro ? `${lojaInfo.logradouro}, ${lojaInfo.numero}` : 'Endereço não cadastrado';
    const bairroLoja = lojaInfo.bairro || '';
    const cidadeLoja = lojaInfo.cidade || '';
    const estadoLoja = lojaInfo.estado || '';

    const documentoCliente = cliente.cpf_descriptografado || cliente.cpf_criptografado || null;

    // ==========================================
    // RENDERIZAÇÃO DO CUPOM (80mm)
    // ==========================================
    return (
        <div className="bg-secondary pb-5 pt-3 d-flex flex-column align-items-center" style={{ minHeight: '100vh' }}>
            
            {/* BOTÕES DE AÇÃO (Não aparecem na impressão) */}
            <div className="d-flex justify-content-between mb-3 no-print w-100" style={{ maxWidth: '300px' }}>
                <button className="btn btn-dark btn-sm shadow-sm" onClick={() => window.history.back()}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
                <button className="btn btn-warning btn-sm shadow-sm fw-bold" onClick={() => window.print()}>
                    <i className="bi bi-printer me-1"></i> Imprimir Cupom
                </button>
            </div>

            {/* BOBINA TÉRMICA (80mm ≈ 300px no navegador) */}
            <div className="nfce-paper bg-white text-dark p-3" style={{ width: '80mm', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', lineHeight: '1.2' }}>
                
                {/* CABEÇALHO DA LOJA */}
                <div className="text-center mb-2">
                    <div className="fw-bold fs-6 text-uppercase">{nomeEmitente}</div>
                    <div>CNPJ: {cnpjEmitente}</div>
                    <div>{logradouroLoja}</div>
                    <div>{bairroLoja} - {cidadeLoja}/{estadoLoja}</div>
                </div>

                <div className="text-center border-top border-bottom border-dark border-dashed py-2 mb-2">
                    <div className="fw-bold">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>
                </div>

                {/* LISTA DE ITENS */}
                <div className="mb-2">
                    <div className="d-flex border-bottom border-dark pb-1 mb-1 fw-bold" style={{ fontSize: '10px' }}>
                        <div style={{ width: '15%' }}>COD</div>
                        <div style={{ width: '45%' }}>DESCRIÇÃO</div>
                        <div style={{ width: '15%' }} className="text-center">QTD</div>
                        <div style={{ width: '25%' }} className="text-end">V.TOTAL</div>
                    </div>
                    
                    {itens.map((item, index) => (
                        <div key={index} className="d-flex flex-wrap mb-1" style={{ fontSize: '11px' }}>
                            <div style={{ width: '15%' }}>{item.id_produto || '001'}</div>
                            <div style={{ width: '85%' }} className="text-uppercase fw-bold text-truncate">{item.nome_produto || item.nome}</div>
                            
                            {/* Linha de baixo do item (Qtd x Valor Unitário = Total) */}
                            <div className="w-100 d-flex justify-content-between text-muted" style={{ paddingLeft: '15%' }}>
                                <div>
                                    {Number(item.quantidade).toFixed(2)} UN x {Number(item.preco_unitario || item.preco).toFixed(2).replace('.', ',')}
                                </div>
                                <div className="text-dark fw-bold">
                                    {Number(item.quantidade * (item.preco_unitario || item.preco)).toFixed(2).replace('.', ',')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TOTAIS */}
                <div className="border-top border-dark border-dashed pt-2 mb-2">
                    <div className="d-flex justify-content-between mb-1">
                        <span>Qtd. Total de Itens</span>
                        <span>{itens.length}</span>
                    </div>
                    {Number(pedido.preco_frete) > 0 && (
                        <div className="d-flex justify-content-between mb-1">
                            <span>Frete / Taxas</span>
                            <span>{Number(pedido.preco_frete).toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold fs-6 mt-1">
                        <span>VALOR TOTAL R$</span>
                        <span>{Number(nota.valor_total).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                        <span>Forma Pagamento</span>
                        <span>Valor Pago R$</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="text-uppercase">{pedido.metodo_pagamento || 'Cartão/Pix'}</span>
                        <span>{Number(nota.valor_total).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>

                {/* CHAVE DE ACESSO & PROTOCOLO */}
                <div className="text-center border-top border-dark border-dashed pt-2 mb-3">
                    <div className="fw-bold mb-1">Consulte pela Chave de Acesso em</div>
                    <div className="text-break" style={{ fontSize: '10px' }}>http://www.sefaz.am.gov.br/nfce/consulta</div>
                    <div className="fw-bold mt-2" style={{ letterSpacing: '1px' }}>
                        {nota.chave_acesso ? nota.chave_acesso.replace(/(\d{4})/g, '$1 ') : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000'}
                    </div>
                </div>

                {/* CONSUMIDOR */}
                <div className="text-center border-top border-dark border-dashed pt-2 mb-3" style={{ fontSize: '11px' }}>
                    <div className="fw-bold text-uppercase">CONSUMIDOR</div>
                    {documentoCliente ? (
                        <>
                            <div>CPF/CNPJ: {documentoCliente}</div>
                            <div className="text-uppercase">{cliente.nome_completo || 'NOME NÃO INFORMADO'}</div>
                        </>
                    ) : (
                        <div>CONSUMIDOR NÃO IDENTIFICADO</div>
                    )}
                </div>

                {/* QR CODE MOCK & INFOS FINAIS */}
                <div className="text-center border-top border-dark border-dashed pt-2">
                    <div className="fw-bold mb-1">NFC-e Nº {nota.numero_nota || 1} Série {nota.serie || 1}</div>
                    <div className="mb-2">{dataEmissao} {horaEmissao}</div>
                    
                    <div className="fw-bold" style={{ fontSize: '10px' }}>Protocolo de Autorização:</div>
                    <div style={{ fontSize: '10px' }}>{nota.protocolo_sefaz || 'Simulação'} - {dataEmissao} {horaEmissao}</div>

                    {/* Simulação de um QR Code (Apenas visual) */}
                    <div className="mt-3 mb-2 mx-auto border border-dark p-1 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                        <i className="bi bi-qr-code text-dark" style={{ fontSize: '80px' }}></i>
                    </div>
                    <div style={{ fontSize: '9px' }}>Consulta via Leitor de QR Code</div>
                </div>

            </div>

            {/* 🟢 O SEGREDO MÁGICO: CSS PARA IMPRESSORA TÉRMICA */}
            <style>{`
                .border-dashed { border-style: dashed !important; border-width: 1px !important; }
                
                @media print {
                    /* Define o tamanho exato da página para o spooler de impressão do Windows */
                    @page { 
                        size: 80mm auto; 
                        margin: 0; 
                    }
                    body {
                        background-color: white !important;
                        margin: 0;
                        padding: 0;
                    }
                    /* Esconde os menus e fundo do sistema */
                    body * { visibility: hidden; }
                    .nfce-paper, .nfce-paper * { visibility: visible; }
                    
                    .nfce-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 5mm !important; /* Margem interna pra não cortar a letra */
                        width: 80mm !important;
                        border: none !important;
                        color: black !important;
                    }
                    
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}