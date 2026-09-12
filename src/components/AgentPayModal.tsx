import { useState } from 'react';
import { PaymentLink } from '@/lib/types';
import { buildX402Spec, buildHTTP402Header } from '@/lib/agent';
import { Badge, Button, Modal } from '@/components/ui';

interface AgentPayModalProps {
  link: PaymentLink;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentPayModal({ link, isOpen, onClose }: AgentPayModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const spec = buildX402Spec(link);
  const header = buildHTTP402Header(link);
  const jsonSpec = JSON.stringify(spec, null, 2);

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agent payability (x402)"
      description="Autonomous AI agents can parse this machine-readable payment specification to settle this link via Trails intents."
      size="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <Badge tone="blue" className="mb-5">
        HTTP 402 / Agent payable
      </Badge>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label-caps">HTTP 402 header</span>
            <button
              type="button"
              onClick={() => handleCopy(header, 'header')}
              className="font-mono text-xs text-blue hover:underline"
            >
              {copied === 'header' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-paper p-3 font-mono text-[11.5px] text-ink">
            {header}
          </pre>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label-caps">x402 payment spec (JSON)</span>
            <button
              type="button"
              onClick={() => handleCopy(jsonSpec, 'json')}
              className="font-mono text-xs text-blue hover:underline"
            >
              {copied === 'json' ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="max-h-56 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs leading-relaxed text-white">
            {jsonSpec}
          </pre>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="ink" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
