import React, { FC } from 'react';

interface IHeaderArticleProps {
  title: string;
  subtitle: string;
  description: string;
  className?: string;
  subClassName?: string;
}

const HeaderArticle: FC<IHeaderArticleProps> = ({ title, subtitle, description, className, subClassName }) => {
  return (
    <div className={'mx-auto my-14 max-w-[31.875] text-center ' + className + ' ' + subClassName}>
      <span className="mb-2 block text-lg font-semibold text-primary-700">{subtitle}</span>
      <h2 className="mb-4 text-3xl font-bold text-primaryText-500 sm:text-4xl md:text-[40px]">{title}</h2>
      <p className="text-body-color text-base">{description}</p>
    </div>
  );
};

export default HeaderArticle;
