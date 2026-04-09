import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
    index: true,
  },
});

categorySchema.index({ slug: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
