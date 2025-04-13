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
      
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-6">Last Updated: April 12, 2025</p>
        
        <p>
          These Terms of Service ("Terms") govern your use of BeLoved Transportation ("BeLoved", "we", or "our"),
          a ride scheduling service for medical appointments. By using our app or website, you agree to these terms.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">1. Eligibility</h2>
        <p>
          To use our services, you must:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>Provide accurate information, including valid identification if required for service verification.</li>
          <li>Have the legal capacity to enter into these Terms.</li>
          <li>Not be prohibited from using our services under applicable law.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">2. Scheduling Rules</h2>
        <p>
          When scheduling rides through our service:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>One-time and recurring rides must be scheduled with complete details (appointment time, provider address, etc.).</li>
          <li>Cancellations require at least 2 hours' notice to avoid penalties.</li>
          <li>If you're not present within 10 minutes of the driver's arrival, the ride may be marked as a no-show.</li>
          <li>For return trips, you must call to request a pickup, and a driver will arrive within 1 hour when possible.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">3. User Responsibilities</h2>
        <p>
          As a user of our service, you agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>Be ready at the designated pickup time and location.</li>
          <li>Provide accurate Trip IDs for modifications or inquiries.</li>
          <li>Treat drivers and staff with respect.</li>
          <li>Comply with all applicable laws and regulations while using our service.</li>
          <li>Not engage in any behavior that could endanger the driver or other passengers.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">4. Driver Conduct</h2>
        <p>
          Our drivers follow a verification process for rides, including:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>Attempting to contact you before marking a trip as a no-show.</li>
          <li>Arriving at the scheduled pickup time.</li>
          <li>Treating passengers with respect and professionalism.</li>
          <li>Following all traffic laws and safety regulations.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">5. Liability Limits</h2>
        <p>
          While we strive to provide reliable service:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>We are not liable for missed appointments due to user errors, such as incorrect addresses.</li>
          <li>We strive to confirm appointments with providers but cannot guarantee their availability.</li>
          <li>Our liability is limited to the extent permitted by law.</li>
          <li>We do not guarantee the availability of rides at all times or in all locations.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">6. Termination</h2>
        <p>
          We may suspend or terminate your access if you:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li>Violate these Terms.</li>
          <li>Engage in repeated no-shows without proper notification.</li>
          <li>Provide false information.</li>
          <li>Use our service in a manner that is harmful or disruptive.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">7. Modifications</h2>
        <p>
          We may update these Terms at any time. We will notify you of significant changes via the app or email.
          Your continued use of our service after such changes constitutes acceptance of the updated Terms.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">8. Contact Information</h2>
        <p>
          If you have questions about these Terms, please contact us:
        </p>
        <ul className="list-disc pl-6 space-y-2 my-4">
          <li><p>By email: support@be-loved.app</p></li>
          <li><p>By visiting this page on our website: <a href="https://be-loved.app/support" rel="external nofollow noopener" target="_blank">https://be-loved.app/support</a></p></li>
          <li><p>By phone number: +1 (812) 913-9571</p></li>
        </ul>
      </div>
    </main>
  )
} 