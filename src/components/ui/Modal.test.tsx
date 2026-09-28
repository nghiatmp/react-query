import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders an accessible titled dialog and closes from its button", () => {
    const onClose = vi.fn();
    render(<Modal open title="Chọn món" onClose={onClose}><p>Nội dung</p></Modal>);

    expect(screen.getByRole("dialog", { name: "Chọn món" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
