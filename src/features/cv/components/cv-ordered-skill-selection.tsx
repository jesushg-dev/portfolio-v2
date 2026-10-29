"use client";

import { GripVertical, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SkillOption } from "@/components/admin/skill-picker";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { Button } from "@/components/ui/button";
import { CvReorderButtons } from "./cv-reorder-buttons";

interface Props {
  availableSkills: SkillOption[];
  selectedSkillIds: string[];
  onChange: (ids: string[]) => void;
}

export function CvOrderedSkillSelection({
  availableSkills,
  selectedSkillIds,
  onChange,
}: Props) {
  const t = useTranslations("admin.forms.skills");
  const selected = selectedSkillIds.flatMap((id) => {
    const skill = availableSkills.find((item) => item.id === id);
    return skill ? [skill] : [];
  });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= selected.length) return;
    const next = [...selectedSkillIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  if (!selected.length) return null;
  return (
    <Sortable
      value={selected}
      getItemValue={(skill) => skill.id}
      onValueChange={(skills) => onChange(skills.map((skill) => skill.id))}
    >
      <SortableContent asChild>
        <ol className="space-y-2">
          {selected.map((skill, index) => (
            <SortableItem key={skill.id} value={skill.id} asChild>
              <li className="border-border bg-card flex items-center gap-2 rounded-lg border p-2">
                <SortableItemHandle asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveSkill", { name: skill.title })}
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </Button>
                </SortableItemHandle>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {skill.title}
                </span>
                <CvReorderButtons
                  index={index}
                  total={selected.length}
                  onMoveUp={() => move(index, -1)}
                  onMoveDown={() => move(index, 1)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("hideSkill", { name: skill.title })}
                  onClick={() =>
                    onChange(selectedSkillIds.filter((id) => id !== skill.id))
                  }
                >
                  <EyeOff className="size-4" aria-hidden />
                </Button>
              </li>
            </SortableItem>
          ))}
        </ol>
      </SortableContent>
    </Sortable>
  );
}
