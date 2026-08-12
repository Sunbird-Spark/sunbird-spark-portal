interface SkillChipsProps {
  skills: string[];
}

/** "Skills covered" chip list on the completion screen. */
export function SkillChips({ skills }: SkillChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span key={skill} className="rounded-pill bg-sunbird-blue-light/15 px-2.5 py-1 text-xs text-sunbird-ink">
          {skill}
        </span>
      ))}
    </div>
  );
}
