import { it, expect } from "vitest";
import { textFieldsError } from "./input";
it("rejects oversized clinical text rather than silently truncating it", () => {
  expect(
    textFieldsError({ summary: "x".repeat(601) }, { summary: 600 }),
  ).toBeTruthy();
  expect(
    textFieldsError({ summary: "x".repeat(600) }, { summary: 600 }),
  ).toBeNull();
  expect(textFieldsError({ summary: 42 }, { summary: 600 })).toBeTruthy();
  expect(textFieldsError({}, { summary: 600 })).toBeNull();
});
