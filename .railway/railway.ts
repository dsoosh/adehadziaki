// Infrastruktura Railway jako kod (następca railway.json).
// Podgląd zmian: npm run railway:plan · zastosowanie: npm run railway:apply
// Po merge do main stosuje go GitHub Actions (.github/workflows/railway.yml).
import { defineRailway, github, preserve, project, service } from "railway/iac";

/**
 * Zmienne ustawiane w panelu Railway. preserve() = zachowaj obecną wartość –
 * sekrety nie trafiają do repozytorium. Lista musi być pełna: zmienna, której
 * tu nie ma, zostałaby przez `apply` usunięta. Opis zmiennych: .env.example.
 */
const VARIABLES = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "DAILY_API_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
] as const;

export default defineRailway(() => {
  const app = service("adehadziaki", {
    source: github("dsoosh/adehadziaki", { branch: "main" }),
    build: { builder: "RAILPACK", buildCommand: "npm run build" },
    // Migracje Supabase przed każdym wdrożeniem; błąd przerywa wdrożenie.
    preDeploy: "bash scripts/migrate.sh",
    // Serwer standalone nasłuchujący na 0.0.0.0:$PORT.
    start: "bash scripts/start-standalone.sh",
    healthcheck: "/api/health",
    healthcheckTimeout: 60,
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 5 },
    // Domena usługi Railway (*.up.railway.app) kieruje ruch na port aplikacji.
    // Pole `domains` służy tylko domenom własnym, więc tu jawnie serviceDomains.
    networking: { serviceDomains: { "adehadziaki-production.up.railway.app": { port: 8080 } } },
    env: Object.fromEntries(VARIABLES.map((name) => [name, preserve()])),
  });

  return project("adehadziaki", { resources: [app] });
});
