import Product from "../Models/Product.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const isVercel = process.env.VERCEL === "1";
const useCloudinary = process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET;

async function uploadToCloudinary(buffer, folder = "verimart/products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// Convert a multer file into an image object.
async function fileToImage(file) {
  if (!file) return null;

  if (useCloudinary && file.buffer) {
    try {
      const result = await uploadToCloudinary(file.buffer);
      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return null;
    }
  }

  if (file.path) {
    const relative = file.path.split("uploads").pop().replace(/\\/g, "/");
    return {
      url: `/uploads${relative}`,
      public_id: file.filename || "",
    };
  }
  return null;
}

export const createProduct = async (req, res) => {
  try {
    const seller = req.user._id;

    let images = [];
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map(fileToImage);
      const results = await Promise.all(imagePromises);
      images = results.filter(Boolean);
    }

        const {
            title,
            description,
            category,
            condition,
            sellingPrice,
            originalPrice,
            purchaseYear,
            billAvailable,
            warrantyAvailable,
            warrantyExpiry,
            brand,
            model,
            location,
            status
        } = req.body;

        // location may arrive as a JSON string from the frontend FormData
        let parsedLocation = location;
        if (typeof location === 'string' && location) {
            try {
                parsedLocation = JSON.parse(location);
            } catch {
                parsedLocation = { city: location, state: '' };
            }
        }

        const product = new Product({
            seller,
            title,
            description,
            category,
            condition,
            sellingPrice,
            originalPrice,
            purchaseYear,
            billAvailable,
            warrantyAvailable,
            warrantyExpiry,
            brand,
            model,
            images,
            location: parsedLocation,
            status
        });

        await product.save();

        return res.status(201).json({
            success: true,
            message: "Product Created Successfully!",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllProduct=async(req,res)=>{
    try{
      let products=await Product.find().populate("seller","name trustScore profilePic")
    if(!products){
        return res.status(400).json({
            success:false,
            message:"products not exist"
        })
    }
    return res.status(201).json({
        success:true,
        products,
        message:"See Your Products"
    })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }

}
const updateProduct=async(req,res)=>{
    try{
        const product=await Product.findById(req.params.id)
        if(!product){
              return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        //ownership
        if(product.seller.toString()!==req.user._id.toString()){
               return res.status(403).json({
                success: false,
                message: "You are not authorized to update this product"
            });
        }
        if (req.files && req.files.length > 0) {
          const imagePromises = req.files.map(fileToImage);
          const results = await Promise.all(imagePromises);
          const newImages = results.filter(Boolean);
          if (newImages.length > 0) product.images = newImages;
        }
         product.title = req.body.title || product.title;
        product.description = req.body.description || product.description;
        product.category = req.body.category || product.category;
        product.condition = req.body.condition || product.condition;
        product.sellingPrice = req.body.sellingPrice || product.sellingPrice;
        product.originalPrice = req.body.originalPrice || product.originalPrice;
        product.purchaseYear = req.body.purchaseYear || product.purchaseYear;
        product.billAvailable = req.body.billAvailable ?? product.billAvailable;
        product.warrantyAvailable = req.body.warrantyAvailable ?? product.warrantyAvailable;
        product.warrantyExpiry = req.body.warrantyExpiry || product.warrantyExpiry;
product.brand = req.body.brand || product.brand;
        product.model = req.body.model || product.model;
        if (req.body.location) {
            let loc = req.body.location;
            if (typeof loc === 'string' && loc) {
                try {
                    loc = JSON.parse(loc);
                } catch {
                    loc = { city: loc, state: '' };
                }
            }
            product.location = loc;
        }
        product.status = req.body.status || product.status;
       await product.save()
       return res.status(200).json({
        success:true,
        message:"Product updated Successfully",
        product
       })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
       }
}
const getSingleProduct=async(req,res)=>{
    try{
    const product=await Product.findById(req.params.id)
     if(!product){
        return res.status(401).json({
            success:false,
            message:"Product not exist!!"
        })
     }
     return res.status(200).json({
        success:true,
        product
     })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
   
}
const deleteProduct=async(req,res)=>{
    try{
        const product=await Product.findById(req.params.id)
        if(!product){
            return res.status(404).json({
                success:false,
                message:"Product not found"
            })
        }
        if(product.seller.toString()!==req.user._id.toString()){
            return res.status(403).json({
                success:false,
                message:"You are not authorized to delete this"
            })
        }

        await Product.findByIdAndDelete(req.params.id)
        return res.status(200).json({
            success:true,
            message:"Product Deleted Successfully!!"
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
//get logged-in seller product

const getMyProducts=async(req,res)=>{
    try{
      const product=await Product.find({seller:req.user._id}).populate("seller","name trustScore profilePic")
    if(!product){
        return res.status(400).json({
            success:false,
            message:"product not exist"
        })
    }
    return res.status(201).json({
        success:true,
        count:product.length,
        product
    })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
    
}

// Admin delete product (bypasses seller ownership check)
export const adminDeleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        await Product.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully by admin"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export {updateProduct,deleteProduct,getMyProducts,getSingleProduct}
