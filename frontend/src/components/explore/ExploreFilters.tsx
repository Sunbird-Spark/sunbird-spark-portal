import React, { BaseSyntheticEvent, useMemo } from "react";
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
import type { ExploreFilterGroup, ExploreFilterOption } from "../../types/formTypes";

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

    // Helper function to get label for current language
    const getTranslatedLabel = React.useCallback((item: any): string => {
        const label = item?.label;
        
        // If label is an object with language codes
        if (typeof label === 'object' && label !== null && !Array.isArray(label)) {
            // Return translation for current language, fallback to English, then first available
            return label[currentCode] || label['en'] || Object.values(label)[0] || '';
        }
        
        // If label is a string, return it directly
        return label || item?.name || '';
    }, [currentCode]);

    // Scenario 1: sort groups by index and apply translations
    const rawGroups = (formData?.data as any)?.form?.data?.filters;
    const filterGroups: ExploreFilterGroup[] = useMemo(() => {
        if (!Array.isArray(rawGroups)) return [];
        
        return [...rawGroups]
            .sort((a, b) => a.index - b.index)
            .map(group => ({
                ...group,
                label: getTranslatedLabel(group)
            }));
    }, [rawGroups, getTranslatedLabel]);

    // Scenario 2: option value may be a string or string[] — normalise to string[]
    const getItems = React.useCallback((group: ExploreFilterGroup): ExploreFilterOption[] =>
        [...(group.options ?? group.list ?? [])]
            .sort((a, b) => a.index - b.index)
            .map(option => ({
                ...option,
                label: getTranslatedLabel(option)
            })), [getTranslatedLabel]);

    const getValues = (option: ExploreFilterOption): string[] =>
        Array.isArray(option.value)
            ? option.value
            : option.value
                ? [option.value]
                : [];

    const isChecked = (option: ExploreFilterOption): boolean => {
        const values = getValues(option);
        const current = filters[option.code] ?? [];
        return values.every((v) => current.includes(v));
    };

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

    // Scenario 4: only open the first section by default
    const defaultOpenId = filterGroups[0]?.id;

    return (
        <div data-testid="explore-filters" className="bg-sunbird-gray-f3 rounded-[1.375rem] p-5">
            {/* Filters Title */}
            <h2 className="text-lg font-bold text-foreground mb-4 px-1">{t("filters")}</h2>

            <Accordion
                type="multiple"
                defaultValue={defaultOpenId ? [defaultOpenId] : []}
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
