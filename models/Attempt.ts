import { Schema, model, models } from "mongoose";

const AttemptSchema = new Schema({
  userId: { type: String, index: true }, // add auth later
  scenarioId: { type: Schema.Types.ObjectId, ref: "Scenario" },
  persona: Schema.Types.Mixed,
  state: { type: String, default: "OPENING" },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  result: { type: String, enum: ["rejected", "advanced", "closed"] },
  score: Number,
  rubricSnapshot: Schema.Types.Mixed,
  turnCount: { type: Number, default: 0 }
}, { timestamps: true });

export default models.Attempt || model("Attempt", AttemptSchema);

