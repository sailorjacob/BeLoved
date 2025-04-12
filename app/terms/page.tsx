'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()
  
  return (
    <main className="container mx-auto p-4 py-8 max-w-4xl">
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600">Last Updated: April 12, 2024</p>
      </div>
      
      <div className="prose max-w-none">
        <section className="mb-6">
          <h2>Introduction</h2>
          <p>
            These Terms of Service ("Terms") govern your use of BeLoved Transportation ("BeLoved", "we", or "our"),
            a ride scheduling service for medical appointments. By using our app or website, you agree to these terms.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>1. Eligibility</h2>
          <p>
            To use our services, you must:
          </p>
          <ul>
            <li>Provide accurate information, including valid identification if required for service verification.</li>
            <li>Have the legal capacity to enter into these Terms.</li>
            <li>Not be prohibited from using our services under applicable law.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>2. Scheduling Rules</h2>
          <p>
            When scheduling rides through our service:
          </p>
          <ul>
            <li>One-time and recurring rides must be scheduled with complete details (appointment time, provider address, etc.).</li>
            <li>Cancellations require at least 2 hours' notice to avoid penalties.</li>
            <li>If you're not present within 10 minutes of the driver's arrival, the ride may be marked as a no-show.</li>
            <li>For return trips, you must call to request a pickup, and a driver will arrive within 1 hour when possible.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>3. User Responsibilities</h2>
          <p>
            As a user of our service, you agree to:
          </p>
          <ul>
            <li>Be ready at the designated pickup time and location.</li>
            <li>Provide accurate Trip IDs for modifications or inquiries.</li>
            <li>Treat drivers and staff with respect.</li>
            <li>Comply with all applicable laws and regulations while using our service.</li>
            <li>Not engage in any behavior that could endanger the driver or other passengers.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>4. Driver Conduct</h2>
          <p>
            Our drivers follow a verification process for rides, including:
          </p>
          <ul>
            <li>Attempting to contact you before marking a trip as a no-show.</li>
            <li>Arriving at the scheduled pickup time.</li>
            <li>Treating passengers with respect and professionalism.</li>
            <li>Following all traffic laws and safety regulations.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>5. Liability Limits</h2>
          <p>
            While we strive to provide reliable service:
          </p>
          <ul>
            <li>We are not liable for missed appointments due to user errors, such as incorrect addresses.</li>
            <li>We strive to confirm appointments with providers but cannot guarantee their availability.</li>
            <li>Our liability is limited to the extent permitted by law.</li>
            <li>We do not guarantee the availability of rides at all times or in all locations.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>6. Termination</h2>
          <p>
            We may suspend or terminate your access if you:
          </p>
          <ul>
            <li>Violate these Terms.</li>
            <li>Engage in repeated no-shows without proper notification.</li>
            <li>Provide false information.</li>
            <li>Use our service in a manner that is harmful or disruptive.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>7. Modifications</h2>
          <p>
            We may update these Terms at any time. We will notify you of significant changes via the app or email.
            Your continued use of our service after such changes constitutes acceptance of the updated Terms.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>8. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at:
          </p>
          <p>
            Email: legal@belovedtransportation.com<br />
            Phone: 1-800-555-1234<br />
            Mail: BeLoved Transportation, 123 Main St, Indianapolis, IN 46204
          </p>
        </section>
      </div>
    </main>
  )
} 