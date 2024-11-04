import {isAscii} from "./isAscii";

describe("isAscii", () => {
  it("returns true for ASCII text", () => {
    expect(isAscii("abc123")).toBeTruthy();
  });
});
