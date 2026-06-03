"use client";

import { useState, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Upload, X, FileText,
  Tag, Calendar, ChevronRight, CheckCircle2,
  Clock, Building, Award, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
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
import { uploadFile } from "@/lib/appwrite";
import { certificateSchema } from "@/lib/validations/certificate";
import { createCertificate } from "@/lib/research/certificateApi";

type CertificateFormValues = z.infer<typeof certificateSchema>;

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

interface UploadZoneProps {
  label: string;
  hint: string;
  uploading: boolean;
  fileName?: string;
  hasValue: boolean;
  onTrigger: () => void;
  onRemove: () => void;
  error?: string;
}

function UploadZone({
  label, hint, uploading, fileName, hasValue, onTrigger, onRemove, error,
}: UploadZoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={!uploading ? onTrigger : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!uploading) onTrigger(); } }}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        hasValue || fileName
          ? "border-primary/40 bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        error && "border-destructive/50 bg-destructive/5",
        uploading && "cursor-not-allowed opacity-70",
      )}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2 py-1">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Uploading…</p>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Uploaded ✓</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="w-7 h-7 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors shrink-0"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-1">
          <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center">
            <Upload className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificateAddForm({
  onSuccess,
  trigger,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  // Files
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const documentInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      documentUrl: "",
      offeredBy: "",
      dateOfCompletion: "",
      remark: "",
      isPublic: true,
      certificateStatus: "SUBMITTED",
    },
  });

  const resetForm = useCallback(() => {
    form.reset();
    setDocumentFile(null);
    setKeywordInput("");
    if (documentInputRef.current) documentInputRef.current.value = "";
  }, [form]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    setOpen(nextOpen);
  }, [isSubmitting]);

  const handleDocumentChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Document must be smaller than 10 MB");
      e.target.value = "";
      return;
    }
    setDocumentFile(file);
    setUploadingDocument(true);
    try {
      const url = await uploadFile(file);
      form.setValue("documentUrl", url, { shouldValidate: true });
      toast.success("Certificate document uploaded");
    } catch {
      toast.error("Document upload failed — please try again");
      setDocumentFile(null);
      form.setValue("documentUrl", "");
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  }, [form]);

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
    async (data: CertificateFormValues) => {
      setIsSubmitting(true);
      try {
        const response = await createCertificate({
          ...data,
          description: data.description || undefined,
          remark: data.remark || undefined,
          dateOfCompletion: new Date(data.dateOfCompletion).toISOString(),
        });

        if (response.error) {
          toast.error(response.error);
          return;
        }

        toast.success("Certificate created successfully!");
        resetForm();
        setOpen(false);
        onSuccess?.();
      } catch (error: any) {
        toast.error("Failed to create certificate");
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess, resetForm]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit]
  );

  const currentStatusValue = useWatch({ control: form.control, name: "certificateStatus" });
  const keywords = useWatch({ control: form.control, name: "keywords" }) ?? [];
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === currentStatusValue);
  const StatusIcon = currentStatus?.icon ?? Award;

  return (
    <>
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleDocumentChange}
      />

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="gap-2 font-medium">
              <Award className="w-4 h-4" />
              Add Certificate
            </Button>
          )}
        </DialogTrigger>

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
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Award className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight leading-tight">
                    Add Certificate
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    Register a new training, project, or course certification details
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
          <ScrollArea className="flex-1 h-[calc(92dvh-160px)]">
            <Form {...form}>
              <form
                onSubmit={handleFormSubmit}
                className="px-6 sm:px-8 py-7 space-y-8"
                noValidate
              >
                {/* ① Basic Information */}
                <section>
                  <SectionHeader
                    icon={FileText}
                    title="Basic Information"
                    accent="bg-primary/10 text-primary"
                  />
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Certificate Title <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Google Cloud Certified Professional Cloud Architect"
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
                              placeholder="Summarize course content, syllabus, training hours, or core outcomes…"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                {/* ② Certification Details */}
                <section>
                  <SectionHeader
                    icon={Building}
                    title="Certification Details"
                    accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="offeredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Offered By (Issuer) <RequiredDot /></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Google Cloud, Coursera, Udemy"
                              className="h-10 rounded-lg text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Date of Completion <RequiredDot /></FormLabel>
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
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="remark"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-sm font-medium">Remark</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional remarks or notes…"
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
                </section>

                <Separator />

                {/* ③ Visibility & Attachments */}
                <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                  <div className="lg:col-span-3 space-y-4">
                    <SectionHeader
                      icon={Upload}
                      title="Attachments"
                      accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    />
                    <FormField
                      control={form.control}
                      name="documentUrl"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Certificate File (PDF or Image) <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <UploadZone
                              label="Upload certificate document"
                              hint="PDF, JPG, PNG · max 10 MB"
                              uploading={uploadingDocument}
                              fileName={documentFile?.name}
                              hasValue={!!field.value}
                              onTrigger={() => documentInputRef.current?.click()}
                              onRemove={() => {
                                setDocumentFile(null);
                                form.setValue("documentUrl", "", { shouldValidate: true });
                              }}
                              error={fieldState.error?.message}
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
                      title="Visibility"
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
                                Allow others to view this certificate
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Make certificate public"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-sm"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Reset form
                  </Button>
                  <div className="flex items-center gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-5 rounded-lg text-sm"
                      onClick={() => setOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-10 px-6 rounded-lg text-sm font-semibold gap-2 min-w-36"
                      disabled={isSubmitting || uploadingDocument}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5" />
                          Add Certificate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
