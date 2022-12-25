type Index = typeof import('./translations/en/index.json');
type Common = typeof import('./translations/en/common.json');

declare interface IntlMessages extends Index, Common {}
