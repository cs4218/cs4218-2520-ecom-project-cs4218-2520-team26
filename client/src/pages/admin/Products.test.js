import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

//Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/AdminMenu", () => ({
    __esModule: true,
    default: () => <div>AdminMenu</div>,
}));
jest.mock("./../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("react-router-dom", () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockProducts = [
    {
        _id: "p1",
        name: "Product 1",
        description: "Description 1",
        slug: "product-1",
    },
    {
        _id: "p2",
        name: "Product 2",
        description: "Description 2",
        slug: "product-2",
    },
];

describe("Products", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.get.mockResolvedValue({ data: { products: mockProducts } });
    });

    test("renders page heading", () => {
        render(<Products />);
        expect(screen.getByText("All Products List")).toBeInTheDocument();
        expect(screen.getByText("AdminMenu")).toBeInTheDocument();
    });

    test("fetches and displays all products on mount", async () => {
        render(<Products />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
        });
        await waitFor(() => {
            expect(screen.getByText("Product 1")).toBeInTheDocument();
            expect(screen.getByText("Product 2")).toBeInTheDocument();
            expect(screen.getByText("Description 1")).toBeInTheDocument();
        });
    });

    test("renders product links with correct href", async () => {
        render(<Products />);
        await waitFor(() => screen.getByText("Product 1"));
        const links = screen.getAllByRole("link");
        expect(links[0]).toHaveAttribute(
            "href",
            "/dashboard/admin/product/product-1"
        );
        expect(links[1]).toHaveAttribute(
            "href",
            "/dashboard/admin/product/product-2"
        );
    });

    test("renders product images with correct src", async () => {
        render(<Products />);
        await waitFor(() => screen.getByText("Product 1"));
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveAttribute(
            "src",
            "/api/v1/product/product-photo/p1"
        );
        expect(images[0]).toHaveAttribute("alt", "Product 1");
    });

    test("shows error toast when fetch fails", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network error"));
        render(<Products />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
        });
    });

    test("renders empty list when no products", async () => {
        axios.get.mockResolvedValueOnce({ data: { products: [] } });
        render(<Products />);
        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});