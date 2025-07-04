'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState<'tos' | 'privacy'>('tos');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Legal Information</h1>
            <p className="mt-1 text-sm text-gray-500">
              Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveSection('tos')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'tos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveSection('privacy')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'privacy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Privacy Policy
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {activeSection === 'tos' ? <TermsOfService /> : <PrivacyPolicy />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsOfService() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['1']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: '1',
      title: 'Acceptance of Terms',
      content: (
        <div className="space-y-3">
          <p>
            By accessing and using this background removal service, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          <p>
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>
      )
    },
    {
      id: '2',
      title: 'Prohibited Content',
      content: (
        <div className="space-y-3">
          <p className="font-semibold text-red-600">You are strictly prohibited from uploading:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Child sexual abuse material (CSAM) or any content involving minors in sexual situations</li>
            <li>Explicit adult content, pornography, or sexually explicit material</li>
            <li>Violent, gory, or disturbing content</li>
            <li>Content promoting terrorism, hate speech, or violence</li>
            <li>Content that infringes on copyrights or intellectual property rights</li>
            <li>Content that violates any applicable laws or regulations</li>
            <li>Content intended to harass, threaten, or harm others</li>
          </ul>
          <p className="text-sm text-gray-600">
            <strong>Violation of these terms will result in immediate account termination, content removal, and may be reported to law enforcement.</strong>
          </p>
        </div>
      )
    },
    {
      id: '3',
      title: 'Content Moderation',
      content: (
        <div className="space-y-3">
          <p>
            We implement automated content filtering and manual review processes to detect and remove prohibited content.
          </p>
          <p>
            All uploaded images are subject to review. We reserve the right to remove any content that violates our terms or is deemed inappropriate.
          </p>
          <p>
            Users are responsible for the content they upload. We are not liable for any content uploaded by users.
          </p>
        </div>
      )
    },
    {
      id: '4',
      title: 'Rate Limiting and Abuse Prevention',
      content: (
        <div className="space-y-3">
          <p>To prevent abuse and ensure fair usage, we implement the following limits:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Maximum 10 uploads per hour per IP address</li>
            <li>Maximum 50 uploads per day per IP address</li>
            <li>Maximum file size of 50MB per image</li>
            <li>Images are automatically deleted after 7 days</li>
          </ul>
          <p>
            Violation of these limits may result in temporary or permanent IP blocking.
          </p>
        </div>
      )
    },
    {
      id: '5',
      title: 'DMCA and Copyright',
      content: (
        <div className="space-y-3">
          <p>
            We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA).
          </p>
          <p>
            If you believe your copyrighted work has been uploaded without permission, please contact us at:
          </p>
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium">DMCA Agent</p>
            <p>Email: dmca@yourdomain.com</p>
            <p>Include: Description of work, location on service, your contact information, and statement of good faith belief.</p>
          </div>
        </div>
      )
    },
    {
      id: '6',
      title: 'Service Availability',
      content: (
        <div className="space-y-3">
          <p>
            We strive to maintain high service availability but do not guarantee uninterrupted access.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue the service at any time without notice.
          </p>
          <p>
            We are not liable for any damages resulting from service interruptions or modifications.
          </p>
        </div>
      )
    },
    {
      id: '7',
      title: 'Limitation of Liability',
      content: (
        <div className="space-y-3">
          <p>
            This service is provided &quot;as is&quot; without warranties of any kind.
          </p>
          <p>
            We are not liable for any damages, including but not limited to direct, indirect, incidental, or consequential damages.
          </p>
          <p>
            Our total liability shall not exceed the amount paid by you for the service, if any.
          </p>
        </div>
      )
    },
    {
      id: '8',
      title: 'Changes to Terms',
      content: (
        <div className="space-y-3">
          <p>
            We reserve the right to modify these terms at any time.
          </p>
          <p>
            Changes will be effective immediately upon posting. Continued use of the service constitutes acceptance of modified terms.
          </p>
          <p>
            Users will be notified of significant changes via email or service notification.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Terms of Service</h2>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{section.title}</span>
              {expandedSections.has(section.id) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 text-gray-700">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['1']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: '1',
      title: 'Information We Collect',
      content: (
        <div className="space-y-3">
          <p>We collect the following information:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Uploaded Images:</strong> Images you upload for background removal</li>
            <li><strong>IP Addresses:</strong> For rate limiting and abuse prevention</li>
            <li><strong>Upload Metadata:</strong> File names, sizes, timestamps, and titles</li>
            <li><strong>Usage Logs:</strong> Upload attempts, processing status, and errors</li>
          </ul>
          <p className="text-sm text-gray-600">
            We do not collect personal information such as names, emails, or phone numbers unless explicitly provided.
          </p>
        </div>
      )
    },
    {
      id: '2',
      title: 'How We Use Information',
      content: (
        <div className="space-y-3">
          <p>We use collected information for:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Providing background removal services</li>
            <li>Preventing abuse and enforcing rate limits</li>
            <li>Content moderation and filtering</li>
            <li>Service improvement and debugging</li>
            <li>Compliance with legal obligations</li>
          </ul>
        </div>
      )
    },
    {
      id: '3',
      title: 'Data Storage and Retention',
      content: (
        <div className="space-y-3">
          <p><strong>Image Storage:</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Images are stored for 7 days then automatically deleted</li>
            <li>Original and processed images are stored on secure servers</li>
            <li>Images are encrypted at rest</li>
          </ul>
          <p><strong>Log Retention:</strong></p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Upload logs are retained for 30 days for abuse prevention</li>
            <li>IP addresses are logged for rate limiting and security</li>
            <li>Metadata is retained for the duration of image storage</li>
          </ul>
        </div>
      )
    },
    {
      id: '4',
      title: 'Data Security',
      content: (
        <div className="space-y-3">
          <p>We implement the following security measures:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure server infrastructure</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Automated content filtering</li>
          </ul>
        </div>
      )
    },
    {
      id: '5',
      title: 'Data Sharing',
      content: (
        <div className="space-y-3">
          <p>We do not sell, trade, or rent your personal information to third parties.</p>
          <p>We may share information in the following circumstances:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>When required by law or legal process</li>
            <li>To report illegal content to law enforcement</li>
            <li>To protect our rights, property, or safety</li>
            <li>With service providers who assist in our operations</li>
          </ul>
        </div>
      )
    },
    {
      id: '6',
      title: 'Your Rights',
      content: (
        <div className="space-y-3">
          <p>You have the following rights regarding your data:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Access:</strong> Request information about data we hold</li>
            <li><strong>Deletion:</strong> Request deletion of your images and data</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Portability:</strong> Request a copy of your data</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@yourdomain.com</p>
        </div>
      )
    },
    {
      id: '7',
      title: 'Cookies and Tracking',
      content: (
        <div className="space-y-3">
          <p>We use minimal cookies and tracking:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Session cookies for basic functionality</li>
            <li>No third-party tracking or advertising cookies</li>
            <li>No persistent user identification</li>
          </ul>
        </div>
      )
    },
    {
      id: '8',
      title: 'Contact Information',
      content: (
        <div className="space-y-3">
          <p>For privacy-related questions or concerns:</p>
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium">Privacy Officer</p>
            <p>Email: privacy@yourdomain.com</p>
            <p>Response time: Within 30 days</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy</h2>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{section.title}</span>
              {expandedSections.has(section.id) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 text-gray-700">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 