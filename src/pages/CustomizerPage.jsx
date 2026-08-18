import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageContainer from '../components/ui/PageContainer';
import UiButton from '../components/ui/UiButton';
import PageLayoutManager from '../components/modules/AppearanceManager/PageLayoutManager';
import AppearanceManager from '../components/modules/AppearanceManager/AppearanceManager';
import FooterManager from '../components/modules/AppearanceManager/FooterManager';
import SocialMediaManager from '../components/modules/AppearanceManager/SocialMediaManager';

const CustomizerPage = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('appearance');
    const navigate = useNavigate();
    const previewUrl = window.location.origin + "/admin/preview-stub";

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const saveLayout = document.getElementById('btn-save-layout-hidden') || document.getElementById('btn-save-layout');
            const saveAppearance = document.getElementById('btn-save-appearance-hidden') || document.getElementById('btn-save-appearance');
            if (saveLayout) saveLayout.click();
            if (saveAppearance) saveAppearance.click();
            setTimeout(() => toast.success("Alterações publicadas com sucesso!"), 500);
        } catch (err) {
            toast.error("Erro ao publicar alterações.");
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    const headerContent = (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
                <button
                    className="btn rounded-circle d-flex justify-content-center align-items-center border-0 shadow-sm transition-colors"
                    style={{ width: '42px', height: '42px', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left fs-5"></i>
                </button>
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Configurações Visuais</h4>
                    <span className="small" style={{ color: 'var(--text-secondary)' }}>Gerencie a aparência, estrutura e links da sua loja</span>
                </div>
            </div>

            <div className="d-flex gap-2">
                <UiButton variant="secondary" icon="bi bi-box-arrow-up-right" href={previewUrl} target="_blank" rel="noopener noreferrer">
                    Visualizar Site
                </UiButton>
                <UiButton variant="primary" icon="bi bi-check2-all fs-5" onClick={handleSaveAll} loading={isSaving}>
                    Publicar Agora
                </UiButton>
            </div>
        </div>
    );

    return (
        <PageContainer header={headerContent}>

            <div className="d-flex mb-4 gap-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`btn rounded-0 border-0 pb-3 px-1 transition-colors position-relative ${activeTab === 'appearance' ? 'fw-bold' : 'bg-transparent'}`}
                    style={{
                        color: activeTab === 'appearance' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: activeTab === 'appearance' ? 'inset 0 -3px 0 0 #1b1b1b' : 'none'
                    }}
                >
                    <i className="bi bi-palette2 me-2"></i> Aparência e Rodapé
                </button>

                <button
                    onClick={() => setActiveTab('layout')}
                    className={`btn rounded-0 border-0 pb-3 px-1 transition-colors position-relative ${activeTab === 'layout' ? 'fw-bold' : 'bg-transparent'}`}
                    style={{
                        color: activeTab === 'layout' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: activeTab === 'layout' ? 'inset 0 -3px 0 0 #2563eb' : 'none'
                    }}
                >
                    <i className="bi bi-layout-sidebar me-2"></i> Estrutura da Home
                </button>
            </div>

            <div className="w-100 mx-auto" style={{ maxWidth: '1000px' }}>

                {activeTab === 'appearance' && (
                    <div className="d-flex flex-column gap-5 fade-in">
                        <section>
                            <h5 className="fw-bold mb-4 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Cores e Identidade Visual</h5>
                            <AppearanceManager hideTabs={true} />
                        </section>

                        <section>
                            <h5 className="fw-bold mb-4 pb-2 mt-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Configurações do Rodapé</h5>
                            <FooterManager />
                        </section>

                        <section>
                            <h5 className="fw-bold mb-4 pb-2 mt-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>Redes Sociais</h5>
                            <SocialMediaManager />
                        </section>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="fade-in">
                        <PageLayoutManager isLive={false} />
                    </div>
                )}

            </div>

            <style>{`
                .transition-colors { transition: all 0.2s ease; }
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

        </PageContainer>
    );
};

export default CustomizerPage;