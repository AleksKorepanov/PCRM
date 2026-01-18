import React from "react";
import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders primary call-to-action", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("button", { name: "Запустить рабочее пространство" })
    ).toBeInTheDocument();
  });
});
