import { decodeHtmlEntities, htmlToPlainText } from "./html-to-plain-text";

describe("htmlToPlainText", () => {
  it("turns lists and paragraphs into readable text", () => {
    const html = `
      <p>Responsabilidades:</p>
      <ul>
        <li>Desarrollar componentes backend</li>
        <li>Brindar mantenimiento</li>
      </ul>
    `;
    const text = htmlToPlainText(html);
    expect(text).toContain("Responsabilidades:");
    expect(text).toContain("- Desarrollar componentes backend");
    expect(text).toContain("- Brindar mantenimiento");
  });

  it("strips scripts and decodes entities", () => {
    const html =
      '<p>C# &amp; .NET</p><script>alert("x")</script><p>Pago en USD&#x21;</p>';
    const text = htmlToPlainText(html);
    expect(text).toContain("C# & .NET");
    expect(text).toContain("Pago en USD!");
    expect(text).not.toContain("alert");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named, decimal, and hex entities", () => {
    expect(decodeHtmlEntities("&quot;hi&quot;")).toBe('"hi"');
    expect(decodeHtmlEntities("&#39;")).toBe("'");
    expect(decodeHtmlEntities("&#xF1;")).toBe("ñ");
  });
});
