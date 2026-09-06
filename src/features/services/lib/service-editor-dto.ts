import type { Service, ServiceSkill, ServiceTranslation } from "@prisma/client";

import type { LanguageRef } from "@/lib/i18n/editor-rows";
import {
  buildEmptyTranslationMap,
  mergeTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";

export interface ServiceTranslationFields {
  title: string;
  description: string;
  badge: string;
  statsLabel: string;
}

export type ServiceTranslationMap = TranslationMap<ServiceTranslationFields>;

export interface ServiceEditorDTO {
  id: string;
  image: string;
  type: Service["type"];
  icon: string;
  statsValue: string;
  featured: boolean;
  isActive: boolean;
  order: number;
  skillIds: string[];
  translations: ServiceTranslationMap;
}

export type ServiceCreateFormDTO = Omit<ServiceEditorDTO, "id">;

const emptyServiceTranslationFields: ServiceTranslationFields = {
  title: "",
  description: "",
  badge: "",
  statsLabel: "",
};

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
      badge: translation.badge ?? "",
      statsLabel: translation.statsLabel ?? "",
    })) ?? [];

  return {
    id: service.id,
    image: service.image ?? "",
    type: service.type,
    icon: service.icon ?? "code",
    statsValue: service.statsValue ?? "",
    featured: service.featured ?? false,
    isActive: service.isActive ?? true,
    order: service.order ?? 0,
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
    icon: "code",
    statsValue: "",
    featured: false,
    isActive: true,
    order: 0,
    skillIds: [],
    translations: buildEmptyTranslationMap(
      languages,
      emptyServiceTranslationFields,
    ),
  };
}
