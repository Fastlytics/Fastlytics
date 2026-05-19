import { useState } from 'react';

export function FormattedDate({
  date,
  locale,
  options,
}: {
  date: string | number | Date;
  locale?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [formatted] = useState(() => new Date(date).toLocaleDateString(locale, options));
  return <>{formatted}</>;
}

export function FullYear({ date }: { date?: Date }) {
  const d = date ?? new Date();
  const [year] = useState(() => d.getFullYear());
  return <>{year}</>;
}

export function DateFromProp({ date }: { date: Date }) {
  const [d] = useState(() => date);
  return <>{d.toLocaleDateString()}</>;
}
