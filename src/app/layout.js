import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CogiGame - Doomscrolling Alternative",
  description: "Bite-sized cognitive and professional training mini-games for tech professionals.",
  openGraph: {
    title: "CogiGame - Train your brain",
    description: "A productive alternative to doomscrolling.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
