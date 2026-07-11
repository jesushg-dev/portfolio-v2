import type { Service, ServiceSkill, ServiceTranslation } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  mergeTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";

export type ServiceTranslationFields = {
  title: string;
  description: string;
};

export type ServiceTranslationMap = TranslationMap<ServiceTranslationFields>;

export type ServiceEditorDTO = {
  id: string;
  image: string;
  type: Service["type"];
  skillIds: string[];
  translations: ServiceTranslationMap;
};

export type ServiceCreateFormDTO = Omit<ServiceEditorDTO, "id">;

const emptyServiceTranslationFields = { title: "", description: "" };

type ServiceWithRelations = Service & {
  ServiceTranslation: ServiceTranslation[];
  ServiceSkill: ServiceSkill[];
};

export function mapServiceToEditorDto(
  service: ServiceWithRelations,
  languages: LanguageRef[],
): ServiceEditorDTO {
  const rows =
    service.ServiceTranslation?.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      title: translation.title,
      description: translation.description,
    })) ?? [];

  return {
    id: service.id,
    image: service.image ?? "",
    type: service.type,
    skillIds: service.ServiceSkill?.map((entry) => entry.skillId) ?? [],
    translations: mergeTranslationMap(
      languages,
      rows,
      emptyServiceTranslationFields,
    ),
  };
}

export function mapServicesToEditorDto(
  services: ServiceWithRelations[],
  languages: LanguageRef[],
): ServiceEditorDTO[] {
  return services.map((service) => mapServiceToEditorDto(service, languages));
}

export function buildEmptyServiceCreateDto(
  languages: LanguageRef[],
): ServiceCreateFormDTO {
  return {
    image: "",
    type: "FRONTEND",
    skillIds: [],
    translations: buildEmptyTranslationMap(
      languages,
      emptyServiceTranslationFields,
    ),
  };
}
