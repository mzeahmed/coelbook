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
  version_not_found: 'Cette version n\'existe pas.',
  title_required: 'Le titre est obligatoire.',
  title_too_long: 'Le titre ne doit pas dépasser 200 caractères.',
  invalid_status: 'Le statut choisi est invalide.',
  category_required: 'La catégorie est obligatoire.',
  unknown_category: 'Cette catégorie n\'existe pas.',
  too_many_tags: 'Un coelbook ne peut pas avoir plus de 20 tags.',
  too_many_snippets: 'Un coelbook ne peut pas avoir plus de 20 snippets.',
  snippet_title_required: 'Le titre du snippet est obligatoire.',
  snippet_content_required: 'Le contenu du snippet est obligatoire.',
  too_many_links: 'Un coelbook ne peut pas avoir plus de 20 liens.',
  link_url_required: 'L\'URL du lien est obligatoire.',
  invalid_link_url: 'L\'URL doit commencer par http:// ou https://.',

  // Categories
  category_name_required: 'Le nom de la catégorie est obligatoire.',
  category_name_too_long: 'Le nom ne doit pas dépasser 100 caractères.',
  category_description_too_long: 'La description ne doit pas dépasser 500 caractères.',
  category_name_taken: 'Une catégorie porte déjà ce nom.',
  category_not_found: 'Cette catégorie n\'existe pas ou a été supprimée.',
  category_in_use: 'Cette catégorie est utilisée par des coelbooks : déplacez-les avant de la supprimer.',

  // Tags
  tag_not_found: 'Ce tag n\'existe pas ou a été supprimé.',
  tag_name_required: 'Le nom du tag est obligatoire.',
  tag_name_too_long: 'Le nom du tag ne doit pas dépasser 50 caractères.',
  tag_name_invalid: 'Le nom du tag doit contenir au moins une lettre ou un chiffre.',
  tag_exists: 'Un tag porte déjà ce nom.',
  tag_merge_target_required: 'Choisissez le tag dans lequel fusionner.',
  tag_merge_into_itself: 'Un tag ne peut pas être fusionné avec lui-même.',

  // Account
  first_name_required: 'Le prénom est obligatoire.',
  last_name_required: 'Le nom est obligatoire.',
  name_too_long: 'Ce champ ne doit pas dépasser 100 caractères.',
  invalid_email: 'Saisissez une adresse e-mail valide.',
  email_taken: 'Un autre compte utilise déjà cette adresse e-mail.',
  current_password_required: 'Saisissez votre mot de passe actuel.',
  wrong_current_password: 'Le mot de passe actuel est incorrect.',

  // Instance settings
  instance_name_too_long: 'Le nom de l\'instance ne doit pas dépasser 100 caractères.',
  invalid_timezone: 'Ce fuseau horaire est inconnu.',
  invalid_locale: 'Cette langue n\'est pas prise en charge.',
  not_initialized: 'L\'instance n\'est pas encore configurée.',
}

// errorMessage returns the French message to display for err, whatever
// was thrown.
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return MESSAGES[err.errorCode] ?? FALLBACK
  }

  return FALLBACK
}
