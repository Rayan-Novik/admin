import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

// variant pode ser 'primary' ou 'secondary'
const UiButton = ({ children, variant = 'primary', loading = false, icon, ...props }) => {
    const isPrimary = variant === 'primary';
    
    // Define as classes com base na variante escolhida
    const btnClass = isPrimary 
        ? "d-flex align-items-center gap-2 px-4 fw-medium shadow-sm rounded-3" 
        : "d-flex align-items-center gap-2 px-3 fw-medium border-secondary border-opacity-25 rounded-3";

    const bsVariant = isPrimary ? "primary" : "outline-secondary";

    return (
        <Button variant={bsVariant} className={btnClass} disabled={loading || props.disabled} {...props}>
            {loading ? (
                <Spinner size="sm" animation="border" />
            ) : (
                icon && <i className={icon}></i>
            )}
            {children}
        </Button>
    );
};

export default UiButton;