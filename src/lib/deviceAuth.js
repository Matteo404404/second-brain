const DEVICE_ID_KEY = 'sb_device_id'

export const PAIRING_CODE =
  import.meta.env.VITE_PAIRING_CODE ??
  import.meta.env.VITE_PUBLIC_PAIRING_CODE ??
  ''

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function clearDeviceId() {
  localStorage.removeItem(DEVICE_ID_KEY)
}

export async function isDeviceTrusted(supabase) {
  if (!supabase) return false
  const deviceId = getDeviceId()
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle()
  if (error) {
    console.error('isDeviceTrusted:', error.message)
    return false
  }
  return Boolean(data)
}

export async function pairDevice(supabase, code, label = '') {
  if (!supabase) throw new Error('Supabase non configurato')
  if (!PAIRING_CODE) throw new Error('Codice pairing non configurato nel build')
  if (code.trim() !== PAIRING_CODE) throw new Error('Codice sbagliato')

  const { count, error: countErr } = await supabase
    .from('trusted_devices')
    .select('*', { count: 'exact', head: true })
  if (countErr) throw countErr
  if (count >= 2) throw new Error('Gia 2 dispositivi registrati (PC + telefono)')

  const deviceId = getDeviceId()
  const { error } = await supabase.from('trusted_devices').insert({
    device_id: deviceId,
    device_name: label || guessDeviceName(),
  })
  if (error) throw error
}

function guessDeviceName() {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('android')) return 'Android'
  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('mobile')) return 'Mobile'
  return 'Desktop'
}
