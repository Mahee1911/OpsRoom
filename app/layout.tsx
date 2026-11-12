import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ModalProvider } from "@/components/providers/modal-providers";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { SocketProvider } from "@/components/providers/socket-provider";
import { cn } from "@/lib/utils";


const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsRoom - Chat with your colleagues",
  description: "Real-time collaboration for engineering teams",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={cn(
          openSans.className,
          "flex min-h-full flex-col bg-white dark:bg-[#313338]"
        )}
      >
        <ClerkProvider afterSignOutUrl="/">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="opsroom-theme"
          >
            <ReactQueryProvider>
              <SocketProvider>
                <ModalProvider />
                {children}
              </SocketProvider>
            </ReactQueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}