import "./globals.css";

export const metadata = {
  title: "Pension Simulator",
  description: "Your pension calculator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
