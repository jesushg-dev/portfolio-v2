import {getRequestConfig} from 'next-intl/server';

export async function getMessages(locale: string) {
  if (locale === 'en') {
    return {
      ... await import('../messages/en/certificate.json'),
      ... await import('../messages/en/cv.json'),
      ... await import('../messages/en/global.json'),
      ... await import('../messages/en/main.json'),
    };
  } else {
    return {
      ... await import(`../messages/${locale}/certificate.json`),
      ... await import(`../messages/${locale}/cv.json`),
      ... await import(`../messages/${locale}/global.json`),
      ... await import(`../messages/${locale}/main.json`)
    };
  }
}

export default getRequestConfig(async ({locale}) => ({
  messages: (
    await (locale === 'en'
      ? // When using Turbopack, this will enable HMR for `en`
        {
          ... import('../messages/en/certificate.json'),
          ... import('../messages/en/cv.json'),
          ... import('../messages/en/global.json'),
          ... import('../messages/en/main.json'),
        }
      : {
          ... import(`../messages/${locale}/certificate.json`),
          ... import(`../messages/${locale}/cv.json`),
          ... import(`../messages/${locale}/global.json`),
          ... import(`../messages/${locale}/main.json`)
        })
  ).default
}));