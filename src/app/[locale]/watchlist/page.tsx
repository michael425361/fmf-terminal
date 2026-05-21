import { setRequestLocale } from "next-intl/server";
import { MobileWatchlistPage } from "@/components/watchlist/MobileWatchlistPage";
import { TerminalProviders } from "@/components/layout/TerminalProviders";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WatchlistPage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return (
    <TerminalProviders commandPalette={false}>
      <MobileWatchlistPage />
    </TerminalProviders>
  );
}
