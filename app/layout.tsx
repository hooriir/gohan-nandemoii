import Providers from "./providers";
import AutoLogoutProvider from "@/components/AutoLogoutProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <AutoLogoutProvider>
        <Providers>{children}</Providers>
        </AutoLogoutProvider>
      </body>
    </html>
  );
}