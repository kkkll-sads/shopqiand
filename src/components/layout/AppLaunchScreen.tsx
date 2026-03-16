import type { CSSProperties } from 'react';

interface AppLaunchScreenProps {
  fading: boolean;
}

const DOT_DELAYS = ['0ms', '160ms', '320ms'];

export const AppLaunchScreen = ({ fading }: AppLaunchScreenProps) => {
  return (
    <div
      className={`absolute inset-0 z-[120] overflow-hidden transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
      }`}
    >
      <div className="launch-screen-backdrop absolute inset-0" />

      <div className="launch-screen-orb launch-screen-orb-top absolute -right-20 -top-24 h-72 w-72 rounded-full" />
      <div className="launch-screen-orb launch-screen-orb-bottom absolute -bottom-28 -left-16 h-80 w-80 rounded-full" />
      <div className="launch-screen-grid absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 pt-[calc(var(--safe-top)+22px)] pb-[calc(var(--safe-bottom)+24px)] text-text-main dark:text-white">
        <div className="launch-screen-logo-shell mb-7 flex h-[108px] w-[108px] items-center justify-center rounded-[30px] border border-black/8 bg-white/85 p-2.5 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-sm dark:border-white/20 dark:bg-white/8 dark:shadow-[0_20px_48px_rgba(0,0,0,0.45)]">
          <img
            src="/img/launch-logo.jpg"
            alt="树交所"
            className="h-full w-full rounded-[22px] object-cover"
          />
        </div>

        <h1 className="mb-2 text-4xl font-semibold tracking-[0.24em]">树交所</h1>
        <p className="mb-11 text-sm text-text-sub dark:text-white/74">数字权益可信交易平台</p>

        <div className="flex items-center gap-2.5 text-sm tracking-[0.12em] text-text-sub dark:text-white/70">
          <div className="flex items-center gap-1.5">
            {DOT_DELAYS.map((delay) => (
              <span
                key={delay}
                className="launch-screen-dot h-1.5 w-1.5 rounded-full bg-gray-700 dark:bg-white/90"
                style={{ '--launch-dot-delay': delay } as CSSProperties}
              />
            ))}
          </div>
          <span>安全加载中</span>
        </div>

        <div className="absolute bottom-[calc(var(--safe-bottom)+14px)] text-xs tracking-[0.08em] text-text-aux dark:text-white/58">
          安全 · 稳定 · 可追溯
        </div>
      </div>
    </div>
  );
};
