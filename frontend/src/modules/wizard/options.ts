// Choices for the instance settings, shared by the setup wizard and the
// settings page. The API accepts the same locales (see settings.Locales).

export const TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC']

export const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

// timezoneOptions returns TIMEZONES plus current when it isn't listed:
// browsers leave out some valid zones (Chrome doesn't list "UTC"), and a
// select must always show the stored value.
export function timezoneOptions(current: string): string[] {
  return current && !TIMEZONES.includes(current) ? [current, ...TIMEZONES] : TIMEZONES
}
