import { useLayoutStore } from "@/stores/useLayoutStore";
import { useViewerConfigStore } from "@/stores/useViewerConfigStore";

describe("useLayoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({
      activeTab: "plus",
    });
  });

  describe("activeTab", () => {
    it("toggles tab off when same tab clicked", () => {
      useLayoutStore.getState().setActiveTab("plus");
      expect(useLayoutStore.getState().activeTab).toBeNull();
    });

    it("switches to a different tab", () => {
      useLayoutStore.getState().setActiveTab("files");
      expect(useLayoutStore.getState().activeTab).toBe("files");
    });

    it("toggles between tabs correctly", () => {
      useLayoutStore.getState().setActiveTab("files");
      useLayoutStore.getState().setActiveTab("search");

      expect(useLayoutStore.getState().activeTab).toBe("search");
    });
  });
});

describe("useViewerConfigStore", () => {
  beforeEach(() => {
    useViewerConfigStore.setState({
      viewerBackground: "#000000",
      viewerRepresentation: "cartoon",
      viewerLighting: "ao",
    });
  });

  describe("viewerBackground", () => {
    it("sets a new background color", () => {
      useViewerConfigStore.getState().setViewerBackground("#ffffff");
      expect(useViewerConfigStore.getState().viewerBackground).toBe("#ffffff");
    });
  });

  describe("viewerRepresentation", () => {
    it("changes representation", () => {
      useViewerConfigStore
        .getState()
        .setViewerRepresentation("gaussian-surface");
      expect(useViewerConfigStore.getState().viewerRepresentation).toBe(
        "gaussian-surface",
      );
    });
  });

  describe("viewerLighting", () => {
    it("changes lighting preset", () => {
      useViewerConfigStore.getState().setViewerLighting("studio");
      expect(useViewerConfigStore.getState().viewerLighting).toBe("studio");
    });
  });
});
