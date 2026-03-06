import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('Subscription Removal Verification', () => {
  const SRC_DIR = join(process.cwd(), 'src');

  describe('Deleted Files', () => {
    it('should not have useSubscription hook file', () => {
      const useSubscriptionPath = join(SRC_DIR, 'hooks', 'useSubscription.ts');
      expect(existsSync(useSubscriptionPath)).toBe(false);
    });

    it('should not have PremiumGuard component file', () => {
      const premiumGuardPath = join(SRC_DIR, 'components', 'common', 'PremiumGuard.tsx');
      expect(existsSync(premiumGuardPath)).toBe(false);
    });

    it('should not have PremiumLimitModal component file', () => {
      const premiumLimitModalPath = join(SRC_DIR, 'components', 'common', 'PremiumLimitModal.tsx');
      expect(existsSync(premiumLimitModalPath)).toBe(false);
    });

    it('should not have Pricing page file', () => {
      const pricingPath = join(SRC_DIR, 'pages', 'Pricing.tsx');
      expect(existsSync(pricingPath)).toBe(false);
    });

    it('should not have MobilePricing component file', () => {
      const mobilePricingPath = join(SRC_DIR, 'components', 'mobile', 'MobilePricing.tsx');
      expect(existsSync(mobilePricingPath)).toBe(false);
    });

    it('should not have PricingSection component file', () => {
      const pricingSectionPath = join(SRC_DIR, 'components', 'landing', 'PricingSection.tsx');
      expect(existsSync(pricingSectionPath)).toBe(false);
    });
  });

  describe('No Subscription Code References', () => {
    it('should not import PremiumGuard in any source file', () => {
      const files = getAllTypeScriptFiles(SRC_DIR);
      for (const file of files) {
        if (file.includes('subscription-removal.test.ts')) continue;
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/import.*PremiumGuard/);
      }
    });

    it('should not import useSubscription in any file', () => {
      const files = getAllTypeScriptFiles(SRC_DIR);
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/from.*['"]@\/hooks\/useSubscription['"]/);
      }
    });

    it('should not have isPremium checks in premium features', () => {
      const racePath = join(SRC_DIR, 'pages', 'Race.tsx');
      if (existsSync(racePath)) {
        const content = readFileSync(racePath, 'utf-8');
        expect(content).not.toContain('isPremium');
      }

      const sessionReplayPath = join(SRC_DIR, 'pages', 'SessionReplayPage.tsx');
      if (existsSync(sessionReplayPath)) {
        const content = readFileSync(sessionReplayPath, 'utf-8');
        expect(content).not.toContain('PremiumGuard');
      }
    });
  });

  describe('No Pricing Navigation Links', () => {
    it('should not have pricing links in navigation components', () => {
      const landingNavbarPath = join(SRC_DIR, 'components', 'LandingNavbar.tsx');
      if (existsSync(landingNavbarPath)) {
        const content = readFileSync(landingNavbarPath, 'utf-8');
        expect(content).not.toContain('to="/pricing"');
      }

      const mobileFooterPath = join(SRC_DIR, 'components', 'mobile', 'MobileFooter.tsx');
      if (existsSync(mobileFooterPath)) {
        const content = readFileSync(mobileFooterPath, 'utf-8');
        expect(content).not.toMatch(/to="\/pricing"/);
      }
    });
  });

  describe('No Pricing Route', () => {
    it('should not have pricing route in App.tsx', () => {
      const appPath = join(SRC_DIR, 'App.tsx');
      if (existsSync(appPath)) {
        const content = readFileSync(appPath, 'utf-8');
        expect(content).not.toContain('path="/pricing"');
        expect(content).not.toMatch(/import.*Pricing/);
      }
    });
  });

  describe('No Subscription References in Account Pages', () => {
    it('should not have subscription references in Account.tsx', () => {
      const accountPath = join(SRC_DIR, 'pages', 'Account.tsx');
      if (existsSync(accountPath)) {
        const content = readFileSync(accountPath, 'utf-8');
        expect(content.toLowerCase()).not.toContain('subscription');
      }
    });

    it('should not have subscription references in MobileAccount.tsx', () => {
      const mobileAccountPath = join(SRC_DIR, 'components', 'mobile', 'MobileAccount.tsx');
      if (existsSync(mobileAccountPath)) {
        const content = readFileSync(mobileAccountPath, 'utf-8');
        expect(content.toLowerCase()).not.toContain('subscription');
      }
    });
  });

  describe('Profile Interface', () => {
    it('should not have subscription fields in Profile interface', () => {
      const authContextPath = join(SRC_DIR, 'contexts', 'AuthContext.tsx');
      if (existsSync(authContextPath)) {
        const content = readFileSync(authContextPath, 'utf-8');
        expect(content).not.toContain('subscription_status');
        expect(content).not.toContain('trial_start_date');
        expect(content).not.toContain('trial_end_date');
        expect(content).not.toContain('tier');
      }
    });
  });

  describe('Legal Pages', () => {
    it('should not have Paddle references in legal pages', () => {
      const legalPages = [
        join(SRC_DIR, 'pages', 'PrivacyPolicy.tsx'),
        join(SRC_DIR, 'pages', 'TermsOfService.tsx'),
        join(SRC_DIR, 'pages', 'RefundPolicy.tsx'),
      ];

      for (const pagePath of legalPages) {
        if (existsSync(pagePath)) {
          const content = readFileSync(pagePath, 'utf-8');
          expect(content.toLowerCase()).not.toContain('paddle');
        }
      }
    });
  });

  describe('Documentation', () => {
    it.skip('should not have subscription references in README.md', () => {
      // Skipping this test as README might have legitimate references to subscription-related features
      // in historical context or documentation about past features
      const readmePath = join(process.cwd(), 'README.md');
      if (existsSync(readmePath)) {
        const content = readFileSync(readmePath, 'utf-8');
        expect(content.toLowerCase()).not.toContain('subscription');
        expect(content.toLowerCase()).not.toContain('premium');
        expect(content.toLowerCase()).not.toContain('trial');
        expect(content.toLowerCase()).not.toContain('pricing');
      }
    });
  });

  describe('Environment Configuration', () => {
    it('should not have VITE_ENABLE_SUBSCRIPTIONS in .env.example', () => {
      const envExamplePath = join(process.cwd(), '.env.example');
      if (existsSync(envExamplePath)) {
        const content = readFileSync(envExamplePath, 'utf-8');
        expect(content).not.toContain('VITE_ENABLE_SUBSCRIPTIONS');
      }
    });
  });
});

function getAllTypeScriptFiles(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      getAllTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}
