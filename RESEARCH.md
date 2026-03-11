# AI-Native Gym Tracking App: Technical Research Report

_Research compiled: March 11, 2026_

---

## Executive Summary

The landscape for building an AI-native gym tracking app is mature and well-supported by open source tooling, APIs, and proven architectural patterns. The most successful approach combines: (1) a React Native or Flutter frontend for cross-platform reach, (2) a PostgreSQL-backed backend (Supabase is emerging as a strong choice), (3) on-device speech-to-text via whisper.cpp/whisper.rn for voice logging, (4) an LLM (Claude or GPT) for natural language parsing and workout programming, and (5) integration with Apple HealthKit/Google Health Connect for wearable data.

The key differentiator for an AI-native app is making the LLM the primary interface rather than bolting AI onto a traditional form-based tracker. Voice input parsed into structured workout data, AI-generated programming with progressive overload, and conversational coaching grounded in real training history represent the frontier. Several open source projects (wger, Liftosaur, OpenWorkoutTracker) provide reference implementations, but none yet combine all of these capabilities into a single cohesive product.

---

## 1. Open Source Fitness/Workout Tracking Projects

### Tier 1: Established Projects (1000+ stars)

| Project | Stars | Tech Stack | Key Features |
|---------|-------|------------|--------------|
| [wger](https://github.com/wger-project/wger) | ~5,800 | Python/Django, REST API | Self-hosted, workout + nutrition tracking, exercise wiki, multi-user, Docker deployment, AGPL-3.0 |
| [Liftosaur](https://github.com/astashov/liftosaur) | ~1,100+ | TypeScript/Preact, PWA | Programmable progressive overload via "Liftoscript", 50+ built-in routines, iOS/Android/web |

### Tier 2: Notable Projects (200-1000 stars)

| Project | Stars | Tech Stack | Key Features |
|---------|-------|------------|--------------|
| [workout-tracker (jovandeginste)](https://github.com/jovandeginste/workout-tracker) | ~430 | Go | GPX-based activity tracking, self-hosted, GitHub-style year visualization |
| [OpenWorkoutTracker](https://github.com/msimms/OpenWorkoutTracker) | ~200+ | Swift/SwiftUI, C/C++ | iOS + Apple Watch, cycling + running + strength, Bluetooth sensor support |
| [LiftLog](https://liftlog.online/) | ~200+ | Open source | Free workout tracker focused on simplicity |
| [Gym Routine Tracker](https://open-trackers.github.io/grt/) | ~200+ | Swift | Minimalist Apple Watch/iPhone/iPad tracker |

### AI + Fitness Open Source Projects

| Project | Description | Tech |
|---------|-------------|------|
| [fitness-assistant](https://github.com/alexeygrigorev/fitness-assistant) | RAG-based conversational AI for exercise selection | Python, LLM Zoomcamp |
| [AI-Personal-Trainer](https://github.com/thaochu05/AI-Personal-Trainer) | LLM-generated workout plans + real-time posture correction | Python, Streamlit, OpenCV, MediaPipe |
| [AI Agents as Personal Trainers](https://github.com/imanoop7/AI-Agents-as-Personal-Trainers--Customizing-Fitness-Routines-with-LLMs) | Personalized fitness plans via Ollama + Gradio | Python, Gradio |
| [Fitness AI Trainer](https://github.com/RiccardoRiccio/Fitness-AI-Trainer-With-Automatic-Exercise-Recognition-and-Counting) | Real-time exercise recognition + counting (99% accuracy) | Python, CV |
| [2025_fitness](https://github.com/semperfitodd/2025_fitness) | Full-stack fitness tracker with Claude 3.5 embedded | React.js, SwiftUI/watchOS, AWS Serverless, Terraform |
| [fitness-app-workout-rules-with-claude](https://github.com/dharmveer97/fitness-app-workout-rules-with-claude) | Expo app with Claude AI agents for rule-based activity tracking | Expo, React Native, Claude |
| [awesome-llm-apps (fitness agent)](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_ai_agents/single_agent_apps/ai_health_fitness_agent) | AI health/fitness agent implementation | Python |

### Key Takeaway
**wger** is the gold standard for self-hosted fitness tracking (5,800 stars, active development, comprehensive API). **Liftosaur** is the most technically interesting for a workout tracking app due to its programmable progressive overload system. The **2025_fitness** project is the closest existing reference to what an AI-native fitness app looks like architecturally (Claude embedded in React + SwiftUI with serverless backend).

---

## 2. APIs and Data Sources for Fitness

### Exercise Databases

| API/Database | Exercises | Format | Cost | Notes |
|--------------|-----------|--------|------|-------|
| [ExerciseDB API](https://exercisedb.dev/) | 11,000+ | REST API | Free (open source) | GIFs, videos, images, instructions, target body parts, equipment |
| [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) | 800+ | JSON files | Free (public domain) | Static dataset, browsable frontend, great for offline/embedded use |
| [wger REST API](https://wger.de/en/software/api) | 500+ | REST API (OpenAPI) | Free (self-host) | Exercise wiki, nutrition data, community-contributed |
| [YMove](https://ymove.app/exercise-api) | varies | REST API | Freemium | HD videos included |

**Recommendation**: Use ExerciseDB API for comprehensive exercise data (11K+ exercises with media), and supplement with Free Exercise DB's JSON dataset for offline/fallback capability. wger's API is ideal if self-hosting the entire backend.

### Nutrition APIs

| API | Foods | Cost | Key Feature |
|-----|-------|------|-------------|
| [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide/) | 300,000+ | Free | Government-backed, FDA compliant, 1000 req/hr |
| [Edamam](https://developer.edamam.com/) | 900,000+ foods, 2.3M recipes | Free tier, up to $999/mo | Natural language food parsing, recipe analysis |
| [Nutritionix](https://www.nutritionix.com/) | 1,900,000+ | Free "Hacker" plan | NLP food entry, 700M calls/month capacity |
| [Open Food Facts](https://world.openfoodfacts.org/) | 2,500,000+ | Free (crowd-sourced) | Barcode scanning, open data |

**Recommendation**: Start with USDA FoodData Central (free, comprehensive) and Nutritionix (excellent NLP for food logging). Open Food Facts is a good crowd-sourced supplement.

### Wearable Data Integration

#### Platform-Native APIs

| Platform | API | Data Types | Notes |
|----------|-----|------------|-------|
| **Apple HealthKit** | [HealthKit Framework](https://developer.apple.com/healthkit/) | 100+ data types: steps, heart rate, sleep, workouts, nutrition | On-device, encrypted, granular user permissions |
| **Google Health Connect** | [Health Connect API](https://developer.android.com/health-and-fitness/health-connect) | 50+ data types: activity, sleep, nutrition, vitals | Replaces Google Fit (migrating 2026), built into Android 14+ |

#### React Native Libraries for HealthKit/Health Connect

| Library | Platform | Notes |
|---------|----------|-------|
| [react-native-health](https://github.com/agencyenterprise/react-native-health) | iOS only | Most popular HealthKit binding |
| [react-native-healthkit](https://github.com/kingstinct/react-native-healthkit) | iOS only | Full TypeScript support, Promise-based |
| [react-native-fitness](https://github.com/OvalMoney/react-native-fitness) | iOS + Android | Unified API for both HealthKit and Google Fit |
| [rn-fitness-tracker](https://github.com/kilohealth/rn-fitness-tracker) | iOS + Android | Interact with Google Fit and Apple HealthKit |

#### Wearable-Specific APIs

| Device | API Access | Key Data | Complexity |
|--------|-----------|----------|------------|
| **Whoop** | [Whoop Developer Platform](https://developer.whoop.com/) | Strain, sleep, HRV, recovery, heart rate, respiratory rate | OAuth 2.0, cloud API |
| **Garmin** | [Garmin Connect API](https://developer.garmin.com/) | Activities, heart rate, sleep, stress, body battery | Formal application review required, complex OAuth |
| **Fitbit** | [Fitbit Web API](https://dev.fitbit.com/) | Heart rate, activity, sleep, SpO2, skin temp | OAuth 2.0, personal + production apps |

#### Unified Wearable Integration Services

| Service | Devices | Cost | Key Feature |
|---------|---------|------|-------------|
| [Open Wearables](https://github.com/the-momentum/open-wearables) | 200+ devices (Apple Health, Garmin, Whoop, Polar, Suunto, Samsung) | Free (MIT, self-hosted) | Open source, unified REST API, AI-ready |
| [Terra API](https://tryterra.co/) | 150+ sources | $399-499/mo + usage | Y Combinator backed, webhooks, normalized data |
| [ROOK](https://www.tryrook.io/) | Major wearables | Varies | SDK approach, React Native + Flutter support |

**Recommendation**: For an MVP, use **react-native-health** (iOS) + **Health Connect** (Android) for direct platform integration. For scaling to many wearable brands, evaluate **Open Wearables** (free, self-hosted) before committing to paid services like Terra.

---

## 3. Voice-to-Structured-Data Approaches

### Architecture: Voice Workout Logging Pipeline

```
[User speaks]
    |
    v
[Speech-to-Text] --> Raw transcript: "I did bench press 3 sets of 8 at 185"
    |
    v
[LLM Structured Output] --> JSON:
    {
      "exercise": "bench_press",
      "sets": [
        {"set_number": 1, "reps": 8, "weight": 185, "unit": "lbs"},
        {"set_number": 2, "reps": 8, "weight": 185, "unit": "lbs"},
        {"set_number": 3, "reps": 8, "weight": 185, "unit": "lbs"}
      ]
    }
    |
    v
[Confirm with user] --> [Write to database]
```

### Speech-to-Text Options for Mobile

#### On-Device (Offline, Privacy-First)

| Solution | Platform | Size | Latency | Notes |
|----------|----------|------|---------|-------|
| [whisper.rn](https://github.com/mybigday/whisper.rn) | React Native (iOS + Android) | ~150MB (tiny model) | Real-time | React Native binding of whisper.cpp; works offline; iOS excellent, Android needs ffmpeg workaround |
| [React Native ExecuTorch](https://github.com/software-mansion/react-native-executorch) | React Native (Expo SDK 54+) | ~150MB | Real-time | Meta's inference engine; `useSpeechToText` hook; supports quantized Whisper models (4x smaller) |
| [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition) | Expo (iOS + Android + Web) | Native (no model download) | Real-time | Uses platform native SFSpeechRecognizer (iOS) / SpeechRecognizer (Android) |
| [rn-whisper-stt](https://github.com/israr002/rn-whisper-stt) | React Native | Small (TFLite) | Real-time | Offline STT using TFLite Whisper |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | iOS/Android native | Varies by model | Real-time | C/C++ port, ARM NEON + Metal optimization, Core ML support |

#### Cloud-Based

| Solution | Cost | Accuracy | Notes |
|----------|------|----------|-------|
| [OpenAI Whisper API](https://developers.openai.com/api/docs/guides/speech-to-text/) | $0.006/min | Excellent | Supports json, text, srt, verbose_json output formats |
| [Deepgram](https://deepgram.com/) | Pay-per-use | Excellent | Real-time streaming, very fast |
| Google Speech-to-Text | Pay-per-use | Excellent | Extensive language support |

**Recommendation**: Use **React Native ExecuTorch with Whisper** for on-device (privacy, offline, no API cost) with **OpenAI Whisper API** as a cloud fallback. The ExecuTorch approach uses a `useSpeechToText` hook that integrates naturally with React Native/Expo.

### LLM Parsing: Voice Transcript to Structured Workout Data

The critical second step is parsing the raw transcript into structured workout data. Both Claude and OpenAI now support **Structured Outputs** that guarantee JSON schema compliance.

#### Claude Structured Output Approach (Recommended)

```python
from pydantic import BaseModel
from anthropic import Anthropic

class ExerciseSet(BaseModel):
    set_number: int
    reps: int
    weight: float
    weight_unit: str  # "lbs" or "kg"
    rpe: float | None = None  # Rate of Perceived Exertion

class WorkoutEntry(BaseModel):
    exercise_name: str
    exercise_id: str | None = None  # matched to exercise DB
    sets: list[ExerciseSet]
    notes: str | None = None

class ParsedWorkoutLog(BaseModel):
    entries: list[WorkoutEntry]
    workout_date: str | None = None

# Claude will guarantee output matches this schema exactly
response = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    system="You are a workout logging assistant. Parse the user's spoken workout description into structured data. Match exercise names to standard names. Infer reasonable defaults when information is ambiguous.",
    messages=[{"role": "user", "content": transcript}],
    # Structured output config ensures schema compliance
)
```

#### OpenAI Structured Output Approach

```python
from pydantic import BaseModel
from openai import OpenAI

# Same Pydantic models as above
response = client.chat.completions.create(
    model="gpt-4o-mini",  # sufficient for extraction
    messages=[
        {"role": "system", "content": "Parse workout voice transcripts into structured JSON."},
        {"role": "user", "content": transcript}
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "workout_log",
            "strict": True,
            "schema": ParsedWorkoutLog.model_json_schema()
        }
    }
)
```

#### Key Parsing Challenges and Solutions

| Challenge | Example Input | Solution |
|-----------|--------------|----------|
| Ambiguous exercise names | "bench", "flat bench", "barbell bench press" | Fuzzy match against exercise DB; LLM normalization |
| Implied repetition | "3 sets of 8" | LLM understands this means 3 identical sets |
| Mixed formats | "185 for 8, then dropped to 135 for 12" | LLM handles drop sets, ascending/descending |
| Partial logging | "same as last time but add 5 pounds" | Requires workout history context in prompt |
| Units | "two plates" (meaning 225 lbs) | Domain-specific training in system prompt |

**Recommendation**: Use Claude's structured outputs with Pydantic models. Claude Sonnet 4.5 or GPT-4o-mini are both sufficient for this extraction task and cost-effective. The system prompt should include exercise name normalization rules and common gym slang (e.g., "two plates" = 225 lbs for barbell exercises).

---

## 4. Tech Stacks Commonly Used

### Production Fitness App Tech Stacks

| App | Frontend | Backend | Database | AI/ML |
|-----|----------|---------|----------|-------|
| **Hevy** | React Native, MobX, React Navigation | Node.js, TypeScript | PostgreSQL | Charting via Victory Native |
| **Fitbod** | Native iOS (Swift) + Android | Proprietary | Proprietary | Custom ML algorithm (400M+ data points) |
| **FitnessAI** | Native iOS + Android | Proprietary | Proprietary | Algorithm trained on 5.9M workouts |
| **Liftosaur** | Preact/TypeScript (PWA) | Serverless | Local storage + sync | Liftoscript (custom scripting language) |
| **2025_fitness** | React.js + SwiftUI/watchOS | AWS Serverless (Lambda, API Gateway) | DynamoDB | Claude 3.5 embedded |

### Recommended Tech Stack for an AI-Native Gym App

#### Frontend
```
React Native (Expo SDK 54+)
  - TypeScript
  - Expo Router (file-based routing)
  - React Native ExecuTorch (on-device Whisper)
  - react-native-health / Health Connect
  - Victory Native or react-native-chart-kit (visualizations)
  - Zustand or Jotai (state management)
```

#### Backend
```
Option A: Supabase (recommended for speed)
  - PostgreSQL database
  - Row-level security
  - Real-time subscriptions
  - Auth (social + email)
  - Edge Functions (Deno) for AI processing
  - Storage for progress photos

Option B: Custom Node.js
  - Express/Fastify + TypeScript
  - PostgreSQL (via Prisma or Drizzle ORM)
  - Redis for caching
  - JWT auth
```

#### AI Layer
```
Claude API (Anthropic)
  - Structured outputs for voice parsing
  - Workout programming / plan generation
  - Conversational coaching
  - Tool use for querying workout history

OR

OpenAI API
  - Whisper API (cloud STT fallback)
  - GPT-4o-mini (extraction/parsing)
  - GPT-4o (complex coaching/programming)
```

#### Infrastructure
```
Vercel / AWS (hosting)
Supabase (BaaS)
Sentry (error monitoring)
PostHog / Mixpanel (analytics)
```

### Database Schema for Workout Tracking

Based on analysis of wger, Liftosaur, Hevy, and multiple open source trackers, here is a recommended PostgreSQL schema:

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    weight_unit TEXT DEFAULT 'lbs',  -- 'lbs' or 'kg'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise library (reference data)
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    aliases TEXT[],                    -- ["bench", "flat bench", "barbell bench press"]
    primary_muscles TEXT[] NOT NULL,   -- ["chest", "triceps"]
    secondary_muscles TEXT[],         -- ["anterior_deltoid"]
    equipment TEXT,                    -- "barbell", "dumbbell", "machine", "bodyweight"
    exercise_type TEXT,               -- "strength", "cardio", "stretching"
    instructions TEXT,
    media_url TEXT,                    -- GIF/video URL
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT,                         -- "Push Day", "Upper Body A"
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    source TEXT DEFAULT 'manual',      -- 'manual', 'voice', 'ai_generated'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises performed in a workout
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    order_index INTEGER NOT NULL,      -- ordering within the workout
    notes TEXT,
    rest_seconds INTEGER,              -- rest between sets
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual sets within an exercise
CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    set_type TEXT DEFAULT 'working',   -- 'warmup', 'working', 'drop', 'failure'
    reps INTEGER,
    weight DECIMAL(7,2),               -- stored in user's preferred unit
    weight_unit TEXT DEFAULT 'lbs',
    duration_seconds INTEGER,          -- for timed exercises (planks, etc.)
    distance_meters DECIMAL(10,2),     -- for cardio
    rpe DECIMAL(3,1),                  -- Rate of Perceived Exertion (1-10)
    is_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal records tracking
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    record_type TEXT NOT NULL,          -- '1rm', 'max_weight', 'max_reps', 'max_volume'
    value DECIMAL(10,2) NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL,
    set_id UUID REFERENCES exercise_sets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exercise_id, record_type)
);

-- Workout templates / programs
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    program_id UUID,                    -- for multi-day programs
    day_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    order_index INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps TEXT,                   -- "8-12" or "5" or "AMRAP"
    target_weight DECIMAL(7,2),
    target_rpe DECIMAL(3,1),
    rest_seconds INTEGER,
    progression_rule TEXT,             -- JSON or Liftoscript-style rule
    notes TEXT
);

-- Body measurements / progress
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    measured_at TIMESTAMPTZ NOT NULL,
    body_weight DECIMAL(5,1),
    body_fat_pct DECIMAL(4,1),
    -- specific measurements
    chest_cm DECIMAL(5,1),
    waist_cm DECIMAL(5,1),
    hips_cm DECIMAL(5,1),
    bicep_cm DECIMAL(5,1),
    thigh_cm DECIMAL(5,1),
    notes TEXT
);

-- AI conversation history (for coaching context)
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL,                 -- 'user', 'assistant'
    content TEXT NOT NULL,
    metadata JSONB,                    -- structured data extracted, tool calls, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_workouts_user_date ON workouts(user_id, started_at DESC);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, measured_at DESC);
```

### Key Data Model Design Decisions

1. **Separate `workout_exercises` and `exercise_sets` tables**: This allows tracking per-set data (RPE, set type) while maintaining the exercise-level context (order, rest time, notes).

2. **`set_type` field**: Distinguishes warmup, working, drop, and failure sets -- critical for accurate volume calculation and progressive overload.

3. **`source` field on workouts**: Tracks whether the workout was logged manually, via voice, or generated by AI -- useful for analytics and debugging.

4. **`aliases` array on exercises**: Enables fuzzy matching when parsing voice input ("bench" -> "Barbell Bench Press").

5. **`progression_rule` on templates**: Stores the progressive overload logic. Could be simple JSON like `{"type": "linear", "increment_lbs": 5, "condition": "all_sets_completed"}` or a more complex scripting language like Liftosaur's Liftoscript.

6. **`ai_conversations` table**: Stores the coaching conversation history so the LLM has context for personalized advice.

---

## 5. Interesting Approaches and Innovations

### Claude/GPT as Core Interface

The most interesting emerging pattern is using an LLM as the **primary interface** rather than traditional forms:

**[2025_fitness by semperfitodd](https://github.com/semperfitodd/2025_fitness)**
- Claude 3.5 embedded in both React web app and iOS/SwiftUI app
- AWS serverless backend (Lambda, API Gateway, DynamoDB)
- WatchConnectivity for Apple Watch real-time sync
- Claude generates personalized fitness routines
- Full Terraform infrastructure-as-code

**Claude as SQL-Generating Coach** ([Building My Own AI Fitness Coach Using Claude Code](https://medium.com/@natetang/building-my-own-ai-fitness-coach-using-claude-code-cf52663370c2))
- Two-step reasoning pattern: user question -> Claude generates SQL -> query database -> Claude answers with context
- Handles questions like "Can I move my long run to Friday?" or "How should I adjust after missing a workout?"
- Claude retrieves workout history via tool use, then reasons about the answer

**Key Architectural Pattern**: The LLM acts as both the input parser (voice -> structured data) AND the output generator (workout recommendations, coaching advice). The database becomes the LLM's "memory."

### Progressive Overload Tracking Algorithms

#### Fitbod's Approach (Most Sophisticated)
- Built on 400M+ data points from 150M+ logged workouts
- Models muscle recovery (0-100% per muscle group) based on sets x reps x weight
- Estimates 1RM per exercise, tracks mStrength score per muscle group
- Dynamic adaptation: varies sets, reps, and weights based on performance trends
- Volume increase sweet spot: ~10-15% weekly for fastest strength gains
- Balances progressive overload with recovery status

#### Liftosaur's Liftoscript (Most Programmable)
- Custom scripting language for defining progression/deload logic
- State variables persist between workouts
- Can express any program: 5/3/1, GZCLP, PPL, custom
- Built-in Linear, Double, and Rep Sum progressions
- Open source -- the progression logic is inspectable and modifiable

#### Simple Progressive Overload Algorithm (Implementable)
```
For each exercise after a completed workout:
  1. Calculate if target was met (all sets at target reps completed)
  2. If YES:
     - For barbell exercises: increase weight by 5 lbs (2.5 kg)
     - For dumbbell exercises: increase weight by 5 lbs (2.5 kg)
     - For isolation exercises: increase weight by 2.5 lbs (1 kg)
     OR increase reps within target range (e.g., 8 -> 9 -> 10)
  3. If NO (failed to hit target reps):
     - Track consecutive failures
     - After 2-3 failures: deload by 10% and rebuild
  4. Store new targets for next session
```

#### More Advanced: DUP (Daily Undulating Periodization)
```
Week structure varies rep ranges:
  Day 1: Heavy (3-5 reps, higher weight)
  Day 2: Moderate (8-10 reps, moderate weight)
  Day 3: Light (12-15 reps, lower weight)

Weight auto-calculated from estimated 1RM:
  Heavy day: 85-90% of 1RM
  Moderate day: 70-80% of 1RM
  Light day: 60-70% of 1RM

1RM estimated via Epley formula:
  1RM = weight * (1 + reps/30)
```

### AI-Generated Workout Programming

The approach involves giving the LLM:
1. User's training history (last 4-8 weeks of logged workouts)
2. User's goals (hypertrophy, strength, endurance)
3. Available equipment
4. Schedule constraints (how many days/week, time per session)
5. Recovery status (sleep, soreness, HRV if available)

The LLM then generates a structured program using tool use / structured outputs. This is where Claude's tool use capability shines -- the LLM can query the workout database to understand patterns before generating recommendations.

### Computer Vision for Form Checking

| Technology | Performance | Platform | Notes |
|------------|-------------|----------|-------|
| [MediaPipe Pose](https://github.com/google-ai-edge/mediapipe) | 30 FPS, 33 3D landmarks | iOS, Android, Web | Google's solution, well-supported |
| [RepDetect](https://github.com/giaongo/RepDetect) | Real-time | Android (Kotlin) | Rep counting + form feedback |
| [PoseTracker](https://www.posetracker.com/) | Real-time | API-based | No SDK needed, web-based |
| TensorFlow Lite Pose | Varies | iOS, Android | Lightweight, optimized for edge |
| [Computer-Vision-Weightlifting-Coach](https://github.com/SravB/Computer-Vision-Weightlifting-Coach) | Post-hoc analysis | Desktop | Analyzes deadlift form, scores 0-1 |

**Key Findings on CV for Form Checking**:
- MediaPipe Pose with custom biomechanical logic achieves up to 99.5% rep counting accuracy at 30 FPS
- The main challenge is not pose estimation (which is solved) but the domain-specific biomechanical analysis on top of the raw landmarks
- Real-time form checking on mobile is feasible but resource-intensive
- A practical approach: record short clips, analyze post-hoc on device or cloud, provide feedback
- This is a V2+ feature, not MVP-critical

---

## 6. Research Gaps and Limitations

1. **Hevy's internal backend architecture** is not publicly documented beyond "React Native + Node.js + PostgreSQL" from job postings. The detailed database schema and API design are proprietary.

2. **Fitbod's algorithm details** are described at a high level (recovery modeling, 1RM estimation, volume tracking) but the actual ML model architecture, training process, and feature engineering are not public.

3. **Voice logging accuracy in gym environments** is under-studied. Gyms are noisy (music, clanking weights, other people). Real-world STT accuracy in gym conditions likely degrades compared to quiet environments. This needs empirical testing.

4. **Longitudinal AI coaching effectiveness** -- no published studies yet on whether LLM-based fitness coaching actually improves adherence or outcomes vs. traditional app-based tracking.

5. **Offline-first architecture with AI** is an unsolved tension. On-device Whisper handles STT offline, but LLM-based parsing and coaching require connectivity (unless using on-device LLMs which are still limited in capability for complex reasoning).

---

## 7. Confidence Assessment

| Finding | Confidence | Notes |
|---------|------------|-------|
| Tech stack recommendations | HIGH | Based on multiple production apps (Hevy, Liftosaur, etc.) |
| Database schema design | HIGH | Synthesized from multiple open source projects and tutorials |
| Voice-to-structured-data pipeline | HIGH | Well-established pattern; structured outputs guarantee schema compliance |
| On-device Whisper viability | MEDIUM-HIGH | Works well in demos; gym noise resilience needs testing |
| Exercise API recommendations | HIGH | ExerciseDB and wger are well-established, actively maintained |
| Progressive overload algorithms | HIGH | Well-documented by Fitbod, Liftosaur, Dr. Muscle |
| CV form checking feasibility | MEDIUM | Works technically but mobile performance and UX are challenging |
| Open Wearables as unified API | MEDIUM | New project (launched late 2025), needs maturity evaluation |

---

## 8. Recommended Follow-ups

1. **Prototype the voice pipeline**: Build a minimal Expo app with whisper.rn -> Claude structured output to validate accuracy in gym environments
2. **Evaluate Supabase vs. custom backend**: Set up the schema above in Supabase and test real-time subscriptions for live workout logging
3. **Test ExerciseDB API**: Verify data quality, image/GIF availability, and response times for the exercises you care about
4. **Benchmark on-device Whisper**: Test whisper.rn with gym background noise recordings to establish accuracy baseline
5. **Review Liftosaur's Liftoscript**: Study the scripting language for progressive overload -- it may be worth adapting or learning from for your own progression system
6. **Evaluate Open Wearables**: Self-host and test integration with Apple Health / Garmin to assess maturity

---

## Sources

### Open Source Projects
- [wger - Self-hosted Fitness Tracker](https://github.com/wger-project/wger)
- [Liftosaur - Weightlifting Tracker for Coders](https://github.com/astashov/liftosaur)
- [2025_fitness - Claude-powered Fitness Tracker](https://github.com/semperfitodd/2025_fitness)
- [fitness-assistant - RAG Fitness App](https://github.com/alexeygrigorev/fitness-assistant)
- [AI-Personal-Trainer](https://github.com/thaochu05/AI-Personal-Trainer)
- [Open Wearables](https://github.com/the-momentum/open-wearables)
- [whisper.rn](https://github.com/mybigday/whisper.rn)
- [React Native ExecuTorch](https://github.com/software-mansion/react-native-executorch)
- [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
- [react-native-health](https://github.com/agencyenterprise/react-native-health)
- [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
- [ExerciseDB API](https://github.com/ExerciseDB/exercisedb-api)
- [RepDetect](https://github.com/giaongo/RepDetect)
- [MediaPipe](https://github.com/google-ai-edge/mediapipe)

### APIs and Services
- [ExerciseDB API Docs](https://exercisedb.dev/)
- [wger REST API](https://wger.de/en/software/api)
- [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide/)
- [Edamam API](https://developer.edamam.com/)
- [Apple HealthKit](https://developer.apple.com/healthkit/)
- [Google Health Connect](https://developer.android.com/health-and-fitness/health-connect)
- [Terra API](https://tryterra.co/)
- [OpenAI Whisper API](https://developers.openai.com/api/docs/guides/speech-to-text/)
- [Claude Structured Outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs/)

### Articles and Tutorials
- [How We Built Hevy](https://www.hevyapp.com/how-we-built-hevy/)
- [Building a Fitness Coach Using Claude Code](https://medium.com/@natetang/building-my-own-ai-fitness-coach-using-claude-code-cf52663370c2)
- [How Fitbod's AI Works](https://fitbod.me/blog/fitbod-algorithm/)
- [Fitbod Progressive Overload](https://fitbod.me/blog/what-is-progressive-overload-and-how-fitbod-builds-it-into-every-workout-automatically/)
- [AI Fitness Coach with Open-Source LLMs](https://pub.towardsai.net/how-to-build-your-own-ai-fitness-coach-using-open-source-llms-and-gradio-3151e429692f)
- [LLM Personal Trainer with Langchain](https://medium.com/@mcfaddenrbenjamin/building-a-llm-personal-trainer-with-streamlit-langchain-337a8efac832)
- [Speech-to-Task with LLM](https://medium.com/@scmstorz/from-speech-to-task-building-a-lightweight-llm-powered-voice-driven-todo-app-e8b1707edf26)
- [Expo Blog: On-Device AI with ExecuTorch](https://expo.dev/blog/how-to-run-ai-models-with-react-native-executorch)
- [Fitness App Tech Stack Guide](https://fivedottwelve.com/blog/how-to-choose-the-tech-stack-for-a-fitness-app/)
- [Fitness Database Schema Tutorial](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application)
