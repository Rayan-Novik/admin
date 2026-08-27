import React from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
// Importando seus 3 componentes universais
import { CustomInput } from '../ui/SearchInput/SearchInput';
import { SquareButton } from '../ui/buttons/SquareButton';
import { SelectButton } from '../ui/buttons/SelectButton';

const ProductFilters = ({ 
    searchTerm, setSearchTerm, 
    searchCode, setSearchCode, 
    filterCategory, categorias, handleCategoryChange, 
    filterSubCategory, setFilterSubCategory, availableSubcategories, 
    filterBrand, setFilterBrand, marcas, 
    filterType, setFilterType, 
    fetchData, loading 
}) => {

    return (
        <div className="mb-4">
            <Row className="g-3 align-items-center">
                
                {/* --- BUSCA (NOME + CÓDIGO) --- */}
                <Col xs={12} lg={5}>
                    <div className="d-flex gap-2">
                        <CustomInput
                            icon="bi-search"
                            placeholder="Buscar produto por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="d-none d-sm-block" style={{ width: '160px' }}>
                            <CustomInput
                                icon="bi-upc-scan"
                                placeholder="SKU/ID"
                                value={searchCode || ''}
                                onChange={(e) => setSearchCode && setSearchCode(e.target.value)}
                            />
                        </div>
                    </div>
                </Col>

                {/* --- FILTROS (BOTÕES DE LISTA) --- */}
                <Col xs={12} lg={7}>
                    <div className="filters-scroll-wrapper d-flex gap-2 justify-content-lg-end">
                        
                        {/* 👇 AQUI USAMOS O NOVO COMPONENTE 👇 */}
                        <SelectButton 
                            className="flex-shrink-0"
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)} 
                        >
                            <option value="">📦 Todos Tipos</option>
                            <option value="FINAL">Venda</option>
                            <option value="INSUMO">Insumo</option>
                            <option value="MISTO">Misto</option>
                            <option value="CONSUMO_INTERNO">Uso Interno</option>
                        </SelectButton>

                        <SelectButton 
                            className="flex-shrink-0"
                            value={filterCategory} 
                            onChange={handleCategoryChange} 
                        >
                            <option value="">📁 Categorias</option>
                            <option value="none" disabled>──────────</option>
                            {categorias.map(c => (
                                <option key={c.id_categoria} value={c.id_categoria}>{c.nome}</option>
                            ))}
                        </SelectButton>
                        
                        <SelectButton 
                            className="flex-shrink-0"
                            value={filterBrand} 
                            onChange={e => setFilterBrand(e.target.value)} 
                        >
                            <option value="">🏷️ Marcas</option>
                            <option value="none" disabled>──────────</option>
                            {marcas.map(m => (
                                <option key={m.id_marca} value={m.id_marca}>{m.nome}</option>
                            ))}
                        </SelectButton>

                        {/* Botão de Refresh */}
                        <SquareButton onClick={fetchData}>
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise fs-5"></i>}
                        </SquareButton>
                    </div>
                </Col>
            </Row>

            <style>{`
                /* Efeito hover para o botão de refresh bater com os selects */
                .flat-refresh-btn:hover {
                    border-color: rgba(100, 116, 139, 0.4) !important;
                    background-color: var(--bg-main, #FFFFFF) !important;
                }

                /* ====== SCROLL HORIZONTAL ELEGANTE PARA MOBILE ====== */
                @media (max-width: 991px) {
                    .filters-scroll-wrapper {
                        overflow-x: auto;
                        padding-bottom: 5px;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .filters-scroll-wrapper::-webkit-scrollbar {
                        display: none; 
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductFilters;