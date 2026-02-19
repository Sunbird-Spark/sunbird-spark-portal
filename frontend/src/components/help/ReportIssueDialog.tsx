import { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  Dialog,
  DialogContent,
  DialogTitle,
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

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formService = new FormService();

interface Option {
  value: string;
  label: string;
}

const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subcategoryOptionsMap, setSubcategoryOptionsMap] = useState<Record<string, Option[]>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

        console.log("[ReportIssueDialog] raw response:", JSON.stringify(response));
        const fields = (response.data as any).form?.data?.fields;
        console.log("[ReportIssueDialog] fields:", fields);
        const categoryField = fields?.find((field: any) => field.code === "category");
        const subcategoryField = fields?.find((field: any) => field.code === "subcategory");

        if (categoryField?.templateOptions?.options) {
          setCategoryOptions(categoryField.templateOptions.options);
        }

        if (subcategoryField?.templateOptions?.options) {
          setSubcategoryOptionsMap(subcategoryField.templateOptions.options);
        }
      } catch (e) {
        console.error("Failed to fetch form data", e);
        toast({
          title: "Error",
          description: "Failed to load report issue options",
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
    setTimeout(() => {
      setSubmitted(false);
      setCategory("");
      setSubcategory("");
      setDescription("");
      onOpenChange(false);
    }, 5000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-[43.625rem] p-[4.125rem] rounded-[50px] bg-white gap-6">
        <DialogClose className="absolute right-[2.75rem] top-[2.375rem] opacity-100 focus:outline-none text-sunbird-brick">
          <AiOutlineClose className="w-[24px] h-[24px]" style={{ strokeWidth: "20px" }} />
        </DialogClose>
        <div className="flex justify-between items-center">
          <DialogTitle className="font-['Rubik'] font-medium text-[1.5rem] leading-[1.25rem] tracking-normal text-foreground">
            Report an Issue
          </DialogTitle>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="border-sunbird-gray-d0 rounded-[0.625rem] h-[3rem] px-4 font-['Rubik'] font-normal text-[1rem] leading-[1.25rem] tracking-normal bg-white text-left [&>svg]:text-sunbird-brick [&>svg]:opacity-100 [&>svg]:w-[1.5rem] [&>svg]:h-[1.5rem]">
              <SelectValue placeholder={<span className="text-muted-foreground">Select Category</span>} />
            </SelectTrigger>
            <SelectContent className="bg-white z-[100]">
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="font-['Rubik'] font-normal text-[1rem] leading-[1.25rem] focus:bg-sunbird-ginger focus:text-white">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {category !== "otherissues" && (
            <Select value={subcategory} onValueChange={setSubcategory} disabled={!category || currentSubcategoryOptions.length === 0}>
              <SelectTrigger className="border-sunbird-gray-d0 rounded-[0.625rem] h-[3rem] px-4 font-['Rubik'] font-normal text-[1rem] leading-[1.25rem] tracking-normal bg-white text-left [&>svg]:text-sunbird-brick [&>svg]:opacity-100 [&>svg]:w-[1.5rem] [&>svg]:h-[1.5rem]">
                <SelectValue placeholder={<span className="text-muted-foreground">Select Subcategory</span>} />
              </SelectTrigger>
              <SelectContent className="bg-white z-[100]">
                {currentSubcategoryOptions.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value} className="font-['Rubik'] font-normal text-[1rem] leading-[1.25rem] focus:bg-sunbird-ginger focus:text-white">
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us more"
          maxLength={5000}
          className="border-sunbird-gray-d0 rounded-[0.625rem] min-h-[10rem] font-['Rubik'] font-normal text-[1rem] leading-[1.25rem] tracking-normal mt-1 resize-none placeholder:text-muted-foreground px-4 py-3 bg-white"
        />

        {submitted && (
          <div className="absolute top-[2.25rem] left-[4.125rem] right-[4.125rem] flex items-start gap-3 bg-[#F0F4F0] border-l-4 border-[#4CAF50] rounded-[0.625rem] px-4 py-3 z-10">
            <span className="text-[#4CAF50] text-lg mt-0.5">✓</span>
            <p className="font-['Rubik'] text-[0.875rem] leading-[1.4] text-foreground">
              Thanks for your feedback. We may not be able to respond to every suggestion, but your feedback helps make SUNBIRD better for everyone.
            </p>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={submitted || !category || (currentSubcategoryOptions.length > 0 && !subcategory)}
            className={`w-[13.125rem] h-[2.875rem] rounded-[0.625rem] font-['Rubik'] text-[1rem] leading-[1.1875rem] font-medium transition-colors flex items-center justify-center ${!category || (currentSubcategoryOptions.length > 0 && !subcategory)
              ? "bg-sunbird-gray-d0 text-sunbird-gray-75 cursor-not-allowed"
              : "bg-sunbird-brick text-white hover:opacity-90"
              }`}
          >
            Submit Feedback
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
