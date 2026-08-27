import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
// Importando nossos componentes universais
import { CustomInput } from '../ui/SearchInput/SearchInput';
import { CtaButton, LightButton } from '../ui/buttons/CtaButton';

export const SignupStep4 = ({ formData, setFormData, handlePrevStep, submitHandler, loading }) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const diasSemana = [
    { id: 0, label: 'Dom' }, { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' }, { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }
  ];

  const palette = { ink: '#0F172A', sub: '#64748B', line: '#E5EAF1' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: palette.sub, marginBottom: 4 };

  // Garante que o gateway seja mantido como OFFLINE neste momento
  useEffect(() => {
    if (formData.gatewayProvider !== 'OFFLINE') {
      setFormData(prev => ({ ...prev, gatewayProvider: 'OFFLINE' }));
    }
  }, [formData.gatewayProvider, setFormData]);

  // Busca do CEP automática
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      setLoadingCep(true);
      try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro CEP", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Botões de dias da semana
  const toggleDia = (id) => {
    setFormData(prev => {
      const dias = prev.diasFuncionamento.includes(id)
        ? prev.diasFuncionamento.filter(d => d !== id)
        : [...prev.diasFuncionamento, id].sort();
      return { ...prev, diasFuncionamento: dias };
    });
  };

  return (
    <Form onSubmit={submitHandler}>
      <div className="text-center mb-4 mt-2">
        <h5 className="fw-bold mb-1" style={{ color: palette.ink }}>Localização e Horários</h5>
        <p className="small" style={{ color: palette.sub }}>Falta pouco! Configure o funcionamento da sua loja.</p>
      </div>

      <div className="p-4 rounded-4 mb-4 border-0" style={{ backgroundColor: '#fff', border: `1px solid ${palette.line}`, boxShadow: '0 4px 12px rgba(15,23,42,0.03)' }}>
        <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: palette.ink, fontSize: '14px' }}>
          <i className="bi bi-geo-alt-fill me-2" style={{ color: formData.primaryColor }}></i> Endereço da Loja
        </h6>
        
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label style={labelStyle}>CEP</Form.Label>
              <div className="position-relative">
                <CustomInput 
                  required 
                  value={formData.cep || ''} 
                  onChange={e => setFormData({ ...formData, cep: e.target.value })} 
                  onBlur={handleCepBlur} 
                  placeholder="00000-000"
                />
                {loadingCep && <Spinner size="sm" className="position-absolute" style={{ right: 15, top: 15, color: formData.primaryColor, zIndex: 10 }} />}
              </div>
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Logradouro</Form.Label>
              <CustomInput 
                required 
                value={formData.logradouro || ''} 
                onChange={e => setFormData({ ...formData, logradouro: e.target.value })} 
                placeholder="Rua, Avenida, etc."
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label style={labelStyle}>Número</Form.Label>
              <CustomInput 
                required 
                value={formData.numero || ''} 
                onChange={e => setFormData({ ...formData, numero: e.target.value })} 
                placeholder="Ex: 123"
              />
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Bairro</Form.Label>
              <CustomInput 
                required 
                value={formData.bairro || ''} 
                onChange={e => setFormData({ ...formData, bairro: e.target.value })} 
                placeholder="Seu Bairro"
              />
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Cidade</Form.Label>
              <CustomInput 
                required 
                value={formData.cidade || ''} 
                onChange={e => setFormData({ ...formData, cidade: e.target.value })} 
                placeholder="Sua Cidade"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label style={labelStyle}>UF</Form.Label>
              <CustomInput 
                required 
                maxLength="2" 
                value={formData.estado || ''} 
                onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })} 
                placeholder="Ex: SP"
              />
            </Form.Group>
          </Col>
        </Row>

        <hr className="my-4" style={{ borderColor: palette.line }} />

        <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: palette.ink, fontSize: '14px' }}>
          <i className="bi bi-clock-fill me-2" style={{ color: formData.primaryColor }}></i> Horários e Dias
        </h6>
        
        <Row className="g-3 mb-3">
          <Col xs={6}>
            <Form.Group>
              <Form.Label style={labelStyle}>Abre às (Opcional)</Form.Label>
              <CustomInput 
                type="time" 
                value={formData.horaAbertura || ''} 
                onChange={e => setFormData({ ...formData, horaAbertura: e.target.value })} 
              />
            </Form.Group>
          </Col>
          <Col xs={6}>
            <Form.Group>
              <Form.Label style={labelStyle}>Fecha às (Opcional)</Form.Label>
              <CustomInput 
                type="time" 
                value={formData.horaFechamento || ''} 
                onChange={e => setFormData({ ...formData, horaFechamento: e.target.value })} 
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group>
          <Form.Label style={labelStyle}>Dias que a loja abre</Form.Label>
          <div className="d-flex gap-2 flex-wrap mt-1">
            {diasSemana.map(dia => {
              const isSelected = formData.diasFuncionamento.includes(dia.id);
              return (
                <Button 
                  key={dia.id}
                  variant="none"
                  className="rounded-3 px-3 py-1 fw-medium"
                  style={{ 
                    fontSize: '13px', 
                    border: `1px solid ${isSelected ? formData.primaryColor : palette.line}`,
                    backgroundColor: isSelected ? formData.primaryColor : '#F4F6FA',
                    color: isSelected ? '#fff' : palette.sub, 
                    transition: 'all 0.2s'
                  }}
                  onClick={() => toggleDia(dia.id)}
                >
                  {dia.label}
                </Button>
              )
            })}
          </div>
        </Form.Group>
      </div>

      <div className="p-3 rounded-4 d-flex gap-3 align-items-start" style={{ backgroundColor: `${formData.primaryColor}10` }}>
        <i className="bi bi-cash-coin fs-4" style={{ color: formData.primaryColor }}></i>
        <div>
          <h6 className="fw-bold mb-1" style={{ color: formData.primaryColor, fontSize: '13px' }}>Pagamento Físico Inicial</h6>
          <p className="small mb-0" style={{ color: formData.primaryColor, opacity: 0.8, fontSize: '12px' }}>
            Sua loja iniciará aceitando pagamentos na entrega (Dinheiro, Máquina, PIX local). O pagamento online via Mercado Pago pode ser ativado depois pelo Painel.
          </p>
        </div>
      </div>

      {/* --- BOTÕES FINAIS --- */}
      <div className="d-flex gap-3 mt-4 pt-3 border-top" style={{ borderColor: palette.line }}>
        <LightButton onClick={handlePrevStep} className="px-4">
          <i className="bi bi-arrow-left"></i>
        </LightButton>
        
        <CtaButton 
          type="submit" 
          disabled={loading} 
          color={formData.primaryColor}
          className="flex-grow-1 d-flex justify-content-center align-items-center gap-2"
        >
          {loading ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            <>Finalizar e Criar Loja <i className="bi bi-rocket-takeoff-fill"></i></>
          )}
        </CtaButton>
      </div>
    </Form>
  );
};