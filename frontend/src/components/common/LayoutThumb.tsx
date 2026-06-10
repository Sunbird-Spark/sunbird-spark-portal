export interface LayoutThumbProps {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function shortLayoutLabel(id: string): string {
  switch (id) {
    case 'sidebar-left': return 'Left';
    case 'sidebar-right': return 'Right';
    case 'top': return 'Top';
    case 'bottom': return 'Bottom';
    default: return id;
  }
}

export function LayoutThumb({ id, label, active, onClick }: LayoutThumbProps) {
  const accent = 'bg-sunbird-theme-accent';
  const tint = 'bg-sunbird-theme-accent/20';
  const muted = 'bg-muted';

  const inner = (() => {
    switch (id) {
      case 'sidebar-left':
        return (
          <div className="grid grid-cols-[30%_1fr] grid-rows-[18%_1fr] gap-0.5 h-full">
            <div className={`col-span-2 ${tint} rounded-xxs`} />
            <div className={`${accent} rounded-xxs`} />
            <div className={`${muted} rounded-xxs`} />
          </div>
        );
      case 'sidebar-right':
        return (
          <div className="grid grid-cols-[1fr_30%] grid-rows-[18%_1fr] gap-0.5 h-full">
            <div className={`col-span-2 ${tint} rounded-xxs`} />
            <div className={`${muted} rounded-xxs`} />
            <div className={`${accent} rounded-xxs`} />
          </div>
        );
      case 'top':
        return (
          <div className="grid grid-rows-[18%_16%_1fr] gap-0.5 h-full">
            <div className={`${tint} rounded-xxs`} />
            <div className={`${accent} rounded-xxs`} />
            <div className={`${muted} rounded-xxs`} />
          </div>
        );
      case 'bottom':
        return (
          <div className="grid grid-rows-[18%_1fr_22%] gap-0.5 h-full">
            <div className={`${tint} rounded-xxs`} />
            <div className={`${muted} rounded-xxs`} />
            <div className={`${accent} rounded-xxs`} />
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`aspect-square w-full p-1 rounded border-2 transition-colors ${
          active
            ? 'border-sunbird-theme-accent bg-sunbird-theme-accent/5'
            : 'border-border hover:border-sunbird-theme-accent/50 bg-background'
        }`}
        aria-pressed={active}
        data-edataid={`layout-select-${id}`}
        data-edatatype="CLICK"
      >
        {inner}
      </button>
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground font-medium whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
