// Use type safe message keys with `next-intl`
type MainType = typeof import("./messages/en/main.json");
type CvType = typeof import("./messages/en/cv.json");
type GlobalType = typeof import("./messages/en/global.json");
type CertificatesType = typeof import("./messages/en/certificate.json");

declare interface IntlMessages
  extends GlobalType,
    MainType,
    CvType,
    CertificatesType {}
