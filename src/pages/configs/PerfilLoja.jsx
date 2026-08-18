import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import PerfilTenant from './perfil/PerfilTenant';
import PerfilFuncionario from './perfil/PerfilFuncionario';

export default function PerfilLoja() {
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const descobrirTipoUsuario = () => {
            try {
                const adminInfoString = localStorage.getItem('adminInfo');
                
                if (adminInfoString) {
                    const adminInfo = JSON.parse(adminInfoString);
                    if (adminInfo.id_usuario === 'DONO' || adminInfo.id === 'DONO') {
                        setIsOwner(true);
                    } else {
                        setIsOwner(false);
                    }
                } else {
                    setIsOwner(false);
                }
            } catch (e) {
                console.warn("Aviso: Erro ao ler credenciais do Perfil.", e);
                setIsOwner(false);
            } finally {
                setLoading(false);
            }
        };

        descobrirTipoUsuario();
    }, []);

    if (loading) {
        return (
            <div className="text-center p-5 mt-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return isOwner ? <PerfilTenant /> : <PerfilFuncionario />;
}