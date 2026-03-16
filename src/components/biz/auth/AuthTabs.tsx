const tabsRootClassName = 'mb-6 flex space-x-6';

interface AuthTabsProps<T extends string> {
  items: Array<{
    key: T;
    label: string;
  }>;
  value: T;
  onChange: (value: T) => void;
}

// Small generic tab switcher for auth entry modes.
export const AuthTabs = <T extends string>({ items, value, onChange }: AuthTabsProps<T>) => {
  return (
    <div className={tabsRootClassName}>
      {items.map((item) => {
        const active = item.key === value;

        return (
          <button
            key={item.key}
            type="button"
            className={`relative pb-1 text-2xl font-medium ${active ? 'text-text-main' : 'text-text-aux'}`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
            {active ? (
              <div className="absolute bottom-0 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary-start" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
