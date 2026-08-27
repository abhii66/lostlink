import express from "express";
import bcrypt from "bcryptjs";
const { compare } = bcrypt;
import Claim from "../models/Claim.js";
import Item, { ITEM_STATUS } from "../models/Item.js";
import Match from "../models/Match.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/claims — claimant submits an answer for a FOUND item
router.post("/", protect, async (req, res) => {
  try {
    const { itemId, matchId, answer } = req.body;
    if (!itemId || !answer) {
      return res.status(400).json({ message: "itemId and answer are required" });
    }

    const item = await Item.findById(itemId);
    if (!item || item.type !== "FOUND") {
      return res.status(404).json({ message: "Found item not found" });
    }
    if (item.status === ITEM_STATUS.RETURNED) {
      return res.status(400).json({ message: "This item has already been returned" });
    }
    if (String(item.userId) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot claim an item you reported" });
    }

    const claim = await Claim.create({
      itemId,
      matchId: matchId || null,
      claimantId: req.userId,
      answer,
    });

    item.status = ITEM_STATUS.CLAIM_PENDING;
    await item.save();

    res.status(201).json({ claim });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit claim", error: err.message });
  }
});

// GET /api/claims/for-item/:itemId — finder views claims on their found item
router.get("/for-item/:itemId", protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only the finder can view claims on this item" });
    }

    const claims = await Claim.find({ itemId: item._id })
      .populate("claimantId", "name email")
      .sort({ createdAt: -1 });

    // Auto-check each answer against the stored hash as a hint for the finder —
    // the finder still makes the final Verify/Reject call themselves.
    const claimsWithHint = await Promise.all(
      claims.map(async (claim) => {
        const obj = claim.toObject();
        obj.likelyCorrect = item.verificationAnswerHash
          ? await compare(claim.answer.trim().toLowerCase(), item.verificationAnswerHash)
          : null;
        return obj;
      })
    );

    res.json({
      claims: claimsWithHint,
      verificationQuestion: item.verificationQuestion,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load claims", error: err.message });
  }
});

// GET /api/claims/pending — all pending claims across the current user's found items
router.get("/pending", protect, async (req, res) => {
  const myFoundItems = await Item.find({ userId: req.userId, type: "FOUND" }).select("_id");
  const claims = await Claim.find({
    itemId: { $in: myFoundItems.map((i) => i._id) },
    status: "PENDING",
  })
    .populate("claimantId", "name email")
    .populate("itemId")
    .sort({ createdAt: -1 });

  res.json({ claims });
});

// PATCH /api/claims/:id/verify — finder approves the claim
router.patch("/:id/verify", protect, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const item = await Item.findById(claim.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only the finder can verify this claim" });
    }

    claim.status = "VERIFIED";
    await claim.save();

    item.status = ITEM_STATUS.VERIFIED;
    await item.save();

    // Reject any other pending claims on the same item.
    await Claim.updateMany(
      { itemId: item._id, _id: { $ne: claim._id }, status: "PENDING" },
      { status: "REJECTED" }
    );

    res.json({ claim, item });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify claim", error: err.message });
  }
});

// PATCH /api/claims/:id/reject — finder rejects the claim
router.patch("/:id/reject", protect, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const item = await Item.findById(claim.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (String(item.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only the finder can reject this claim" });
    }

    claim.status = "REJECTED";
    await claim.save();

    // Only reopen the item if no other pending claims remain.
    const stillPending = await Claim.exists({ itemId: item._id, status: "PENDING" });
    if (!stillPending && item.status === ITEM_STATUS.CLAIM_PENDING) {
      item.status = ITEM_STATUS.MATCH_FOUND;
      await item.save();
    }

    res.json({ claim, item });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject claim", error: err.message });
  }
});

// PATCH /api/claims/:id/return — finder marks the item as handed over
router.patch("/:id/return", protect, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.status !== "VERIFIED") {
      return res.status(400).json({ message: "Claim must be verified before it can be returned" });
    }

    const item = await Item.findById(claim.itemId);
    if (String(item.userId) !== String(req.userId)) {
      return res.status(403).json({ message: "Only the finder can mark this item returned" });
    }

    item.status = ITEM_STATUS.RETURNED;
    await item.save();

    await Match.updateMany(
      { $or: [{ lostItemId: item._id }, { foundItemId: item._id }] },
      { status: "RESOLVED" }
    );

    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark item returned", error: err.message });
  }
});

export default router;