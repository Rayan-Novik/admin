import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { CtaButton, LightButton } from '../ui/buttons/CtaButton';

export const SignupStep2 = ({ formData, setFormData, handlePrevStep, handleNextStep }) => {
  const palette = {
    ink: '#0F172A',
    sub: '#64748B',
    line: '#E5EAF1',
  };

  const getCardStyle = (layoutName, brandColor) => {
    const isSelected = formData.layoutStyle === layoutName;
    return {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `1px solid ${isSelected ? brandColor : palette.line}`,
      backgroundColor: isSelected ? `${brandColor}0A` : '#fff',
      boxShadow: isSelected ? `0 0 0 2px ${brandColor}` : '0 4px 12px rgba(15,23,42,0.03)',
      transform: isSelected ? 'translateY(-2px)' : 'none'
    };
  };

  return (
    <Form onSubmit={handleNextStep}>
      <div className="text-center mb-4 mt-2">
        <h5 className="fw-bold mb-1" style={{ color: palette.ink }}>Escolha sua Vitrine</h5>
        <p className="small" style={{ color: palette.sub }}>Como você prefere exibir seus produtos?</p>
      </div>
      
      <Form.Group className="mb-5">
        <Row className="g-3">
          {/* E-COMMERCE */}
          <Col xs={4}>
            <div 
              onClick={() => setFormData({ ...formData, layoutStyle: 'ECOMMERCE', primaryColor: '#0A84FF' })}
              className="h-100 p-3 rounded-4 text-center d-flex flex-column align-items-center justify-content-center position-relative"
              style={getCardStyle('ECOMMERCE', '#0A84FF')}
            >
              {formData.layoutStyle === 'ECOMMERCE' && (
                <div className="position-absolute" style={{ top: '8px', right: '8px', color: '#0A84FF' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              )}
              <div className={`mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center`} 
                   style={{ width: '56px', height: '56px', transition: 'all 0.3s', backgroundColor: formData.layoutStyle === 'ECOMMERCE' ? '#0A84FF' : '#F4F6FA', color: formData.layoutStyle === 'ECOMMERCE' ? '#fff' : palette.sub }}>
                <i className="bi bi-bag-heart fs-4"></i>
              </div>
              <h6 className="fw-bold mb-0" style={{ fontSize: '0.85rem', color: formData.layoutStyle === 'ECOMMERCE' ? '#0A84FF' : palette.ink }}>E-commerce</h6>
            </div>
          </Col>

          {/* CARDÁPIO */}
          <Col xs={4}>
            <div 
              onClick={() => setFormData({ ...formData, layoutStyle: 'CARDAPIO', primaryColor: '#EA1D2C' })}
              className="h-100 p-3 rounded-4 text-center d-flex flex-column align-items-center justify-content-center position-relative"
              style={getCardStyle('CARDAPIO', '#EA1D2C')}
            >
              {formData.layoutStyle === 'CARDAPIO' && (
                <div className="position-absolute" style={{ top: '8px', right: '8px', color: '#EA1D2C' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              )}
              <div className={`mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center`} 
                   style={{ width: '56px', height: '56px', transition: 'all 0.3s', backgroundColor: formData.layoutStyle === 'CARDAPIO' ? '#EA1D2C' : '#F4F6FA', color: formData.layoutStyle === 'CARDAPIO' ? '#fff' : palette.sub }}>
                <i className="bi bi-shop fs-4"></i>
              </div>
              <h6 className="fw-bold mb-0" style={{ fontSize: '0.85rem', color: formData.layoutStyle === 'CARDAPIO' ? '#EA1D2C' : palette.ink }}>Cardápio</h6>
            </div>
          </Col>

          {/* MERCADINHO */}
          <Col xs={4}>
            <div 
              onClick={() => setFormData({ ...formData, layoutStyle: 'MERCADINHO', primaryColor: '#10B981' })}
              className="h-100 p-3 rounded-4 text-center d-flex flex-column align-items-center justify-content-center position-relative"
              style={getCardStyle('MERCADINHO', '#10B981')}
            >
              {formData.layoutStyle === 'MERCADINHO' && (
                <div className="position-absolute" style={{ top: '8px', right: '8px', color: '#10B981' }}>
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              )}
              <div className={`mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center`} 
                   style={{ width: '56px', height: '56px', transition: 'all 0.3s', backgroundColor: formData.layoutStyle === 'MERCADINHO' ? '#10B981' : '#F4F6FA', color: formData.layoutStyle === 'MERCADINHO' ? '#fff' : palette.sub }}>
                <i className="bi bi-basket2-fill fs-4"></i>
              </div>
              <h6 className="fw-bold mb-0" style={{ fontSize: '0.85rem', color: formData.layoutStyle === 'MERCADINHO' ? '#10B981' : palette.ink }}>Mercado</h6>
            </div>
          </Col>
        </Row>
      </Form.Group>

      <div className="d-flex gap-3">
        <LightButton variant="light" onClick={handlePrevStep} className="rounded-4 fw-bold px-4 border-0" style={{ backgroundColor: '#F4F6FA', color: palette.sub, height: '50px' }}>
          <i className="bi bi-arrow-left"></i>
        </LightButton>
        <CtaButton type="submit" className="flex-grow-1 rounded-4 fw-bold text-white border-0" style={{ backgroundColor: formData.primaryColor, height: '50px', boxShadow: `0 10px 24px -8px ${formData.primaryColor}80` }}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </CtaButton>
      </div>
    </Form>
  );
};