import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 09-04-2026 | Platform Name: Jeevan Games</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground">This Privacy Policy explains how Jeevan Games collects, uses, and protects your personal data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We may collect the following types of information:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong>Personal Information:</strong> Name, email, phone number, date of birth</li>
              <li><strong>Verification Data:</strong> Government ID, address proof (for KYC)</li>
              <li><strong>Financial Information:</strong> Payment details (processed securely via third-party providers)</li>
              <li><strong>Technical Data:</strong> IP address, device information, browser type</li>
              <li><strong>Usage Data:</strong> Gameplay activity, preferences, and interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use your data to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Create and manage your account</li>
              <li>Process transactions and withdrawals</li>
              <li>Verify identity (KYC compliance)</li>
              <li>Improve user experience and platform performance</li>
              <li>Detect and prevent fraud or illegal activities</li>
              <li>Send important updates and promotional communications (with consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground mb-2">We may share your data with:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Payment processors and financial institutions</li>
              <li>Identity verification providers</li>
              <li>Regulatory authorities where required by law</li>
              <li>Service providers assisting with platform operations</li>
            </ul>
            <p className="text-muted-foreground mt-2 font-medium">We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Personal data is retained only as long as necessary for legal and operational purposes.</li>
              <li>Users may request deletion, subject to legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Security</h2>
            <p className="text-muted-foreground">We implement appropriate technical and organizational measures to protect your data, including encryption and secure servers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cookies & Tracking</h2>
            <p className="text-muted-foreground mb-2">We use cookies to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Enhance user experience</li>
              <li>Analyze traffic and usage patterns</li>
              <li>Remember user preferences</li>
            </ul>
            <p className="text-muted-foreground mt-2">Users can manage cookie preferences through browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. User Rights</h2>
            <p className="text-muted-foreground mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Access your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion</li>
              <li>Withdraw consent</li>
              <li>Object to processing</li>
            </ul>
            <p className="text-muted-foreground mt-2">Requests can be made via our support team.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Third-Party Links</h2>
            <p className="text-muted-foreground">Our platform may contain links to external sites. We are not responsible for their privacy practices.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Children's Privacy</h2>
            <p className="text-muted-foreground">Our platform is strictly for users above the legal gambling age. We do not knowingly collect data from minors.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">We may update this Privacy Policy periodically. Users will be notified of significant changes.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
