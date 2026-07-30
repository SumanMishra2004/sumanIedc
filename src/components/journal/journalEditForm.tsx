"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { journalSchema } from "@/lib/validations/journal";
import axios from "axios";
import { Loader2, Upload, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import { uploadFile } from "@/lib/appwrite";
import { Journal } from "@/types/journal";
import type { Session } from "next-auth";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";
import { TeacherStatus } from "@prisma/client";

// Use imported journalSchema from @/lib/validations/journal

type JournalFormValues = z.infer<typeof journalSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

const formatDateForInput = (val: string | Date | null | undefined): string => {
  if (!val) return "";
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  return typeof val === "string" ? val.split("T")[0] : "";
};

export default function EditJournalDialog({
  journalId,
  open,
  onOpenChange,
  onSuccess,
  session,
}: {
  journalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  session: Session | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState("");
  const { cropState, openCrop, closeCrop } = useImageCrop();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  const [showCustomPublisher, setShowCustomPublisher] = useState(false);
  const [customPublisher, setCustomPublisher] = useState<string>("");
  const [updateComment, setUpdateComment] = useState<string | null>(null);

  const publishers = [
    "Elsevier",
    "Springer Nature",
    "Taylor & Francis",
    "Wiley",
    "SAGE Publishing",
    "Oxford University Press",
    "Cambridge University Press",
    "De Gruyter",
    "Brill Publishers",
    "MDPI",
    "BioMed Central (BMC)",
    "Frontiers",
    "Inderscience",
    "Emerald Publishing",
    "IEEE",
    "American Chemical Society",
    "American Medical Association",
    "Palgrave Macmillan",
    "Pearson Education",
    "McGraw Hill Education",
    "World Scientific",
  ];

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      serialNo: "",
      title: "",
      journalName: "",
      abstract: "",
      imageUrl: null,
      documentUrl: null,
      scope: "INTERNATIONAL",
      reviewType: "PEER_REVIEWED",
      accessType: "OPEN_ACCESS",
      indexing: "NONE",
      quartile: "NOT_APPLICABLE",
      publicationMode: "ONLINE",
      impactFactor: null,
      impactFactorDate: null,
      publisher: null,
      publicationDate: null,
      doi: null,
      paperLink: null,
      keywords: [],
      journalStatus: "SUBMITTED",
      teacherStatus: "UPLOADED" as TeacherStatus,
      isPublic: false,
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  const indexing = form.watch("indexing");

  useEffect(() => {
    if (indexing === "NONE") {
      form.setValue("quartile", "NOT_APPLICABLE");
    }
  }, [indexing, form]);

  // Load journal data when dialog opens
  useEffect(() => {
    if (open && journalId) {
      loadJournalData();
    }
  }, [open, journalId]);

  const formatDate = (dateVal: any) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  };

  const loadJournalData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/research/journal/${journalId}`);
      const journal = response.data.journal;

      // Populate form with existing data
      form.reset({
        serialNo: journal.serialNo,
        title: journal.title,
        journalName: journal.journalName,
        abstract: journal.abstract || "",
        imageUrl: journal.imageUrl || null,
        documentUrl: journal.documentUrl || null,
        scope: journal.scope,
        reviewType: journal.reviewType,
        accessType: journal.accessType,
        indexing: journal.indexing,
        quartile: journal.quartile || "NOT_APPLICABLE",
        publicationMode: journal.publicationMode,
        impactFactor: journal.impactFactor || null,
        impactFactorDate: formatDate(journal.impactFactorDate),
        publisher: journal.publisher || null,
        publicationDate: formatDate(journal.publicationDate),
        doi: journal.doi || null,
        paperLink: journal.paperLink || null,
        keywords: journal.keywords,
        registrationFees: journal.registrationFees || null,
        reimbursement: journal.reimbursement || null,
        journalStatus: journal.journalStatus,
        teacherStatus: journal.teacherStatus || "UPLOADED",
        isPublic: journal.isPublic,
        facultyAuthorIds: journal.facultyAuthors?.map((a: any) => a.user.id) || [],
        studentAuthorIds: journal.studentAuthors?.map((a: any) => a.user.id) || [],
      });

      // Set selected users for display
      if (journal.facultyAuthors) {
        setSelectedFaculty(journal.facultyAuthors.map((a: any) => ({
          id: a.user.id,
          name: a.user.name || '',
          email: a.user.email || '',
          image: a.user.image || undefined,
        })));
      }

      if (journal.studentAuthors) {
        setSelectedStudents(journal.studentAuthors.map((a: any) => ({
          id: a.user.id,
          name: a.user.name || '',
          email: a.user.email || '',
          image: a.user.image || undefined,
        })));
      }

      // Handle custom publisher
      if (journal.publisher && !publishers.includes(journal.publisher)) {
        setShowCustomPublisher(true);
        setCustomPublisher(journal.publisher);
      }

      setUpdateComment(journal.updateComment || null);
      toast.success("Journal loaded successfully");
    } catch (error: any) {
      console.error("Error loading journal:", error);
      toast.error(error.response?.data?.error || "Failed to load journal");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

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
        form.setValue("imageUrl", imageUrl);
        toast.success("Image uploaded successfully");
      } catch {
        toast.error("Failed to upload image");
        setImageFile(null);
      } finally {
        setUploadingImage(false);
      }
    });
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files are allowed for documents");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Document size should be less than 25MB");
      return;
    }

    setDocumentFile(file);
    setUploadingDocument(true);

    try {
      const documentUrl = await uploadFile(file);
      form.setValue("documentUrl", documentUrl);
      toast.success("Document uploaded successfully");
    } catch {
      toast.error("Failed to upload document");
      setDocumentFile(null);
    } finally {
      setUploadingDocument(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const currentKeywords = form.getValues("keywords");
      if (!currentKeywords.includes(keywordInput.trim())) {
        form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keyword),
    );
  };

  const onError = (errors: any) => {
    console.error("Journal Edit Form Validation Errors:", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const errorMsg = errors[firstKey]?.message || "Invalid input";
      toast.error(`Validation Error (${firstKey}): ${errorMsg}`);
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/research/journal/${journalId}`, data);
      toast.success("Journal updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || error.response?.data?.message || "Failed to update journal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {cropState.open && <ImageCropModal src={cropState.src} ratio={cropState.ratio} fileName={cropState.fileName} onCrop={cropState.onCrop} onCancel={closeCrop} />}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[92vh] flex flex-col p-0 border-border bg-card shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border bg-muted/20">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-2.5 h-6 bg-primary rounded-full" />
            Edit Journal Publication
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the metadata and details of your journal publication
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading journal data...</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(90vh-120px)] px-6 pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-4 pb-6"
              >
                {updateComment && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 shadow-sm mb-4">
                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertCircle className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold tracking-tight">Reviewer Correction Feedback</h4>
                      <p className="text-sm text-amber-700/90 dark:text-amber-300/80 mt-1 whitespace-pre-wrap leading-relaxed">
                        {updateComment}
                      </p>
                    </div>
                  </div>
                )}

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
                              Serial Number <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter serial number"
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
                          <FormItem>
                            <FormLabel className="text-base font-semibold">
                              Title <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter title"
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
                                placeholder="Enter journal name"
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
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-1">
                              Keywords <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add keyword"
                                    value={keywordInput}
                                    onChange={(e) =>
                                      setKeywordInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addKeyword();
                                      }
                                    }}
                                    className="h-12 flex-1"
                                  />
                                  <Button
                                    type="button"
                                    className="h-12 px-4"
                                    size="sm"
                                    onClick={addKeyword}
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {field.value.map((keyword) => (
                                    <Badge
                                      key={keyword}
                                      variant="secondary"
                                      className="px-2.5 py-1 text-xs"
                                    >
                                      {keyword}
                                      <button
                                        type="button"
                                        onClick={() => removeKeyword(keyword)}
                                        className="ml-1.5 hover:bg-destructive hover:text-destructive-foreground p-0.5 rounded"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
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
                              <div className="space-y-1">
                                <Textarea
                                  placeholder="Write abstract (at least 100 characters)"
                                  className="min-h-[100px] text-base border focus-visible:ring-1 resize-vertical"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Minimum 100, Maximum 5000 characters</span>
                                  <span className={((field.value ?? "").length < 100 || (field.value ?? "").length > 5000) ? "text-destructive font-semibold" : "text-emerald-500"}>
                                    {(field.value ?? "").length} / 5000
                                  </span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Journal Classification */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      Journal Classification
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select scope" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="INTERNATIONAL">🌍 International</SelectItem>
                              <SelectItem value="NATIONAL">🏛️ National</SelectItem>
                              <SelectItem value="REGIONAL">🗺️ Regional</SelectItem>
                              <SelectItem value="LOCAL">🏘️ Local</SelectItem>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select review type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PEER_REVIEWED">Peer Reviewed</SelectItem>
                              <SelectItem value="DOUBLE_BLIND">Double Blind</SelectItem>
                              <SelectItem value="SINGLE_BLIND">Single Blind</SelectItem>
                              <SelectItem value="EDITORIAL_REVIEWED">Editorial Reviewed</SelectItem>
                              <SelectItem value="NON_PEER_REVIEWED">Non-Peer Reviewed</SelectItem>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select access type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="OPEN_ACCESS">Open Access</SelectItem>
                              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                              <SelectItem value="HYBRID">Hybrid</SelectItem>
                              <SelectItem value="DIAMOND_OPEN_ACCESS">Diamond Open Access</SelectItem>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ONLINE">Online</SelectItem>
                              <SelectItem value="PRINT">Print</SelectItem>
                              <SelectItem value="PRINT_AND_ONLINE">Print & Online</SelectItem>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select indexing" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SCOPUS">📊 Scopus</SelectItem>
                              <SelectItem value="WEB_OF_SCIENCE">🕸️ Web of Science</SelectItem>
                              <SelectItem value="SCI">🔬 SCI</SelectItem>
                              <SelectItem value="SCIE">⚗️ SCIE</SelectItem>
                              <SelectItem value="SSCI">📚 SSCI</SelectItem>
                              <SelectItem value="AHCI">🎨 AHCI</SelectItem>
                              <SelectItem value="UGC_CARE">🏛️ UGC CARE</SelectItem>
                              <SelectItem value="DOAJ">📖 DOAJ</SelectItem>
                              <SelectItem value="PUBMED">🏥 PubMed</SelectItem>
                              <SelectItem value="IEEE_XPLORE">⚡ IEEE Xplore</SelectItem>
                              <SelectItem value="NONE">❌ None</SelectItem>
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
                          <FormLabel className="text-sm mb-1">
                            Quartile
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "NOT_APPLICABLE"}
                            disabled={indexing === "NONE"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select quartile" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Q1">Q1</SelectItem>
                              <SelectItem value="Q2">Q2</SelectItem>
                              <SelectItem value="Q3">Q3</SelectItem>
                              <SelectItem value="Q4">Q4</SelectItem>
                              <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
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
                          <FormLabel className="text-sm mb-1">
                            Impact Factor
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              className="h-10"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null,
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
                  </CardContent>
                </Card>

                {/* Publication Details */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                      Publication Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="publisher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">
                            Publisher
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Select
                                value={showCustomPublisher ? "other" : field.value ?? "select"}
                                onValueChange={(value) => {
                                  if (value === "other") {
                                    setShowCustomPublisher(true);
                                    field.onChange(customPublisher || null);
                                  } else if (value === "select") {
                                    setShowCustomPublisher(false);
                                    field.onChange(null);
                                  } else {
                                    setShowCustomPublisher(false);
                                    field.onChange(value);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-12 w-full">
                                  <SelectValue placeholder="Select publisher" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="select">Select publisher</SelectItem>
                                  {publishers.map((pub) => (
                                    <SelectItem key={pub} value={pub}>
                                      {pub}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other (Custom)</SelectItem>
                                </SelectContent>
                              </Select>
                              {showCustomPublisher && (
                                <Input
                                  placeholder="Enter custom publisher"
                                  className="h-10"
                                  value={customPublisher}
                                  onChange={(e) => {
                                    setCustomPublisher(e.target.value);
                                    field.onChange(e.target.value || null);
                                  }}
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
                      name="doi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">DOI</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="DOI"
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
                      name="paperLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">Paper Link</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Paper link"
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
                        <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                        Authors <span className="text-destructive">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <FormField
                        control={form.control}
                        name="facultyAuthorIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-1">
                              Faculty Authors <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormDescription>
                              <span className="text-xs text-muted-foreground">You can search by name or email to find faculty members</span>
                            </FormDescription>
                            <FormControl>
                              <MultiSelectUsers  
                                isStudent={false}
                                value={selectedFaculty}
                                onChange={(users) => {
                                  setSelectedFaculty(users);
                                  field.onChange(users.map(u => u.id));
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
                              Student Authors <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormDescription>
                              <span className="text-xs text-muted-foreground">Search by name or email to find students</span>
                            </FormDescription>
                            <FormControl>
                              <MultiSelectUsers
                                isStudent={true}
                                value={selectedStudents}
                                onChange={(users) => {
                                  setSelectedStudents(users);
                                  field.onChange(users.map(u => u.id));
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
                        Status <span className="text-destructive">*</span>
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
                                Status
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={session?.user.role === "STUDENT"}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 w-full">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SUBMITTED">
                                    📤 Submitted
                                  </SelectItem>
                                  <SelectItem value="UNDER_REVIEW">
                                    🔍 Under Review
                                  </SelectItem>
                                  <SelectItem value="APPROVED">
                                    ✅ Approved
                                  </SelectItem>
                                  <SelectItem value="PUBLISHED">
                                    📚 Published
                                  </SelectItem>
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
                                <FormLabel className="text-sm mb-1">
                                  Reg Fees
                                </FormLabel>
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
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : null,
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
                                <FormLabel className="text-sm mb-1">
                                  Reimbursement
                                </FormLabel>
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
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : null,
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
                              <FormLabel className="font-semibold">
                                Public
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={session?.user.role !== "ADMIN"}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* File Uploads */}
                <Card className="border-dashed border-border overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
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
                            Cover Image
                          </FormLabel>
                          <FormControl>
                            <div>
                              <label
                                htmlFor="image-upload-edit"
                                className="cursor-pointer block h-full"
                              >
                                <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors p-6 text-center h-full group hover:shadow-md">
                                  <div className="space-y-2 flex flex-col justify-center items-center">
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                    <div className="text-center">
                                      <p className="font-medium text-sm">
                                        {imageFile ? "Replace Cover Image" : "Upload New Cover"}
                                      </p>
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
                                id="image-upload-edit"
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
                              <span className="flex items-center justify-center gap-1 text-xs bg-muted/50 p-2 rounded max-w-full">
                                <Upload className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate flex-1">
                                  {imageFile.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageFile(null);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </span>
                            )}
                            {field.value && !imageFile && (
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1 justify-center">
                                ✓ Current image uploaded
                              </span>
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
                                    .getElementById("document-upload-edit")
                                    ?.click();
                                }}
                              >
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {documentFile ? "Replace Document" : "Upload New Document"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Max 10MB
                                  </p>
                                </div>
                                <Input
                                  id="document-upload-edit"
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
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {field.value && !documentFile && (
                              <span className="text-xs text-green-600 font-medium block">
                                ✓ Current document uploaded
                              </span>
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
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 flex-1 sm:flex-none shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting ? "Updating..." : "Update Journal"}
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
