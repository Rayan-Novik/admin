import React from 'react';
import { Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { CtaButton } from '../ui/buttons/CtaButton';
import { CustomInput } from '../ui/SearchInput/SearchInput';

export const SignupStep1 = ({
  formData,
  setFormData,
  planos,
  loadingPlanos,
  // showPassword e setShowPassword não são mais necessários aqui!
  handleNextStep
}) => {
  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    const limpo = value.replace(/\D/g, ''); 
    let formatado = limpo;
    if (limpo.length <= 11) {
      formatado = limpo.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      formatado = limpo.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18); 
    }
    setFormData(prev => ({ ...prev, documento: formatado }));
  };

  const handleTelefoneChange = (e) => {
    const value = e.target.value;
    const limpo = value.replace(/\D/g, '');
    let formatado = limpo;
    if (limpo.length <= 10) {
      formatado = limpo.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      formatado = limpo.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
    }
    setFormData(prev => ({ ...prev, telefone: formatado }));
  };

  /* ---------- ESTILOS INLINE MANTIDOS APENAS PARA OS CARDS DE PLANO ---------- */
  const palette = {
    brand: formData.primaryColor || '#0A84FF',
    ink: '#0F172A',
    sub: '#64748B',
    line: '#E5EAF1',
  };

  const styles = {
    label: { fontSize: 12, fontWeight: 600, color: palette.sub, textTransform: 'none', marginBottom: 6 },
  };

  return (
    <Form onSubmit={handleNextStep}>
      <Form.Group className="mb-4 mt-2">
        <Form.Label style={styles.label}>Escolha seu Plano</Form.Label>
        {loadingPlanos ? (
          <div className="text-center py-4 bg-light rounded-4 border border-light-subtle">
            <Spinner animation="border" style={{ color: palette.brand }} size="sm" />
          </div>
        ) : (
          <Row className="g-3 mt-1 align-items-stretch">
            {planos.map((p) => {
              const isSelected = formData.planoSelecionado === p.nome;
              const borderColor = isSelected ? palette.brand : (p.destaque ? `${palette.brand}60` : palette.line);
              
              return (
                <Col xs={12} sm={planos.length === 2 ? 6 : 4} key={p.id}>
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, planoSelecionado: p.nome }))}
                    className="p-3 h-100 rounded-4 position-relative d-flex flex-column align-items-center"
                    style={{ 
                      cursor: 'pointer', transition: 'all 0.3s ease',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: isSelected ? `${palette.brand}08` : '#ffffff',
                      boxShadow: isSelected ? `0 0 0 2px ${palette.brand}` : '0 2px 8px rgba(15,23,42,0.02)'
                    }}
                  >
                    {p.destaque && (
                      <div className="position-absolute top-0 start-50 translate-middle badge rounded-pill px-3 py-1 shadow-sm" style={{ backgroundColor: palette.brand, fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                        MAIS POPULAR
                      </div>
                    )}

                    {isSelected && (
                      <div className="position-absolute" style={{ top: '10px', right: '12px', color: palette.brand }}>
                        <i className="bi bi-check-circle-fill fs-5"></i>
                      </div>
                    )}

                    <div className="text-center mt-2 w-100">
                      <h6 className="fw-bold mb-1" style={{ color: isSelected ? palette.brand : palette.ink, fontSize: '0.9rem' }}>
                        {p.nome}
                      </h6>
                      
                      <div className="fw-bold fs-5 mb-1" style={{ color: palette.ink }}>
                        {Number(p.preco_mensal) === 0 ? 'Grátis' : `R$ ${Number(p.preco_mensal).toFixed(2).replace('.', ',')}`}
                        {Number(p.preco_mensal) > 0 && <span style={{ color: palette.sub, fontSize: '0.7rem', fontWeight: 500 }}>/mês</span>}
                      </div>

                      {p.dias_teste > 0 && (
                        <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill mb-2" style={{ fontSize: '0.7rem' }}>
                          🎁 {p.dias_teste} Dias Grátis
                        </div>
                      )}
                    </div>

                    <div className="w-100 mt-2 pt-3 border-top flex-grow-1 d-flex flex-column" style={{ borderColor: palette.line }}>
                      <ul className="list-unstyled mb-0 text-start" style={{ fontSize: '0.75rem', color: palette.sub, fontWeight: 500 }}>
                        <li className="mb-2 d-flex align-items-start">
                          <i className="bi bi-check2 me-2 fs-6" style={{ color: palette.brand, marginTop: '-2px' }}></i> 
                          <span>{p.limite_produtos >= 9999 ? 'Cadastro ilimitado' : `Até ${p.limite_produtos} produtos`}</span>
                        </li>
                        <li className="mb-2 d-flex align-items-start">
                          <i className="bi bi-check2 me-2 fs-6" style={{ color: palette.brand, marginTop: '-2px' }}></i> 
                          <span>{p.limite_usuarios >= 99 ? 'Equipe ilimitada' : `Até ${p.limite_usuarios} vendedores`}</span>
                        </li>
                        <li className="mb-2 d-flex align-items-start">
                          <i className="bi bi-check2 me-2 fs-6" style={{ color: palette.brand, marginTop: '-2px' }}></i> 
                          <span>Gateway de Pagamento</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Form.Group>

      {/* --- FORMULÁRIO ENXUTO USANDO O CustomInput --- */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={styles.label}>Nome da Loja</Form.Label>
            <CustomInput
              icon="bi-shop"
              placeholder="Moda Express"
              value={formData.nomeFantasia || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
              required
            />
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={styles.label}>Razão Social</Form.Label>
            <CustomInput
              icon="bi-person-badge"
              placeholder="Nome da empresa"
              value={formData.razaoSocial || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={styles.label}>CPF ou CNPJ</Form.Label>
            <CustomInput
              icon="bi-card-text"
              placeholder="000.000.000-00"
              value={formData.documento || ''}
              onChange={handleDocumentoChange}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={styles.label}>WhatsApp</Form.Label>
            <CustomInput
              icon="bi-whatsapp"
              placeholder="(00) 00000-0000"
              value={formData.telefone || ''}
              onChange={handleTelefoneChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label style={styles.label}>E-mail de Acesso</Form.Label>
        <CustomInput
          icon="bi-envelope"
          type="email"
          placeholder="admin@loja.com"
          value={formData.email || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label style={styles.label}>Senha</Form.Label>
        <CustomInput
          icon="bi-lock"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={formData.senha || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
          required
          minLength={6}
        />
      </Form.Group>

      <CtaButton 
        type="submit" 
        color={palette.brand} 
        disabled={loadingPlanos}
        fullWidth={true}
        className="mb-3"
      >
        Continuar <i className="bi bi-arrow-right ms-2 align-middle"></i>
      </CtaButton>
    </Form>
  );
};