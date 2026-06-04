"use client";

import { useState, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import {
  Loader2, Upload, X, BookOpen, FileText,
  Users, Tag, Building2, ChevronRight, CheckCircle2,
  Clock, Globe
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectUsers } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/appwrite";
import { bookChapterSchema } from "@/lib/validations/book-chapter";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";

// ─── Types ─────────────────────────────────────────────────────────────────────
type BookChapterFormValues = z.infer<typeof bookChapterSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
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
    value: "PUBLISHED",
    label: "Published",
    icon: BookOpen,
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    activeRing: "ring-purple-400",
  },
] as const;

const PUBLISHERS = [
  "Elsevier", "Springer Nature", "Taylor & Francis", "Wiley",
  "SAGE Publishing", "Oxford University Press", "Cambridge University Press",
  "De Gruyter", "Brill Publishers", "MDPI", "BioMed Central (BMC)",
  "Frontiers", "Inderscience", "Emerald Publishing", "IEEE",
  "American Chemical Society", "American Medical Association",
  "Palgrave Macmillan", "Pearson Education", "McGraw Hill Education", "World Scientific",
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

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

// ─── Upload Zone (THE FIX) ──────────────────────────────────────────────────────
//
// ROOT CAUSE: When `Dialog` has `modal={false}`, Radix sets `pointer-events: none`
// on the body after the OS file-picker opens (focus leaves the window). This freezes
// the entire dialog until a hard refresh.
//
// FIX: Keep the hidden <input type="file"> OUTSIDE the Dialog DOM (rendered at the
// body root via a ref passed in), and trigger it programmatically. This prevents
// the Radix focus-trap / pointer-event lock from interfering with the native picker.
//
interface UploadZoneProps {
  label: string;
  hint: string;
  uploading: boolean;
  fileName?: string;
  hasValue: boolean;
  onTrigger: () => void;     // caller triggers the hidden input
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

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function BookChapterDialog({
  onSuccess,
  trigger,
  onClose,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const { cropState, openCrop, closeCrop } = useImageCrop();

  // File state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Authors
  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  // Publisher
  const [showCustomPublisher, setShowCustomPublisher] = useState(false);
  const [customPublisher, setCustomPublisher] = useState("");

  // ── THE FIX: hidden file inputs live outside the dialog ──────────────────────
  // We render them directly in the component (outside DialogContent) so they are
  // never affected by Radix's pointer-events/focus-trap management on the dialog.
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BookChapterFormValues>({
    resolver: zodResolver(bookChapterSchema),
    defaultValues: {
      title: "",
      abstract: "",
      imageUrl: "",
      documentUrl: null,
      bookChapterStatus: "SUBMITTED",
      isbnIssn: null,
      registrationFees: null,
      reimbursement: null,
      isPublic: false,
      keywords: [],
      doi: null,
      publicationDate: null,
      publisher: "",
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  const resetForm = useCallback(() => {
    form.reset();
    setImageFile(null);
    setDocumentFile(null);
    setKeywordInput("");
    setSelectedFaculty([]);
    setSelectedStudents([]);
    setShowCustomPublisher(false);
    setCustomPublisher("");
    // Clear the hidden inputs too
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  }, [form]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return; // prevent accidental close while saving
    setOpen(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  }, [isSubmitting, onClose]);

  // ── Image handler (attached to the outside input) ─────────────────────────
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
        toast.success("Cover image uploaded");
      } catch {
        toast.error("Image upload failed — please try again");
        setImageFile(null);
        form.setValue("imageUrl", "");
      } finally {
        setUploadingImage(false);
      }
    });
  }, [form, openCrop, closeCrop]);

  // ── Document handler ───────────────────────────────────────────────────────
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
      toast.success("Document uploaded");
    } catch {
      toast.error("Document upload failed — please try again");
      setDocumentFile(null);
      form.setValue("documentUrl", null);
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  }, [form]);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (!kw) return;
    const current = form.getValues("keywords");
    if (!current.includes(kw)) {
      form.setValue("keywords", [...current, kw], { shouldValidate: true });
    }
    setKeywordInput("");
  }, [keywordInput, form]);

  const removeKeyword = useCallback((kw: string) => {
    form.setValue(
      "keywords",
      form.getValues("keywords").filter((k) => k !== kw),
      { shouldValidate: true }
    );
  }, [form]);

  const onSubmit = useCallback(
    async (data: BookChapterFormValues) => {
      setIsSubmitting(true);
      try {
        await axios.post("/api/research/book-chapter", data);
        toast.success("Book chapter created successfully!");
        resetForm();
        setOpen(false);
        onClose?.();
        onSuccess?.();
      } catch (error: any) {
        const msg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create book chapter";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onClose, onSuccess, resetForm]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit]
  );

  const currentStatusValue = useWatch({ control: form.control, name: "bookChapterStatus" });
  const keywords = useWatch({ control: form.control, name: "keywords" }) ?? [];
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === currentStatusValue);
  const StatusIcon = currentStatus?.icon ?? BookOpen;

  return (
    <>
      {cropState.open && <ImageCropModal src={cropState.src} ratio={cropState.ratio} fileName={cropState.fileName} onCrop={cropState.onCrop} onCancel={closeCrop} />}
      {/*
        ── THE FIX: Hidden file inputs are OUTSIDE <DialogContent> ────────────
        Placing them here (in the React tree but outside the dialog portal)
        means they are not subject to Radix UI's pointer-events manipulation
        that causes the freeze. We trigger them via .click() refs.
      */}
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

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="gap-2 font-medium">
              <BookOpen className="w-4 h-4" />
              Add Book Chapter
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          className="max-w-[98vw] w-6xl max-h-[92dvh] p-0 gap-0 overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl supports-backdrop-filter:bg-background/70 dark:border-white/10"
          // Using default modal={true} — do NOT set modal={false} as that causes
          // the pointer-events bug described above.
          onInteractOutside={(e) => {
            // Prevent closing when clicking the native OS file picker backdrop
            if (isSubmitting) e.preventDefault();
          }}
        >
          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="px-6 sm:px-8 pt-6 pb-5 border-b bg-linear-to-br from-background via-background to-muted/30 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight leading-tight">
                    New Book Chapter
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    Register a new book chapter entry with full publication details
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

          {/* ── Body ──────────────────────────────────────────────────────── */}
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
                            Chapter Title <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Deep Learning Approaches for Medical Image Analysis"
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
                            Abstract <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a concise summary of the chapter content, methodology, and key findings…"
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

                {/* ② Publication Details */}
                <section>
                  <SectionHeader
                    icon={Building2}
                    title="Publication Details"
                    accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Publisher — spans 2 cols */}
                    <FormField
                      control={form.control}
                      name="publisher"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-sm font-medium">
                            Publisher <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Select
                                value={showCustomPublisher ? "other" : (field.value || "select")}
                                onValueChange={(v) => {
                                  if (v === "other") {
                                    setShowCustomPublisher(true);
                                    field.onChange(customPublisher || "");
                                  } else if (v === "select") {
                                    setShowCustomPublisher(false);
                                    field.onChange("");
                                  } else {
                                    setShowCustomPublisher(false);
                                    field.onChange(v);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-10 rounded-lg text-sm">
                                  <SelectValue placeholder="Select a publisher" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="select">Select a publisher</SelectItem>
                                  {PUBLISHERS.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (specify below)</SelectItem>
                                </SelectContent>
                              </Select>
                              {showCustomPublisher && (
                                <Input
                                  placeholder="Enter publisher name"
                                  className="h-10 rounded-lg text-sm"
                                  value={customPublisher}
                                  onChange={(e) => {
                                    setCustomPublisher(e.target.value);
                                    field.onChange(e.target.value || "");
                                  }}
                                  autoFocus
                                />
                              )}
                            </div>
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isbnIssn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">ISBN / ISSN</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="978-3-16-148410-0"
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
                      name="doi"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-sm font-medium">DOI</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder="10.1000/xyz123"
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
                            Search by name or email address
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
                            Student Authors <RequiredDot />
                          </FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">
                            Search by name or email address
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

                  {/* Status & Fees */}
                  <div className="lg:col-span-2 space-y-5">
                    <SectionHeader
                      icon={ChevronRight}
                      title="Status & Fees"
                      accent="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    />

                    <FormField
                      control={form.control}
                      name="bookChapterStatus"
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

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="registrationFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Reg. Fees</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="h-10 pl-7 rounded-lg text-sm"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reimbursement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Reimbursement</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="h-10 pl-7 rounded-lg text-sm"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
                            <div>
                              <p className="text-sm font-medium leading-tight">Make Public</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Visible to everyone
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Make chapter public"
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
                            Cover Image <RequiredDot />
                          </FormLabel>
                          <FormControl>
                            <UploadZone
                              label="Upload cover image"
                              hint="JPG or PNG · max 5 MB"
                              uploading={uploadingImage}
                              fileName={imageFile?.name}
                              hasValue={!!field.value}
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
                            Manuscript Document
                          </FormLabel>
                          <FormControl>
                            <UploadZone
                              label="Upload manuscript"
                              hint="PDF, DOC, DOCX · max 10 MB"
                              uploading={uploadingDocument}
                              fileName={documentFile?.name}
                              hasValue={!!field.value}
                              onTrigger={() => documentInputRef.current?.click()}
                              onRemove={() => {
                                setDocumentFile(null);
                                form.setValue("documentUrl", null, { shouldValidate: true });
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

                {/* ── Footer ──────────────────────────────────────────────── */}
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
                      disabled={isSubmitting || uploadingImage || uploadingDocument}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" />
                          Create Chapter
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