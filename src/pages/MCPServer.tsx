// knip-ignore
import React, { useState } from 'react';
import { m, type Variants } from 'motion/react';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const categoryIcons: Record<string, React.ReactNode> = {
  telemetry: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 17V10L7 13L10 7L13 11L17 3V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  sessions: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 8h16M7 3v5M13 3v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  laps: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6v4l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  results: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 17V10M10 17V7M14 17V4M17 17H3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  racecontext: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 2L3 6l3 4M14 2l3 4-3 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 6h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  team: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1 17c0-3.3 2.7-6 6-6h3c.7 0 1.3.1 1.9.3M10.9 17c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bios: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  weather: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 11c-.7 0-1.3-.6-1.3-1.3S4.3 8.3 5 8.3c.2-2 1.8-3.6 3.9-3.6 1.6 0 3 .9 3.6 2.3 1.9 0 3.4 1.5 3.4 3.4s-1.5 3.4-3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 13.5L3.5 15L5 16.5M7.5 15h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6v4l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3l-1 3h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const categories = [
  {
    id: 'telemetry',
    label: 'Telemetry & Circuit',
    count: 4,
    tools: ['get_telemetry', 'compare_telemetry', 'get_circuit_info', 'get_pace_distribution'],
  },
  {
    id: 'sessions',
    label: 'Sessions & Drivers',
    count: 3,
    tools: ['list_events', 'list_sessions', 'list_drivers'],
  },
  {
    id: 'laps',
    label: 'Lap Analysis',
    count: 5,
    tools: [
      'get_laptimes',
      'get_laptimes_gaps',
      'get_lap_positions',
      'get_strategy',
      'get_stint_analysis',
    ],
  },
  {
    id: 'results',
    label: 'Results & Standings',
    count: 3,
    tools: ['get_race_results', 'get_standings', 'get_championship_progression'],
  },
  {
    id: 'racecontext',
    label: 'Race Context',
    count: 2,
    tools: ['get_race_control', 'get_incidents'],
  },
  { id: 'team', label: 'Team Performance', count: 1, tools: ['get_team_pace'] },
  {
    id: 'bios',
    label: 'Driver & Team Bios',
    count: 6,
    tools: [
      'search_driver',
      'get_driver_bio',
      'get_driver_career',
      'get_team_bio',
      'get_head_to_head',
      'get_leaderboard',
    ],
  },
  { id: 'weather', label: 'Weather', count: 2, tools: ['get_weather_forecast', 'get_weather'] },
  {
    id: 'history',
    label: 'Driver & Team History',
    count: 3,
    tools: ['get_driver_championship', 'get_driver_teammates', 'get_team_championship'],
  },
];

interface PlatformMode {
  configFile: string;
  config: string;
  description: string;
  note?: string;
}

interface PlatformConfig {
  id: string;
  name: string;
  logo: string;
  logoAlt: string;
  local: PlatformMode;
  remote: PlatformMode;
}

const MCP_URL = 'https://mcp.fastlytics.app/mcp';

function buildRemoteGeneric(name: string): PlatformMode {
  return {
    configFile: 'N/A (remote endpoint)',
    config: `{
  "mcpServers": {
    "fastlytics": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer fl_mcp_..."
      }
    }
  }
}`,
    description: `${name} connects to the hosted MCP endpoint over HTTPS. Replace fl_mcp_... with your API key.`,
  };
}

function buildLocalStdio(name: string, configPath: string): PlatformMode {
  return {
    configFile: configPath,
    config: `{
  "mcpServers": {
    "fastlytics": {
      "command": "npx",
      "args": ["-y", "fastlytics-mcp"],
      "env": {
        "FASTLYTICS_MCP_API_KEY": "fl_mcp_..."
      }
    }
  }
}`,
    description: `Add this to ${configPath}, replace the API key, then restart ${name}.`,
  };
}

const platformConfigs: PlatformConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    logo: '/ai-agent/Claude AI.svg',
    logoAlt: 'Claude AI',
    local: {
      configFile: '.claude/mcp.json or Claude Desktop config',
      config: `{
  "mcpServers": {
    "fastlytics": {
      "command": "npx",
      "args": ["-y", "fastlytics-mcp"],
      "env": {
        "FASTLYTICS_MCP_API_KEY": "fl_mcp_..."
      }
    }
  }
}`,
      description:
        'Add to .claude/mcp.json (Claude Code) or the Claude Desktop config, replace your API key, then restart.',
    },
    remote: {
      configFile: 'Claude hosted (OAuth preferred)',
      config: `{
  "mcpServers": {
    "fastlytics": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer fl_mcp_..."
      }
    }
  }
}`,
      description:
        'For Claude hosted connectors (claude.ai, Claude web), OAuth is the recommended auth model. Static API keys may not be supported.',
      note: 'Prefer OAuth for Claude hosted. Static headers work for Claude Desktop remote connections.',
    },
  },
  {
    id: 'cursor',
    name: 'Cursor',
    logo: '/ai-agent/Cursor-dark.svg',
    logoAlt: 'Cursor',
    local: buildLocalStdio('Cursor', '.cursor/mcp.json'),
    remote: buildRemoteGeneric('Cursor'),
  },
  {
    id: 'vscode',
    name: 'VS Code / Copilot',
    logo: '/ai-agent/GitHub Copilot-dark.svg',
    logoAlt: 'GitHub Copilot',
    local: buildLocalStdio('VS Code', '.vscode/mcp.json'),
    remote: {
      ...buildRemoteGeneric('VS Code / Copilot'),
      config: `{
  "mcpServers": {
    "fastlytics": {
      "type": "http",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer fl_mcp_..."
      }
    }
  }
}`,
    },
  },
  {
    id: 'kilo',
    name: 'KiloCode',
    logo: '/ai-agent/Kilo Code-dark.svg',
    logoAlt: 'KiloCode',
    local: {
      configFile: '.kilo/kilo.json',
      config: `{
  "mcp": {
    "fastlytics": {
      "type": "local",
      "command": ["npx", "-y", "fastlytics-mcp"],
      "environment": {
        "FASTLYTICS_MCP_API_KEY": "fl_mcp_..."
      }
    }
  }
}`,
      description:
        'Add this to your .kilo/kilo.json config, replace your API key, then restart your KiloCode session.',
    },
    remote: {
      configFile: '.kilo/kilo.json',
      config: `{
  "mcp": {
    "fastlytics": {
      "type": "remote",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer fl_mcp_..."
      },
      "oauth": false
    }
  }
}`,
      description:
        'Use remote mode in your .kilo/kilo.json config. No npm package needed — connects directly to the hosted endpoint.',
    },
  },
  {
    id: 'codex',
    name: 'Codex',
    logo: '/ai-agent/Codex-dark.svg',
    logoAlt: 'Codex',
    local: {
      configFile: '.codex/config.toml',
      config: `[mcp_servers.fastlytics]
command = "npx"
args = ["-y", "fastlytics-mcp"]

[mcp_servers.fastlytics.env]
FASTLYTICS_MCP_API_KEY = "fl_mcp_..."`,
      description:
        'Add this to .codex/config.toml in your project root, replace your API key, then restart Codex.',
    },
    remote: buildRemoteGeneric('Codex'),
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    logo: '/ai-agent/OpenCode-dark.svg',
    logoAlt: 'OpenCode',
    local: {
      configFile: '~/.config/opencode/opencode.jsonc',
      config: `{
  "mcp": {
    "fastlytics": {
      "type": "local",
      "command": ["npx", "-y", "fastlytics-mcp"],
      "enabled": true,
      "environment": {
        "FASTLYTICS_MCP_API_KEY": "fl_mcp_..."
      }
    }
  }
}`,
      description:
        'Add this to your OpenCode config at ~/.config/opencode/opencode.jsonc, replace your API key, then restart.',
    },
    remote: {
      configFile: '~/.config/opencode/opencode.jsonc',
      config: `{
  "mcp": {
    "fastlytics": {
      "type": "remote",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer fl_mcp_..."
      },
      "oauth": false
    }
  }
}`,
      description:
        'Use remote mode in your OpenCode config. No npm package needed — connects directly to the hosted endpoint.',
    },
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    logo: '/ai-agent/Windsurf-dark.svg',
    logoAlt: 'Windsurf',
    local: buildLocalStdio('Windsurf', '.windsurf/mcp.json'),
    remote: buildRemoteGeneric('Windsurf'),
  },
];

const examplePrompts = [
  {
    query: "Compare Verstappen and Hamilton's fastest laps at the 2025 Monaco Grand Prix",
    tool: 'compare_telemetry',
  },
  { query: 'Show me the championship standings after the 2024 season', tool: 'get_standings' },
  { query: 'What was the tire strategy for the 2025 Chinese Grand Prix?', tool: 'get_strategy' },
  {
    query: 'How did Lando Norris progress through the 2025 season round by round?',
    tool: 'get_driver_championship',
  },
  { query: 'List all incidents from the 2025 Australian Grand Prix race', tool: 'get_incidents' },
  { query: 'Compare the career stats of Senna vs Prost', tool: 'get_head_to_head' },
  {
    query: 'What was the weather forecast for the 2025 Miami Grand Prix weekend?',
    tool: 'get_weather_forecast',
  },
  { query: 'Show me all-time F1 wins leaderboard', tool: 'get_leaderboard' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-4 right-4 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function ConfigBlock({ config }: { config: string }) {
  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-[#060608] overflow-hidden">
      <CopyButton text={config} />
      <pre className="p-5 text-[13px] leading-relaxed text-white/60 overflow-x-auto font-mono whitespace-pre">
        {config}
      </pre>
    </div>
  );
}

function PlatformCard({ platform }: { platform: PlatformConfig }) {
  const [mode, setMode] = useState<'local' | 'remote'>('local');
  const cfg = platform[mode];

  return (
    <m.div
      variants={fadeUp}
      className="group rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden hover:border-white/[0.10] transition-all duration-300"
    >
      <div className="p-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <img src={platform.logo} alt={platform.logoAlt} className="size-9 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-white truncate">{platform.name}</h3>
          </div>
        </div>

        <div className="flex rounded-lg bg-white/[0.03] border border-white/[0.04] p-0.5 mb-4">
          <button
            type="button"
            onClick={() => setMode('local')}
            className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
              mode === 'local'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            Local
          </button>
          <button
            type="button"
            onClick={() => setMode('remote')}
            className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
              mode === 'remote'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            Remote
          </button>
        </div>
      </div>

      <div className="p-5 pt-0">
        <p className="text-[12px] text-white/25 font-mono mb-3 truncate">{cfg.configFile}</p>
        <ConfigBlock config={cfg.config} />
        <p className="mt-3 text-[12px] leading-relaxed text-white/35">{cfg.description}</p>
        {cfg.note && (
          <p className="mt-2 text-[11px] leading-relaxed text-amber-400/60">{cfg.note}</p>
        )}
      </div>
    </m.div>
  );
}

const MCPServer = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Fastlytics MCP Server — F1 Data for AI Agents"
        description="Connect Formula 1 telemetry, race results, driver bios, weather, and historical data from 1950-present to any AI agent via the Model Context Protocol. 30 typed tools, free to start."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ─── Hero ─── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              MCP Server
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Bring F1 data into
              <br />
              <span className="text-white/40">any AI agent</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/40">
              30 typed tools for telemetry, race results, driver bios, weather, and historical data
              — from 1950 to the present day. Works with Claude, Cursor, VS Code, KiloCode, and any
              MCP-compatible client.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/settings"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
              >
                Get your API key
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M1 7h12M8 2l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <a
                href="https://www.npmjs.com/package/fastlytics-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
              >
                View on npm
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 7h12M8 2l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <div className="mt-8 max-w-xl">
              <div className="relative rounded-xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden group">
                <CopyButton text="npx -y fastlytics-mcp" />
                <div className="flex items-center gap-3 px-5 py-4">
                  <img src="/ai-agent/NPM.svg" alt="npm" className="size-8 shrink-0 opacity-60" />
                  <code className="text-[15px] font-mono text-white/50 select-all flex-1 min-w-0 truncate">
                    npx -y fastlytics-mcp
                  </code>
                </div>
              </div>
            </div>
          </m.div>
        </div>
      </main>

      <main>
        {/* ─── What is MCP? ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <m.p
              variants={fadeUp}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3"
            >
              What is MCP?
            </m.p>
            <m.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center"
            >
              Your AI assistant, now connected to F1 data
            </m.h2>
            <m.p
              variants={fadeUp}
              className="mt-4 text-[16px] leading-relaxed text-white/40 text-center max-w-2xl mx-auto"
            >
              The{' '}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 underline underline-offset-4 hover:text-white transition-colors"
              >
                Model Context Protocol
              </a>{' '}
              (MCP) is an open standard that lets AI agents securely access external tools and data
              sources. Fastlytics provides an MCP server that gives any compatible AI client access
              to 30 typed F1 data tools — from live telemetry traces to historical championships.
            </m.p>

            <m.div
              variants={fadeUp}
              className="mt-10 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
                <div className="rounded-lg border border-white/[0.06] bg-[#060608] px-5 py-3">
                  <span className="text-[12px] font-semibold text-white/50">Your AI Client</span>
                  <p className="mt-1 text-[13px] text-white/80 font-medium">
                    Claude · Cursor · VS Code · KiloCode
                  </p>
                </div>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 -rotate-90 sm:rotate-0 text-white/20"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] px-5 py-3">
                  <span className="text-[12px] font-semibold text-red-400">Fastlytics MCP</span>
                  <p className="mt-1 text-[13px] text-white/80 font-medium">
                    30 tools · stdio + HTTP/SSE
                  </p>
                </div>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 -rotate-90 sm:rotate-0 text-white/20"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="rounded-lg border border-white/[0.06] bg-[#060608] px-5 py-3">
                  <span className="text-[12px] font-semibold text-white/50">Data Sources</span>
                  <p className="mt-1 text-[13px] text-white/80 font-medium">
                    F1 telemetry · 1950-present records
                  </p>
                </div>
              </div>
            </m.div>
          </m.div>
        </section>

        {/* ─── Tool Categories ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <m.p
              variants={fadeUp}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3"
            >
              Available Tools
            </m.p>
            <m.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center"
            >
              30 tools across 9 categories
            </m.h2>
            <m.div
              variants={fadeUp}
              className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 hover:border-white/[0.10] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-white/[0.06] bg-[#060608] text-red-400">
                      {categoryIcons[cat.id]}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{cat.label}</h3>
                      <p className="text-[12px] text-white/30">
                        {cat.count} tool{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tools.map((tool) => (
                      <code
                        key={tool}
                        className="rounded bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-white/35"
                      >
                        {tool}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </m.div>
          </m.div>
        </section>

        {/* ─── Get Started ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <m.p
              variants={fadeUp}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3"
            >
              Get Started
            </m.p>
            <m.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center"
            >
              Three steps to connect your AI
            </m.h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Get your API key',
                  body: 'Create a free API key from your Fastlytics settings. Free tier gives you 300 calls/month.',
                  action: (
                    <Link
                      to="/settings"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      Go to Settings
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6h7M6.5 3l3 3-3 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  ),
                },
                {
                  step: '02',
                  title: 'Install the package',
                  body: 'The server runs on Node.js 22+. Install globally or run directly with npx.',
                  action: (
                    <code className="inline-block rounded-lg border border-white/[0.06] bg-[#060608] px-4 py-2 text-[13px] font-mono text-white/50">
                      npm install -g fastlytics-mcp
                    </code>
                  ),
                },
                {
                  step: '03',
                  title: 'Configure your client',
                  body: 'Add the config to your AI client. Follow the guides below for Claude, Cursor, VS Code, and more.',
                  action: null,
                },
              ].map((item) => (
                <m.div
                  key={item.step}
                  variants={fadeUp}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6"
                >
                  <span className="text-[28px] font-semibold tracking-tight text-white/10 leading-none">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-[16px] font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/40">{item.body}</p>
                  {item.action && <div className="mt-4">{item.action}</div>}
                </m.div>
              ))}
            </div>
          </m.div>
        </section>

        {/* ─── Client Setup Guides ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-6xl"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3">
              Setup Guides
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center">
              Choose your platform &amp; transport
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-white/40 text-center max-w-2xl mx-auto">
              Each platform supports two modes:{' '}
              <span className="text-white/60 font-medium">Local</span> (runs the MCP server on your
              machine via stdio) and <span className="text-white/60 font-medium">Remote</span>{' '}
              (connects to the hosted endpoint at <code className="text-white/40">{MCP_URL}</code>).
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {platformConfigs.map((p) => (
                <PlatformCard key={p.id} platform={p} />
              ))}
            </div>

            <p className="mt-8 text-center text-[13px] text-white/30">
              Prefer an interactive setup? Run{' '}
              <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-white/40">
                npx -y fastlytics-mcp
              </code>{' '}
              without an API key set to launch the setup wizard.
            </p>
          </m.div>
        </section>

        {/* ─── Example Prompts ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <m.p
              variants={fadeUp}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3"
            >
              Example Prompts
            </m.p>
            <m.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center"
            >
              Try these with your AI agent
            </m.h2>
            <m.p
              variants={fadeUp}
              className="mt-3 text-[16px] leading-relaxed text-white/40 text-center max-w-2xl mx-auto"
            >
              Once connected, your AI can answer detailed F1 questions using real data.
            </m.p>

            <m.div variants={fadeUp} className="mt-10 grid gap-2 sm:grid-cols-2">
              {examplePrompts.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] px-5 py-4 flex items-start justify-between gap-4 group hover:border-white/[0.10] transition-colors"
                >
                  <p className="text-[14px] text-white/60 group-hover:text-white/80 transition-colors leading-relaxed">
                    &ldquo;{item.query}&rdquo;
                  </p>
                  <code className="shrink-0 rounded bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-white/25 mt-0.5">
                    {item.tool}
                  </code>
                </div>
              ))}
            </m.div>
          </m.div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="py-20 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <m.p
              variants={fadeUp}
              className="text-[13px] font-semibold uppercase tracking-widest text-red-400 text-center mb-3"
            >
              Pricing
            </m.p>
            <m.h2
              variants={fadeUp}
              className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white text-center"
            >
              Free to start, scale when you need more
            </m.h2>

            <m.div variants={fadeUp} className="mt-10 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6">
                <h3 className="text-[15px] font-semibold text-white">Free</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-white">$0</span>
                  <span className="text-[13px] text-white/30">/month</span>
                </div>
                <p className="mt-2 text-[13px] text-white/40">300 MCP API calls per month</p>
                <ul className="mt-4 space-y-2">
                  {[
                    'All 30 tools',
                    '2018-present F1 data',
                    'Local stdio transport',
                    'Setup wizard',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/50">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 7l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-400"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 rounded-bl-xl bg-red-500 px-3 py-1 text-[11px] font-semibold text-white">
                  POPULAR
                </div>
                <h3 className="text-[15px] font-semibold text-white">Pro</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-white">$5.99</span>
                  <span className="text-[13px] text-white/30">/month</span>
                </div>
                <p className="mt-2 text-[13px] text-white/40">3,000 MCP API calls per month</p>
                <ul className="mt-4 space-y-2">
                  {[
                    'Everything in Free',
                    '10x more API calls',
                    '1950-present historical data',
                    'HTTP+SSE remote transport',
                    'Priority support',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/50">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 7l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-400"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-red-600"
                >
                  Upgrade to Pro
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6h7M6.5 3l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </m.div>
          </m.div>
        </section>

        {/* ─── CTA ─── */}
        <section className="pb-24 px-5 lg:px-8">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-6xl"
          >
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-10 sm:p-14 text-center">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                Start building with Fastlytics MCP
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-white/40">
                Get your free API key and connect F1 data to your AI agent in under 2 minutes.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/settings"
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.12)]"
                >
                  Get your API key
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M1 7h12M8 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <a
                  href="https://www.npmjs.com/package/fastlytics-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 text-[14px] font-medium text-white/80 transition-all hover:border-white/20"
                >
                  View on npm
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M1 7h12M8 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </m.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default MCPServer;
