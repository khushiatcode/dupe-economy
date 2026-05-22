import "./globals.css";
import { Sidebar } from "./components";

export const metadata = {
  title: "Dupe Economy",
  description: "Open intelligence for the fashion and beauty dupe pipeline.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="min-h-screen px-5 py-8 md:ml-[220px] md:px-12 md:py-12 lg:px-20">{children}</main>
      </body>
    </html>
  );
}

