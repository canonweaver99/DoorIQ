import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Scenario from '@/models/Scenario';
import Rubric from '@/models/Rubric';
import { seedKnowledge } from '@/lib/rag';

export async function POST() {
  try {
    await db();
    console.log('Connected to database for seeding...');

    // Seed default scenario
    const scenario = await Scenario.findOneAndUpdate(
      { title: "Residential Pest Control Sales" },
      {
        title: "Residential Pest Control Sales",
        vertical: "Pest Control",
        difficulty: "med",
        goal: "book_meeting",
        seedBrief: {
          product: "Quarterly residential pest control service",
          targetRole: "Homeowner",
          avgDealSize: "$300-1200 annually",
          salesCycle: "Same day to 1 week"
        },
        initialObjection: "we don't really have a pest problem right now",
        successCriteria: {
          requiresROIQuant: false,
          requiresScheduling: true,
          requiresBudgetCheck: true
        },
        tags: ["pest-control", "residential", "door-to-door", "service"]
      },
      { upsert: true, new: true }
    );

    // Seed default rubric
    const rubric = await Rubric.findOneAndUpdate(
      { name: "Pest Control Sales Rubric" },
      {
        name: "Pest Control Sales Rubric",
        weights: { 
          discovery: 25, 
          value: 25, 
          objection: 25, 
          cta: 25 
        },
        hardRules: {
          mustBuildRapport: true,
          mustAddressSafety: true,
          mustHandleObjections: true,
          mustOfferScheduling: true
        }
      },
      { upsert: true, new: true }
    );

    // Seed knowledge base
    await seedKnowledge();

    return NextResponse.json({ 
      success: true,
      seeded: {
        scenario: scenario.title,
        rubric: rubric.name,
        knowledgeChunks: 4
      }
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
