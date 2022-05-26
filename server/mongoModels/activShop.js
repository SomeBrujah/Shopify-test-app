import mongoose from "mongoose";

const activeShopSchema = new mongoose.Schema({
    shop: String,
    scope: String
})

export const ActiveShopModel = mongoose.model("activeShops", activeShopSchema);