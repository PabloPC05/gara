import { cleanShareUrl } from "@/utils/deepLink";

describe("cleanShareUrl", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("removes only the view parameter and keeps remaining query parameters and hash", () => {
    window.history.replaceState(
      {},
      "",
      "/viewer?view=ENCODED_STATE&job=abc123&tab=summary#residue-42",
    );

    cleanShareUrl();

    expect(window.location.pathname).toBe("/viewer");
    expect(window.location.search).toBe("?job=abc123&tab=summary");
    expect(window.location.hash).toBe("#residue-42");
    expect(window.location.href).toContain(
      "/viewer?job=abc123&tab=summary#residue-42",
    );
  });

  it("removes the full query string when view is the only parameter", () => {
    window.history.replaceState({}, "", "/viewer?view=ENCODED_STATE#panel");

    cleanShareUrl();

    expect(window.location.pathname).toBe("/viewer");
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#panel");
    expect(window.location.href).toContain("/viewer#panel");
  });
});
