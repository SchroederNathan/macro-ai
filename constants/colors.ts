export const colors = {
  light: {
    background: '#fafafa',
    foreground: '#0a0a0a',
    primary: '#2563eb',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    card: '#ffffff',
    border: '#e4e4e7',
    userBubble: '#2563eb',
    chat: '#f0f0f0',
    // Markdown specific
    link: '#2563eb',
    codeText: '#db2777',
    codeBackground: '#f4f4f5',
    codeBorder: '#e4e4e7',
    blockquoteBackground: '#f8fafc',
    blockquoteBorder: '#2563eb',
    blockquoteText: '#71717a',
    bulletColor: '#2563eb',
  },
  dark: {
    background: '#262626',
    foreground: '#fafafa',
    primary: '#f97316',
    primaryBorder: '#fdba74',
    muted: '#78716c',
    mutedForeground: '#404040',
    card: '#2f2f2f',
    border: '#404040',
    userBubble: '#ea580c',
    chat: '#343434',
    // Markdown specific
    link: '#60a5fa',
    codeText: '#f472b6',
    codeBackground: '#27272a',
    codeBorder: '#3f3f46',
    blockquoteBackground: '#18181b',
    blockquoteBorder: '#60a5fa',
    blockquoteText: '#a1a1aa',
    bulletColor: '#60a5fa',
  },
} as const

export type ColorScheme = keyof typeof colors
export type Colors = typeof colors.light
