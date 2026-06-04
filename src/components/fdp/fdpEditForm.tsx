"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, X, FileText, Tag, Calendar, ChevronRight,
  GraduationCap, Clock, CheckCircle2, Upload, Building, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fdpSchema } from "@/lib/validations/fdp";
import { getFDPById, updateFDP } from "@/lib/research/fdpApi";
import { FDP, UpdateFDPInput } from "@/types/fdp";

type FDPFormValues = z.infer<typeof fdpSchema>;

const STATUS_OPTIONS = [
  {
    value: "SUBMITTED",
    label: "Submitted",
    icon: Upload,
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    activeRing: "ring-blue-400",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    activeRing: "ring-amber-400",
  },
  {
    value: "APPROVED",
    label: "Approved",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    activeRing: "ring-emerald-400",
  },
] as const;

function SectionHeader({
  icon: Icon,
  title,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0", accent)}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
        {title}
      </h3>
    </div>
  );
}

function RequiredDot() {
  return <span className="text-rose-500 ml-0.5 text-xs leading-none">*</span>;
}

export default function FDPEditForm({
  fdpId,
  open,
  onOpenChange,
  onSuccess,
}: {
  fdpId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fdp, setFdp] = useState<FDP | null>(null);
  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<FDPFormValues>({
    resolver: zodResolver(fdpSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      organizedBy: "",
      startDate: "",
      endDate: "",
      topic: "",
      duration: "",
      remark: "",
      isPublic: false,
      fdpStatus: "SUBMITTED",
    },
  });

  const loadFDPData = useCallback(async () => {
    if (!fdpId || !open) return;
    setIsLoading(true);
    try {
      const response = await getFDPById(fdpId);
      if (response.data) {
        const record = response.data;
        setFdp(record);

        form.reset({
          title: record.title,
          description: record.description || "",
          keywords: record.keywords || [],
          organizedBy: record.organizedBy || "",
          startDate: record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : "",
          endDate: record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : "",
          topic: record.topic || "",
          duration: record.duration || "",
          remark: record.remark || "",
          isPublic: record.isPublic,
          fdpStatus: record.fdpStatus,
        });
      } else {
        toast.error(response.error || "Failed to fetch FDP details");
        onOpenChange(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching FDP details");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [fdpId, open, form, onOpenChange]);

  useEffect(() => {
    void loadFDPData();
  }, [loadFDPData]);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (!kw) return;
    const current = form.getValues("keywords") || [];
    if (!current.includes(kw)) {
      if (current.length >= 10) {
        toast.error("At most 10 keywords are allowed");
        return;
      }
      form.setValue("keywords", [...current, kw], { shouldValidate: true });
    }
    setKeywordInput("");
  }, [keywordInput, form]);

  const removeKeyword = useCallback((kw: string) => {
    form.setValue(
      "keywords",
      (form.getValues("keywords") || []).filter((k) => k !== kw),
      { shouldValidate: true }
    );
  }, [form]);

  const onSubmit = useCallback(
    async (data: FDPFormValues) => {
      if (!fdpId) return;
      setIsSubmitting(true);
      try {
        const payload: UpdateFDPInput = {
          title: data.title,
          description: data.description || null,
          keywords: data.keywords || [],
          organizedBy: data.organizedBy || null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          topic: data.topic || null,
          duration: data.duration || null,
          remark: data.remark || null,
          isPublic: data.isPublic,
          fdpStatus: data.fdpStatus,
        };

        const response = await updateFDP(fdpId, payload);

        if (response.error) {
          toast.error(response.error);
          return;
        }

        toast.success("FDP record updated successfully!");
        onSuccess?.();
        onOpenChange(false);
      } catch (error: any) {
        toast.error("Failed to update FDP record");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fdpId, onSuccess, onOpenChange]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit]
  );

  const currentStatusValue = useWatch({ control: form.control, name: "fdpStatus" });
  const keywords = useWatch({ control: form.control, name: "keywords" }) ?? [];
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === currentStatusValue);
  const StatusIcon = currentStatus?.icon ?? GraduationCap;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isSubmitting) onOpenChange(val); }}>
      <DialogContent
        className="max-w-[98vw] w-4xl max-h-[92dvh] p-0 gap-0 overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl supports-backdrop-filter:bg-background/70 dark:border-white/10"
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b bg-linear-to-br from-background via-background to-muted/30 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-tight leading-tight">
                  Edit FDP Record
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Modify the details of your Faculty Development Program record
                </DialogDescription>
              </div>
            </div>

            {currentStatus && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium px-2.5 py-1 gap-1.5 shrink-0 hidden sm:flex items-center",
                  currentStatus.color
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {currentStatus.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Loading FDP details…</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 h-[calc(92dvh-160px)]">
            <Form {...form}>
              <form
                onSubmit={handleFormSubmit}
                className="px-6 sm:px-8 py-7 space-y-8"
                noValidate
              >
                {/* Revision comment banner */}
                {fdp?.updateComment && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800">
                    <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                        Revision requested by administrator
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
                        {fdp.updateComment}
                      </p>
                    </div>
                  </div>
                )}

                {/* ① Basic Information */}
                <section>
                  <SectionHeader
                    icon={FileText}
                    title="Basic Information"
                    accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  />
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            FDP Title <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Advanced Workshop on Deep Learning and Computer Vision"
                              className="h-10 text-sm rounded-lg"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the objective, major topics discussed, key outcomes, etc."
                              className="min-h-24 text-sm rounded-lg resize-none"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keywords"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Keywords <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2.5">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Type a skill/tag and press Enter"
                                  value={keywordInput}
                                  onChange={(e) => setKeywordInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addKeyword();
                                    }
                                  }}
                                  className="h-10 text-sm rounded-lg flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={addKeyword}
                                  className="h-10 px-4 rounded-lg font-medium shrink-0"
                                >
                                  Add
                                </Button>
                              </div>
                              {keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {keywords.map((kw) => (
                                    <Badge
                                      key={kw}
                                      variant="secondary"
                                      className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium rounded-full"
                                    >
                                      <Tag className="w-2.5 h-2.5 opacity-50 shrink-0" />
                                      <span>{kw}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeKeyword(kw)}
                                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-foreground/15 transition-colors ml-0.5"
                                        aria-label={`Remove keyword ${kw}`}
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Add at least 1 keyword and at most 10.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                {/* ② FDP Details */}
                <section>
                  <SectionHeader
                    icon={Building}
                    title="FDP & Organizer Details"
                    accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Organized By <RequiredDot /></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. IIT Bombay, NITTTR, Google India"
                              className="h-10 rounded-lg text-sm"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Topic / Theme</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Generative AI & Prompt Engineering"
                              className="h-10 rounded-lg text-sm"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-sm font-medium">Duration (e.g. 5 Days, 1 Week)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 5 Days"
                              className="h-10 rounded-lg text-sm"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                {/* ③ Schedule & Remarks & Visibility */}
                <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                  <div className="lg:col-span-3 space-y-5">
                    <SectionHeader
                      icon={Calendar}
                      title="Schedule & Remarks"
                      accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Start Date <RequiredDot /></FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 rounded-lg text-sm"
                                {...field}
                                value={
                                  field.value instanceof Date
                                    ? field.value.toISOString().split("T")[0]
                                    : (field.value ?? "")
                                }
                                onChange={(e) => field.onChange(e.target.value || "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">End Date <RequiredDot /></FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 rounded-lg text-sm"
                                {...field}
                                value={
                                  field.value instanceof Date
                                    ? field.value.toISOString().split("T")[0]
                                    : (field.value ?? "")
                                }
                                onChange={(e) => field.onChange(e.target.value || "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Remark</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other comments or details about the program..."
                              className="min-h-16 text-sm rounded-lg"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="lg:col-span-2 space-y-5">
                    <SectionHeader
                      icon={ChevronRight}
                      title="Visibility Settings"
                      accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    />
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
                            <div>
                              <p className="text-sm font-medium leading-tight">Make Public</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Allow others to view this FDP record
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Make FDP public"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Footer */}
                <div className="flex items-center justify-end pt-3 border-t gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-5 rounded-lg text-sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-10 px-6 rounded-lg text-sm font-semibold gap-2 min-w-36 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3.5 h-3.5" />
                        Update FDP
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
