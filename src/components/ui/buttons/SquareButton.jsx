import React, { forwardRef } from 'react';
import { Button } from 'react-bootstrap';

export const SquareButton = forwardRef(({ 
  children, 
  color = '#0A84FF', // Cor padrão azul
  disabled = false, 
  type = 'button', 
  size = 50, // Tamanho padrão (50x50 pixels)
  radius = 14, // Arredondamento padrão das bordas
  className = '',
  onClick,
  ...props 
}, ref) => {
  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    border: 0,
    backgroundColor: color, 
    color: '#fff',
    transition: 'all .2s ease',
    // Flexbox para centralizar o ícone no meio exato do quadrado
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Remove o espaçamento interno para não distorcer o quadrado
    textDecoration: 'none',
    flexShrink: 0 // Evita que o botão amasse se estiver num flexbox apertado
  };

  return (
    <Button 
      ref={ref}
      type={type} 
      disabled={disabled} 
      className={className}
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={(e) => { 
        if (!disabled) {
          e.currentTarget.style.filter = 'brightness(1.06)'; 
        }
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.filter = 'none'; 
      }}
      {...props}
    >
      {children}
    </Button>
  );
});

// --- WRAPPERS DE CORES COM FORWARD REF ---

// Ideal para botão de deletar/lixeira
export const RedSquareButton = forwardRef((props, ref) => {
  return <SquareButton ref={ref} {...props} color="#EF4444" />;
});

// Ideal para botão de confirmar/adicionar
export const GreenSquareButton = forwardRef((props, ref) => {
  return <SquareButton ref={ref} {...props} color="#10B981" />;
});

// Ideal para botão de editar/aviso
export const YellowSquareButton = forwardRef((props, ref) => {
  return <SquareButton ref={ref} {...props} color="#F59E0B" />;
});

export const LightSquareButton = forwardRef((props, ref) => {
  return <SquareButton ref={ref} {...props} color="#F4F6FA" textColor="#64748B" />;
});