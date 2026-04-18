import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: 09-04-2026 | Platform Name: Jeevan Games</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground">Welcome to Jeevan Games. By accessing or using our platform, you agree to comply with these Terms & Conditions. If you do not agree, please refrain from using our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>You must be at least 18 years old (or higher if required by your jurisdiction).</li>
              <li>Users must access the platform only from regions where fantasy gaming is legally permitted.</li>
              <li>We reserve the right to verify eligibility at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Account Registration</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Users must provide accurate and complete information.</li>
              <li>Only one account per user is allowed.</li>
              <li>You are responsible for maintaining account confidentiality.</li>
              <li>We may suspend or terminate accounts for false or misleading information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Identity Verification (KYC)</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Users must complete KYC verification using valid identification (e.g., government ID, email, phone number).</li>
              <li>Withdrawals may be restricted until verification is complete.</li>
              <li>This process helps prevent fraud and comply with anti-money laundering laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Fantasy Gameplay Rules</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Users can participate in fantasy contests based on skill and knowledge.</li>
              <li>Contest rules, scoring systems, and prize structures will be clearly displayed.</li>
              <li>The platform reserves the right to modify or cancel contests if necessary.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Bonuses & Wagering Requirements</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Bonuses may be subject to wagering requirements (e.g., 20x–30x playthrough).</li>
              <li>Bonus winnings cannot be withdrawn until requirements are fulfilled.</li>
              <li>Abuse of bonus systems may result in account suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Deposits & Withdrawals</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Users may deposit funds through approved payment methods.</li>
              <li>Withdrawal limits may apply per transaction/day/week.</li>
              <li>Processing times may vary depending on verification status.</li>
              <li>We reserve the right to delay or deny withdrawals in cases of suspected fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-2">Users must not:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Use multiple accounts to gain unfair advantage</li>
              <li>Engage in cheating, collusion, or fraud</li>
              <li>Use bots, scripts, or automated systems</li>
              <li>Attempt to hack or disrupt the platform</li>
            </ul>
            <p className="text-muted-foreground mt-2">Violation may result in immediate account termination and forfeiture of funds.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Account Inactivity</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Accounts inactive for 12 months or more may incur maintenance fees or be closed.</li>
              <li>Users will be notified prior to any deductions where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Responsible Gaming</h2>
            <p className="text-muted-foreground mb-2">We promote responsible gaming and provide tools such as:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Deposit limits</li>
              <li>Session/time limits</li>
              <li>Self-exclusion options</li>
            </ul>
            <p className="text-muted-foreground mt-2">Users are encouraged to play responsibly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Intellectual Property</h2>
            <p className="text-muted-foreground">All content on the platform (logos, software, designs) is owned by Jeevan Games and protected by intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Limitation of Liability</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>The platform is provided "as is."</li>
              <li>We are not liable for losses due to technical issues, interruptions, or user actions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">13. Termination</h2>
            <p className="text-muted-foreground">We reserve the right to suspend or terminate accounts at our discretion for violations of these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">14. Amendments</h2>
            <p className="text-muted-foreground">We may update these Terms at any time. Continued use of the platform implies acceptance of changes.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
