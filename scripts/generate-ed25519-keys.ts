// Generate an Ed25519 keypair for signing cheat offsets payloads.
//
// Usage:
//   npx tsx scripts/generate-ed25519-keys.ts
//
// Output: base64-encoded public + private keys. Paste both into your env:
//
//   CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64=<private>  (server only, secret)
//   CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64=<public>    (shared, also embedded in C++ client)
//   CHEAT_OFFSETS_ED25519_KEY_ID=<something short, e.g. "v1">
//
// The public key is NOT a secret — the C++ client ships it in plaintext.
// The private key MUST stay server-side.

import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");

// Export as raw 32-byte buffers.
const rawPrivate = privateKey.export({ format: "der", type: "pkcs8" }).slice(-32);
const rawPublic = publicKey.export({ format: "der", type: "spki" }).slice(-32);

console.log("# Paste these into your .env / Vercel env:");
console.log(`CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64=${rawPrivate.toString("base64")}`);
console.log(`CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64=${rawPublic.toString("base64")}`);
console.log(`CHEAT_OFFSETS_ED25519_KEY_ID=v1`);
console.log();
console.log("# Embed the public key in the C++ client as a 32-byte array:");
const hex = Array.from(rawPublic)
  .map((b) => "0x" + b.toString(16).padStart(2, "0"))
  .join(", ");
console.log(`// constexpr uint8_t CHEAT_OFFSETS_PUBKEY[32] = { ${hex} };`);
