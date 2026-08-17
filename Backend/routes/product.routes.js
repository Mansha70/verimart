import express from "express";
import { createProduct,getAllProduct,updateProduct,deleteProduct,getMyProducts,getSingleProduct,adminDeleteProduct } from "../Controllers/product.Controller.js";
import auth from "../Middleware/authmid.js";
import upload from "../Middleware/upload.js";

const router = express.Router();

router.post(
    "/create",
    auth,
    upload.array("images", 5),
    createProduct
);
router.get("/getAllProduct",auth,getAllProduct)
router.patch("/update/:id",auth,upload.array("images",5),updateProduct)

router.get("/my", auth, getMyProducts);

// Get Single Product
router.get("/:id", getSingleProduct);

//delete product
router.delete("/:id",deleteProduct)

// Admin delete product (bypass seller ownership check)
router.delete("/admin/:id", auth, adminDeleteProduct)


export default router;
