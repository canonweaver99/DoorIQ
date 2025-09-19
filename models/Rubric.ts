import { Schema, model, models } from "mongoose";

const RubricSchema = new Schema({
  name: String,
  weights: { 
    discovery: Number, 
    value: Number, 
    objection: Number, 
    cta: Number 
  },
  hardRules: Schema.Types.Mixed
}, { timestamps: true });

export default models.Rubric || model("Rubric", RubricSchema);

