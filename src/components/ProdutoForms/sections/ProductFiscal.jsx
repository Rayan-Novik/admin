import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Form, Modal, Spinner, Badge } from 'react-bootstrap'; // 🟢 CORRIGIDO: Badge adicionado aqui!
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { CustomInput } from '../../ui/SearchInput/SearchInput';
import { CtaButton, RedButton, LightButton } from '../../ui/buttons/CtaButton';
import { Plus } from 'lucide-react';

// ============================================================================
// 🔍 COMPONENTE DE BUSCA E SELEÇÃO (AUTOCOMPLETE)
// ============================================================================
const SearchableFiscalInput = ({ label, name, value, options, onChange, onAddNew, placeholder, children }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedItem = options.find(opt => opt.codigo === value);
    const displayValue = selectedItem ? `${selectedItem.codigo} - ${selectedItem.descricao || selectedItem.descricao_reduzida}` : searchTerm;

    const filteredOptions = options.filter(opt => 
        opt.codigo.includes(searchTerm) || 
        (opt.descricao && opt.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opt.descricao_reduzida && opt.descricao_reduzida.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (codigo) => {
        onChange({ target: { name, value: codigo } });
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <Form.Group ref={wrapperRef} className="position-relative">
            <Form.Label className="fw-semibold small text-dark mb-1 d-flex justify-content-between align-items-center w-100">
                {label} {children}
            </Form.Label>
            <div className="d-flex align-items-center" style={{ 
                border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)' 
            }}>
                <i className="bi bi-search ms-3 text-muted"></i>
                <input
                    type="text" className="form-control border-0 bg-transparent shadow-none"
                    placeholder={selectedItem ? displayValue : placeholder}
                    value={isOpen ? searchTerm : (selectedItem ? displayValue : '')}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    style={{ height: '48px', fontSize: '14px' }}
                />
                {value && (
                    <button type="button" className="btn border-0 text-muted" onClick={() => handleSelect('')} title="Limpar">
                        <i className="bi bi-x-circle-fill"></i>
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="position-absolute w-100 bg-white shadow-lg rounded-4 mt-1 border z-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div key={opt.id || opt.codigo} className="px-3 py-2 border-bottom" style={{ cursor: 'pointer', fontSize: '13px' }}
                                onClick={() => handleSelect(opt.codigo)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                            >
                                <span className="fw-bold text-primary">{opt.codigo}</span> - <span className="text-muted">{opt.descricao || opt.descricao_reduzida}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-center">
                            <span className="text-muted small d-block mb-2">Nenhum registro encontrado.</span>
                            {onAddNew && (
                                <CtaButton onClick={() => { setIsOpen(false); onAddNew(searchTerm); }} className="btn-sm w-100 py-2">
                                    <Plus size={16} className="me-1" /> Adicionar "{searchTerm}"
                                </CtaButton>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Form.Group>
    );
};

// ============================================================================
// 🏢 COMPONENTE PRINCIPAL (PRODUCT FISCAL)
// ============================================================================
const ProductFiscal = ({ formData, handleChange, setFormData }) => {
    const isServico = formData.tipo_produto === 'SERVICO';

    // 🟢 ESTADOS: Tabelas Auxiliares e Regras Tributárias Prontas
    const [tabelas, setTabelas] = useState({ cfop: [], ncm: [], cest: [], cst: [], csosn: [], classTrib: [] });
    const [regras, setRegras] = useState({ icms: [], ipi: [], pis: [], ibs: [] });
    const [loadingTabelas, setLoadingTabelas] = useState(true);

    const [modalInfo, setModalInfo] = useState({ isOpen: false, tipo: '', codigoInicial: '' });
    const [novoRegistro, setNovoRegistro] = useState({ codigo: '', descricao: '', tipo_operacao: 'SAIDA', aplicacao: 'INTERNA' });
    const [salvandoRegistro, setSalvandoRegistro] = useState(false);

    // Carrega TUDO quando a tela abre
    const fetchDadosFiscais = async () => {
        try {
            setLoadingTabelas(true);
            const [
                cfopRes, ncmRes, cestRes, cstRes, csosnRes, classTribRes,
                rIcms, rIpi, rPis, rIbs
            ] = await Promise.allSettled([
                api.get('/tabelas-fiscais/cfop'),
                api.get('/tabelas-fiscais/ncm'),
                api.get('/tabelas-fiscais/cest'),
                api.get('/tabelas-fiscais/cst'),
                api.get('/tabelas-fiscais/csosn'),
                api.get('/tabelas-fiscais/class-trib-ibs'),
                
                api.get('/tabelas-fiscais/regras/icms'),
                api.get('/tabelas-fiscais/regras/ipi'),
                api.get('/tabelas-fiscais/regras/pis-cofins'),
                api.get('/tabelas-fiscais/regras/ibs-cbs')
            ]);

            setTabelas({
                cfop: cfopRes.status === 'fulfilled' ? cfopRes.value.data : [],
                ncm: ncmRes.status === 'fulfilled' ? ncmRes.value.data : [],
                cest: cestRes.status === 'fulfilled' ? cestRes.value.data : [],
                cst: cstRes.status === 'fulfilled' ? cstRes.value.data : [],
                csosn: csosnRes.status === 'fulfilled' ? csosnRes.value.data : [],
                classTrib: classTribRes.status === 'fulfilled' ? classTribRes.value.data : []
            });

            setRegras({
                icms: rIcms.status === 'fulfilled' ? rIcms.value.data : [],
                ipi: rIpi.status === 'fulfilled' ? rIpi.value.data : [],
                pis: rPis.status === 'fulfilled' ? rPis.value.data : [],
                ibs: rIbs.status === 'fulfilled' ? rIbs.value.data : []
            });

        } catch (error) {
            console.error("Erro ao carregar dados fiscais:", error);
        } finally {
            setLoadingTabelas(false);
        }
    };

    useEffect(() => {
        fetchDadosFiscais();
    }, []);

    // 🟢 FUNÇÕES DE PREENCHIMENTO AUTOMÁTICO (MÁGICA)
    const handleApplyRegraIcms = (e) => {
        const rule = regras.icms.find(r => String(r.id) === String(e.target.value));
        if (rule && setFormData) {
            setFormData(prev => ({ ...prev, 
                cst_csosn_padrao: rule.cst_csosn || prev.cst_csosn_padrao,
                aliquota_icms: rule.aliquota !== undefined ? rule.aliquota : prev.aliquota_icms
            }));
            toast.success('Regra ICMS aplicada!');
        }
    };

    const handleApplyRegraIpi = (e) => {
        const rule = regras.ipi.find(r => String(r.id) === String(e.target.value));
        if (rule && setFormData) {
            setFormData(prev => ({ ...prev, aliquota_ipi: rule.aliquota !== undefined ? rule.aliquota : prev.aliquota_ipi }));
            toast.success('Regra IPI aplicada!');
        }
    };

    const handleApplyRegraPisCofins = (e) => {
        const rule = regras.pis.find(r => String(r.id) === String(e.target.value));
        if (rule && setFormData) {
            setFormData(prev => ({ ...prev, 
                aliquota_pis: rule.aliquota_pis !== undefined ? rule.aliquota_pis : prev.aliquota_pis,
                aliquota_cofins: rule.aliquota_cofins !== undefined ? rule.aliquota_cofins : prev.aliquota_cofins
            }));
            toast.success('Regra PIS/COFINS aplicada!');
        }
    };

    const handleApplyRegraIbsCbs = (e) => {
        const rule = regras.ibs.find(r => String(r.id) === String(e.target.value));
        if (rule && setFormData) {
            setFormData(prev => ({ ...prev, 
                cClassTrib: rule.cClassTrib || prev.cClassTrib,
                aliquota_ibs: rule.aliquota_ibs !== undefined ? rule.aliquota_ibs : prev.aliquota_ibs,
                aliquota_cbs: rule.aliquota_cbs !== undefined ? rule.aliquota_cbs : prev.aliquota_cbs
            }));
            toast.success('Regra IBS/CBS aplicada!');
        }
    };

    const fetchSugestaoTributaria = async () => {
        if (!formData.ncm || formData.ncm.length < 2) return toast.warning("Digite um NCM válido primeiro.");
        try {
            const { data: sug } = await api.get(`/tabelas-fiscais/sugerir?ncm=${formData.ncm}`);
            if(Object.keys(sug).length === 0) return toast.info("Nenhuma sugestão encontrada para este NCM.");
            
            setFormData(prev => ({ ...prev,
                cst_csosn_padrao: sug.cst_csosn_padrao || prev.cst_csosn_padrao,
                aliquota_icms: sug.aliquota_icms !== undefined ? sug.aliquota_icms : prev.aliquota_icms,
                aliquota_ipi: sug.aliquota_ipi !== undefined ? sug.aliquota_ipi : prev.aliquota_ipi,
                aliquota_pis: sug.aliquota_pis !== undefined ? sug.aliquota_pis : prev.aliquota_pis,
                aliquota_cofins: sug.aliquota_cofins !== undefined ? sug.aliquota_cofins : prev.aliquota_cofins,
                cClassTrib: sug.cClassTrib || prev.cClassTrib,
                aliquota_ibs: sug.aliquota_ibs !== undefined ? sug.aliquota_ibs : prev.aliquota_ibs,
                aliquota_cbs: sug.aliquota_cbs !== undefined ? sug.aliquota_cbs : prev.aliquota_cbs
            }));
            toast.success("Impostos preenchidos automaticamente com base no NCM!");
        } catch (e) { toast.error('Erro ao buscar sugestão.'); }
    };

    // 🟢 MODAL DE ADICIONAR NOVO REGISTRO
    const openAddModal = (tipo, codigoDigitado) => {
        setNovoRegistro({ codigo: codigoDigitado, descricao: '', tipo_operacao: 'SAIDA', aplicacao: 'INTERNA' });
        setModalInfo({ isOpen: true, tipo, codigoInicial: codigoDigitado });
    };

    const handleSaveNovoRegistro = async () => {
        if (!novoRegistro.codigo || !novoRegistro.descricao) return toast.warning("Preencha o código e a descrição.");
        setSalvandoRegistro(true);
        try {
            await api.post(`/tabelas-fiscais/${modalInfo.tipo}`, novoRegistro);
            toast.success(`${modalInfo.tipo.toUpperCase()} cadastrado com sucesso!`);
            await fetchDadosFiscais();
            const nomeDoCampo = modalInfo.tipo === 'cfop' ? 'cfop_padrao' : (modalInfo.tipo === 'csosn' || modalInfo.tipo === 'cst' ? 'cst_csosn_padrao' : modalInfo.tipo);
            handleChange({ target: { name: nomeDoCampo, value: novoRegistro.codigo } });
            setModalInfo({ isOpen: false, tipo: '', codigoInicial: '' });
        } catch (error) { toast.error(error.response?.data?.message || error.response?.data?.error || "Erro ao salvar."); } 
        finally { setSalvandoRegistro(false); }
    };

    const limparTudo = () => {
        if (!setFormData) return;
        setFormData(prev => ({
            ...prev, origem: '', cfop_padrao: '', cst_csosn_padrao: '', cClassTrib: '',
            aliquota_icms: '', aliquota_pis: '', aliquota_cofins: '', aliq_iss: '', aliquota_ibs: '', aliquota_cbs: '', aliquota_ipi: ''
        }));
        toast.info("Campos fiscais limpos.");
    };

    const flatSelectStyle = { height: '50px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px', backgroundColor: 'var(--bg-sidebar, #F4F6FA)', color: 'var(--text-secondary, #64748B)', fontSize: '14px', boxShadow: 'none' };
    const cstCsosnOptions = [...tabelas.csosn, ...tabelas.cst];

    return (
        <div className="mb-4 mt-2 position-relative">
            {loadingTabelas && (
                <div className="position-absolute w-100 h-100 z-1 d-flex align-items-center justify-content-center bg-white bg-opacity-75" style={{ top: 0, left: 0 }}>
                    <Spinner animation="border" variant="primary" /> <span className="ms-2 fw-bold text-primary">Sincronizando Tabelas da SEFAZ...</span>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-uppercase fw-bold ls-1 m-0" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <i className="bi bi-bank me-2"></i>Identificação Tributária (SEFAZ)
                </h6>
                <RedButton className="btn-sm px-3" onClick={limparTudo}><i className="bi bi-eraser me-1"></i> Limpar Dados</RedButton>
            </div>

            <Row className="g-3 mb-4">
                {!isServico && (
                    <>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">Origem da Mercadoria</Form.Label>
                                <Form.Select name="origem" value={formData.origem !== undefined ? formData.origem : ''} onChange={handleChange} style={flatSelectStyle}>
                                    <option value="0">0 - Nacional</option>
                                    <option value="1">1 - Estrangeira - Importação direta</option>
                                    <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                                    <option value="3">3 - Nacional, Conteúdo Imp. {'>'} 40%</option>
                                    <option value="4">4 - Nacional, conforme PPB</option>
                                    <option value="5">5 - Nacional, Conteúdo Imp. {'<'} 40%</option>
                                    <option value="8">8 - Nacional, importação {'>'} 70%</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={4}>
                            <SearchableFiscalInput label="NCM" name="ncm" placeholder="Buscar NCM..." value={formData.ncm} options={tabelas.ncm} onChange={handleChange} onAddNew={(txt) => openAddModal('ncm', txt)}>
                                {/* Botão de Sugestão pelo NCM */}
                                <Badge bg="warning" text="dark" style={{ cursor: 'pointer' }} onClick={fetchSugestaoTributaria} title="Preencher impostos automaticamente com base no NCM">
                                    <i className="bi bi-lightning-fill"></i> Autocompletar
                                </Badge>
                            </SearchableFiscalInput>
                        </Col>
                        <Col md={4}>
                            <SearchableFiscalInput label="CEST (Apenas ST)" name="cest" placeholder="Buscar CEST..." value={formData.cest} options={tabelas.cest} onChange={handleChange} onAddNew={(txt) => openAddModal('cest', txt)} />
                        </Col>
                        <Col md={4}>
                            <SearchableFiscalInput label="CFOP Padrão" name="cfop_padrao" placeholder="Buscar CFOP..." value={formData.cfop_padrao} options={tabelas.cfop} onChange={handleChange} onAddNew={(txt) => openAddModal('cfop', txt)} />
                        </Col>
                    </>
                )}
            </Row>

            <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />

            {/* 🟢 BLOCO MÁGICO: REGRAS TRIBUTÁRIAS */}
            {!isServico && (
                <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: 'rgba(10, 132, 255, 0.05)', border: '1px solid rgba(10, 132, 255, 0.2)' }}>
                    <h6 className="fw-bold mb-3" style={{ fontSize: '13px', color: '#0A84FF' }}>
                        <i className="bi bi-magic me-2"></i>Aplicar Regra Tributária Pronta
                    </h6>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-secondary mb-1">Regra ICMS</Form.Label>
                            <Form.Select style={flatSelectStyle} onChange={handleApplyRegraIcms}>
                                <option value="">Selecione...</option>
                                {regras.icms.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-secondary mb-1">Regra IPI</Form.Label>
                            <Form.Select style={flatSelectStyle} onChange={handleApplyRegraIpi}>
                                <option value="">Selecione...</option>
                                {regras.ipi.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-secondary mb-1">Regra PIS/COFINS</Form.Label>
                            <Form.Select style={flatSelectStyle} onChange={handleApplyRegraPisCofins}>
                                <option value="">Selecione...</option>
                                {regras.pis.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-semibold text-secondary mb-1">Regra IBS/CBS</Form.Label>
                            <Form.Select style={flatSelectStyle} onChange={handleApplyRegraIbsCbs}>
                                <option value="">Selecione...</option>
                                {regras.ibs.map(r => <option key={r.id} value={r.id}>{r.nome_regra}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                </div>
            )}

            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-percent me-2"></i>Situação Tributária & Alíquotas
            </h6>
            
            <Row className="g-3">
                {isServico ? (
                    <Col md={6}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíquota ISS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliq_iss" value={formData.aliq_iss || ''} onChange={handleChange} placeholder="Ex: 2.5" /></Form.Group></Col>
                ) : (
                    <>
                        <Col md={6}>
                            <SearchableFiscalInput label="CST / CSOSN Padrão (ICMS)" name="cst_csosn_padrao" placeholder="Buscar Código (Ex: 102)..." value={formData.cst_csosn_padrao} options={cstCsosnOptions} onChange={handleChange} onAddNew={(txt) => openAddModal('csosn', txt)} />
                        </Col>
                        <Col md={6}>
                            <SearchableFiscalInput label="cClassTrib (IBS/CBS)" name="cClassTrib" placeholder="Buscar Classificação Tributária..." value={formData.cClassTrib} options={tabelas.classTrib} onChange={handleChange} />
                        </Col>
                        <Col md={3}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíq. ICMS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_icms" value={formData.aliquota_icms || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíq. PIS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_pis" value={formData.aliquota_pis || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíq. COFINS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_cofins" value={formData.aliquota_cofins || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíq. IPI (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_ipi" value={formData.aliquota_ipi || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                    </>
                )}
            </Row>

            <div className="p-3 rounded-4 mt-4" style={{ backgroundColor: 'rgba(100, 116, 139, 0.05)', border: '1px solid rgba(100, 116, 139, 0.15)' }}>
                <Row className="g-3">
                    <Col md={6}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">IBS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_ibs" value={formData.aliquota_ibs || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">CBS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliquota_cbs" value={formData.aliquota_cbs || ''} onChange={handleChange} placeholder="0.00" /></Form.Group></Col>
                </Row>
            </div>

            {/* 🟢 MODAL DE CADASTRO RÁPIDO */}
            <Modal show={modalInfo.isOpen} onHide={() => setModalInfo({ isOpen: false, tipo: '', codigoInicial: '' })} centered>
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold fs-5">Adicionar Novo {modalInfo.tipo.toUpperCase()}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={12}><Form.Label className="fw-semibold small text-dark mb-1">Código</Form.Label><CustomInput type="text" value={novoRegistro.codigo} onChange={(e) => setNovoRegistro({...novoRegistro, codigo: e.target.value})} placeholder="Ex: 5102" /></Col>
                        <Col md={12}><Form.Label className="fw-semibold small text-dark mb-1">Descrição</Form.Label><CustomInput type="text" value={novoRegistro.descricao} onChange={(e) => setNovoRegistro({...novoRegistro, descricao: e.target.value})} placeholder="Descreva o uso deste código..." /></Col>
                        {modalInfo.tipo === 'cfop' && (
                            <><Col md={6}><Form.Label className="fw-semibold small text-dark mb-1">Tipo da Operação</Form.Label><Form.Select style={flatSelectStyle} value={novoRegistro.tipo_operacao} onChange={(e) => setNovoRegistro({...novoRegistro, tipo_operacao: e.target.value})}><option value="SAIDA">Saída</option><option value="ENTRADA">Entrada</option></Form.Select></Col><Col md={6}><Form.Label className="fw-semibold small text-dark mb-1">Aplicação</Form.Label><Form.Select style={flatSelectStyle} value={novoRegistro.aplicacao} onChange={(e) => setNovoRegistro({...novoRegistro, aplicacao: e.target.value})}><option value="INTERNA">Interna (Estadual)</option><option value="INTERESTADUAL">Interestadual</option><option value="EXTERIOR">Exterior</option></Form.Select></Col></>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <LightButton onClick={() => setModalInfo({ isOpen: false, tipo: '', codigoInicial: '' })}>Cancelar</LightButton>
                    <CtaButton onClick={handleSaveNovoRegistro} disabled={salvandoRegistro}>{salvandoRegistro ? <Spinner size="sm" /> : 'Salvar Registro'}</CtaButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProductFiscal;