import { forwardRef } from 'react'
import { Text as RNText, TextProps } from 'react-native'

export const Text = forwardRef<RNText, TextProps>(
  ({ className, style, ...props }, ref) => (
    <RNText
      ref={ref}
      className={`font-serif ${className ?? ''}`}
      style={style}
      {...props}
    />
  )
)

Text.displayName = 'Text'
