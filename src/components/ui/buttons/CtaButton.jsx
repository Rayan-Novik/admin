import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';

export const CtaButton = forwardRef(({ 
  children, 
  color = '#0A84FF', 
  textColor = '#fff', // 1. Adicionamos o controle da cor do texto (padrão branco)
  disabled = false, 
  type = 'button', 
  fullWidth = false, 
  className = '',
  onClick,
  ...props 
}, ref) => {
  const buttonStyle = {
    height: 50,
    borderRadius: 14,
    border: 0,
    backgroundColor: color, 
    color: textColor, // 2. Aplicamos a cor dinâmica aqui
    fontWeight: 600,
    fontSize: 15,
    transition: 'all .2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };

  const classesFinais = `${fullWidth ? 'w-100' : ''} ${className}`.trim();

  return (
    <Button 
      ref={ref}
      type={type} 
      disabled={disabled} 
      className={classesFinais}
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => { 
        if (!disabled) {
          // 3. Mágica de UI: Se o botão for claro (texto não-branco), ele ESCURECE levemente no hover.
          // Se for botão de cor forte (texto branco), ele BRILHA no hover.
          e.currentTarget.style.filter = textColor === '#fff' ? 'brightness(1.06)' : 'brightness(0.96)'; 
        }
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.filter = 'none'; 
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {children}
    </Button>
  );
});

// --- WRAPPERS DE CORES COM FORWARD REF ---

export const RedButton = forwardRef((props, ref) => {
  return <CtaButton ref={ref} {...props} color="#EF4444" />;
});

export const GreenButton = forwardRef((props, ref) => {
  return <CtaButton ref={ref} {...props} color="#10B981" />;
});

export const YellowButton = forwardRef((props, ref) => {
  return <CtaButton ref={ref} {...props} color="#F59E0B" />;
});

export const LightButton = forwardRef((props, ref) => {
  return <CtaButton ref={ref} {...props} color="#F4F6FA" textColor="#64748B" />;
});