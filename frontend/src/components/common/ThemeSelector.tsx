import {
  FiCheck,
  FiType,
  FiLayout,
  FiGrid,
} from 'react-icons/fi';

/** Color palette glyph — theme selector trigger icon (parity with mobile app). */
const ThemeBrushIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.96-4.04-9-9-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      fill="currentColor"
    />
  </svg>
);
import { useTheme } from '@/providers/ThemeProvider';
import { themePreviewColor } from '@/theme/themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { LayoutThumb, shortLayoutLabel } from '@/components/common/LayoutThumb';

interface ThemeSelectorProps {
  buttonClassName?: string;
  iconClassName?: string;
}

export function ThemeSelector({
  buttonClassName = 'profile-action-btn',
  iconClassName = 'profile-action-icon',
}: ThemeSelectorProps = {}) {
  const {
    activeTheme, setTheme, themes,
    activeFont, setFont, fonts,
    activeTemplate, setTemplate, templates,
    activeLayout, setLayout, layouts,
  } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={buttonClassName}
          aria-label="Change theme"
          data-edataid="theme-selector-btn"
          data-edatatype="CLICK"
          title="Change theme"
        >
          <ThemeBrushIcon className={iconClassName} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="profile-dropdown-content w-80 p-0 overflow-hidden"
      >
        {/* ============ COLOR ============ */}
        <div className="p-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <FiGrid className="w-3 h-3" aria-hidden="true" />
            Colour
            <span className="ml-auto normal-case tracking-normal text-[11px] font-medium text-foreground">
              {activeTheme.name}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1.5 px-2 pt-1 pb-1.5">
            {themes.map((theme) => {
              const active = activeTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`aspect-square rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 ${
                    active ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ background: themePreviewColor(theme) }}
                  title={theme.name}
                  aria-label={`Color: ${theme.name}`}
                  aria-pressed={active}
                  data-edataid={`theme-select-${theme.id}`}
                  data-edatatype="CLICK"
                />
              );
            })}
          </div>
        </div>

        {/* ============ TEMPLATE ============ */}
        <div className="p-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <FiLayout className="w-3 h-3" aria-hidden="true" />
            Template
            <span className="ml-auto normal-case tracking-normal text-[11px] font-medium text-foreground">
              {activeTemplate.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-2 pt-1 pb-1">
            {templates.map((tpl) => {
              const active = activeTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                  className={`text-left p-2 rounded-md border-2 transition-colors ${
                    active
                      ? 'border-sunbird-theme-accent bg-sunbird-theme-accent/5'
                      : 'border-border hover:border-sunbird-theme-accent/50'
                  }`}
                  aria-pressed={active}
                  data-edataid={`template-select-${tpl.id}`}
                  data-edatatype="CLICK"
                >
                  <div
                    className={`h-10 rounded-md mb-2 grid grid-cols-[18px_1fr] grid-rows-[10px_1fr] gap-0.5 p-0.5 ${
                      tpl.id === 'modern' ? 'bg-muted' : 'bg-muted'
                    }`}
                  >
                    <div className={`col-span-2 bg-sunbird-theme-accent ${tpl.id === 'modern' ? 'rounded-xxs' : 'rounded'}`} />
                    <div className={`bg-sunbird-theme-accent/20 ${tpl.id === 'modern' ? 'rounded-xxs' : 'rounded'}`} />
                    <div
                      className={
                        tpl.id === 'modern'
                          ? 'bg-white border border-border rounded-xxs'
                          : 'bg-card rounded'
                      }
                    />
                  </div>
                  <div className="text-[13px] font-semibold leading-tight">{tpl.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {tpl.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ LAYOUT ============ */}
        <div className="p-2 pb-6 border-b border-border/50">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <FiLayout className="w-3 h-3" aria-hidden="true" />
            Layout
            <span className="ml-auto normal-case tracking-normal text-[11px] font-medium text-foreground">
              {activeLayout.name}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 px-2 pt-1">
            {layouts.map((lyt) => (
              <LayoutThumb
                key={lyt.id}
                id={lyt.id}
                label={shortLayoutLabel(lyt.id)}
                active={activeLayout.id === lyt.id}
                onClick={() => setLayout(lyt.id)}
              />
            ))}
          </div>
        </div>

        {/* ============ FONT ============ */}
        <div className="p-2">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <FiType className="w-3 h-3" aria-hidden="true" />
            Font
            <span
              className="ml-auto normal-case tracking-normal text-[11px] font-medium text-foreground"
              style={{ fontFamily: activeFont.value }}
            >
              {activeFont.name}
            </span>
          </div>
          {fonts.map((font) => {
            const active = activeFont.id === font.id;
            return (
              <button
                key={font.id}
                onClick={() => setFont(font.id)}
                className={`w-full flex items-center px-2 py-1.5 rounded text-[13px] hover:bg-accent/30 ${
                  active ? 'bg-sunbird-theme-accent/10 text-sunbird-theme-accent font-semibold' : ''
                }`}
                aria-pressed={active}
                data-edataid={`font-select-${font.id}`}
                data-edatatype="CLICK"
              >
                <span className="flex-1 text-left" style={{ fontFamily: font.value }}>
                  {font.name}
                </span>
                {active && <FiCheck className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

