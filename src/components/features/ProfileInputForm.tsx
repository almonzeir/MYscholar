import React, { useState } from 'react'
import { UserProfile } from '@/types/profile'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import MultiSelect from '@/components/ui/MultiSelect'
import FormSection from '@/components/ui/FormSection'

import ProfilePills from '@/components/ui/ProfilePills' // Import ProfilePills

interface ProfileInputFormProps {
  profile: UserProfile; // Add profile as a prop
  onProfileChange: (profile: UserProfile) => void
  onSearch: () => void
}

export function ProfileInputForm({ profile, onProfileChange, onSearch }: ProfileInputFormProps) { // Destructure profile from props
  // Remove local profile state, as it's now passed as a prop
  // const [profile, setProfile] = useState<UserProfile>({ ... });

  const handleInputChange = (name: keyof UserProfile, value: string | string[]) => {
    const newProfile = { ...profile, [name]: value } // Use prop profile
    // setProfile(newProfile) // No longer needed
    onProfileChange(newProfile)
  }

  const handleRemovePill = (type: keyof UserProfile, valueToRemove: string) => {
    const newProfile = { ...profile }; // Use prop profile
    if (Array.isArray(newProfile[type])) {
      (newProfile[type] as string[]) = (newProfile[type] as string[]).filter(item => item !== valueToRemove);
    } else {
      // For single-select fields, reset to default empty value
      if (type === 'degreeTarget' || type === 'gpaBand' || type === 'graduationYear' || 
          type === 'workResearchYears' || type === 'deadlineWindow' || 
          type === 'engineeringSubfield' || type === 'fundingTolerance') {
        (newProfile[type] as string) = '';
      } else if (type === 'nationality' || type === 'currentCountryOfResidence') {
        (newProfile[type] as string) = '';
      }
    }
    onProfileChange(newProfile); // Notify parent of change
  };

  // Generate years for graduation dropdown
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString()
  }))

  // Option data
  const degreeOptions = [
    { value: 'Bachelor', label: 'Bachelor\'s Degree' },
    { value: 'Master', label: 'Master\'s Degree' },
    { value: 'PhD', label: 'PhD/Doctorate' }
  ]

  const fieldOptions = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Medicine', label: 'Medicine' },
    { value: 'Arts', label: 'Arts & Humanities' },
    { value: 'Business', label: 'Business & Management' },
    { value: 'Sciences', label: 'Natural Sciences' },
    { value: 'Social Sciences', label: 'Social Sciences' },
    { value: 'Law', label: 'Law' }
  ]

  const languageOptions = [
    { value: 'IELTS', label: 'IELTS' },
    { value: 'TOEFL', label: 'TOEFL' },
    { value: 'Duolingo', label: 'Duolingo English Test' },
    { value: 'Cambridge', label: 'Cambridge English' },
    { value: 'PTE', label: 'PTE Academic' },
    { value: 'None', label: 'No English Test' }
  ]

  const gpaOptions = [
    { value: '>=90', label: '90% and above (A+/A)' },
    { value: '80-89', label: '80-89% (B+/B)' },
    { value: '70-79', label: '70-79% (C+/C)' },
    { value: '<70', label: 'Below 70%' }
  ]

  const workYearsOptions = [
    { value: '0', label: 'No work experience' },
    { value: '1', label: '1 year' },
    { value: '2-3', label: '2-3 years' },
    { value: '4+', label: '4+ years' }
  ]

  const specialStatusOptions = [
    { value: 'Refugee', label: 'Refugee Status' },
    { value: 'Low-income', label: 'Low-income Background' },
    { value: 'Disability', label: 'Disability' },
    { value: 'Women in STEM', label: 'Women in STEM' },
    { value: 'First-gen', label: 'First-generation Student' },
    { value: 'Minority', label: 'Ethnic/Racial Minority' }
  ]

  const deadlineOptions = [
    { value: 'Any', label: 'Any deadline' },
    { value: '<=30', label: 'Within 30 days' },
    { value: '<=60', label: 'Within 60 days' },
    { value: '<=120', label: 'Within 120 days' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Find Your Perfect Scholarship</h2>
        <p className="text-white/70">Tell us about yourself to get personalized recommendations</p>
      </div>

      {/* Profile Pills - Show selected criteria */}
      <ProfilePills 
        profile={profile} 
        onRemove={handleRemovePill}
        className="glass-card p-4"
      />

      <FormSection 
        title="Academic Information" 
        description="Your educational background and goals"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Target Degree Level"
            options={degreeOptions}
            value={profile.degreeTarget}
            onChange={(value) => handleInputChange('degreeTarget', value)}
            placeholder="Select degree level"
            required
          />

          <Select
            label="Expected Graduation Year"
            options={years}
            value={profile.graduationYear}
            onChange={(value) => handleInputChange('graduationYear', value)}
            placeholder="Select year"
          />
        </div>

        <MultiSelect
          label="Fields of Study"
          options={fieldOptions}
          value={profile.fields}
          onChange={(values) => handleInputChange('fields', values)}
          placeholder="Select your fields of interest"
          maxSelections={3}
          helperText="Choose up to 3 fields that best match your interests"
        />

        <Select
          label="GPA/Grade Range"
          options={gpaOptions}
          value={profile.gpaBand}
          onChange={(value) => handleInputChange('gpaBand', value)}
          placeholder="Select your grade range"
          helperText="Choose the range that best represents your academic performance"
        />
      </FormSection>

      <FormSection 
        title="Personal Information" 
        description="Your background and current situation"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nationality"
            value={profile.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            placeholder="e.g., Indian, American, German"
            helperText="Your country of citizenship"
          />

          <Input
            label="Current Country of Residence"
            value={profile.currentCountryOfResidence}
            onChange={(e) => handleInputChange('currentCountryOfResidence', e.target.value)}
            placeholder="e.g., Canada, United Kingdom"
            helperText="Where you currently live"
          />
        </div>

        <MultiSelect
          label="Language Proficiency Tests"
          options={languageOptions}
          value={profile.languageProofs}
          onChange={(values) => handleInputChange('languageProofs', values)}
          placeholder="Select your language certifications"
          helperText="Choose all language tests you have taken or plan to take"
        />

        <Select
          label="Work/Research Experience"
          options={workYearsOptions}
          value={profile.workResearchYears}
          onChange={(value) => handleInputChange('workResearchYears', value)}
          placeholder="Select experience level"
          helperText="Total years of relevant work or research experience"
        />
      </FormSection>

      <FormSection 
        title="Special Circumstances" 
        description="Additional factors that may affect eligibility"
        collapsible
        defaultExpanded={false}
      >
        <MultiSelect
          label="Special Status (Optional)"
          options={specialStatusOptions}
          value={profile.specialStatuses}
          onChange={(values) => handleInputChange('specialStatuses', values)}
          placeholder="Select any applicable statuses"
          helperText="These may qualify you for additional scholarships"
        />

        <Select
          label="Application Deadline Preference"
          options={deadlineOptions}
          value={profile.deadlineWindow}
          onChange={(value) => handleInputChange('deadlineWindow', value)}
          placeholder="Select deadline preference"
          helperText="Filter scholarships by application deadline"
        />
      </FormSection>

      <div className="flex justify-center pt-4">
        <Button 
          onClick={onSearch}
          size="lg"
          className="px-12"
        >
          🔍 Find My Scholarships
        </Button>
      </div>
    </div>
  )
}