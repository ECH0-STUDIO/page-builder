'use client'

import { useCallback, useEffect, useRef, useState, type ComponentProps, type FocusEventHandler } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Commit = (value: string) => unknown

/**
 * Text field that keeps the caret stable.
 * Puck applies custom-field changes asynchronously, so a controlled input bound
 * to Puck's value snaps back (and jumps the caret) on every keystroke.
 * This holds a local draft, ignores parent echoes while editing, and sends
 * only the latest value once the previous commit finishes.
 */
export function useStableTextField(external: string, commit: Commit) {
  const [value, setValue] = useState(external)
  const valueRef = useRef(external)
  const focusedRef = useRef(false)
  const inflightRef = useRef(false)
  const queuedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commitRef = useRef(commit)
  commitRef.current = commit

  const locked = () => focusedRef.current || inflightRef.current || timerRef.current != null

  useEffect(() => {
    if (locked()) return
    if (external !== valueRef.current) {
      valueRef.current = external
      setValue(external)
    }
  }, [external])

  const flushNow = useCallback(() => {
    if (inflightRef.current) {
      queuedRef.current = true
      return
    }
    const snapshot = valueRef.current
    inflightRef.current = true
    queuedRef.current = false
    Promise.resolve()
      .then(() => commitRef.current(snapshot))
      .finally(() => {
        inflightRef.current = false
        if (queuedRef.current || valueRef.current !== snapshot) {
          queuedRef.current = false
          flushNow()
        }
      })
  }, [])

  const onChange = useCallback((next: string) => {
    valueRef.current = next
    setValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      flushNow()
    }, 80)
  }, [flushNow])

  const onFocus = useCallback(() => {
    focusedRef.current = true
  }, [])

  const onBlur = useCallback(() => {
    focusedRef.current = false
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    flushNow()
  }, [flushNow])

  return { value, onChange, onFocus, onBlur }
}

type StableFieldProps = {
  value: string
  onValueChange: (value: string) => unknown
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
}

export function StableInput({
  value,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & StableFieldProps) {
  const field = useStableTextField(value ?? '', onValueChange)
  return (
    <Input
      {...props}
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
      onFocus={e => {
        field.onFocus()
        onFocus?.(e)
      }}
      onBlur={e => {
        field.onBlur()
        onBlur?.(e)
      }}
    />
  )
}

export function StableTextarea({
  value,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange'> & StableFieldProps) {
  const field = useStableTextField(value ?? '', onValueChange)
  return (
    <Textarea
      {...props}
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
      onFocus={e => {
        field.onFocus()
        onFocus?.(e)
      }}
      onBlur={e => {
        field.onBlur()
        onBlur?.(e)
      }}
    />
  )
}

export function StableNumberInput({
  value,
  onValueChange,
  min,
  max,
  fallback = null,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined
  onValueChange: (value: number | null) => unknown
  min?: number
  max?: number
  fallback?: number | null
}) {
  const external = value == null || Number.isNaN(value) ? '' : String(value)
  const field = useStableTextField(external, (raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return onValueChange(fallback)
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return
    let next = parsed
    if (min != null) next = Math.max(min, next)
    if (max != null) next = Math.min(max, next)
    return onValueChange(next)
  })
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
      onFocus={e => field.onFocus()}
      onBlur={e => field.onBlur()}
    />
  )
}
