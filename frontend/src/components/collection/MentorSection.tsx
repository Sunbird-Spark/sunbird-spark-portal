import React from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { FiCheck, FiSearch, FiLoader, FiX } from "react-icons/fi";
import { MentorUser } from "@/hooks/useMentor";
import { cn } from "@/lib/utils";

interface MentorSectionProps {
  mentorsLoading: boolean;
  allMentors: MentorUser[];
  mentorQuery: string;
  setMentorQuery: (q: string) => void;
  selectedMentorIds: string[];
  toggleMentor: (id: string) => void;
  labelClass?: string;
  inputClass?: string;
}

export function MentorSection({
  mentorsLoading,
  allMentors,
  mentorQuery,
  setMentorQuery,
  selectedMentorIds,
  toggleMentor,
  labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']",
  inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']",
}: MentorSectionProps) {
  const filteredMentors: MentorUser[] =
    mentorQuery.trim().length >= 1
      ? allMentors.filter((u) => {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
          const email = (u.maskedEmail ?? u.email ?? "").toLowerCase();
          const q = mentorQuery.toLowerCase();
          return name.includes(q) || email.includes(q) || u.identifier.toLowerCase().includes(q);
        })
      : allMentors;

  return (
    <div>
      <label className={labelClass}>Mentors in the Batch</label>

      {/* Search box */}
      <div className="relative mb-2">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          className={cn(inputClass, "pl-9")}
          placeholder="Search mentors by name or email…"
          value={mentorQuery}
          onChange={(e) => setMentorQuery(e.target.value)}
        />
        {mentorsLoading && (
          <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Mentor list */}
      {filteredMentors.length > 0 && (
        <div className="rounded-lg border border-border bg-white shadow-sm max-h-40 overflow-y-auto divide-y divide-border">
          {filteredMentors.map((user) => {
            const isSelected = selectedMentorIds.includes(user.identifier);
            const displayName =
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.maskedEmail ||
              user.email ||
              user.identifier;
            return (
              <label
                key={user.identifier}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors",
                  isSelected && "bg-sunbird-brick/5"
                )}
              >
                <Checkbox.Root
                  checked={isSelected}
                  onCheckedChange={() => toggleMentor(user.identifier)}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none"
                >
                  <Checkbox.Indicator>
                    <FiCheck className="w-3 h-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-foreground font-['Rubik']">{displayName}</span>
              </label>
            );
          })}
        </div>
      )}

      {!mentorsLoading && allMentors.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">No mentors found in your organisation.</p>
      )}

      {/* Selected mentor tags */}
      {selectedMentorIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedMentorIds.map((id) => {
            const user = allMentors.find((u) => u.identifier === id);
            const name = user
              ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.maskedEmail ||
                user.email ||
                id
              : id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-xs bg-sunbird-brick/10 text-sunbird-brick rounded-full px-2.5 py-0.5 font-['Rubik']"
              >
                {name}
                <button
                  type="button"
                  onClick={() => toggleMentor(id)}
                  className="hover:opacity-70"
                  aria-label={`Remove ${name}`}
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
