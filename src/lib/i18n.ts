import { useSchool } from '../contexts/SchoolContext';

export type Lang = 'fr' | 'en';

// Every UI string goes here as { fr, en }. Screens call t('key') and get
// the right language back automatically based on the school's setting.
// Keeping translations in one flat file (rather than scattered per
// component) makes it easy to see what's translated and what isn't.
const dict = {
  back: { fr: '← Retour', en: '← Back' },
  logout: { fr: 'Déconnexion', en: 'Log out' },
  myAccount: { fr: 'Mon compte', en: 'My account' },
  settings: { fr: 'Paramètres', en: 'Settings' },
  loading: { fr: 'Chargement…', en: 'Loading…' },

  // Login
  loginTitle: { fr: 'My School', en: 'My School' },
  loginSubtitle: { fr: 'Connectez-vous à votre espace', en: 'Sign in to your account' },
  tabStudent: { fr: 'Élève', en: 'Student' },
  tabStaff: { fr: 'Administration / Enseignant', en: 'Admin / Teacher' },
  school: { fr: 'École', en: 'School' },
  chooseOption: { fr: 'Choisir…', en: 'Choose…' },
  admissionNo: { fr: "N° d'admission", en: 'Admission number' },
  dateOfBirth: { fr: 'Date de naissance', en: 'Date of birth' },
  email: { fr: 'Email', en: 'Email' },
  password: { fr: 'Mot de passe', en: 'Password' },
  signIn: { fr: 'Se connecter', en: 'Sign in' },
  signingIn: { fr: 'Connexion…', en: 'Signing in…' },
  chooseSchoolError: { fr: 'Choisissez votre école.', en: 'Choose your school.' },
  studentLoginError: {
    fr: "Identifiants incorrects. Vérifiez l'école, le numéro d'admission et la date de naissance.",
    en: 'Incorrect details. Check the school, admission number, and date of birth.',
  },
  staffLoginError: {
    fr: 'Identifiants incorrects. Vérifiez votre email et mot de passe.',
    en: 'Incorrect details. Check your email and password.',
  },

  // Dashboard cards
  adminDashboardTitle: { fr: 'Tableau de bord — Admin', en: 'Dashboard — Admin' },
  welcome: { fr: 'Bienvenue', en: 'Welcome' },
  students: { fr: 'Élèves', en: 'Students' },
  teachers: { fr: 'Enseignants', en: 'Teachers' },
  classes: { fr: 'Classes', en: 'Classes' },
  results: { fr: 'Résultats', en: 'Results' },
  teacherDashboardTitle: { fr: 'Espace Enseignant', en: 'Teacher Space' },
  myClasses: { fr: 'Mes classes', en: 'My classes' },
  enterScores: { fr: 'Saisir les notes', en: 'Enter scores' },
  noClassesAssigned: {
    fr: 'Aucune classe assignée pour le moment.',
    en: 'No classes assigned yet.',
  },
  studentDashboardTitle: { fr: 'Mon espace', en: 'My Space' },
  myResults: { fr: 'Mes résultats', en: 'My results' },
  average: { fr: 'Moyenne', en: 'Average' },
  noPublishedResults: {
    fr: "Aucun résultat publié pour le moment. Vos résultats apparaîtront ici dès que votre établissement les publiera.",
    en: 'No published results yet. Your results will appear here once your school publishes them.',
  },
  term: { fr: 'Trimestre', en: 'Term' },
  ca: { fr: 'CA', en: 'CA' },
  exam: { fr: 'Examen', en: 'Exam' },

  // Élèves
  createClassFirst: {
    fr: "Créez d'abord au moins une classe avant d'ajouter des élèves.",
    en: 'Create at least one class before adding students.',
  },
  goToClasses: { fr: 'Aller à Classes', en: 'Go to Classes' },
  fullName: { fr: 'Nom complet', en: 'Full name' },
  chooseClass: { fr: 'Classe…', en: 'Class…' },
  allFieldsRequired: { fr: 'Tous les champs sont requis.', en: 'All fields are required.' },
  addStudent: { fr: "Ajouter l'élève", en: 'Add student' },
  noStudentsYet: { fr: 'Aucun élève pour le moment.', en: 'No students yet.' },
  accountCreated: { fr: 'Compte créé', en: 'Account created' },
  pending: { fr: 'En attente', en: 'Pending' },
  importExcel: { fr: 'Importer (Excel) →', en: 'Import (Excel) →' },
  generateAccounts: { fr: 'Créer les comptes →', en: 'Create accounts →' },

  // Enseignants
  staffIdLabel: { fr: 'Matricule', en: 'Staff ID' },
  assignedClasses: { fr: 'Classes assignées', en: 'Assigned classes' },
  noClassesCreatedYet: {
    fr: 'Aucune classe créée pour le moment.',
    en: 'No classes created yet.',
  },
  subjectsTaught: { fr: 'Matières enseignées', en: 'Subjects taught' },
  noSubjectsCreatedYet: {
    fr: 'Aucune matière créée pour le moment.',
    en: 'No subjects created yet.',
  },
  staffIdNameRequired: {
    fr: 'Le matricule et le nom sont requis.',
    en: 'Staff ID and name are required.',
  },
  addTeacher: { fr: "Ajouter l'enseignant", en: 'Add teacher' },
  noTeachersYet: { fr: 'Aucun enseignant pour le moment.', en: 'No teachers yet.' },
  noClass: { fr: 'Aucune classe', en: 'No class' },
  subjectsLink: { fr: 'Matières →', en: 'Subjects →' },

  // Classes
  classNamePlaceholder: { fr: 'Nom de la classe (ex: 3ème A)', en: 'Class name (e.g. Grade 9A)' },
  levelPlaceholder: { fr: 'Niveau (ex: 3ème)', en: 'Level (e.g. Grade 9)' },
  add: { fr: 'Ajouter', en: 'Add' },
  noClassesYet: { fr: 'Aucune classe pour le moment.', en: 'No classes yet.' },

  // Matières
  subjects: { fr: 'Matières', en: 'Subjects' },
  subjectNamePlaceholder: {
    fr: 'Nom de la matière (ex: Mathématiques)',
    en: 'Subject name (e.g. Mathematics)',
  },
  coefficient: { fr: 'Coefficient', en: 'Coefficient' },
  noSubjectsYet: { fr: 'Aucune matière pour le moment.', en: 'No subjects yet.' },
  coeffShort: { fr: 'Coeff.', en: 'Coef.' },

  // Résultats (admin)
  noResultsYet: {
    fr: "Aucune note saisie pour le moment. Les enseignants doivent d'abord soumettre leurs notes.",
    en: 'No scores entered yet. Teachers need to submit their scores first.',
  },
  studentsCount: { fr: 'élève(s)', en: 'student(s)' },
  someInDraft: { fr: 'certains en brouillon', en: 'some still in draft' },
  published: { fr: 'Publié', en: 'Published' },
  publish: { fr: 'Publier', en: 'Publish' },
  publishing: { fr: 'Publication…', en: 'Publishing…' },
  awaitingSubmission: {
    fr: "En attente de soumission par l'enseignant",
    en: 'Awaiting teacher submission',
  },

  // Génération de comptes (élèves/enseignants)
  createStudentAccounts: { fr: 'Créer les comptes élèves', en: 'Create student accounts' },
  createTeacherAccounts: { fr: 'Créer les comptes enseignants', en: 'Create teacher accounts' },
  outOf: { fr: 'sur', en: 'out of' },
  totalLabel: { fr: 'au total', en: 'total' },
  studentAccountRules: {
    fr: "Identifiant : n° d'admission. Mot de passe par défaut : date de naissance (JJMMAAAA sans tirets). Limite : 100 comptes par heure.",
    en: 'Login: admission number. Default password: date of birth (YYYYMMDD, no dashes). Limit: 100 accounts per hour.',
  },
  teacherAccountRules: {
    fr: 'Identifiant : matricule. Mot de passe par défaut : ens-[matricule]. Limite : 100 comptes par heure.',
    en: 'Login: staff ID. Default password: ens-[staffID]. Limit: 100 accounts per hour.',
  },
  createAccountsButton: { fr: 'Créer les comptes', en: 'Create accounts' },
  creatingProgress: { fr: 'Création…', en: 'Creating…' },
  hourlyLimitReached: {
    fr: 'Limite horaire atteinte (100/heure) — réessayez plus tard',
    en: 'Hourly limit reached (100/hour) — try again later',
  },
  unknownError: { fr: 'Erreur inconnue', en: 'Unknown error' },

  // Import Excel
  importStudentsTitle: { fr: 'Importer des élèves', en: 'Import students' },
  importInstructions: {
    fr: 'Fichier Excel (.xlsx) ou CSV avec les colonnes :',
    en: 'Excel (.xlsx) or CSV file with the columns:',
  },
  importColumnsList: {
    fr: 'N° admission, Nom, Date de naissance, Classe',
    en: 'Admission No, Name, Date of Birth, Class',
  },
  importNote: {
    fr: 'Les classes doivent déjà exister dans l\'application (même orthographe). Date de naissance : JJ/MM/AAAA ou AAAA-MM-JJ.',
    en: 'Classes must already exist in the app (same spelling). Date of birth: DD/MM/YYYY or YYYY-MM-DD.',
  },
  chooseFile: { fr: 'Choisir un fichier', en: 'Choose a file' },
  validRows: { fr: 'valide(s)', en: 'valid' },
  errorRows: { fr: 'en erreur', en: 'with errors' },
  importButton: { fr: 'Importer', en: 'Import' },
  imported: { fr: 'Importé ✓', en: 'Imported ✓' },
  importing: { fr: 'Importation…', en: 'Importing…' },
  missingColumns: {
    fr: 'Colonnes introuvables. Le fichier doit contenir : N° admission, Nom, Date de naissance, Classe.',
    en: 'Columns not found. The file must contain: Admission No, Name, Date of Birth, Class.',
  },
  missingAdmissionNo: { fr: "N° d'admission manquant.", en: 'Admission number missing.' },
  missingName: { fr: 'Nom manquant.', en: 'Name missing.' },
  invalidDob: {
    fr: 'Date de naissance invalide ou manquante.',
    en: 'Invalid or missing date of birth.',
  },
  classNotFound: {
    fr: "introuvable — créez-la d'abord.",
    en: 'not found — create it first.',
  },
  classLabel: { fr: 'Classe', en: 'Class' },

  // Mon compte
  changePassword: { fr: 'Changer le mot de passe', en: 'Change password' },
  currentPassword: { fr: 'Mot de passe actuel', en: 'Current password' },
  newPassword: { fr: 'Nouveau mot de passe', en: 'New password' },
  confirmNewPassword: {
    fr: 'Confirmer le nouveau mot de passe',
    en: 'Confirm new password',
  },
  updatePassword: { fr: 'Mettre à jour le mot de passe', en: 'Update password' },
  saving: { fr: 'Enregistrement…', en: 'Saving…' },
  passwordUpdated: { fr: 'Mot de passe mis à jour.', en: 'Password updated.' },
  passwordTooShort: {
    fr: 'Le nouveau mot de passe doit avoir au moins 6 caractères.',
    en: 'The new password must be at least 6 characters.',
  },
  passwordsDontMatch: {
    fr: 'Les deux mots de passe ne correspondent pas.',
    en: "The two passwords don't match.",
  },
  wrongCurrentPassword: { fr: 'Mot de passe actuel incorrect.', en: 'Current password is incorrect.' },
  updateFailed: { fr: 'Échec de la mise à jour. Réessayez.', en: 'Update failed. Please try again.' },
  changeEmail: { fr: "Changer l'adresse email", en: 'Change email address' },
  currentEmailLabel: { fr: 'Email actuel :', en: 'Current email:' },
  newEmail: { fr: 'Nouvelle adresse email', en: 'New email address' },
  updateEmailButton: { fr: "Mettre à jour l'email", en: 'Update email' },
  invalidEmail: { fr: 'Adresse email invalide.', en: 'Invalid email address.' },
  emailUpdated: {
    fr: 'Email mis à jour. Utilisez cette nouvelle adresse pour vous connecter la prochaine fois.',
    en: 'Email updated. Use this new address to sign in next time.',
  },
  emailAlreadyInUse: {
    fr: 'Cette adresse email est déjà utilisée.',
    en: 'This email address is already in use.',
  },

  // Saisie des notes (enseignant)
  scoresEntryTitle: { fr: 'Saisie des notes', en: 'Score entry' },
  subject: { fr: 'Matière', en: 'Subject' },
  chooseSubject: { fr: 'Choisir une matière…', en: 'Choose a subject…' },
  sessionNotConfigured: { fr: 'Session non configurée', en: 'Session not configured' },
  weighting: { fr: 'Pondération', en: 'Weighting' },
  somePublishedWarning: {
    fr: 'Certaines notes de cette matière sont déjà publiées et ne peuvent plus être modifiées.',
    en: 'Some scores for this subject are already published and can no longer be edited.',
  },
  noStudentsInClass: { fr: 'Aucun élève dans cette classe.', en: 'No students in this class.' },
  saveDraft: { fr: 'Enregistrer le brouillon', en: 'Save draft' },
  submitToAdmin: { fr: "Soumettre à l'administration", en: 'Submit to administration' },
  submitting: { fr: 'Soumission…', en: 'Submitting…' },
  draftSaved: { fr: 'Brouillon enregistré.', en: 'Draft saved.' },
  submittedForReview: {
    fr: "Notes soumises pour validation par l'administration.",
    en: 'Scores submitted for admin review.',
  },
  saveError: { fr: "Erreur lors de l'enregistrement.", en: 'Error while saving.' },
  submitError: { fr: 'Erreur lors de la soumission.', en: 'Error while submitting.' },

  // Paramètres de l'école
  schoolSettingsTitle: { fr: "Paramètres de l'école", en: 'School settings' },
  schoolIdentity: { fr: "Identité de l'école", en: 'School identity' },
  none: { fr: 'Aucun', en: 'None' },
  logoUrlLabel: { fr: 'URL du logo', en: 'Logo URL' },
  logoHostNote: {
    fr: "Hébergez le logo (ex: imgbb.com) puis collez le lien ici.",
    en: 'Host the logo somewhere (e.g. imgbb.com), then paste the link here.',
  },
  schoolNameLabel: { fr: "Nom de l'école", en: 'School name' },
  primaryColorLabel: { fr: 'Couleur principale', en: 'Primary color' },
  secondaryColorLabel: { fr: 'Couleur secondaire', en: 'Secondary color' },
  appLanguageLabel: { fr: "Langue de l'application", en: 'App language' },
  save: { fr: 'Enregistrer', en: 'Save' },
  gradeWeightingTitle: { fr: 'Pondération des notes', en: 'Grade weighting' },
  gradeWeightingNote: {
    fr: "Détermine comment la moyenne d'un élève est calculée à partir du CA (contrôle continu) et de l'examen. Les deux valeurs doivent totaliser 100.",
    en: "Determines how a student's average is calculated from CA (continuous assessment) and the exam. Both values must add up to 100.",
  },
  nigerianPreset: { fr: 'Nigérian (40 / 60)', en: 'Nigerian (40 / 60)' },
  francophonePreset: { fr: 'Francophone (33 / 67)', en: 'Francophone (33 / 67)' },
  weightSumError: {
    fr: 'CA + Examen doit être égal à 100 (actuellement',
    en: 'CA + Exam must equal 100 (currently',
  },
  saveWeighting: { fr: 'Enregistrer la pondération', en: 'Save weighting' },
} as const;

export type TranslationKey = keyof typeof dict;

export function translate(key: TranslationKey, lang: Lang): string {
  return dict[key][lang];
}

export function useTranslation() {
  const { school } = useSchool();
  const lang: Lang = school?.language ?? 'fr';
  return { t: (key: TranslationKey) => translate(key, lang), lang };
}
