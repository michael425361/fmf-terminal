import { setRequestLocale } from "next-intl/server";
import { CommunityPage } from "@/components/community/CommunityPage";
import { TerminalProviders } from "@/components/layout/TerminalProviders";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CommunityRoutePage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return (
    <TerminalProviders commandPalette={false}>
      <CommunityPage />
    </TerminalProviders>
  );
}
