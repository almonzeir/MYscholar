'use client'

import React, { useState, useCallback } from 'react'
import { Button, Input, Card, Chip, Progress } from '../ui'
import { ErrorBoundary, useError } from '@/components/error'
import { cn } from '@/lib/utils'

interface QuestionStep {
  id: string
  title: string
  description: string
  type: 'select' | 'multiselect' | 'input' | 'slider' | 'chips'
  required: boolean
  options?: Array<{ value: string; label: string; description?: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface UserProfile {
  nationality: string
  degreeTarget: string
  fieldKeywords: string[]
  specialStatus: string[]
  gpa?: number
  languageTests?: Record<string, any>
  publications?: number
  workExperience?: number
  constraints: Record<string, any>
}

interface GuidedQuestionnaireProps {
  onComplete: (profile: UserProfile) => void
  onStepChange?: (step: number, total: number) => void
  className?: string
}

const questionSteps: QuestionStep[] = [
  {
    id: 'nationality',
    title: 'What is your nationality?',
    description: 'This helps us find scholarships available to students from your country.',
    type: 'select',
    required: true,
    options: [
      { value: 'US', label: 'United States' },
      { value: 'UK', label: 'United Kingdom' },
      { value: 'CA', label: 'Canada' },
      { value: 'AU', label: 'Australia' },
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'IN', label: 'India' },
      { value: 'CN', label: 'China' },
      { value: 'JP', label: 'Japan' },
      { value: 'BR', label: 'Brazil' },
      { value: 'MX', label: 'Mexico' },
      { value: 'NG', label: 'Nigeria' },
      { value: 'ZA', label: 'South Africa' },
      { value: 'EG', label: 'Egypt' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'degreeTarget',
    title: 'What degree level are you pursuing?',
    description: 'Select the degree level you want to apply for.',
    type: 'select',
    required: true,
    options: [
      { value: 'bachelor', label: 'Bachelor\'s Degree', description: 'Undergraduate program (3-4 years)' },
      { value: 'master', label: 'Master\'s Degree', description: 'Graduate program (1-2 years)' },
      { value: 'phd', label: 'PhD/Doctorate', description: 'Doctoral research program (3-5 years)' },
      { value: 'postdoc', label: 'Postdoctoral', description: 'Post-doctoral research position' }
    ]
  },
  {
    id: 'fieldKeywords',
    title: 'What is your field of study?',
    description: 'Select all fields that match your academic interests.',
    type: 'multiselect',
    required: true,
    options: [
      { value: 'computer science', label: 'Computer Science' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'medicine', label: 'Medicine & Health Sciences' },
      { value: 'business', label: 'Business & Management' },
      { value: 'economics', label: 'Economics & Finance' },
      { value: 'law', label: 'Law & Legal Studies' },
      { value: 'arts', label: 'Arts & Humanities' },
      { value: 'social sciences', label: 'Social Sciences' },
      { value: 'natural sciences', label: 'Natural Sciences' },
      { value: 'mathematics', label: 'Mathematics & Statistics' },
      { value: 'physics', label: 'Physics' },
      { value: 'chemistry', label: 'Chemistry' },
      { value: 'biology', label: 'Biology & Life Sciences' },
      { value: 'psychology', label: 'Psychology' },
      { value: 'education', label: 'Education' },
      { value: 'journalism', label: 'Journalism & Media' },
      { value: 'architecture', label: 'Architecture & Design' },
      { value: 'environmental science', label: 'Environmental Science' }
    ]
  },
  {
    id: 'gpa',
    title: 'What is your GPA?',
    description: 'Enter your GPA on a 4.0 scale (optional but helps with matching).',
    type: 'slider',
    required: false,
    validation: { min: 0, max: 4.0 }
  },
  {
    id: 'specialStatus',
    title: 'Do any of these apply to you?',
    description: 'Special status can qualify you for additional scholarship opportunities.',
    type: 'chips',
    required: false,
    options: [
      { value: 'first-generation', label: 'First-generation college student' },
      { value: 'minority', label: 'Underrepresented minority' },
      { value: 'disability', label: 'Person with disability' },
      { value: 'veteran', label: 'Military veteran' },
      { value: 'refugee', label: 'Refugee or asylum seeker' },
      { value: 'low-income', label: 'Low-income background' },
      { value: 'rural', label: 'Rural background' },
      { value: 'female-stem', label: 'Female in STEM' }
    ]
  },
  {
    id: 'languageTests',
    title: 'Language Test Scores',
    description: 'Do you have any standardized test scores? (Optional)',
    type: 'input',
    required: false
  },
  {
    id: 'experience',
    title: 'Academic & Professional Background',
    description: 'Tell us about your research and work experience.',
    type: 'input',
    required: false
  }
]

export default function GuidedQuestionnaire({
  onComplete,
  onStepChange,
  className
}: GuidedQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const { reportError } = useError()

  const currentQuestion = questionSteps[currentStep]
  const progress = ((currentStep + 1) / questionSteps.length) * 100

  const validateAnswer = useCallback((question: QuestionStep, value: any): string | null => {
    if (question.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return 'This field is required'
    }

    if (question.validation) {
      if (question.validation.min !== undefined && value < question.validation.min) {
        return `Minimum value is ${question.validation.min}`
      }
      if (question.validation.max !== undefined && value > question.validation.max) {
        return `Maximum value is ${question.validation.max}`
      }
      if (question.validation.pattern && !new RegExp(question.validation.pattern).test(value)) {
        return 'Invalid format'
      }
    }

    return null
  }, [])

  const handleAnswer = useCallback((value: any) => {
    const error = validateAnswer(currentQuestion, value)
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }))

    setErrors(prev => ({
      ...prev,
      [currentQuestion.id]: error || ''
    }))
  }, [currentQuestion, validateAnswer])

  const handleNext = useCallback(() => {
    try {
      const currentAnswer = answers[currentQuestion.id]
      const error = validateAnswer(currentQuestion, currentAnswer)

      if (error) {
        setErrors(prev => ({
          ...prev,
          [currentQuestion.id]: error
        }))
        return
      }

      if (currentStep < questionSteps.length - 1) {
        const nextStep = currentStep + 1
        setCurrentStep(nextStep)
        onStepChange?.(nextStep + 1, questionSteps.length)
      } else {
        // Complete questionnaire
        const profile: UserProfile = {
          nationality: answers.nationality || '',
          degreeTarget: answers.degreeTarget || 'master',
          fieldKeywords: answers.fieldKeywords || [],
          specialStatus: answers.specialStatus || [],
          gpa: answers.gpa,
          languageTests: answers.languageTests ? JSON.parse(answers.languageTests) : undefined,
          publications: answers.experience ? parseInt(answers.experience.split(' ')[0]) || 0 : 0,
          workExperience: answers.experience ? parseInt(answers.experience.split(' ')[1]) || 0 : 0,
          constraints: {}
        }

        onComplete(profile)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to proceed to next step'
      setError(errorMessage)
      
      reportError(err instanceof Error ? err : new Error(errorMessage), {
        component: 'GuidedQuestionnaire',
        action: 'handleNext',
        currentStep,
        questionId: currentQuestion.id
      })
    }
  }, [currentStep, currentQuestion, answers, validateAnswer, onComplete, onStepChange, reportError])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      onStepChange?.(prevStep + 1, questionSteps.length)
    }
  }, [currentStep, onStepChange])

  const renderQuestionInput = () => {
    const currentAnswer = answers[currentQuestion.id]
    const error = errors[currentQuestion.id]

    switch (currentQuestion.type) {
      case 'select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <Card
                key={option.value}
                variant={currentAnswer === option.value ? 'glass-interactive' : 'glass-hover'}
                className={cn(
                  'p-4 cursor-pointer transition-all duration-200',
                  currentAnswer === option.value && 'ring-2 ring-primary'
                )}
                onClick={() => handleAnswer(option.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mt-0.5 transition-colors',
                    currentAnswer === option.value 
                      ? 'bg-primary border-primary' 
                      : 'border-white/30'
                  )} />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{option.label}</h4>
                    {option.description && (
                      <p className="text-sm text-white/60 mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )

      case 'multiselect':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => {
              const isSelected = currentAnswer?.includes(option.value)
              return (
                <Card
                  key={option.value}
                  variant="glass-hover"
                  className={cn(
                    'p-4 cursor-pointer transition-all duration-200',
                    isSelected && 'ring-2 ring-primary'
                  )}
                  onClick={() => {
                    const current = currentAnswer || []
                    const updated = isSelected
                      ? current.filter((v: string) => v !== option.value)
                      : [...current, option.value]
                    handleAnswer(updated)
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      'w-4 h-4 rounded border-2 mt-0.5 transition-colors flex items-center justify-center',
                      isSelected 
                        ? 'bg-primary border-primary' 
                        : 'border-white/30'
                    )}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{option.label}</h4>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )

      case 'slider':
        return (
          <div className="space-y-4">
            <div className="px-4">
              <input
                type="range"
                min={currentQuestion.validation?.min || 0}
                max={currentQuestion.validation?.max || 4}
                step="0.1"
                value={currentAnswer || 0}
                onChange={(e) => handleAnswer(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-white/60 mt-2">
                <span>{currentQuestion.validation?.min || 0}</span>
                <span className="font-medium text-primary">
                  {currentAnswer ? currentAnswer.toFixed(1) : '0.0'}
                </span>
                <span>{currentQuestion.validation?.max || 4}</span>
              </div>
            </div>
          </div>
        )

      case 'chips':
        return (
          <div className="flex flex-wrap gap-2">
            {currentQuestion.options?.map((option) => {
              const isSelected = currentAnswer?.includes(option.value)
              return (
                <Chip
                  key={option.value}
                  variant={isSelected ? 'primary' : 'default'}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    isSelected && 'ring-2 ring-primary/50'
                  )}
                  onClick={() => {
                    const current = currentAnswer || []
                    const updated = isSelected
                      ? current.filter((v: string) => v !== option.value)
                      : [...current, option.value]
                    handleAnswer(updated)
                  }}
                >
                  {option.label}
                </Chip>
              )
            })}
          </div>
        )

      case 'input':
        return (
          <div className="space-y-4">
            {currentQuestion.id === 'languageTests' ? (
              <div className="space-y-3">
                <Input
                  placeholder="e.g., TOEFL: 105, IELTS: 7.5, GRE: 325"
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  error={error}
                />
                <p className="text-sm text-white/60">
                  Enter your test scores in the format: Test Name: Score
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="e.g., 2 publications, 12 months work experience"
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  error={error}
                />
                <p className="text-sm text-white/60">
                  Briefly describe your research publications and work experience
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ErrorBoundary
      level="feature"
    >
      <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">
            Step {currentStep + 1} of {questionSteps.length}
          </span>
          <span className="text-sm text-white/60">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card className="p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-3">
            {currentQuestion.title}
          </h2>
          <p className="text-white/70">
            {currentQuestion.description}
          </p>
        </div>

        {renderQuestionInput()}

        {errors[currentQuestion.id] && (
          <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-error text-sm">{errors[currentQuestion.id]}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Error</p>
                <p className="text-xs text-white/70">{error}</p>
              </div>
              <Button 
                onClick={() => setError(null)} 
                variant="ghost" 
                size="sm"
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
        >
          {currentStep === questionSteps.length - 1 ? 'Find Scholarships' : 'Next'}
        </Button>
      </div>
      </div>
    </ErrorBoundary>
  )
}