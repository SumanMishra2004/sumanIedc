"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Eye,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { journalSchema } from "@/lib/validations/journal";
import { uploadFile } from "@/lib/appwrite";
import { PosterUploadField } from "@/components/ui/PosterUploadField";
import { MultiSelectUsers } from "@/components/ui/multi-select";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode,
} from "@prisma/client";

type JournalFormValues = z.infer<typeof journalSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
// Single source of truth for both file inputs — UI copy, validation, and the
// `accept` attribute all read from here so they can never drift apart again.
const IMAGE_MAX_SIZE_MB = 2;
const DOCUMENT_MAX_SIZE_MB = 2;

const DOCUMENT_ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const DOCUMENT_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const PUBLISHERS = [
  "Springer",
  "Elsevier",
  "Wiley",
  "Taylor & Francis",
  "Sage Publications",
  "IEEE",
  "ACM",
  "Oxford University Press",
  "Cambridge University Press",
  "MDPI",
  "Nature Publishing Group",
  "Frontiers Media",
  "Public Library of Science (PLOS)",
  "American Chemical Society",
  "Royal Society of Chemistry",
  "IOP Publishing",
  "Wolters Kluwer",
  "Emerald Publishing",
  "BMJ",
  "Hindawi",
] as const;

const formatDateForInput = (val: string | Date | null | undefined): string => {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  return typeof val === "string" ? val.split("T")[0] : "";
};

// A single, consistently-styled section wrapper — replaces five near-duplicate
// Card/CardHeader/CardTitle blocks that only differed by title and children.
function FormSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        <h3 className="text-sm font-semibold tracking-wide text-foreground">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function JournalDialog({
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

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Local blob URL so the person can preview the PDF instantly, without
  // waiting on (or depending on auth for) the remote uploaded URL.
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [isDocumentPdf, setIsDocumentPdf] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);
  const [publisherOption, setPublisherOption] = useState<string>("none");
  const [customPublisher, setCustomPublisher] = useState<string>("");

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      serialNo: "",
      journalName: "",
      title: "",
      scope: "INTERNATIONAL" as JournalScope,
      reviewType: "PEER_REVIEWED" as JournalReviewType,
      accessType: "OPEN_ACCESS" as JournalAccessType,
      indexing: "NONE" as JournalIndexing,
      quartile: "NOT_APPLICABLE" as JournalQuartile,
      publicationMode: "ONLINE" as JournalPublicationMode,
      impactFactor: null,
      impactFactorDate: null,
      publisher: null,
      journalStatus: "SUBMITTED" as JournalStatus,
      teacherStatus: "UPLOADED" as TeacherStatus,
      paperLink: null,
      doi: null,
      registrationFees: null,
      reimbursement: null,
      isPublic: false,
      abstract: null,
      imageUrl: null,
      documentUrl: null,
      publicationDate: null,
      keywords: [],
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  const indexing = form.watch("indexing");
  const abstractValue = form.watch("abstract") ?? "";

  useEffect(() => {
    if (indexing === "NONE") {
      form.setValue("quartile", "NOT_APPLICABLE");
    }
  }, [indexing, form]);

  // Revoke the blob URL on unmount / whenever it changes, so we don't leak memory.
  useEffect(() => {
    return () => {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    };
  }, [documentPreviewUrl]);

  // ---------------------------------------------------------------------
  // Image (poster) upload — cropping happens inside PosterUploadField, this
  // just enforces the 2MB ceiling on the cropped output and uploads it.
  // ---------------------------------------------------------------------
  const handleImageUpload = async (croppedFile: File) => {
    if (croppedFile.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Poster image should be less than ${IMAGE_MAX_SIZE_MB}MB`);
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadFile(croppedFile);
      form.setValue("imageUrl", imageUrl, { shouldValidate: true });
      toast.success("Poster uploaded");
    } catch {
      toast.error("Failed to upload poster");
    } finally {
      setUploadingImage(false);
    }
  };

  // ---------------------------------------------------------------------
  // Document (PDF/DOC/DOCX) upload
  // ---------------------------------------------------------------------
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = e.currentTarget;
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasValidExtension = DOCUMENT_ACCEPTED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    // MIME can be empty/unreliable depending on OS, so extension OR mime is enough.
    const hasValidMime = DOCUMENT_ACCEPTED_MIME_TYPES.includes(file.type);

    if (!hasValidExtension && !hasValidMime) {
      toast.error("Only PDF, DOC, or DOCX files are allowed");
      input.value = "";
      return;
    }

    if (file.size > DOCUMENT_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Document should be less than ${DOCUMENT_MAX_SIZE_MB}MB`);
      input.value = "";
      return;
    }

    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);

    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
    setIsDocumentPdf(isPdf);
    setDocumentPreviewUrl(isPdf ? URL.createObjectURL(file) : null);
    setDocumentFile(file);
    setUploadingDocument(true);

    try {
      const documentUrl = await uploadFile(file);
      form.setValue("documentUrl", documentUrl, { shouldValidate: true });
      toast.success("Document uploaded");
    } catch {
      toast.error("Failed to upload document");
      setDocumentFile(null);
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl(null);
      setIsDocumentPdf(false);
    } finally {
      setUploadingDocument(false);
      input.value = "";
    }
  };

  const clearDocument = () => {
    setDocumentFile(null);
    // Bug fix: this used to reset to "" — an empty string fails a nullable
    // Zod schema (`documentUrl` is `string | null`, not `string`).
    form.setValue("documentUrl", null, { shouldValidate: true });
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentPreviewUrl(null);
    setIsDocumentPdf(false);
  };

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (!value) return;
    const current = form.getValues("keywords");
    if (!current.includes(value)) {
      form.setValue("keywords", [...current, value], { shouldValidate: true });
    }
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    form.setValue(
      "keywords",
      form.getValues("keywords").filter((k) => k !== keyword),
      { shouldValidate: true },
    );
  };

  const resetAll = () => {
    form.reset();
    setDocumentFile(null);
    setKeywordInput("");
    setSelectedFaculty([]);
    setSelectedStudents([]);
    setPublisherOption("none");
    setCustomPublisher("");
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentPreviewUrl(null);
    setIsDocumentPdf(false);
  };

  const onError = (errors: Record<string, { message?: string }>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      toast.error(errors[firstKey]?.message || `Check the "${firstKey}" field`);
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/research/journal", data);
      toast.success("Journal created successfully");
      resetAll();
      setOpen(false);
      onClose?.();
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ??
          error?.response?.data?.message ??
          "Failed to create journal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const abstractLen = abstractValue.length;
  const abstractInvalid = abstractLen < 100 || abstractLen > 5000;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose?.();
      }}
    >
      <DialogTrigger asChild>
        {trigger || <Button>Add Journal</Button>}
      </DialogTrigger>

      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            New journal publication
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a paper's details, authors, and supporting files.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form
              id="journal-form"
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-5"
            >
              {/* Basic information ------------------------------------------------ */}
              <FormSection title="Basic information">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="serialNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Serial no. <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2026/JRN/014" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="journalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Journal name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. IEEE Transactions on..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>
                          Paper title <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the paper's title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
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
                              />
                              <Button type="button" variant="secondary" onClick={addKeyword}>
                                Add
                              </Button>
                            </div>
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {field.value.map((keyword) => (
                                  <Badge
                                    key={keyword}
                                    variant="secondary"
                                    className="gap-1 py-1 pl-2.5 pr-1.5"
                                  >
                                    {keyword}
                                    <button
                                      type="button"
                                      onClick={() => removeKeyword(keyword)}
                                      className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                                      aria-label={`Remove ${keyword}`}
                                    >
                                      <X className="h-3 w-3" />
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

                  <FormField
                    control={form.control}
                    name="abstract"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>
                          Abstract <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write the abstract (100–5000 characters)"
                            className="min-h-[110px] resize-vertical"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">100–5000 characters</span>
                          <span
                            className={
                              abstractInvalid
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            {abstractLen} / 5000
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>

              {/* Journal details ---------------------------------------------------- */}
              <FormSection title="Journal details">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Scope <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INTERNATIONAL">International</SelectItem>
                            <SelectItem value="NATIONAL">National</SelectItem>
                            <SelectItem value="REGIONAL">Regional</SelectItem>
                            <SelectItem value="LOCAL">Local</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reviewType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Review type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select review type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PEER_REVIEWED">Peer reviewed</SelectItem>
                            <SelectItem value="DOUBLE_BLIND">Double blind</SelectItem>
                            <SelectItem value="SINGLE_BLIND">Single blind</SelectItem>
                            <SelectItem value="EDITORIAL_REVIEWED">Editorial</SelectItem>
                            <SelectItem value="NON_PEER_REVIEWED">Non-peer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Access type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OPEN_ACCESS">Open access</SelectItem>
                            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                            <SelectItem value="DIAMOND_OPEN_ACCESS">Diamond open access</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="indexing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Indexing <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select indexing" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SCOPUS">Scopus</SelectItem>
                            <SelectItem value="WEB_OF_SCIENCE">Web of Science</SelectItem>
                            <SelectItem value="SCI">SCI</SelectItem>
                            <SelectItem value="SCIE">SCIE</SelectItem>
                            <SelectItem value="SSCI">SSCI</SelectItem>
                            <SelectItem value="AHCI">AHCI</SelectItem>
                            <SelectItem value="UGC_CARE">UGC CARE</SelectItem>
                            <SelectItem value="DOAJ">DOAJ</SelectItem>
                            <SelectItem value="PUBMED">PubMed</SelectItem>
                            <SelectItem value="IEEE_XPLORE">IEEE Xplore</SelectItem>
                            <SelectItem value="NONE">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quartile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quartile</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "NOT_APPLICABLE"}
                          disabled={indexing === "NONE"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quartile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Q1">Q1</SelectItem>
                            <SelectItem value="Q2">Q2</SelectItem>
                            <SelectItem value="Q3">Q3</SelectItem>
                            <SelectItem value="Q4">Q4</SelectItem>
                            <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publicationMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Publication mode <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="PRINT">Print</SelectItem>
                            <SelectItem value="PRINT_AND_ONLINE">Print & online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impactFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact factor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impactFactorDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact factor date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={formatDateForInput(field.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Publisher</FormLabel>
                        <div className="space-y-2">
                          <Select
                            value={publisherOption}
                            onValueChange={(value) => {
                              setPublisherOption(value);
                              if (value === "none") {
                                field.onChange(null);
                                setCustomPublisher("");
                              } else if (value === "other") {
                                field.onChange(customPublisher || null);
                              } else {
                                field.onChange(value);
                                setCustomPublisher("");
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select publisher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {PUBLISHERS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Other (custom)</SelectItem>
                            </SelectContent>
                          </Select>
                          {publisherOption === "other" && (
                            <Input
                              placeholder="Enter publisher name"
                              value={customPublisher}
                              onChange={(e) => {
                                setCustomPublisher(e.target.value);
                                field.onChange(e.target.value || null);
                              }}
                            />
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doi"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>DOI</FormLabel>
                        <FormControl>
                          <Input placeholder="10.xxxx/xxxxx" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publicationDate"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Publication date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={formatDateForInput(field.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paperLink"
                    render={({ field }) => (
                      <FormItem className="col-span-2 lg:col-span-4">
                        <FormLabel>Paper link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>

              {/* Authors + status side by side --------------------------------------- */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FormSection title="Authors">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="facultyAuthorIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Faculty authors <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>Faculty co-authors or reviewers</FormDescription>
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
                    <Separator />
                    <FormField
                      control={form.control}
                      name="studentAuthorIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Student authors <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>Search by name or email</FormDescription>
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
                </FormSection>

                <FormSection title="Status & financials">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="journalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Journal status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Journal status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SUBMITTED">Submitted</SelectItem>
                              <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                              <SelectItem value="APPROVED">Approved</SelectItem>
                              <SelectItem value="PUBLISHED">Published</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <FormLabel>Reg. fees</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : null,
                                  )
                                }
                              />
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
                            <FormLabel>Reimbursement</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                          <div>
                            <FormLabel className="text-sm">Public listing</FormLabel>
                            <FormDescription className="text-xs">
                              Visible outside the department
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </div>

              {/* Files ---------------------------------------------------------------- */}
              <FormSection title="Files & attachments">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poster image</FormLabel>
                        <FormDescription>
                          Crop to fit — JPG or PNG, max {IMAGE_MAX_SIZE_MB}MB
                        </FormDescription>
                        <FormControl>
                          <PosterUploadField
                            value={field.value}
                            onChange={handleImageUpload}
                            onRemove={() => form.setValue("imageUrl", null, { shouldValidate: true })}
                            isUploading={uploadingImage}
                            disabled={uploadingImage}
                            maxSizeMB={IMAGE_MAX_SIZE_MB}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Document <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormDescription>
                          PDF, DOC, or DOCX — max {DOCUMENT_MAX_SIZE_MB}MB
                        </FormDescription>
                        <FormControl>
                          <div>
                            {!documentFile && !field.value ? (
                              <label
                                htmlFor="document-upload"
                                className="flex min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-center transition-colors hover:border-primary/60 hover:bg-muted/30"
                              >
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground">
                                  Click to upload a document
                                </p>
                                {uploadingDocument && (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                              </label>
                            ) : (
                              <div className="flex min-h-[128px] flex-col justify-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm">
                                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                                  <span className="flex-1 truncate font-medium">
                                    {documentFile?.name ?? "Uploaded document"}
                                  </span>
                                  {isDocumentPdf && (documentPreviewUrl || field.value) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => setPreviewOpen(true)}
                                    >
                                      <Eye className="mr-1 h-3.5 w-3.5" />
                                      View
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={clearDocument}
                                    aria-label="Remove document"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between px-0.5 text-xs">
                                  {uploadingDocument ? (
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Uploading…
                                    </span>
                                  ) : field.value ? (
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                      Ready
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  <label
                                    htmlFor="document-upload"
                                    className="cursor-pointer font-medium text-primary hover:underline"
                                  >
                                    Replace file
                                  </label>
                                </div>
                              </div>
                            )}
                            <Input
                              id="document-upload"
                              type="file"
                              accept={DOCUMENT_ACCEPTED_EXTENSIONS.join(",")}
                              onChange={handleDocumentUpload}
                              disabled={uploadingDocument}
                              className="sr-only"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>
            </form>
          </Form>
        </div>

        {/* Footer stays visible while the form scrolls above it */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={resetAll}
            disabled={isSubmitting}
            className="sm:order-1"
          >
            Reset
          </Button>
          <Button
            type="submit"
            form="journal-form"
            disabled={isSubmitting}
            className="sm:order-2"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating…" : "Create journal"}
          </Button>
        </div>
      </DialogContent>

      {/* Document preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle>Document preview</DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] px-4 pb-4">
            {(() => {
              // Prefer the local blob (instant) and fall back to the remote
              // uploaded URL once it exists — no helper function needed.
              const src = documentPreviewUrl ?? form.getValues("documentUrl");
              return src ? (
                <iframe
                  src={src}
                  title="Document preview"
                  className="h-full w-full rounded border border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">No preview available.</p>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}