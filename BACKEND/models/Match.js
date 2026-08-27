import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    score: { type: Number, required: true }, // 0-100
    breakdown: {
      category: Number,
      description: Number,
      location: Number,
      time: Number,
    },
    matchingReasons: [{ type: String }],
    status: {
      type: String,
      enum: ["ACTIVE", "DISMISSED", "RESOLVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

export default mongoose.model("Match", matchSchema);
