import Anthropic from '@anthropic-ai/sdk';
import { Exercise } from '../types/workout';

// NOTE: In production, the API key should be on a server, not in the client.
// For development, we use EXPO_PUBLIC_ prefix which Expo inlines at build time.
const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

const client = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true,
});

export interface ParsedWorkout {
  label?: string;
  notes?: string;
  exercises: Exercise[];
  clarifyingQuestion?: string;
}

const SYSTEM_PROMPT = `You are a workout logging assistant. Parse natural, messy, spoken workout descriptions into structured data.

RULES:
1. Parse exercises, sets, reps, and weights from the user's message.
2. Handle corrections and backtracking (e.g., "wait actually I did warmup first").
3. If the user mentions feelings or energy levels, extract that as a note.
4. If reps aren't specified for warmup sets, OMIT those warmup sets entirely. Only include warmup sets where reps were explicitly mentioned.
5. If reps aren't specified for working sets, ask a clarifying question.
6. If weight unit isn't specified, default to lb.
7. Keep clarifying questions SHORT (1 sentence max). Only ask when you genuinely can't infer.
8. Label the workout (Push Day, Pull Day, Leg Day, Upper Body, etc.) based on the exercises.
9. Common abbreviations: "bench" = "Bench Press", "RDL" = "Romanian Deadlift", "OHP" = "Overhead Press", "BB" = "Barbell", "DB" = "Dumbbell", "lat raises" = "Lateral Raise", "curls" = "Bicep Curl", "tri" = "Tricep", "pullups/pull-ups" = "Pull-Up", "pushups/push-ups" = "Push-Up", "dips" = "Dip".
10. Number working sets sequentially starting from 1, regardless of warmup sets.
11. "the bar" or "just the bar" means 45lb (or 20kg) for barbell exercises.
12. Bodyweight exercises (push-ups, pull-ups, dips, etc.): set weight to 0, which means bodyweight.
13. "plates" for leg press/sled: 1 plate = 45lb per side. "4 plates" = 4 × 90lb = 360lb total (both sides).
14. "plates" for barbell: 1 plate per side = 135lb total (bar + 2×45). "2 plates" = 225lb, "3 plates" = 315lb.
15. Supersets: log each exercise separately but add "superset" in the notes.
16. Drop sets: log each weight/rep as a separate set, mark later ones with decreasing weight.
17. AMRAP: if user says "AMRAP" or "as many as possible", use the rep count they achieved.
18. Percentage-based: if user says "80% of 315", calculate 252lb (round to nearest 5).
19. "to failure" or "failed at X": use X as the rep count for that set.
20. Same reps across all sets (e.g., "3x8"): create 3 identical sets of 8 reps each.

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
