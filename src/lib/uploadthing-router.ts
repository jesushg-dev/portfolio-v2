import { createUploadthing, type FileRouter } from "uploadthing/next";

import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  resumeImporter: f({
    blob: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      const userId = session?.user?.id;
      if (typeof userId !== "string" || userId.length === 0) {
        throw new Error("Unauthorized");
      }
      return { userId };
    })
    .onUploadComplete(({ metadata, file }) => {
      return {
        userId: metadata.userId,
        url: file.ufsUrl ?? file.url,
        key: file.key,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
