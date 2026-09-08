import JSZip from "jszip";

import {
  SEED_EXPORT_ENTITIES,
  SEED_EXPORT_FILENAMES,
  type SeedExportEntity,
} from "@/lib/seed-export/entities";
import { stringifySeedJson } from "@/features/portfolio/server/seed-export/serialize";

export interface SeedJsonFile {
  fileName: string;
  json: string;
}

export function seedJsonFilesFromData(
  data: Record<SeedExportEntity, unknown>,
): SeedJsonFile[] {
  return SEED_EXPORT_ENTITIES.map((entity) => ({
    fileName: SEED_EXPORT_FILENAMES[entity],
    json: stringifySeedJson(data[entity]),
  }));
}

export async function zipSeedJsonFiles(files: SeedJsonFile[]): Promise<string> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.fileName, file.json);
  }
  return zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
