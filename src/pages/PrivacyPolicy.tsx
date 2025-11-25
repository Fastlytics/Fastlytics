import React from 'react';
import Navbar from '@/components/Navbar'; // Assuming a standard Navbar
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white tracking-tight">Privacy Policy</h1>

        <div className="prose prose-invert prose-lg mx-auto bg-gray-900/50 p-6 md:p-8 rounded-lg border border-gray-700/80">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to Fastlytics ("we", "us", "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us.
          </p>
          <p>
            The personal information that we collect depends on the context of your interactions with us and the application, the choices you make and the products and features you use. The personal information we collect may include the following: email address, username, password (hashed).
          </p>
           <p>
            We do not process sensitive information.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We indicate the specific processing grounds we rely on next to each purpose listed below.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To manage user accounts.</li>
            <li>To send administrative information to you.</li>
            <li>To protect our Services.</li>
            <li>To respond to user inquiries/offer support to users.</li>
          </ul>

          <h2>4. Will Your Information Be Shared With Anyone?</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information.
          </p>
           <p>
            We may need to share your information with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work (e.g., Supabase for authentication and database hosting).
          </p>

          <h2>5. How Long Do We Keep Your Information?</h2>
          <p>
            We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
          </p>

          <h2>6. How Do We Keep Your Information Safe?</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2>7. Do We Collect Information From Minors?</h2>
          <p>
            We do not knowingly solicit data from or market to children under 18 years of age.
          </p>

          <h2>8. What Are Your Privacy Rights?</h2>
          <p>
            You may review, change, or terminate your account at any time by logging into your account and updating your profile or by contacting us using the contact information provided.
          </p>

          <h2>9. Updates To This Notice</h2>
          <p>
            We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible.
          </p>

          <h2>10. How Can You Contact Us About This Notice?</h2>
          <p>
            If you have questions or comments about this notice, you may email us at contact@fastlytics.app
          </p>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
