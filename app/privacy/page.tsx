'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600">Effective Date: April 12, 2024</p>
      </div>
      
      <div className="prose max-w-none">
        <section className="mb-6">
          <h2>Introduction</h2>
          <p>
            This Privacy Policy explains how BeLoved Transportation ("BeLoved," "we," or "our") collects, uses, and 
            protects your personal information when you use our ride scheduling services for medical transportation. 
            We are committed to ensuring the privacy and security of your personal information and comply with 
            applicable data protection laws.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>Data We Collect</h2>
          <p>
            We collect the following types of information:
          </p>
          <ul>
            <li><strong>Personal Information:</strong> Full name, date of birth, phone number, home address, email address (optional)</li>
            <li><strong>Medical Information:</strong> Medicaid ID (if applicable), appointment details (provider name, address, time)</li>
            <li><strong>Service Information:</strong> Trip IDs, pickup and dropoff locations, scheduled times</li>
            <li><strong>Driver Information:</strong> For drivers, we collect license information and vehicle details</li>
            <li><strong>Usage Information:</strong> Device information, IP address, and app usage patterns</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>How Data Is Collected</h2>
          <p>
            We collect information in the following ways:
          </p>
          <ul>
            <li>Directly from you when you register, schedule rides, or modify trips</li>
            <li>From drivers when reporting ride status or no-shows</li>
            <li>Automatically through our app or website when you use our services</li>
            <li>From third parties, such as medical providers, with your consent</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>Purpose of Data Collection</h2>
          <p>
            We use your information for the following purposes:
          </p>
          <ul>
            <li>To schedule and confirm rides, verify eligibility, and contact you about trips</li>
            <li>To confirm appointments with medical providers</li>
            <li>To provide customer support and respond to inquiries</li>
            <li>To process payments and manage billing</li>
            <li>To improve our services (e.g., analyzing trip patterns anonymously)</li>
            <li>To ensure safety and security of our users and drivers</li>
            <li>To comply with legal obligations and enforce our terms</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>Data Sharing</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li><strong>Drivers:</strong> Limited information (name, address, Trip ID) to facilitate pickups</li>
            <li><strong>Medical Providers:</strong> To confirm appointments and verify medical necessity</li>
            <li><strong>Service Providers:</strong> Third parties who help operate our service (e.g., payment processors, cloud services)</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
          </ul>
          <p>
            All third parties must follow our privacy standards and applicable laws (e.g., HIPAA for medical data).
            We do not sell your personal information to third parties.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information:
          </p>
          <ul>
            <li>Data is stored on secure servers with encryption (e.g., AES-256)</li>
            <li>Access to personal information is restricted to authorized personnel</li>
            <li>We use industry-standard practices to safeguard data during transmission</li>
            <li>Data is retained only as long as needed for service provision or legal requirements (e.g., Medicaid audits)</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2>Your Rights</h2>
          <p>
            Depending on your location, you may have the following rights regarding your data:
          </p>
          <ul>
            <li>Right to access and receive a copy of your personal information</li>
            <li>Right to correct inaccurate or incomplete information</li>
            <li>Right to request deletion of your information (subject to legal requirements)</li>
            <li>Right to restrict or object to processing</li>
            <li>Right to data portability</li>
          </ul>
          <p>
            To exercise these rights, please contact our Data Protection Officer at privacy@belovedtransportation.com.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal 
            information from children under 13 without verifiable parental consent. If you believe we have 
            collected information from a child under 13, please contact us immediately.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes 
            through the app or by email. We encourage you to review this policy periodically.
          </p>
        </section>
        
        <section className="mb-6">
          <h2>Contact Information</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact our Data Protection Officer:
          </p>
          <p>
            Email: privacy@belovedtransportation.com<br />
            Phone: 1-800-555-1234<br />
            Mail: BeLoved Transportation, 123 Main St, Indianapolis, IN 46204
          </p>
        </section>
      </div>
    </main>
  )
} 