// AetherMind: share-result helper · T1 LANE
// Builds the brag string (zero em dashes) and copies it to the clipboard, with a
// legacy execCommand fallback for non-secure contexts. Shared by GameOver +
// GauntletComplete so the copy logic lives in exactly one place.

export function buildShareText({ xp, realm, accuracy, level }) {
  const r = realm || 'the'
  return `I just scored ${xp} XP in AetherMind, ${r} realm, ${accuracy}% accuracy, Level ${level}\nCan you beat me? aethermind-five.vercel.app`
}

export async function copyShareResult(fields) {
  const text = buildShareText(fields)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) { /* clipboard API blocked; fall through to the legacy path */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'; ta.style.top = '-9999px'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus(); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch (e) { return false }
}
