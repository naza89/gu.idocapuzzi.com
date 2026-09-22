import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GÜIDO CAPUZZI",
  description: "GÜIDO CAPUZZI — Denim único sin re-stock. Prendas 1/1.",
  icons: {
    icon: "/assets/images/favicon-32x32-nuevo.png",
  },
};

const PIXEL_ID = "862180773603752";

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
  // El router del SPA reescribe la URL al cargar y se lleva el query string,
  // así que el fbclid del anuncio desaparece antes de que el usuario llegue a
  // aceptar las cookies. Lo guardamos en memoria — no en una cookie — para no
  // escribir nada de publicidad antes del consentimiento; activateTracking()
  // lo convierte en la cookie _fbc recién al aceptar.
  try {
    var gcClickId = /[?&]fbclid=([^&#]+)/.exec(window.location.search);
    if (gcClickId) window.__gcFbclid = decodeURIComponent(gcClickId[1]);
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
