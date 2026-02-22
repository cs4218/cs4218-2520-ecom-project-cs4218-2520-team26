// Emberlynn Loo, A0255614E
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import PrivateRoute from "./Private";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
    Outlet: () => <div>Protected Content</div>,
}));
jest.mock("../Spinner", () => ({
    __esModule: true,
    default: ({ path }) => <div>Loading Spinner</div>,
}));

import { useAuth } from "../../context/auth";

describe("PrivateRoute", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows Outlet when auth check passes", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        render(<PrivateRoute />);

        await waitFor(() => {
            expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    test("shows Spinner when auth check fails", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: false } });

        render(<PrivateRoute />);

        await waitFor(() => {
            expect(screen.getByText("Loading Spinner")).toBeInTheDocument();
        });
    });

    test("shows Spinner initially before auth check completes", () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        render(<PrivateRoute />);

        expect(screen.getByText("Loading Spinner")).toBeInTheDocument();
    });

    test("does not call auth check when no token", async () => {
        useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

        render(<PrivateRoute />);

        await waitFor(() => expect(screen.getByText("Loading Spinner")).toBeInTheDocument());
        expect(axios.get).not.toHaveBeenCalled();
    });

    test("does not call auth check when auth is null", async () => {
        useAuth.mockReturnValue([null, jest.fn()]);

        render(<PrivateRoute />);

        expect(axios.get).not.toHaveBeenCalled();
        expect(screen.getByText("Loading Spinner")).toBeInTheDocument();
    });

    test("shows Spinner when auth check throws error", async () => {
        useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
        axios.get.mockRejectedValueOnce(new Error("network error"));

        render(<PrivateRoute />);

        await waitFor(() => {
            expect(screen.getByText("Loading Spinner")).toBeInTheDocument();
        });
    });
});