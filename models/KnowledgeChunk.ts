import { Schema, model, models } from "mongoose";

const KnowledgeChunkSchema = new Schema({
  title: String,
  content: String,
  embedding: { type: [Number], default: [] }, // Vector Search later
  sourceURL: String,
  productArea: String,
  updatedAt: Date
}, { timestamps: true });

export default models.KnowledgeChunk || model("KnowledgeChunk", KnowledgeChunkSchema);

