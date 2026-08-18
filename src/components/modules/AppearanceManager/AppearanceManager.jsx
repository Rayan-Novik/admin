import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../../../services/api';

import ColorSettings from './ColorSettings';
import LogoSettings from './LogoSettings';
import GeneralSettings from './GeneralSettings';

const AppearanceManager = ({ onUpdate }) => {
    const [settings, setSettings] = useState({
        SITE_TITLE: '',
        FAVICON_URL: '',
        HEADER_PRIMARY_COLOR: '#ffc107',
        HEADER_SECONDARY_COLOR: '#0d6efd',
        FOOTER_COLOR: '#212529',
        LOGO_URL: '',
        STORE_LAYOUT_STYLE: 'ECOMMERCE',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const apiBaseUrl = process.env.REACT_APP_API_URL
        ? process.env.REACT_APP_API_URL.replace('/api', '')
        : 'http://localhost:5000';

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/configuracoes/appearance');
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                setError('Não foi possível carregar as configurações.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSuccess('');
        const { name, value } = e.target;
        const newSettings = { ...settings, [name]: value };
        setSettings(newSettings);
        if (onUpdate) onUpdate(newSettings);
    };

    // 🟢 Lógica da Logo (Recebe a URL pronta)
    const handleLogoUploadSuccess = (imageUrl) => {
        const updated = { ...settings, LOGO_URL: imageUrl };
        setSettings(updated);
        if (onUpdate) onUpdate(updated);
        setSuccess('Logo alterada para a vitrine!');
    };

    // 🟢 Lógica Inteligente do Favicon (Evita duplicidade de Upload)
    const uploadFaviconHandler = async (eOrUrl) => {
        setError('');
        setSuccess('');

        // Se o LogoSettings já fez o upload e devolveu a URL da imagem
        if (typeof eOrUrl === 'string') {
            const updated = { ...settings, FAVICON_URL: eOrUrl };
            setSettings(updated);
            if (onUpdate) onUpdate(updated);
            setSuccess('Favicon enviado e atualizado com sucesso!');
            return;
        }

        // Se for um input de arquivo tradicional (Lógica antiga)
        const file = eOrUrl?.target?.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const { data } = await api.post('/uploadimages', formData);

            const updated = { ...settings, FAVICON_URL: data.imagePath };
            setSettings(updated);
            if (onUpdate) onUpdate(updated);
            setSuccess('Favicon enviado para a vitrine!');
        } catch (error) {
            console.error("Erro ao subir favicon:", error);
            // 🟢 AGORA ELE MOSTRA O ERRO EXATO NA TELA VERMELHA!
            setError(`Erro no upload: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.put('/configuracoes/appearance', settings);
            setSuccess('Configurações visuais salvas!');
        } catch (err) {
            setError(`Erro ao salvar: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    let previewLogoUrl = '';
    if (settings.LOGO_URL) {
        const cleanPath = settings.LOGO_URL.startsWith('/') ? settings.LOGO_URL : `/${settings.LOGO_URL}`;
        previewLogoUrl = settings.LOGO_URL.startsWith('http') ? settings.LOGO_URL : `${apiBaseUrl}${cleanPath}`;
    }

    let previewFaviconUrl = '';
    if (settings.FAVICON_URL) {
        const cleanPath = settings.FAVICON_URL.startsWith('/') ? settings.FAVICON_URL : `/${settings.FAVICON_URL}`;
        previewFaviconUrl = settings.FAVICON_URL.startsWith('http') ? settings.FAVICON_URL : `${apiBaseUrl}${cleanPath}`;
    }

    if (loading) return <div className="text-center p-4"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="appearance-manager-clean">
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <GeneralSettings
                settings={settings}
                handleChange={handleChange}
            />

            <div className="mt-4">
                <ColorSettings settings={settings} handleChange={handleChange} />
            </div>

            <div className="mt-4">
                <LogoSettings
                    uploadFileHandler={handleLogoUploadSuccess}
                    currentLogoUrl={previewLogoUrl}
                    uploadFaviconHandler={uploadFaviconHandler}
                    currentFaviconUrl={previewFaviconUrl}
                />
            </div>

            <button id="btn-save-appearance-hidden" onClick={handleSubmit} style={{ display: 'none' }}></button>
        </div>
    );
};

export default AppearanceManager;