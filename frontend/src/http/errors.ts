import { ApiError } from './client'

const FALLBACK = 'Une erreur est survenue. Veuillez réessayer.'

// French messages for every error code the API (or the HTTP client) can
// return. The API's own messages are English and developer-facing, so the
// UI never shows them; an unknown code falls back to a generic message.
//
// Keep in sync with the `error` enum of the Envelope schema in
// api/openapi/openapi.yaml.
const MESSAGES: Record<string, string> = {
  // Client-side (see CLIENT_ERROR_CODES)
  timeout: 'La requête a expiré. Veuillez réessayer.',
  network_error: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
  invalid_response: 'Le serveur a renvoyé une réponse inattendue.',

  // Shared
  invalid_request_body: 'La requête envoyée est invalide.',
  internal_error: FALLBACK,
  missing_token: 'Votre session a expiré. Veuillez vous reconnecter.',
  invalid_token: 'Votre session a expiré. Veuillez vous reconnecter.',
  route_not_found: 'Ressource introuvable.',
  method_not_allowed: 'Action non autorisée.',

  // Setup
  admin_name_required: 'Le prénom et le nom de l\'administrateur sont obligatoires.',
  admin_email_required: 'L\'adresse e-mail de l\'administrateur est obligatoire.',
  admin_password_too_short: 'Le mot de passe doit contenir au moins 8 caractères.',
  instance_name_required: 'Le nom de l\'instance est obligatoire.',
  instance_timezone_required: 'Le fuseau horaire est obligatoire.',
  instance_locale_required: 'La langue est obligatoire.',
  already_initialized: 'Cette instance est déjà configurée.',

  // Auth
  credentials_required: 'L\'adresse e-mail et le mot de passe sont obligatoires.',
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  email_required: 'L\'adresse e-mail est obligatoire.',
  reset_token_required: 'Le lien de réinitialisation est incomplet.',
  password_too_short: 'Le mot de passe doit contenir au moins 8 caractères.',
  invalid_reset_token: 'Ce lien de réinitialisation est invalide ou a expiré.',

  // Incidents
  incident_not_found: 'Ce coelbook n\'existe pas ou a été supprimé.',
  title_required: 'Le titre est obligatoire.',
  title_too_long: 'Le titre ne doit pas dépasser 200 caractères.',
  invalid_status: 'Le statut choisi est invalide.',
  category_required: 'La catégorie est obligatoire.',
  unknown_category: 'Cette catégorie n\'existe pas.',
  too_many_tags: 'Un coelbook ne peut pas avoir plus de 20 tags.',
}

// errorMessage returns the French message to display for err, whatever
// was thrown.
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return MESSAGES[err.errorCode] ?? FALLBACK
  }

  return FALLBACK
}
