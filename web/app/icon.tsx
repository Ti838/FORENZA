import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation for dynamic FORENZA Favicon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: '#0B0F19',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1.5px solid #3B82F6',
          color: '#60A5FA',
          fontWeight: 900,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      >
        🛡️
      </div>
    ),
    {
      ...size,
    }
  )
}
