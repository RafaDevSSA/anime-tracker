import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

type ExternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: `http${string}` };

export function ExternalLink({ href, ...props }: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...props}
      href={href as ComponentProps<typeof Link>['href']}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
}
