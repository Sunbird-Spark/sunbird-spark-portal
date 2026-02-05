import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx,css}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "87.5rem",
      },
    },
    extend: {
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
        sans: ['Noto Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Sunbird custom colors
        sunbird: {
          "dark-blue": "hsl(var(--sunbird-dark-blue))",
          yellow: "hsl(var(--sunbird-yellow))",
          "light-blue": "hsl(var(--sunbird-light-blue))",
          "medium-blue": "hsl(var(--sunbird-medium-blue))",
          ginger: "hsl(var(--sunbird-ginger))",
          brick: "hsl(var(--sunbird-brick))",
          sunflower: "hsl(var(--sunbird-sunflower))",
          ivory: "hsl(var(--sunbird-ivory))",
          ink: "hsl(var(--sunbird-ink))",
          wave: "hsl(var(--sunbird-wave))",
          leaf: "hsl(var(--sunbird-leaf))",
          forest: "hsl(var(--sunbird-forest))",
          moss: "hsl(var(--sunbird-moss))",
          jamun: "hsl(var(--sunbird-jamun))",
          lavender: "hsl(var(--sunbird-lavender))",
          "theme-teal": "hsl(var(--sunbird-theme-teal))",
          charcoal: "hsl(var(--sunbird-charcoal))",
          obsidian: "hsl(var(--sunbird-obsidian))",
          "gray-75": "hsl(var(--sunbird-gray-75))",
          "gray-82": "hsl(var(--sunbird-gray-82))",
          "gray-b2": "hsl(var(--sunbird-gray-b2))",
          "gray-4a": "hsl(var(--sunbird-gray-4a))",
          "success-green": "hsl(var(--sunbird-success-green))",
          "orange-light": "hsl(var(--sunbird-orange-light))",
          "base-white": "hsl(var(--sunbird-white))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 0.125rem)",
        sm: "calc(var(--radius) - 0.25rem)",
        xs: "0.625rem",
        xxs: "0.25rem",
        xl: "calc(var(--radius) + 0.25rem)",
        "2xl": "calc(var(--radius) + 0.5rem)",
      },
      spacing: {
        '13': '3.25rem',
        '18': '4.5rem',
        '100': '25rem',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(0.625rem)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
