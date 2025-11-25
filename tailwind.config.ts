
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// F1 team colors
				f1: {
					ferrari: '#ff2800',
					mercedes: '#6c779f',
					mclaren: '#ff8700',
					redbull: '#1e41ff',
					astonmartin: '#00594f',
					alpine: '#0090ff',
					williams: '#0093d0',
					haas: '#ffffff',
					alfaromeo: '#900000',
					alphatauri: '#4e7c9b',
				},
				// Tire compounds
				tire: {
					soft: '#ff2800',
					medium: '#ffcc00',
					hard: '#ffffff',
					intermediate: '#43b02a',
					wet: '#0067ad',
				}
			},
			fontFamily: {
				sans: ['Space Grotesk', 'Inter', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 40, 0, 0)' },
					'50%': { boxShadow: '0 0 15px 3px rgba(255, 40, 0, 0.6)' },
				},
				'telemetry-in': {
					'0%': { transform: 'scaleX(0)', opacity: '0', transformOrigin: 'left' },
					'100%': { transform: 'scaleX(1)', opacity: '1', transformOrigin: 'left' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'loading-track': {
					'0%': { strokeDashoffset: '100' },
					'100%': { strokeDashoffset: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s infinite',
				'telemetry-in': 'telemetry-in 0.6s ease-out forwards',
				'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
				'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'loading-track': 'loading-track 2s ease-in-out forwards'
			},
			backgroundImage: {
				'carbon-fiber': 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23151515\' fill-opacity=\'0.7\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 20L20 0h10L0 30zM30 0L0 30v10L40 0zM0 0h10L0 10z\'/%3E%3C/g%3E%3C/svg%3E")',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
