import React, { FC } from 'react';

interface IHeaderArticleProps {
  title: string;
  subtitle: string;
  description: string;
  className?: string;
  subClassName?: string;
  showIcon?: boolean;
}

const HeaderArticle: FC<IHeaderArticleProps> = ({ title, subtitle, description, className, subClassName , showIcon = false }) => {
  return (
    <div className={'mx-auto my-14 max-w-[31.875] text-center relative ' + className + ' ' + subClassName}>
      <span className="mb-2 block text-lg font-semibold text-primary-700">{subtitle}</span>
      <h2 className="mb-4 text-3xl font-bold text-primaryText-500 sm:text-4xl md:text-[40px]">{title}</h2>
      <p className="text-body-color text-base">{description}</p>
      {showIcon ? (
           <div className="hidden absolute top-0 end-0 translate-x-20 md:block lg:translate-x-20">
           <svg
             className="w-16 h-auto text-primary-500"
             width={121}
             height={135}
             viewBox="0 0 121 135"
             fill="none"
             xmlns="http://www.w3.org/2000/svg"
           >
             <path
               d="M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164"
               stroke="currentColor"
               strokeWidth={10}
               strokeLinecap="round"
             />
             <path
               d="M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5"
               stroke="currentColor"
               strokeWidth={10}
               strokeLinecap="round"
             />
             <path
               d="M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874"
               stroke="currentColor"
               strokeWidth={10}
               strokeLinecap="round"
             />
           </svg>
         </div>
      ) 
      : 
        null  
      }
    </div>
  );
};

export default HeaderArticle;
