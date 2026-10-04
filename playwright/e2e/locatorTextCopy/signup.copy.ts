export const textCopy = {
  en: {
    pageTitle: "nesto | Signup",
    heading: "Create a nesto account",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    region: "Province of purchase",
    email: "Email",
    password: "Password",
    passwordHelper:
      "Password must be between 12 and 32 characters and contain one uppercase letter, one lowercase letter and one number.",
    passwordConfirmation: "Confirm password",
    submit: "Create your account",
    switchLanguageLabel: "FR",
    loginHeader: "Login",
    loginLink: "Log in",
    termsLinkText: "Terms of Service",
    privacyLinkText: "Privacy Policy",
    consentStart: "By checking this box, you agree to be contacted by nesto",
    errors: {
      required: "The field is required",
      invalidEmail: "Invalid email",
      invalidValue: "Invalid value",
      passwordMismatch: "Passwords do not match",
      weakPassword:
        "Password must contain at least one uppercase letter, one lowercase letter and one number",
      passwordMin: "Minimum of 12 letters required",
    },
    urlPrefix: "",
    termsUrl: "https://www.nesto.ca/terms-of-services/",
  },
  fr: {
    pageTitle: "nesto | Enregistrement",
    heading: "Créez un compte nesto",
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone",
    region: "Province de l'achat",
    email: "Courriel",
    password: "Mot de passe",
    passwordHelper:
      "Le mot de passe doit contenir au entre 12 et 32 caractères et contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.",
    passwordConfirmation: "Confirmation du mot de passe",
    submit: "Créez votre compte",
    switchLanguageLabel: "EN",
    loginHeader: "Connexion",
    loginLink: "Connectez-vous",
    termsLinkText: "Conditions d'utilisation",
    privacyLinkText: "politique de confidentialité",
    consentStart:
      "En cochant cette case, vous acceptez d’être contacté par les partenaires de nesto",
    errors: {
      required: "Ce champ est obligatoire",
      invalidEmail: "Courriel invalide",
      invalidValue: "Valeur invalide",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      weakPassword:
        "Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre",
      passwordMin: "Minimum de 12 lettres requises",
    },
    urlPrefix: "/fr",
    termsUrl: "https://www.nesto.ca/fr/conditions-d-utilisation/",
  },
};

export type Locale = keyof typeof textCopy;
export type SignupCopy = (typeof textCopy)["en"];