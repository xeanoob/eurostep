'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function AnimatedCounter({
  value,
  duration = 1,
  className = '',
}: {
  value: number
  duration?: number
  className?: string
}) {
  const [hasMounted, setHasMounted] = useState(false)
  
  // Use a spring for fluid, bouncy counting
  const springValue = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  })

  useEffect(() => {
    setHasMounted(true)
    springValue.set(value)
  }, [value, springValue])

  // Transform the spring value to a rounded integer string
  const displayValue = useTransform(springValue, (current) =>
    Math.round(current).toString()
  )

  if (!hasMounted) {
    return <span className={className}>{value}</span>
  }

  return <motion.span className={className}>{displayValue}</motion.span>
}
