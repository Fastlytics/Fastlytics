import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/about`; params?: Router.UnknownInputParams }
        | { pathname: `/auth`; params?: Router.UnknownInputParams }
        | { pathname: `/contact`; params?: Router.UnknownInputParams }
        | { pathname: `/drivers`; params?: Router.UnknownInputParams }
        | { pathname: `/faq`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/privacy`; params?: Router.UnknownInputParams }
        | { pathname: `/progression`; params?: Router.UnknownInputParams }
        | { pathname: `/refund`; params?: Router.UnknownInputParams }
        | { pathname: `/teams`; params?: Router.UnknownInputParams }
        | { pathname: `/terms`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/calendar` | `/calendar`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/news` | `/news`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/standings` | `/standings`; params?: Router.UnknownInputParams }
        | {
            pathname: `/driver/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          }
        | {
            pathname: `/race/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          }
        | {
            pathname: `/team/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          };
      hrefOutputParams:
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | { pathname: `/about`; params?: Router.UnknownOutputParams }
        | { pathname: `/auth`; params?: Router.UnknownOutputParams }
        | { pathname: `/contact`; params?: Router.UnknownOutputParams }
        | { pathname: `/drivers`; params?: Router.UnknownOutputParams }
        | { pathname: `/faq`; params?: Router.UnknownOutputParams }
        | { pathname: `/`; params?: Router.UnknownOutputParams }
        | { pathname: `/privacy`; params?: Router.UnknownOutputParams }
        | { pathname: `/progression`; params?: Router.UnknownOutputParams }
        | { pathname: `/refund`; params?: Router.UnknownOutputParams }
        | { pathname: `/teams`; params?: Router.UnknownOutputParams }
        | { pathname: `/terms`; params?: Router.UnknownOutputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/calendar` | `/calendar`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/news` | `/news`; params?: Router.UnknownOutputParams }
        | { pathname: `${'/(tabs)'}/standings` | `/standings`; params?: Router.UnknownOutputParams }
        | { pathname: `/driver/[slug]`; params: Router.UnknownOutputParams & { slug: string } }
        | { pathname: `/race/[slug]`; params: Router.UnknownOutputParams & { slug: string } }
        | { pathname: `/team/[slug]`; params: Router.UnknownOutputParams & { slug: string } };
      href:
        | Router.RelativePathString
        | Router.ExternalPathString
        | `/about${`?${string}` | `#${string}` | ''}`
        | `/auth${`?${string}` | `#${string}` | ''}`
        | `/contact${`?${string}` | `#${string}` | ''}`
        | `/drivers${`?${string}` | `#${string}` | ''}`
        | `/faq${`?${string}` | `#${string}` | ''}`
        | `/${`?${string}` | `#${string}` | ''}`
        | `/privacy${`?${string}` | `#${string}` | ''}`
        | `/progression${`?${string}` | `#${string}` | ''}`
        | `/refund${`?${string}` | `#${string}` | ''}`
        | `/teams${`?${string}` | `#${string}` | ''}`
        | `/terms${`?${string}` | `#${string}` | ''}`
        | `/_sitemap${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/account${`?${string}` | `#${string}` | ''}`
        | `/account${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/calendar${`?${string}` | `#${string}` | ''}`
        | `/calendar${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}`
        | `/${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/news${`?${string}` | `#${string}` | ''}`
        | `/news${`?${string}` | `#${string}` | ''}`
        | `${'/(tabs)'}/standings${`?${string}` | `#${string}` | ''}`
        | `/standings${`?${string}` | `#${string}` | ''}`
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: `/about`; params?: Router.UnknownInputParams }
        | { pathname: `/auth`; params?: Router.UnknownInputParams }
        | { pathname: `/contact`; params?: Router.UnknownInputParams }
        | { pathname: `/drivers`; params?: Router.UnknownInputParams }
        | { pathname: `/faq`; params?: Router.UnknownInputParams }
        | { pathname: `/`; params?: Router.UnknownInputParams }
        | { pathname: `/privacy`; params?: Router.UnknownInputParams }
        | { pathname: `/progression`; params?: Router.UnknownInputParams }
        | { pathname: `/refund`; params?: Router.UnknownInputParams }
        | { pathname: `/teams`; params?: Router.UnknownInputParams }
        | { pathname: `/terms`; params?: Router.UnknownInputParams }
        | { pathname: `/_sitemap`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/account` | `/account`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/calendar` | `/calendar`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/news` | `/news`; params?: Router.UnknownInputParams }
        | { pathname: `${'/(tabs)'}/standings` | `/standings`; params?: Router.UnknownInputParams }
        | `/driver/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}`
        | `/race/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}`
        | `/team/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}`
        | {
            pathname: `/driver/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          }
        | {
            pathname: `/race/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          }
        | {
            pathname: `/team/[slug]`;
            params: Router.UnknownInputParams & { slug: string | number };
          };
    }
  }
}
