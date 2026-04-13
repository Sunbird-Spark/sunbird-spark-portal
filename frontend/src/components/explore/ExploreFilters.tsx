import React, { BaseSyntheticEvent, useMemo, useState, useEffect, useCallback } from "react";
import { Checkbox } from "../common/CheckBox";
import { useAppI18n } from "../../hooks/useAppI18n";
import type { FilterState } from "../../pages/Explore";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../landing/Accordion";
import { useFormRead } from "../../hooks/useForm";
import type { ExploreFilterOption } from "../../types/formTypes";

// Pure helper — no component state, safe at module scope
const getValues = (option: ExploreFilterOption): string[] =>
    Array.isArray(option.value)
        ? option.value
        : option.value
            ? [option.value]
            : [];

interface ExploreFiltersProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const ExploreFilters = ({ filters, setFilters }: ExploreFiltersProps) => {
    const { t, currentCode } = useAppI18n();

    const { data: formData, isLoading, isError } = useFormRead({
        request: {
            type: 'portal',
            subType: 'explorepage',
            action: 'filters',
            component: 'portal',
        },
    });

    // State for managing open accordion sections - must be before early returns
    const [openSections, setOpenSections] = useState<string[]>([]);

    // Helper function to get label for current language with i18n support
    const getTranslatedLabel = React.useCallback((item: any): string => {
        const label = item?.label;
        
        // If label is an object with language codes
        if (typeof label === 'object' && label !== null && !Array.isArray(label)) {
            return label[currentCode] || label['en'] || Object.values(label)[0] || '';
        }
        
        // If label is a string, try to translate it (handles i18n keys like "exploreFilters.collection")
        if (typeof label === 'string' && label.length > 0) {
            return t(label, { defaultValue: label });
        }
        
        // Fallback to name field
        if (typeof item?.name === 'string' && item.name.length > 0) {
            return t(item.name, { defaultValue: item.name });
        }
        
        return '';
    }, [currentCode, t]);

    // Scenario 1: sort groups by index and apply translations
    const rawGroups = (formData?.data as any)?.form?.data?.filters;
    const filterGroups = useMemo(() => {
        if (!Array.isArray(rawGroups)) return [];
        
        return [...rawGroups]
            .sort((a, b) => a.index - b.index)
            .map(group => ({
                ...group,
                label: getTranslatedLabel(group) as string
            }));
    }, [rawGroups, getTranslatedLabel]);

    // Scenario 2: option value may be a string or string[] — normalise to string[]
    const getItems = React.useCallback((group: any) =>
        [...(group.options ?? group.list ?? [])]
            .sort((a: any, b: any) => a.index - b.index)
            .map((option: any) => ({
                ...option,
                label: getTranslatedLabel(option) as string
            })), [getTranslatedLabel]);

    const isChecked = useCallback((option: ExploreFilterOption): boolean => {
        const values = getValues(option);
        const current = filters[option.code] ?? [];
        return values.every((v) => current.includes(v));
    }, [filters]);

    // Scenario 2: key = option.code, value = option.value (string | string[])
    const handleCheckboxChange = (option: ExploreFilterOption, checked: boolean) => {
        const values = getValues(option);
        setFilters((prev) => {
            const current = prev[option.code] ?? [];
            const updated = checked
                ? [...new Set([...current, ...values])]
                : current.filter((v) => !values.includes(v));
            return { ...prev, [option.code]: updated };
        });
    };

    const handleAccordionItemClick = (e: BaseSyntheticEvent) => {
        e.stopPropagation();
    };

    // Compute which sections should be open based on filters
    const requiredOpenSections = useMemo(() => {
        const sectionsToOpen: string[] = [];

        // Always include the first section
        if (filterGroups[0]?.id) {
            sectionsToOpen.push(filterGroups[0].id);
        }

        // Add sections that have selected filters
        filterGroups.forEach((group) => {
            const groupOptions = [...(group.options ?? group.list ?? [])]
                .sort((a: any, b: any) => a.index - b.index)
                .map((option: any) => ({
                    ...option,
                    label: getTranslatedLabel(option) as string
                }));

            const hasSelectedFilter = groupOptions.some((option) => {
                const values = getValues(option);
                const current = filters[option.code] ?? [];
                return values.length > 0 && values.every((v) => current.includes(v));
            });

            if (hasSelectedFilter && !sectionsToOpen.includes(group.id)) {
                sectionsToOpen.push(group.id);
            }
        });

        return sectionsToOpen;
    }, [filterGroups, filters, getTranslatedLabel]);

    // Sync required sections with accordion state
    useEffect(() => {
        setOpenSections((prev) => {
            // Merge: keep user's manually opened sections + auto-open required sections
            const merged = [...new Set([...prev, ...requiredOpenSections])];
            
            // Only update if something changed
            if (merged.length === prev.length && merged.every(id => prev.includes(id))) {
                return prev;
            }
            
            return merged;
        });
    }, [requiredOpenSections]);

    if (isLoading) {
        return (
            <div className="bg-sunbird-gray-f3 rounded-[1.375rem] p-5">
                <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-28 bg-gray-200 rounded-xl"></div>
                    <div className="h-28 bg-gray-200 rounded-xl"></div>
                    <div className="h-28 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    // Scenario 3: hide the filter panel if the API errored or returned no filter groups
    if (isError || filterGroups.length === 0) {
        return null;
    }

    return (
        <div data-testid="explore-filters" className="bg-sunbird-gray-f3 rounded-[1.375rem] p-5">
            {/* Filters Title */}
            <h2 className="text-lg font-bold text-foreground mb-4 px-1">{t("filters")}</h2>

            <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
                className="w-full space-y-3"
            >
                {/* Scenario 1: groups already sorted above */}
                {filterGroups.map((group) => (
                    <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="bg-white rounded-xl border-none px-4 shadow-sm"
                    >
                        <AccordionTrigger className="hover:no-underline py-4">
                            <span className="text-sm font-semibold text-foreground">
                                {group.label}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-1 pb-4">
                                {/* Scenario 1: options sorted by index inside getItems() */}
                                {getItems(group).map((option) => (
                                    <label
                                        key={option.id}
                                        className="flex items-center justify-start gap-3 cursor-pointer group"
                                        onClick={handleAccordionItemClick}
                                    >
                                        <Checkbox
                                            checked={isChecked(option)}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(option, checked as boolean)
                                            }
                                            className="h-5 w-5 rounded border-sunbird-ginger data-[state=checked]:bg-sunbird-ginger data-[state=checked]:border-sunbird-ginger"
                                        />
                                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default ExploreFilters;
