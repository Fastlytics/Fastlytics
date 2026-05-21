# Fastlytics Email Strategy Toolkit

## Purpose

Fastlytics is an advanced F1 pit wall at your fingertips. The email strategy should not feel like generic SaaS marketing. It should feel like a timely, data-rich race engineer nudging users toward better analysis.

The goal is to move users through this journey:

```text
signup → first analysis → habit → race-weekend engagement → subscription
```

This toolkit defines the recommended stack, lifecycle emails, newsletter strategy, data model, automation rules, and reusable email templates for Fastlytics.

---

# 1. Recommended Email Stack

## Current tools

```text
Supabase
  Auth, database, user profiles, event tracking

Cloudflare Worker
  API gateway, scheduled jobs, lifecycle automation, secrets management

Plunk
  Transactional and lifecycle product emails via API
  Supabase Auth emails via SMTP

Listmonk
  Weekly newsletters, race-weekend broadcasts, release notes
```

## Responsibility split

| Tool              | Use for                                                                           | Do not use for                       |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| Supabase Auth     | Signup confirmation, magic link, password reset                                   | Lifecycle or newsletter emails       |
| Plunk SMTP        | Supabase Auth email delivery                                                      | Marketing campaigns                  |
| Plunk API         | Welcome, onboarding, inactive-user nudges, personalized race emails, usage alerts | Long manual newsletters              |
| Listmonk          | Weekly newsletter, changelog, race-weekend broadcasts, community updates          | Highly personalized lifecycle emails |
| Cloudflare Worker | Automation, cron, event handling, Plunk/Listmonk sync                             | Storing long-term user state         |
| Supabase DB       | Users, events, preferences, email jobs, logs                                      | Rendering email UI                   |

## Recommended architecture

```text
Browser
  ↓
Cloudflare Worker API Gateway
  ↓
Supabase

Supabase Auth
  ↓ SMTP
Plunk

Cloudflare Worker Cron
  ↓
Supabase user_events / email_jobs
  ↓
Plunk API

Listmonk
  ← subscriber sync from Worker
  → manual newsletters and race-weekend campaigns
```

---

# 2. Email Categories

## 2.1 Auth and security emails

Use Supabase Auth with Plunk SMTP.

Examples:

```text
Email confirmation
Magic link
Password reset
Email change confirmation
Security notification
```

These are transactional. They do not need an unsubscribe link.

Recommended from address:

```text
auth@fastlytics.app
```

or:

```text
noreply@fastlytics.app
```

---

## 2.2 Lifecycle product emails

Use Plunk API.

Examples:

```text
Welcome to Fastlytics
Run your first driver comparison
Pick your favorite driver/team
Race data is live
Driver telemetry is ready
You have not checked the latest race data
Weekly personalized pit wall digest
Trial or usage-limit emails
```

Most lifecycle emails should include unsubscribe links unless they are strictly account-status, billing, or security related.

Recommended from address:

```text
subhash@fastlytics.app
```

or:

```text
hello@fastlytics.app
```

---

## 2.3 Broadcast newsletters

Use Listmonk.

Examples:

```text
Weekly F1 data digest
Race-weekend preview
Post-race breakdown
What the pit wall saw
Fastlytics changelog
Open-source community update
```

These must include unsubscribe links.

Recommended from address:

```text
newsletter@fastlytics.app
```

---

# 3. Email Strategy Principles

## Principle 1: Send analysis prompts, not generic SaaS nudges

Bad:

```text
We noticed you have not used Fastlytics in a while.
```

Better:

```text
The latest Grand Prix telemetry is live. Want to see where the lap was won?
```

## Principle 2: Each email should have one job

Every email should answer:

```text
What useful action should the user take next?
```

Examples:

```text
Compare two drivers
Open race telemetry
Pick favorite driver/team
Read post-race breakdown
Resume setup
Upgrade because usage limit is near
```

## Principle 3: Use behavior-based triggers

Do not send the same onboarding sequence to everyone blindly. Trigger emails based on what users have or have not done.

Examples:

```text
Signed up but did not compare drivers
Opened race page but did not use telemetry
Used telemetry but did not pick favorite driver
Active during last race but inactive this week
Favorite driver data is now available
```

## Principle 4: The email is a pit wall snapshot, not the full product

Emails should provide enough insight to create curiosity, then drive users back to Fastlytics.

```text
Email = quick static insight
Fastlytics app = full interactive analysis
```

## Principle 5: Do not push subscriptions before activation

Before asking for payment, make sure the user has experienced value.

Good upgrade timing:

```text
After multiple race analyses
After usage limit is near
After saved comparisons or advanced features are used
After a user follows a team/driver and returns repeatedly
```

---

# 4. Core User Events to Track

Fastlytics emails depend on good event tracking.

## Required events

```text
user_signed_up
user_logged_in
first_session_opened
race_page_viewed
telemetry_viewed
driver_comparison_created
strategy_viewed
favorite_driver_selected
favorite_team_selected
activation_completed
newsletter_subscribed
email_unsubscribed
last_active_at_updated
```

## Future monetization events

```text
subscription_started
subscription_cancelled
trial_started
trial_ending_soon
usage_limit_80_percent
usage_limit_reached
payment_failed
invoice_paid
```

## Suggested activation definition

A user should be considered activated when they perform one of these actions:

```text
Created or opened a driver comparison
Viewed telemetry for a race/session
Opened a strategy analysis
Selected a favorite driver/team and returned later
```

Recommended primary activation event:

```text
driver_comparison_created
```

---

# 5. Supabase Data Model

## user_events

```sql
create table user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_name text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index user_events_user_id_created_at_idx
on user_events (user_id, created_at desc);

create index user_events_event_name_idx
on user_events (event_name);
```

## email_jobs

```sql
create table email_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  type text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  error text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create unique index email_jobs_unique_user_type
on email_jobs (user_id, type);

create index email_jobs_pending_idx
on email_jobs (status, scheduled_for);
```

## email_preferences

```sql
create table email_preferences (
  user_id uuid primary key,
  product_emails_enabled boolean not null default true,
  newsletter_enabled boolean not null default true,
  race_alerts_enabled boolean not null default true,
  favorite_driver_alerts_enabled boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## user_f1_preferences

```sql
create table user_f1_preferences (
  user_id uuid primary key,
  favorite_driver text,
  favorite_team text,
  favorite_sessions text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## email_suppression

```sql
create table email_suppression (
  email text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);
```

---

# 6. Cloudflare Worker Automation

## Worker responsibilities

```text
Record product events
Run scheduled lifecycle checks
Create email_jobs rows
Send pending jobs via Plunk API
Sync newsletter subscribers to Listmonk
Handle billing webhooks later
Respect unsubscribe preferences
```

## Recommended cron jobs

```text
Every 15 minutes
  Send pending Plunk email jobs

Every day
  Create onboarding, activation, and inactivity email jobs

Every week
  Sync newsletter subscribers to Listmonk

Race-weekend schedule
  Send race-data-live and post-race prompts when data is available
```

## Example cron configuration

```toml
[triggers]
crons = ["*/15 * * * *", "0 9 * * *", "0 10 * * 1"]
```

## Worker flow

```text
scheduled()
  → runLifecycleRules()
  → createEmailJobs()
  → sendPendingEmailJobs()
```

---

# 7. Lifecycle Email Sequence

## Sequence overview

```text
1. Signup
   → Welcome to the pit wall

2. After 24 hours
   If no driver comparison
   → Run your first comparison

3. After 48–72 hours
   If not activated
   → Founder check-in

4. After first analysis
   → First analysis milestone

5. After activation
   If no favorite driver/team selected
   → Pick your driver/team

6. Race data available
   → Latest Grand Prix data is live

7. Weekly if active
   → Personalized pit wall digest

8. After 14 days inactive
   → Did you check the latest race data?
```

---

# 8. Email Types and Templates

## 8.1 Welcome Email

### Goal

Help users perform the first meaningful action.

### Trigger

```text
user_signed_up
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Welcome to the Fastlytics pit wall
Your F1 pit wall is ready
Analyze F1 like you are on the strategy wall
```

### Template

```text
Hey {{name}},

Welcome to Fastlytics — your F1 pit wall at your fingertips.

The fastest way to get value is to run a driver comparison from the latest race.

Start here:
[Compare two drivers]

You can compare telemetry, sector performance, race pace, and strategy signals in one place.

See you on the pit wall,
Subhash
```

### CTA

```text
Compare two drivers
```

---

## 8.2 First Comparison Nudge

### Goal

Move signed-up users to activation.

### Trigger

```text
24 hours after signup
AND driver_comparison_created does not exist
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Run your first F1 driver comparison
Where did the lap time go?
Try one telemetry comparison
```

### Template

```text
Hey {{name}},

You created a Fastlytics account but have not run your first driver comparison yet.

That is where Fastlytics starts to feel like a real pit wall.

Try comparing two drivers from the latest Grand Prix:
[Run comparison]

You will be able to see sector deltas, pace differences, and where time was gained or lost.
```

---

## 8.3 Founder Check-in

### Goal

Learn why users are not activating.

### Trigger

```text
72 hours after signup
AND activation_completed does not exist
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
quick question
what were you trying to analyze?
anything confusing?
```

### Template

```text
Hey {{name}},

I noticed you signed up for Fastlytics but have not fully used the pit wall yet.

Quick question: what F1 analysis were you hoping to do?

Was anything confusing, missing, or broken?

I am the founder — you can just reply to this email and I will read it.

Subhash
```

---

## 8.4 First Analysis Milestone

### Goal

Reward the user and guide them to the next action.

### Trigger

```text
activation_completed
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Your first Fastlytics analysis is live
Nice — you are on the pit wall now
First comparison complete
```

### Template

```text
Hey {{name}},

Nice — your first Fastlytics analysis is live.

Next, you can personalize your pit wall by choosing your favorite driver or team.

This lets Fastlytics surface more relevant race data and analysis prompts.

[Pick favorite driver/team]
```

---

## 8.5 Favorite Driver or Team Prompt

### Goal

Collect personalization data.

### Trigger

```text
User activated
AND favorite_driver is null
AND favorite_team is null
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Who is on your pit wall?
Pick your favorite driver
Follow your favorite team in Fastlytics
```

### Template

```text
Hey {{name}},

Who do you want Fastlytics to track more closely?

Pick your favorite driver or team and we will surface more relevant telemetry, strategy, and race analysis.

[Choose favorite driver/team]
```

---

## 8.6 Race Data Live Email

### Goal

Bring users back after new race/session data is available.

### Trigger

```text
New race/session data available
```

### Send via

```text
Listmonk for broad audience
Plunk API for personalized user alerts
```

### Subject ideas

```text
{{race_name}} data is live
The {{race_name}} pit wall is open
Telemetry from {{race_name}} is ready
```

### Template

```text
The {{race_name}} data is now live in Fastlytics.

Start with:

- Driver telemetry comparison
- Sector-by-sector deltas
- Race pace trends
- Strategy analysis

[Open {{race_name}} analysis]
```

---

## 8.7 Driver Comparison Ready Email

### Goal

Personalized re-engagement around a driver/team the user cares about.

### Trigger

```text
New data available
AND user has favorite_driver or favorite_team
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
{{driver}} telemetry is live for {{race_name}}
{{driver_a}} vs {{driver_b}} is ready
Where {{driver}} gained time in {{race_name}}
```

### Template

```text
Hey {{name}},

{{driver}} telemetry from {{race_name}} is now available.

You can compare:

- throttle traces
- braking points
- sector deltas
- lap evolution
- race pace trends

[Open telemetry]
```

---

## 8.8 Inactivity Reactivation Email

### Goal

Bring back inactive users using timely F1 context.

### Trigger

```text
User inactive for 14 days
AND product_emails_enabled = true
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Did you check the latest race data?
The latest pit wall data is ready
{{race_name}} telemetry is waiting
```

### Template

```text
Hey {{name}},

You have not opened Fastlytics in a bit, but the latest race data is live.

If you missed the race, this is the fastest way to understand what happened through telemetry and strategy.

[Open latest race analysis]
```

---

## 8.9 Weekly Personalized Pit Wall Digest

### Goal

Create a habit for active users.

### Trigger

```text
Weekly
AND user had meaningful activity or followed drivers/teams
```

### Send via

```text
Plunk API
```

### Subject ideas

```text
Your Fastlytics week: {{top_driver}}, {{race_name}}, and {{count}} analyses
Your pit wall digest
Most analyzed this week in Fastlytics
```

### Template

```text
Hey {{name}},

Here is your Fastlytics pit wall digest for this week.

Your activity:
- {{analyses_count}} analyses opened
- {{comparisons_count}} driver comparisons
- Favorite driver: {{favorite_driver}}

Trending this week:
1. {{trending_comparison_1}}
2. {{trending_comparison_2}}
3. {{trending_analysis}}

Recommended next analysis:
[Open weekly pit wall]
```

Do not send this if the digest would be empty.

---

## 8.10 Newsletter / What the Pit Wall Saw

### Goal

Build authority and community.

### Trigger

```text
Weekly or post-race
```

### Send via

```text
Listmonk
```

### Subject ideas

```text
What the pit wall saw in {{race_name}}
The data story from {{race_name}}
{{race_name}}: what most fans missed
```

### Template

```text
This week in Fastlytics:

The biggest data story from {{race_name}} was {{main_insight}}.

What stood out:

1. {{insight_1}}
2. {{insight_2}}
3. {{insight_3}}

Explore the data:
[Open race analysis]

Product updates:
- {{update_1}}
- {{update_2}}

Community:
- {{community_note}}
```

---

# 9. React Email Guidance

React Email is a good fit for Fastlytics because your emails can include reusable, data-rich components.

## Use React Email for

```text
Reusable templates
Driver comparison cards
Race summary cards
Metric tables
CTA buttons
Digest layouts
Static telemetry snapshots
```

## Do not use React Email as if emails are web apps

Avoid relying on:

```text
JavaScript interactivity
Tabs
Dropdowns
Hover states
Canvas charts
Complex CSS grid
Tooltips
Website-level responsive UI
```

## Correct mental model

```text
React components → rendered email-safe HTML → Plunk/Listmonk sends email
```

Not:

```text
React app inside Gmail
```

## Recommended folder structure

```text
/packages/email
  /components
    DriverComparisonCard.tsx
    RaceSummaryCard.tsx
    MetricTable.tsx
    Button.tsx
    Layout.tsx
  /templates
    WelcomeToPitWallEmail.tsx
    FirstComparisonNudgeEmail.tsx
    DriverComparisonReadyEmail.tsx
    RaceDataLiveEmail.tsx
    WeeklyPitWallDigestEmail.tsx
```

## Driver comparison email component idea

```tsx
<DriverComparisonEmail
  race="Bahrain GP"
  session="Qualifying"
  driverA="VER"
  driverB="NOR"
  fastestLapA="1:28.412"
  fastestLapB="1:28.589"
  sectorWins={[
    { sector: 'S1', winner: 'VER', delta: '+0.124' },
    { sector: 'S2', winner: 'NOR', delta: '+0.081' },
    { sector: 'S3', winner: 'VER', delta: '+0.042' },
  ]}
  comparisonUrl="https://fastlytics.app/..."
/>
```

## Key design rule

Use email as a static snapshot.

```text
Email: here is what the data suggests
CTA: open full interactive analysis in Fastlytics
```

---

# 10. Personalization Strategy

## Minimum personalization

```text
First name
Latest race
Most recent session viewed
Activation status
Favorite driver/team
Last active date
```

## Strong personalization

```text
Favorite driver telemetry alerts
Favorite team strategy breakdowns
Driver comparison recommendations
Weekly digest based on viewed races
Reactivation based on latest race data
```

## Data to collect early

```text
favorite_driver
favorite_team
preferred_session_type
last_viewed_race
last_viewed_driver
last_viewed_team
activation_completed_at
last_active_at
```

---

# 11. Subscription-Ready Emails

When subscriptions launch, add these emails.

## 11.1 Usage Limit Warning

### Trigger

```text
User reaches 80% of free usage limit
```

### Subject

```text
You are close to your Fastlytics free limit
```

### Template

```text
Hey {{name}},

You have used {{usage_percent}}% of your free Fastlytics quota this month.

Current usage:
{{usage}} / {{limit}}

You can keep analyzing races without interruption by upgrading.

[View plans]
```

---

## 11.2 Limit Reached

### Trigger

```text
User reaches 100% of free usage limit
```

### Subject

```text
You have reached your Fastlytics free limit
```

### Template

```text
Hey {{name}},

You have reached your free Fastlytics usage limit for this month.

To continue using advanced telemetry and strategy analysis, upgrade your plan.

[Upgrade]
```

---

## 11.3 Trial Ending

### Trigger

```text
Trial ends in 3 days
```

### Subject

```text
Your Fastlytics trial ends in 3 days
```

### Template

```text
Hey {{name}},

Your Fastlytics trial ends in 3 days.

You have used:
- {{analyses_count}} analyses
- {{comparisons_count}} driver comparisons
- {{favorite_feature}} most often

Keep your pit wall open:
[Choose plan]
```

---

# 12. Metrics to Track

## Email metrics

```text
Delivery rate
Open rate
Click rate
Reply rate
Unsubscribe rate
Bounce rate
Spam complaint rate
```

## Product metrics tied to email

```text
Signup-to-activation rate
Activation email click-through rate
Inactive-user return rate
Race-data-live email click-through rate
Favorite driver/team selection rate
Newsletter-to-app sessions
Free-to-paid conversion rate
```

## Most important metric early

```text
Signup → first driver comparison
```

This is the core activation metric.

---

# 13. UTM and Tracking Standards

Use consistent UTM parameters for all links.

## Examples

```text
utm_source=plunk
utm_medium=email
utm_campaign=welcome_to_pitwall
utm_content=compare_two_drivers
```

```text
utm_source=listmonk
utm_medium=email
utm_campaign=post_race_breakdown
utm_content=open_race_analysis
```

## Recommended naming

```text
welcome_to_pitwall
first_comparison_nudge
founder_checkin
race_data_live
weekly_pitwall_digest
inactive_race_reminder
usage_limit_warning
```

---

# 14. Unsubscribe and Preferences

## Required preference groups

```text
Product emails
Race alerts
Favorite driver/team alerts
Newsletter
Billing/security emails
```

Users should be able to unsubscribe from marketing/lifecycle emails without blocking security or billing emails.

## Suggested preference page

```text
Email Preferences

[ ] Product tips and onboarding
[ ] Race data alerts
[ ] Favorite driver/team alerts
[ ] Weekly newsletter

Security and billing emails cannot be disabled.
```

---

# 15. Deliverability Checklist

## Domain setup

```text
SPF configured
DKIM configured
DMARC configured
Custom tracking domain if supported
Separate sender addresses by category
```

## Sending practices

```text
Do not blast inactive users too often
Avoid spammy subject lines
Keep emails useful and expected
Include unsubscribe links for lifecycle/marketing emails
Do not mix auth emails with newsletters
Monitor bounces and complaints
Suppress bounced emails
```

## Recommended sender split

```text
auth@fastlytics.app
  Auth and security

hello@fastlytics.app or subhash@fastlytics.app
  Lifecycle and product emails

newsletter@fastlytics.app
  Newsletters and broadcasts
```

---

# 16. First 30-Day Implementation Plan

## Week 1: Foundation

```text
Set up Plunk SMTP for Supabase Auth
Create user_events table
Create email_jobs table
Create email_preferences table
Add event tracking for signup, login, race page view, driver comparison
Add Cloudflare Worker secrets
```

## Week 2: First lifecycle emails

```text
Build Welcome to Pit Wall email
Build First Comparison Nudge email
Build Founder Check-in email
Send through Plunk API
Log all sends in email_jobs
Add unsubscribe handling
```

## Week 3: Race engagement

```text
Build Race Data Live email
Create Listmonk race-weekend newsletter format
Add latest race CTA links
Start collecting favorite driver/team
```

## Week 4: Personalization and measurement

```text
Build Favorite Driver/Team prompt
Build Inactive Race Reminder
Add UTM tracking
Measure signup-to-comparison conversion
Measure email click-through by template
Review replies from founder check-in
```

---

# 17. First Emails to Build

Build these in order:

```text
1. WelcomeToPitWallEmail
2. FirstComparisonNudgeEmail
3. FounderCheckInEmail
4. RaceDataLiveEmail
5. FavoriteDriverTeamPromptEmail
6. InactiveRaceReminderEmail
7. WeeklyPitWallDigestEmail
```

Do not build more until these are working and measured.

---

# 18. Copywriting Voice

Fastlytics should sound like:

```text
F1 analyst
Race engineer
Data-driven fan
Open-source builder
```

Not like:

```text
Generic SaaS marketer
Corporate newsletter
Fake personal assistant
Growth-hack automation bot
```

## Good phrases

```text
Your pit wall is ready
The data is live
Where the lap was won
What the pit wall saw
Compare the telemetry
Open the race analysis
The strategy story from this weekend
```

## Avoid phrases

```text
We miss you
Just checking in
Boost your productivity
Unlock powerful insights
Supercharge your workflow
Limited time offer
```

---

# 19. Example End-to-End Lifecycle

```text
Day 0
User signs up
→ Welcome to the Fastlytics pit wall

Day 1
No driver comparison yet
→ Run your first F1 driver comparison

Day 3
Still not activated
→ Founder check-in: what were you trying to analyze?

Activation moment
User creates first comparison
→ Nice — your first analysis is live

After activation
No favorite driver/team selected
→ Who is on your pit wall?

Race data available
→ Latest Grand Prix data is live

Weekly
Active user
→ Personalized pit wall digest

14 days inactive
→ Did you check the latest race data?
```

---

# 20. Final Recommendation

Fastlytics should use email as a race-analysis distribution system, not just a retention tool.

The winning strategy:

```text
Plunk API for personalized lifecycle emails
Listmonk for manual race-weekend newsletters
Cloudflare Workers for automation
Supabase for events, preferences, and email jobs
React Email for reusable, data-rich templates
```

The first measurable goal:

```text
Increase the percentage of new users who create their first driver comparison.
```

The best first emails:

```text
Welcome to the pit wall
Run your first comparison
Founder check-in
Race data is live
```

Everything else should come later.
