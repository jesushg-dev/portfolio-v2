import React, { FC } from 'react';

import { unstable_setRequestLocale } from 'next-intl/server';

interface ICallbackProps {
  params: {locale: string};
}
const Callback: FC<ICallbackProps> = ({params: {locale}}) => {
  // Enable static rendering
  unstable_setRequestLocale(locale);

  return (
    <div>
      <h1>Callback</h1>
      <p>Callback page content</p>
    </div>
  );
};

export default Callback;
