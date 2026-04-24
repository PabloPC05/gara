import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { FastaJobsSection } from "@/components/left-sidebar/sections/FastaJobsSection";
import { JOB_PANEL_KEYS, useJobStatusStore } from "@/stores/useJobStatusStore";
import { useProteinStore } from "@/stores/useProteinStore";

const mockLoadProteinFromInputWithJobPanel = vi.fn();

vi.mock("@/lib/proteinLoadService", () => ({
  loadProteinFromInputWithJobPanel: (...args) =>
    mockLoadProteinFromInputWithJobPanel(...args),
}));

vi.mock("@/components/ExportDriveButton", () => ({
  default: () => null,
}));

describe("FastaJobsSection job status persistence", () => {
  beforeEach(() => {
    mockLoadProteinFromInputWithJobPanel.mockReset();
    useJobStatusStore.setState({ panelsByKey: {} });
    useProteinStore.setState({
      selectedProteinIds: [],
      activeProteinId: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps showing RUNNING after remount until the job completes", async () => {
    let resolveLoad;

    mockLoadProteinFromInputWithJobPanel.mockImplementation(
      () =>
        new Promise((resolve) => {
          useJobStatusStore
            .getState()
            .upsertJobPanel(JOB_PANEL_KEYS.filesFasta, {
              status: "RUNNING",
              error: null,
              jobId: "job-1",
            });
          resolveLoad = () => {
            useJobStatusStore
              .getState()
              .clearJobPanel(JOB_PANEL_KEYS.filesFasta);
            resolve("protein-1");
          };
        }),
    );

    const { unmount } = render(<FastaJobsSection />);

    fireEvent.change(screen.getByPlaceholderText(/sequence_1/i), {
      target: { value: ">Sequence_1\nAAAA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /run job/i }));

    expect(await screen.findByText("RUNNING")).toBeInTheDocument();

    unmount();
    render(<FastaJobsSection />);

    expect(screen.getByText("RUNNING")).toBeInTheDocument();

    await act(async () => {
      resolveLoad?.();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText("RUNNING")).not.toBeInTheDocument();
    });
  });

  it("keeps FAILED visible until dismissed", async () => {
    let rejectLoad;

    mockLoadProteinFromInputWithJobPanel.mockImplementation(
      () =>
        new Promise((_, reject) => {
          useJobStatusStore
            .getState()
            .upsertJobPanel(JOB_PANEL_KEYS.filesFasta, {
              status: "RUNNING",
              error: null,
              jobId: "job-1",
            });
          rejectLoad = (error) => {
            useJobStatusStore
              .getState()
              .upsertJobPanel(JOB_PANEL_KEYS.filesFasta, {
                status: "FAILED",
                error: error.message,
                jobId: "job-1",
              });
            reject(error);
          };
        }),
    );

    const { unmount } = render(<FastaJobsSection />);

    fireEvent.change(screen.getByPlaceholderText(/sequence_1/i), {
      target: { value: ">Sequence_1\nAAAA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /run job/i }));

    unmount();
    render(<FastaJobsSection />);

    await act(async () => {
      rejectLoad?.(new Error("Boom"));
      await Promise.resolve();
    });

    expect(await screen.findByText("FAILED")).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /descartar/i }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText("FAILED")).not.toBeInTheDocument();
    });
  });
});
