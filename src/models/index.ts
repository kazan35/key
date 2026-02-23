import mongoose, { Schema, models, model } from "mongoose";

// ─── KEY ───────────────────────────────────────────────────────────────────
const KeySchema = new Schema(
  {
    key:           { type: String, required: true, unique: true, index: true },
    status:        { type: String, enum: ["active", "expired", "deleted", "banned"], default: "active" },
    durationType:  { type: String, enum: ["minutes", "days", "permanent"], required: true },
    durationValue: { type: Number },
    expiresAt:     { type: Date, index: true },
    deletedAt:     { type: Date },          // TTL index below — 30 days after this
    robloxNick:    { type: String },
    hwid:          { type: String, index: true },
    ip:            { type: String },
    note:          { type: String },
    usageCount:    { type: Number, default: 0 },
    lastUsedAt:    { type: Date },
  },
  { timestamps: true }
);
// Apaga automaticamente 30 dias após deletedAt
KeySchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// ─── LOG ───────────────────────────────────────────────────────────────────
const LogSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["execution", "create", "delete", "restore", "invalid_attempt", "blocked_attempt", "admin_action"],
      required: true,
    },
    key:        { type: String },
    robloxNick: { type: String },
    hwid:       { type: String },
    ip:         { type: String },
    message:    { type: String },
    adminIp:    { type: String },
    timestamp:  { type: Date, default: Date.now, index: true },
  }
);

// ─── BLACKLIST ─────────────────────────────────────────────────────────────
const BlacklistSchema = new Schema(
  {
    type:   { type: String, enum: ["hwid", "ip", "robloxNick"], required: true },
    value:  { type: String, required: true, index: true },
    reason: { type: String },
  },
  { timestamps: true }
);
BlacklistSchema.index({ type: 1, value: 1 }, { unique: true });

// ─── AUDIT ─────────────────────────────────────────────────────────────────
const AuditSchema = new Schema({
  action:    { type: String, required: true },
  detail:    { type: String },
  adminIp:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// ─── KEY USAGE ─────────────────────────────────────────────────────────────
const KeyUsageSchema = new Schema({
  key:        { type: String, required: true, index: true },
  hwid:       { type: String },
  ip:         { type: String },
  robloxNick: { type: String },
  timestamp:  { type: Date, default: Date.now, index: true },
});

export const Key       = models.Key       || model("Key",       KeySchema);
export const Log       = models.Log       || model("Log",       LogSchema);
export const Blacklist = models.Blacklist || model("Blacklist", BlacklistSchema);
export const Audit     = models.Audit     || model("Audit",     AuditSchema);
export const KeyUsage  = models.KeyUsage  || model("KeyUsage",  KeyUsageSchema);
