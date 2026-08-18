import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ConfiguracoesFiscais() {
    const [config, setConfig] = useState({
        cnpj: '',
        razao_social: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        regime_tributario: 'SIMPLES_NACIONAL',
        codigo_municipio: '',
        ambiente: 'HOMOLOGACAO',
        serie_nfe: 1,
        serie_nfce: 1,
        serie_nfae: 1,
        serie_rps: '1',
        senha_certificado: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [extraindo, setExtraindo] = useState(false); 
    const [testando, setTestando] = useState(false); 
    const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
    const [arquivoCertificado, setArquivoCertificado] = useState(null);

    const formatarCNPJ = (valor) => {
        if (!valor) return '';
        let v = valor.replace(/\D/g, '');
        if (v.length <= 14) {
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
        }
        return v.substring(0, 18);
    };

    useEffect(() => {
        api.get('/fiscal/configuracao').then(({ data }) => {
            if (data) {
                setConfig({
                    ...data,
                    cnpj: formatarCNPJ(data.cnpj)
                });
            }
        }).catch(err => console.error("Erro ao carregar configuração fiscal:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cnpj') {
            setConfig({ ...config, cnpj: formatarCNPJ(value) });
        } else {
            setConfig({ ...config, [name]: value });
        }
    };

    const extrairDadosCertificado = async () => {
        if (!arquivoCertificado || !config.senha_certificado) {
            setMensagem({ tipo: 'alert-warning', texto: '⚠️ Selecione o arquivo .pfx e digite a senha antes de extrair os dados.' });
            return;
        }

        setExtraindo(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const formData = new FormData();
            formData.append('certificado', arquivoCertificado);
            formData.append('senha', config.senha_certificado);

            const { data } = await api.post('/fiscal/configuracao/ler-certificado', formData);

            setConfig(prev => ({
                ...prev,
                cnpj: formatarCNPJ(data.cnpj || prev.cnpj),
                razao_social: data.razao_social || prev.razao_social
            }));

            setMensagem({ tipo: 'alert-success', texto: '✅ Dados extraídos com sucesso! Não se esqueça de clicar em "Salvar Configurações".' });
        } catch (err) {
            setMensagem({ tipo: 'alert-danger', texto: '❌ Erro ao ler o certificado. Verifique se a senha está correta e se o arquivo é válido.' });
        } finally {
            setExtraindo(false);
        }
    };

    // 🟢 FUNÇÃO DE TESTE MELHORADA
    const testarConexaoSefaz = async () => {
        setTestando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const { data } = await api.get('/fiscal/testar-sefaz');
            
            setMensagem({ 
                tipo: 'alert-success', 
                texto: `✅ ${data.motivo}` 
            });
        } catch (err) {
            setMensagem({ 
                tipo: 'alert-danger', 
                texto: `❌ ${err.response?.data?.message || 'Falha na conexão de rede com a SEFAZ.'}` 
            });
        } finally {
            setTestando(false);
        }
    };

    const salvar = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const formData = new FormData();
            Object.keys(config).forEach(key => {
                formData.append(key, config[key]);
            });

            if (arquivoCertificado) {
                formData.append('certificado', arquivoCertificado);
            }

            await api.post('/fiscal/configuracao', formData);
            setMensagem({ tipo: 'alert-success', texto: '✅ Configurações salvas no banco de dados com sucesso! Você já pode testar a conexão.' });
            setArquivoCertificado(null); // Limpa o input file pra não re-enviar sem querer
        } catch (err) {
            setMensagem({ tipo: 'alert-danger', texto: '❌ Erro ao salvar configurações. Verifique os dados.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">⚙️ Configurações Fiscais</h2>

            {mensagem.texto && <div className={`alert ${mensagem.tipo}`}>{mensagem.texto}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                    <form onSubmit={salvar}>
                        {/* SEÇÃO 4: CERTIFICADO DIGITAL */}
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                            <h5 className="fw-bold text-secondary m-0">Certificado Digital (A1)</h5>
                            
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center" 
                                onClick={testarConexaoSefaz} 
                                disabled={testando}
                                title="Teste a comunicação com a SEFAZ usando o certificado salvo"
                            >
                                {testando ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span> Conectando...</>
                                ) : (
                                    <><i className="bi bi-shield-check me-2"></i> Testar Comunicação SEFAZ</>
                                )}
                            </button>
                        </div>
                        
                        <div className="row mb-4">
                            <div className="col-md-5">
                                <label className="form-label fw-medium">Arquivo do Certificado (.pfx)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".pfx,.p12"
                                    onChange={(e) => setArquivoCertificado(e.target.files[0])}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Senha do Certificado</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="senha_certificado"
                                    value={config.senha_certificado || ''}
                                    onChange={handleChange}
                                    placeholder="Senha do arquivo .pfx"
                                />
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-info w-100 fw-bold" 
                                    onClick={extrairDadosCertificado} 
                                    disabled={extraindo}
                                >
                                    {extraindo ? 'Lendo...' : 'Ler Dados (Auto-preencher)'}
                                </button>
                            </div>
                        </div>

                        {/* SEÇÃO 1: DADOS DA EMPRESA */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Dados da Empresa</h5>
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-medium">CNPJ</label>
                                <input type="text" className="form-control" name="cnpj" value={config.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" required />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fw-medium">Razão Social</label>
                                <input type="text" className="form-control" name="razao_social" value={config.razao_social || ''} onChange={handleChange} placeholder="Nome oficial da empresa" />
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-medium">Inscrição Estadual (IE)</label>
                                <input type="text" className="form-control" name="inscricao_estadual" value={config.inscricao_estadual || ''} onChange={handleChange} placeholder="Apenas números ou ISENTO" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-medium">Inscrição Municipal (IM)</label>
                                <input type="text" className="form-control" name="inscricao_municipal" value={config.inscricao_municipal || ''} onChange={handleChange} />
                            </div>
                        </div>

                        {/* SEÇÃO 2: TRIBUTAÇÃO E AMBIENTE */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Tributação e Ambiente</h5>
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Regime Tributário</label>
                                <select className="form-select" name="regime_tributario" value={config.regime_tributario || 'SIMPLES_NACIONAL'} onChange={handleChange}>
                                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                                    <option value="LUCRO_REAL">Lucro Real</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium text-danger">Ambiente Sefaz</label>
                                <select className="form-select border-danger" name="ambiente" value={config.ambiente || 'HOMOLOGACAO'} onChange={handleChange}>
                                    <option value="HOMOLOGACAO">Homologação (Sandbox / Testes)</option>
                                    <option value="PRODUCAO">Produção (Validade Jurídica Oficial)</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Código IBGE (Município)</label>
                                <input type="text" className="form-control" name="codigo_municipio" value={config.codigo_municipio || ''} onChange={handleChange} placeholder="Ex: 1302603 (Manaus)" />
                                <div className="form-text">Necessário para NFS-e e NFA-e</div>
                            </div>
                        </div>

                        {/* SEÇÃO 3: SÉRIES DE EMISSÃO */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Séries de Emissão</h5>
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Série NF-e</label>
                                <input type="number" className="form-control" name="serie_nfe" value={config.serie_nfe || 1} onChange={handleChange} />
                                <div className="form-text">Para produtos</div>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Série NFC-e</label>
                                <input type="number" className="form-control" name="serie_nfce" value={config.serie_nfce || 1} onChange={handleChange} />
                                <div className="form-text">Para consumidor final</div>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Série NFA-e</label>
                                <input type="number" className="form-control" name="serie_nfae" value={config.serie_nfae || 1} onChange={handleChange} />
                                <div className="form-text">Para notas avulsas</div>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Série RPS</label>
                                <input type="text" className="form-control" name="serie_rps" value={config.serie_rps || '1'} onChange={handleChange} />
                                <div className="form-text">Para serviços (NFS-e)</div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={loading}>
                                {loading ? (
                                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Salvando...</>
                                ) : 'Salvar Configurações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}