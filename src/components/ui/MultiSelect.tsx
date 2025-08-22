import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import Chip from './Chip'

interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  defaultValue?: string[]
  placeholder?: string
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  onChange?: (values: string[]) => void
  className?: string
  maxSelections?: number
  searchable?: boolean
}

export default function MultiSelect({
  options,
  value,
  defaultValue = [],
  placeholder = 'Select options',
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  onChange,
  className,
  maxSelections,
  searchable = false
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value || defaultValue)
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return
    
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : maxSelections && selectedValues.length >= maxSelections
        ? selectedValues
        : [...selectedValues, optionValue]
    
    setSelectedValues(newValues)
    onChange?.(newValues)
  }

  const handleRemoveValue = (valueToRemove: string) => {
    const newValues = selectedValues.filter(v => v !== valueToRemove)
    setSelectedValues(newValues)
    onChange?.(newValues)
  }

  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const option = options.find(opt => opt.value === value)
      return option ? option.label : value
    })
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      {/* Selected Values Display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {getSelectedLabels().map((label, index) => (
            <Chip
              key={selectedValues[index]}
              variant="primary"
              size="sm"
              removable
              onRemove={() => handleRemoveValue(selectedValues[index])}
            >
              {label}
            </Chip>
          ))}
        </div>
      )}

      {/* Search Input */}
      {searchable && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field text-sm"
            disabled={disabled}
          />
        </div>
      )}

      {/* Options Grid */}
      <div className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2',
        'p-4 glass-card rounded-xl',
        error && 'border-error/50'
      )}>
        {filteredOptions.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          const isDisabled = option.disabled || disabled || 
            (maxSelections && !isSelected && selectedValues.length >= maxSelections)
          
          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handleToggleOption(option.value)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'border border-white/20 hover:border-white/40',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-900',
                isSelected 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25' 
                  : 'bg-white/5 text-white/90 hover:bg-white/10',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-white/5'
              )}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {maxSelections && (
        <p className="mt-2 text-xs text-white/60">
          {selectedValues.length} of {maxSelections} selected
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-white/60">
          {helperText}
        </p>
      )}
    </div>
  )
}