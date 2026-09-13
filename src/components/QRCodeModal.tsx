import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Badge, Button, IconCheck, IconCopy, IconDownload, Modal } from '@/components/ui';

interface QRCodeModalProps {
  url: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ url, title = 'Pay via QR Code', isOpen, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url || !isOpen) return;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1D1D1F',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [url, isOpen]);

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `polypaid-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="mb-5 text-center">
        <Badge tone="blue" className="mb-3">
          Instant scan
        </Badge>
        <h3 className="text-h3 text-ink">{title}</h3>
        <p className="mt-1 text-xs text-ink-soft">Scan with any Web3 wallet or mobile camera</p>
      </div>

      <div className="mb-5 flex items-center justify-center rounded-2xl border border-line bg-paper p-4">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Payment Link QR Code"
            className="h-56 w-56 rounded-xl border border-line shadow-soft"
          />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center font-mono text-xs text-ink-soft">
            Generating QR…
          </div>
        )}
      </div>

      <div className="mb-5 truncate rounded-xl border border-line bg-paper px-3 py-2 text-center font-mono text-[11px] text-ink-soft">
        {url}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" onClick={copyLink}>
          {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button onClick={downloadQr}>
          <IconDownload className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </Modal>
  );
}
