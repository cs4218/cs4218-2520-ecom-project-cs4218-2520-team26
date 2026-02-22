import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";

//Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock("./../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("./../../components/AdminMenu", () => ({
    __esModule: true,
    default: () => <div>AdminMenu</div>,
}));

jest.mock("antd", () => {
    const Select = ({ children, onChange, placeholder, value }) => (
        <select
            aria-label={placeholder}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );
    Select.Option = ({ value, children }) => (
        <option value={value}>{children}</option>
    );
    return { Select };
});

global.URL.createObjectURL = jest.fn(() => "fake-url");

const mockNavigate = jest.fn();
const mockProduct = {
    product: {
        _id: "p1",
        name: "Test Product",
        description: "Test description",
        price: 99,
        quantity: 5,
        shipping: true,
        category: { _id: "c1" },
    },
};
const mockCategories = [
    { _id: "c1", name: "Electronics" },
    { _id: "c2", name: "Books" },
];

describe("UpdateProduct", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useParams.mockReturnValue({ slug: "test-product" });

        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: mockProduct });
            }
            return Promise.resolve({
                data: { success: true, category: mockCategories },
            });
        });
    });

    test("renders Update Product page", async () => {
        render(<UpdateProduct />);
        expect(screen.getByText("Update Product")).toBeInTheDocument();
        expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
        expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    test("loads product data into form fields on mount", async () => {
        render(<UpdateProduct />);
        await waitFor(() => {
            expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
            expect(screen.getByDisplayValue("99")).toBeInTheDocument();
            expect(screen.getByDisplayValue("5")).toBeInTheDocument();
        });
    });

    test("loads categories on mount", async () => {
        render(<UpdateProduct />);
        await waitFor(() => {
            expect(screen.getByText("Electronics")).toBeInTheDocument();
        });
    });

    test("shows error toast when getAllCategory fails", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: mockProduct });
            }
            return Promise.reject(new Error("Network error"));
        });
        render(<UpdateProduct />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Something wwent wrong in getting catgeory"
            );
        });
    });

    test("does not set categories when success is false", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: mockProduct });
            }
            return Promise.resolve({ data: { success: false } });
        });
        render(<UpdateProduct />);
        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });

    test("logs error when getSingleProduct fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.reject(new Error("fetch failed"));
            }
            return Promise.resolve({
                data: { success: true, category: mockCategories },
            });
        });
        render(<UpdateProduct />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("updates name input when typed", async () => {
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.change(screen.getByPlaceholderText("write a name"), {
            target: { value: "New Name" },
        });
        expect(screen.getByDisplayValue("New Name")).toBeInTheDocument();
    });

    test("updates description when typed", async () => {
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test description"));
        fireEvent.change(screen.getByPlaceholderText("write a description"), {
            target: { value: "New description" },
        });
        expect(screen.getByDisplayValue("New description")).toBeInTheDocument();
    });

    test("updates price when typed", async () => {
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("99"));
        fireEvent.change(screen.getByPlaceholderText("write a Price"), {
            target: { value: "199" },
        });
        expect(screen.getByDisplayValue("199")).toBeInTheDocument();
    });

    test("updates quantity when typed", async () => {
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("5"));
        fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
            target: { value: "20" },
        });
        expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    });

    test("sets category when dropdown changes", async () => {
        render(<UpdateProduct />);
        await waitFor(() => screen.getByText("Electronics"));
        const categorySelect = screen.getByRole("combobox", {
            name: /select a category/i,
        });
        fireEvent.change(categorySelect, { target: { value: "c2" } });
        expect(categorySelect.value).toBe("c2");
    });

    test("sets shipping when dropdown changes", async () => {
        render(<UpdateProduct />);
        const shippingSelect = screen.getByRole("combobox", {
            name: /select shipping/i,
        });
        fireEvent.change(shippingSelect, { target: { value: "1" } });
        expect(shippingSelect).toBeInTheDocument();
    });

    test("shows filename and photo preview when file uploaded", async () => {
        render(<UpdateProduct />);
        const fakeFile = new File(["image"], "newphoto.jpg", {
            type: "image/jpeg",
        });
        const fileInput = document.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [fakeFile] } });
        await waitFor(() => {
            expect(screen.getByText("newphoto.jpg")).toBeInTheDocument();
        });
    });

    test("updates product successfully and navigates", async () => {
        axios.put.mockResolvedValueOnce({ data: { success: true } });
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
    });

    test("shows error toast when update returns success false", async () => {
        axios.put.mockResolvedValueOnce({
            data: { success: false, message: "Update failed" },
        });
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Update failed");
        });
    });

    test("shows error toast when update throws", async () => {
        axios.put.mockRejectedValueOnce(new Error("Server error"));
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("something went wrong");
        });
    });

    test("deletes product when prompt is confirmed", async () => {
        window.prompt = jest.fn().mockReturnValue("yes");
        axios.delete.mockResolvedValueOnce({ data: { success: true } });
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
    });

    test("shows error toast when delete returns success false", async () => {
        axios.delete.mockResolvedValueOnce({
            data: { success: false, message: "Delete failed" },
        });
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Delete failed");
        });
    });

    test("does not delete when prompt is cancelled", async () => {
        window.prompt = jest.fn().mockReturnValue(null);
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
        expect(axios.delete).not.toHaveBeenCalled();
    });

    test("shows error toast when delete throws", async () => {
        window.prompt = jest.fn().mockReturnValue("yes");
        axios.delete.mockRejectedValueOnce(new Error("Delete failed"));
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));
        fireEvent.click(screen.getByText("DELETE PRODUCT"));
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    test("appends photo to form data when photo is set", async () => {
        axios.put.mockResolvedValueOnce({ data: { success: true } });
        render(<UpdateProduct />);
        await waitFor(() => screen.getByDisplayValue("Test Product"));

        const fakeFile = new File(["image"], "test.jpg", { type: "image/jpeg" });
        const fileInput = document.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [fakeFile] } });

        await waitFor(() => screen.getByText("test.jpg"));
        fireEvent.click(screen.getByText("UPDATE PRODUCT"));

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        });
    });
});