import React from 'react';
import type { FC } from 'react';
import Image from 'next/image';

import { useCvContext } from '@/hoc/CvContextProvider';

interface IClientImageProps {}

const ClientImage: FC<IClientImageProps> = ({}) => {
  const { showHeadshot } = useCvContext();

  if (!showHeadshot) return null;

  return (
    <div className="mx-5 table">
      <div className="overflow-hidden bg-white shadow-lg">
        <Image
          alt="Jesús Hernández photo"
          loading="lazy"
          width={100}
          height={150}
          decoding="async"
          src="https://res.cloudinary.com/js-media/image/upload/v1687726418/portfolio/carnet/jesus-hernandez.crop_xqewhg.webp"
          style={{ objectFit: 'cover' }}
        />
      </div>
    </div>
  );
};

export default ClientImage;
