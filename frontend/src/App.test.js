import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Aurea Dashboard header", () => {
  render(<App />);
  const header = screen.getByRole("heading", { level: 1 });
  expect(header).toHaveTextContent("Aurea");
  expect(header).toHaveTextContent("Dashboard");
});
