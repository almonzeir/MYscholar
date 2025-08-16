import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Subscription request schema
const SubscriptionRequestSchema = z.object({
  plan: z.enum(['premium_monthly', 'premium_yearly']),
  email: z.string().email(),
  userId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

// Mock Stripe integration (in production, use actual Stripe SDK)
interface StripeSession {
  id: string
  url: string
  status: string
}

async function createStripeSession(data: {
  plan: string
  email: string
  successUrl?: string
  cancelUrl?: string
}): Promise<StripeSession> {
  // In a real implementation, this would use Stripe SDK:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.checkout.sessions.create({...})
  
  // Plans configuration for reference
  // const plans = {
  //   premium_monthly: {
  //     price: 9.99,
  //     interval: 'month'
  //   },
  //   premium_yearly: {
  //     price: 99.99,
  //     interval: 'year'
  //   }
  // }

  // Mock Stripe session
  return {
    id: `cs_${Math.random().toString(36).substr(2, 9)}`,
    url: `https://checkout.stripe.com/pay/mock_session_${data.plan}`,
    status: 'open'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = SubscriptionRequestSchema.parse(body)
    
    const { plan, email, successUrl, cancelUrl } = validatedData

    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate plan type
    const validPlans = ['premium_monthly', 'premium_yearly']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be one of: ' + validPlans.join(', ') },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await createStripeSession({
      plan,
      email,
      successUrl: successUrl || `${process.env.NEXTAUTH_URL}/premium/success`,
      cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/premium/cancel`
    })

    // Validate session creation
    if (!session || !session.id || !session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
        plan,
        email
      }
    })

  } catch (error) {
    logger.error('Subscription creation error', error instanceof Error ? error : new Error(String(error)))
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid subscription data',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes('stripe')) {
      return NextResponse.json(
        { error: 'Payment processing error' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const email = url.searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      )
    }

    // In a real implementation, query the database for subscription status
    // const subscription = await getUserSubscription(userId || email)

    // Mock subscription data
    const mockSubscription = {
      id: 'sub_mock123',
      userId: userId || 'user_mock',
      email: email || 'user@example.com',
      plan: 'premium_monthly',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      features: {
        unlimitedSearches: true,
        csvExport: true,
        priorityRanking: true,
        aiInsights: true,
        emailAlerts: true
      },
      usage: {
        searchesThisMonth: 45,
        exportsThisMonth: 3
      }
    }

    return NextResponse.json({
      success: true,
      data: mockSubscription
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}