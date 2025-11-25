import React from 'react';
import Navbar from '@/components/Navbar'; // Assuming a standard Navbar
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
         <Button
          variant="ghost"
          size="icon"
          className="absolute top-20 left-4 md:left-8 text-gray-300 hover:bg-gray-800 hover:text-white z-10"
          onClick={() => navigate(-1)} // Go back to previous page
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white tracking-tight">Terms of Service</h1>

        <div className="prose prose-invert prose-lg mx-auto bg-gray-900/50 p-6 md:p-8 rounded-lg border border-gray-700/80">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By using Fastlytics (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you do not have permission to access the Service.
          </p>

          <h2>2. Accounts</h2>
          <p>
            When you create an account with us, you guarantee that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service. You are responsible for maintaining the confidentiality of your account and password.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Fastlytics and its licensors. The Service is protected by copyright, trademark, and other laws of both the [Your Country] and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Fastlytics.
          </p>
           <p>
            Formula 1 related data is sourced from publicly available APIs (e.g., FastF1 library) and is subject to their respective terms and conditions. Fastlytics is not affiliated with Formula One group companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
          </p>

          <h2>4. User Content</h2>
          <p>
            Our Service may allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
          </p>

          <h2>5. Prohibited Uses</h2>
          <p>
            You may use the Service only for lawful purposes and in accordance with Terms. You agree not to use the Service in any way that violates any applicable national or international law or regulation.
          </p>

          <h2>6. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>

          <h2>7. Limitation Of Liability</h2>
          <p>
            In no event shall Fastlytics, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2>8. Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance. Data accuracy is dependent on upstream sources and is not guaranteed.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>

          <h2>10. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at contact@fastlytics.app
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
