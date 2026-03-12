import Anthropic from '@anthropic-ai/sdk';
import { Exercise } from '../types/workout';

// NOTE: In production, the API key should be on a server, not in the client.
// For development/prototype, we read from env or hardcode.
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export interface ParsedWorkout {
  label?: string;
  notes?: string;
  exercises: Exercise[];
  clarifyingQuestion?: string;
}

const SYSTEM_PROMPT = `You are a workout logging assistant. Your job is to parse natural, messy, spoken workout descriptions into structured data.

RULES:
1. Parse exercises, sets, reps, and weights from the user's message.
2. Handle corrections and backtracking (e.g., "wait actually I did warmup first").
3. If the user mentions feelings or energy levels, extract that as a note.
4. If reps aren't specified for a set, ask — but ONLY if it's important. Skip warmups if reps aren't given unless they seem intentional.
5. If weight unit isn't specified, default to lb.
6. Keep clarifying questions SHORT (1 sentence max). Only ask when you genuinely can't infer.
7. Try to label the workout (Push Day, Pull Day, Leg Day, Upper Body, etc.) based on the exercises.
8. For exercises with common abbreviations, use the full name (e.g., "bench" = "Bench Press", "RDL" = "Romanian Deadlift", "OHP" = "Overhead Press").

You MUST respond with valid JSON matching this exact schema:
{
  "label": "string or null - workout label like Push Day, Pull Day, Leg Day",
  "notes": "string or null - any feelings, energy levels, or context the user mentioned",
  "exercises": [
    {
      "name": "string - full exercise name",
      "variant": "string or null - e.g. flat, incline, decline, seated, standing",
      "weightUnit": "kg or lb",
      "sets": [
        {
          "setNumber": 1,
          "reps": 8,
          "weight": 185,
          "isWarmup": false
        }
      ]
    }
  ],
  "clarifyingQuestion": "string or null - only ask if truly needed"
}

Respond ONLY with valid JSON. No markdown, no code fences, no explanation.`;

export async function parseWorkoutWithAI(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<ParsedWorkout> {
  try {
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Try to parse JSON from the response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Transform into our Exercise type with IDs
    const exercises: Exercise[] = (parsed.exercises || []).map(
      (ex: any, idx: number) => ({
        id: `e-${Date.now()}-${idx}`,
        name: ex.name || 'Unknown Exercise',
        variant: ex.variant || undefined,
        weightUnit: ex.weightUnit || 'lb',
        sets: (ex.sets || []).map((s: any, si: number) => ({
          setNumber: s.setNumber || si + 1,
          reps: s.reps || 0,
          weight: s.weight || 0,
          isWarmup: s.isWarmup || false,
          rpe: s.rpe,
        })),
      })
    );

    return {
      label: parsed.label || undefined,
      notes: parsed.notes || undefined,
      exercises,
      clarifyingQuestion: parsed.clarifyingQuestion || undefined,
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    // Return a fallback that lets the user know something went wrong
    return {
      exercises: [],
      clarifyingQuestion: "I couldn't parse that. Could you try describing your workout again?",
    };
  }
}
