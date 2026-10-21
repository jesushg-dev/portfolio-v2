import { buildEmptyEventCreateDto } from "./event-editor-dto";

describe("buildEmptyEventCreateDto", () => {
  it("defaults to a 60-minute interview", () => {
    expect(buildEmptyEventCreateDto("app-1")).toMatchObject({
      applicationId: "app-1",
      type: "INTERVIEW",
      duration: 60,
      isVirtual: false,
    });
  });
});
