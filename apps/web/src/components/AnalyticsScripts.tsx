import Script from 'next/script'
import { resolveTrackingIds } from '@/lib/tracking-ids'

interface AnalyticsScriptsProps {
  google_analytics_id?: string | null
  facebook_pixel_id?: string | null
  tiktok_pixel_id?: string | null
}

/**
 * Injects GA / Meta / TikTok pixels with validated IDs and JSON-escaped literals
 * so malformed or hostile input cannot break or escape the inline scripts.
 */
export function AnalyticsScripts(props: AnalyticsScriptsProps) {
  const { googleAnalyticsId, facebookPixelId, tiktokPixelId } = resolveTrackingIds(props)
  const gaLit = googleAnalyticsId ? JSON.stringify(googleAnalyticsId) : null
  const fbLit = facebookPixelId ? JSON.stringify(facebookPixelId) : null
  const ttLit = tiktokPixelId ? JSON.stringify(tiktokPixelId) : null

  return (
    <>
      {googleAnalyticsId && gaLit && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${gaLit});
            `}
          </Script>
        </>
      )}

      {facebookPixelId && fbLit && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', ${fbLit});
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {tiktokPixelId && ttLit && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load(${ttLit});
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
    </>
  )
}
