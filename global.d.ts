type Index = typeof import('./translations/en-US/index.json');
type Common = typeof import('./translations/en-US/common.json');

declare interface IntlMessages extends Index, Common {}
