/**
 * FORENZA — Device Trust & Identity Engine (FZ-ID)
 *
 * Enforces hardware-backed and cryptographic device registration,
 * status lifecycle management, key rotation, and session authentication.
 */

export type DeviceTrustStatus =
  | 'PENDING'
  | 'TRUSTED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'COMPROMISED'

export type DevicePlatform =
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'web'

export interface DeviceKeyRecord {
  id: string
  device_id: string
  user_id: string
  device_public_key: string
  algorithm: 'Ed25519'
  key_version: number
  platform: DevicePlatform
  device_type: string
  device_model?: string
  attestation_status: 'HARDWARE_ATTESTED' | 'SOFTWARE_ATTESTED' | 'UNATTESTED'
  status: DeviceTrustStatus
  registered_at: string
  last_seen_at: string
}

export interface DeviceTrustEvaluation {
  isAllowed: boolean
  status: DeviceTrustStatus
  reason?: string
}

export class DeviceTrustService {
  /**
   * Evaluate whether a device is authorized to perform sensitive forensic operations
   */
  static evaluateTrust(device: DeviceKeyRecord | null): DeviceTrustEvaluation {
    if (!device) {
      return {
        isAllowed: false,
        status: 'PENDING',
        reason: 'Device is not registered in FORENZA security registry.',
      }
    }

    switch (device.status) {
      case 'TRUSTED':
        return { isAllowed: true, status: 'TRUSTED' }
      case 'PENDING':
        return {
          isAllowed: false,
          status: 'PENDING',
          reason: 'Device registration is pending supervisor/administrator approval.',
        }
      case 'SUSPENDED':
        return {
          isAllowed: false,
          status: 'SUSPENDED',
          reason: 'Device access is temporarily suspended by compliance policy.',
        }
      case 'REVOKED':
        return {
          isAllowed: false,
          status: 'REVOKED',
          reason: 'Device authorization has been permanently revoked.',
        }
      case 'COMPROMISED':
        return {
          isAllowed: false,
          status: 'COMPROMISED',
          reason: 'SECURITY ALERT: Device has been flagged as compromised.',
        }
      default:
        return {
          isAllowed: false,
          status: 'PENDING',
          reason: 'Unknown device trust state.',
        }
    }
  }

  /**
   * Determine platform secure storage mechanism documentation
   */
  static getSecureStorageMethod(platform: DevicePlatform): string {
    switch (platform) {
      case 'android':
        return 'Android Keystore System (Hardware-backed StrongBox / TEE)'
      case 'ios':
        return 'Apple Keychain (Secure Enclave)'
      case 'macos':
        return 'macOS Keychain Services'
      case 'windows':
        return 'Windows DPAPI / Windows Hello Credential Manager'
      case 'linux':
        return 'Freedesktop Secret Service API / Kernel Keyring'
      case 'web':
        return 'WebAuthn / Passkeys Credential Storage & HttpOnly Secure Cookies'
    }
  }
}
