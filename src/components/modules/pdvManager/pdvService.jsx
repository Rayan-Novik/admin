import api from '../../../services/api';

const PDV_CONFIG_KEY = 'ararinha_pdv_config_v1';

export const DEFAULT_PDV_CONFIG = {
    modo_fiscal: true, // true = FISCAL (NFC-e/NF-e), false = NAO_FISCAL (Recibo)
    comportamento_fiscal: 'AUTOMATICO_NFCE', // 'AUTOMATICO_NFCE' | 'PERGUNTAR'
    tipo_documento_padrao: 'NFCE', // 'NFCE' | 'NFE'
    cenario_id: '',
    caixa_id: '',
    numero_caixa: 1,
    serie_numero: 1,
    ambiente_fiscal: 2, // 2 = Homologação, 1 = Produção
    imprimir_automatico: false,
    largura_bobina: '80mm', // '80mm' | '58mm'
    solicitar_cpf_nota: true,
    exibir_barra_atalhos: true,
    som_bip: true
};

export const getPdvConfig = () => {
    try {
        const raw = localStorage.getItem(PDV_CONFIG_KEY);
        if (!raw) return { ...DEFAULT_PDV_CONFIG };
        return { ...DEFAULT_PDV_CONFIG, ...JSON.parse(raw) };
    } catch (_) {
        return { ...DEFAULT_PDV_CONFIG };
    }
};

export const savePdvConfig = (newConfig) => {
    const merged = { ...getPdvConfig(), ...newConfig };
    localStorage.setItem(PDV_CONFIG_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('pdvConfigChanged', { detail: merged }));
    return merged;
};

// Emite som curto de bip usando Web Audio API (sem depender de arquivo externo)
export const playPdvBeep = (freq = 880, durationMs = 70) => {
    try {
        const cfg = getPdvConfig();
        if (!cfg.som_bip) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
            osc.stop();
            ctx.close().catch(() => {});
        }, durationMs);
    } catch (_) {}
};

// ============================================================
// 🟢 STATUS E CONTROLE DE CAIXA
// ============================================================
export const getStatusCaixa = async () => {
    const { data } = await api.get('/pdv/status');
    return data;
};

export const abrirCaixa = async (saldo_inicial, observacoes) => {
    const { data } = await api.post('/pdv/abrir', { 
        saldo_inicial: Number(saldo_inicial), 
        observacoes 
    });
    return data;
};

export const conferirCaixa = async (valores) => {
    const { data } = await api.post('/pdv/conferir', { valores_informados: valores });
    return data;
};

export const fecharCaixa = async (valores, observacoes) => {
    const { data } = await api.post('/pdv/fechar', { 
        valores_informados: valores, 
        observacoes 
    });
    return data;
};

// ============================================================
// 🟢 MOVIMENTAÇÕES (Sangria / Suprimento)
// ============================================================
export const adicionarMovimentacao = async (tipo, valor, motivo) => {
    const { data } = await api.post('/pdv/movimentacao', { 
        tipo,
        valor: Number(valor), 
        motivo 
    });
    return data;
};

// ============================================================
// 🟢 PRODUTOS (Busca Híbrida: Nome, Código ou Vitrine Inicial)
// ============================================================
export const buscarProdutos = async (termo, tipo = 'geral') => {
    if (!termo) return [];
    const termoCodificado = encodeURIComponent(termo);
    const { data } = await api.get(`/produtos/busca?q=${termoCodificado}&type=${tipo}`); 
    return data;
};

export const buscarProdutosIniciais = async () => {
    const { data } = await api.get('/produtos/busca?q=*&initial=true');
    return data || [];
};

// ============================================================
// 🟢 VENDAS (Checkout Fiscal e Não Fiscal)
// ============================================================
export const realizarVenda = async (vendaData) => {
    const { data } = await api.post('/pdv/venda', vendaData);
    return data;
};

export const emitirNotaFiscalVendaPdv = async (id_pedido, payload = {}) => {
    const { data } = await api.post(`/pdv/venda/${id_pedido}/emitir-fiscal`, payload);
    return data;
};

// ============================================================
// 🟢 CLIENTES (Busca por Nome ou CPF)
// ============================================================
export const buscarCliente = async (termo) => {
    if (!termo || termo.trim() === '') return [];
    const termoCodificado = encodeURIComponent(termo);
    const { data } = await api.get(`/usuarios/search/${termoCodificado}`);
    return data;
};

export const cadastrarCliente = async (clienteData) => {
    const { data } = await api.post('/usuarios/pdv', clienteData); 
    return data;
};

// ============================================================
// 🟢 HISTÓRICO DE VENDAS E RELATÓRIOS
// ============================================================
export const getHistoricoVendas = async () => {
    const { data } = await api.get('/pdv/vendas'); 
    return data;
};

export const listarCaixas = async () => {
    const { data } = await api.get('/pdv/historico-caixas');
    return data;
};

export const buscarRelatorioCaixa = async (id_caixa) => {
    const { data } = await api.get(`/pdv/relatorio/${id_caixa}`);
    return data;
};

export const gerarRascunhoFiscalPdv = async (id_pedido, tipo_nota) => {
    const { data } = await api.post('/fiscal/saida/rascunho', {
        id_pedido,
        tipo_nota
    });
    return data;
};

export const emitirNotaFiscalPdv = async (id_nota) => {
    const { data } = await api.post(`/fiscal/notas/${id_nota}/emitir`);
    return data;
};