'use client'

import React, { useState } from 'react'
import { Card, Button, Chip } from '../ui'
import { cn } from '@/lib/utils'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'search_limit' | 'export_limit' | 'ai_features' | 'general'
  className?: string
}

interface PricingPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  popular?: boolean
  features: string[]
  limitations?: string[]
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '5 searches per day',
      'Basic scholarship matching',
      'Standard support'
    ],
    limitations: [
      'Limited search results',
      'No CSV export',
      'No AI insights'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    popular: true,
    features: [
      'Unlimited searches',
      'AI-powered insights',
      'CSV export',
      'Priority ranking',
      'Email alerts',
      'Advanced filters',
      'Application tracking',
      'Priority support'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    features: [
      'Everything in Premium',
      '2 months free',
      'Exclusive webinars',
      'Personal consultation',
      'Early access to features'
    ]
  }
]

export default function PremiumModal({
  isOpen,
  onClose,
  trigger = 'general',
  className
}: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium_monthly')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  if (!isOpen) return null

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'search_limit':
        return {
          title: 'Search Limit Reached',
          message: 'You\'ve reached your daily search limit. Upgrade to Premium for unlimited searches.'
        }
      case 'export_limit':
        return {
          title: 'Export Feature Locked',
          message: 'CSV export is a Premium feature. Upgrade to download your scholarship matches.'
        }
      case 'ai_features':
        return {
          title: 'AI Insights Available',
          message: 'Get personalized application strategies and AI-powered recommendations with Premium.'
        }
      default:
        return {
          title: 'Unlock Premium Features',
          message: 'Get unlimited access to all scholarship opportunities and advanced features.'
        }
    }
  }

  const handleSubscribe = async () => {
    if (!email) {
      alert('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          successUrl: `${window.location.origin}/premium/success`,
          cancelUrl: `${window.location.origin}/premium/cancel`
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to Stripe checkout
        window.location.href = data.data.checkoutUrl
      } else {
        throw new Error(data.error || 'Subscription failed')
      }

    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const triggerInfo = getTriggerMessage()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn('w-full max-w-4xl max-h-[90vh] overflow-y-auto', className)}>
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3">
              {triggerInfo.title}
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {triggerInfo.message}
            </p>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                variant={selectedPlan === plan.id ? 'glass-interactive' : 'glass-hover'}
                className={cn(
                  'p-6 cursor-pointer transition-all duration-200 relative',
                  selectedPlan === plan.id && 'ring-2 ring-primary',
                  plan.popular && 'border-primary/50'
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Chip variant="primary" size="sm">
                      Most Popular
                    </Chip>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-white/60">
                      /{plan.interval}
                    </span>
                  </div>
                  
                  {plan.id === 'premium_yearly' && (
                    <div className="text-success text-sm font-medium">
                      Save $20 per year
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-success mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}

                  {plan.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-white/40 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/40 text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>

                {selectedPlan === plan.id && (
                  <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
                )}
              </Card>
            ))}
          </div>

          {/* Email Input and Subscribe Button */}
          {selectedPlan !== 'free' && (
            <div className="space-y-4">
              <div className="max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:bg-white/10 focus:border-primary/50 transition-all duration-200"
                  required
                />
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubscribe}
                  loading={loading}
                  disabled={!email}
                  className="px-8"
                >
                  {loading ? 'Processing...' : `Subscribe to ${pricingPlans.find(p => p.id === selectedPlan)?.name}`}
                </Button>
              </div>

              <div className="text-center text-white/60 text-sm">
                <p>Secure payment powered by Stripe</p>
                <p>Cancel anytime • 30-day money-back guarantee</p>
              </div>
            </div>
          )}

          {/* Feature Comparison */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-xl font-bold text-white text-center mb-6">
              Why Choose Premium?
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">AI-Powered Insights</h4>
                    <p className="text-white/70 text-sm">Get personalized application strategies and match analysis powered by advanced AI.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Unlimited Access</h4>
                    <p className="text-white/70 text-sm">Search as many scholarships as you want without daily limits.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Export & Track</h4>
                    <p className="text-white/70 text-sm">Download your matches as CSV and track your application progress.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Priority Support</h4>
                    <p className="text-white/70 text-sm">Get faster response times and dedicated customer support.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}