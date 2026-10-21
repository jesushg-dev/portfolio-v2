import {
  atsPersonNameFromFullName,
  buildAtsCvFileName,
  inferCvRoleTrack,
  stripForAtsFileName,
} from "@/features/resume-engine/lib/build-ats-cv-file-name";

describe("buildAtsCvFileName", () => {
  it("uses given name + paternal surname (skips middle name)", () => {
    expect(atsPersonNameFromFullName("Jesús Enmanuel Hernández González")).toBe(
      "Jesus Hernandez",
    );
    expect(atsPersonNameFromFullName("Jesús Hernández Gómez")).toBe(
      "Jesus Hernandez",
    );
    expect(stripForAtsFileName("Imagemáker")).toBe("Imagemaker");
  });

  it("builds the ATS export name with role + optional company + locale", () => {
    expect(
      buildAtsCvFileName({
        fullName: "Jesús Enmanuel Hernández González",
        roleTrack: "Fullstack",
        company: "Nisum",
        locale: "es",
      }),
    ).toBe("Jesus Hernandez - Fullstack Developer - Nisum - ES.docx");

    expect(
      buildAtsCvFileName({
        fullName: "Jesús Enmanuel Hernández González",
        roleTrack: "Backend",
        company: "Imagemaker",
        locale: "es",
      }),
    ).toBe("Jesus Hernandez - Backend Developer - Imagemaker - ES.docx");

    expect(
      buildAtsCvFileName({
        fullName: "Jesús Enmanuel Hernández González",
        roleTrack: "Fullstack",
        company: null,
        locale: "en",
      }),
    ).toBe("Jesus Hernandez - Fullstack Developer - EN.docx");

    expect(
      buildAtsCvFileName({
        fullName: "Jesús Enmanuel Hernández González",
        roleTrack: "Fullstack",
        company: "Nisum",
        locale: "es",
        extension: "pdf",
      }),
    ).toBe("Jesus Hernandez - Fullstack Developer - Nisum - ES.pdf");
  });

  it("infers role track from job text", () => {
    expect(inferCvRoleTrack("Senior Frontend Engineer React")).toBe("Frontend");
    expect(inferCvRoleTrack("Backend Node.js API")).toBe("Backend");
    expect(inferCvRoleTrack("Fullstack Developer")).toBe("Fullstack");
    expect(inferCvRoleTrack("Frontend and Backend engineer")).toBe("Fullstack");
  });
});
