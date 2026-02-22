import {
    createCategoryController,
    updateCategoryController,
    categoryControlller,
    singleCategoryController,
    deleteCategoryCOntroller,
} from "../controllers/categoryController.js";

import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

//Emberlynn Loo, A0255614E 

jest.mock("../models/categoryModel.js");
jest.mock("slugify");

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

describe("createCategoryController", () => {

    test("should return 401 if name missing", async () => {
        const req = { body: {} };
        const res = mockResponse();

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should return existing category", async () => {
        const req = { body: { name: "Test" } };
        const res = mockResponse();

        categoryModel.findOne.mockResolvedValue({ name: "Test" });

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should create new category", async () => {
        const req = { body: { name: "NewCat" } };
        const res = mockResponse();

        categoryModel.findOne.mockResolvedValue(null);
        slugify.mockReturnValue("newcat");

        categoryModel.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({ name: "NewCat" }),
        }));

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test("should handle error", async () => {
        const req = { body: { name: "Err" } };
        const res = mockResponse();

        categoryModel.findOne.mockRejectedValue(new Error("DB error"));

        await createCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

});

describe("updateCategoryController", () => {

    test("should update category", async () => {
        const req = { body: { name: "Updated" }, params: { id: "1" } };
        const res = mockResponse();

        slugify.mockReturnValue("updated");

        categoryModel.findByIdAndUpdate.mockResolvedValue({ name: "Updated" });

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should handle error", async () => {
        const req = { body: { name: "Err" }, params: { id: "1" } };
        const res = mockResponse();

        categoryModel.findByIdAndUpdate.mockRejectedValue(new Error());

        await updateCategoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    describe("categoryControlller", () => {

        test("should return categories", async () => {
            const req = {};
            const res = mockResponse();

            categoryModel.find.mockResolvedValue([{ name: "A" }]);

            await categoryControlller(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should handle error", async () => {
            const req = {};
            const res = mockResponse();

            categoryModel.find.mockRejectedValue(new Error());

            await categoryControlller(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

    });

    describe("singleCategoryController", () => {

        test("should return single category", async () => {
            const req = { params: { slug: "test" } };
            const res = mockResponse();

            categoryModel.findOne.mockResolvedValue({ name: "Test" });

            await singleCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should handle error", async () => {
            const req = { params: { slug: "test" } };
            const res = mockResponse();

            categoryModel.findOne.mockRejectedValue(new Error());

            await singleCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

    });

    describe("deleteCategoryCOntroller", () => {

        test("should delete category", async () => {
            const req = { params: { id: "1" } };
            const res = mockResponse();

            categoryModel.findByIdAndDelete.mockResolvedValue();

            await deleteCategoryCOntroller(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should handle error", async () => {
            const req = { params: { id: "1" } };
            const res = mockResponse();

            categoryModel.findByIdAndDelete.mockRejectedValue(new Error());

            await deleteCategoryCOntroller(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

    });
})