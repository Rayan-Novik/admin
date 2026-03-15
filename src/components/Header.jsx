import React from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Header = ({ notifications, onClearNotifications }) => {
    // Custom Toggle mantido igual (botão redondo)
    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <button
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            // O shadow-sm aqui garante que SÓ a bolinha tenha sombra
            className="btn btn-light rounded-circle shadow position-relative d-flex align-items-center justify-content-center"
            style={{ 
                width: '50px', 
                height: '50px', 
                border: 'none',
                backgroundColor: '#fff'
            }}
        >
            {children}
        </button>
    ));

    return (
        // ✅ MUDANÇA AQUI:
        // 1. Removemos 'w-100', 'bg-white', 'shadow-sm' (tira a barra branca)
        // 2. Usamos 'top-0 end-0' para colar na direita
        // 3. Adicionamos 'm-3' (margem) para não ficar grudado na borda da tela
        <div 
            className="position-fixed top-0 end-0 m-3" 
            style={{ zIndex: 1040 }} 
        >
            <Dropdown align="end">
                
                <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                    <i className="bi bi-bell-fill" style={{ fontSize: '1.2rem', color: '#555' }}></i>
                    
                    {notifications.length > 0 && (
                        <Badge 
                            bg="danger" 
                            pill 
                            className="position-absolute top-0 start-100 translate-middle"
                            style={{ border: '2px solid #fff' }}
                        >
                            {notifications.length}
                        </Badge>
                    )}
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-2" style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                    <Dropdown.Header className="d-flex justify-content-between align-items-center fw-bold text-uppercase small text-muted">
                        <span>Notificações</span>
                        {notifications.length > 0 && (
                            <span 
                                onClick={onClearNotifications} 
                                style={{ cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                                className="text-primary"
                            >
                                Limpar tudo
                            </span>
                        )}
                    </Dropdown.Header>
                    
                    <Dropdown.Divider className="m-0" />

                    {notifications.length === 0 ? (
                        <div className="text-center p-4 text-muted">
                            <i className="bi bi-bell-slash fs-4 d-block mb-2 text-secondary opacity-50"></i>
                            <small>Sem novas notificações</small>
                        </div>
                    ) : (
                        notifications.map((notif, index) => (
                            <Dropdown.Item 
                                key={index} 
                                as={Link} 
                                to={`/admin/order/${notif.id}`}
                                className="p-3 border-bottom position-relative hover-bg-light"
                                style={{ whiteSpace: 'normal' }}
                            >
                                <div className="d-flex align-items-start gap-3">
                                    <div className="rounded-circle bg-success bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <i className="bi bi-bag-check text-success fs-5"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold text-dark">Pedido #{notif.id}</span>
                                            <small className="text-muted" style={{ fontSize: '10px' }}>Agora</small>
                                        </div>
                                        <p className="mb-1 text-secondary small">{notif.cliente}</p>
                                        <span className="badge bg-success bg-opacity-75 rounded-pill">
                                            R$ {parseFloat(notif.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </Dropdown.Item>
                        ))
                    )}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default Header;