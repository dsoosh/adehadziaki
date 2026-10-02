import type { Metadata } from "next";
import { DangerZone } from "@/components/profile/danger-zone";
import { ProfileForm } from "@/components/profile/profile-form";
import { PushSettings } from "@/components/profile/push-settings";
import { Page } from "@/components/ui/page";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const { user, profile } = await requireUser("/profil");
  return (
    <Page className="gap-10">
      <section>
        <h1 className="mb-1 text-3xl font-bold">Profil</h1>
        <p className="mb-6 text-muted">{user.email}</p>
        {profile && <ProfileForm profile={profile} />}
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Powiadomienia</h2>
        <PushSettings enabled={profile?.push_enabled ?? false} />
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Konto</h2>
        <DangerZone />
      </section>
    </Page>
  );
}
