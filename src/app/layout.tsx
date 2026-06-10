import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./global.css";

export const metadata: Metadata = {
  title: "Ploggo - 플로깅 경로 기록기",
  description: "길을 걸으며 쓰레기를 줍는 플로깅 활동의 이동 경로를 지도에 직접 기록하고 저장하는 모바일 웹앱입니다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ploggo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const naverClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Leaflet CSS for OSM fallback */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        {children}
        {naverClientId && (
          <Script
            src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${naverClientId}`}
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  );
}
