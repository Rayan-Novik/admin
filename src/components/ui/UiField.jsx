import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

const UiField = ({ label, type = 'text', options, prefix, suffix, hint, className = '', buttonSuffix, ...props }) => {
    const isSelect = type === 'select';
    const isTextarea = type === 'textarea';

    const inputClass = `form-dark-input shadow-none border-0 ${className}`;
    const baseStyle = { fontSize: '13px' };

    const inputElement = isSelect ? (
        <Form.Select className={inputClass} style={baseStyle} {...props}>
            {options?.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
            ))}
            {props.children}
        </Form.Select>
    ) : isTextarea ? (
        <Form.Control as="textarea" className={inputClass} style={{ ...baseStyle, resize: 'none' }} {...props} />
    ) : (
        <Form.Control type={type} className={inputClass} style={baseStyle} {...props} />
    );

    return (
        <Form.Group className="mb-3">
            {label && <Form.Label className="fw-semibold mb-1" style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Form.Label>}
            
            <InputGroup className="border rounded-3 overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                {prefix && <InputGroup.Text className="border-0 bg-transparent" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{prefix}</InputGroup.Text>}
                
                {inputElement}
                
                {suffix && <InputGroup.Text className="border-0 bg-transparent" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{suffix}</InputGroup.Text>}
                {buttonSuffix && buttonSuffix}
            </InputGroup>
            
            {hint && <Form.Text className="mt-1 d-block" style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.8 }}>{hint}</Form.Text>}
        </Form.Group>
    );
};

export default UiField;