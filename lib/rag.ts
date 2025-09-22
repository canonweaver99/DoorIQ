import KnowledgeChunk from "@/models/KnowledgeChunk";
import { db } from "./db";

export async function retrieveRAG(query: string, limit = 4): Promise<string> {
  try {
    await db();
    
    // TEMP: naive keyword search. Replace with Atlas Vector Search later.
    const keywords = query.split(/\s+/).slice(0, 4);
    const regex = new RegExp(keywords.join("|"), "i");
    
    const docs = await KnowledgeChunk.find({ 
      $or: [
        { title: regex }, 
        { content: regex },
        { productArea: regex }
      ] 
    }).limit(limit);
    
    if (docs.length === 0) {
      return "No relevant knowledge found.";
    }
    
    return docs.map(d => `${d.title}:\n${d.content}`).join("\n---\n");
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return "Knowledge retrieval temporarily unavailable.";
  }
}

// Seed some basic knowledge chunks
export async function seedKnowledge() {
  await db();
  
  const chunks = [
    {
      title: "Pest Control Service Benefits",
      content: "Our quarterly pest control service prevents 95% of common household pest issues including ants, spiders, roaches, and mice. We use family-safe, EPA-approved treatments that are effective yet safe around children and pets. Most customers see results within 24-48 hours.",
      productArea: "Benefits",
      updatedAt: new Date()
    },
    {
      title: "Treatment Process",
      content: "Our comprehensive treatment includes: interior crack and crevice treatment, exterior perimeter barrier, attic and crawl space inspection, and targeted problem area treatment. Each service takes 45-60 minutes and includes a detailed report.",
      productArea: "Process",
      updatedAt: new Date()
    },
    {
      title: "Safety and Chemicals",
      content: "We use only EPA-registered products that are safe when applied correctly. Our technicians are state-certified and trained in Integrated Pest Management (IPM). All products break down naturally and pose minimal risk to families and pets when dry.",
      productArea: "Safety",
      updatedAt: new Date()
    },
    {
      title: "Pricing and Packages",
      content: "Quarterly service starts at $89/treatment for standard homes (up to 2500 sq ft). Includes unlimited callbacks between services. Annual plans offer 15% savings. Initial service includes comprehensive inspection and first treatment for $129.",
      productArea: "Pricing",
      updatedAt: new Date()
    },
    {
      title: "Guarantee and Follow-up",
      content: "We offer a 30-day satisfaction guarantee - if pests return between scheduled services, we come back at no charge. Our technicians provide seasonal pest prevention tips and will adjust treatment plans based on what we find during each visit.",
      productArea: "Guarantee",
      updatedAt: new Date()
    },
    {
      title: "Common Objection Responses",
      content: "For 'we don't have bugs now' - emphasize prevention is more cost-effective than reactive treatment. For 'too expensive' - break down cost per day ($1-3/day for peace of mind). For 'DIY works' - explain professional products are more effective and longer-lasting.",
      productArea: "Objections",
      updatedAt: new Date()
    }
  ];

  for (const chunk of chunks) {
    await KnowledgeChunk.findOneAndUpdate(
      { title: chunk.title },
      chunk,
      { upsert: true, new: true }
    );
  }
  
  console.log('Seeded knowledge base with', chunks.length, 'chunks');
}

// Export alias for backward compatibility
export const retrieveContext = retrieveRAG;
