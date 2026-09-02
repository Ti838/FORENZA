/**
 * FORENZA Device & Hardware Fingerprint Detector
 * Extracts actual human-readable device names, OS, and browser architectures.
 */
export function getDetailedDeviceName(): string {
  if (typeof window === 'undefined') return 'Forensic Secure Server Gateway'

  const ua = navigator.userAgent
  let os = 'Unknown OS'
  let deviceType = 'Desktop Workstation'
  let browser = 'Browser'

  // 1. Detect OS & Hardware Platform
  if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 11 / 10 PC'
  } else if (/Windows NT 6.3/i.test(ua)) {
    os = 'Windows 8.1 PC'
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = /arm64|apple/i.test(ua) ? 'MacBook Pro (Apple Silicon)' : 'macOS Workstation'
  } else if (/Android/i.test(ua)) {
    os = 'Android Field Mobile'
    deviceType = 'Mobile Terminal'
  } else if (/iPhone|iPad/i.test(ua)) {
    os = /iPad/i.test(ua) ? 'Apple iPad Forensic Tablet' : 'Apple iPhone Secure Field Unit'
    deviceType = 'Mobile Terminal'
  } else if (/Linux/i.test(ua)) {
    os = 'Linux Forensic Workstation'
  }

  // 2. Detect Browser Engine
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge'
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Google Chrome'
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Apple Safari'
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox'
  }

  // 3. Screen resolution hint
  const res = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : ''

  return `${os} (${browser}${res ? ` • ${res}` : ''})`
}
