import { Canvas, RoundedRect } from '@shopify/react-native-skia'
import { useEffect, useRef, useState } from 'react'
import { type ViewStyle } from 'react-native'

const BAR_COUNT = 32
const BAR_WIDTH = 3
const BAR_GAP = 2
const BAR_RADIUS = 1.5
const MIN_HEIGHT = 2
const MAX_HEIGHT_RATIO = 0.85

type AudioWaveformProps = {
  analyserNode: any | null
  isActive: boolean
  color?: string
  style?: ViewStyle
  width: number
  height: number
}

export function AudioWaveform({
  analyserNode,
  isActive,
  color = '#3b82f6',
  style,
  width,
  height,
}: AudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(() => new Array(BAR_COUNT).fill(MIN_HEIGHT))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive || !analyserNode) {
      setBars(new Array(BAR_COUNT).fill(MIN_HEIGHT))
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const update = () => {
      analyserNode.getByteFrequencyData(dataArray)

      const maxBarHeight = height * MAX_HEIGHT_RATIO
      const step = Math.max(1, Math.floor(bufferLength / BAR_COUNT))
      const newHeights: number[] = []

      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        const count = Math.min(step, bufferLength - i * step)
        for (let j = 0; j < count; j++) {
          sum += dataArray[i * step + j]
        }
        const avg = count > 0 ? sum / count / 255 : 0
        newHeights.push(Math.max(MIN_HEIGHT, avg * maxBarHeight))
      }

      setBars(newHeights)
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isActive, analyserNode, height])

  const totalBarWidth = BAR_WIDTH + BAR_GAP
  const totalWidth = BAR_COUNT * totalBarWidth - BAR_GAP
  const startX = (width - totalWidth) / 2

  return (
    <Canvas style={[{ width, height }, style]}>
      {bars.map((barHeight, i) => {
        const x = startX + i * totalBarWidth
        const y = (height - barHeight) / 2
        return (
          <RoundedRect
            key={i}
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={barHeight}
            r={BAR_RADIUS}
            color={color}
          />
        )
      })}
    </Canvas>
  )
}
