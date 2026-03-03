import { cn } from "@/lib/utils";

export type ActiveTab = "Ongoing" | "Upcoming" | "Expired";

const TABS: ActiveTab[] = ["Ongoing", "Upcoming", "Expired"];

interface TabBarProps {
  activeTab: ActiveTab;
  counts: Record<ActiveTab, number>;
  onChange: (tab: ActiveTab) => void;
}

export function TabBar({ activeTab, counts, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
            activeTab === tab
              ? "text-sunbird-brick"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
          {counts[tab] > 0 && (
            <span
              className={cn(
                "ml-1.5 inline-flex items-center justify-center rounded-full text-xs w-4 h-4 font-['Rubik']",
                activeTab === tab
                  ? "bg-sunbird-brick text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {counts[tab]}
            </span>
          )}
          {/* active indicator */}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}
