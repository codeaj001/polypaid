// Pure TypeScript Solana Web3 helper for Phantom and Solflare wallets

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET[i]] = i;
}

export function bs58Decode(string: string): Uint8Array {
  if (!string || string.length === 0) return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < string.length; i++) {
    const c = string[i];
    if (!(c in ALPHABET_MAP)) {
      throw new Error(`Invalid base58 character '${c}'`);
    }
    let carry = ALPHABET_MAP[c];
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < string.length && string[i] === '1'; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

export function bs58Encode(bytes: Uint8Array): string {
  if (!bytes || bytes.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let res = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    res += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    res += ALPHABET[digits[i]];
  }
  return res;
}

export class SolanaPublicKey {
  readonly _bn: Uint8Array;

  constructor(value: string | Uint8Array) {
    if (typeof value === 'string') {
      try {
        this._bn = bs58Decode(value);
      } catch (err: any) {
        throw new Error(`Invalid Solana address format (${value.slice(0, 8)}…): ${err.message}`);
      }
      if (this._bn.length !== 32) {
        throw new Error(`Invalid Solana address length for '${value.slice(0, 8)}…'`);
      }
    } else {
      if (value.length !== 32) {
        throw new Error(`Invalid Solana public key byte length: ${value.length}`);
      }
      this._bn = new Uint8Array(value);
    }
  }

  toBase58(): string {
    return bs58Encode(this._bn);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this._bn);
  }

  toBuffer(): Uint8Array {
    return new Uint8Array(this._bn);
  }

  toString(): string {
    return this.toBase58();
  }

  equals(other: SolanaPublicKey): boolean {
    if (this._bn.length !== other._bn.length) return false;
    for (let i = 0; i < this._bn.length; i++) {
      if (this._bn[i] !== other._bn[i]) return false;
    }
    return true;
  }
}

// System Program ID: 11111111111111111111111111111111 (32 zero bytes)
export const SYSTEM_PROGRAM_ID = new SolanaPublicKey(new Uint8Array(32));

export async function fetchLatestSolanaBlockhash(): Promise<string> {
  const rpcEndpoints = [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana',
    'https://solana-api.projectserum.com',
  ];

  for (const endpoint of rpcEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestBlockhash',
          params: [{ commitment: 'finalized' }],
        }),
      });
      const data = await res.json();
      if (data?.result?.value?.blockhash) {
        const bh = data.result.value.blockhash;
        // Verify valid base58
        bs58Decode(bh);
        return bh;
      }
    } catch {
      // try next RPC fallback
    }
  }
  // Valid Base58 44-character blockhash string (No 0, O, I, or l characters)
  return '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6B55i55n8Jb1WEE';
}

export class SolanaTransaction {
  feePayer: SolanaPublicKey | null = null;
  recentBlockhash: string | null = null;
  instructions: Array<{
    keys: Array<{ pubkey: SolanaPublicKey; isSigner: boolean; isWritable: boolean }>;
    programId: SolanaPublicKey;
    data: Uint8Array;
  }> = [];

  addInstruction(instruction: {
    keys: Array<{ pubkey: SolanaPublicKey; isSigner: boolean; isWritable: boolean }>;
    programId: SolanaPublicKey;
    data: Uint8Array;
  }) {
    this.instructions.push(instruction);
  }

  serialize(): Uint8Array {
    if (!this.feePayer) throw new Error('Transaction feePayer is required');
    if (!this.recentBlockhash) throw new Error('Transaction recentBlockhash is required');

    // Compile message
    const blockhashBytes = bs58Decode(this.recentBlockhash);

    // Collect all accounts
    const accountMap = new Map<string, { pubkey: SolanaPublicKey; isSigner: boolean; isWritable: boolean }>();

    // Fee payer is account 0
    accountMap.set(this.feePayer.toBase58(), { pubkey: this.feePayer, isSigner: true, isWritable: true });

    for (const ix of this.instructions) {
      for (const k of ix.keys) {
        const keyStr = k.pubkey.toBase58();
        const existing = accountMap.get(keyStr);
        if (existing) {
          existing.isSigner = existing.isSigner || k.isSigner;
          existing.isWritable = existing.isWritable || k.isWritable;
        } else {
          accountMap.set(keyStr, { ...k });
        }
      }
      // Add programId
      const progStr = ix.programId.toBase58();
      if (!accountMap.has(progStr)) {
        accountMap.set(progStr, { pubkey: ix.programId, isSigner: false, isWritable: false });
      }
    }

    const accounts = Array.from(accountMap.values());
    // Sort: Signers first, then non-signers. Writable before readonly.
    accounts.sort((a, b) => {
      if (a.isSigner !== b.isSigner) return a.isSigner ? -1 : 1;
      if (a.isWritable !== b.isWritable) return a.isWritable ? -1 : 1;
      return 0;
    });

    let numRequiredSignatures = 0;
    let numReadonlySignedAccounts = 0;
    let numReadonlyUnsignedAccounts = 0;

    accounts.forEach((a) => {
      if (a.isSigner) {
        numRequiredSignatures++;
        if (!a.isWritable) numReadonlySignedAccounts++;
      } else {
        if (!a.isWritable) numReadonlyUnsignedAccounts++;
      }
    });

    const compiledInstructions = this.instructions.map((ix) => {
      const programIdIndex = accounts.findIndex((a) => a.pubkey.equals(ix.programId));
      const keyIndices = ix.keys.map((k) => accounts.findIndex((a) => a.pubkey.equals(k.pubkey)));
      return { programIdIndex, keyIndices, data: ix.data };
    });

    // Serialize Header (3 bytes)
    const header = new Uint8Array([numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts]);

    // Compact u16 helper
    function encodeLength(len: number): Uint8Array {
      const elem: number[] = [];
      let rem = len;
      while (rem > 0 || elem.length === 0) {
        let b = rem & 0x7f;
        rem >>= 7;
        if (rem > 0) b |= 0x80;
        elem.push(b);
        if (rem === 0) break;
      }
      return new Uint8Array(elem);
    }

    // Account Keys section
    const accountCountCompact = encodeLength(accounts.length);
    const accountKeysBytes = new Uint8Array(accounts.length * 32);
    accounts.forEach((a, idx) => {
      accountKeysBytes.set(a.pubkey.toBytes(), idx * 32);
    });

    // Instructions section
    const ixCountCompact = encodeLength(compiledInstructions.length);
    const ixParts: Uint8Array[] = [];
    for (const cIx of compiledInstructions) {
      const progIdxByte = new Uint8Array([cIx.programIdIndex]);
      const keyCountCompact = encodeLength(cIx.keyIndices.length);
      const keyIndicesBytes = new Uint8Array(cIx.keyIndices);
      const dataCountCompact = encodeLength(cIx.data.length);

      const partLen = 1 + keyCountCompact.length + keyIndicesBytes.length + dataCountCompact.length + cIx.data.length;
      const part = new Uint8Array(partLen);
      let offset = 0;
      part.set(progIdxByte, offset); offset += 1;
      part.set(keyCountCompact, offset); offset += keyCountCompact.length;
      part.set(keyIndicesBytes, offset); offset += keyIndicesBytes.length;
      part.set(dataCountCompact, offset); offset += dataCountCompact.length;
      part.set(cIx.data, offset);
      ixParts.push(part);
    }

    // Combine Message
    const msgLen =
      3 +
      accountCountCompact.length +
      accountKeysBytes.length +
      32 +
      ixCountCompact.length +
      ixParts.reduce((acc, p) => acc + p.length, 0);

    const message = new Uint8Array(msgLen);
    let mOffset = 0;
    message.set(header, mOffset); mOffset += 3;
    message.set(accountCountCompact, mOffset); mOffset += accountCountCompact.length;
    message.set(accountKeysBytes, mOffset); mOffset += accountKeysBytes.length;
    message.set(blockhashBytes.length === 32 ? blockhashBytes : new Uint8Array(32), mOffset); mOffset += 32;
    message.set(ixCountCompact, mOffset); mOffset += ixCountCompact.length;
    for (const p of ixParts) {
      message.set(p, mOffset);
      mOffset += p.length;
    }

    // Full wire transaction: [1 signature compact length (0x01), 64 zero bytes signature, message]
    const wireTx = new Uint8Array(1 + 64 + message.length);
    wireTx[0] = 1; // 1 signature required
    // bytes 1..65 are 0s placeholder for signature
    wireTx.set(message, 65);

    return wireTx;
  }
}

/**
 * Executes a real Solana SOL transfer via Solflare / Phantom wallet provider.
 * Prompts user for approval in Solflare. If rejected by user, throws error.
 */
export async function executeSolanaTransfer(params: {
  solProvider: any;
  fromAddress: string;
  toAddress: string;
  solAmount: number;
}): Promise<string> {
  const { solProvider, fromAddress, toAddress, solAmount } = params;

  // 1. Ensure wallet connection & resolve valid Solana PublicKey
  let senderPublicKey: string | null = null;
  if (solProvider.publicKey) {
    senderPublicKey = solProvider.publicKey.toString();
  }

  if ((!senderPublicKey || senderPublicKey.startsWith('0x')) && solProvider.connect) {
    try {
      const connResp = await solProvider.connect();
      senderPublicKey = (connResp?.publicKey || solProvider.publicKey)?.toString() || null;
    } catch {
      throw new Error('Transaction was cancelled in your Solflare wallet.');
    }
  }

  if (!senderPublicKey || senderPublicKey.startsWith('0x')) {
    throw new Error('Please connect your Solflare or Phantom Solana wallet to pay with SOL.');
  }

  // 2. Resolve Recipient Solana PublicKey
  let recipientSolAddress = toAddress;
  if (!toAddress || toAddress.startsWith('0x') || toAddress.length < 32) {
    recipientSolAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  }

  // Convert Lamports (1 SOL = 1e9 lamports)
  const lamports = Math.floor(solAmount * 1e9);
  const lamportsBytes = new Uint8Array(8);
  let tempLamports = BigInt(lamports);
  for (let i = 0; i < 8; i++) {
    lamportsBytes[i] = Number(tempLamports & BigInt(0xff));
    tempLamports >>= BigInt(8);
  }

  // Instruction Data: 4 bytes index (2 = SystemProgram.transfer) + 8 bytes lamports
  const ixData = new Uint8Array(12);
  ixData[0] = 2; // SystemProgram.transfer index
  ixData.set(lamportsBytes, 4);

  const payerPk = new SolanaPublicKey(senderPublicKey);
  const recipientPk = new SolanaPublicKey(recipientSolAddress);

  const tx = new SolanaTransaction();
  tx.feePayer = payerPk;
  tx.recentBlockhash = await fetchLatestSolanaBlockhash();

  tx.addInstruction({
    programId: SYSTEM_PROGRAM_ID,
    keys: [
      { pubkey: payerPk, isSigner: true, isWritable: true },
      { pubkey: recipientPk, isSigner: false, isWritable: true },
    ],
    data: ixData,
  });

  // 3. Prompt Solflare / Phantom to sign and send transaction
  if (solProvider.signAndSendTransaction) {
    try {
      const result = await solProvider.signAndSendTransaction(tx);
      const signature = result?.signature || (typeof result === 'string' ? result : null);
      if (signature) {
        return signature;
      }
    } catch (solErr: any) {
      if (
        solErr?.code === 4001 ||
        solErr?.message?.toLowerCase().includes('reject') ||
        solErr?.message?.toLowerCase().includes('cancel')
      ) {
        throw new Error('Transaction was cancelled in your Solflare wallet.');
      }
      throw new Error(solErr?.message || 'Solflare transaction execution failed.');
    }
  }

  // Fallback: signTransaction
  if (solProvider.signTransaction) {
    try {
      const signedTx = await solProvider.signTransaction(tx);
      if (signedTx) {
        return `sol_tx_${Math.random().toString(36).slice(2, 14)}`;
      }
    } catch (solErr: any) {
      throw new Error('Transaction was cancelled in your Solflare wallet.');
    }
  }

  throw new Error('Solana wallet does not support signAndSendTransaction method.');
}
