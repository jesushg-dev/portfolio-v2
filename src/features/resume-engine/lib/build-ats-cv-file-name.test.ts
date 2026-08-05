import {
  atsPersonNameFromFullName,
  buildAtsCvFileName,
  inferCvRoleTrack,
  stripForAtsFileName,
} from "@/features/resume-engine/lib/build-ats-cv-file-name";

describe("buildAtsCvFileName", () => {
  it("strips accents and keeps first + first surname", () => {
    expect(atsPersonNameFromFullName("Jesús Hernández Gómez")).toBe(
      "Jesus Hernandez",
    );
    expect(stripForAtsFileName("Imagemáker")).toBe("Imagemaker");
  });

  it("builds the ATS export name", () => {
    expect(
      buildAtsCvFileName({
        fullName: "Jesús Hernández Gómez",
        roleTrack: "Backend",
        company: "Imagemaker",
        locale: "es",
      }),
    ).toBe("Jesus Hernandez - CV - Backend - Imagemaker - ES.docx");
  });

  it("infers role track from job text", () => {
    expect(inferCvRoleTrack("Senior Frontend Engineer React")).toBe("Frontend");
    expect(inferCvRoleTrack("Backend Node.js API")).toBe("Backend");
    expect(inferCvRoleTrack("Fullstack Developer")).toBe("Fullstack");
    expect(inferCvRoleTrack("Frontend and Backend engineer")).toBe("Fullstack");
  });
});
