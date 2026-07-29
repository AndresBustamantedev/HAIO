import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { OrganizationSettingsForm } from "@/features/settings/components/organization-settings-form";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    organization,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentOrganization()]);

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Configuración" />
        <EmptyState title="Inicia sesión para ver tu configuración." />
      </PageContainer>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, timezone, locale")
    .eq("id", user.id)
    .maybeSingle();

  const orgRes = organization
    ? await supabase
        .from("organizations")
        .select(
          "name, legal_name, tax_id, email, phone, website, address_line_1, city, postal_code, country_code, currency_code, timezone"
        )
        .eq("id", organization.organizationId)
        .maybeSingle()
    : null;

  const canEditOrganization = organization ? ["owner", "admin", "manager"].includes(organization.role) : false;

  return (
    <PageContainer>
      <PageHeader title="Configuración" description="Ajustes de tu perfil y de la organización." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="organization" disabled={!organization}>
            Organización
          </TabsTrigger>
        </TabsList>

        <TabsPanel value="profile">
          <ProfileSettingsForm
            defaultValues={{
              first_name: profile?.first_name ?? "",
              last_name: profile?.last_name ?? "",
              phone: profile?.phone ?? "",
              timezone: profile?.timezone ?? "Europe/Madrid",
              locale: profile?.locale ?? "es",
            }}
          />
        </TabsPanel>

        <TabsPanel value="organization">
          {orgRes?.data ? (
            <OrganizationSettingsForm
              canEdit={canEditOrganization}
              defaultValues={{
                name: orgRes.data.name,
                legal_name: orgRes.data.legal_name ?? "",
                tax_id: orgRes.data.tax_id ?? "",
                email: orgRes.data.email ?? "",
                phone: orgRes.data.phone ?? "",
                website: orgRes.data.website ?? "",
                address_line_1: orgRes.data.address_line_1 ?? "",
                city: orgRes.data.city ?? "",
                postal_code: orgRes.data.postal_code ?? "",
                country_code: orgRes.data.country_code,
                currency_code: orgRes.data.currency_code,
                timezone: orgRes.data.timezone,
              }}
            />
          ) : (
            <EmptyState title="Todavía no perteneces a ninguna organización" />
          )}
        </TabsPanel>
      </Tabs>
    </PageContainer>
  );
}
