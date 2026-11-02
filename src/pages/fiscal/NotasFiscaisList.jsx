import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Spinner, Badge, Dropdown, Offcanvas, Form, Row, Col, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CustomInput } from '../../components/ui/SearchInput/SearchInput';
import { CtaButton, LightButton, RedButton } from '../../components/ui/buttons/CtaButton';
import { MoreVertical, FileText, XCircle, Edit3, RotateCw, List, Copy, Download, Clock, Sliders, CornerUpLeft, PlusCircle, CheckCircle, Calendar, User, Monitor, Search, Filter } from 'lucide-react';

const NotasFiscaisList = () => {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros de Pesquisa e Separação de 65 e 55
    const [filtroModelo, setFiltroModelo] = useState('TODAS'); // 'TODAS' | '65' | '55'
    const [filtroStatus, setFiltroStatus] = useState('TODOS');   // 'TODOS' | 'AUTORIZADA' | 'CANCELADA' | 'REJEITADA'
    const [filtroDia, setFiltroDia] = useState('');              // 'YYYY-MM-DD'
    const [filtroOperador, setFiltroOperador] = useState('');
    const [filtroCaixa, setFiltroCaixa] = useState('');
    const [busca, setBusca] = useState('');

    const [modalAction, setModalAction] = useState({ isOpen: false, tipo: '', notaId: '' });
    const [justificativa, setJustificativa] = useState('');
    const [sequencialCce, setSequencialCce] = useState(1);
    const [processando, setProcessando] = useState(false);

    const [drawerEventos, setDrawerEventos] = useState({ isOpen: false, eventos: [], notaId: '' });

    // Modal de Correção de Impostos (Rascunho / Rejeitada)
    const [modalImpostos, setModalImpostos] = useState({ isOpen: false, nota: null, itens: [] });

    // Modal de Notas Especiais (Devolução, Complementar, Ajuste)
    const [modalEspecial, setModalEspecial] = useState({
        isOpen: false,
        tipo: 'devolucao',
        notaOriginal: null,
        natureza_operacao: 'Devolução de Mercadoria',
        cfop: '5202',
        itens: [],
        valor_complementar: 0,
        icms_base_comp: 0,
        icms_valor_comp: 0,
        descricao_ajuste: 'Ajuste de Escrituração Fiscal'
    });

    const fetchNotas = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/fiscal/notas');
            setNotas(Array.isArray(data) ? data : (data.notas || data.data || []));
        } catch (error) {
            toast.error('Erro ao carregar notas fiscais.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotas(); }, []);

    const handleAcaoFiscal = async () => {
        if (justificativa.length < 15) return toast.warning('A justificativa deve ter no mínimo 15 caracteres.');
        setProcessando(true);
        try {
            if (modalAction.tipo === 'cancelar') {
                await api.post(`/fiscal/notas/${modalAction.notaId}/cancelar`, { justificativa });
                toast.success('Nota cancelada com sucesso!');
            } else if (modalAction.tipo === 'cce') {
                await api.post(`/fiscal/notas/${modalAction.notaId}/cce`, { justificativa, sequencial: Number(sequencialCce) });
                toast.success('Carta de Correção enviada!');
            }
            setModalAction({ isOpen: false, tipo: '', notaId: '' });
            fetchNotas();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao processar solicitação.');
        } finally {
            setProcessando(false);
        }
    };

    const handleReenviar = async (id) => {
        try {
            toast.info('Reenviando nota para a SEFAZ...');
            const { data } = await api.post(`/fiscal/notas/${id}/reenviar`);
            if (data.status === 'AUTORIZADA' || data.success) {
                toast.success('Nota autorizada com sucesso!');
            } else {
                toast.warning(data.motivo || 'Nota processada com aviso.');
            }
            fetchNotas();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao reenviar nota.');
            fetchNotas();
        }
    };

    const handleCorrigirData = async (id) => {
        try {
            await api.post(`/fiscal/notas/${id}/corrigir-data`, {});
            toast.success('Data/hora sincronizada com sucesso! Agora você pode retransmitir.');
            fetchNotas();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao corrigir data da nota.');
        }
    };

    const abrirModalImpostos = (nota) => {
        const itensCopia = (nota.itens || []).map(it => ({
            id: it.id,
            descricao_produto: it.descricao_produto,
            cfop: it.cfop || '5102',
            ncm: it.ncm || '',
            icms_cst_csosn: it.icms_cst_csosn || '102',
            icms_aliquota: Number(it.icms_aliquota || 0),
            pis_cst: it.pis_cst || '49',
            cofins_cst: it.cofins_cst || '49',
            ibs_cst: it.ibs_cst || '000',
            cClassTrib: (it.cClassTrib && it.cClassTrib !== 'null' && it.cClassTrib !== 'undefined') ? it.cClassTrib : (it.ibs_cst === '410' ? '410001' : '000001')
        }));
        setModalImpostos({ isOpen: true, nota, itens: itensCopia });
    };

    const salvarCorrecaoImpostos = async () => {
        setProcessando(true);
        try {
            await api.post(`/fiscal/notas/${modalImpostos.nota.id}/corrigir-impostos`, {
                itens: modalImpostos.itens
            });
            toast.success('Impostos dos itens atualizados! Pronto para retransmitir.');
            setModalImpostos({ isOpen: false, nota: null, itens: [] });
            fetchNotas();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar impostos.');
        } finally {
            setProcessando(false);
        }
    };

    const abrirModalEspecial = (nota, tipo) => {
        const itensDevolucao = (nota.itens || []).map(it => ({
            item_original_id: it.id,
            descricao: it.descricao_produto,
            quantidade_max: Number(it.quantidade),
            quantidade_devolvida: Number(it.quantidade),
            selecionado: true
        }));
        setModalEspecial({
            isOpen: true,
            tipo,
            notaOriginal: nota,
            natureza_operacao: tipo === 'devolucao' ? 'Devolução de Mercadoria' : tipo === 'complementar' ? 'NF-e Complementar' : 'NF-e de Ajuste',
            cfop: tipo === 'devolucao' ? '5202' : '5102',
            itens: itensDevolucao,
            valor_complementar: 0,
            icms_base_comp: 0,
            icms_valor_comp: 0,
            descricao_ajuste: 'Ajuste de Escrituração Fiscal'
        });
    };

    const emitirNotaEspecial = async () => {
        setProcessando(true);
        try {
            const { tipo, notaOriginal, natureza_operacao, cfop, itens, valor_complementar, icms_base_comp, icms_valor_comp, descricao_ajuste } = modalEspecial;
            const payload = {
                nota_original_id: notaOriginal.id,
                natureza_operacao,
                cfop
            };

            if (tipo === 'devolucao') {
                payload.itens_devolucao = itens
                    .filter(i => i.selecionado && Number(i.quantidade_devolvida) > 0)
                    .map(i => ({
                        item_original_id: i.item_original_id,
                        quantidade_devolvida: Number(i.quantidade_devolvida)
                    }));
                if (payload.itens_devolucao.length === 0) {
                    setProcessando(false);
                    return toast.warning('Selecione ao menos 1 item para devolução.');
                }
            } else if (tipo === 'complementar') {
                payload.valor_complementar = Number(valor_complementar);
                payload.icms_base_comp = Number(icms_base_comp);
                payload.icms_valor_comp = Number(icms_valor_comp);
            } else if (tipo === 'ajuste') {
                payload.valor_ajuste = Number(valor_complementar);
                payload.icms_valor_ajuste = Number(icms_valor_comp);
                payload.descricao_item = descricao_ajuste;
            }

            await api.post(`/fiscal/notas/especial/${tipo}`, payload);
            toast.success(`Nota de ${tipo} gerada e processada com sucesso!`);
            setModalEspecial(prev => ({ ...prev, isOpen: false }));
            fetchNotas();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao emitir nota especial.');
        } finally {
            setProcessando(false);
        }
    };

    const handleDownloadPdf = async (id) => {
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) pdfWindow.document.write('Buscando DANFE, aguarde...');

        try {
            toast.info('Gerando PDF...');
            const response = await api.get(`/fiscal/notas/${id}/pdf`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = window.URL.createObjectURL(file);

            if (pdfWindow) {
                pdfWindow.location.href = fileURL;
            } else {
                window.open(fileURL, '_blank');
            }
        } catch (error) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao gerar PDF.');
            console.error('Erro no PDF:', error);
        }
    };

    const baixarXml = (xml, chave) => {
        if (!xml) return toast.warning('XML indisponível no momento.');
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NFe-${chave}.xml`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const openEventos = async (id) => {
        try {
            const { data } = await api.get(`/fiscal/notas/${id}/eventos`);
            setDrawerEventos({ isOpen: true, eventos: Array.isArray(data) ? data : (data.eventos || []), notaId: id });
        } catch (error) {
            toast.error('Erro ao carregar eventos.');
        }
    };

    const getStatusBadge = (status) => {
        const s = String(status || '').toUpperCase();
        if (s.includes('AUTORIZADA') || s.includes('APROVADA')) return <Badge bg="success" className="px-2 py-1 fw-bold"><CheckCircle size={12} className="me-1" />Autorizada</Badge>;
        if (s.includes('CANCELADA')) return <Badge bg="danger" className="px-2.5 py-1 fw-bold"><XCircle size={12} className="me-1" />CANCELADA</Badge>;
        if (s.includes('REJEITADA') || s.includes('ERRO')) return <Badge bg="danger" className="px-2 py-1">Rejeitada</Badge>;
        if (s.includes('RASCUNHO') || s.includes('PENDENTE') || s.includes('PROCESSANDO')) return <Badge bg="warning" text="dark" className="px-2 py-1">{status}</Badge>;
        return <Badge bg="light" text="dark" className="px-2 py-1">{status}</Badge>;
    };

    // Estatísticas para os contadores das abas
    const totalNfce = useMemo(() => notas.filter(n => String(n.modelo) === '65').length, [notas]);
    const totalNfe = useMemo(() => notas.filter(n => String(n.modelo) === '55').length, [notas]);
    const totalCanceladas = useMemo(() => notas.filter(n => String(n.status || n.situacao || '').toUpperCase().includes('CANCELAD')).length, [notas]);

    // Filtragem combinada completa (Modelo 65 vs 55, Status, Dia, Operador, Caixa, Busca)
    const notasFiltradas = useMemo(() => {
        return notas.filter(nota => {
            // 1. Filtro por Modelo (65 vs 55)
            if (filtroModelo !== 'TODAS') {
                if (String(nota.modelo) !== String(filtroModelo)) return false;
            }

            // 2. Filtro por Status
            const st = String(nota.status || nota.situacao || '').toUpperCase();
            if (filtroStatus !== 'TODOS') {
                if (filtroStatus === 'CANCELADA' && !st.includes('CANCELAD')) return false;
                if (filtroStatus === 'AUTORIZADA' && (!st.includes('AUTORIZAD') && !st.includes('APROVAD'))) return false;
                if (filtroStatus === 'REJEITADA' && (!st.includes('REJEITAD') && !st.includes('ERRO'))) return false;
                if (filtroStatus === 'RASCUNHO' && !st.includes('RASCUNHO') && !st.includes('PENDENTE') && !st.includes('PROCESSANDO')) return false;
            }

            // 3. Filtro por Dia Específico (YYYY-MM-DD)
            if (filtroDia) {
                const dataNota = nota.data_emissao ? new Date(nota.data_emissao).toISOString().split('T')[0] : '';
                if (dataNota !== filtroDia) return false;
            }

            // 4. Filtro por Operador
            if (filtroOperador.trim()) {
                const op = String(nota.operador_nome || '').toLowerCase();
                if (!op.includes(filtroOperador.toLowerCase().trim())) return false;
            }

            // 5. Filtro por Caixa PDV
            if (filtroCaixa.trim()) {
                const cx = String(nota.caixa_numero || nota.id_caixa_pdv || '').toLowerCase();
                if (!cx.includes(filtroCaixa.toLowerCase().trim())) return false;
            }

            // 6. Busca Geral (Número, Chave, Cliente, CPF)
            if (busca.trim()) {
                const b = busca.toLowerCase().trim();
                const num = String(nota.numero || '');
                const chave = String(nota.chave_acesso || '').toLowerCase();
                const cliente = String(nota.destinatario_nome || nota.destinatario?.razao_social || nota.cliente_nome || '').toLowerCase();
                const cpf = String(nota.cpf_cnpj || nota.destinatario?.cpf_cnpj || '').toLowerCase();
                if (!num.includes(b) && !chave.includes(b) && !cliente.includes(b) && !cpf.includes(b)) {
                    return false;
                }
            }

            return true;
        });
    }, [notas, filtroModelo, filtroStatus, filtroDia, filtroOperador, filtroCaixa, busca]);

    const limparFiltros = () => {
        setFiltroModelo('TODAS');
        setFiltroStatus('TODOS');
        setFiltroDia('');
        setFiltroOperador('');
        setFiltroCaixa('');
        setBusca('');
    };

    return (
        <div className="container-fluid mt-4 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4 className="fw-bold mb-1">Notas & Cupons Fiscais (SEFAZ)</h4>
                    <small className="text-muted d-block">
                        Monitore emissões de NFC-e (Mod 65) e NF-e (Mod 55), consulte cancelamentos, retransmita ou gere DANFE em PDF.
                    </small>
                </div>
                <div className="d-flex gap-2">
                    <LightButton onClick={fetchNotas} disabled={loading}>
                        <RotateCw size={16} className={`me-2 ${loading ? 'spin' : ''}`} /> Atualizar
                    </LightButton>
                </div>
            </div>

            {/* ABAS RÁPIDAS DE SEPARAÇÃO: TODAS / NFC-E (65) / NF-E (55) / CANCELADAS */}
            <div className="d-flex flex-wrap gap-2 mb-3 border-bottom pb-3">
                <button
                    type="button"
                    onClick={() => { setFiltroModelo('TODAS'); if (filtroStatus === 'CANCELADA') setFiltroStatus('TODOS'); }}
                    className={`btn rounded-pill px-3 py-1.5 fw-semibold small d-flex align-items-center gap-1.5 ${
                        filtroModelo === 'TODAS' && filtroStatus !== 'CANCELADA' ? 'btn-primary shadow-sm' : 'btn-light text-secondary border'
                    }`}
                >
                    <FileText size={15} /> Todas as Notas
                    <Badge bg={filtroModelo === 'TODAS' && filtroStatus !== 'CANCELADA' ? 'light' : 'secondary'} text={filtroModelo === 'TODAS' && filtroStatus !== 'CANCELADA' ? 'dark' : 'white'} className="rounded-pill">
                        {notas.length}
                    </Badge>
                </button>

                <button
                    type="button"
                    onClick={() => { setFiltroModelo('65'); if (filtroStatus === 'CANCELADA') setFiltroStatus('TODOS'); }}
                    className={`btn rounded-pill px-3 py-1.5 fw-semibold small d-flex align-items-center gap-1.5 ${
                        filtroModelo === '65' ? 'btn-success shadow-sm' : 'btn-light text-secondary border'
                    }`}
                >
                    <Monitor size={15} /> NFC-e (Mod 65 - Cupons de Balcão)
                    <Badge bg={filtroModelo === '65' ? 'light' : 'success'} text={filtroModelo === '65' ? 'dark' : 'white'} className="rounded-pill">
                        {totalNfce}
                    </Badge>
                </button>

                <button
                    type="button"
                    onClick={() => { setFiltroModelo('55'); if (filtroStatus === 'CANCELADA') setFiltroStatus('TODOS'); }}
                    className={`btn rounded-pill px-3 py-1.5 fw-semibold small d-flex align-items-center gap-1.5 ${
                        filtroModelo === '55' ? 'btn-info text-white shadow-sm' : 'btn-light text-secondary border'
                    }`}
                >
                    <FileText size={15} /> NF-e (Mod 55 - Notas Gerais)
                    <Badge bg={filtroModelo === '55' ? 'light' : 'info'} text={filtroModelo === '55' ? 'dark' : 'white'} className="rounded-pill">
                        {totalNfe}
                    </Badge>
                </button>

                <button
                    type="button"
                    onClick={() => { setFiltroStatus('CANCELADA'); }}
                    className={`btn rounded-pill px-3 py-1.5 fw-semibold small d-flex align-items-center gap-1.5 ${
                        filtroStatus === 'CANCELADA' ? 'btn-danger shadow-sm' : 'btn-light text-danger border'
                    }`}
                >
                    <XCircle size={15} /> Cupons & Notas Canceladas
                    <Badge bg={filtroStatus === 'CANCELADA' ? 'light' : 'danger'} text={filtroStatus === 'CANCELADA' ? 'dark' : 'white'} className="rounded-pill">
                        {totalCanceladas}
                    </Badge>
                </button>
            </div>

            {/* PAINEL DE FILTROS: DIA, OPERADOR, CAIXA, STATUS E BUSCA */}
            <div className="bg-white rounded-4 border p-3 shadow-sm mb-3">
                <Row className="g-2 align-items-end">
                    <Col md={3}>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            <Search size={13} className="me-1" /> Buscar (Nº, Chave, Cliente, CPF)
                        </Form.Label>
                        <CustomInput
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Pesquisar..."
                        />
                    </Col>

                    <Col md={2}>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            <Calendar size={13} className="me-1" /> Filtrar por Dia
                        </Form.Label>
                        <Form.Control
                            type="date"
                            value={filtroDia}
                            onChange={e => setFiltroDia(e.target.value)}
                            className="rounded-3"
                            style={{ height: '48px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }}
                        />
                    </Col>

                    <Col md={2}>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            <User size={13} className="me-1" /> Operador
                        </Form.Label>
                        <CustomInput
                            value={filtroOperador}
                            onChange={e => setFiltroOperador(e.target.value)}
                            placeholder="Nome do operador..."
                        />
                    </Col>

                    <Col md={2}>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            <Monitor size={13} className="me-1" /> Caixa PDV
                        </Form.Label>
                        <CustomInput
                            value={filtroCaixa}
                            onChange={e => setFiltroCaixa(e.target.value)}
                            placeholder="Ex: 01 ou 1..."
                        />
                    </Col>

                    <Col md={2}>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            <Filter size={13} className="me-1" /> Status SEFAZ
                        </Form.Label>
                        <Form.Select
                            value={filtroStatus}
                            onChange={e => setFiltroStatus(e.target.value)}
                            className="rounded-3"
                            style={{ height: '48px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }}
                        >
                            <option value="TODOS">Todos os Status</option>
                            <option value="AUTORIZADA">Autorizadas</option>
                            <option value="CANCELADA">Canceladas</option>
                            <option value="REJEITADA">Rejeitadas</option>
                            <option value="RASCUNHO">Rascunhos / Processando</option>
                        </Form.Select>
                    </Col>

                    <Col md={1} className="text-end">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-3 w-100 fw-semibold"
                            style={{ height: '48px' }}
                            onClick={limparFiltros}
                            title="Limpar todos os filtros"
                        >
                            Limpar
                        </button>
                    </Col>
                </Row>
            </div>

            {loading ? <Spinner animation="border" variant="primary" /> : (
                <div className="bg-white rounded-4 border p-0 overflow-hidden shadow-sm">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">DOCUMENTO / SÉRIE</th>
                                <th className="py-3 px-3 text-muted small fw-semibold border-bottom-0 text-center">TIPO</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0">CLIENTE / DESTINATÁRIO</th>
                                <th className="py-3 px-3 text-muted small fw-semibold border-bottom-0">OPERADOR & CAIXA</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-center">STATUS SEFAZ</th>
                                <th className="py-3 px-4 text-muted small fw-semibold border-bottom-0 text-end">VALOR TOTAL</th>
                                <th className="py-3 px-4 text-end border-bottom-0">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        <FileText size={32} className="opacity-25 mb-2 d-block mx-auto" />
                                        Nenhuma nota fiscal ou cupom encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                notasFiltradas.map(nota => {
                                    const valorTotal = Number(nota.valor_total_nota) || 0;
                                    const statusStr = String(nota.status || nota.situacao || '').toUpperCase();
                                    const isCancelada = statusStr.includes('CANCELAD');

                                    return (
                                        <tr key={nota.id} className={isCancelada ? 'table-light text-muted' : ''}>
                                            <td className="py-3 px-4">
                                                <div className="fw-bold text-dark mb-1">
                                                    {nota.numero || '-'} <small className="text-muted fw-normal">/ {typeof nota.serie === 'object' ? nota.serie?.serie : (nota.serie || '1')}</small>
                                                </div>
                                                {nota.data_emissao && (
                                                    <div className="small text-muted mb-1" style={{ fontSize: '11px' }}>
                                                        {new Date(nota.data_emissao).toLocaleString('pt-BR')}
                                                    </div>
                                                )}
                                                {nota.chave_acesso && (
                                                    <div
                                                        className="text-primary font-monospace"
                                                        style={{ fontSize: '10px', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(nota.chave_acesso);
                                                            toast.success('Chave copiada!');
                                                        }}
                                                        title="Clique para copiar a Chave de Acesso"
                                                    >
                                                        <Copy size={10} className="me-1" /> {nota.chave_acesso}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {String(nota.modelo) === '65' ? (
                                                    <Badge bg="success-subtle" className="text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '10.5px' }}>
                                                        NFC-e (65)
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="primary-subtle" className="text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold" style={{ fontSize: '10.5px' }}>
                                                        NF-e (55)
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 fw-medium text-secondary">
                                                <div className="text-truncate" style={{ maxWidth: '220px' }}>
                                                    {nota.destinatario_nome || nota.destinatario?.razao_social || nota.cliente_nome || 'Consumidor Final'}
                                                </div>
                                                {(nota.cpf_cnpj || nota.destinatario?.cpf_cnpj) && (
                                                    <small className="text-muted font-monospace d-block" style={{ fontSize: '10.5px' }}>
                                                        {nota.cpf_cnpj || nota.destinatario?.cpf_cnpj}
                                                    </small>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                                                    👤 {nota.operador_nome || 'Caixa'}
                                                </div>
                                                <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                                                    Caixa #{nota.caixa_numero || '01'}
                                                </small>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getStatusBadge(nota.status || nota.situacao)}
                                                {(statusStr === 'REJEITADA' || statusStr === 'ERRO') && (
                                                    <div className="text-danger mt-1 text-truncate" style={{ fontSize: '10px', maxWidth: '220px', margin: '0 auto' }} title={nota.motivo_status_sefaz}>
                                                        {nota.motivo_status_sefaz}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`py-3 px-4 text-end fw-bold ${isCancelada ? 'text-decoration-line-through text-muted' : 'text-success'}`}>
                                                R$ {valorTotal.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-end">
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle as={LightButton} className="btn-sm px-2 py-1">
                                                        <MoreVertical size={16} />
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2">
                                                        <Dropdown.Item onClick={() => handleDownloadPdf(nota.id)} className="rounded py-2" disabled={!nota.xml_autorizado && !nota.xml_assinado && statusStr !== 'AUTORIZADA' && !isCancelada}>
                                                            <FileText size={16} className="me-2 text-primary" /> Ver DANFE (PDF)
                                                        </Dropdown.Item>

                                                        <Dropdown.Item onClick={() => baixarXml(nota.xml_autorizado || nota.xml_assinado || nota.xml_gerado, nota.chave_acesso || nota.id)} className="rounded py-2" disabled={!nota.xml_autorizado && !nota.xml_assinado && !nota.xml_gerado}>
                                                            <Download size={16} className="me-2 text-success" /> Baixar XML
                                                        </Dropdown.Item>

                                                        <Dropdown.Item onClick={() => openEventos(nota.id)} className="rounded py-2">
                                                            <List size={16} className="me-2 text-info" /> Histórico da SEFAZ
                                                        </Dropdown.Item>

                                                        {['REJEITADA', 'RASCUNHO', 'ERRO', 'PROCESSANDO'].includes(statusStr) && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item onClick={() => handleReenviar(nota.id)} className="rounded py-2 fw-bold text-warning">
                                                                    <RotateCw size={16} className="me-2" /> Retransmitir para SEFAZ
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => abrirModalImpostos(nota)} className="rounded py-2">
                                                                    <Sliders size={16} className="me-2 text-primary" /> Corrigir Impostos / CST / CFOP
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => handleCorrigirData(nota.id)} className="rounded py-2">
                                                                    <Clock size={16} className="me-2 text-secondary" /> Sincronizar Data/Hora
                                                                </Dropdown.Item>
                                                            </>
                                                        )}

                                                        {['AUTORIZADA', 'APROVADA'].includes(statusStr) && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item onClick={() => { setJustificativa(''); setModalAction({ isOpen: true, tipo: 'cce', notaId: nota.id }); }} className="rounded py-2">
                                                                    <Edit3 size={16} className="me-2 text-secondary" /> Carta de Correção (CC-e)
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => abrirModalEspecial(nota, 'devolucao')} className="rounded py-2">
                                                                <CornerUpLeft size={16} className="me-2 text-warning" /> Emitir NF-e de Devolução
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => abrirModalEspecial(nota, 'complementar')} className="rounded py-2">
                                                                <PlusCircle size={16} className="me-2 text-primary" /> Emitir NF-e Complementar
                                                            </Dropdown.Item>
                                                            <Dropdown.Item onClick={() => { setJustificativa(''); setModalAction({ isOpen: true, tipo: 'cancelar', notaId: nota.id }); }} className="rounded py-2 text-danger fw-bold">
                                                                <XCircle size={16} className="me-2" /> Cancelar Nota
                                                            </Dropdown.Item>
                                                        </>
                                                    )}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CANCELAR / CC-e */}
            <Modal show={modalAction.isOpen} onHide={() => setModalAction({ isOpen: false, tipo: '', notaId: '' })} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className={`fw-bold fs-5 ${modalAction.tipo === 'cancelar' ? 'text-danger' : 'text-primary'}`}>
                        {modalAction.tipo === 'cancelar' ? 'Cancelar Nota Fiscal' : 'Carta de Correção (CC-e)'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="small text-muted mb-3">
                        {modalAction.tipo === 'cancelar' ? 'Atenção: O cancelamento é irreversível e só é aceito dentro do prazo legal da Sefaz.' : 'A CC-e não pode alterar valores, impostos ou destinatário da nota.'}
                    </p>

                    {modalAction.tipo === 'cce' && (
                        <div className="mb-3">
                            <Form.Label className="small fw-semibold mb-1">Número do Sequencial</Form.Label>
                            <CustomInput type="number" min="1" value={sequencialCce} onChange={(e) => setSequencialCce(e.target.value)} />
                            <Form.Text className="text-muted" style={{ fontSize: '11px' }}>Aumente +1 se você já fez uma carta de correção para esta mesma nota antes.</Form.Text>
                        </div>
                    )}

                    <Form.Label className="small fw-semibold mb-1">Justificativa (Mín. 15 caracteres)</Form.Label>
                    <Form.Control as="textarea" rows={4} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Descreva detalhadamente o motivo..." className="border rounded-4 p-3 shadow-none" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }} />
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <LightButton onClick={() => setModalAction({ isOpen: false, tipo: '', notaId: '' })}>Desistir</LightButton>
                    {modalAction.tipo === 'cancelar' ? (
                        <RedButton onClick={handleAcaoFiscal} disabled={processando}>{processando ? <Spinner size="sm" /> : 'Confirmar Cancelamento'}</RedButton>
                    ) : (
                        <CtaButton onClick={handleAcaoFiscal} disabled={processando}>{processando ? <Spinner size="sm" /> : 'Transmitir CC-e'}</CtaButton>
                    )}
                </Modal.Footer>
            </Modal>

            {/* MODAL CORRIGIR IMPOSTOS */}
            <Modal show={modalImpostos.isOpen} onHide={() => setModalImpostos({ isOpen: false, nota: null, itens: [] })} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">Corrigir Tributação dos Itens (Nota #{modalImpostos.nota?.numero})</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive size="sm" className="align-middle">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>NCM</th>
                                <th>CFOP</th>
                                <th>CST/CSOSN ICMS</th>
                                <th>Alíq. ICMS (%)</th>
                                <th>CST PIS/COFINS</th>
                                <th>cClassTrib</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modalImpostos.itens.map((it, idx) => (
                                <tr key={it.id}>
                                    <td className="fw-semibold small">{it.descricao_produto}</td>
                                    <td><Form.Control size="sm" value={it.ncm} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].ncm = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                    <td><Form.Control size="sm" value={it.cfop} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].cfop = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                    <td><Form.Control size="sm" value={it.icms_cst_csosn} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].icms_cst_csosn = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                    <td><Form.Control size="sm" type="number" step="0.01" value={it.icms_aliquota} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].icms_aliquota = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                    <td><Form.Control size="sm" value={it.pis_cst} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].pis_cst = e.target.value; arr[idx].cofins_cst = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                    <td><Form.Control size="sm" value={it.cClassTrib} onChange={e => { const arr = [...modalImpostos.itens]; arr[idx].cClassTrib = e.target.value; setModalImpostos({ ...modalImpostos, itens: arr }); }} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <LightButton onClick={() => setModalImpostos({ isOpen: false, nota: null, itens: [] })}>Cancelar</LightButton>
                    <CtaButton onClick={salvarCorrecaoImpostos} disabled={processando}>
                        {processando ? <Spinner size="sm" /> : 'Salvar Impostos'}
                    </CtaButton>
                </Modal.Footer>
            </Modal>

            {/* MODAL NOTAS ESPECIAIS (DEVOLUÇÃO / COMPLEMENTAR) */}
            <Modal show={modalEspecial.isOpen} onHide={() => setModalEspecial(prev => ({ ...prev, isOpen: false }))} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">
                        Emitir Nota Fiscal ({modalEspecial.tipo.toUpperCase()}) - Ref. Nota #{modalEspecial.notaOriginal?.numero}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3 mb-3">
                        <Col md={8}>
                            <Form.Label className="small fw-semibold">Natureza da Operação</Form.Label>
                            <Form.Control value={modalEspecial.natureza_operacao} onChange={e => setModalEspecial({ ...modalEspecial, natureza_operacao: e.target.value })} />
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-semibold">CFOP</Form.Label>
                            <Form.Control value={modalEspecial.cfop} onChange={e => setModalEspecial({ ...modalEspecial, cfop: e.target.value })} />
                        </Col>
                    </Row>

                    {modalEspecial.tipo === 'devolucao' ? (
                        <Table responsive size="sm" className="align-middle">
                            <thead>
                                <tr>
                                    <th>Devolver?</th>
                                    <th>Produto</th>
                                    <th>Qtd. Original</th>
                                    <th>Qtd. a Devolver</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalEspecial.itens.map((it, idx) => (
                                    <tr key={it.item_original_id}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={it.selecionado}
                                                onChange={e => {
                                                    const arr = [...modalEspecial.itens];
                                                    arr[idx].selecionado = e.target.checked;
                                                    setModalEspecial({ ...modalEspecial, itens: arr });
                                                }}
                                            />
                                        </td>
                                        <td>{it.descricao}</td>
                                        <td>{it.quantidade_max}</td>
                                        <td style={{ maxWidth: '120px' }}>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min="0.01"
                                                max={it.quantidade_max}
                                                step="0.01"
                                                value={it.quantidade_devolvida}
                                                onChange={e => {
                                                    const arr = [...modalEspecial.itens];
                                                    arr[idx].quantidade_devolvida = e.target.value;
                                                    setModalEspecial({ ...modalEspecial, itens: arr });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Label className="small fw-semibold">Valor Complementar (R$)</Form.Label>
                                <Form.Control type="number" step="0.01" value={modalEspecial.valor_complementar} onChange={e => setModalEspecial({ ...modalEspecial, valor_complementar: e.target.value })} />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="small fw-semibold">Base ICMS Complementar (R$)</Form.Label>
                                <Form.Control type="number" step="0.01" value={modalEspecial.icms_base_comp} onChange={e => setModalEspecial({ ...modalEspecial, icms_base_comp: e.target.value })} />
                            </Col>
                            <Col md={4}>
                                <Form.Label className="small fw-semibold">Valor ICMS Complementar (R$)</Form.Label>
                                <Form.Control type="number" step="0.01" value={modalEspecial.icms_valor_comp} onChange={e => setModalEspecial({ ...modalEspecial, icms_valor_comp: e.target.value })} />
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <LightButton onClick={() => setModalEspecial(prev => ({ ...prev, isOpen: false }))}>Cancelar</LightButton>
                    <CtaButton onClick={emitirNotaEspecial} disabled={processando}>
                        {processando ? <Spinner size="sm" /> : 'Emitir Nota Referenciada'}
                    </CtaButton>
                </Modal.Footer>
            </Modal>

            {/* DRAWER DE EVENTOS */}
            <Offcanvas show={drawerEventos.isOpen} onHide={() => setDrawerEventos({ isOpen: false, eventos: [], notaId: '' })} placement="end">
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title className="fw-bold">Histórico da Sefaz</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {drawerEventos.eventos.length === 0 ? <p className="text-muted text-center mt-5">Nenhum evento registrado.</p> : (
                        drawerEventos.eventos.map((ev, i) => (
                            <div key={i} className="mb-4 p-3 border rounded-4 bg-light">
                                <Badge bg="dark" className="mb-2">{ev.tipo_evento || ev.tipo}</Badge>
                                <p className="small mb-1 fw-bold text-secondary">Data: {new Date(ev.created_at || ev.data_evento || ev.data).toLocaleString()}</p>
                                {ev.protocolo_sefaz && <p className="small mb-1 text-muted">Protocolo: {ev.protocolo_sefaz}</p>}
                                {ev.justificativa && <p className="small mb-1 text-dark"><strong>Motivo:</strong> {ev.justificativa}</p>}
                                {ev.sequencial && <p className="small mb-0 text-muted">Sequencial: {ev.sequencial}</p>}
                            </div>
                        ))
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default NotasFiscaisList;