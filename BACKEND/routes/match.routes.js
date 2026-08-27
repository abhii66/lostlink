import express from "express";
import Match from "../models/Match.js";
import Item from "../models/Item.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/matches/for-item/:itemId — all active matches involving this item
router.get("/for-item/:itemId", protect, async (req, res) => {
  try {
    const { itemId } = req.params;

    const matches = await Match.find({
      status: "ACTIVE",
      $or: [{ lostItemId: itemId }, { foundItemId: itemId }],
    })
      .sort({ score: -1 })
      .populate("lostItemId")
      .populate("foundItemId");

    res.json({ matches: matches.map(sanitizeMatch) });
  } catch (err) {
    res.status(500).json({ message: "Failed to load matches", error: err.message });
  }
});

// GET /api/matches/mine — active matches involving any of the current user's items
router.get("/mine", protect, async (req, res) => {
  try {
    const myItems = await Item.find({ userId: req.userId }).select("_id");
    const myItemIds = myItems.map((i) => i._id);

    const matches = await Match.find({
      status: "ACTIVE",
      $or: [{ lostItemId: { $in: myItemIds } }, { foundItemId: { $in: myItemIds } }],
    })
      .sort({ score: -1 })
      .populate("lostItemId")
      .populate("foundItemId");

    res.json({ matches: matches.map(sanitizeMatch) });
  } catch (err) {
    res.status(500).json({ message: "Failed to load matches", error: err.message });
  }
});

function sanitizeMatch(match) {
  const obj = match.toObject();
  for (const key of ["lostItemId", "foundItemId"]) {
    if (obj[key] && typeof obj[key] === "object") {
      delete obj[key].verificationAnswerHash;
    }
  }
  return obj;
}

export default router;
