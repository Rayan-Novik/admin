import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { CustomInput } from '../../ui/SearchInput/SearchInput';

// 🟢 Importação correta: Letras C, B, R e B maiúsculas!
import { CtaButton, RedButton } from '../../ui/buttons/CtaButton';

const ProductFiscal = ({ formData, handleChange, setFormData }) => {
    const isServico = formData.tipo_produto === 'SERVICO';

    const aplicarPerfil = (perfil) => {
        if (!setFormData) return;

        if (perfil === 'revenda_simples') {
            setFormData(prev => ({
                ...prev, origem: '0', cfop_padrao: '5102', cst_icms: '102', cst_pis_cofins: '99',
                cst_ipi: '99', aliq_icms: '0', aliq_pis: '0', aliq_cofins: '0'
            }));
            toast.success("Perfil 'Revenda (Simples Nacional)' aplicado!");
        } 
        else if (perfil === 'revenda_st') {
            setFormData(prev => ({
                ...prev, origem: '0', cfop_padrao: '5405', cst_icms: '500', cst_pis_cofins: '99',
                cst_ipi: '99', aliq_icms: '0', aliq_pis: '0', aliq_cofins: '0'
            }));
            toast.success("Perfil 'Revenda c/ ST' aplicado!");
        } 
        else if (perfil === 'servico_simples') {
            setFormData(prev => ({ ...prev, aliq_iss: '2.00' }));
            toast.success("Perfil 'Serviço' aplicado! Verifique a alíquota ISS do seu município.");
        } 
        else if (perfil === 'limpar') {
            setFormData(prev => ({
                ...prev, origem: '', cfop_padrao: '', cst_icms: '', cst_pis_cofins: '',
                cst_ipi: '', aliq_icms: '', aliq_pis: '', aliq_cofins: '', aliq_iss: '', aliq_ibs: '', aliq_cbs: ''
            }));
            toast.info("Campos fiscais limpos para personalização manual.");
        }
    };

    const flatSelectStyle = {
        height: '50px', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '14px',
        backgroundColor: 'var(--bg-sidebar, #F4F6FA)', color: 'var(--text-secondary, #64748B)',
        fontSize: '14px', boxShadow: 'none'
    };

    return (
        <div className="mb-4 mt-2">
            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-bank me-2"></i>Identificação Tributária (SEFAZ)
            </h6>
            
            <div className="p-3 rounded-4 mb-4" style={{ backgroundColor: 'rgba(100, 116, 139, 0.05)', border: '1px solid rgba(100, 116, 139, 0.15)' }}>
                <small className="d-block" style={{ color: 'var(--text-secondary)' }}>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Dados obrigatórios para emissão de Notas Fiscais. Use os Perfis Rápidos abaixo para preenchimento automático.
                </small>
            </div>

            {/* PERFIS RÁPIDOS */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                {!isServico ? (
                    <>
                        {/* 🟢 Trocado para CtaButton com B maiúsculo */}
                        <CtaButton onClick={() => aplicarPerfil('revenda_simples')}>
                            <i className="bi bi-cart-check me-1"></i> Revenda (Simples)
                        </CtaButton>
                        <CtaButton onClick={() => aplicarPerfil('revenda_st')}>
                            <i className="bi bi-tags me-1"></i> Revenda c/ ST
                        </CtaButton>
                    </>
                ) : (
                    <CtaButton color="#0A84FF" onClick={() => aplicarPerfil('servico_simples')}>
                        <i className="bi bi-tools me-1"></i> Serviço (Simples)
                    </CtaButton>
                )}
                {/* 🟢 Trocado para RedButton com B maiúsculo */}
                <RedButton onClick={() => aplicarPerfil('limpar')}>
                    <i className="bi bi-eraser me-1"></i> Limpar
                </RedButton>
            </div>

            <Row className="g-3 mb-4">
                {!isServico && (
                    <>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">Origem da Mercadoria</Form.Label>
                                <Form.Select name="origem" value={formData.origem || ''} onChange={handleChange} style={flatSelectStyle}>
                                    <option value="0">0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8</option>
                                    <option value="1">1 - Estrangeira - Importação direta</option>
                                    <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                                    <option value="3">3 - Nacional, mercadoria ou bem com Conteúdo de Importação {'>'} 40%</option>
                                    <option value="4">4 - Nacional, cuja produção tenha sido feita de acordo com o PPB</option>
                                    <option value="5">5 - Nacional, mercadoria com Conteúdo de Importação {'<'} 40%</option>
                                    <option value="8">8 - Nacional, importação superior a 70%</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">NCM</Form.Label>
                                <CustomInput name="ncm" value={formData.ncm || ''} onChange={handleChange} placeholder="Ex: 85171231" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">CEST (Opcional)</Form.Label>
                                <CustomInput name="cest" value={formData.cest || ''} onChange={handleChange} placeholder="Ex: 2105300" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold small text-dark mb-1">CFOP Padrão (Saída)</Form.Label>
                                <CustomInput name="cfop_padrao" value={formData.cfop_padrao || ''} onChange={handleChange} placeholder="Ex: 5102" />
                            </Form.Group>
                        </Col>
                    </>
                )}
            </Row>

            <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />

            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-percent me-2"></i>Situação Tributária & Alíquotas
            </h6>
            
            <Row className="g-3">
                {isServico ? (
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small text-dark mb-1">Alíquota ISS (%)</Form.Label>
                            <CustomInput type="number" step="0.01" name="aliq_iss" value={formData.aliq_iss || ''} onChange={handleChange} placeholder="Ex: 2.5" />
                        </Form.Group>
                    </Col>
                ) : (
                    <>
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">CST/CSOSN (ICMS)</Form.Label><CustomInput name="cst_icms" value={formData.cst_icms || ''} onChange={handleChange} placeholder="Ex: 102 ou 400" /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">CST (PIS/COFINS)</Form.Label><CustomInput name="cst_pis_cofins" value={formData.cst_pis_cofins || ''} onChange={handleChange} placeholder="Ex: 49 ou 99" /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">CST (IPI)</Form.Label><CustomInput name="cst_ipi" value={formData.cst_ipi || ''} onChange={handleChange} placeholder="Ex: 99" /></Form.Group></Col>
                        
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíquota ICMS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliq_icms" value={formData.aliq_icms || ''} onChange={handleChange} placeholder="Ex: 18.00" /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíquota PIS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliq_pis" value={formData.aliq_pis || ''} onChange={handleChange} placeholder="Ex: 1.65" /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label className="fw-semibold small text-dark mb-1">Alíquota COFINS (%)</Form.Label><CustomInput type="number" step="0.01" name="aliq_cofins" value={formData.aliq_cofins || ''} onChange={handleChange} placeholder="Ex: 7.60" /></Form.Group></Col>
                    </>
                )}
            </Row>

            <div className="p-3 rounded-4 mt-4" style={{ backgroundColor: 'rgba(10, 132, 255, 0.05)', border: '1px solid rgba(10, 132, 255, 0.15)' }}>
                <h6 className="fw-bold mb-2" style={{ fontSize: '13px', color: '#0A84FF' }}><i className="bi bi-stars me-1"></i>Reforma Tributária (Preparação)</h6>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small text-dark mb-1">IBS (%)</Form.Label>
                            <CustomInput type="number" step="0.01" name="aliq_ibs" value={formData.aliq_ibs || ''} onChange={handleChange} placeholder="0.00" />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small text-dark mb-1">CBS (%)</Form.Label>
                            <CustomInput type="number" step="0.01" name="aliq_cbs" value={formData.aliq_cbs || ''} onChange={handleChange} placeholder="0.00" />
                        </Form.Group>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ProductFiscal;