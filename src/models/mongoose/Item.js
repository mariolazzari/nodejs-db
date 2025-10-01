import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      index: {
        unique: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// index by ascending tags
ItemSchema.index({ tags: 1 });
// index by ascending name
ItemSchema.index({ name: 1 });
// text index for text search on name and tags
ItemSchema.index({ name: "text", tags: "text" });

export const Item = mongoose.model("Item", ItemSchema);
