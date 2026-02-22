import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

//Emberlynn Loo, A0255614E

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../components/UserMenu", () => ({
    __esModule: true,
    default: () => <div>UserMenu</div>,
}));

import { useAuth } from "../../context/auth";

describe("Dashboard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders user name, email and address", () => {
        useAuth.mockReturnValue([{
            user: {
                name: "John Doe",
                email: "john@test.com",
                address: "123 Main St",
            },
        }]);

        render(<Dashboard />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@test.com")).toBeInTheDocument();
        expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });
});