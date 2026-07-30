"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectUsers } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { uploadFile } from "@/lib/appwrite";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";
import { journalSchema } from "@/lib/validations/journal";
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
const DOCUMENT_ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const DOCUMENT_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const DOCUMENT_MAX_SIZE_MB = 10;

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
  const { cropState, openCrop, closeCrop } = useImageCrop();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

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
  const abstractLen = abstractValue.length;
  const abstractInvalid = abstractLen < 100 || abstractLen > 5000;

  useEffect(() => {
    if (indexing === "NONE") {
      form.setValue("quartile", "NOT_APPLICABLE");
    }
  }, [indexing, form]);

  // ---------------------------------------------------------------------
  // Image (poster) upload — same crop-modal pattern as Copyright
  // ---------------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    openCrop(file, "poster", async (croppedFile) => {
      closeCrop();
      setImageFile(croppedFile);
      setUploadingImage(true);
      try {
        const imageUrl = await uploadFile(croppedFile);
        form.setValue("imageUrl", imageUrl, { shouldValidate: true });
        toast.success("Image uploaded successfully");
      } catch {
        toast.error("Failed to upload image");
        setImageFile(null);
      } finally {
        setUploadingImage(false);
      }
    });
  };

  // ---------------------------------------------------------------------
  // Document (PDF/DOC/DOCX) upload — same card + click pattern as Copyright
  // ---------------------------------------------------------------------
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const hasValidExtension = DOCUMENT_ACCEPTED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    const hasValidMime = DOCUMENT_ACCEPTED_MIME_TYPES.includes(file.type);

    if (!hasValidExtension && !hasValidMime) {
      toast.error("Only PDF, DOC, or DOCX files are allowed");
      return;
    }

    if (file.size > DOCUMENT_MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Document size should be less than ${DOCUMENT_MAX_SIZE_MB}MB`);
      return;
    }

    setDocumentFile(file);
    setUploadingDocument(true);

    try {
      const documentUrl = await uploadFile(file);
      form.setValue("documentUrl", documentUrl, { shouldValidate: true });
      toast.success("Document uploaded successfully");
    } catch {
      toast.error("Failed to upload document");
      setDocumentFile(null);
    } finally {
      setUploadingDocument(false);
    }
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
    setImageFile(null);
    setDocumentFile(null);
    setKeywordInput("");
    setSelectedFaculty([]);
    setSelectedStudents([]);
    setPublisherOption("none");
    setCustomPublisher("");
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

  return (
    <>
      {cropState.open && (
        <ImageCropModal
          src={cropState.src}
          ratio={cropState.ratio}
          fileName={cropState.fileName}
          onCrop={cropState.onCrop}
          onCancel={closeCrop}
        />
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onClose?.();
        }}
      >
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-gradient-to-r from-primary to-purple-600">
              Add Journal
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="md:max-w-[96vw]! max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              New Journal
            </DialogTitle>
            <DialogDescription className="text-base">
              Fill in the details to create a new journal publication
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-120px)] px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-4 pb-6"
              >
                {/* Basic Information */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="serialNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">
                              Serial No. <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 2026/JRN/014"
                                className="h-12 text-base border focus-visible:ring-1"
                                {...field}
                              />
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
                            <FormLabel className="text-base font-semibold">
                              Journal Name <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. IEEE Transactions on..."
                                className="h-12 text-base border focus-visible:ring-1"
                                {...field}
                              />
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
                            <FormLabel className="text-base font-semibold">
                              Paper Title <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter the paper's title"
                                className="h-12 text-base border focus-visible:ring-1"
                                {...field}
                              />
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
                            <FormLabel className="text-base font-semibold">
                              Keywords
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type a keyword and press Enter"
                                    className="h-12 text-base border focus-visible:ring-1"
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
                            <FormLabel className="text-base font-semibold mb-1">
                              Abstract <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write the abstract (100–5000 characters)"
                                className="min-h-[100px] text-base border focus-visible:ring-1 resize-vertical"
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
                  </CardContent>
                </Card>

                {/* Journal Details */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      Journal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">
                            Scope <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">
                            Review Type <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">
                            Access Type <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">
                            Indexing <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">Quartile</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "NOT_APPLICABLE"}
                            disabled={indexing === "NONE"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">
                            Publication Mode <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10 w-full">
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
                          <FormLabel className="text-sm mb-1">Impact Factor</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              className="h-10"
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
                          <FormLabel className="text-sm mb-1">Impact Factor Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10"
                              {...field}
                              value={formatDateForInput(field.value)}
                            />
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
                          <FormLabel className="text-sm mb-1">Publisher</FormLabel>
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
                                <SelectTrigger className="h-10 w-full">
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
                                className="h-10"
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
                          <FormLabel className="text-sm mb-1">DOI</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10.xxxx/xxxxx"
                              className="h-10"
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
                      name="publicationDate"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-sm mb-1">Publication Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10"
                              {...field}
                              value={formatDateForInput(field.value)}
                            />
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
                          <FormLabel className="text-sm mb-1">Paper Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              className="h-10"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Authors & Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="border-dashed border-border overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                        Authors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <FormField
                        control={form.control}
                        name="facultyAuthorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-1">
                              Faculty Authors
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground mb-2">
                              All faculty are loaded with pagination
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
                      <Separator className="my-1.5" />
                      <FormField
                        control={form.control}
                        name="studentAuthorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-1">
                              Student Authors
                            </FormLabel>
                            <FormDescription className="text-xs text-muted-foreground mb-2">
                              Search by name or email to find students
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
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-border overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        Status & Fees
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="flex flex-col gap-3">
                        <FormField
                          control={form.control}
                          name="journalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-1">
                                Journal Status
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 w-full">
                                    <SelectValue placeholder="Journal status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SUBMITTED">📤 Submitted</SelectItem>
                                  <SelectItem value="UNDER_REVIEW">🔍 Under Review</SelectItem>
                                  <SelectItem value="APPROVED">✅ Approved</SelectItem>
                                  <SelectItem value="PUBLISHED">📚 Published</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="registrationFees"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm mb-1">Registration Fees</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-10"
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
                                <FormLabel className="text-sm mb-1">Reimbursement</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="h-10"
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
                      </div>
                      <Separator className="my-2" />
                      <FormField
                        control={form.control}
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="space-y-0.5">
                              <FormLabel className="font-semibold">Public</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* File Uploads — identical pattern to Copyright form */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                      Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold mb-2 block">
                            Poster Image
                          </FormLabel>
                          <FormControl>
                            <div>
                              <label
                                htmlFor="image-upload"
                                className="cursor-pointer block h-full"
                              >
                                <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors p-6 text-center h-full group hover:shadow-md">
                                  <div className="space-y-2 flex flex-col justify-center items-center">
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    <div className="text-center">
                                      <p className="font-medium text-sm">Poster Image</p>
                                      <p className="text-xs text-muted-foreground">
                                        Max 5MB • JPG, PNG
                                      </p>
                                    </div>
                                    {uploadingImage && (
                                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                    )}
                                  </div>
                                </Card>
                              </label>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                className="sr-only"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-center pt-2">
                            {imageFile && (
                              <div className="flex items-center justify-center gap-1 text-xs bg-muted/50 p-2 rounded max-w-full">
                                <Upload className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate flex-1">{imageFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageFile(null);
                                    form.setValue("imageUrl", null, { shouldValidate: true });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {field.value && !imageFile && (
                              <p className="text-xs text-green-600 font-medium flex items-center gap-1 justify-center">
                                ✓ Image uploaded
                              </p>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                      <FormField
                    control={form.control}
                    name="documentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold mb-2 block">
                          Document
                        </FormLabel>
                        <FormControl>
                          <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors cursor-pointer p-6 text-center h-full">
                            <div
                              className="space-y-2 h-full flex flex-col justify-center"
                              onClick={(e) => {
                                e.preventDefault();
                                document
                                  .getElementById("document-upload")
                                  ?.click();
                              }}
                            >
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <div>
                                <p className="font-medium">Document</p>
                                <p className="text-xs text-muted-foreground">
                                  Max 10MB
                                </p>
                              </div>
                              <Input
                                id="document-upload"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleDocumentUpload}
                                disabled={uploadingDocument}
                                className="hidden"
                              />
                              {uploadingDocument && (
                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                              )}
                            </div>
                          </Card>
                        </FormControl>
                        <FormDescription className="text-xs text-center pt-2 block">
                          {documentFile && (
                            <div className="flex items-center justify-center gap-1 text-xs bg-muted/50 p-2 rounded overflow-hidden">
                              <Upload className="h-3 w-3" />
                              <span className="truncate flex-1">
                                {documentFile.name}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setDocumentFile(null);
                                  form.setValue("documentUrl", "");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {field.value && !documentFile && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ Uploaded
                            </p>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-6 text-base flex-1 sm:flex-none"
                    onClick={resetAll}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 flex-1 sm:flex-none shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating..." : "Create Journal"}
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}