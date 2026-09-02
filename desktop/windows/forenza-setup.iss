; ===============================================================
; FORENZA — Institutional Forensic Desktop Installer Script
; Inno Setup 6.x / WiX Compatible Installer Script (VS Code Style)
; ===============================================================

#define MyAppName "FORENZA Forensic Desktop"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "FORENZA Enterprise Forensics"
#define MyAppURL "https://forenza.legal"
#define MyAppExeName "FORENZA.exe"

[Setup]
; Basic Application Info
AppId={{D81456A7-3B21-4E18-9124-78345E9F0001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Destination Folder (like VS Code -> Program Files\FORENZA)
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
InfoBeforeFile=FORENSIC_DISCLAIMER.txt
OutputDir=dist
OutputBaseFilename=FORENZA-Setup-{#MyAppVersion}
SetupIconFile=icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
; Desktop & Start Menu Shortcut Checkboxes (VS Code style)
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon"; Description: "Add FORENZA to Windows Start Menu"; GroupDescription: "{cm:AdditionalIcons}"
Name: "registerprotocol"; Description: "Register forenza:// secure judicial deep-link protocol"; GroupDescription: "System Integration:"

[Files]
Source: "..\src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\src-tauri\target\release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
; Register forenza:// URI scheme for single-sign-on
Root: HKCU; Subkey: "Software\Classes\forenza"; ValueType: string; ValueName: ""; ValueData: "URL:FORENZA Protocol"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\forenza"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\forenza\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Flags: uninsdeletekey

[Run]
; Launch FORENZA immediately after setup finishes checkbox (VS Code style)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
