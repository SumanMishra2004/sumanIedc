"use client";

import { useState, useEffect } from "react";
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

const journalSchema = z.object({
  serialNo: z.string().min(1, "Serial number is required"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  journalName: z.string().min(1, "Journal name is required"),
  abstract: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  scope: z.enum(["NATIONAL", "INTERNATIONAL"]),
  reviewType: z.enum(["PEER_REVIEWED", "NON_PEER_REVIEWED"]),
  JournalAccessType: z.enum(["OPEN_ACCESS", "SUBSCRIPTION_BASED"]),
  JournalIndexing: z.enum([
    "SCI",
    "SCIE",
    "SCOPUS",
    "WEB_OF_SCIENCE",
    "PUBMED",
    "IEEE_XPLORE",
    "SPRINGER",
    "ELSEVIER",
    "GOOGLE_SCHOLAR",
    "UGC_CARE",
    "OTHERS",
  ]),
  quartile: z.enum(["Q1", "Q2", "Q3", "Q4"]).nullable().optional(),
  publicationMode: z.enum(["PRINT", "ONLINE", "BOTH"]),
  impactFactor: z.number().nullable().optional(),
  impactFactorDate: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  paperLink: z.string().nullable().optional(),
  keywords: z.array(z.string()).min(3, "At least 3 keywords are required").max(10, "No more than 10 keywords are allowed"),
  registrationFees: z.number().nullable().optional(),
  reimbursement: z.number().nullable().optional(),
  journalStatus: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "ACCEPTED",
    "PUBLISHED",
    "REJECTED",
  ]),
  isPublic: z.boolean(),
  studentAuthorIds: z.array(z.string()),
  facultyAuthorIds: z.array(z.string()),
});

type JournalFormValues = z.infer<typeof journalSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Journal {
  id: string;
  serialNo: string;
  title: string;
  journalName: string;
  abstract?: string | null;
  imageUrl?: string | null;
  documentUrl?: string | null;
  scope: "NATIONAL" | "INTERNATIONAL";
  reviewType: "PEER_REVIEWED" | "NON_PEER_REVIEWED";
  JournalAccessType: "OPEN_ACCESS" | "SUBSCRIPTION_BASED";
  JournalIndexing: "SCI" | "SCIE" | "SCOPUS" | "WEB_OF_SCIENCE" | "PUBMED" | "IEEE_XPLORE" | "SPRINGER" | "ELSEVIER" | "GOOGLE_SCHOLAR" | "UGC_CARE" | "OTHERS";
  quartile?: "Q1" | "Q2" | "Q3" | "Q4" | null;
  publicationMode: "PRINT" | "ONLINE" | "BOTH";
  impactFactor?: number | null;
  impactFactorDate?: string | null;
  publisher?: string | null;
  publicationDate?: string | null;
  doi?: string | null;
  paperLink?: string | null;
  keywords: string[];
  registrationFees?: number | null;
  reimbursement?: number | null;
  journalStatus: "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "PUBLISHED" | "REJECTED";
  isPublic: boolean;
  facultyAuthors?: Array<{ id: string; user: { id: string; name: string | null; email: string | null; image?: string | null } }>;
  studentAuthors?: Array<{ id: string; user: { id: string; name: string | null; email: string | null; image?: string | null } }>;
}

export default function EditJournalDialog({
  journalId,
  open,
  onOpenChange,
  onSuccess,
}: {
  journalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  const [showCustomPublisher, setShowCustomPublisher] = useState(false);
  const [customPublisher, setCustomPublisher] = useState<string>("");

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
      abstract: null,
      imageUrl: null,
      documentUrl: null,
      scope: "NATIONAL",
      reviewType: "PEER_REVIEWED",
      JournalAccessType: "OPEN_ACCESS",
      JournalIndexing: "SCOPUS",
      quartile: null,
      publicationMode: "ONLINE",
      impactFactor: null,
      impactFactorDate: null,
      publisher: null,
      publicationDate: null,
      doi: null,
      paperLink: null,
      keywords: [],
      registrationFees: null,
      reimbursement: null,
      journalStatus: "SUBMITTED",
      isPublic: false,
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  // Load journal data when dialog opens
  useEffect(() => {
    if (open && journalId) {
      loadJournalData();
    }
  }, [open, journalId]);

  const loadJournalData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/research/journal/${journalId}`);
      const journal: Journal = response.data.journal;

      // Populate form with existing data
      form.reset({
        serialNo: journal.serialNo,
        title: journal.title,
        journalName: journal.journalName,
        abstract: journal.abstract || null,
        imageUrl: journal.imageUrl || null,
        documentUrl: journal.documentUrl || null,
        scope: journal.scope,
        reviewType: journal.reviewType,
        JournalAccessType: journal.JournalAccessType,
        JournalIndexing: journal.JournalIndexing,
        quartile: journal.quartile || null,
        publicationMode: journal.publicationMode,
        impactFactor: journal.impactFactor || null,
        impactFactorDate: journal.impactFactorDate || null,
        publisher: journal.publisher || null,
        publicationDate: journal.publicationDate || null,
        doi: journal.doi || null,
        paperLink: journal.paperLink || null,
        keywords: journal.keywords,
        registrationFees: journal.registrationFees || null,
        reimbursement: journal.reimbursement || null,
        journalStatus: journal.journalStatus,
        isPublic: journal.isPublic,
        facultyAuthorIds: journal.facultyAuthors?.map(a => a.user.id) || [],
        studentAuthorIds: journal.studentAuthors?.map(a => a.user.id) || [],
      });

      // Set selected users for display
      if (journal.facultyAuthors) {
        setSelectedFaculty(journal.facultyAuthors.map(a => ({
          id: a.user.id,
          name: a.user.name || '',
          email: a.user.email || '',
          image: a.user.image || undefined,
        })));
      }

      if (journal.studentAuthors) {
        setSelectedStudents(journal.studentAuthors.map(a => ({
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

      toast.success("Journal loaded successfully");
    } catch (error: any) {
      console.error("Error loading journal:", error);
      toast.error(error.response?.data?.error || "Failed to load journal");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    setUploadingImage(true);

    try {
      const imageUrl = await uploadFile(file);
      form.setValue("imageUrl", imageUrl);
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Failed to upload image");
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Document size should be less than 10MB");
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

  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Updating journal:", data);
      await axios.patch(`/api/research/journal/${journalId}`, data);
      toast.success("Journal updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating journal:", error);
      toast.error(
        error.response?.data?.error || error.response?.data?.message || "Failed to update journal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[96vw] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Edit Journal
          </DialogTitle>
          <DialogDescription className="text-base">
            Update the details of your journal entry
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
          <ScrollArea className="h-[calc(90vh-120px)] px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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
                              Abstract
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write abstract"
                                className="min-h-[100px] text-base border focus-visible:ring-1 resize-vertical"
                                {...field}
                                value={field.value ?? ""}
                              />
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
                              <SelectItem value="NATIONAL">National</SelectItem>
                              <SelectItem value="INTERNATIONAL">International</SelectItem>
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
                              <SelectItem value="NON_PEER_REVIEWED">Non-Peer Reviewed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="JournalAccessType"
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
                              <SelectItem value="SUBSCRIPTION_BASED">Subscription Based</SelectItem>
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
                              <SelectItem value="PRINT">Print</SelectItem>
                              <SelectItem value="ONLINE">Online</SelectItem>
                              <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="JournalIndexing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">
                            JournalIndexing <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select JournalIndexing" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SCI">SCI</SelectItem>
                              <SelectItem value="SCIE">SCIE</SelectItem>
                              <SelectItem value="SCOPUS">Scopus</SelectItem>
                              <SelectItem value="WEB_OF_SCIENCE">Web of Science</SelectItem>
                              <SelectItem value="PUBMED">PubMed</SelectItem>
                              <SelectItem value="IEEE_XPLORE">IEEE Xplore</SelectItem>
                              <SelectItem value="SPRINGER">Springer</SelectItem>
                              <SelectItem value="ELSEVIER">Elsevier</SelectItem>
                              <SelectItem value="GOOGLE_SCHOLAR">Google Scholar</SelectItem>
                              <SelectItem value="UGC_CARE">UGC CARE</SelectItem>
                              <SelectItem value="OTHERS">Others</SelectItem>
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
                            value={field.value ?? "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select quartile" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="Q1">Q1</SelectItem>
                              <SelectItem value="Q2">Q2</SelectItem>
                              <SelectItem value="Q3">Q3</SelectItem>
                              <SelectItem value="Q4">Q4</SelectItem>
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
                              value={field.value ?? ""}
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
                                  <SelectItem value="ACCEPTED">
                                    ✅ Accepted
                                  </SelectItem>
                                  <SelectItem value="PUBLISHED">
                                    📚 Published
                                  </SelectItem>
                                  <SelectItem value="REJECTED">
                                    ❌ Rejected
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
  );
}
