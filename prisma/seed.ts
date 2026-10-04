import 'dotenv/config';
import {
  PrismaClient,
  RoleEnum,
  ResumeSectionEnum,
  ProjectStatus,
  BlogStatus,
} from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({ where: { email } });

  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashed, name: 'Admin', role: RoleEnum.ADMIN },
    });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }
}

async function seedProfile() {
  await prisma.profile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      headline: 'ML Engineer & Full-stack Developer',
      coverImage: null,
      paragraphs: [
        'I build systems that sit at the intersection of machine learning and product engineering — from intent recognition pipelines to the REST APIs and React frontends that ship them.',
        "Over the past few years I've shipped ERP systems, recommendation engines, and client-facing products for teams that needed both the ML and the plumbing done right.",
      ],
      facts: [
        { k: 'Based in', v: 'Kathmandu, Nepal' },
        { k: 'Focus', v: 'ML + full-stack' },
        { k: 'Currently', v: 'DalloTech' },
        { k: 'Open to', v: 'Freelance & full-time' },
      ],
      stats: [
        { value: '3+', label: 'years experience' },
        { value: '12+', label: 'projects shipped' },
        { value: '8+', label: 'clients served' },
        { value: '25+', label: 'technologies' },
      ],
      ticker: [
        'Python',
        'FastAPI',
        'React',
        'PyTorch',
        'LangChain',
        'PostgreSQL',
        'Docker',
        'TypeScript',
        'Next.js',
        'TensorFlow',
      ],
      name: 'Biraj Buddhacharya',
      avatarImage: null,
      location: 'Kathmandu, Nepal',
      ctaLabel: 'Hire me',
      footerNote: 'built from scratch',
    },
    // Site-identity fields are always ensured on re-seed (so this fix backfills an
    // already-existing row); richer content fields above are seed-once only.
    update: {
      name: 'Biraj Buddhacharya',
      location: 'Kathmandu, Nepal',
      ctaLabel: 'Hire me',
      footerNote: 'built from scratch',
    },
  });
  console.log('Profile seeded');
}

async function seedContactLinks() {
  if (await prisma.contactLink.count()) return;
  await prisma.contactLink.createMany({
    data: [
      {
        label: 'Email',
        value: 'hello@example.com',
        href: 'mailto:hello@example.com',
        order: 0,
      },
      {
        label: 'GitHub',
        value: 'github.com/example',
        href: 'https://github.com/example',
        order: 1,
      },
      {
        label: 'LinkedIn',
        value: 'linkedin.com/in/example',
        href: 'https://linkedin.com/in/example',
        order: 2,
      },
      {
        label: 'Twitter',
        value: '@example',
        href: 'https://twitter.com/example',
        order: 3,
      },
    ],
  });
  console.log('Contact links seeded');
}

async function seedResumeItems() {
  if (await prisma.resumeItem.count()) return;
  await prisma.resumeItem.createMany({
    data: [
      {
        section: ResumeSectionEnum.EXPERIENCE,
        order: 0,
        title: 'ML Engineer & Full-stack Dev',
        organization: 'DalloTech',
        period: '2023 — present',
        location: 'Kathmandu, NPL',
        points: [
          'Building core AI R&D for an analytics platform — intent recognition, recommendation engine, and query generation.',
          'Developed a full ERP system covering inventory, billing, and reporting.',
          'Designed and shipped REST APIs powering both internal tools and client-facing products.',
        ],
      },
      {
        section: ResumeSectionEnum.EXPERIENCE,
        order: 1,
        title: 'Freelance Developer',
        organization: 'Self-employed',
        period: '2022 — 2023',
        location: 'Remote',
        points: [
          'Built an event management platform with real-time ticketing and QR-code check-in.',
          'Developed an ordering system with recommendation features for a restaurant chain.',
          'Delivered ML prototypes for 3 clients: sound classification, document similarity, churn prediction.',
        ],
      },
      {
        section: ResumeSectionEnum.EDUCATION,
        order: 0,
        title: 'B.Sc. Computer Science',
        organization: 'Tribhuvan University',
        period: '2019 — 2023',
        location: 'Kathmandu, NPL',
        body: 'Focused on machine learning, distributed systems, and software engineering practices.',
      },
      {
        section: ResumeSectionEnum.CERTIFICATION,
        order: 0,
        title: 'Deep Learning Specialization',
        organization: 'DeepLearning.AI',
        period: '2022',
        body: 'Neural networks, CNNs, sequence models.',
      },
      {
        section: ResumeSectionEnum.CERTIFICATION,
        order: 1,
        title: 'AWS Certified Developer',
        organization: 'Amazon Web Services',
        period: '2023',
      },
      {
        section: ResumeSectionEnum.SKILL,
        order: 0,
        title: 'Languages',
        body: 'Python, TypeScript, Go',
      },
      {
        section: ResumeSectionEnum.SKILL,
        order: 1,
        title: 'ML/AI',
        body: 'PyTorch, scikit-learn, LangChain, TensorFlow',
      },
      {
        section: ResumeSectionEnum.SKILL,
        order: 2,
        title: 'Backend & Infra',
        body: 'FastAPI, NestJS, PostgreSQL, Docker, Redis',
      },
    ],
  });
  console.log('Resume items seeded');
}

function tagConnect(names: string[]) {
  return {
    connectOrCreate: names.map((name) => ({
      where: { name },
      create: { name },
    })),
  };
}

async function seedBlogPosts() {
  if (await prisma.blogPost.count()) return;
  const now = Date.now();
  const day = 86400000;
  await Promise.all([
    prisma.blogPost.create({
      data: {
        slug: 'load-balancing-strategies-in-go',
        title: 'Load balancing strategies in Go',
        excerpt:
          'A walkthrough of round-robin, least-connections, and consistent hashing implemented from scratch in Go.',
        content: `Load balancing distributes traffic across a pool of backends. The strategy you pick decides how evenly that traffic lands — and how badly things degrade when one backend gets slow.

## Round robin

The simplest option: hand each request to the next backend in line.

\`\`\`go
func (p *Pool) Next() *Backend {
    i := atomic.AddUint64(&p.counter, 1)
    return p.backends[i%uint64(len(p.backends))]
}
\`\`\`

It assumes every request costs the same and every backend is equally fast. Both assumptions break under real traffic.

## Least connections

Track in-flight requests per backend and send the next one to whoever is least busy. This handles uneven request costs far better than round robin.

> The tradeoff is bookkeeping — you now need accurate, concurrent counters on the hot path.

## Consistent hashing

When backends hold per-key state, you want the same key to land on the same backend. A hash ring keeps that stable even as nodes join and leave:

- Each backend gets several virtual nodes on the ring
- A key hashes to a position and walks clockwise to the first node
- Adding a node only remaps the keys in its arc, not the whole space

## Picking one

Start with round robin. Move to least connections when request costs diverge. Reach for consistent hashing only when backends are stateful — it is the most complex of the three and the easiest to get subtly wrong.`,
        tags: tagConnect(['go', 'systems', 'networking']),
        status: BlogStatus.ACTIVE,
        publishedAt: new Date(now - 20 * day),
      },
    }),
    prisma.blogPost.create({
      data: {
        slug: 'e-governance-in-nepal-what-actually-ships',
        title: 'E-governance in Nepal: what actually ships',
        excerpt:
          'Notes from building government-facing platforms in a low-bandwidth, high-friction environment.',
        content: `Government software has different constraints than consumer software. The users are not optional, the network is not fast, and the failure mode is someone not getting a service they are entitled to.

## The bandwidth floor

A lot of e-governance work assumes a connection it will not get. Designing for a 3G tail changes real decisions:

- Server-render the critical path; ship interactivity after
- Budget pages in kilobytes, not megabytes
- Make every form survive a dropped connection mid-submit

## Identity is the hard part

Authentication is where most of these projects stall. Citizens have inconsistent documentation, names transliterate differently across systems, and duplicate records are the norm rather than the exception.

> Every reconciliation rule you add quietly decides who gets locked out. That is a policy decision wearing an engineering costume.

## What actually ships

The projects that land share a pattern: narrow scope, one workflow end to end, and an offline fallback that staff genuinely use. The ones that stall try to digitise an entire department at once.`,
        tags: tagConnect(['policy', 'nepal', 'product']),
        status: BlogStatus.ACTIVE,
        publishedAt: new Date(now - 14 * day),
      },
    }),
    prisma.blogPost.create({
      data: {
        slug: 'notes-on-intent-recognition-pipelines',
        title: 'Notes on intent recognition pipelines',
        excerpt:
          'How we structured an intent classifier + slot filler for a client analytics platform.',
        content: `Intent recognition sits upstream of most conversational or query-driven systems. Get it wrong and every component downstream inherits the mistake.

## Shape of the pipeline

1. **Normalise** — lowercase, strip punctuation, expand contractions
2. **Classify** — map the utterance to one of a closed set of intents
3. **Fill slots** — pull the entities that intent requires
4. **Fall back** — route low-confidence cases to a clarifying question

## Why a closed set

An open-ended classifier looks impressive in a demo and falls apart in production. A closed intent set gives you something you can actually measure:

\`\`\`python
intents = ["compare_metric", "trend_over_time", "top_n", "explain_change"]
pred, score = classifier(utterance)
if score < THRESHOLD:
    return clarify(utterance)
\`\`\`

## Slot filling

Slots are where accuracy quietly dies. \`last quarter\` and \`Q3\` may mean the same window, or not, depending on fiscal calendar — resolve them against real config rather than guessing.

## Thresholds beat model size

The single biggest quality win was not a bigger model. It was tuning the confidence threshold and making the clarifying question good.`,
        tags: tagConnect(['ml', 'nlp']),
        status: BlogStatus.ACTIVE,
        publishedAt: new Date(now - 7 * day),
      },
    }),
    prisma.blogPost.create({
      data: {
        slug: 'soft-deletes-in-prisma-without-the-footguns',
        title: 'Soft deletes in Prisma without the footguns',
        excerpt:
          'A pattern for consistent soft-delete filtering across every model in a NestJS + Prisma backend.',
        content: `Soft deletes are simple until every query has to remember the filter. Miss it once and deleted rows leak back into a list — usually in the one place nobody tested.

## The footgun

\`\`\`ts
// forgets deletedAt — returns deleted rows
const users = await prisma.user.findMany({ where: { role: 'ADMIN' } });
\`\`\`

The bug is invisible in review because the code looks complete.

## Centralise the filter

Put the guard in one place every read already flows through, rather than trusting each call site:

\`\`\`ts
protected notDeleted(where: T = {} as T): T & { deletedAt: null } {
  return { ...where, deletedAt: null };
}
\`\`\`

A shared base service means a new model gets the behaviour for free, and there is exactly one line to audit.

## Know the limits

- Unique constraints still see deleted rows — scope them, or expect collisions on re-create
- Every model in the abstraction must actually carry \`deletedAt\`; singletons and join tables often should not
- Restores need an explicit path, or the data is deleted in practice anyway

## When not to use it

If nothing ever restores the record and no audit trail needs it, delete the row. Soft deletes are a feature with ongoing cost, not a free safety net.`,
        tags: tagConnect(['prisma', 'nestjs', 'backend']),
        status: BlogStatus.ACTIVE,
        publishedAt: new Date(now - 2 * day),
      },
    }),
    prisma.blogPost.create({
      data: {
        slug: 'draft-rethinking-the-admin-dashboard',
        title: 'Draft: rethinking the admin dashboard',
        excerpt:
          'Work-in-progress notes on what an admin panel actually needs versus what it accumulates.',
        content: `Every admin panel starts simple and grows a junk drawer of toggles. Notes toward a rebuild.

## What it accumulates

- Settings nobody has flipped since launch
- Stat tiles that look like analytics but are hardcoded
- Four ways to reach the same edit form

## What it actually needs

The honest list is short: find a thing, edit a thing, see what changed. Most of the rest is decoration.

## Open question

Does the dashboard earn its place at all, or should landing go straight to the content list?`,
        tags: tagConnect(['product']),
        status: BlogStatus.DRAFT,
        publishedAt: null,
      },
    }),
  ]);
  console.log('Blog posts seeded');
}

async function seedProjects() {
  if (await prisma.project.count()) return;
  await Promise.all([
    prisma.project.create({
      data: {
        slug: 'riskvision',
        title: 'RiskVision',
        blurb:
          'Predictive ML model with 80%+ accuracy for assessing stroke and heart disease risk from clinical data.',
        summary:
          'RiskVision predicts stroke and heart disease risk using clinical features. The model was trained on public health datasets and achieves over 80% accuracy on held-out test data.',
        tags: tagConnect(['ML', 'Python', 'PyTorch']),
        year: '2024',
        status: ProjectStatus.ACTIVE,
        coverHeight: 260,
        coverAccent: '#FF6B6B',
        coverColor: '#141418',
        live: 'https://github.com/BirajBuddhacharya/RiskVision',
        repo: 'https://github.com/BirajBuddhacharya/RiskVision',
        metrics: [
          { value: '80%+', label: 'model accuracy' },
          { value: '< 200ms', label: 'API latency' },
          { value: '3', label: 'disease types' },
        ],
        content: `## Problem

Early detection of stroke and heart disease is critical but requires specialist analysis. The goal was to build a tool that **triages risk** from basic clinical inputs — age, blood pressure, glucose, BMI and a handful of lifestyle flags.

## Approach

Trained gradient-boosted and neural network classifiers on UCI and Kaggle health datasets:

- **SMOTE** to handle severe class imbalance in the positive cases
- **SHAP** values for per-prediction interpretability
- Stratified k-fold cross-validation to keep the minority class represented

\`\`\`python
from imblearn.over_sampling import SMOTE

X_res, y_res = SMOTE(random_state=42).fit_resample(X_train, y_train)
model.fit(X_res, y_res)
\`\`\`

> Interpretability was non-negotiable — a risk score a clinician can't interrogate is a risk score they won't use.

## Outcome

Deployed as a FastAPI service with a React frontend. The model consistently outperformed the baseline logistic regression by **14 percentage points**, holding above 80% accuracy on held-out test data.`,
        gallery: [
          'Model architecture',
          'ROC curves',
          'Feature importance',
          'UI screenshot',
        ],
      },
    }),
    prisma.project.create({
      data: {
        slug: 'syncbeats',
        title: 'SyncBeats',
        blurb:
          'CLI tool that syncs YouTube playlists and local music libraries using yt-dlp with smart deduplication.',
        summary:
          'SyncBeats is a command-line utility that keeps a local music folder in sync with YouTube playlists, handling duplicates and metadata tagging automatically.',
        tags: tagConnect(['CLI tool', 'Python']),
        year: '2023',
        status: ProjectStatus.ACTIVE,
        coverHeight: 160,
        coverAccent: '#6E6E78',
        coverColor: '#0E1418',
        live: 'https://github.com/BirajBuddhacharya/SyncBeats',
        repo: 'https://github.com/BirajBuddhacharya/SyncBeats',
        metrics: [
          { value: '100+', label: 'playlists synced' },
          { value: '0 dupes', label: 'dedup accuracy' },
          { value: 'ID3 tags', label: 'auto-tagged' },
        ],
        content: `## Problem

Downloading music from YouTube manually is tedious and leads to duplicates and inconsistent metadata. Re-running a sync would happily download the same track three times under slightly different titles.

## Approach

Built on top of \`yt-dlp\` with a SQLite state file tracking already-downloaded tracks:

\`\`\`bash
syncbeats add "https://youtube.com/playlist?list=..."
syncbeats sync --dedupe --tag
\`\`\`

Dedup works on video ID first, then falls back to normalized title + duration matching for re-uploads. Metadata is written via \`mutagen\` after each download.

## Outcome

Used daily for personal music management. Open-sourced and picked up by roughly **100 users** on GitHub.`,
        gallery: ['CLI output', 'Config file', 'Before/after sync'],
      },
    }),
    prisma.project.create({
      data: {
        slug: 'abc-books',
        title: 'ABC Books',
        blurb:
          'Full-stack e-commerce platform with responsive design, cart system, and streamlined checkout flow.',
        summary:
          'ABC Books is a full-featured online bookstore with product catalog, search, cart, and order management.',
        tags: tagConnect(['Web app', 'Django', 'React']),
        year: '2023',
        status: ProjectStatus.ACTIVE,
        coverHeight: 200,
        coverAccent: '#7C3AED',
        coverColor: '#130E18',
        live: 'https://github.com/BirajBuddhacharya/ABC-Books',
        repo: 'https://github.com/BirajBuddhacharya/ABC-Books',
        metrics: [
          { value: '500+', label: 'products listed' },
          { value: '< 1.2s', label: 'page load' },
          { value: '100%', label: 'mobile responsive' },
        ],
        content: `## Problem

A local bookstore needed an online presence with inventory management and order processing. Everything ran on a spreadsheet and a phone line.

## Approach

Django REST Framework backend with a React SPA frontend:

- **PostgreSQL** for relational data — books, orders, inventory
- Full-text search powered by Django's ORM with trigram similarity
- Cart state persisted server-side so it survives device switches
- Tailwind for a responsive catalog grid

## Outcome

Launched and used in production. Reduced order processing time by **60%** compared to the manual workflow, with 500+ products live and page loads consistently under 1.2 seconds.`,
        gallery: ['Home page', 'Product detail', 'Cart', 'Order history'],
      },
    }),
    prisma.project.create({
      data: {
        slug: 'eventpulse',
        title: 'EventPulse',
        blurb:
          'Real-time event management platform with QR-code check-in, ticket sales, and organizer dashboard.',
        summary:
          'EventPulse handles the full lifecycle of ticketed events — from creation and sales to check-in on the day.',
        tags: tagConnect(['Web app', 'FastAPI', 'React']),
        year: '2023',
        status: ProjectStatus.ACTIVE,
        coverHeight: 300,
        coverAccent: '#0EA5E9',
        coverColor: '#0C1418',
        live: null,
        repo: null,
        metrics: [
          { value: '2k+', label: 'tickets issued' },
          { value: '< 300ms', label: 'QR scan time' },
          { value: '10+', label: 'events hosted' },
        ],
        content: `## Problem

The client ran events manually with spreadsheets and paper tickets, leading to duplicate entries, oversold rooms and check-in queues that stretched out the door.

## Approach

FastAPI backend with JWT auth, Stripe for payments, and signed QR code generation:

- Ticket codes are **HMAC-signed** so a screenshot can't be forged into a valid pass
- Redis holds the live check-in set, making scan validation an O(1) lookup
- The check-in app runs in the browser against a camera feed — no native install for door staff

> The hard constraint was venue wifi. Every scan had to work on a flaky connection, so check-ins queue locally and reconcile on reconnect.

## Outcome

Average check-in time dropped from 4 minutes to **under 30 seconds**. Zero oversold events since launch across 10+ events and 2,000+ tickets issued.`,
        gallery: ['Dashboard', 'Ticket page', 'QR scanner', 'Analytics'],
      },
    }),
    prisma.project.create({
      data: {
        slug: 'tathyanaka',
        title: 'Tathyanaka',
        blurb:
          'AI-powered analytics platform that turns raw data tables into natural-language insights and charts.',
        summary:
          'Tathyanaka lets non-technical users query their data in plain English and receive structured charts and summaries.',
        tags: tagConnect(['AI product', 'Python', 'LangChain']),
        year: '2024',
        status: ProjectStatus.ACTIVE,
        coverHeight: 220,
        coverAccent: '#10B981',
        coverColor: '#0E1814',
        live: null,
        repo: null,
        metrics: [
          { value: 'NL→SQL', label: 'query engine' },
          { value: '< 2s', label: 'avg response' },
          { value: '5+', label: 'data connectors' },
        ],
        content: `## Problem

Business stakeholders needed insights from PostgreSQL databases but lacked SQL knowledge. Every question became a ticket for the data team, and the queue was always two days deep.

## Approach

An LLM-powered NL-to-SQL pipeline with schema context injection:

1. **Schema retrieval** — only the tables relevant to the question are pulled into context
2. **Query generation** — the model emits SQL, which is parsed and validated before execution
3. **Guardrails** — read-only role, statement timeout, and a row-count ceiling
4. **Rendering** — results become Chart.js visualisations in a React dashboard

\`\`\`sql
-- generated from: "revenue by region last quarter"
SELECT region, SUM(amount) AS revenue
FROM orders
WHERE created_at >= date_trunc('quarter', now()) - interval '1 quarter'
GROUP BY region ORDER BY revenue DESC;
\`\`\`

## Outcome

In production at DalloTech. Reduced data request turnaround from **2 days to under 5 minutes**, with average response time below 2 seconds across 5+ data connectors.`,
        gallery: [
          'Query interface',
          'Chart output',
          'Schema browser',
          'History',
        ],
      },
    }),
    prisma.project.create({
      data: {
        slug: 'quickhire',
        title: 'QuickHire',
        blurb:
          'Job portal with AI-assisted resume screening and match-scoring for faster recruiter workflows.',
        summary:
          'QuickHire speeds up recruiting by automatically ranking applicants against job descriptions using TF-IDF and semantic similarity.',
        tags: tagConnect(['Web app', 'ML', 'Django']),
        year: '2022',
        status: ProjectStatus.ARCHIVED,
        coverHeight: 180,
        coverAccent: '#F59E0B',
        coverColor: '#18140E',
        live: null,
        repo: null,
        metrics: [
          { value: '60%', label: 'screening time saved' },
          { value: '500+', label: 'resumes processed' },
          { value: 'Top-3', label: 'match accuracy' },
        ],
        content: `## Problem

A small HR team was spending hours manually screening CVs for each open role, and good candidates were falling through simply because nobody got to page four of the pile.

## Approach

TF-IDF cosine similarity combined with a sentence-transformer re-ranker:

- **pdfminer** for text extraction, with a fallback OCR path for scanned CVs
- TF-IDF for a cheap first-pass filter over the full applicant set
- A cross-encoder re-ranker on the top 50 for final ordering
- Match scores surfaced with the matched terms highlighted, so recruiters can sanity-check the ranking

## Outcome

Cut initial screening time by **60%** across 500+ resumes processed. Recruiters now review only the top-5 matches before scheduling interviews.

> Archived — the client moved to an off-the-shelf ATS, but the ranking approach held up well against their new vendor's built-in scoring.`,
        gallery: ['Job listing', 'Applicant list', 'Resume viewer'],
      },
    }),
  ]);
  console.log('Projects seeded');
}

async function seedDashboardSnapshot() {
  await prisma.dashboardSnapshot.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      chartBars: [32, 41, 28, 55, 60, 47, 38, 52, 65, 58, 44, 61, 70, 66],
      topPages: [
        { path: '/', views: 1240, pct: 38 },
        { path: '/projects', views: 860, pct: 26 },
        { path: '/blog', views: 540, pct: 16 },
        { path: '/about', views: 410, pct: 12 },
        { path: '/contact', views: 260, pct: 8 },
      ],
      activity: [
        { text: 'New contact message received', time: '2h ago' },
        {
          text: 'Blog post "Load balancing strategies in Go" published',
          time: '1d ago',
        },
        { text: 'Project "RiskVision" updated', time: '3d ago' },
        { text: 'New contact message received', time: '5d ago' },
      ],
    },
    update: {},
  });
  console.log('Dashboard snapshot seeded');
}

async function main() {
  await seedAdmin();

  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping sample content seed (NODE_ENV=production)');
    return;
  }

  await seedProfile();
  await seedContactLinks();
  await seedResumeItems();
  await seedBlogPosts();
  await seedProjects();
  await seedDashboardSnapshot();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
