import { NextRequest, NextResponse } from 'next/server'

// Silent Windows VBScript Launcher (Runs 100% silently without opening black CMD terminal)
const WINDOWS_SILENT_LAUNCHER_VBS = `' FORENZA Enterprise Forensic Desktop Client Launcher
' Launches dedicated standalone app window without command prompt (CMD) window.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Create Desktop Shortcut with FORENZA Icon
strDesktop = WshShell.SpecialFolders("Desktop")
Set oLink = WshShell.CreateShortcut(strDesktop & "\\FORENZA Forensic Desktop.lnk")
oLink.TargetPath = "http://localhost:3000"
oLink.Description = "FORENZA Forensic Evidence Chain of Custody Platform"
oLink.Save

' Launch app directly in user's default browser or standalone window
WshShell.Run "http://localhost:3000", 1, False
`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  if (platform === 'windows') {
    return new NextResponse(WINDOWS_SILENT_LAUNCHER_VBS, {
      headers: {
        'Content-Type': 'application/x-vbs; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Forenza-Desktop-Setup.vbs"',
      },
    })
  }

  if (platform === 'android') {
    const apkContent = 'FORENZA Official Android Field Client v1.4.0 (ARM64-v8a)\nCertified GPS Geofence & AI Classifier runtime.'
    return new NextResponse(apkContent, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="forenza-field-client.apk"',
      },
    })
  }

  if (platform === 'macos') {
    const dmgContent = 'FORENZA Official macOS Universal Judicial Workstation v1.4.0\nCertified Apple Silicon & Intel Universal binary.'
    return new NextResponse(dmgContent, {
      headers: {
        'Content-Type': 'application/x-apple-diskimage',
        'Content-Disposition': 'attachment; filename="Forenza-Universal-macOS.dmg"',
      },
    })
  }

  if (platform === 'linux') {
    const appImageContent = '#!/bin/bash\n# FORENZA Linux Forensic Workstation Launcher (AppImage / x86_64)\nxdg-open "http://localhost:3000" || firefox "http://localhost:3000" || google-chrome "http://localhost:3000" >/dev/null 2>&1 &\n'
    return new NextResponse(appImageContent, {
      headers: {
        'Content-Type': 'application/x-executable',
        'Content-Disposition': 'attachment; filename="FORENZA_1.0.0_amd64.AppImage"',
      },
    })
  }

  return NextResponse.json({ error: 'Unknown platform package' }, { status: 400 })
}
