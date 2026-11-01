import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ConfiguracoesFiscais() {
    const [config, setConfig] = useState({
        id: '', // ID da empresa na API externa
        cnpj: '',
        razao_social: '',
        nome_fantasia: '',
        ie: '',
        im: '',
        crt: 'SIMPLES_NACIONAL',
        cnae: '',
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        codigo_municipio_ibge: '',
        uf: '',
        cep: '',
        pais: 'Brasil',
        telefone: '',
        email: '',
        csc: '',
        id_token_csc: '',
        // Campos para manipulação do certificado
        senha_certificado: '',
        certificado_ativo: false,
        certificado_vencimento: null
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

    const formatarData = (dataIso) => {
        if (!dataIso) return '';
        return new Date(dataIso).toLocaleDateString('pt-BR');
    };

    useEffect(() => {
        // Busca as empresas da API externa através do nosso backend
        api.get('/fiscal/empresas').then(({ data }) => {
            if (data && data.cnpj) { // Confirma se retornou dados reais da empresa
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    cnpj: formatarCNPJ(data.cnpj),
                    ie: data.ie || '',
                    im: data.im || '',
                    cnae: data.cnae || '',
                    csc: data.csc || '',
                    id_token_csc: data.id_token_csc || '',
                    crt: data.crt || 'SIMPLES_NACIONAL',
                    certificado_ativo: data.certificado_ativo || false,
                    certificado_vencimento: data.certificado_vencimento || null
                }));
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
            setMensagem({ tipo: 'alert-warning', texto: '⚠️ Selecione o arquivo .pfx e digite a senha antes de extrair.' });
            return;
        }

        setExtraindo(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const formData = new FormData();
            formData.append('certificado', arquivoCertificado);
            formData.append('senha', config.senha_certificado);

            // Continua usando a rota antiga que mantivemos no backend para essa função
            const { data } = await api.post('/fiscal/configuracao/ler-certificado', formData);

            setConfig(prev => ({
                ...prev,
                cnpj: formatarCNPJ(data.cnpj || prev.cnpj),
                razao_social: data.razao_social || prev.razao_social
            }));

            setMensagem({ tipo: 'alert-success', texto: '✅ Dados extraídos com sucesso! Preencha o restante e salve.' });
        } catch (err) {
            setMensagem({ tipo: 'alert-danger', texto: '❌ Erro ao ler o certificado. Verifique a senha e o arquivo.' });
        } finally {
            setExtraindo(false);
        }
    };

    const testarConexaoSefaz = async () => {
        setTestando(true);
        setMensagem({ tipo: '', texto: '' });

        try {
            const { data } = await api.get('/fiscal/testar-sefaz');
            setMensagem({ tipo: 'alert-success', texto: `✅ ${data.motivo || 'Comunicação com a SEFAZ OK!'}` });
        } catch (err) {
            setMensagem({ tipo: 'alert-danger', texto: `❌ ${err.response?.data?.message || 'Falha na conexão com a SEFAZ.'}` });
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
                if (config[key] !== null && config[key] !== undefined) {
                    formData.append(key, config[key]);
                }
            });

            if (arquivoCertificado) {
                formData.append('certificado', arquivoCertificado);
            }

            // Se tem ID, atualiza (PUT), senão cria (POST)
            if (config.id) {
                await api.put(`/fiscal/empresas/${config.id}`, formData);
            } else {
                await api.post('/fiscal/empresas', formData);
            }
            
            setMensagem({ tipo: 'alert-success', texto: '✅ Configurações salvas e integradas com sucesso!' });
            
            // Limpa o arquivo para o usuário não reenviar sem querer depois de salvar
            setArquivoCertificado(null);
            
            // Opcional: Recarregar os dados para atualizar o status do certificado na tela
            const { data } = await api.get('/fiscal/empresas');
            if(data && data.cnpj) {
                setConfig(prev => ({
                    ...prev,
                    certificado_ativo: data.certificado_ativo,
                    certificado_vencimento: data.certificado_vencimento
                }));
            }

        } catch (err) {
            setMensagem({ tipo: 'alert-danger', texto: `❌ Erro ao salvar: ${err.response?.data?.message || 'Verifique os dados.'}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-4">⚙️ Configurações Fiscais</h2>

            {mensagem.texto && <div className={`alert ${mensagem.tipo}`}>{mensagem.texto}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                    <form onSubmit={salvar}>
                        
                        {/* SEÇÃO 1: CERTIFICADO */}
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                            <h5 className="fw-bold text-secondary m-0">
                                Certificado Digital (A1) 
                                {config.certificado_ativo && (
                                    <span className="badge bg-success ms-3 text-white fs-6">
                                        <i className="bi bi-check-circle me-1"></i> 
                                        Ativo (Vence em: {formatarData(config.certificado_vencimento)})
                                    </span>
                                )}
                            </h5>
                            <button type="button" className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center" onClick={testarConexaoSefaz} disabled={testando}>
                                {testando ? <><span className="spinner-border spinner-border-sm me-2"></span> Conectando...</> : <><i className="bi bi-shield-check me-2"></i> Testar Comunicação SEFAZ</>}
                            </button>
                        </div>
                        
                        <div className="row mb-4">
                            <div className="col-md-5">
                                <label className="form-label fw-medium">
                                    {config.certificado_ativo ? 'Substituir Certificado (.pfx)' : 'Arquivo do Certificado (.pfx)'}
                                </label>
                                <input type="file" className="form-control" accept=".pfx,.p12" onChange={(e) => setArquivoCertificado(e.target.files[0])} />
                                {config.certificado_ativo && !arquivoCertificado && (
                                    <small className="text-muted">Deixe em branco se não quiser alterar o certificado atual.</small>
                                )}
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Senha do Certificado</label>
                                <input type="password" className="form-control" name="senha_certificado" value={config.senha_certificado || ''} onChange={handleChange} placeholder="Senha do arquivo .pfx" />
                            </div>
                            <div className="col-md-3 d-flex align-items-start mt-4 pt-2">
                                <button type="button" className="btn btn-outline-info w-100 fw-bold" onClick={extrairDadosCertificado} disabled={extraindo}>
                                    {extraindo ? 'Lendo...' : 'Ler Dados (Auto-preencher)'}
                                </button>
                            </div>
                        </div>

                        {/* SEÇÃO 2: DADOS DA EMPRESA */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Dados da Empresa</h5>
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-medium">CNPJ</label>
                                <input type="text" className="form-control" name="cnpj" value={config.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" required />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label fw-medium">Razão Social</label>
                                <input type="text" className="form-control" name="razao_social" value={config.razao_social || ''} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-medium">Nome Fantasia</label>
                                <input type="text" className="form-control" name="nome_fantasia" value={config.nome_fantasia || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Inscrição Estadual (IE)</label>
                                <input type="text" className="form-control" name="ie" value={config.ie || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Inscrição Municipal (IM)</label>
                                <input type="text" className="form-control" name="im" value={config.im || ''} onChange={handleChange} />
                            </div>
                        </div>

                        {/* SEÇÃO 3: TRIBUTAÇÃO E CONTATO */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Tributação e Contato</h5>
                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Regime Tributário (CRT)</label>
                                <select className="form-select" name="crt" value={config.crt || 'SIMPLES_NACIONAL'} onChange={handleChange}>
                                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                                    <option value="LUCRO_REAL">Lucro Real</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">CNAE Principal</label>
                                <input type="text" className="form-control" name="cnae" value={config.cnae || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">E-mail de Contato</label>
                                <input type="email" className="form-control" name="email" value={config.email || ''} onChange={handleChange} />
                            </div>
                        </div>

                        {/* SEÇÃO 4: ENDEREÇO */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Endereço</h5>
                        <div className="row mb-3">
                            <div className="col-md-2">
                                <label className="form-label fw-medium">CEP</label>
                                <input type="text" className="form-control" name="cep" value={config.cep || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-5">
                                <label className="form-label fw-medium">Logradouro</label>
                                <input type="text" className="form-control" name="logradouro" value={config.logradouro || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-medium">Número</label>
                                <input type="text" className="form-control" name="numero" value={config.numero || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Bairro</label>
                                <input type="text" className="form-control" name="bairro" value={config.bairro || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <label className="form-label fw-medium">Município</label>
                                <input type="text" className="form-control" name="municipio" value={config.municipio || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Cód. IBGE Município</label>
                                <input type="text" className="form-control" name="codigo_municipio_ibge" value={config.codigo_municipio_ibge || ''} onChange={handleChange} placeholder="Ex: 3550308" />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-medium">UF</label>
                                <input type="text" className="form-control" name="uf" value={config.uf || ''} onChange={handleChange} placeholder="SP" maxLength="2" />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label fw-medium">Telefone</label>
                                <input type="text" className="form-control" name="telefone" value={config.telefone || ''} onChange={handleChange} />
                            </div>
                        </div>

                        {/* SEÇÃO 5: DADOS DE EMISSÃO (NFC-E) */}
                        <h5 className="mb-3 border-bottom pb-2 fw-bold text-secondary mt-5">Credenciais NFC-e</h5>
                        <div className="row mb-4">
                            <div className="col-md-8">
                                <label className="form-label fw-medium">Código de Segurança do Contribuinte (CSC)</label>
                                <input type="text" className="form-control" name="csc" value={config.csc || ''} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label fw-medium">ID Token CSC</label>
                                <input type="text" className="form-control" name="id_token_csc" value={config.id_token_csc || ''} onChange={handleChange} placeholder="Ex: 000001" />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span> Salvando...</> : 'Salvar Configurações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}