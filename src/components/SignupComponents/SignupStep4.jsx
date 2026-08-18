import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import axios from 'axios';

export const SignupStep4 = ({ formData, setFormData, handlePrevStep, submitHandler, loading }) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const diasSemana = [
    { id: 0, label: 'Dom' }, { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' }, { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }
  ];

  const palette = { ink: '#0F172A', sub: '#64748B', line: '#E5EAF1' };
  const inputStyle = { background: '#F4F6FA', border: `1px solid ${palette.line}`, borderRadius: 12, height: 42, fontSize: 14, color: palette.ink, boxShadow: 'none' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: palette.sub, marginBottom: 4 };

  // Efeitos de foco para inputs normais
  const focusProps = {
    onFocus: (e) => { e.currentTarget.style.borderColor = formData.primaryColor; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = `0 0 0 3px ${formData.primaryColor}20`; },
    onBlur: (e) => { e.currentTarget.style.borderColor = palette.line; e.currentTarget.style.background = '#F4F6FA'; e.currentTarget.style.boxShadow = 'none'; }
  };

  useEffect(() => {
    if (formData.gatewayProvider !== 'OFFLINE') {
      setFormData(prev => ({ ...prev, gatewayProvider: 'OFFLINE' }));
    }
  }, [formData.gatewayProvider, setFormData]);

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
                <Form.Control type="text" required value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} onBlur={handleCepBlur} style={inputStyle} {...focusProps} />
                {loadingCep && <Spinner size="sm" className="position-absolute" style={{ right: 10, top: 12, color: formData.primaryColor }} />}
              </div>
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Logradouro</Form.Label>
              <Form.Control type="text" required value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} style={inputStyle} {...focusProps} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label style={labelStyle}>Número</Form.Label>
              <Form.Control type="text" required value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} style={inputStyle} {...focusProps} />
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Bairro</Form.Label>
              <Form.Control type="text" required value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} style={inputStyle} {...focusProps} />
            </Form.Group>
          </Col>
          <Col md={8}>
            <Form.Group>
              <Form.Label style={labelStyle}>Cidade</Form.Label>
              <Form.Control type="text" required value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} style={inputStyle} {...focusProps} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label style={labelStyle}>UF</Form.Label>
              <Form.Control type="text" maxLength="2" required value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} style={inputStyle} {...focusProps} />
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
              <Form.Control type="time" value={formData.horaAbertura} onChange={e => setFormData({ ...formData, horaAbertura: e.target.value })} style={inputStyle} {...focusProps} />
            </Form.Group>
          </Col>
          <Col xs={6}>
            <Form.Group>
              <Form.Label style={labelStyle}>Fecha às (Opcional)</Form.Label>
              <Form.Control type="time" value={formData.horaFechamento} onChange={e => setFormData({ ...formData, horaFechamento: e.target.value })} style={inputStyle} {...focusProps} />
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
                    fontSize: '13px', border: `1px solid ${isSelected ? formData.primaryColor : palette.line}`,
                    backgroundColor: isSelected ? formData.primaryColor : '#F4F6FA',
                    color: isSelected ? '#fff' : palette.sub, transition: 'all 0.2s'
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

      <div className="d-flex gap-3 mt-4 pt-3 border-top" style={{ borderColor: palette.line }}>
        <Button variant="light" onClick={handlePrevStep} className="rounded-4 fw-bold px-4 border-0" style={{ backgroundColor: '#F4F6FA', color: palette.sub, height: '50px' }}>
          <i className="bi bi-arrow-left"></i>
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-grow-1 rounded-4 fw-bold text-white border-0 shadow-sm d-flex justify-content-center align-items-center gap-2"
          style={{ backgroundColor: formData.primaryColor, height: '50px', boxShadow: `0 10px 24px -8px ${formData.primaryColor}80` }}
        >
          {loading ? <Spinner as="span" animation="border" size="sm" /> : <>Finalizar e Criar Loja <i className="bi bi-rocket-takeoff-fill"></i></>}
        </Button>
      </div>
    </Form>
  );
};