import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GÜIDO CAPUZZI",
  description: "GÜIDO CAPUZZI — Denim único sin re-stock. Prendas 1/1.",
  icons: {
    icon: "/assets/images/favicon-32x32.png",
  },
};

const PIXEL_ID = "1882249755738633";

// Script inline sincrónico — corre antes que cualquier otro JS en la página.
// Consent Mode v2: fbq existe desde el primer momento pero con consent revocado.
// activateTracking() en start.js llama fbq('consent','grant') + PageView al aceptar cookies.
const pixelScript = `
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('consent', 'revoke');
  fbq('init', '${PIXEL_ID}');
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: pixelScript }} />
      </head>
      <body className="state-home" suppressHydrationWarning>
        {children}
        <noscript>
          <img
            height="1" width="1" style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
