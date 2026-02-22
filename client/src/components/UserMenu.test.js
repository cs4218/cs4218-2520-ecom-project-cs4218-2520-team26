import React from "react";
import { render, screen } from "@testing-library/react";
import UserMenu from "./UserMenu";

// Emberlynn Loo, A0255614E

jest.mock("react-router-dom", () => ({
    NavLink: ({ children, to, className }) => (
        <a href={to} className={className}>{children}</a>
    ),
}));

describe("UserMenu", () => {
    test("renders Dashboard heading", () => {
        render(<UserMenu />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    test("renders Profile link with correct href", () => {
        render(<UserMenu />);
        const profileLink = screen.getByText("Profile");
        expect(profileLink).toBeInTheDocument();
        expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    });

    test("renders Orders link with correct href", () => {
        render(<UserMenu />);
        const ordersLink = screen.getByText("Orders");
        expect(ordersLink).toBeInTheDocument();
        expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
    });

    test("renders two navigation links", () => {
        render(<UserMenu />);
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(2);
    });

    test("links have correct className", () => {
        render(<UserMenu />);
        const links = screen.getAllByRole("link");
        links.forEach(link => {
            expect(link).toHaveAttribute(
                "class",
                "list-group-item list-group-item-action"
            );
        });
    });
});