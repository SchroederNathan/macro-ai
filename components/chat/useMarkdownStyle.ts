import { useMemo } from 'react'
import { useColorScheme } from 'react-native'
import type { MarkdownStyle } from 'react-native-enriched-markdown'

export function useMarkdownStyle(): MarkdownStyle {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return useMemo(() => ({
    text: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 16,
      lineHeight: 24,

    },
    paragraph: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 16,
      lineHeight: 24,
    },
    h1: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 28,
      fontWeight: 'bold',

    },
    h2: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 24,
      fontWeight: 'bold',

    },
    h3: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 32

    },
    h4: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 18,
      fontWeight: 'bold',

    },
    h5: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 16,
      fontWeight: 'bold',

    },
    h6: {
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontSize: 14,
      fontWeight: 'bold',

    },
    strong: {
      color: isDark ? '#fafafa' : '#0a0a0a',
    },
    em: {
      color: isDark ? '#fafafa' : '#0a0a0a',
    },
    link: {
      color: isDark ? '#60a5fa' : '#2563eb',
      underline: true,
    },
    code: {
      color: isDark ? '#f472b6' : '#db2777',
      backgroundColor: isDark ? '#27272a' : '#f4f4f5',
      borderColor: isDark ? '#3f3f46' : '#e4e4e7',
    },
    codeBlock: {
      backgroundColor: isDark ? '#27272a' : '#f4f4f5',
      color: isDark ? '#fafafa' : '#0a0a0a',
      fontFamily: 'monospace',
      fontSize: 14,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#3f3f46' : '#e4e4e7',

    },
    blockquote: {
      borderWidth: 4,
      borderColor: isDark ? '#60a5fa' : '#2563eb',
      backgroundColor: isDark ? '#18181b' : '#f8fafc',

      color: isDark ? '#a1a1aa' : '#71717a',
    },
    list: {
      color: isDark ? '#fafafa' : '#0a0a0a',

      bulletColor: isDark ? '#fafafa' : '#0a0a0a',
    },
  }), [isDark])
}
