import mongoose from "mongoose";

export const CATEGORIES = [
  "Electronics",
  "Bags",
  "Documents",
  "Keys",
  "Accessories",
  "Stationery",
  "Other",
];

export const ITEM_STATUS = {
  OPEN: "OPEN",
  MATCH_FOUND: "MATCH_FOUND",
  CLAIM_PENDING: "CLAIM_PENDING",
  VERIFIED: "VERIFIED",
  RETURNED: "RETURNED",
};

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["LOST", "FOUND"], required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM (24h)
    image: { type: String, default: null },

    // Only present on FOUND items. Answer is never returned to clients as plaintext.
    verificationQuestion: { type: String, default: null },
    verificationAnswerHash: { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(ITEM_STATUS),
      default: ITEM_STATUS.OPEN,
    },
  },
  { timestamps: true },
);

itemSchema.index({ name: "text", description: "text", location: "text" });

export default mongoose.model("Item", itemSchema);
