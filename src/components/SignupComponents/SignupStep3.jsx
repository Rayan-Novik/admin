import React from 'react';
import { Form, Button } from 'react-bootstrap';

export const SignupStep3 = ({ formData, setFormData, handlePrevStep, handleNextStep }) => {
  const palette = {
    ink: '#0F172A',
    sub: '#64748B',
    line: '#E5EAF1',
  };

  return (
    <Form onSubmit={handleNextStep}>
      <div className="text-center mb-4 mt-2">
        <h5 className="fw-bold mb-1" style={{ color: palette.ink }}>Identidade Visual</h5>
        <p className="small" style={{ color: palette.sub }}>Deixe a loja com a sua cara.</p>
      </div>

      {/* 🟢 PREVIEW EM TEMPO REAL */}
      <div className="mb-4 p-4 rounded-4 border-0" style={{ backgroundColor: '#F4F6FA', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
        <p className="small mb-3 fw-semibold text-center" style={{ color: palette.sub }}><i className="bi bi-phone"></i> Pré-visualização</p>
        <div 
          className="d-flex align-items-center gap-3 p-3 rounded-4 shadow-sm transition-all bg-white mx-auto" 
          style={{ maxWidth: '320px', border: `1px solid ${palette.line}` }}
        >
          <div 
            className="rounded-3 overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0" 
            style={{ width: 48, height: 48, backgroundColor: `${formData.primaryColor}15` }}
          >
            <i className="bi bi-shop fs-4" style={{ color: formData.primaryColor }}></i>
          </div>
          
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="mb-0 fw-bold text-truncate" style={{ color: palette.ink, fontSize: '15px' }}>
              {formData.nomeFantasia || 'Sua Loja'}
            </h6>
            <span className="small text-truncate d-block" style={{ color: palette.sub, fontSize: '12px' }}>Aberto agora</span>
          </div>
          
          <div className="ms-auto">
             <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 38, height: 38, backgroundColor: formData.primaryColor, color: '#fff' }}>
               <i className="bi bi-cart3"></i>
             </div>
          </div>
        </div>
      </div>

      <Form.Group className="mb-4">
        <Form.Label style={{ fontSize: 12, fontWeight: 600, color: palette.sub }}>Nome de Exibição da Loja</Form.Label>
        <div style={{ background: '#F4F6FA', border: `1px solid ${palette.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <Form.Control 
            type="text" 
            placeholder="Como os clientes verão"
            value={formData.nomeFantasia || ''} 
            onChange={(e) => setFormData(prev => ({...prev, nomeFantasia: e.target.value}))} 
            required
            className="border-0 bg-transparent shadow-none"
            style={{ height: 48, fontSize: 15, color: palette.ink }}
            onFocus={(e) => { e.currentTarget.parentElement.style.borderColor = formData.primaryColor; e.currentTarget.parentElement.style.background = '#fff'; e.currentTarget.parentElement.style.boxShadow = `0 0 0 4px ${formData.primaryColor}20`; }}
            onBlur={(e) => { e.currentTarget.parentElement.style.borderColor = palette.line; e.currentTarget.parentElement.style.background = '#F4F6FA'; e.currentTarget.parentElement.style.boxShadow = 'none'; }}
          />
        </div>
      </Form.Group>

      <Form.Group className="mb-4 pt-2">
        <Form.Label style={{ fontSize: 12, fontWeight: 600, color: palette.sub }} className="d-block text-center">Cor Principal do seu negócio</Form.Label>
        <div className="d-flex justify-content-center align-items-center mt-2">
          <div className="p-1 rounded-circle" style={{ border: `2px solid ${formData.primaryColor}` }}>
            <Form.Control
              type="color"
              value={formData.primaryColor || '#0A84FF'}
              onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="p-0 border-0 rounded-circle"
              style={{ width: '48px', height: '48px', cursor: 'pointer', overflow: 'hidden' }}
              title="Escolha a cor predominante"
            />
          </div>
        </div>
      </Form.Group>

      <div className="d-flex gap-3 mt-5">
        <Button variant="light" onClick={handlePrevStep} className="rounded-4 fw-bold px-4 border-0" style={{ backgroundColor: '#F4F6FA', color: palette.sub, height: '50px' }}>
          <i className="bi bi-arrow-left"></i> Voltar
        </Button>
        <Button 
          type="submit" 
          className="flex-grow-1 rounded-4 fw-bold text-white border-0 shadow-sm"
          style={{ backgroundColor: formData.primaryColor, height: '50px', boxShadow: `0 10px 24px -8px ${formData.primaryColor}80` }}
        >
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </Button>
      </div>
    </Form>
  );
};