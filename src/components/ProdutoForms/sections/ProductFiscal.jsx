import React from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import UiField from '../../ui/UiField';

const ProductFiscal = ({ formData, handleChange, setFormData }) => {
    const isServico = formData.tipo_produto === 'SERVICO';

    // 🟢 FUNÇÃO MÁGICA: Agora usa o setFormData para atualizar tudo de uma vez
    const aplicarPerfil = (perfil) => {
        if (!setFormData) {
            console.error("setFormData não foi passado para o ProductFiscal!");
            return;
        }

        if (perfil === 'revenda_simples') {
            setFormData(prev => ({
                ...prev,
                origem: '0',
                cfop_padrao: '5102',
                cst_icms: '102', // CSOSN 102
                cst_pis_cofins: '99',
                cst_ipi: '99',
                aliq_icms: '0',
                aliq_pis: '0',
                aliq_cofins: '0'
            }));
            toast.success("Perfil 'Revenda (Simples Nacional)' aplicado com sucesso!");
        } 
        else if (perfil === 'revenda_st') {
            setFormData(prev => ({
                ...prev,
                origem: '0',
                cfop_padrao: '5405',
                cst_icms: '500', // CSOSN 500
                cst_pis_cofins: '99',
                cst_ipi: '99',
                aliq_icms: '0',
                aliq_pis: '0',
                aliq_cofins: '0'
            }));
            toast.success("Perfil 'Revenda c/ ST' aplicado com sucesso!");
        } 
        else if (perfil === 'servico_simples') {
            setFormData(prev => ({ ...prev, aliq_iss: '2.00' }));
            toast.success("Perfil 'Serviço' aplicado! Verifique a alíquota ISS do seu município.");
        } 
        else if (perfil === 'limpar') {
            setFormData(prev => ({
                ...prev,
                origem: '', cfop_padrao: '', cst_icms: '', cst_pis_cofins: '',
                cst_ipi: '', aliq_icms: '', aliq_pis: '', aliq_cofins: '',
                aliq_iss: '', aliq_ibs: '', aliq_cbs: ''
            }));
            toast.info("Campos fiscais limpos para personalização manual.");
        }
    };

    return (
        <div className="p-4 fade-in">
            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-bank me-2"></i>Identificação Tributária (SEFAZ)
            </h6>
            
            <Alert variant="secondary" className="small border-0 shadow-sm mb-4">
                <i className="bi bi-info-circle-fill me-2"></i>
                Estes dados são obrigatórios para a emissão de Notas Fiscais ({isServico ? 'NFS-e' : 'NF-e / NFC-e'}).
                Para personalizar opções, preencha manualmente os campos abaixo ou use os Perfis Rápidos.
            </Alert>

            {/* 🟢 PERFIS RÁPIDOS */}
            <div className="bg-light p-3 rounded-3 mb-4 border" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="fw-bold mb-2" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                    <i className="bi bi-magic text-warning me-2"></i>Perfis Rápidos (Preenchimento Automático)
                </h6>
                <div className="d-flex flex-wrap gap-2 mt-3">
                    {!isServico ? (
                        <>
                            <Button variant="primary" size="sm" className="fw-medium" onClick={() => aplicarPerfil('revenda_simples')}>
                                <i className="bi bi-cart-check me-1"></i> Revenda Comum (Simples Nac.)
                            </Button>
                            <Button variant="info" size="sm" className="fw-medium text-white" onClick={() => aplicarPerfil('revenda_st')}>
                                <i className="bi bi-tags me-1"></i> Revenda c/ ST
                            </Button>
                        </>
                    ) : (
                        <Button variant="primary" size="sm" className="fw-medium" onClick={() => aplicarPerfil('servico_simples')}>
                            <i className="bi bi-tools me-1"></i> Serviço (Simples Nac.)
                        </Button>
                    )}
                    <Button variant="outline-danger" size="sm" className="fw-medium" onClick={() => aplicarPerfil('limpar')}>
                        <i className="bi bi-eraser me-1"></i> Limpar para Personalizar
                    </Button>
                </div>
            </div>

            <Row className="g-3 mb-4">
                {!isServico && (
                    <>
                        <Col md={12}>
                            <UiField 
                                label="Origem da Mercadoria" 
                                type="select" 
                                name="origem" 
                                value={formData.origem || ''} 
                                onChange={handleChange}
                                options={[
                                    { value: '0', label: '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8' },
                                    { value: '1', label: '1 - Estrangeira - Importação direta' },
                                    { value: '2', label: '2 - Estrangeira - Adquirida no mercado interno' },
                                    { value: '3', label: '3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40%' },
                                    { value: '4', label: '4 - Nacional, cuja produção tenha sido feita de acordo com o PPB' },
                                    { value: '5', label: '5 - Nacional, mercadoria com Conteúdo de Importação inferior a 40%' },
                                    { value: '8', label: '8 - Nacional, importação superior a 70%' },
                                ]}
                            />
                        </Col>
                        <Col md={4}>
                            <UiField label="NCM" name="ncm" value={formData.ncm || ''} onChange={handleChange} placeholder="Ex: 85171231" hint="Obrigatório. Apenas números (8 dígitos)." />
                        </Col>
                        <Col md={4}>
                            <UiField label="CEST (Opcional)" name="cest" value={formData.cest || ''} onChange={handleChange} placeholder="Ex: 2105300" hint="Usado para Substituição Tributária (7 dígitos)." />
                        </Col>
                        <Col md={4}>
                            <UiField label="CFOP Padrão (Saída)" name="cfop_padrao" value={formData.cfop_padrao || ''} onChange={handleChange} placeholder="Ex: 5102" hint="Ex: 5102 (Estado), 6102 (Fora do Estado)" />
                        </Col>
                    </>
                )}
            </Row>

            <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />

            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-percent me-2"></i>Situação Tributária & Alíquotas Personalizadas
            </h6>
            
            <Row className="g-3">
                {isServico ? (
                    <>
                        <Col md={6}>
                            <UiField label="Alíquota ISS (%)" type="number" step="0.01" name="aliq_iss" value={formData.aliq_iss || ''} onChange={handleChange} placeholder="Ex: 2.5" />
                        </Col>
                    </>
                ) : (
                    <>
                        <Col md={4}>
                            <UiField label="CST / CSOSN (ICMS)" name="cst_icms" value={formData.cst_icms || ''} onChange={handleChange} placeholder="Ex: 102 ou 400" />
                        </Col>
                        <Col md={4}>
                            <UiField label="CST (PIS/COFINS)" name="cst_pis_cofins" value={formData.cst_pis_cofins || ''} onChange={handleChange} placeholder="Ex: 49 ou 99" />
                        </Col>
                        <Col md={4}>
                            <UiField label="CST (IPI)" name="cst_ipi" value={formData.cst_ipi || ''} onChange={handleChange} placeholder="Ex: 99" />
                        </Col>

                        <Col md={4}>
                            <UiField label="Alíquota ICMS (%)" type="number" step="0.01" name="aliq_icms" value={formData.aliq_icms || ''} onChange={handleChange} placeholder="Ex: 18.00" />
                        </Col>
                        <Col md={4}>
                            <UiField label="Alíquota PIS (%)" type="number" step="0.01" name="aliq_pis" value={formData.aliq_pis || ''} onChange={handleChange} placeholder="Ex: 1.65" />
                        </Col>
                        <Col md={4}>
                            <UiField label="Alíquota COFINS (%)" type="number" step="0.01" name="aliq_cofins" value={formData.aliq_cofins || ''} onChange={handleChange} placeholder="Ex: 7.60" />
                        </Col>
                    </>
                )}
            </Row>

            <div className="bg-primary bg-opacity-10 p-3 rounded-3 mt-4 border border-primary border-opacity-25">
                <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '13px' }}><i className="bi bi-stars me-1"></i>Reforma Tributária (Preparação)</h6>
                <Row className="g-3">
                    <Col md={6}>
                        <UiField label="IBS - Imposto Bens/Serviços (%)" type="number" step="0.01" name="aliq_ibs" value={formData.aliq_ibs || ''} onChange={handleChange} placeholder="0.00" hint="Deixe 0 se ainda não estiver em vigor" />
                    </Col>
                    <Col md={6}>
                        <UiField label="CBS - Contribuição Bens/Serviços (%)" type="number" step="0.01" name="aliq_cbs" value={formData.aliq_cbs || ''} onChange={handleChange} placeholder="0.00" hint="Deixe 0 se ainda não estiver em vigor" />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ProductFiscal;