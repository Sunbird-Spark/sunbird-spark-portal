import { useState, useEffect, useRef } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/common/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { Textarea } from "@/components/common/TextArea";
import { toast } from "@/hooks/useToast";
import { FormService } from "@/services/FormService";
import { useAppI18n } from "@/hooks/useAppI18n";
import { resolveTitleText } from "@/utils/i18nUtils";
import { useSystemSetting } from "@/hooks/useSystemSetting";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formService = new FormService();

interface Option {
  value: string;
  label: string | Record<string, string>;
}

const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const { t, currentCode } = useAppI18n();
  const { data: appNameSetting } = useSystemSetting("sunbird");
  const appName = appNameSetting?.data?.response?.value || appNameSetting?.data?.value || t("reportIssueDialog.thisApplication");
  
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subcategoryOptionsMap, setSubcategoryOptionsMap] = useState<Record<string, Option[]>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset submitted state and clear any pending timer when dialog closes
  useEffect(() => {
    if (!open) {
      if (submitTimerRef.current !== null) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
      setSubmitted(false);
      setCategory("");
      setSubcategory("");
      setDescription("");
    }
  }, [open]);

  useEffect(() => {
    const fetchFormData = async () => {
      setLoading(true);
      try {
        const response = await formService.formRead({
          type: "config",
          subType: "faq",
          action: "reportissue",
          component: "portal",
        });

        const formData = response.data.form;
        const fields: Array<{ code: string; templateOptions?: { options?: Option[] | Record<string, Option[]> } }> = formData?.data?.fields ?? [];
        const categoryField = fields.find((field) => field.code === "category");
        const subcategoryField = fields.find((field) => field.code === "subcategory");

        if (categoryField?.templateOptions?.options) {
          setCategoryOptions(categoryField.templateOptions.options as Option[]);
        }

        if (subcategoryField?.templateOptions?.options) {
          setSubcategoryOptionsMap(subcategoryField.templateOptions.options as Record<string, Option[]>);
        }
      } catch (e) {
        console.error("Failed to fetch form data", e);
        toast({
          title: t("error"),
          description: t("reportIssueDialog.loadError"),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchFormData();
    }
  }, [open]);

  // Update subcategory selection when category changes
  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSubcategory(""); // Reset subcategory
  };

  const currentSubcategoryOptions = subcategoryOptionsMap[category] || [];

  const handleSubmit = () => {
    setSubmitted(true);
    submitTimerRef.current = setTimeout(() => {
      submitTimerRef.current = null;
      onOpenChange(false);
    }, 5000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-[43.625rem] p-[4.125rem] rounded-[50px] bg-white gap-6">
        <DialogClose className="absolute right-[2.75rem] top-[2.375rem] opacity-100 focus:outline-none text-sunbird-brick">
          <AiOutlineClose className="w-[24px] h-[24px]" />
        </DialogClose>
        <div className="flex justify-between items-center">
          <DialogTitle className="font-rubik font-medium text-[1.5rem] leading-[1.25rem] tracking-normal text-foreground">
            {t("reportIssueDialog.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("reportIssueDialog.description")}
          </DialogDescription>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Select value={category} onValueChange={handleCategoryChange} disabled={loading}>
            <SelectTrigger className="border-sunbird-gray-d0 rounded-[0.625rem] h-[3rem] px-4 font-rubik font-normal text-[1rem] leading-[1.25rem] tracking-normal bg-white text-left [&>svg]:text-sunbird-brick [&>svg]:opacity-100 [&>svg]:w-[1.5rem] [&>svg]:h-[1.5rem]">
              <SelectValue placeholder={<span className="text-muted-foreground">{loading ? t("loading") : t("reportIssueDialog.selectCategory")}</span>} />
            </SelectTrigger>
            <SelectContent className="bg-white z-[100]">
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="font-rubik font-normal text-[1rem] leading-[1.25rem] focus:bg-sunbird-ginger focus:text-white">
                  {resolveTitleText(cat.label, currentCode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {category !== "otherissues" && (
            <Select value={subcategory} onValueChange={setSubcategory} disabled={loading || !category || currentSubcategoryOptions.length === 0}>
              <SelectTrigger className="border-sunbird-gray-d0 rounded-[0.625rem] h-[3rem] px-4 font-rubik font-normal text-[1rem] leading-[1.25rem] tracking-normal bg-white text-left [&>svg]:text-sunbird-brick [&>svg]:opacity-100 [&>svg]:w-[1.5rem] [&>svg]:h-[1.5rem]">
                <SelectValue placeholder={<span className="text-muted-foreground">{t("reportIssueDialog.selectSubcategory")}</span>} />
              </SelectTrigger>
              <SelectContent className="bg-white z-[100]">
                {currentSubcategoryOptions.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value} className="font-rubik font-normal text-[1rem] leading-[1.25rem] focus:bg-sunbird-ginger focus:text-white">
                    {resolveTitleText(sub.label, currentCode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("reportIssueDialog.tellUsMore")}
          maxLength={5000}
          className="border-sunbird-gray-d0 rounded-[0.625rem] min-h-[10rem] font-rubik font-normal text-[1rem] leading-[1.25rem] tracking-normal mt-1 resize-none placeholder:text-muted-foreground px-4 py-3 bg-white"
        />

        {submitted && (
          <div className="absolute top-[2.25rem] left-[4.125rem] right-[4.125rem] flex items-start gap-3 bg-sunbird-success-message-bg border-l-4 border-sunbird-success-message rounded-[0.625rem] px-4 py-3 z-10">
            <span className="text-sunbird-success-message text-lg mt-0.5">✓</span>
            <p className="font-rubik text-[0.875rem] leading-[1.4] text-foreground">
              {t("reportIssueDialog.feedbackSuccess", { appName })}
            </p>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={submitted || !category || (currentSubcategoryOptions.length > 0 && !subcategory)}
            className={`w-[13.125rem] h-[2.875rem] rounded-[0.625rem] font-rubik text-[1rem] leading-[1.1875rem] font-medium transition-colors flex items-center justify-center ${!category || (currentSubcategoryOptions.length > 0 && !subcategory)
              ? "bg-sunbird-gray-d0 text-sunbird-gray-75 cursor-not-allowed"
              : "bg-sunbird-brick text-white hover:opacity-90"
              }`}
          >
            {t("reportIssueDialog.submitFeedback")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
