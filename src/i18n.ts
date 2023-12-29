import { getRequestConfig } from 'next-intl/server';

// Define the structure of your JSON files here.
interface MessageStructure {
  [key: string]: string;
}

// Function to load messages based on locale
async function loadMessages(locale: string): Promise<Record<string, MessageStructure>> {
  const modules = await Promise.all([
    import(`../messages/${locale}/certificate.json`),
    import(`../messages/${locale}/cv.json`),
    import(`../messages/${locale}/global.json`),
    import(`../messages/${locale}/main.json`),
  ]);
  const messages = modules.reduce((acc, module) => ({ ...acc, ...module.default }), {});
  return messages;
}

// Exported function
export async function getMessages(locale: string) {
  return loadMessages(locale === 'en' ? 'en' : locale);
}

// Default export using getRequestConfig
export default getRequestConfig(async ({ locale }) => ({
  messages: await getMessages(locale),
}));
