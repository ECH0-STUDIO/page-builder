'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
  maxTags?: number
  formatTag?: (tag: string) => string
  helpText?: React.ReactNode
  /** When set, custom (non-preset) tags can be double-clicked to edit the display label. */
  isPresetTag?: (tag: string) => boolean
  onCustomTagLabelChange?: (tag: string, label: string) => void
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter…',
  className,
  maxTags,
  formatTag = (t) => t,
  helpText,
  isPresetTag,
  onCustomTagLabelChange,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || value.includes(tag)) return
    if (maxTags && value.length >= maxTags) return
    onChange([...value, tag])
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  function startEditingTag(tag: string) {
    if (!onCustomTagLabelChange || isPresetTag?.(tag)) return
    setEditingTag(tag)
    setEditValue(formatTag(tag))
    setTimeout(() => editRef.current?.select(), 0)
  }

  function commitTagEdit() {
    if (!editingTag || !onCustomTagLabelChange) return
    const trimmed = editValue.trim()
    if (trimmed) onCustomTagLabelChange(editingTag, trimmed)
    setEditingTag(null)
    setEditValue('')
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTagEdit()
    } else if (e.key === 'Escape') {
      setEditingTag(null)
      setEditValue('')
    }
  }

  const unusedSuggestions = suggestions.filter(s => !value.includes(s))

  return (
    <div className={cn('space-y-2.5', className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            editingTag === tag ? (
              <Input
                key={tag}
                ref={editRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitTagEdit}
                onKeyDown={handleEditKeyDown}
                className="h-6 w-28 text-xs px-2 py-0"
                autoFocus
              />
            ) : (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium',
                  onCustomTagLabelChange && !isPresetTag?.(tag) && 'cursor-text',
                )}
                onDoubleClick={() => startEditingTag(tag)}
                title={
                  onCustomTagLabelChange && !isPresetTag?.(tag)
                    ? 'Double-click to edit label for this language'
                    : undefined
                }
              >
                {formatTag(tag)}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            )
          ))}
        </div>
      )}

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unusedSuggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="px-2.5 py-0.5 rounded-full text-xs border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
            >
              + {formatTag(tag)}
            </button>
          ))}
        </div>
      )}

      {(!maxTags || value.length < maxTags) && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim()}
            className="px-3 h-8 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 transition-colors flex items-center"
            aria-label="Add tag"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      )}

      {helpText ? (
        <div className="text-[11px] text-muted-foreground">{helpText}</div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd> or{' '}
          <kbd className="px-1 py-0.5 rounded bg-muted text-xs">,</kbd> to add a custom tag
          {onCustomTagLabelChange && (
            <> · double-click a custom tag to rename it for the current language</>
          )}
        </p>
      )}
    </div>
  )
}
