import { Schema, model, models } from "mongoose";

const TurnSchema = new Schema({
  attemptId: { type: Schema.Types.ObjectId, ref: "Attempt", index: true },
  role: { type: String, enum: ["rep", "prospect", "system"], index: true },
  text: String,
  meta: Schema.Types.Mixed,
  ts: { type: Date, default: Date.now }
}, { timestamps: true });

export default models.Turn || model("Turn", TurnSchema);

