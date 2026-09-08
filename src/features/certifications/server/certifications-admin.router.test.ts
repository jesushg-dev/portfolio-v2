import { certificationsAdminRouter } from "./certifications-admin.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const languages = [{ id: "lang-en", code: "en" }];

const row = {
  id: "cert-1",
  company: "AWS",
  issuedDate: 2024,
  url: "https://aws.example",
  idCredential: "abc",
  image: "",
  type: ["BACKEND"],
  userId: MOCK_OWNER_USER.id,
  CertificationTranslation: [{ appLanguageId: "lang-en", title: "Architect" }],
  CertificateSkill: [],
};

function createDb() {
  return {
    certification: {
      findMany: jest.fn().mockResolvedValue([row]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(row),
      create: jest.fn().mockResolvedValue(row),
      update: jest.fn(),
    },
    certificateSkill: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    certificationTranslation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
    },
    appLanguage: { findMany: jest.fn().mockResolvedValue(languages) },
    $transaction: jest.fn(
      async (fn: (tx: unknown) => unknown) =>
        await fn({
          certificateSkill: { deleteMany: jest.fn() },
          certificateProject: { deleteMany: jest.fn() },
          certificateService: { deleteMany: jest.fn() },
          certificationTranslation: { deleteMany: jest.fn() },
          certification: {
            delete: jest.fn().mockResolvedValue(row),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }),
    ),
  };
}

describe("certificationsAdminRouter", () => {
  it("lists, creates, updates, and deletes certifications", async () => {
    const db = createDb();
    const caller = createRouterCaller(
      certificationsAdminRouter,
      createTrpcTestContext({ db }),
    );

    const list = await caller.getMine({
      page: 1,
      perPage: 10,
      sort: [{ id: "company", desc: false }],
      filters: [
        {
          id: "company",
          value: "AWS",
          variant: "text",
          operator: "iLike",
          filterId: "f1",
        },
      ],
    });
    expect(list.data[0]?.company).toBe("AWS");

    await caller.createItem({
      company: "AWS",
      issuedDate: 2024,
      url: "https://aws.example",
      type: ["BACKEND"],
      skillIds: ["sk-1"],
      translations: { "lang-en": { title: "Architect" } },
    });

    await caller.updateItem({
      id: "cert-1",
      company: "AWS",
      type: ["BACKEND"],
      skillIds: [],
      translations: { "lang-en": { title: "Architect Associate" } },
    });

    await caller.deleteItem({ id: "cert-1" });
    await expect(caller.deleteAll()).resolves.toEqual({ count: 1 });
  });
});
