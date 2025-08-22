import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: string) => void
  className?: string
  name?: string
  id?: string
}

export default function Select({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option',
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  onChange,
  className,
  name,
  id
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  
  const selectedOption = options.find(option => option.value === selectedValue)

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    onChange?.(optionValue)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value)
        } else {
          setIsOpen(!isOpen)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
        }
        break
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-white mb-2"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={selectRef}>
        <div
          id={selectId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-required={required}
          aria-invalid={!!error}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            error ? 'input-field-error' : 'input-field',
            'cursor-pointer flex items-center justify-between',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <span className={cn(
            'truncate',
            !selectedOption && 'text-white/50'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <svg
            className={cn(
              'w-5 h-5 text-white/50 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className={cn(
              'absolute z-50 w-full mt-1 max-h-60 overflow-auto',
              'glass-card border border-white/20 rounded-xl',
              'shadow-xl shadow-black/30'
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === selectedValue}
                className={cn(
                  'px-4 py-3 cursor-pointer transition-colors duration-200',
                  'hover:bg-white/10 focus:bg-white/10',
                  'first:rounded-t-xl last:rounded-b-xl',
                  option.value === selectedValue && 'bg-primary/20 text-primary',
                  focusedIndex === index && 'bg-white/10',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedValue}
      />
      
      {error && (
        <p className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-white/60">
          {helperText}
        </p>
      )}
    </div>
  )
}