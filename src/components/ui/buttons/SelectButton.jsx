import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

export const SelectButton = ({
    value,
    onChange,
    icon,
    width = 'auto',
    className = '',
    disabled = false,
    children, // Aqui dentro vão entrar as <option>
    ...props
}) => {
    return (
        <InputGroup
            className={`overflow-hidden ${className}`}
            style={{
                width: width,
                minWidth: '140px', // Garante que o texto não esmague no mobile
                height: '50px',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-sidebar, #F4F6FA)',
                transition: 'all .3s ease',
                flexWrap: 'nowrap',
                cursor: disabled ? 'not-allowed' : 'pointer'
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
            {/* Ícone opcional à esquerda */}
            {icon && (
                <InputGroup.Text
                    className="border-0 ps-3 pe-0 bg-transparent d-flex align-items-center"
                >
                    <i className={`bi ${icon} fs-5`} style={{ color: 'var(--text-secondary, #64748B)' }}></i>
                </InputGroup.Text>
            )}
            
            <Form.Select
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="border-0 shadow-none h-100 bg-transparent fw-medium"
                style={{
                    color: 'var(--text-secondary, #64748B)',
                    fontSize: '14px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    paddingLeft: icon ? '0.5rem' : '1rem'
                }}
                {...props}
            >
                {children}
            </Form.Select>
        </InputGroup>
    );
};