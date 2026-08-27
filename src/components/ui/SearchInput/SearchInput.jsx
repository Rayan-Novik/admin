import React, { useState } from 'react';
import { InputGroup, Form, Button } from 'react-bootstrap';

export const CustomInput = ({ 
    value, 
    onChange, 
    placeholder = '', 
    width = '100%', 
    icon, 
    type = 'text',
    className = '',
    required = false,
    ...props 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const currentType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
        <InputGroup 
            className={`overflow-hidden ${className}`} 
            style={{ 
                width: width, 
                maxWidth: '100%', 
                height: '50px', 
                border: '1px solid rgba(100, 116, 139, 0.2)', 
                borderRadius: '14px', 
                backgroundColor: 'var(--bg-sidebar, #F4F6FA)', // Adicionado fallback de cor para o fundo
                transition: 'all .3s ease',
                flexWrap: 'nowrap'
            }}
            onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.4)';
                e.currentTarget.style.backgroundColor = 'var(--bg-main, #FFFFFF)';
            }}
            onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)';
                e.currentTarget.style.backgroundColor = 'var(--bg-sidebar, #F4F6FA)';
            }}
        >
            {icon && (
                <InputGroup.Text 
                    className="border-0 ps-3 pe-2 bg-transparent d-flex align-items-center"
                >
                    {/* 👇 Aqui forçamos o cinza elegante (#64748B) 👇 */}
                    <i 
                        className={`bi ${icon} fs-5`} 
                        style={{ color: 'var(--text-secondary, #64748B)', transition: 'color 0.2s ease' }}
                    ></i>
                </InputGroup.Text>
            )}
            
            <Form.Control 
                type={currentType}
                placeholder={placeholder}
                className="border-0 shadow-none h-100" 
                style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary, #0F172A)', // Fallback escuro para o texto digitado
                    fontSize: '15px',
                    paddingLeft: icon ? '0' : '1rem' 
                }}
                value={value}
                onChange={onChange}
                required={required}
                {...props}
            />

            {type === 'password' && (
                <Button 
                    variant="link" 
                    className="border-0 text-decoration-none pe-3 d-flex align-items-center bg-transparent shadow-none"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                >
                    {/* 👇 Aqui também forçamos o cinza elegante no olhinho 👇 */}
                    <i 
                        className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} fs-5`}
                        style={{ color: 'var(--text-secondary, #64748B)', transition: 'color 0.2s ease' }}
                    ></i>
                </Button>
            )}
        </InputGroup>
    );
};