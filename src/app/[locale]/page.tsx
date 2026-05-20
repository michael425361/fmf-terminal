import { setRequestLocale } from "next-intl/server";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { routing, type Locale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  if (routing.locales.includes(locale as Locale)) {
    setRequestLocale(locale);
  }

  return <Dashboard />;
}
