import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { Plus, Trash2, Send } from 'lucide-react';

const EmissaoNfePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [emitindo, setEmitindo] = useState(false);

    // Listas Auxiliares da API
    const [estabelecimentos, setEstabelecimentos] = useState([]); // 🟢 NOVO: Filiais Emissoras
    const [destinatarios, setDestinatarios] = useState([]);
    const [cenarios, setCenarios] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [produtos, setProdutos] = useState([]);

    // Estado do Formulário da NF-e
    const [nfeData, setNfeData] = useState({
        estabelecimento_id: '', // 🟢 Resolvendo o erro de undefined
        destinatario_id: '',
        cenario_id: '',
        forma_pagamento_id: '',
        modalidade_frete: 9, // Padrão: 9-Sem Frete
        // 🟢 Campo "ambiente" foi removido daqui!
        apenas_salvar: false,
        contingencia: false
    });

    // Estado dos Itens (Carrinho da Nota)
    const [itens, setItens] = useState([]);
    const [itemAtual, setItemAtual] = useState({ produto_id: '', quantidade: 1, valor_unitario: 0, valor_frete: 0 });

    useEffect(() => {
        const carregarDadosBase = async () => {
            try {
                // 🟢 Busca também os dados da Empresa/Estabelecimento para preencher o ID
                const [resDest, resCen, resPgto, resProd, resEmpresa] = await Promise.all([
                    api.get('/fiscal/destinatarios'),
                    api.get('/fiscal/cenarios'),
                    api.get('/fiscal/formas-pagamento'),
                    api.get('/produtos'), 
                    api.get('/fiscal/empresas') 
                ]);
                
                setDestinatarios(Array.isArray(resDest.data) ? resDest.data : (resDest.data.data || []));
                setCenarios(Array.isArray(resCen.data) ? resCen.data : (resCen.data.data || []));
                setFormasPagamento(Array.isArray(resPgto.data) ? resPgto.data : (resPgto.data.data || []));
                setProdutos(resProd.data);

                // Trata a empresa para pegar o ID do Estabelecimento Emissor
                const empresaData = resEmpresa.data;
                const listaEstabelecimentos = Array.isArray(empresaData) ? empresaData : (empresaData.estabelecimentos || [empresaData]);
                setEstabelecimentos(listaEstabelecimentos);

                // Auto-seleciona o primeiro estabelecimento para evitar o erro "undefined"
                if (listaEstabelecimentos.length > 0 && listaEstabelecimentos[0].id) {
                    setNfeData(prev => ({ ...prev, estabelecimento_id: listaEstabelecimentos[0].id }));
                }

            } catch (error) {
                toast.error("Erro ao carregar dados auxiliares.");
            } finally {
                setLoading(false);
            }
        };
        carregarDadosBase();
    }, []);

    const handleAdicionarItem = () => {
        if (!itemAtual.produto_id || itemAtual.quantidade <= 0) return toast.warning('Selecione um produto e informe a quantidade.');
        
        const produtoSelecionado = produtos.find(p => p.id_fiscal === itemAtual.produto_id || String(p.id_produto) === itemAtual.produto_id);
        
        setItens([...itens, {
            ...itemAtual,
            id_referencia: itemAtual.produto_id,
            nome: produtoSelecionado?.nome || 'Produto',
            valor_total: Number(itemAtual.quantidade) * Number(itemAtual.valor_unitario)
        }]);

        setItemAtual({ produto_id: '', quantidade: 1, valor_unitario: 0, valor_frete: 0 });
    };

    const handleRemoverItem = (index) => {
        const novosItens = [...itens];
        novosItens.splice(index, 1);
        setItens(novosItens);
    };

    const handleProdutoChange = (e) => {
        const val = e.target.value;
        const prod = produtos.find(p => p.id_fiscal === val || String(p.id_produto) === val);
        setItemAtual({
            ...itemAtual,
            produto_id: val,
            valor_unitario: prod ? Number(prod.preco) : 0
        });
    };

    const handleEmitirNfe = async () => {
        if (!nfeData.estabelecimento_id) return toast.warning('A filial emissora não foi identificada no sistema.');
        if (!nfeData.destinatario_id) return toast.warning('Selecione um Destinatário.');
        if (!nfeData.forma_pagamento_id) return toast.warning('Selecione a Forma de Pagamento.');
        if (itens.length === 0) return toast.warning('Adicione ao menos um item à nota.');

        setEmitindo(true);

        const payload = {
            estabelecimento_id: nfeData.estabelecimento_id, // 🟢 Enviando o ID com segurança
            destinatario_id: nfeData.destinatario_id,
            cenario_id: nfeData.cenario_id || undefined, 
            forma_pagamento_id: nfeData.forma_pagamento_id,
            modalidade_frete: Number(nfeData.modalidade_frete),
            // 🟢 Ambiente da Sefaz não é mais enviado para a API
            apenas_salvar: nfeData.apenas_salvar,
            contingencia: nfeData.contingencia,
            itens: itens.map(i => ({
                produto_id: i.produto_id,
                quantidade: Number(i.quantidade),
                valor_unitario: Number(i.valor_unitario),
                valor_frete: Number(i.valor_frete || 0)
            }))
        };

        try {
            const { data } = await api.post('/fiscal/nfe/emitir', payload);
            toast.success(data.mensagem || 'NF-e processada com sucesso!');
            navigate('/admin/notas-fiscais'); // Redireciona de volta para a lista de notas
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao emitir NF-e.');
        } finally {
            setEmitindo(false);
        }
    };

    const totalNota = itens.reduce((acc, curr) => acc + curr.valor_total + Number(curr.valor_frete || 0), 0);
    const flatSelectStyle = { height: '48px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)' };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="container-fluid mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Emissão de NF-e (Mod. 55)</h4>
                    <small className="text-muted">Gere notas de Entrada, Saída, Devolução ou Remessa.</small>
                </div>
            </div>

            <Row className="g-4">
                <Col lg={8}>
                    <div className="bg-white p-4 rounded-4 shadow-sm border mb-4">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-card-heading me-2"></i>Dados Gerais</h6>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="small fw-semibold mb-1">Estabelecimento Emissor</Form.Label>
                                <Form.Select style={flatSelectStyle} value={nfeData.estabelecimento_id} onChange={e => setNfeData({...nfeData, estabelecimento_id: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {estabelecimentos.map(e => <option key={e.id} value={e.id}>{e.razao_social || e.nome || 'Filial Padrão'} - CNPJ: {e.cnpj || 'Não informado'}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Destinatário (Cliente/Fornecedor)</Form.Label>
                                <Form.Select style={flatSelectStyle} value={nfeData.destinatario_id} onChange={e => setNfeData({...nfeData, destinatario_id: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {destinatarios.map(d => <option key={d.id} value={d.id}>{d.razao_social} - {d.cpf_cnpj}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Cenário Fiscal (Opcional)</Form.Label>
                                <Form.Select style={flatSelectStyle} value={nfeData.cenario_id} onChange={e => setNfeData({...nfeData, cenario_id: e.target.value})}>
                                    <option value="">(Automático pelo Motor Fiscal)</option>
                                    {cenarios.filter(c => c.modelo === '55').map(c => <option key={c.id} value={c.id}>{c.operacao}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Forma de Pagamento</Form.Label>
                                <Form.Select style={flatSelectStyle} value={nfeData.forma_pagamento_id} onChange={e => setNfeData({...nfeData, forma_pagamento_id: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.descricao}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-semibold mb-1">Modalidade de Frete</Form.Label>
                                <Form.Select style={flatSelectStyle} value={nfeData.modalidade_frete} onChange={e => setNfeData({...nfeData, modalidade_frete: e.target.value})}>
                                    <option value={9}>9 - Sem Frete</option>
                                    <option value={0}>0 - Por conta do Emitente</option>
                                    <option value={1}>1 - Por conta do Destinatário</option>
                                    <option value={2}>2 - Por conta de Terceiros</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </div>

                    <div className="bg-white p-4 rounded-4 shadow-sm border">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-box-seam me-2"></i>Itens da Nota</h6>
                        
                        <div className="p-3 bg-light rounded-4 mb-3 border">
                            <Row className="g-2 align-items-end">
                                <Col md={5}>
                                    <Form.Label className="small fw-semibold mb-1">Produto</Form.Label>
                                    <Form.Select style={{...flatSelectStyle, height: '40px'}} value={itemAtual.produto_id} onChange={handleProdutoChange}>
                                        <option value="">Buscar produto...</option>
                                        {produtos.map(p => <option key={p.id_produto} value={p.id_fiscal || p.id_produto}>{p.nome}</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Form.Label className="small fw-semibold mb-1">Qtd.</Form.Label>
                                    <CustomInput type="number" value={itemAtual.quantidade} onChange={e => setItemAtual({...itemAtual, quantidade: e.target.value})} />
                                </Col>
                                <Col md={2}>
                                    <Form.Label className="small fw-semibold mb-1">Valor Un.</Form.Label>
                                    <CustomInput type="number" step="0.01" value={itemAtual.valor_unitario} onChange={e => setItemAtual({...itemAtual, valor_unitario: e.target.value})} />
                                </Col>
                                <Col md={2}>
                                    <Form.Label className="small fw-semibold mb-1">Frete R$</Form.Label>
                                    <CustomInput type="number" step="0.01" value={itemAtual.valor_frete} onChange={e => setItemAtual({...itemAtual, valor_frete: e.target.value})} />
                                </Col>
                                <Col md={1}>
                                    <CtaButton className="w-100 px-0" style={{height: '48px'}} onClick={handleAdicionarItem}><Plus size={20}/></CtaButton>
                                </Col>
                            </Row>
                        </div>

                        <Table hover responsive className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="small text-muted border-0">Produto</th>
                                    <th className="small text-muted border-0">Qtd</th>
                                    <th className="small text-muted border-0">Vlr. Unit</th>
                                    <th className="small text-muted border-0">Frete</th>
                                    <th className="small text-muted border-0 text-end">Total</th>
                                    <th className="border-0"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map((it, idx) => (
                                    <tr key={idx}>
                                        <td className="fw-medium">{it.nome}</td>
                                        <td>{it.quantidade}</td>
                                        <td>R$ {Number(it.valor_unitario).toFixed(2)}</td>
                                        <td>R$ {Number(it.valor_frete).toFixed(2)}</td>
                                        <td className="text-end fw-bold">R$ {(it.valor_total + Number(it.valor_frete)).toFixed(2)}</td>
                                        <td className="text-end"><RedButton className="btn-sm px-2 bg-transparent text-danger border-0" onClick={() => handleRemoverItem(idx)}><Trash2 size={16}/></RedButton></td>
                                    </tr>
                                ))}
                                {itens.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted small">Nenhum produto adicionado.</td></tr>}
                            </tbody>
                        </Table>
                    </div>
                </Col>

                <Col lg={4}>
                    <div className="bg-white p-4 rounded-4 shadow-sm border sticky-top" style={{top: '20px'}}>
                        <h6 className="fw-bold text-dark mb-4">Opções de Emissão</h6>

                        {/* 🟢 O seletor de Ambiente da Sefaz foi removido daqui! */}

                        <div className="p-3 bg-light rounded-4 mb-4 border">
                            <Form.Check 
                                type="switch" id="switch-rascunho"
                                label={<span className="small fw-medium">Apenas Salvar Rascunho</span>}
                                checked={nfeData.apenas_salvar}
                                onChange={e => setNfeData({...nfeData, apenas_salvar: e.target.checked})}
                            />
                            <Form.Text className="text-muted" style={{fontSize: '11px'}}>Não transmite para a Sefaz agora.</Form.Text>
                        </div>

                        <hr className="opacity-25" />

                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Subtotal Produtos</span>
                            <span className="fw-medium">R$ {itens.reduce((acc, curr) => acc + curr.valor_total, 0).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="text-muted small">Total Frete</span>
                            <span className="fw-medium">R$ {itens.reduce((acc, curr) => acc + Number(curr.valor_frete || 0), 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-4 mb-4 text-center">
                            <span className="d-block small text-success fw-bold text-uppercase mb-1">Valor Total da Nota</span>
                            <h3 className="text-success fw-black m-0">R$ {totalNota.toFixed(2)}</h3>
                        </div>

                        <CtaButton className="w-100 py-3 fs-6" onClick={handleEmitirNfe} disabled={emitindo}>
                            {emitindo ? <Spinner size="sm" /> : <><Send size={18} className="me-2"/> Transmitir NF-e</>}
                        </CtaButton>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default EmissaoNfePage;