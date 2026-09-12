import { ReactNode } from 'react';
import { TopNav } from '@/components/TopNav';
import { RouteDiagram } from '@/components/RouteDiagram';
import { Badge, Button, IconArrowRight, Section } from '@/components/ui';

export function Landing() {
  return (
    <>
      <TopNav />

      <section className="pb-10 pt-12 sm:pt-16 animate-fade-up">
        <Badge tone="blue" pulse className="mb-7">
          Powered by Polygon
        </Badge>

        <h1 className="text-display max-w-3xl text-ink">
          Get paid in USDC.
          <br />
          From <span className="text-blue">any token.</span> Any chain.
          <br />
          One link.
        </h1>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
          PolyPay turns “just send me money” into a shareable payment link. You always receive clean
          USDC on Polygon.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button to="/create" variant="ink" size="lg">
            Create a payment link
            <IconArrowRight className="h-4 w-4" />
          </Button>
          <Button to="/dashboard" variant="secondary" size="lg">
            View dashboard
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11.5px] uppercase tracking-[0.06em] text-ink-soft">
          <span>1,000+ tokens supported</span>
          <span className="hidden h-3 w-px bg-line sm:block" />
          <span>Solana · Ethereum · Base · Arbitrum · Optimism · Avalanche · BNB Chain</span>
          <span className="hidden h-3 w-px bg-line sm:block" />
          <span>Audited by Quantstamp</span>
        </div>

        <RouteDiagram />
      </section>

      <Section className="mt-20 grid gap-4 md:grid-cols-3">
        <FeatureCard num="01" title="Create in 30 seconds">
          Set an amount, add a memo, choose USDC on Polygon as your settlement asset, and get a link
          instantly. No contracts, no code.
        </FeatureCard>
        <FeatureCard num="02" title="They pay with anything">
          Your customer connects any wallet and pays with any token on any EVM chain. Trails finds
          the optimal route automatically.
        </FeatureCard>
        <FeatureCard num="03" title="You get clean USDC">
          Funds land on Polygon as USDC — no manual bridging, no leftover dust, no spreadsheet
          reconciliation.
        </FeatureCard>
      </Section>

      <Section
        className="mt-24 pb-24"
        title="How a PolyPay link works"
        description="Three steps from intent to settlement — designed to feel invisible."
      >
        <div className="grid gap-10 md:grid-cols-3">
          <Step n="1" title="Define the intent">
            PolyPay creates a Trails payment intent — your address, amount, and USDC on Polygon as
            the destination.
          </Step>
          <Step n="2" active title="Solve the route">
            Trails’ solver network prices the optimal path across chains and liquidity venues, gas
            included.
          </Step>
          <Step n="3" title="Execute & confirm">
            The payer signs once. Trails executes swaps and bridges end-to-end, and your dashboard
            updates when funds land.
          </Step>
        </div>
      </Section>

      <footer className="border-t border-line py-8 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        PolyPay — shareable payment links, settled in USDC on Polygon
      </footer>
    </>
  );
}

function FeatureCard({ num, title, children }: { num: string; title: string; children: ReactNode }) {
  return (
    <div className="surface p-6 transition-[transform,box-shadow] duration-200 ease-apple hover:-translate-y-0.5 hover:shadow-lift">
      <div className="label-caps mb-4 text-blue">{num}</div>
      <h3 className="text-h3 mb-2.5 text-ink">{title}</h3>
      <p className="text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function Step({
  n,
  active,
  title,
  children,
}: {
  n: string;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className={`mb-5 flex h-10 w-10 items-center justify-center rounded-full border text-[13px] font-semibold ${
          active ? 'border-blue bg-blue text-white' : 'border-ink text-ink'
        }`}
      >
        {n}
      </div>
      <h4 className="mb-2 text-[18px] font-semibold tracking-tight text-ink">{title}</h4>
      <p className="text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
