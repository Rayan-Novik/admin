import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function DanfeView() {
    const { id } = useParams();
    const [nota, setNota] = useState(null);
    const [lojaInfo, setLojaInfo] = useState({});
    const [tenantInfo, setTenantInfo] = useState({});
    const [appearance, setAppearance] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDados = async () => {
            try {
                // 🟢 CORREÇÃO AQUI: Mudamos de '/fiscal/notas' para '/fiscal/saida'
                const [notasRes, appRes, tenantRes, lojasRes] = await Promise.all([
                    api.get('/fiscal/saida'), 
                    api.get('/configuracoes/appearance').catch(() => ({ data: {} })),
                    api.get('/tenants/info').catch(() => ({ data: {} })),
                    api.get('/lojas').catch(() => ({ data: [] }))
                ]);

                const notaEncontrada = notasRes.data.find(n => n.id_nota === Number(id));
                setNota(notaEncontrada);
                setAppearance(appRes.data || {});
                setTenantInfo(tenantRes.data || {});
                
                if (lojasRes.data && lojasRes.data.length > 0) {
                    setLojaInfo(lojasRes.data[0]); // Pega o endereço da loja principal
                }

            } catch (err) {
                console.error("Erro ao buscar dados do DANFE", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDados();
    }, [id]);

    if (loading) return <div className="p-5 text-center mt-5"><span className="spinner-border text-primary"></span><br/>Gerando DANFE...</div>;
    if (!nota) return <div className="p-5 text-center text-danger fw-bold">Nota Fiscal não encontrada.</div>;

    // ==========================================
    // EXTRAÇÃO DE DADOS (Pedido / Cliente)
    // ==========================================
    const pedido = nota.pedidos || {};
    const cliente = pedido.usuarios || {};
    const itens = pedido.pedido_items || [];
    
    const dataEmissao = new Date(nota.data_emissao).toLocaleDateString('pt-BR');
    const horaEmissao = new Date(nota.data_emissao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // CPF/CNPJ descriptografado
    let documentoCliente = 'Não Informado';
    if (cliente.cpf_criptografado) {
        documentoCliente = cliente.cpf_descriptografado || 'CPF Protegido'; 
    }

    // 🟢 Lógica de Endereço (Prioriza o snapshot salvo no pedido, depois a tabela enderecos)
    const logradouroCli = pedido.entrega_logradouro || pedido.enderecos?.logradouro || 'Endereço não informado';
    const numeroCli = pedido.entrega_numero || pedido.enderecos?.numero || 'S/N';
    const bairroCli = pedido.entrega_bairro || pedido.enderecos?.bairro || 'Centro';
    const municipioCli = pedido.entrega_cidade || pedido.enderecos?.cidade || 'Manaus';
    const ufCli = pedido.entrega_estado || pedido.enderecos?.estado || 'AM';
    const cepCli = pedido.entrega_cep || pedido.enderecos?.cep || '00000-000';
    const telefoneCli = cliente.telefone_descriptografado || 'Não informado';

    // ==========================================
    // EXTRAÇÃO DE DADOS (Emitente / Lojista)
    // ==========================================
    const logoEmitente = appearance.LOGO_URL || null;
    const nomeEmitente = tenantInfo.razao_social || tenantInfo.nome_fantasia || appearance.SITE_TITLE || 'Empresa Emissora';
    const cnpjEmitente = tenantInfo.documento || '00.000.000/0000-00';
    const telefoneEmitente = tenantInfo.telefone_contato || '(00) 0000-0000';
    
    const logradouroLoja = lojaInfo.logradouro ? `${lojaInfo.logradouro}, ${lojaInfo.numero}` : 'Endereço não cadastrado';
    const bairroLoja = lojaInfo.bairro || '';
    const cidadeEstadoLoja = lojaInfo.cidade ? `${lojaInfo.cidade} / ${lojaInfo.estado} - CEP: ${lojaInfo.cep}` : '';

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================
    return (
        <div className="bg-light pb-5 pt-3">
            <div className="container d-flex justify-content-between mb-3 no-print" style={{ maxWidth: '21cm' }}>
                <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
                <button className="btn btn-primary shadow-sm" onClick={() => window.print()}>
                    <i className="bi bi-printer me-2"></i> Imprimir DANFE
                </button>
            </div>

            {/* FOLHA A4 */}
            <div className="danfe-page bg-white mx-auto text-dark" style={{ width: '21cm', minHeight: '29.7cm', padding: '10px 15px', fontFamily: 'Arial, sans-serif' }}>
                
                {/* CANHOTO */}
                <div className="border border-dark mb-2" style={{ borderStyle: 'dashed !important' }}>
                    <div className="row g-0">
                        <div className="col-10 border-end border-dark p-1">
                            <div className="small text-uppercase mb-3" style={{ fontSize: '8px' }}>Recebemos de {nomeEmitente} os produtos e/ou serviços constantes da Nota Fiscal Eletrônica indicada ao lado.</div>
                            <div className="d-flex">
                                <div className="border-end border-dark pe-2 me-2" style={{ width: '25%' }}>
                                    <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Data de Recebimento</div>
                                    <div className="mt-3 border-bottom border-dark"></div>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Identificação e Assinatura do Recebedor</div>
                                    <div className="mt-3 border-bottom border-dark"></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-2 p-1 text-center d-flex flex-column justify-content-center">
                            <h6 className="fw-bold m-0">NF-e</h6>
                            <h5 className="fw-bold m-0">Nº {String(nota.numero_nota || 1).padStart(9, '0')}</h5>
                            <span className="fw-bold" style={{ fontSize: '10px' }}>Série {nota.serie || 1}</span>
                        </div>
                    </div>
                </div>

                <div className="border-bottom border-dark border-dashed my-2"></div>

                {/* QUADRO: EMITENTE E CHAVE */}
                <div className="border border-dark d-flex mb-2 rounded-1">
                    
                    {/* Emitente (COM LOGO DINÂMICA) */}
                    <div className="w-50 border-end border-dark p-2 d-flex flex-row align-items-center">
                        <div className="text-center" style={{ width: '35%' }}>
                            {logoEmitente ? (
                                <img src={logoEmitente} alt="Logo" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div className="fw-bold text-muted border d-flex align-items-center justify-content-center" style={{ height: '50px', fontSize: '10px' }}>SEM LOGO</div>
                            )}
                        </div>
                        <div className="ps-2" style={{ width: '65%', fontSize: '9px', lineHeight: '1.2' }}>
                            <h6 className="fw-bold text-uppercase m-0 mb-1" style={{ fontSize: '11px' }}>{nomeEmitente}</h6>
                            {logradouroLoja}<br />
                            {bairroLoja}<br />
                            {cidadeEstadoLoja}<br />
                            Fone: {telefoneEmitente}
                        </div>
                    </div>

                    {/* Centro DANFE */}
                    <div className="w-25 border-end border-dark p-1 text-center d-flex flex-column justify-content-center">
                        <h5 className="fw-bold m-0">DANFE</h5>
                        <div style={{ fontSize: '9px' }} className="mb-1">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</div>
                        <div className="d-flex justify-content-center align-items-center mb-1">
                            <div className="text-start me-2" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                                0 - ENTRADA<br/>1 - SAÍDA
                            </div>
                            <div className="border border-dark fw-bold px-2 py-1 fs-5">
                                {nota.tipo_nota === 'NFCE' ? '1' : '1'}
                            </div>
                        </div>
                        <h6 className="fw-bold m-0" style={{ fontSize: '13px' }}>Nº {String(nota.numero_nota || 1).padStart(9, '0')}</h6>
                        <span className="fw-bold" style={{ fontSize: '11px' }}>SÉRIE: {nota.serie || 1}</span>
                        <span style={{ fontSize: '9px' }}>Página 1 de 1</span>
                    </div>

                    {/* Chave de Acesso */}
                    <div className="w-50 p-1 d-flex flex-column">
                        <div className="text-uppercase fw-bold" style={{ fontSize: '8px' }}>Controle do Fisco</div>
                        <div className="text-center my-1 border border-dark bg-light" style={{ height: '35px', overflow: 'hidden' }}>
                            {/* Simulação de Código de Barras */}
                            <svg className="w-100 h-100" preserveAspectRatio="none">
                                <rect x="10%" y="10%" width="2%" height="80%" fill="black" />
                                <rect x="13%" y="10%" width="1%" height="80%" fill="black" />
                                <rect x="15%" y="10%" width="3%" height="80%" fill="black" />
                                <rect x="20%" y="10%" width="1%" height="80%" fill="black" />
                                <rect x="23%" y="10%" width="2%" height="80%" fill="black" />
                                <rect x="27%" y="10%" width="4%" height="80%" fill="black" />
                                <rect x="33%" y="10%" width="2%" height="80%" fill="black" />
                                <rect x="36%" y="10%" width="3%" height="80%" fill="black" />
                                <rect x="42%" y="10%" width="1%" height="80%" fill="black" />
                            </svg>
                        </div>
                        <div className="text-uppercase fw-bold" style={{ fontSize: '8px' }}>Chave de Acesso</div>
                        <div className="text-center fw-bold text-break" style={{ fontSize: '11px', letterSpacing: '1px' }}>
                            {nota.chave_acesso ? nota.chave_acesso.replace(/(\d{4})/g, '$1 ') : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000'}
                        </div>
                        <div className="text-center mt-auto" style={{ fontSize: '8px' }}>
                            Consulta de autenticidade no portal nacional da NF-e<br/>www.nfe.fazenda.gov.br/portal
                        </div>
                    </div>
                </div>

                {/* PROTOCOLO E DADOS DA EMPRESA */}
                <div className="border border-dark mb-2 row g-0 rounded-1">
                    <div className="col-5 border-end border-dark p-1">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Natureza da Operação</div>
                        <div className="text-uppercase" style={{ fontSize: '11px' }}>VENDA DE MERCADORIAS</div>
                    </div>
                    <div className="col-7 p-1">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Protocolo de autorização de uso</div>
                        <div style={{ fontSize: '11px' }}>{nota.protocolo_sefaz || 'N/A'} - {dataEmissao} {horaEmissao}</div>
                    </div>
                </div>
                
                <div className="border border-dark mb-2 row g-0 rounded-1">
                    <div className="col-4 border-end border-dark p-1">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Inscrição Estadual</div>
                        <div style={{ fontSize: '11px' }}>ISENTO</div>
                    </div>
                    <div className="col-4 border-end border-dark p-1">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Inscr. Estadual do Subst. Tributário</div>
                        <div style={{ fontSize: '11px' }}></div>
                    </div>
                    <div className="col-4 p-1">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>CNPJ do Emitente</div>
                        <div style={{ fontSize: '11px' }}>{cnpjEmitente.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</div>
                    </div>
                </div>

                {/* DESTINATÁRIO / REMETENTE */}
                <h6 className="fw-bold m-0 mt-2" style={{ fontSize: '10px' }}>DESTINATÁRIO / REMETENTE</h6>
                <div className="border border-dark mb-2 rounded-1">
                    <div className="row g-0 border-bottom border-dark">
                        <div className="col-7 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Nome / Razão Social</div>
                            <div className="fw-bold text-uppercase" style={{ fontSize: '11px' }}>{cliente.nome_completo || 'Consumidor Padrão'}</div>
                        </div>
                        <div className="col-3 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>CNPJ / CPF</div>
                            <div style={{ fontSize: '11px' }}>{documentoCliente}</div>
                        </div>
                        <div className="col-2 p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Data da Emissão</div>
                            <div className="text-end" style={{ fontSize: '11px' }}>{dataEmissao}</div>
                        </div>
                    </div>
                    <div className="row g-0 border-bottom border-dark">
                        <div className="col-5 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Endereço</div>
                            <div className="text-uppercase" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{logradouroCli}, {numeroCli}</div>
                        </div>
                        <div className="col-3 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Bairro / Distrito</div>
                            <div className="text-uppercase" style={{ fontSize: '11px' }}>{bairroCli}</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>CEP</div>
                            <div style={{ fontSize: '11px' }}>{cepCli}</div>
                        </div>
                        <div className="col-2 p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Data da Saída</div>
                            <div className="text-end" style={{ fontSize: '11px' }}>{dataEmissao}</div>
                        </div>
                    </div>
                    <div className="row g-0">
                        <div className="col-5 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Município</div>
                            <div className="text-uppercase" style={{ fontSize: '11px' }}>{municipioCli}</div>
                        </div>
                        <div className="col-3 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Fone / Fax</div>
                            <div style={{ fontSize: '11px' }}>{telefoneCli}</div>
                        </div>
                        <div className="col-1 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>UF</div>
                            <div className="text-center text-uppercase" style={{ fontSize: '11px' }}>{ufCli}</div>
                        </div>
                        <div className="col-1 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Inscr. Est.</div>
                            <div style={{ fontSize: '11px' }}>ISENTO</div>
                        </div>
                        <div className="col-2 p-1">
                            <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Hora da Saída</div>
                            <div className="text-end" style={{ fontSize: '11px' }}>{horaEmissao}</div>
                        </div>
                    </div>
                </div>

                {/* CÁLCULO DO IMPOSTO */}
                <h6 className="fw-bold m-0 mt-2" style={{ fontSize: '10px' }}>CÁLCULO DO IMPOSTO</h6>
                <div className="border border-dark mb-2 rounded-1">
                    <div className="row g-0 border-bottom border-dark text-end">
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Base Calc. ICMS</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Valor do ICMS</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-3 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Base Calc. ICMS Subst.</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Vlr. ICMS Subst.</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-3 p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Valor Total dos Produtos</div>
                            <div className="fw-bold" style={{ fontSize: '11px' }}>{Number(pedido.preco_itens || nota.valor_total).toFixed(2).replace('.', ',')}</div>
                        </div>
                    </div>
                    <div className="row g-0 text-end">
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Valor do Frete</div>
                            <div style={{ fontSize: '11px' }}>{Number(pedido.preco_frete || 0).toFixed(2).replace('.', ',')}</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Valor do Seguro</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Desconto</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-2 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Outras Despesas</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-1 border-end border-dark p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Vlr. IPI</div>
                            <div style={{ fontSize: '11px' }}>0,00</div>
                        </div>
                        <div className="col-3 p-1">
                            <div className="fw-bold text-uppercase text-start" style={{ fontSize: '8px' }}>Valor Total da Nota</div>
                            <div className="fw-bold" style={{ fontSize: '11px' }}>{Number(nota.valor_total).toFixed(2).replace('.', ',')}</div>
                        </div>
                    </div>
                </div>

                {/* DADOS DOS PRODUTOS */}
                <h6 className="fw-bold m-0 mt-3" style={{ fontSize: '10px' }}>DADOS DOS PRODUTOS / SERVIÇOS</h6>
                <div className="border border-dark rounded-1 mb-2" style={{ minHeight: '300px' }}>
                    <table className="table table-sm table-borderless mb-0 w-100" style={{ fontSize: '9px' }}>
                        <thead className="border-bottom border-dark text-start" style={{ fontSize: '8px' }}>
                            <tr>
                                <th className="border-end border-dark">CÓDIGO</th>
                                <th className="border-end border-dark">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                                <th className="border-end border-dark text-center">NCM/SH</th>
                                <th className="border-end border-dark text-center">CST</th>
                                <th className="border-end border-dark text-center">CFOP</th>
                                <th className="border-end border-dark text-center">UN</th>
                                <th className="border-end border-dark text-center">QTD.</th>
                                <th className="border-end border-dark text-end">VLR. UNIT.</th>
                                <th className="border-end border-dark text-end">VLR. TOTAL</th>
                                <th className="border-end border-dark text-end">BC ICMS</th>
                                <th className="border-end border-dark text-end">VLR. ICMS</th>
                                <th className="border-end border-dark text-end">VLR. IPI</th>
                                <th className="border-end border-dark text-end">% ICMS</th>
                                <th className="text-end">% IPI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.length > 0 ? (
                                itens.map((item, index) => (
                                    <tr key={index} className="border-bottom border-light">
                                        <td className="border-end border-dark">{item.id_produto || '001'}</td>
                                        <td className="border-end border-dark fw-bold text-uppercase">{item.nome_produto || item.nome}</td>
                                        <td className="border-end border-dark text-center">00000000</td>
                                        <td className="border-end border-dark text-center">0102</td>
                                        <td className="border-end border-dark text-center">5102</td>
                                        <td className="border-end border-dark text-center text-uppercase">UN</td>
                                        <td className="border-end border-dark text-center">{Number(item.quantidade).toFixed(4).replace('.', ',')}</td>
                                        <td className="border-end border-dark text-end">{Number(item.preco_unitario || item.preco).toFixed(4).replace('.', ',')}</td>
                                        <td className="border-end border-dark text-end">{Number(item.quantidade * (item.preco_unitario || item.preco)).toFixed(2).replace('.', ',')}</td>
                                        <td className="border-end border-dark text-end">0,00</td>
                                        <td className="border-end border-dark text-end">0,00</td>
                                        <td className="border-end border-dark text-end">0,00</td>
                                        <td className="border-end border-dark text-end">0,00</td>
                                        <td className="text-end">0,00</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="14" className="text-center py-4 text-muted">Nenhum produto listado neste pedido.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* DADOS ADICIONAIS */}
                <h6 className="fw-bold m-0 mt-2" style={{ fontSize: '10px' }}>DADOS ADICIONAIS</h6>
                <div className="border border-dark rounded-1 d-flex" style={{ minHeight: '80px' }}>
                    <div className="w-75 border-end border-dark p-2">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Informações Complementares</div>
                        <div style={{ fontSize: '10px' }} className="text-uppercase">
                            DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI.<br/>
                            {pedido.observacoes ? `Obs: ${pedido.observacoes}` : ''}
                        </div>
                    </div>
                    <div className="w-25 p-2">
                        <div className="fw-bold text-uppercase" style={{ fontSize: '8px' }}>Reservado ao Fisco</div>
                    </div>
                </div>

            </div>

            {/* CSS PROTEGIDO PARA IMPRESSÃO PERFEITA */}
            <style>{`
                @media print {
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    body * { visibility: hidden; }
                    .danfe-page, .danfe-page * { visibility: visible; }
                    .danfe-page {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                    }
                    .no-print { display: none !important; }
                    .border-dark { border-color: #000 !important; }
                }
            `}</style>
        </div>
    );
}