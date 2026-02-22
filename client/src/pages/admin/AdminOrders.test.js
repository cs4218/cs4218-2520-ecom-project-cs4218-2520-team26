import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import AdminOrders from "./AdminOrders";

// Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
    __esModule: true,
    default: () => <div>AdminMenu</div>,
}));
jest.mock("moment", () => {
    const moment = () => ({
        fromNow: () => "2 days ago",
    });
    return moment;
});

jest.mock("antd", () => {
    const Select = ({ children, onChange, defaultValue }) => (
        <select
            defaultValue={defaultValue}
            onChange={(e) => onChange && onChange(e.target.value)}
        >
            {children}
        </select>
    );
    Select.Option = ({ value, children }) => (
        <option value={value}>{children}</option>
    );
    return { Select };
});

import { useAuth } from "../../context/auth";

const mockOrders = [
    {
        _id: "o1",
        status: "Not Processed",
        buyer: { name: "John Doe" },
        createdAt: "2024-01-01",
        payment: { success: true },
        products: [
            {
                _id: "p1",
                name: "Product 1",
                description: "A great product description here",
                price: 99,
            },
        ],
    },
    {
        _id: "o2",
        status: "Delivered",
        buyer: { name: "Jane Smith" },
        createdAt: "2024-01-02",
        payment: { success: false },
        products: [
            {
                _id: "p2",
                name: "Product 2",
                description: "Another product description here",
                price: 49,
            },
        ],
    },
];

describe("AdminOrders", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.get.mockResolvedValue({ data: mockOrders });
        axios.put.mockResolvedValue({ data: { success: true } });
    });

    test("renders page with heading", () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        expect(screen.getByText("All Orders")).toBeInTheDocument();
        expect(screen.getByText("AdminMenu")).toBeInTheDocument();
    });

    test("fetches and displays orders when auth token exists", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
        });
        await waitFor(() => {
            expect(screen.getByText("John Doe")).toBeInTheDocument();
            expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        });
    });

    test("does not fetch orders when no auth token", async () => {
        useAuth.mockReturnValue([{ token: "" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            expect(axios.get).not.toHaveBeenCalled();
        });
    });

    test("does not fetch orders when auth is null", async () => {
        useAuth.mockReturnValue([null, jest.fn()]);
        render(<AdminOrders />);
        expect(axios.get).not.toHaveBeenCalled();
    });

    test("displays order products correctly", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            expect(screen.getByText("Product 1")).toBeInTheDocument();
            expect(screen.getByText("Product 2")).toBeInTheDocument();
            expect(screen.getByText("Price : 99")).toBeInTheDocument();
        });
    });

    test("shows Success for successful payment", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            expect(screen.getByText("Success")).toBeInTheDocument();
        });
    });

    test("shows Failed for unsuccessful payment", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            expect(screen.getByText("Failed")).toBeInTheDocument();
        });
    });

    test("shows date using moment fromNow", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            const dates = screen.getAllByText("2 days ago");
            expect(dates.length).toBeGreaterThan(0);
        });
    });

    test("shows product quantity", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => {
            // each order has 1 product
            const ones = screen.getAllByText("1");
            expect(ones.length).toBeGreaterThan(0);
        });
    });

    test("handleChange calls put API when status changed", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => screen.getByText("John Doe"));

        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "Shipped" } });

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                "/api/v1/auth/order-status/o1",
                { status: "Shipped" }
            );
        });
    });

    test("refetches orders after status change", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        render(<AdminOrders />);
        await waitFor(() => screen.getByText("John Doe"));

        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "Shipped" } });

        await waitFor(() => {
            // called once on mount, once after handleChange
            expect(axios.get).toHaveBeenCalledTimes(2);
        });
    });

    test("logs error when getOrders fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.get.mockRejectedValueOnce(new Error("fetch failed"));
        render(<AdminOrders />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("logs error when handleChange fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.put.mockRejectedValueOnce(new Error("update failed"));
        render(<AdminOrders />);
        await waitFor(() => screen.getByText("John Doe"));

        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "Shipped" } });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});