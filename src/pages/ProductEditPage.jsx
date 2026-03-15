import React from 'react';
import { Link } from 'react-router-dom';
import ProductEditForm from '../components/ProdutoForms/ProductEditForm'; // Importa o seu formulário

const ProductEditPage = () => {
    return (
        <>
            <Link to='/products' className='btn btn-light my-3'>
                Voltar
            </Link>
            {/* A página simplesmente renderiza o componente do formulário de edição */}
            <ProductEditForm />
        </>
    );
};

export default ProductEditPage;
