# Prepora --- AI Interview Preparation Kit

> A full-stack application that turns a job description, company website
> and interview timeline into a structured, research-backed interview
> preparation kit.

Prepora was built for the **application requirements ---
The AI Interview Prep Kit**. The implementation follows the required kit
schema and batch entry point while using a TypeScript + Supabase
architecture.

the application requires the application to research a company, extract
role requirements, generate targeted interview material, check question
coverage, build a deterministic study schedule, and allow the resulting
kit to be edited and practised inside the application.

------------------------------------------------------------------------

## 1. Features

-   User registration, login and protected application routes
-   Create an interview kit from:
    -   Job description
    -   Company website URL
    -   Number of days available before the interview
-   Company website crawling and content extraction
-   `robots.txt` aware retrieval
-   Public interview-process research
-   Requirement extraction with `technical`, `behavioural`, and `domain`
    classification
-   Company brief generation
-   Requirement-linked question generation
-   Question categories:
    -   Technical
    -   Behavioural
    -   System Design
    -   Company Fit
-   Flashcard generation
-   Requirement-to-question coverage checking
-   Second-pass generation for uncovered requirements
-   Deterministic study schedule allocation
-   Inline editing of generated content
-   Question and flashcard creation/deletion
-   Reordering of questions and flashcards
-   Per-section regeneration
-   Preservation of user-edited/pinned content during regeneration
-   Flashcard practice mode with confidence tracking
-   Generation progress and failure states
-   Persistent kit storage
-   Batch evaluation pipeline
-   Structured validation of generated kit data

------------------------------------------------------------------------

## 2. Tech Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Reason
  ----------------------- ----------------------- -----------------------
  Frontend                **Next.js + React +     Matches the
                          TypeScript**            application requirements's preferred
                                                  frontend stack and
                                                  provides a clear
                                                  component-based UI
                                                  architecture.

  Styling                 **Tailwind CSS**        Matches the preferred
                                                  stack and supports
                                                  responsive, reusable UI
                                                  components.

  Backend                 **Node.js + Express +   Matches the preferred
                          TypeScript**            backend stack and keeps
                                                  retrieval, generation,
                                                  persistence and API
                                                  concerns separated from
                                                  the frontend.

  Database                **Supabase PostgreSQL** Used instead of
                                                  MongoDB. PostgreSQL
                                                  gives us relational
                                                  integrity for
                                                  user-owned kits and
                                                  practice data, while
                                                  Supabase provides
                                                  database hosting and
                                                  authentication in one
                                                  service.

  Authentication          **Supabase Auth +       Provides secure
                          backend auth            session-based
                          middleware**            authentication while
                                                  allowing the Express
                                                  API to enforce
                                                  ownership on protected
                                                  resources.

  Validation              **Zod**                 Used for request
                                                  validation, builder
                                                  operations, practice
                                                  data and generated
                                                  structures.

  Web retrieval           **Axios + Cheerio**     Provides deterministic
                                                  HTML retrieval and
                                                  parsing without
                                                  introducing a paid
                                                  scraping dependency.

  Robots handling         **robots-parser**       Used to respect
                                                  `robots.txt` before
                                                  crawling pages.

  Research search         **Tavily API**    Used to search public
                                                  web discussion about
                                                  company interview
                                                  processes without
                                                  directly scraping
                                                  restricted platforms.

  LLM                     **Groq**                Integrated through a
                                                  dedicated
                                                  `GroqProvider`
                                                  abstraction. The
                                                  provider is isolated
                                                  from the rest of the
                                                  generation pipeline so
                                                  the model can be
                                                  changed without
                                                  rewriting generation
                                                  services.

  Deployment              **Vercel + Node/Express Next.js frontend is
                          backend**               deployed on Vercel
                                                  while the API runs
                                                  separately as a
                                                  Node/Express service.
  -----------------------------------------------------------------------

the application preferred database is MongoDB; Supabase/PostgreSQL was
selected because authentication, row-level ownership and structured
relational persistence are closely coupled to the application's
requirements. the application explicitly permits equivalent technologies
when the choice is documented.

------------------------------------------------------------------------

## 3. High-Level Architecture

``` text
                         ┌─────────────────────────┐
                         │       Next.js App       │
                         │ React + TypeScript      │
                         │ Tailwind CSS            │
                         └────────────┬────────────┘
                                      │ REST API
                                      ▼
                         ┌─────────────────────────┐
                         │    Express API          │
                         │ Node.js + TypeScript    │
                         └────────────┬────────────┘
                                      │
             ┌────────────────────────┼─────────────────────────┐
             │                        │                         │
             ▼                        ▼                         ▼
      ┌─────────────┐        ┌───────────────┐         ┌──────────────┐
      │   Supabase  │        │ Research      │         │ LLM Layer    │
      │ PostgreSQL  │        │ Pipeline      │         │ GroqProvider │
      │ + Auth      │        │ Axios/Cheerio │         │              │
      └─────────────┘        │ robots-parser │         └──────┬───────┘
                             │ Tavily        │                │
                             └───────┬───────┘                │
                                     │                        │
                                     └──────────┬─────────────┘
                                                ▼
                                     ┌────────────────────┐
                                     │ Generation Pipeline│
                                     │ Requirements       │
                                     │ Company Brief      │
                                     │ Questions          │
                                     │ Flashcards         │
                                     │ Coverage           │
                                     │ Schedule            │
                                     │ Validation         │
                                     └────────────────────┘
```

### Backend separation

The backend is divided into services rather than putting the complete
workflow in one Express route.

Important service boundaries include:

``` text
services/
├── generation.service.ts
├── question-generation.service.ts
├── material-generation.service.ts
├── regeneration.service.ts
├── final-kit.service.ts
├── kit.service.ts
├── builder.service.ts
├── practice.service.ts
└── generation-error.ts

scraper/
├── crawler
├── robots
└── URL validation

research/
└── Tavily search provider

llm/
└── Groq provider

validators/
├── kit
├── kit request
├── question generation
├── builder
├── practice
└── company brief
```

This keeps retrieval, extraction, generation, validation, persistence
and user interaction as separate concerns.

------------------------------------------------------------------------

## 4. Generation Pipeline

The central design decision is that Prepora does **not** send the entire
task to the LLM in one prompt.

The pipeline is deliberately sequenced:

``` text
Job Description
      │
      ▼
1. Extract Requirements
      │
      ├── technical
      ├── behavioural
      └── domain
      │
      ▼
2. Crawl Company Website
      │
      ├── homepage
      ├── ranked internal links
      ├── about/company information
      └── hiring/careers information
      │
      ▼
3. Search Public Interview Discussion
      │
      ▼
4. Generate Company Brief
      │
      ▼
5. Generate Questions Per Requirement
      │
      ├── technical
      ├── behavioural
      ├── system-design
      └── company-fit
      │
      ▼
6. Generate Flashcards
      │
      ▼
7. Deterministic Coverage Check
      │
      ├── gaps found ──────► second generation pass
      │
      └── covered
      │
      ▼
8. Deterministic Schedule Allocation
      │
      ▼
9. Final Structure Validation
      │
      ▼
10. Persist Kit
```

### Why the sequencing matters

the application explicitly requires the generation process to respond to
information discovered in previous steps.

For example:

-   The job description determines the requirements.
-   The company crawl provides company-specific context.
-   The hiring-process research changes what company-fit questions are
    relevant.
-   Each requirement is processed separately so technical and
    behavioural requirements do not receive the same generic
    question-generation instructions.
-   Coverage is checked after questions exist.
-   Schedule allocation is performed by application code rather than the
    LLM.

------------------------------------------------------------------------

## 5. Requirement Extraction

The first generation stage extracts the role into stable requirements.

Each requirement receives:

``` text
id
text
kind
priority
```

Where:

-   `kind`: `technical | behavioural | domain`
-   `priority`: `must | nice`

Stable requirement IDs are important because questions reference them
directly.

This creates an explicit relationship:

``` text
Requirement r1
      │
      ├── Question q1
      ├── Question q2
      └── Flashcard f1
```

This relationship is what makes coverage measurable rather than
subjective.

------------------------------------------------------------------------

## 6. Company Research and Retrieval

### Website crawling

The company URL is treated as an untrusted external source.

The crawler:

1.  Fetches the supplied company URL.
2.  Parses HTML using Cheerio.
3.  Extracts internal links.
4.  Scores links based on useful signals such as:
    -   careers
    -   jobs
    -   hiring
    -   join
    -   team
    -   culture
    -   about
    -   interview
5.  Fetches relevant pages.
6.  Cleans HTML into usable text.
7.  Records successful and unsuccessful retrievals.
8.  Continues if an individual page cannot be retrieved.

Relative URLs are resolved against the current page URL so the crawler
does not assume a particular hostname. This is also necessary because
the application batch tests may provide company sites through local
addresses.

### Robots.txt

`robots-parser` is used to check crawl permissions before retrieving
pages.

### Public discussion

Public interview-process discussion is retrieved through the search
provider rather than directly scraping restricted websites.

The search layer is isolated behind a provider abstraction so the source
can be replaced without changing the generation pipeline.

### Retrieval failure behavior

A failed page does not automatically fail the complete kit.

For example:

``` text
Company homepage       → retrieved
About page             → retrieved
Careers page           → 404
Interview discussion   → no results
```

The kit can still be produced, but the missing information is
represented honestly instead of being fabricated.

------------------------------------------------------------------------

## 7. LLM Architecture

The LLM is accessed through a dedicated provider abstraction:

``` text
Generation Service
       │
       ▼
GroqProvider
       │
       ▼
Groq API
```

Generation services do not need to know the low-level provider
implementation.

This gives the application a provider boundary where the LLM can be
replaced later without changing:

-   requirement extraction
-   question generation
-   company brief generation
-   regeneration
-   validation
-   persistence

### Structured output

LLM outputs are constrained to explicit structures.

For question generation, the expected result contains:

``` json
{
  "questions": [
    {
      "category": "technical",
      "prompt": "...",
      "answer_outline": "...",
      "difficulty": 2
    }
  ],
  "flashcards": [
    {
      "front": "...",
      "back": "..."
    }
  ]
}
```

The result is then validated before it is converted into persisted kit
objects.

Additional application-level checks protect against malformed material,
including:

-   empty prompts
-   empty answer outlines
-   extremely short prompts/answers
-   duplicated answer outlines
-   invalid categories
-   invalid difficulty values

### Prompt-injection boundary

JD text and scraped website text are treated as **data**, not
instructions.

Generation prompts explicitly instruct the model not to follow
instructions embedded inside retrieved content.

This is important because both the pasted JD and crawled pages originate
outside the application.

------------------------------------------------------------------------

## 8. Coverage Checking and Second Pass

Coverage is intentionally deterministic.

The application has:

``` text
Requirements
      +
Questions
      ↓
coverage check
      ↓
uncovered requirement IDs
```

A requirement is covered when at least one generated question references
its stable requirement ID.

Example:

``` text
Requirements:
r1 → React
r2 → PostgreSQL
r3 → System design

Questions:
q1 → [r1]
q2 → [r2]

Coverage:
r1 → covered
r2 → covered
r3 → uncovered
```

The uncovered requirement is then sent back through question generation.

After regeneration, coverage is checked again.

This creates the required feedback loop:

``` text
Generate
   ↓
Check coverage
   ↓
Gaps?
 ┌─┴─┐
Yes  No
 │    │
 ▼    ▼
Generate   Continue
missing
questions
 │
 └──────► Check again
```

The coverage decision itself is not delegated to the LLM.

------------------------------------------------------------------------

## 9. Deterministic Schedule Allocation

The study schedule is generated by application code.

The LLM does **not** decide how many days the user receives or how
questions are distributed.

The allocator receives:

``` text
days_available
requirements
questions
difficulty
priority
```

and produces exactly the requested number of days.

Each day contains:

``` json
{
  "day": 1,
  "focus": "...",
  "question_ids": ["q1", "q2"],
  "minutes": 40
}
```

The allocation logic ensures:

-   Number of schedule days = requested days
-   Every must-have requirement is represented
-   Question IDs point to existing questions
-   Duration is an integer
-   Higher-priority and harder material is introduced earlier
-   Extreme inputs such as 1-day and long-duration schedules do not
    break the allocator

Keeping this logic deterministic makes the result reproducible and
testable.

------------------------------------------------------------------------

## 10. Exact Kit Structure

The generated kit follows the structure required by Appendix A of the
application requirements.

``` json
{
  "source": {
    "company": "",
    "company_url": "",
    "role": "",
    "location": "",
    "jd_chars": 0,
    "researched_at": "",
    "pages_used": []
  },
  "company_brief": {
    "summary": "",
    "what_they_do": "",
    "sources": []
  },
  "role": {
    "title": "",
    "seniority": "",
    "responsibilities": [],
    "requirements": []
  },
  "questions": [],
  "flashcards": [],
  "schedule": {
    "days_available": 0,
    "days": []
  },
  "coverage": {
    "uncovered_requirement_ids": [],
    "passes": 0
  }
}
```

The implementation also tracks user-editing metadata for builder
behavior, including:

``` text
origin: generated | edited | manual
pinned: boolean
```

This allows generated content to be distinguished from user-owned
content.

------------------------------------------------------------------------

## 11. Builder and Regeneration

The builder is designed around a key requirement of the application:

> Regenerating one section must not destroy edits made elsewhere.

Supported operations include:

-   Edit questions
-   Edit flashcards
-   Edit generated content
-   Create questions manually
-   Create flashcards manually
-   Delete questions
-   Delete flashcards
-   Reorder questions
-   Reorder flashcards
-   Regenerate the company brief
-   Regenerate a question category
-   Regenerate the schedule

### Preservation model

Generated, edited and manually-created items are tracked separately.

Conceptually:

``` text
Generated item
    │
    ├── untouched → eligible for regeneration
    │
    └── edited/pinned → preserve

Manual item
    └── preserve
```

During category regeneration, the regeneration service only replaces
content that is safe to replace. User-edited/pinned content remains
intact.

This prevents a regeneration action from acting as a destructive
"reset".

------------------------------------------------------------------------

## 12. Practice Mode

Practice mode turns the generated flashcards into an interactive
workflow.

The user can:

1.  View one flashcard.
2.  Reveal the answer.
3.  Record confidence.
4.  Continue through the session.
5.  Track reviewed material.

Practice progress is persisted separately from the generated kit so that
learning state does not modify the generated source material.

The application can use confidence information to prioritize cards that
the user is less confident about in subsequent practice.

------------------------------------------------------------------------

## 13. Authentication and Data Ownership

Authentication is implemented using Supabase Auth.

Protected API routes use authentication middleware:

``` text
Request
  ↓
requireAuth
  ↓
authenticated user ID
  ↓
service layer
  ↓
user-owned kit
```

Kit retrieval and mutation operations require the authenticated user ID.

This prevents one user from accessing or modifying another user's kits.

The API also returns structured unauthorized/error responses rather than
allowing protected operations to proceed anonymously.

------------------------------------------------------------------------

## 14. Progress and Long-Running Generation

Generation can involve multiple external requests, so the UI exposes the
current pipeline state.

The current progress stages include:

``` text
Extracting requirements
        ↓
Crawling company
        ↓
Generating company brief
        ↓
Generating questions
        ↓
Checking coverage
        ↓
Generating schedule
        ↓
Validating
        ↓
Ready
```

Kit records maintain a generation status such as:

``` text
generating
ready
failed
```

This lets the frontend distinguish between:

-   an active generation
-   a successfully completed kit
-   a failed generation

instead of treating generation as a single opaque request.

------------------------------------------------------------------------

## 15. Error Handling and Edge Cases

### Invalid or unreachable company URL

The crawler reports the failure and continues where possible.

### No hiring page

The company brief is generated from the information that was actually
found. No hiring process is invented.

### Thin job description

A thin JD produces a thin requirement set. The application does not
manufacture requirements that are absent from the source.

### No public interview discussion

The absence of public discussion is represented as a research gap rather
than fabricated interview information.

### Invalid LLM output

The generated response is validated before it is incorporated into the
kit. Invalid structures are rejected rather than persisted as valid
kits.

### Rate limiting

External calls are isolated behind service/provider boundaries so retry
and failure handling can be applied without coupling the rest of the
pipeline to provider-specific behavior.

### Duplicate submissions

Kits are persisted independently, allowing the user to maintain separate
preparation contexts.

------------------------------------------------------------------------

## 16. Security

The application handles two major classes of untrusted input:

1.  User-provided job descriptions
2.  Content retrieved from arbitrary company websites

Security measures include:

-   Input validation with Zod
-   Authentication middleware for protected API routes
-   User ownership checks for kit operations
-   URL validation before retrieval
-   Robots.txt compliance
-   Content extraction limited to expected web content
-   Treating retrieved text as data rather than executable instructions
-   LLM prompt-injection defenses
-   Environment variables for secrets
-   No API keys committed to source control

Production URL validation should reject private and loopback addresses
while still allowing the localhost URLs required by the application
batch evaluation environment.

------------------------------------------------------------------------

## 17. Batch Evaluation

the application requires one batch command that uses the same pipeline as
the web application.

### Command

``` bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

Example:

``` bash
npm run evaluate -- --input cases.json --output kits.json
```

### Input

``` json
[
  {
    "id": "case-01",
    "jd": "Senior Backend Engineer\n\nWe are looking for ...",
    "company_url": "http://localhost:8099/acme/",
    "days": 5
  }
]
```

### Output

``` json
{
  "version": "1.0",
  "generated_at": "2026-09-01T09:12:44Z",
  "kits": [
    {
      "id": "case-01",
      "status": "ok",
      "kit": {},
      "error": null
    }
  ]
}
```

A completely failed case is represented with:

``` json
{
  "status": "failed",
  "kit": null,
  "error": {
    "code": "COMPANY_UNREACHABLE",
    "message": "Company site unreachable after retries."
  }
}
```

Partial research is not treated as a complete pipeline failure. The
resulting kit records the available information and gaps honestly.

The batch runner uses the same generation pipeline as the API instead of
maintaining a separate implementation.

------------------------------------------------------------------------

## 18. Local Setup

### Prerequisites

-   Node.js 20+
-   npm
-   Supabase project
-   Groq API credentials
-   Tavily API credentials

### 1. Clone the repository

``` bash
git clone <repository-url>
cd prepora
```

### 2. Install frontend dependencies

``` bash
cd frontend
npm install
```

### 3. Configure frontend environment

Create:

``` text
frontend/.env.local
```

Configure the required public Supabase/API values used by the frontend.

Example:

``` env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_API_URL=...
```

### 4. Install backend dependencies

``` bash
cd ../backend
npm install
```

### 5. Configure backend environment

Create:

``` text
backend/.env.local
```

Example:

``` env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
GROQ_API_KEY=...
```

Configure the Tavily API credentials required by the active
research provider.

Never commit `.env.local` or any secret key.

### 6. Start the backend

``` bash
cd backend
npm run dev
```

The API runs on the configured backend port (development configuration
uses port `4000`).

### 7. Start the frontend

In another terminal:

``` bash
cd frontend
npm run dev
```

Open the local Next.js application in the browser.

------------------------------------------------------------------------

## 19. Production Deployment

### Frontend

The frontend is designed for deployment on Vercel.

Configure the frontend environment variables in the Vercel project
settings rather than committing them to the repository.

### Backend

The Express API is deployed separately as a Node.js service.

Configure:

-   Supabase credentials
-   Groq credentials
-   Tavily API configuration
-   CORS allowed frontend origin

The frontend and backend use separate origins, so the Express API
restricts CORS to the deployed frontend origin.

### Deployment checklist

-   [ ] Frontend publicly reachable
-   [ ] Backend publicly reachable
-   [ ] Supabase credentials configured
-   [ ] LLM credentials configured
-   [ ] Tavily configured
-   [ ] CORS configured
-   [ ] Production URL validation enabled
-   [ ] Secrets excluded from Git
-   [ ] Batch command works from a clean clone

------------------------------------------------------------------------

## 20. Project Structure

A simplified repository structure:

``` text
prepora/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── llm/
│   │   ├── middleware/
│   │   ├── research/
│   │   ├── scraper/
│   │   ├── services/
│   │   ├── types/
│   │   ├── validators/
│   │   ├── scripts/
│   │   └── index.ts
│   └── package.json
│
└── README.md
```

------------------------------------------------------------------------

## 21. Testing Strategy

The most important deterministic behavior is isolated from the LLM and
should be tested independently.

The test focus includes:

### Schedule allocation

Verify:

-   exact number of requested days
-   valid question references
-   integer durations
-   must-have requirements represented
-   behavior at schedule extremes

### Coverage checking

Verify:

-   covered requirements are removed from the gap set
-   uncovered requirements are detected
-   requirement IDs remain stable
-   second-pass generation receives only the missing requirements

### Structure validation

Verify:

-   required top-level fields exist
-   requirement IDs are stable
-   question requirement references are valid
-   categories are valid
-   difficulty is within `1..3`
-   schedule question IDs exist
-   schedule minutes are integers

------------------------------------------------------------------------

## 22. Design Decisions and Trade-offs

### Supabase/PostgreSQL instead of MongoDB

the application preferred MongoDB, but Supabase was selected because the
application needs both authentication and persistent relational
ownership.

Benefits:

-   Managed PostgreSQL
-   Supabase Auth
-   Straightforward user-to-kit ownership
-   JSONB support for structured kit data
-   Realtime capabilities for generation status
-   Row-level security support

Trade-off:

-   The schema is more relational than the MongoDB-oriented structure
    suggested by the brief.
-   The implementation needs explicit service/repository logic for
    mutations.

### Custom crawler instead of a scraping platform

A custom Axios/Cheerio crawler avoids an additional scraping dependency
and gives direct control over:

-   link ranking
-   robots.txt handling
-   retries
-   timeouts
-   relative URLs
-   source tracking

Trade-off:

-   JavaScript-heavy websites may expose less content than a full
    browser crawler.
-   Anti-bot systems can still prevent retrieval.

### Provider abstraction for the LLM

The `GroqProvider` is separated from generation services.

This avoids coupling the application to one vendor and makes future
provider/model changes localized.

### Deterministic scheduling

Schedule allocation is intentionally implemented as application logic
rather than prompting the model.

This makes the schedule:

-   reproducible
-   testable
-   guaranteed to contain exactly the requested number of days
-   easier to validate against requirements

------------------------------------------------------------------------

## 23. Known Limitations

-   Websites requiring heavy client-side rendering may expose limited
    content to the HTML crawler.
-   Public interview discussion is dependent on external search
    availability and indexing.
-   Free-tier LLM/search services can impose rate limits.
-   Research quality depends on the quality and availability of public
    company information.
-   The generated material is preparation assistance, not a guarantee of
    the questions an interviewer will ask.
-   Production URL restrictions need to remain environment-aware because
    the application batch runner may provide localhost company URLs.

------------------------------------------------------------------------

## 24. Implementation Coverage

The implementation covers the core Prepora workflow end-to-end:

  ------------------------------------------------------------------------------------
  Assessment area                     Prepora implementation
  ----------------------------------- ------------------------------------------------
  Authentication                      Supabase Auth + Express `requireAuth` middleware

  User-owned kits                     Authenticated user ID passed into kit services

  JD + company URL input              Next.js kit creation flow

  Company crawling                    Axios + Cheerio + ranked internal links

  `robots.txt`                        `robots-parser`

  Public interview research           Tavily API search provider

  Sequenced generation                Dedicated generation services

  Requirement extraction              Structured requirement generation

  Targeted questions                  Per-requirement question generation

  Coverage checking                   Deterministic requirement/question mapping

  Second pass                         Regeneration for uncovered requirements

  Exact kit structure                 Final kit validation

  Editing                             Builder service + API endpoints

  Reordering                          Question/flashcard reorder endpoints

  Safe regeneration                   Generated/edited/manual + pinned state

  Practice mode                       Practice service + confidence tracking

  Schedule                            Deterministic allocator

  Batch evaluation                    `npm run evaluate -- --input ... --output ...`

  Failure handling                    Structured status/error handling

  Security                            Auth, validation, URL controls and
                                      prompt-injection boundaries

  Deployment                          Public frontend + backend deployment
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 25. Deployment Checklist

Before deploying a production build:

- [ ] Frontend publicly reachable
- [ ] Backend publicly reachable
- [ ] Supabase credentials configured
- [ ] LLM credentials configured
- [ ] Tavily configured
- [ ] CORS configured
- [ ] Production URL validation enabled
- [ ] Secrets excluded from Git
- [ ] Batch evaluation command works from a clean clone
- [ ] Authentication and protected API routes verified

## 26. Assessment Reference

This README is structured around the requirements in the provided 
Full-Stack Engineering Assessment, including the exact kit structure,
batch entry point, research/generation sequencing, builder behavior,
practice mode, scheduling, security, deployment and submission
requirements.
