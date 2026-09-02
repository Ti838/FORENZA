/**
 * FORENZA — Digital Signatures & Asymmetric Cryptography (Ed25519)
 *
 * Implements Ed25519 key generation, signing, and verification
 * for Device Trust (FZ-ID), Evidence Sealing (FZ-SEAL), and State Transitions (FZ-TWIN).
 */

import * as nodeCrypto from 'crypto'

export interface KeyPairHex {
  publicKeyHex: string
  privateKeyHex: string
}

export class Ed25519Signer {
  /**
   * Generate a fresh Ed25519 key pair in Hex format
   */
  static generateKeyPair(): KeyPairHex {
    const { publicKey, privateKey } = nodeCrypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    })

    return {
      publicKeyHex: publicKey.toString('hex'),
      privateKeyHex: privateKey.toString('hex'),
    }
  }

  /**
   * Sign arbitrary UTF-8 string or Buffer using Ed25519 private key in DER Hex
   */
  static sign(message: string | Uint8Array, privateKeyHex: string): string {
    const data = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message)
    const privateKey = nodeCrypto.createPrivateKey({
      key: Buffer.from(privateKeyHex, 'hex'),
      format: 'der',
      type: 'pkcs8',
    })

    const signature = nodeCrypto.sign(null, data, privateKey)
    return signature.toString('hex')
  }

  /**
   * Verify Ed25519 signature in Hex format against public key in DER Hex
   */
  static verify(
    message: string | Uint8Array,
    signatureHex: string,
    publicKeyHex: string
  ): boolean {
    try {
      const data = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message)
      const publicKey = nodeCrypto.createPublicKey({
        key: Buffer.from(publicKeyHex, 'hex'),
        format: 'der',
        type: 'spki',
      })

      const sigBuffer = Buffer.from(signatureHex, 'hex')
      return nodeCrypto.verify(null, data, publicKey, sigBuffer)
    } catch {
      return false
    }
  }
}
