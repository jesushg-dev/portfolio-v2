import { prioritizeHireQuestions } from "./interview-prep-result";

describe("prioritizeHireQuestions", () => {
  it("puts hire questions first", () => {
    const sorted = prioritizeHireQuestions([
      { category: "role", question: "Stack?" },
      { category: "hire", question: "Why hire you?" },
      { category: "gap", question: "Gap?" },
    ]);
    expect(sorted.map((item) => item.category)).toEqual([
      "hire",
      "role",
      "gap",
    ]);
  });
});
