import React from 'react'
import { Card } from '@/components/ui'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-900 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/70">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="p-8 prose prose-invert max-w-none">
          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                upload your CV, complete our questionnaire, or contact us for support.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal information (name, email, nationality)</li>
                <li>Academic information (degree level, field of study, GPA)</li>
                <li>CV content and extracted data</li>
                <li>Search queries and preferences</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve our scholarship matching services</li>
                <li>To personalize your experience and recommendations</li>
                <li>To communicate with you about scholarships and updates</li>
                <li>To analyze usage patterns and improve our platform</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <p className="mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy.
              </p>
              <p>
                We may share information with trusted service providers who assist us in operating 
                our platform, conducting our business, or serving our users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                secure servers, and regular security audits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@scholarshipplatform.com" className="text-primary hover:underline">
                  privacy@scholarshipplatform.com
                </a>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}