import React, { FC } from 'react';
import { FcLike } from 'react-icons/fc';

interface IFooterProps {}

const Footer: FC<IFooterProps> = ({}) => {
  return (
    <footer className="footer">
      <div className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <div className="-mx-4 flex flex-wrap justify-between">
            <div className="px-4 w-full text-center sm:w-auto sm:text-left text-sm">
              Todos los Derechos Reservados © 2021
            </div>
            <div className="px-4 w-full text-center sm:w-auto sm:text-left text-sm sm:flex sm:items-center">
              Hecho con <FcLike className="mx-1 inline" />
              por Jesús Hernández
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
