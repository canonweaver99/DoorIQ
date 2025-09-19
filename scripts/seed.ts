import { db } from "../lib/db";
import Scenario from "../models/Scenario";
import Rubric from "../models/Rubric";
import { seedKnowledge } from "../lib/rag";

async function seed() {
  try {
    await db();
    console.log('Connected to database for seeding...');

    // Seed default scenario
    const scenario = await Scenario.findOneAndUpdate(
      { title: "Logistics Software Demo" },
      {
        title: "Logistics Software Demo",
        vertical: "Logistics",
        difficulty: "med",
        goal: "book_meeting",
        seedBrief: {
          product: "AI-powered route optimization software",
          targetRole: "Operations Director",
          avgDealSize: "20k ARR",
          salesCycle: "45 days"
        },
        initialObjection: "send me an email with information",
        successCriteria: {
          requiresROIQuant: true,
          requiresScheduling: true,
          requiresBudgetCheck: false
        },
        tags: ["logistics", "saas", "operations", "demo"]
      },
      { upsert: true, new: true }
    );

    console.log('Seeded scenario:', scenario.title);

    // Seed default rubric
    const rubric = await Rubric.findOneAndUpdate(
      { name: "Standard Sales Rubric" },
      {
        name: "Standard Sales Rubric",
        weights: { 
          discovery: 25, 
          value: 25, 
          objection: 25, 
          cta: 25 
        },
        hardRules: {
          mustAskDiscoveryQuestions: true,
          mustQuantifyValue: true,
          mustHandleObjections: true,
          mustHaveSpecificCTA: true
        }
      },
      { upsert: true, new: true }
    );

    console.log('Seeded rubric:', rubric.name);

    // Seed knowledge base
    await seedKnowledge();

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

