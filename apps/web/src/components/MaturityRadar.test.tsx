import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaturityRadar } from "./MaturityRadar";
import { SRL_BLOCKS } from "../data/srlBlocks";
import { PENDING_RADAR_LEGEND } from "../utils/score";

type TooltipLabel = (context: {
  datasetIndex: number;
  dataIndex: number;
  dataset: { label: string };
}) => string;

let lastOptions: { plugins: { tooltip: { callbacks: { label: TooltipLabel } } } } | null = null;

vi.mock("react-chartjs-2", () => ({
  Radar: (props: {
    data: { datasets: { data: number[]; pointStyle: string[] }[] };
    options: typeof lastOptions;
  }) => {
    lastOptions = props.options;
    return (
      <div
        data-testid="radar"
        data-points={props.data.datasets[0].data.join(",")}
        data-point-styles={props.data.datasets[0].pointStyle.join(",")}
      />
    );
  }
}));

afterEach(() => {
  cleanup();
  lastOptions = null;
});

describe("MaturityRadar", () => {
  it("repassa as 12 notas ao dataset do radar", () => {
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
    const { getByTestId } = render(<MaturityRadar scores={scores} darkMode={false} />);
    expect(getByTestId("radar").getAttribute("data-points")).toBe(scores.join(","));
    expect(screen.queryByText(PENDING_RADAR_LEGEND)).not.toBeInTheDocument();
  });

  it("desenha pendentes no nível 1 com estilo distinto, legenda e tooltip 'Pendente'", () => {
    const scores = [5, null, 1, ...new Array<null>(9).fill(null)];
    render(<MaturityRadar scores={scores} darkMode={false} />);

    const radar = screen.getByTestId("radar");
    expect(radar.getAttribute("data-points")?.split(",").slice(0, 3)).toEqual(["5", "1", "1"]);
    const styles = radar.getAttribute("data-point-styles")?.split(",") ?? [];
    expect(styles[1]).not.toBe(styles[0]);
    expect(styles[2]).toBe(styles[0]);

    expect(screen.getByText(PENDING_RADAR_LEGEND)).toBeInTheDocument();

    const label = lastOptions!.plugins.tooltip.callbacks.label;
    const dataset = { label: "Nível SRL" };
    expect(label({ datasetIndex: 0, dataIndex: 1, dataset })).toBe("Nível SRL: Pendente");
    expect(label({ datasetIndex: 0, dataIndex: 2, dataset })).toBe("Nível SRL: Nível 1");
  });

  it("oferece alternativa textual acessível com 'Pendente' em vez de 'Nível 1'", () => {
    const scores = [5, null, 1, ...new Array<null>(9).fill(null)];
    render(<MaturityRadar scores={scores} darkMode={false} />);

    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toHaveLength(12);
    expect(items[0]).toBe(`P${SRL_BLOCKS[0].number}. ${SRL_BLOCKS[0].shortLabel}: Nível 5`);
    expect(items[1]).toBe(`P${SRL_BLOCKS[1].number}. ${SRL_BLOCKS[1].shortLabel}: Pendente`);
    expect(items[2]).toBe(`P${SRL_BLOCKS[2].number}. ${SRL_BLOCKS[2].shortLabel}: Nível 1`);
  });
});
