# F1Technical: "6 months ago I posted my F1 telemetry tool here. You gave feedback. Here's what I built since then."

About 6 months ago I posted here asking for feedback on Fastlytics, a solo project I'd been building to analyze F1 telemetry data. You all gave me a ton of great suggestions and the post got me my first real users. I wanted to come back and show what changed.

The short version: it's no longer just a telemetry viewer. It's now a full platform with AI analysis, session replays, driver comparisons, and a lot more -- still free for the current season.

Here's what I built based on your feedback:

**AI Telemetry Analysis**
Someone suggested adding automated insights instead of just raw charts. I built an AI engine that looks at lap data and outputs a natural language breakdown: where drivers gain/lose time, corner-by-corner analysis, and key observations. It's not perfect but it catches things I'd miss manually.

**Full Session Replay**
The most requested feature. It's now a full race timeline replay -- all 20 drivers as dots on a track map, with synced telemetry overlays (speed, throttle, brake, gear, RPM, DRS), race control messages, sector times, and a draggable leaderboard. You can toggle ghost drivers, speed heatmaps, and car trails. Free tier gives you 5 minutes per race, which is enough for the key battle.

**Head-to-Head Driver Comparison**
Pick any two drivers and get their telemetry overlaid with delta time graphs showing exactly where time was won or lost per corner. Includes weather context (air temp, track temp, wind) and the AI analysis if you want it.

**Driver and Team Profile Pages**
Full career stats, championship progression charts, Wikipedia bios, current season standings. You can toggle driver photos by season for the active drivers.

**MCP Server for AI Coding Tools**
This one's for the devs here. I published an npm package (fastlytics-mcp) that gives Claude, Cursor, VS Code, and other AI tools direct access to 30 typed F1 data tools. You can ask your IDE "compare Verstappen and Leclerc's throttle traces at Bahrain" and it just works. Free tier gets 300 calls/month.

**What's still free vs paid**
Everything above is available for free on the current season. I added a Pro tier ($5.99/mo) that unlocks all historical seasons (2018+), unlimited session replay, 100 AI analyses/month, and 3,000 MCP calls/month. I didn't want to take anything away from people who've been using it.

If you remember the old post, the tool was pretty rough. I rewrote the entire rendering engine, added lazy loading so pages don't take forever, built a dashboard with personalized widgets, and added news/discussion features. It's been a long six months of solo development.

[fastlytics.app](https://fastlytics.app) if you want to check it out. Open to feedback as always -- this community literally shaped what the tool became.

---

# r/formula1: "I built a free F1 analytics tool that goes way deeper than the broadcast"

Over the last year I've been building a solo project called Fastlytics. It started as a simple telemetry viewer and somehow turned into a full platform. It's free for the current 2026 season and I thought this community might find it useful.

Here's what it can do:

**Detailed telemetry overlays** -- speed, throttle, brake, RPM, gear, and DRS traces for any driver in any session. Overlay two drivers to compare where time is gained or lost down to the meter. Not just lap times, the actual driving data.

**Advanced telemetry analysis** -- an engine that reads lap data and outputs a breakdown: where drivers gain or lose time, corner-by-corner analysis, and key observations. It catches things that are easy to miss manually. Free tier gets 5 analyses per month.

**MCP server for dev tools** -- I published an npm package (fastlytics-mcp) that gives CLI agents like Claude, Cursor, and VS Code direct access to 30 typed F1 data tools. You can ask your agent "compare Verstappen and Leclerc's throttle traces at Canada" and it just works. 300 calls/month on free tier.

**Tyre strategy visualizations** -- charts showing who pitted when, what compound they were on, and how long each stint lasted. Side-by-side across the whole grid.

**Championship and race data** -- standings, race results, pace analysis, lap time evolution, position changes lap-by-lap. All the usual stuff plus some extras.

**Driver and team profiles** -- career stats, championship history, current form. Toggle between different seasons' headshots for active drivers. Working on a driver fingerprint feature that maps driving style characteristics per driver.

I built this alone as a passion project. It's at [fastlytics.app](https://fastlytics.app) if you want to try it. No account needed for most features, just the race data. If you do create an account you get personalized dashboards, saved charts, and notification preferences.

Everything above is free for the current season. I added a Pro tier ($5.99/mo) that unlocks historical seasons (2018+), unlimited replay, and higher usage limits. Nothing was taken away from free users.

I know self-promo posts can be annoying so I genuinely want to contribute to discussions here too. Happy to answer questions about how the data pipeline works or what the telemetry actually means if anyone's curious.

---

# r/F1DataAnalysis: "Fastlytics: telemetry analysis engine, 30 MCP tools, and deep F1 data access"

I've been building an F1 data platform solo over the last year and figured this subreddit would be the right audience for it. Fastlytics combines telemetry visualization, an automated analysis engine, and programmatic data access into one tool. It's free for the 2026 season.

**What it does differently from other tools:**

1. **Automated telemetry analysis** -- instead of just showing you speed traces, an analysis engine reads the lap data and writes a summary with numbered insights and corner-by-corner breakdowns. It identifies where drivers differ in braking points, throttle application, and entry/exit speeds. Free tier: 5 analyses/month.

2. **30 MCP tools for programmatic access** -- if you code, you can use `npx -y fastlytics-mcp` to get typed tools in Claude, Cursor, VS Code, etc. Query telemetry, compare drivers, get circuit info, lap times, standings, weather data, driver bios, and more. 300 calls/month free.

3. **Detailed telemetry overlays** -- speed, throttle, brake, RPM, gear, DRS traces for any driver. Overlay two drivers with delta time graphs showing exactly where time was won or lost per corner. Session weather conditions (air temp, track temp, humidity, wind) shown alongside the data for context.

4. **Driver and team deep dives** -- full career stats, championship progression charts, season-by-season comparisons. Working on a driver fingerprint feature that maps driving style characteristics (braking patterns, cornering preferences) per driver.

5. **All the standard stuff too** -- lap time distributions, pace analysis, strategy charts, championship progression, position changes, team pace comparisons, sector time breakdowns.

Data sources: FastF1 for telemetry, Jolpica for standings, Open-Meteo for weather, Wikipedia for bios. Everything is cached on Supabase.

Everything above is free for the current season. Pro tier ($5.99/mo) unlocks historical seasons (2018+) and higher usage limits. Nothing was taken from free users.

[fastlytics.app](https://fastlytics.app) if you're interested. I'm actively building this and feedback from data-minded F1 fans is what's driven most of the feature development so far.

---

# r/SideProject: "I spent a year building an F1 analytics platform alone. It finally makes money."

Last year I started building a tool to analyze F1 telemetry data because I was tired of watching races and not understanding _why_ one driver was faster. Fast forward to today: Fastlytics has 3,889 registered users, processes telemetry for every F1 race, and just launched a Pro plan.

**The build:**

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui
- Backend: Python/FastAPI
- Database: Supabase (PostgreSQL)
- Real-time data: FastF1 (Python library for F1 telemetry)
- API proxy: Cloudflare Workers
- Auth: Supabase Auth (Google, GitHub, Discord, email)
- Payments: Dodo Payments

**What it does:**

The core idea is making F1 telemetry data accessible and visual. You can overlay speed/throttle/brake/RPM traces for any driver, compare two drivers corner-by-corner, and get an automated analysis engine that reads the data and writes a breakdown of what happened. There's also championship data, strategy charts, driver profiles, news aggregation, and a programmable API (30 typed tools via npm) that lets AI coding tools query F1 data directly.

**The business side:**

I kept everything free for the first year to build an audience. Two weeks ago I launched a Pro tier at $5.99/mo ($54.99/yr). Free users still get the current season and 5 telemetry analyses per month. Pro unlocks all historical seasons (2018+), unlimited replay, 100 analyses, and higher API limits. The paid features sit on top of the free ones -- nothing was taken away from existing users.

**What I learned:**

- Don't build features nobody asked for. Every major feature started as feedback from early users on Reddit and Discord.
- Getting a domain verified for email and setting up DMARC/SPF/DKIM for email sending was surprisingly the most annoying part.
- Reddit posts actually convert better than any paid channel I tried. The F1Technical subreddit was my first real traffic spike.
- The MCP server (letting AI coding tools access my API) was an unexpected growth channel. People install it for AI workflows and then discover the web app.
- Build for yourself first -- I use Fastlytics to understand every race I watch, and that makes it easy to know what to build next.

The site is at [fastlytics.app](https://fastlytics.app). The code is open source at github.com/subhashhhhhh/Fastlytics. Happy to answer questions about the stack, the data pipeline, or the business side of things.
