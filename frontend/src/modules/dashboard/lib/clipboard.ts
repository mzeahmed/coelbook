// copyText puts text on the clipboard. The async Clipboard API only exists
// in secure contexts (HTTPS or localhost) — not on http://coelbook.local —
// so it falls back to the legacy execCommand('copy') on a hidden textarea.
export async function copyText(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(text)

    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) throw new Error('copy command was rejected')
  } finally {
    document.body.removeChild(textarea)
  }
}
