import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaturityRadar } from "./MaturityRadar";

vi.mock("react-chartjs-2", () => ({
  Radar: (props: { data: { datasets: { data: number[] }[] } }) => (
    <div data-testid="radar" data-points={props.data.datasets[0].data.join(",")} />
  )
}));

afterEach(() => cleanup());

describe("MaturityRadar", () => {
  it("repassa as 12 notas ao dataset do radar", () => {
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
    const { getByTestId } = render(<MaturityRadar scores={scores} darkMode={false} />);
    expect(getByTestId("radar").getAttribute("data-points")).toBe(scores.join(","));
  });
});
