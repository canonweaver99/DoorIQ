import { Schema, model, models } from "mongoose";

const ScenarioSchema = new Schema({
  title: String,
  vertical: String,
  difficulty: { type: String, enum: ["easy", "med", "hard", "boss"], default: "med" },
  goal: { type: String, enum: ["discovery", "book_meeting", "close_deal"], default: "book_meeting" },
  seedBrief: Schema.Types.Mixed,
  initialObjection: String,
  successCriteria: Schema.Types.Mixed,
  tags: [String]
}, { timestamps: true });

export default models.Scenario || model("Scenario", ScenarioSchema);

