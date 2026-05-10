import React from 'react';

export const SectionHeader = ({
  title,
  icon: Icon,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="mb-6 flex items-center gap-2">
    {Icon && <Icon className="size-4 text-white/40" />}
    <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">{title}</h2>
  </div>
);
