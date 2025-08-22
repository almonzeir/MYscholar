import React from 'react'
import { cn } from '@/lib/utils'
import Chip from './Chip'
import { UserProfile } from '@/types/profile'

interface ProfilePill {
  label: string
  value: string
  type: keyof UserProfile
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

interface ProfilePillsProps {
  profile: UserProfile
  onRemove: (type: keyof UserProfile, value: string) => void
  className?: string
}

export default function ProfilePills({ profile, onRemove, className }: ProfilePillsProps) {
  const pills: ProfilePill[] = []

  // Generate pills from profile data
  if (profile.degreeTarget) {
    pills.push({ 
      label: 'Degree', 
      value: profile.degreeTarget, 
      type: 'degreeTarget',
      variant: 'primary'
    })
  }

  profile.fields.forEach(field => {
    pills.push({ 
      label: 'Field', 
      value: field, 
      type: 'fields',
      variant: 'success'
    })
  })

  if (profile.nationality) {
    pills.push({ 
      label: 'Nationality', 
      value: profile.nationality, 
      type: 'nationality'
    })
  }

  if (profile.currentCountryOfResidence) {
    pills.push({ 
      label: 'Residence', 
      value: profile.currentCountryOfResidence, 
      type: 'currentCountryOfResidence'
    })
  }

  profile.languageProofs.forEach(proof => {
    pills.push({ 
      label: 'Language', 
      value: proof, 
      type: 'languageProofs',
      variant: 'success'
    })
  })

  if (profile.gpaBand) {
    pills.push({ 
      label: 'GPA', 
      value: profile.gpaBand, 
      type: 'gpaBand',
      variant: 'warning'
    })
  }

  if (profile.graduationYear) {
    pills.push({ 
      label: 'Graduation', 
      value: profile.graduationYear, 
      type: 'graduationYear'
    })
  }

  if (profile.workResearchYears) {
    let displayValue = '';
    switch (profile.workResearchYears) {
      case '0': displayValue = 'No experience'; break;
      case '1': displayValue = '1 year'; break;
      case '2-3': displayValue = '2-3 years'; break;
      case '4+': displayValue = '4+ years'; break;
      default: displayValue = profile.workResearchYears;
    }
    pills.push({ 
      label: 'Experience', 
      value: displayValue, 
      type: 'workResearchYears'
    });
  }

  profile.specialStatuses.forEach(status => {
    pills.push({ 
      label: 'Status', 
      value: status, 
      type: 'specialStatuses',
      variant: 'warning'
    })
  })

  if (profile.deadlineWindow && profile.deadlineWindow !== 'Any') {
    pills.push({ 
      label: 'Deadline', 
      value: `≤${profile.deadlineWindow} days`, 
      type: 'deadlineWindow',
      variant: 'error'
    })
  }

  if (profile.engineeringSubfield) {
    pills.push({ 
      label: 'Subfield', 
      value: profile.engineeringSubfield, 
      type: 'engineeringSubfield',
      variant: 'success'
    })
  }

  if (profile.fundingTolerance) {
    pills.push({ 
      label: 'Funding', 
      value: profile.fundingTolerance, 
      type: 'fundingTolerance',
      variant: 'primary'
    })
  }

  if (pills.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white/90">Your Search Criteria</h4>
        <span className="text-xs text-white/60">{pills.length} criteria</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {pills.map((pill, index) => (
          <Chip
            key={`${pill.type}-${pill.value}-${index}`}
            variant={pill.variant || 'default'}
            size="sm"
            removable
            onRemove={() => onRemove(pill.type, pill.value)}
            className="transition-all duration-200 hover:scale-105"
          >
            <span className="font-medium">{pill.label}:</span> {pill.value}
          </Chip>
        ))}
      </div>
    </div>
  )
}