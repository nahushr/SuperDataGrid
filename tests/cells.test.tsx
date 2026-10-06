import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActionsCell from "../src/components/cells/ActionsCell";
import AddressCell from "../src/components/cells/AddressCell";
import AuditCell from "../src/components/cells/AuditCell";
import CurrencyCell from "../src/components/cells/CurrencyCell";
import DateCell from "../src/components/cells/DateCell";
import DateTimeCell from "../src/components/cells/DateTimeCell";
import EmailCell from "../src/components/cells/EmailCell";
import ImagePreviewCell from "../src/components/cells/ImagePreviewCell";
import JsonPreviewCell from "../src/components/cells/JsonPreviewCell";
import LongTextCell from "../src/components/cells/LongTextCell";
import PeopleDetailsCell from "../src/components/cells/PeopleDetailsCell";
import PhoneCell from "../src/components/cells/PhoneCell";
import PriceBreakdownCell from "../src/components/cells/PriceBreakdownCell";
import ProductImageCarousel from "../src/components/cells/ProductImageCarousel";
import StatusBadgeCell from "../src/components/cells/StatusBadgeCell";
import { SUPER_DATA_GRID_ACTIONS } from "../src/types";

describe("grid cell renderers", () => {
  it("shows configured row actions and emits clicks without bubbling", () => {
    const onAction = vi.fn();
    const parentClick = vi.fn();
    const { rerender } = render(<ActionsCell value={null} onAction={onAction} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<div onClick={parentClick}><ActionsCell value={["view", "edit", "deactivate", "share", "invalid"]} onAction={onAction} /></div>);
    for (const label of ["View", "Edit", "Deactivate", "Share"]) fireEvent.click(screen.getByRole("button", { name: label }));
    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      SUPER_DATA_GRID_ACTIONS.VIEW,
      SUPER_DATA_GRID_ACTIONS.EDIT,
      SUPER_DATA_GRID_ACTIONS.DEACTIVATE,
      SUPER_DATA_GRID_ACTIONS.SHARE,
    ]);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("renders addresses and nested people details including an avatar and phone", () => {
    const { rerender } = render(<AddressCell value={{ streetAddress: "12 Main St", city: "NY", state: "NY", name: "Alex", email: "alex@example.com", phone: "+14155552671" }} />);
    expect(screen.getByText("12 Main St")).toBeInTheDocument();
    expect(screen.getByText("NY, NY")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alex@example.com/i })).toHaveAttribute("href", "mailto:alex@example.com");
    rerender(<AddressCell value={null} emptyText="No address" />);
    expect(screen.getByText("No address")).toBeInTheDocument();
    rerender(<PeopleDetailsCell value={{ firstName: "Alex", lastName: "Doe", email: "alex@example.com", phone: "+14155552671", photoUrl: "avatar.jpg" }} rowId={42} showAvatar />);
    expect(screen.getByText("Alex Doe")).toBeInTheDocument();
    expect(document.querySelector('img[alt="Alex Doe"]')).toHaveAttribute("src", "avatar.jpg");
    expect(screen.getByRole("link", { name: /\+1/i })).toHaveAttribute("href", "tel:+14155552671");
    rerender(<PeopleDetailsCell value={{}} emptyText="Unknown" />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    rerender(<PeopleDetailsCell value={{}} showEmptyFields showPhone={false} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("renders audit actors and their timestamp", () => {
    render(<AuditCell value={{ user: { name: "Created By", email: "creator@example.com" }, timestamp: "2026-08-25T20:50:00Z" }} row={{}} field="createdAt" />);
    expect(screen.getByText("Created By")).toBeInTheDocument();
    expect(screen.getByText("creator@example.com")).toBeInTheDocument();
    expect(screen.getByText(/25th Aug 2026/)).toBeInTheDocument();
  });

  it("formats currency and dates with empty and custom options", () => {
    const { rerender } = render(<CurrencyCell value={{ amount: 12345.5, currency: "USD" }} />);
    expect(screen.getByText(/12,345/)).toBeInTheDocument();
    rerender(<CurrencyCell value="invalid" />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<CurrencyCell value={10} options={{ currency: "EUR", showIcon: false, minorUnits: 0 }} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
    rerender(<DateCell value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<DateCell value="2026-01-02" options={{ showIcon: false, locale: "en-GB", timeZone: "UTC" }} />);
    expect(screen.getByText(/2 Jan 2026/)).toBeInTheDocument();
    rerender(<DateTimeCell value="invalid" />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<DateTimeCell value="2026-01-02T12:00:00Z" options={{ timeZone: "UTC" }} />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("renders clickable email and phone values and handles blanks", () => {
    const { rerender } = render(<EmailCell value={{ email: "a@example.com", label: "Email Alex" }} />);
    expect(screen.getByRole("link", { name: "Email Alex" })).toHaveAttribute("href", "mailto:a@example.com");
    rerender(<EmailCell value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<PhoneCell value={{ phone: "+34943482900" }} />);
    expect(screen.getByRole("img", { name: "ES flag" })).toHaveTextContent("🇪🇸");
    expect(screen.getByRole("link")).toHaveAttribute("href", "tel:+34943482900");
    rerender(<PhoneCell value="not a number" options={{ showFlag: false, showIcon: false }} />);
    expect(screen.getByText("not a number")).toBeInTheDocument();
    rerender(<PhoneCell value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("applies badge labels, mapped colors, icons, and empty fallbacks", () => {
    const { rerender } = render(<StatusBadgeCell value={{ status: "active", color: "success" }} options={{ labels: { active: "Enabled" }, fontColors: { active: "primary" }, icons: { active: "✓" } }} />);
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    rerender(<StatusBadgeCell value="disabled" options={{ fallbackLabel: "Unavailable", fallbackColor: "warning", fallbackFontColor: "error" }} />);
    expect(screen.getByText("disabled")).toBeInTheDocument();
    rerender(<StatusBadgeCell value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("truncates long text and formats JSON with preview, copy, and empty handling", async () => {
    const { rerender } = render(<LongTextCell value="a long value" options={{ maxPreviewLength: 5 }} />);
    expect(screen.getByText("a lon…")).toBeInTheDocument();
    rerender(<LongTextCell value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<JsonPreviewCell value={{ key: "value" }} field="metadata" options={{ maxPreviewLength: 5 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open JSON preview for metadata" }));
    expect(await screen.findByText(/"key": "value"/)).toBeInTheDocument();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
    await waitFor(() => expect(screen.getByText("Copied to clipboard")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    rerender(<JsonPreviewCell value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("opens a product image gallery and supports carousel navigation and fallbacks", async () => {
    const images = [{ url: "front.jpg", label: "Front" }, { url: "back.jpg", label: "Back" }];
    const { rerender } = render(<ProductImageCarousel images={images} />);
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next product image" }));
    expect(screen.getByText("Back")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous product image" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Back" }));
    expect(screen.getByRole("button", { name: "Show Back" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.error(screen.getByAltText("Back"));
    expect(screen.getByText("P")).toBeInTheDocument();
    rerender(<ProductImageCarousel images={[]} fallbackLetter="X" />);
    expect(screen.getByText("No product images")).toBeInTheDocument();

    rerender(<ImagePreviewCell value={{ images }} field="photos" />);
    fireEvent.click(screen.getByRole("button", { name: "View 2 product images" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next product image" }));
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("opens a purchase price breakdown with derived totals and a grand-total fallback", () => {
    const value = { productsSubtotal: 100, discount: 10, packagingFee: 2, shippingFee: 5, serviceFee: 3, tax: 8, currency: "USD" };
    const { rerender } = render(<PriceBreakdownCell value={value} options={{ title: "Order total" }} />);
    fireEvent.click(screen.getByRole("button", { name: /Open price breakdown/ }));
    expect(screen.getByRole("heading", { name: "Order total" })).toBeInTheDocument();
    expect(screen.getByText("Products Subtotal")).toBeInTheDocument();
    rerender(<PriceBreakdownCell value={{ grandTotal: "invalid" }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
