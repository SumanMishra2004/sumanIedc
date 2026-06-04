"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Upload, X, Lightbulb, FileText,
  Users, Tag, Calendar, ChevronRight, CheckCircle2,
  Clock, Globe, Link as LinkIcon, MessageSquare
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
import { uploadFile } from "@/lib/appwrite";
import { patentSchema } from "@/lib/validations/patent";
import { getPatentById, updatePatent } from "@/lib/research/patentApi";
import { MultiSelectUsers } from "@/components/ui/multi-select";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";

type PatentFormValues = z.infer<typeof patentSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Patent {
  id: string;
  title: string;
  abstract?: string | null;
  imageUrl?: string | null;
  documentUrl?: string | null;
  patentStatus: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "GRANTED";
  teacherStatus: "UPLOADED" | "ACCEPTED" | "UPDATE" | "REJECTED" | "PUBLISHED";
  applicationNo?: string | null;
  grantedPatentNo?: string | null;
  patentLink?: string | null;
  isPublic: boolean;
  keywords: string[];
  filingDate?: string | Date | null;
  submissionDate?: string | Date | null;
  publicationDate?: string | Date | null;
  grantDate?: string | Date | null;
  updateComment?: string | null;
  facultyAuthors?: Array<{
    id: string;
    user: { id: string; name: string | null; email: string | null; image?: string | null };
  }>;
  studentAuthors?: Array<{
    id: string;
    user: { id: string; name: string | null; email: string | null; image?: string | null };
  }>;
}

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
  {
    value: "GRANTED",
    label: "Granted",
    icon: Lightbulb,
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    activeRing: "ring-purple-400",
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
  existingLabel?: string;
  onTrigger: () => void;
  onRemove: () => void;
  error?: string;
}

function UploadZone({
  label, hint, uploading, fileName, hasValue, existingLabel, onTrigger, onRemove, error,
}: UploadZoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={!uploading ? onTrigger : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!uploading) onTrigger();
        }
      }}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-5 transition-all duration-200 cursor-pointer outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        fileName
          ? "border-primary/40 bg-primary/5"
          : hasValue
          ? "border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-950/20"
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
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready to upload ✓</p>
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
      ) : hasValue ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {existingLabel ?? "File on record"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to replace
            </p>
          </div>
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

export default function EditPatentDialog({
  patentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  patentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patent, setPatent] = useState<Patent | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const { cropState, openCrop, closeCrop } = useImageCrop();

  // Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Authors
  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PatentFormValues>({
    resolver: zodResolver(patentSchema) as any,
    defaultValues: {
      title: "",
      abstract: "",
      imageUrl: "",
      documentUrl: "",
      patentStatus: "SUBMITTED",
      teacherStatus: "UPLOADED",
      grantedPatentNo: "",
      applicationNo: "",
      patentLink: "",
      isPublic: false,
      keywords: [],
      filingDate: null,
      submissionDate: null,
      publicationDate: null,
      grantDate: null,
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  const loadPatentData = useCallback(async () => {
    if (!patentId) return;
    setIsLoading(true);
    try {
      const result = await getPatentById(patentId);
      if (result.error || !result.data) {
        toast.error(result.error || "Failed to fetch patent details");
        onOpenChange(false);
        return;
      }

      const pat: Patent = result.data.patent;
      setPatent(pat);

      const formatDate = (date: any) => {
        if (!date) return "";
        return new Date(date).toISOString().split('T')[0];
      };

      form.reset({
        title: pat.title,
        abstract: pat.abstract || "",
        imageUrl: pat.imageUrl || "",
        documentUrl: pat.documentUrl || "",
        patentStatus: pat.patentStatus,
        teacherStatus: pat.teacherStatus,
        grantedPatentNo: pat.grantedPatentNo || "",
        applicationNo: pat.applicationNo || "",
        patentLink: pat.patentLink || "",
        isPublic: pat.isPublic,
        keywords: pat.keywords || [],
        filingDate: pat.filingDate ? formatDate(pat.filingDate) : null,
        submissionDate: pat.submissionDate ? formatDate(pat.submissionDate) : null,
        publicationDate: pat.publicationDate ? formatDate(pat.publicationDate) : null,
        grantDate: pat.grantDate ? formatDate(pat.grantDate) : null,
        facultyAuthorIds: pat.facultyAuthors?.map((a) => a.user.id) || [],
        studentAuthorIds: pat.studentAuthors?.map((a) => a.user.id) || [],
      });

      if (pat.facultyAuthors) {
        setSelectedFaculty(
          pat.facultyAuthors.map((a) => ({
            id: a.user.id,
            name: a.user.name || "",
            email: a.user.email || "",
            image: a.user.image || undefined,
          }))
        );
      }

      if (pat.studentAuthors) {
        setSelectedStudents(
          pat.studentAuthors.map((a) => ({
            id: a.user.id,
            name: a.user.name || "",
            email: a.user.email || "",
            image: a.user.image || undefined,
          }))
        );
      }
    } catch {
      toast.error("Failed to load patent");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [patentId, form, onOpenChange]);

  useEffect(() => {
    if (open && patentId) {
      const id = window.setTimeout(() => void loadPatentData(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, patentId, loadPatentData]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    openCrop(file, "poster", async (croppedFile) => {
      closeCrop();
      setImageFile(croppedFile);
      setUploadingImage(true);
      try {
        const url = await uploadFile(croppedFile);
        form.setValue("imageUrl", url, { shouldValidate: true });
        toast.success("Cover image updated");
      } catch {
        toast.error("Image upload failed — please try again");
        setImageFile(null);
      } finally {
        setUploadingImage(false);
      }
    });
  }, [form, openCrop, closeCrop]);

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
      toast.success("Document updated");
    } catch {
      toast.error("Document upload failed — please try again");
      setDocumentFile(null);
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

  const onSubmit = async (data: PatentFormValues) => {
    if (!patentId) return;
    setIsSubmitting(true);
    try {
      const response = await updatePatent(patentId, {
        ...data,
        abstract: data.abstract || undefined,
        imageUrl: data.imageUrl || undefined,
        documentUrl: data.documentUrl || undefined,
        grantedPatentNo: data.grantedPatentNo || undefined,
        applicationNo: data.applicationNo || undefined,
        patentLink: data.patentLink || undefined,
        filingDate: data.filingDate ? new Date(data.filingDate).toISOString() : undefined,
        submissionDate: data.submissionDate ? new Date(data.submissionDate).toISOString() : undefined,
        publicationDate: data.publicationDate ? new Date(data.publicationDate).toISOString() : undefined,
        grantDate: data.grantDate ? new Date(data.grantDate).toISOString() : undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Patent updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to update patent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatusValue = useWatch({ control: form.control, name: "patentStatus" });
  const keywords = useWatch({ control: form.control, name: "keywords" }) ?? [];
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === currentStatusValue);
  const StatusIcon = currentStatus?.icon ?? Lightbulb;

  return (
    <>
      {cropState.open && <ImageCropModal src={cropState.src} ratio={cropState.ratio} fileName={cropState.fileName} onCrop={cropState.onCrop} onCancel={closeCrop} />}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleImageChange}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleDocumentChange}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[92dvh] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl"
          onInteractOutside={(e) => {
            if (isSubmitting) e.preventDefault();
          }}
        >
          {/* Header */}
          <div className="px-6 sm:px-8 pt-6 pb-5 border-b bg-gradient-to-br from-background via-background to-muted/30 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Lightbulb className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight leading-tight">
                    Edit Patent details
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    Update the registered information of your patent entry
                  </DialogDescription>
                </div>
              </div>

              {!isLoading && currentStatus && (
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
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Loading patent details…</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 h-[calc(92dvh-160px)]">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="px-6 sm:px-8 py-7 space-y-8"
                  noValidate
                >
                  {/* Revision comment banner */}
                  {patent?.updateComment && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800">
                      <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                          Revision requested by reviewer
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
                          {patent.updateComment}
                        </p>
                      </div>
                    </div>
                  )}

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
                              Patent Title <RequiredDot />
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Adaptive edge-cloud dynamic virtualization"
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
                        name="abstract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Abstract
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide a concise summary of the patent abstract…"
                                className="min-h-28 text-sm rounded-lg resize-none"
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
                                    placeholder="Type a keyword and press Enter"
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

                  {/* ② Patent Details */}
                  <section>
                    <SectionHeader
                      icon={Globe}
                      title="Patent Details"
                      accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="applicationNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Application No.</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Application number"
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
                        name="grantedPatentNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Granted Patent No. {currentStatusValue === "GRANTED" && <RequiredDot />}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Patent grant number"
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
                        name="patentLink"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel className="text-sm font-medium">Patent Link (URL)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                  placeholder="Patent url"
                                  className="h-10 rounded-lg text-sm pl-8"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="filingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Filing Date</FormLabel>
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
                        name="submissionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Submission Date</FormLabel>
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
                        name="publicationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Publication Date</FormLabel>
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
                        name="grantDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Grant Date {currentStatusValue === "GRANTED" && <RequiredDot />}
                            </FormLabel>
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
                    </div>
                  </section>

                  <Separator />

                  {/* ③ Authors & Status */}
                  <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    {/* Authors */}
                    <div className="lg:col-span-3 space-y-5">
                      <SectionHeader
                        icon={Users}
                        title="Authors"
                        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      />
                      <FormField
                        control={form.control}
                        name="facultyAuthorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Faculty Authors <RequiredDot />
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground">
                              Faculty inventors listed on registration
                            </FormDescription>
                            <FormControl>
                              <MultiSelectUsers
                                isStudent={false}
                                value={selectedFaculty}
                                onChange={(users) => {
                                  setSelectedFaculty(users);
                                  field.onChange(users.map((u) => u.id));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="studentAuthorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Student Authors
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground">
                              Student inventors listed on registration
                            </FormDescription>
                            <FormControl>
                              <MultiSelectUsers
                                isStudent={true}
                                value={selectedStudents}
                                onChange={(users) => {
                                  setSelectedStudents(users);
                                  field.onChange(users.map((u) => u.id));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Status & Visibility */}
                    <div className="lg:col-span-2 space-y-5">
                      <SectionHeader
                        icon={ChevronRight}
                        title="Status & Visibility"
                        accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      />

                      <FormField
                        control={form.control}
                        name="patentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Status <RequiredDot />
                            </FormLabel>
                            <div className="grid grid-cols-2 gap-2 mt-1.5">
                              {STATUS_OPTIONS.map((s) => {
                                const Icon = s.icon;
                                const isActive = field.value === s.value;
                                return (
                                  <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => field.onChange(s.value)}
                                    className={cn(
                                      "flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-lg border transition-all text-left",
                                      isActive
                                        ? cn(s.color, "ring-1 ring-inset", s.activeRing)
                                        : "border-border hover:bg-muted/60 text-muted-foreground bg-transparent"
                                    )}
                                  >
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    {s.label}
                                  </button>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
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
                                  Visible to everyone in directory
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  aria-label="Make patent public"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <Separator />

                  {/* ④ Attachments */}
                  <section>
                    <SectionHeader
                      icon={Upload}
                      title="Attachments"
                      accent="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cover image */}
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Patent Cover Image / Artwork
                            </FormLabel>
                            <FormControl>
                              <UploadZone
                                label="Upload cover image"
                                hint="JPG or PNG · max 5 MB"
                                uploading={uploadingImage}
                                fileName={imageFile?.name}
                                hasValue={!!field.value}
                                existingLabel="Cover image on file"
                                onTrigger={() => imageInputRef.current?.click()}
                                onRemove={() => {
                                  setImageFile(null);
                                  form.setValue("imageUrl", "", { shouldValidate: true });
                                }}
                                error={fieldState.error?.message}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Document */}
                      <FormField
                        control={form.control}
                        name="documentUrl"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Patent Manuscript / Proof File
                            </FormLabel>
                            <FormControl>
                              <UploadZone
                                label="Upload manuscript"
                                hint="PDF, DOC, DOCX · max 10 MB"
                                uploading={uploadingDocument}
                                fileName={documentFile?.name}
                                hasValue={!!field.value}
                                existingLabel="Patent document on file"
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
                  </section>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
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
                      className="h-10 px-6 rounded-lg text-sm font-semibold gap-2 min-w-36"
                      disabled={isSubmitting || uploadingImage || uploadingDocument}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3.5 h-3.5" />
                          Update Patent
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
    </>
  );
}
