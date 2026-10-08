"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LayoutDashboard,
  Swords,
  Trophy,
  Wallet,
  Settings,
  Bell,
  ChevronDown,
  Search,
  Lock,
  Lightbulb,
  CheckCircle2,
  X,
  Terminal as TerminalIcon,
  Flag,
  ArrowLeft,
  Zap,
  Sun,
  Moon,
  Laptop,
  SlidersHorizontal,
  ShieldCheck,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Check,
  Eye,
  EyeOff,
  Globe,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";

/**
 * CyberEarn — Dashboard & Sandbox (single-file build)
 * -----------------------------------------------------------------------
 * Everything — i18n, theme tokens, mock data, context, and every
 * sub-component (Header, Sidebar, AuthModal, SettingsModal,
 * ChallengeCatalog, SandboxView, SuccessModal, panels) — lives in this one
 * file so it can be dropped straight into app/dashboard/page.tsx and run
 * with zero other local imports (only "react" and "lucide-react" are
 * external dependencies).
 *
 * This is the same code as the modular version, concatenated in
 * dependency order (data/i18n/theme → context → small controls → modals →
 * header/sidebar → landing → catalog/sandbox/success → panels → page).
 * For anything beyond a quick test, splitting this back into the
 * multi-file structure is still the better long-term setup.
 * -----------------------------------------------------------------------
 */

/* ---------------------------------------------------------------------------- */
/*  INTERNATIONALIZATION (i18n) — languages, translations, translate()
    (source: lib/i18n.ts)  */
/* ---------------------------------------------------------------------------- */

type LangCode =
  | "en-US"
  | "en-GB"
  | "az"
  | "tr"
  | "ru"
  | "zh"
  | "de"
  | "es";

const LANGUAGES: { code: LangCode; flag: string; label: string }[] = [
  { code: "en-US", flag: "🇺🇸", label: "English (US)" },
  { code: "en-GB", flag: "🇬🇧", label: "English (UK)" },
  { code: "az", flag: "🇦🇿", label: "Azərbaycan" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

const DEFAULT_LANG: LangCode = "en-US";

const en_US = {
  common: { search: "Search challenges…", success: "Done successfully!" },
  nav: {
    dashboard: "Dashboard",
    challenges: "Challenges / Sandboxes",
    leaderboard: "Leaderboard",
    wallet: "Wallet & Cashout",
    settings: "Settings",
  },
  header: { signIn: "Sign in", getStarted: "Get started" },
  auth: {
    loginTitle: "Welcome back",
    registerTitle: "Create your account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    username: "Username",
    loginButton: "Sign in",
    registerButton: "Create account",
    continueGuest: "Continue as guest",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    orDivider: "or",
    error: "Please fill in all fields.",
    mismatch: "Passwords don't match.",
  },
  profile: {
    profileSettings: "Profile settings",
    settings: "Settings",
    signOut: "Sign out",
  },
  notifications: {
    title: "Notifications",
    markAllRead: "Mark all as read",
    item1:
      'Your "Auth Log Hunt" submission was verified — $15.00 USDT credited.',
    item2: "New sponsor bounty added to the Smart Contracts track.",
    item3: "You climbed to rank #412 on the global leaderboard.",
    item4: "Weekly payout batch processed successfully.",
  },
  language: { select: "Language" },
  landing: {
    badge: "Learn cybersecurity. Get paid to practice.",
    title: "Master real-world hacking. In your browser.",
    subtitle:
      "Solve live sandbox challenges across Linux, web security, smart contracts, and Python — and earn real USDT for every one you crack.",
    ctaPrimary: "Get started",
    ctaSecondary: "Sign in",
  },
  catalog: {
    title: "Challenges",
    subtitle:
      "Pick a sandbox, solve it live, and get paid the moment it's verified.",
  },
  filters: { all: "All", linux: "Linux", web: "Web Security", smart: "Smart Contracts", python: "Python" },
  difficulty: { easy: "Easy", medium: "Medium", hard: "Hard" },
  challenge: { start: "Start challenge" },
  sandbox: {
    back: "Back to challenges",
    objectives: "Objectives",
    hintShow: "Show hint",
    hintHide: "Hide hint",
    submitLabel: "Submit flag / solution",
    verify: "Verify & claim reward",
    wrongFlag: "That's not the right flag — check your output and try again.",
  },
  terminal: { live: "live", placeholder: "type a command…", send: "Send" },
  success: {
    title: "Challenge completed!",
    usdt: "added to your balance",
    xp: "XP earned",
    back: "Back to challenges",
  },
  overview: {
    welcome: "Welcome back",
    subtitle: "Here's how your progress looks this week.",
    statBalance: "Wallet balance",
    statXp: "Total XP",
    statSolved: "Challenges solved",
    statRank: "Global rank",
  },
  placeholder: {
    leaderboardTitle: "Leaderboard",
    leaderboardNote: "Season 3 rankings refresh every Monday at 00:00 UTC.",
    walletTitle: "Wallet & Cashout",
    walletNote: "Cashouts settle within 24 hours.",
    settingsTitle: "Settings",
    settingsNote:
      "Profile, notification, and security preferences live here.",
  },
  settingsModal: {
    title: "Settings",
    tabAccount: "Account",
    tabPreferences: "App Preferences",
    tabSecurity: "Security",
    accountName: "Display name",
    accountEmail: "Email",
    accountRank: "Rank",
    accountAvatar: "Profile picture",
    accountAvatarChange: "Change avatar",
    accountSave: "Save changes",
    accountSaved: "Changes saved",
    languageHint: "Choose the language used across menus, buttons, and messages.",
    prefThemeLabel: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    prefNotifLabel: "Notifications",
    notifEmailLabel: "Email notifications",
    notifBrowserLabel: "Browser notifications",
    done: "Done",
    accountFirstName: "First name",
    accountLastName: "Last name",
    accountAvatarRemove: "Remove",
    accountAvatarHint: "PNG, JPG or WebP, up to 2 MB.",
    accountAvatarInvalid: "Choose a PNG, JPG or WebP image up to 2 MB.",
    accountEmailInvalid: "Enter a valid email address.",
    accountNameRequired: "First name is required.",
  },
  security: {
    title: "Security",
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    updateButton: "Update password",
    mismatch: "New passwords don't match.",
    weakPassword: "New password must be at least 8 characters.",
    success: "Password updated.",
    twoFactor: "Two-factor authentication",
    twoFactorOn: "Enabled",
    twoFactorOff: "Disabled",
    enableButton: "Enable 2FA",
    disableButton: "Disable 2FA",
  },
  sidebar: {
    nextTierTitle: "Next payout tier",
    nextTierNote: "Reach level 15 to unlock $50+ sponsor bounties.",
  },
  twoFa: {
    title: "Enable two-factor authentication",
    guestEmailNote: "You can use any email address you have access to.",
    intro: "We'll send a 6-digit code to the email address you registered with.",
    sendCode: "Send code",
    sending: "Sending…",
    sentTo: "We sent a 6-digit code to",
    codeLabel: "Verification code",
    verify: "Verify & enable",
    resend: "Resend code",
    resendIn: "Resend in",
    invalidCode: "That code isn't correct. Try again.",
    tooMany: "Too many attempts. Request a new code.",
    cancel: "Cancel",
    back: "Back",
    demoNote: "Demo mode — no server connected. Your code:",
    enabledToast: "Two-factor authentication enabled!",
  },
  walletModal: {
    title: "Wallet",
    totalBalance: "Total balance",
    withdraw: "Withdraw funds",
    amount: "Amount (USDT)",
    method: "Payout method",
    methodUsdt: "Crypto (USDT)",
    methodCard: "Bank card",
    submit: "Request withdrawal",
    historyTitle: "Transaction history",
    historyEmpty: "No transactions yet.",
    insufficientBalance: "You don't have enough balance for this withdrawal.",
    invalidAmount: "Enter a valid amount.",
    withdrawSuccess: "Withdrawal request sent!",
    tabWithdraw: "Withdraw",
    tabDeposit: "Deposit",
    tabHistory: "History",
    walletAddress: "Wallet address",
    walletAddressCard: "Card number",
    network: "Network",
    networkTrc20: "TRC20",
    networkErc20: "ERC20",
    networkBep20: "BEP20",
    minWithdraw: "Min. withdrawal: $10.00",
    addressRequired: "Enter a wallet address or card number.",
    belowMinimum: "Minimum withdrawal is $10.00.",
    depositTitle: "Balance top-up",
    depositAmount: "Amount (USDT)",
    depositButton: "Add funds",
    depositNote: "Demo top-up — instantly adds funds to your balance for testing.",
    depositSuccess: "Balance topped up!",
    statusCompleted: "Completed",
    statusPending: "Pending",
  },
  xpModal: {
    title: "Level & XP",
    nextRewardTitle: "Next level reward",
    nextRewardLabel: "Reach level {level}: +${amount} bonus & VIP badge",
    currentLevel: "Current level",
    nextLevel: "Next level",
    progressLabel: "{cur} / {goal} XP to next level",
    historyTitle: "XP earned",
    historyEmpty: "Solve a challenge to start earning XP.",
  },
  leaderboardModal: {
    title: "Top 100 leaderboard",
    yourRank: "Your rank",
    periodWeekly: "Weekly",
    periodMonthly: "Monthly",
    periodAll: "All-time",
  },
  rank: {
    redTeamer: "Red Teamer",
    bugHunter: "Bug Hunter",
    pentester: "Pentester",
    rookie: "Rookie",
    eliteHacker: "Elite Hacker",
  },
};

const en_GB: typeof en_US = { ...en_US };

const de: typeof en_US = {
  common: { search: "Challenges suchen…", success: "Erfolgreich ausgeführt!" },
  nav: {
    dashboard: "Dashboard",
    challenges: "Challenges / Sandboxes",
    leaderboard: "Bestenliste",
    wallet: "Wallet & Auszahlung",
    settings: "Einstellungen",
  },
  header: { signIn: "Anmelden", getStarted: "Loslegen" },
  auth: {
    loginTitle: "Willkommen zurück",
    registerTitle: "Konto erstellen",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    username: "Benutzername",
    loginButton: "Anmelden",
    registerButton: "Konto erstellen",
    continueGuest: "Als Gast fortfahren",
    noAccount: "Noch kein Konto?",
    haveAccount: "Bereits ein Konto?",
    orDivider: "oder",
    error: "Bitte fülle alle Felder aus.",
    mismatch: "Die Passwörter stimmen nicht überein.",
  },
  profile: {
    profileSettings: "Profileinstellungen",
    settings: "Einstellungen",
    signOut: "Abmelden",
  },
  notifications: {
    title: "Benachrichtigungen",
    markAllRead: "Alle als gelesen markieren",
    item1:
      'Deine Einsendung „Auth Log Hunt" wurde verifiziert — 15,00 USDT gutgeschrieben.',
    item2: "Neue Sponsor-Prämie im Bereich Smart Contracts.",
    item3: "Du bist auf Rang #412 der globalen Bestenliste aufgestiegen.",
    item4: "Wöchentliche Auszahlung erfolgreich verarbeitet.",
  },
  language: { select: "Sprache" },
  landing: {
    badge: "Cybersicherheit lernen. Fürs Üben bezahlt werden.",
    title: "Echtes Hacking meistern. Direkt im Browser.",
    subtitle:
      "Löse Live-Sandbox-Challenges zu Linux, Websicherheit, Smart Contracts und Python — und verdiene echtes USDT für jede gelöste Aufgabe.",
    ctaPrimary: "Loslegen",
    ctaSecondary: "Anmelden",
  },
  catalog: {
    title: "Challenges",
    subtitle:
      "Wähle eine Sandbox, löse sie live und werde sofort nach der Verifizierung bezahlt.",
  },
  filters: { all: "Alle", linux: "Linux", web: "Websicherheit", smart: "Smart Contracts", python: "Python" },
  difficulty: { easy: "Leicht", medium: "Mittel", hard: "Schwer" },
  challenge: { start: "Challenge starten" },
  sandbox: {
    back: "Zurück zu den Challenges",
    objectives: "Ziele",
    hintShow: "Hinweis anzeigen",
    hintHide: "Hinweis ausblenden",
    submitLabel: "Flag / Lösung einreichen",
    verify: "Prüfen & Belohnung einlösen",
    wrongFlag:
      "Das ist nicht die richtige Flag — überprüfe deine Ausgabe und versuche es erneut.",
  },
  terminal: { live: "live", placeholder: "Befehl eingeben…", send: "Senden" },
  success: {
    title: "Challenge abgeschlossen!",
    usdt: "deinem Guthaben gutgeschrieben",
    xp: "XP erhalten",
    back: "Zurück zu den Challenges",
  },
  overview: {
    welcome: "Willkommen zurück",
    subtitle: "So sieht dein Fortschritt diese Woche aus.",
    statBalance: "Wallet-Guthaben",
    statXp: "Gesamt-XP",
    statSolved: "Gelöste Challenges",
    statRank: "Globaler Rang",
  },
  placeholder: {
    leaderboardTitle: "Bestenliste",
    leaderboardNote:
      "Die Season-3-Rangliste wird jeden Montag um 00:00 UTC aktualisiert.",
    walletTitle: "Wallet & Auszahlung",
    walletNote: "Auszahlungen werden innerhalb von 24 Stunden abgewickelt.",
    settingsTitle: "Einstellungen",
    settingsNote:
      "Profil-, Benachrichtigungs- und Sicherheitseinstellungen findest du hier.",
  },
  settingsModal: {
    title: "Einstellungen",
    tabAccount: "Konto",
    tabPreferences: "App-Einstellungen",
    tabSecurity: "Sicherheit",
    accountName: "Anzeigename",
    accountEmail: "E-Mail",
    accountRank: "Rang",
    accountAvatar: "Profilbild",
    accountAvatarChange: "Avatar ändern",
    accountSave: "Änderungen speichern",
    accountSaved: "Änderungen gespeichert",
    languageHint: "Wähle die Sprache für Menüs, Schaltflächen und Meldungen.",
    prefThemeLabel: "Erscheinungsbild",
    themeDark: "Dunkel",
    themeLight: "Hell",
    themeSystem: "System",
    prefNotifLabel: "Benachrichtigungen",
    notifEmailLabel: "E-Mail-Benachrichtigungen",
    notifBrowserLabel: "Browser-Benachrichtigungen",
    done: "Fertig",
    accountFirstName: "Vorname",
    accountLastName: "Nachname",
    accountAvatarRemove: "Entfernen",
    accountAvatarHint: "PNG, JPG oder WebP, bis 2 MB.",
    accountAvatarInvalid: "Wähle ein PNG-, JPG- oder WebP-Bild bis 2 MB.",
    accountEmailInvalid: "Gib eine gültige E-Mail-Adresse ein.",
    accountNameRequired: "Der Vorname ist erforderlich.",
  },
  security: {
    title: "Sicherheit",
    changePassword: "Passwort ändern",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmPassword: "Neues Passwort bestätigen",
    updateButton: "Passwort aktualisieren",
    mismatch: "Die neuen Passwörter stimmen nicht überein.",
    weakPassword: "Das neue Passwort muss mindestens 8 Zeichen haben.",
    success: "Passwort aktualisiert.",
    twoFactor: "Zwei-Faktor-Authentifizierung",
    twoFactorOn: "Aktiviert",
    twoFactorOff: "Deaktiviert",
    enableButton: "2FA aktivieren",
    disableButton: "2FA deaktivieren",
  },
  sidebar: {
    nextTierTitle: "Nächste Auszahlungsstufe",
    nextTierNote: "Erreiche Level 15, um Sponsor-Prämien ab 50 $ freizuschalten.",
  },
  twoFa: {
    title: "Zwei-Faktor-Authentifizierung aktivieren",
    guestEmailNote: "Du kannst eine beliebige E-Mail-Adresse verwenden, auf die du Zugriff hast.",
    intro: "Wir senden einen 6-stelligen Code an die E-Mail-Adresse, mit der du dich registriert hast.",
    sendCode: "Code senden",
    sending: "Wird gesendet…",
    sentTo: "Wir haben einen 6-stelligen Code gesendet an",
    codeLabel: "Bestätigungscode",
    verify: "Bestätigen & aktivieren",
    resend: "Code erneut senden",
    resendIn: "Erneut senden in",
    invalidCode: "Der Code ist falsch. Versuche es erneut.",
    tooMany: "Zu viele Versuche. Fordere einen neuen Code an.",
    cancel: "Abbrechen",
    back: "Zurück",
    demoNote: "Demo-Modus — kein Server verbunden. Dein Code:",
    enabledToast: "Zwei-Faktor-Authentifizierung aktiviert!",
  },
  walletModal: {
    title: "Wallet",
    totalBalance: "Gesamtguthaben",
    withdraw: "Geld auszahlen",
    amount: "Betrag (USDT)",
    method: "Auszahlungsmethode",
    methodUsdt: "Krypto (USDT)",
    methodCard: "Bankkarte",
    submit: "Auszahlung beantragen",
    historyTitle: "Transaktionsverlauf",
    historyEmpty: "Noch keine Transaktionen.",
    insufficientBalance: "Dein Guthaben reicht für diese Auszahlung nicht aus.",
    invalidAmount: "Gib einen gültigen Betrag ein.",
    withdrawSuccess: "Auszahlungsanfrage gesendet!",
    tabWithdraw: "Auszahlen",
    tabDeposit: "Einzahlen",
    tabHistory: "Verlauf",
    walletAddress: "Wallet-Adresse",
    walletAddressCard: "Kartennummer",
    network: "Netzwerk",
    networkTrc20: "TRC20",
    networkErc20: "ERC20",
    networkBep20: "BEP20",
    minWithdraw: "Min. Auszahlung: 10,00 $",
    addressRequired: "Gib eine Wallet-Adresse oder Kartennummer ein.",
    belowMinimum: "Die Mindestauszahlung beträgt 10,00 $.",
    depositTitle: "Guthaben aufladen",
    depositAmount: "Betrag (USDT)",
    depositButton: "Guthaben hinzufügen",
    depositNote: "Demo-Aufladung — fügt zu Testzwecken sofort Guthaben hinzu.",
    depositSuccess: "Guthaben aufgeladen!",
    statusCompleted: "Abgeschlossen",
    statusPending: "Ausstehend",
  },
  xpModal: {
    title: "Level & XP",
    nextRewardTitle: "Belohnung für nächstes Level",
    nextRewardLabel: "Erreiche Level {level}: +{amount} $ Bonus & VIP-Abzeichen",
    currentLevel: "Aktuelles Level",
    nextLevel: "Nächstes Level",
    progressLabel: "{cur} / {goal} XP bis zum nächsten Level",
    historyTitle: "Erhaltene XP",
    historyEmpty: "Löse eine Challenge, um XP zu sammeln.",
  },
  leaderboardModal: {
    title: "Top-100-Bestenliste",
    yourRank: "Dein Rang",
    periodWeekly: "Wöchentlich",
    periodMonthly: "Monatlich",
    periodAll: "Gesamt",
  },
  rank: {
    redTeamer: "Red Teamer",
    bugHunter: "Bug Hunter",
    pentester: "Pentester",
    rookie: "Anfänger",
    eliteHacker: "Elite-Hacker",
  },
};

const es: typeof en_US = {
  common: { search: "Buscar desafíos…", success: "¡Hecho con éxito!" },
  nav: {
    dashboard: "Panel",
    challenges: "Desafíos / Sandboxes",
    leaderboard: "Clasificación",
    wallet: "Billetera y retiros",
    settings: "Ajustes",
  },
  header: { signIn: "Iniciar sesión", getStarted: "Comenzar" },
  auth: {
    loginTitle: "Bienvenido de nuevo",
    registerTitle: "Crea tu cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    username: "Nombre de usuario",
    loginButton: "Iniciar sesión",
    registerButton: "Crear cuenta",
    continueGuest: "Continuar como invitado",
    noAccount: "¿No tienes una cuenta?",
    haveAccount: "¿Ya tienes una cuenta?",
    orDivider: "o",
    error: "Por favor completa todos los campos.",
    mismatch: "Las contraseñas no coinciden.",
  },
  profile: {
    profileSettings: "Ajustes de perfil",
    settings: "Ajustes",
    signOut: "Cerrar sesión",
  },
  notifications: {
    title: "Notificaciones",
    markAllRead: "Marcar todo como leído",
    item1:
      'Tu envío "Auth Log Hunt" fue verificado — se acreditaron $15.00 USDT.',
    item2: "Nueva recompensa de patrocinador añadida a Smart Contracts.",
    item3: "Subiste al puesto #412 en la clasificación global.",
    item4: "El pago semanal se procesó correctamente.",
  },
  language: { select: "Idioma" },
  landing: {
    badge: "Aprende ciberseguridad. Cobra por practicar.",
    title: "Domina el hacking real. Desde tu navegador.",
    subtitle:
      "Resuelve desafíos de sandbox en vivo de Linux, seguridad web, contratos inteligentes y Python — y gana USDT real por cada uno que resuelvas.",
    ctaPrimary: "Comenzar",
    ctaSecondary: "Iniciar sesión",
  },
  catalog: {
    title: "Desafíos",
    subtitle: "Elige un sandbox, resuélvelo en vivo y cobra en cuanto se verifique.",
  },
  filters: { all: "Todos", linux: "Linux", web: "Seguridad web", smart: "Contratos inteligentes",/* ---------------------------------------------------------------------------- */
/*  MOCK DATA
    (source: lib/mock-data.ts)  */
/* ---------------------------------------------------------------------------- */

type Track = "linux" | "web" | "smart" | "python";
type Difficulty = "easy" | "medium" | "hard";

interface Challenge {
  id: string;
  track: Track;
  difficulty: Difficulty;
  title: string;
  description: string;
  objectives: string[];
  hint: string;
  rewardUsdt: number;
  xp: number;
  flag: string;
  terminalIntro: string[];
  terminalResponses: Record<string, string[]>;
}

const CHALLENGES: Challenge[] = [
  {
    id: "auth-log-hunt",
    track: "linux",
    difficulty: "easy",
    title: "Auth Log Hunt",
    description:
      "A shared box has been fielding brute-force attempts. Dig through the auth log and pull out the flag left behind by the last successful login.",
    objectives: [
      "Inspect /var/log/auth.log for successful logins",
      "Identify the session opened from an unfamiliar IP",
      "Recover the flag embedded in that session's comment",
    ],
    hint: "grep for \"Accepted password\" and look at the line right after the last failed attempt streak.",
    rewardUsdt: 15,
    xp: 120,
    flag: "CE{auth_log_9f21}",
    terminalIntro: [
      "Connected to sandbox: auth-log-hunt-01",
      "Type `ls` to see what's here.",
    ],
    terminalResponses: {
      ls: ["auth.log", "notes.txt"],
      "cat notes.txt": ["Someone got in around 03:14 UTC. Check auth.log."],
      "cat auth.log": [
        "03:11:02 Failed password for root from 185.22.14.9",
        "03:11:04 Failed password for root from 185.22.14.9",
        "03:14:51 Accepted password for root from 185.22.14.9",
        "# session-comment: CE{auth_log_9f21}",
      ],
      "grep Accepted auth.log": [
        "03:14:51 Accepted password for root from 185.22.14.9",
        "# session-comment: CE{auth_log_9f21}",
      ],
      whoami: ["ce-sandbox-user"],
    },
  },
  {
    id: "reflected-xss",
    track: "web",
    difficulty: "easy",
    title: "Reflected Input",
    description:
      "The sandbox's feedback form echoes your input straight back onto the page. Prove you can make the page execute something it didn't expect, and read the flag from the admin's cookie note.",
    objectives: [
      "Find the parameter that gets reflected without escaping",
      "Confirm you can break out of the surrounding HTML",
      "Recover the flag left in the admin notice",
    ],
    hint: "Try submitting a value containing angle brackets and see what comes back in the response.",
    rewardUsdt: 20,
    xp: 150,
    flag: "CE{reflected_7cd0}",
    terminalIntro: [
      "Connected to sandbox: reflected-input-01",
      "Type `curl /feedback?msg=test` to inspect the endpoint.",
    ],
    terminalResponses: {
      "curl /feedback?msg=test": [
        '<div class="msg">test</div>',
        "<!-- admin note: flag ships once you prove reflection -->",
      ],
      "curl /feedback?msg=<b>hi</b>": [
        "<div class=\"msg\"><b>hi</b></div>",
        "<!-- unescaped! admin note updated -->",
        "<!-- CE{reflected_7cd0} -->",
      ],
      ls: ["feedback.php", "admin_notes.txt"],
      "cat admin_notes.txt": ["Reminder: sanitize msg param before next release."],
    },
  },
  {
    id: "vault-reentrancy",
    track: "smart",
    difficulty: "hard",
    title: "Vault Reentrancy",
    description:
      "A toy vault contract lets you withdraw before it updates your balance. Drain it in the sandbox network to prove the exploit and reveal the flag stored in the deployer's log.",
    objectives: [
      "Read the Vault contract's withdraw() function",
      "Identify the missing checks-effects-interactions ordering",
      "Trigger a reentrant withdrawal via the attacker contract",
    ],
    hint: "The balance is only zeroed out after the external call sends funds — call back in before that line runs.",
    rewardUsdt: 45,
    xp: 300,
    flag: "CE{vault_reentry_3af9}",
    terminalIntro: [
      "Connected to sandbox: vault-reentrancy-01",
      "Type `cat Vault.sol` to read the contract.",
    ],
    terminalResponses: {
      "cat vault.sol": [
        "function withdraw() public {",
        "  (bool ok, ) = msg.sender.call{value: balances[msg.sender]}(\"\");",
        "  require(ok);",
        "  balances[msg.sender] = 0;",
        "}",
      ],
      "cat vault.sol -v": [
        "// deployer log:",
        "// vault drained successfully -> CE{vault_reentry_3af9}",
      ],
      "deploy attacker.sol": ["Attacker contract deployed at 0xATT...01"],
      "attacker.attack()": [
        "Reentrant call #1 succeeded",
        "Reentrant call #2 succeeded",
        "Vault balance: 0 ETH",
        "// CE{vault_reentry_3af9}",
      ],
    },
  },
  {
    id: "pickled-secrets",
    track: "python",
    difficulty: "medium",
    title: "Pickled Secrets",
    description:
      "A internal tool deserializes user-supplied data with pickle. Work out what that lets you do, and recover the flag the process was hiding in its environment.",
    objectives: [
      "Understand why unpickling untrusted input is dangerous",
      "Craft a payload that runs during deserialization",
      "Read the flag out of the process environment",
    ],
    hint: "__reduce__ lets a class control exactly what runs when it's unpickled.",
    rewardUsdt: 25,
    xp: 180,
    flag: "CE{pickle_env_5b6e}",
    terminalIntro: [
      "Connected to sandbox: pickled-secrets-01",
      "Type `cat service.py` to see what's running.",
    ],
    terminalResponses: {
      "cat service.py": [
        "import pickle",
        "def handle(data):",
        "    return pickle.loads(data)  # trusts caller input",
      ],
      "python3 exploit.py": [
        "Sending crafted payload…",
        "Payload deserialized on target",
        "os.environ dump captured",
      ],
      "cat leaked_env.txt": ["FLAG=CE{pickle_env_5b6e}", "PATH=/usr/bin:/bin"],
      env: ["FLAG=CE{pickle_env_5b6e}", "PATH=/usr/bin:/bin"],
    },
  },
  {
    id: "cron-privesc",
    track: "linux",
    difficulty: "medium",
    title: "Cron Privesc",
    description:
      "A world-writable script runs on a schedule as root. Work out how to ride it to a higher-privileged shell and collect the flag it drops.",
    objectives: [
      "Find the cron job running with elevated privileges",
      "Confirm the script it calls is writable by your user",
      "Use it to read the root-only flag file",
    ],
    hint: "`ls -la` on the script referenced in the crontab tells you everything you need.",
    rewardUsdt: 30,
    xp: 220,
    flag: "CE{cron_privesc_1d4a}",
    terminalIntro: [
      "Connected to sandbox: cron-privesc-01",
      "Type `crontab -l` to see scheduled jobs.",
    ],
    terminalResponses: {
      "crontab -l": ["*/5 * * * * root /opt/scripts/cleanup.sh"],
      "ls -la /opt/scripts/cleanup.sh": [
        "-rwxrwxrwx 1 root root 214 cleanup.sh",
      ],
      "cat /root/flag.txt": ["Permission denied"],
      "echo 'cat /root/flag.txt > /tmp/out' >> /opt/scripts/cleanup.sh": [
        "Waiting for the next cron tick…",
      ],
      "cat /tmp/out": ["CE{cron_privesc_1d4a}"],
    },
  },
  {
    id: "broken-jwt",
    track: "web",
    difficulty: "medium",
    title: "Broken JWT",
    description:
      "This API trusts the alg field of the JWT it's handed. Forge a token that gets you admin access and reveals the flag on the admin endpoint.",
    objectives: [
      "Decode the JWT and inspect the header and payload",
      "Switch the algorithm to none or forge a matching signature",
      "Hit /admin with the forged token",
    ],
    hint: "Some JWT libraries will happily accept alg: none if the server never enforces an allow-list.",
    rewardUsdt: 28,
    xp: 200,
    flag: "CE{jwt_alg_none_88c2}",
    terminalIntro: [
      "Connected to sandbox: broken-jwt-01",
      "Type `curl /me -H \"Authorization: Bearer <token>\"` to check your session.",
    ],
    terminalResponses: {
      "decode token": [
        '{"alg":"HS256","typ":"JWT"}',
        '{"user":"guest","admin":false}',
      ],
      "forge token": [
        "Header alg set to none, signature stripped",
        "New token ready",
      ],
      "curl /admin -H forged-token": [
        "200 OK",
        "Welcome, admin.",
        "flag: CE{jwt_alg_none_88c2}",
      ],
    },
  },
];

interface LeaderboardEntry {
  rank: number;
  name: string;
  country: string;
  xp: number;
  solved: number;
}

const LB_ADJ = [
  "Shadow", "Null", "Cipher", "Ghost", "Byte", "Root", "Neon", "Vortex", "Static", "Phantom",
  "Quantum", "Silent", "Crimson", "Obsidian", "Glitch", "Frost", "Iron", "Solar", "Lunar", "Vector",
];
const LB_NOUN = [
  "Fox", "Wolf", "Hawk", "Serpent", "Raven", "Falcon", "Viper", "Panther", "Cobra", "Tiger",
  "Eagle", "Lynx", "Drake", "Shark", "Owl",
];
const LB_FLAGS = [
  "🇩🇪", "🇹🇷", "🇪🇸", "🇦🇿", "🇷🇺", "🇨🇳", "🇺🇸", "🇬🇧", "🇫🇷", "🇮🇹",
  "🇧🇷", "🇮🇳", "🇯🇵", "🇰🇷", "🇨🇦", "🇦🇺", "🇳🇱", "🇸🇪", "🇵🇱", "🇺🇦",
];

/** Top 5 are curated; 6-100 are generated deterministically (same list on every load). */
function buildTop100(): LeaderboardEntry[] {
  const curated: LeaderboardEntry[] = [
    { rank: 1, name: "n0xroot", country: "🇩🇪", xp: 48210, solved: 214 },
    { rank: 2, name: "kismet_", country: "🇹🇷", xp: 46980, solved: 201 },
    { rank: 3, name: "0xSalty", country: "🇪🇸", xp: 44510, solved: 197 },
    { rank: 4, name: "gulnara.az", country: "🇦🇿", xp: 41200, solved: 183 },
    { rank: 5, name: "reentry_king", country: "🇷🇺", xp: 39870, solved: 176 },
  ];
  const generated: LeaderboardEntry[] = [];
  for (let rank = 6; rank <= 100; rank++) {
    const i = rank - 6;
    const name = `${LB_ADJ[i % LB_ADJ.length]}${LB_NOUN[(i * 3 + 1) % LB_NOUN.length]}${100 + rank}`;
    const xp = Math.max(600, 39400 - (rank - 5) * 365);
    const solved = Math.max(6, Math.round(xp / 205));
    const country = LB_FLAGS[i % LB_FLAGS.length];
    generated.push({ rank, name, country, xp, solved });
  }
  return [...curated, ...generated];
}

const TOP_100: LeaderboardEntry[] = buildTop100();

const XP_PER_LEVEL = 1000;
/** Flat demo bonus paid out for reaching the next level, shown in the XP modal. */
const NEXT_LEVEL_BONUS_USDT = 5;

/** Time-period filter for the leaderboard: purely cosmetic scaling of the same mock data. */
type LeaderboardPeriod = "weekly" | "monthly" | "all";
const LB_PERIOD_SCALE: Record<LeaderboardPeriod, number> = { weekly: 0.06, monthly: 0.25, all: 1 };

/** Rank badge shown next to a player's name, derived from their XP. */
type RankTierKey = "eliteHacker" | "redTeamer" | "bugHunter" | "pentester" | "rookie";
function rankTierKey(xp: number): RankTierKey {
  if (xp >= 40000) return "eliteHacker";
  if (xp >= 20000) return "redTeamer";
  if (xp >= 8000) return "bugHunter";
  if (xp >= 2000) return "pentester";
  return "rookie";
}

const AVATAR_PALETTE = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6"];
function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
function MiniAvatar({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: colorForName(name),
        fontSize: size * 0.5,
      }}
      className="inline-flex shrink-0 items-center justify-center font-bold text-white"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

interface HistoryEntry {
  id: string;
  kind: "reward" | "withdrawal" | "deposit";
  title: string;
  amount: number;
  xp: number;
  at: number;
  status: "completed" | "pending";
}

type WithdrawMethod = "usdt" | "card";
type WithdrawNetwork = "trc20" | "erc20" | "bep20";

const MIN_WITHDRAW_USDT = 10;

function maskAddress(value: string): string {
  const v = value.trim();
  if (v.length <= 10) return v;
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function composeName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "U";
}

interface AppUser {
  firstName: string;
  lastName: string;
  name: string; // display name = firstName + lastName
  email: string;
  avatarUrl: string | null;
  avatarInitial: string;
  guest: boolean;
  balanceUsdt: number;
  xp: number;
  solvedIds: string[];
  history: HistoryEntry[];
  level: number;
  rank: number;
  twoFactorEnabled: boolean;
  twoFactorTarget: string;
  emailNotifications: boolean;
  browserNotifications: boolean;
}

function makeGuestUser(name: string, email: string, guest = false): AppUser {
  const [first, ...rest] = name.trim().split(/\s+/);
  const firstName = first || "User";
  const lastName = rest.join(" ");
  const displayName = composeName(firstName, lastName);
  return {
    firstName,
    lastName,
    name: displayName,
    email,
    avatarUrl: null,
    avatarInitial: initialOf(displayName),
    guest,
    balanceUsdt: 0,
    xp: 0,
    solvedIds: [],
    history: [],
    level: 1,
    rank: 8213,
    twoFactorEnabled: false,
    twoFactorTarget: "",
    emailNotifications: true,
    browserNotifications: true,
  };
}


/* ---------------------------------------------------------------------------- */
/*  APP CONTEXT
    (source: lib/app-context.tsx)  */
/* ---------------------------------------------------------------------------- */

type DashboardTab = "overview" | "challenges" | "sandbox" | "leaderboard" | "wallet";
type AuthMode = "login" | "register" | null;

const PREFS_KEY = "cyberearn:prefs";
const avatarKey = (email: string) => `cyberearn:avatar:${email.trim().toLowerCase()}`;

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage full / unavailable — ignore
  }
}
function storageRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
function readStoredPrefs(): Partial<Pick<AppUser, "emailNotifications" | "browserNotifications">> {
  const raw = storageGet(PREFS_KEY);
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    return {
      ...(typeof p.emailNotifications === "boolean" ? { emailNotifications: p.emailNotifications } : {}),
      ...(typeof p.browserNotifications === "boolean" ? { browserNotifications: p.browserNotifications } : {}),
    };
  } catch {
    return {};
  }
}

type MenuName = "lang" | "notif" | "profile";
type CategoryFilter = "all" | Track;

type StatModal = "wallet" | "xp" | "leaderboard" | null;

interface AppContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: typeof en_US;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: ResolvedTheme;
  tokens: ThemeTokens;
  user: AppUser | null;
  isGuest: boolean;
  login: (email: string, _password: string) => void;
  register: (username: string, email: string, _password: string) => void;
  continueAsGuest: () => void;
  logout: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  markSolved: (challenge: Challenge) => void;
  withdraw: (amount: number, method: WithdrawMethod, detail: string) => { ok: boolean; error?: string };
  deposit: (amount: number) => { ok: boolean; error?: string };
  authMode: AuthMode;
  openAuth: (mode: Exclude<AuthMode, null>) => void;
  closeAuth: () => void;
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  /** Only one header dropdown can be open at a time. */
  activeMenu: MenuName | null;
  setActiveMenu: (menu: MenuName | null) => void;
  /** Only one stat-card popup (wallet / XP / leaderboard) can be open at a time. */
  statModal: StatModal;
  openStatModal: (modal: Exclude<StatModal, null>) => void;
  closeStatModal: () => void;
  toast: { id: number; message: string } | null;
  showToast: (message: string) => void;
  view: "landing" | "dashboard";
  goToDashboard: () => void;
  goToLanding: () => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  /** Lives in context (not in the catalog) so the filter bar never depends on which tab was visited. */
  categoryFilter: CategoryFilter;
  setCategoryFilter: (filter: CategoryFilter) => void;
  activeChallengeId: string | null;
  openChallenge: (id: string) => void;
  successPayload: { rewardUsdt: number; xp: number } | null;
  clearSuccess: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);
  return prefersDark;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [user, setUser] = useState<AppUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null);
  const [statModal, setStatModal] = useState<StatModal>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [dashboardTab, setDashboardTabRaw] = useState<DashboardTab>("challenges");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<{ rewardUsdt: number; xp: number } | null>(null);

  const prefersDark = usePrefersDark();
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  // Toast auto-dismisses after 3 seconds; a later toast simply resets the timer.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast((cur) => (cur && cur.id === toast.id ? null : cur)), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (message: string) => setToast({ id: Date.now(), message });

  useEffect(() => {
    try {
      const savedLang = window.localStorage.getItem("cyberearn:lang") as LangCode | null;
      const savedTheme = window.localStorage.getItem("cyberearn:theme") as ThemeMode | null;
      if (savedLang && TRANSLATIONS[savedLang]) setLangState(savedLang);
      if (savedTheme) setThemeState(savedTheme);
    } catch {
      // localStorage unavailable — fall back to defaults silently
    }
  }, []);
