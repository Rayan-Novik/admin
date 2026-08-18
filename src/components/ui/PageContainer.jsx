import React from 'react';

const PageContainer = ({ header, children }) => {
    return (
        // Removemos margins, paddings e arredondamentos para encostar 100% nas bordas
        <div className="bg-white w-100 min-vh-100 d-flex flex-column m-0 p-0 rounded-0">
            {/* Área do Cabeçalho */}
            {header && (
                <div className="border-bottom bg-white px-4 py-3 m-0">
                    {header}
                </div>
            )}
            
            {/* Área do Conteúdo Dinâmico */}
            <div className="flex-grow-1 px-4 py-4 w-100">
                {children}
            </div>
        </div>
    );
};

export default PageContainer;