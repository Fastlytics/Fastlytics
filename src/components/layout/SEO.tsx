import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

const DOMAIN = 'https://fastlytics.app';
const EMPTY_KEYWORDS: string[] = [];

export const SEO = ({
  title,
  description,
  keywords = EMPTY_KEYWORDS,
  image = '/og-image.png',
  url,
  type = 'website',
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title;
  const canonicalUrl = url ? url : DOMAIN;
  const absoluteImage = image.startsWith('http') ? image : `${DOMAIN}${image}`;
  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

  const allKeywords = [
    'f1 analytics',
    'formula 1 data',
    'f1 telemetry',
    'f1 stats',
    'race strategy',
    'motorsport analytics',
    'f1 data visualization',
    'telemetry analysis',
    ...keywords,
  ].join(', ');

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content="Subhash Gottumulla" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content="Fastlytics" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@fastlytics" />
      <meta name="twitter:creator" content="@fastlytics" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data (JSON-LD) for SoftwareApplication */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Fastlytics',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description: description,
          author: {
            '@type': 'Person',
            name: 'Subhash Gottumulla',
          },
          sameAs: ['https://x.com/fastlytics', 'https://instagram.com/fastlytics'],
        })}
      </script>
    </Helmet>
  );
};
