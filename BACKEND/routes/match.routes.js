import express from "express";
import bcrypt from "bcryptjs";
const { hash } = bcrypt;
import Item, { ITEM_STATUS, CATEGORIES } from "../models/Item.js";
import Match from "../models/Match.js";
import { protect } from "../middleware/auth.js";
import { computeMatch, MATCH_THRESHOLD } from "../utils/matching.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Run matching for a newly-created item against all OPEN/MATCH_FOUND items
// of the opposite type, persisting any matches above the threshold.
async function runMatchingFor(newItem) {
  const oppositeType = newItem.type === "LOST" ? "FOUND" : "LOST";

  const candidates = await Item.find({
    type: oppositeType,
    status: { $in: [ITEM_STATUS.OPEN, ITEM_STATUS.MATCH_FOUND] },
  });

  const createdMatches = [];

  for (const candidate of candidates) {
    const lostItem = newItem.type === "LOST" ? newItem : candidate;
    const foundItem = newItem.type === "FOUND" ? newItem : candidate;

    const { score, breakdown, matchingReasons } = computeMatch(lostItem, foundItem);

    if (score >= MATCH_THRESHOLD) {
      const match = await Match.findOneAndUpdate(
        { lostItemId: lostItem._id, foundItemId: foundItem._id },
        { score, breakdown, matchingReasons, status: "ACTIVE" },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdMatches.push(match);

      await Item.updateMany(
        { _id: { $in: [lostItem._id, foundItem._id] }, status: ITEM_STATUS.OPEN },
        { status: ITEM_STATUS.MATCH_FOUND }
      );
    }
  }

  return createdMatches;
}

// POST /api/items — create a LOST or FOUND item
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const {
      type,
      name,
      category,
      description,
      location,
      date,
      time,
      verificationQuestion,
      verificationAnswer,
    } = req.body;

    if (!type || !["LOST", "FOUND"].includes(type)) {
      return res.status(400).json({ message: "type must be LOST or FOUND" });
    }
    if (!name || !category || !description || !location || !date || !time) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (type === "FOUND" && (!verificationQuestion || !verificationAnswer)) {
      return res.status(400).json({
        message: "Found items require a verification question and answer",
      });
    }

    const itemData = {
      userId: req.userId,
      type,
      name,
      category,
      description,
      location,
      date,
      time,
      image: req.file?.path || null,
    };

    if (type === "FOUND") {
      itemData.verificationQuestion = verificationQuestion;
      itemData.verificationAnswerHash = await hash(
        verificationAnswer.trim().toLowerCase(),
        10
      );
    }

    const item = await Item.create(itemData);
    const matches = await runMatchingFor(item);

    res.status(201).json({ item: sanitize(item), matchesFound: matches.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to create item", error: err.message });
  }
});

// GET /api/items — search & browse with filters
router.get("/", protect, async (req, res) => {
  try {
    const { q, type, category, location, status } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ items: items.map(sanitize) });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

// GET /api/items/mine — current user's lost + found items
router.get("/mine", protect, async (req, res) => {
  const items = await Item.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ items: items.map(sanitize) });
});

// GET /api/items/:id
router.get("/:id", protect, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json({ item: sanitize(item) });
});

// Strip the verification answer hash before ever sending an item to a client.
function sanitize(item) {
  const obj = item.toObject ? item.toObject() : item;
  const { verificationAnswerHash, ...rest } = obj;
  return { ...rest, hasVerificationQuestion: Boolean(item.verificationQuestion) };
}

export default router;