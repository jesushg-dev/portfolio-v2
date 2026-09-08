import type { ProcessPageFormValues } from "@/features/process-pages/lib/process-page-editor-dto";

/** Payload shape shared by createItem / updateItem (without id). */
export function buildProcessPageUpsertPayload(values: ProcessPageFormValues) {
  return {
    slug: values.slug,
    template: values.template,
    isPublished: values.isPublished,
    showInNav: values.showInNav,
    order: values.order,
    navIcon: values.navIcon,
    translations: values.translations,
    contentByLanguage: values.contentByLanguage,
  };
}
