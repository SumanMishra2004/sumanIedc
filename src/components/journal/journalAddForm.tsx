"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { journalSchema } from "@/lib/validations/journal";
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
import { PosterUploadField } from "@/components/ui/PosterUploadField";
import {
  TeacherStatus,
  JournalStatus,
  JournalScope,
  JournalReviewType,
  JournalAccessType,
  JournalIndexing,
  JournalQuartile,
  JournalPublicationMode
} from "@prisma/client";

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);
  const [publisherOption, setPublisherOption] = useState<string>("");
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

  useEffect(() => {
    if (indexing === "NONE") {
      form.setValue("quartile", "NOT_APPLICABLE");
    }
  }, [indexing, form]);

  const handleImageUpload = async (croppedFile: File) => {
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
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const input = e.currentTarget;
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
      input.value = "";
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
      console.log("Submitting journal:", data);
      await axios.post("/api/research/journal", data);
      toast.success("Journal created successfully!");
      form.reset();
      setImageFile(null);
      setDocumentFile(null);
      setKeywordInput("");
      setSelectedFaculty([]);
      setSelectedStudents([]);
      setPublisherOption("");
      setCustomPublisher("");
      setOpen(false);
      onClose?.();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating journal:", error);
      toast.error(
        error.response?.data?.error || error.response?.data?.message || "Failed to create journal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Fill in the details to create a new journal entry
          </DialogDescription>
        </DialogHeader>

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
                            Serial No 
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
                      name="title"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-base font-semibold">
                            Paper Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter paper title"
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
                          <FormLabel className="text-base font-semibold mb-1">
                            Keywords
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select review type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PEER_REVIEWED">👥 Peer Reviewed</SelectItem>
                            <SelectItem value="DOUBLE_BLIND">🙈 Double Blind</SelectItem>
                            <SelectItem value="SINGLE_BLIND">👁️ Single Blind</SelectItem>
                            <SelectItem value="EDITORIAL_REVIEWED">✍️ Editorial</SelectItem>
                            <SelectItem value="NON_PEER_REVIEWED">📄 Non-Peer</SelectItem>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select access" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OPEN_ACCESS">🔓 Open Access</SelectItem>
                            <SelectItem value="SUBSCRIPTION">💳 Subscription</SelectItem>
                            <SelectItem value="HYBRID">🔄 Hybrid</SelectItem>
                            <SelectItem value="DIAMOND_OPEN_ACCESS">💎 Diamond</SelectItem>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
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
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select quartile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Q1">🥇 Q1</SelectItem>
                            <SelectItem value="Q2">🥈 Q2</SelectItem>
                            <SelectItem value="Q3">🥉 Q3</SelectItem>
                            <SelectItem value="Q4">4️⃣ Q4</SelectItem>
                            <SelectItem value="NOT_APPLICABLE">➖ N/A</SelectItem>
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
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONLINE">💻 Online</SelectItem>
                            <SelectItem value="PRINT">📰 Print</SelectItem>
                            <SelectItem value="PRINT_AND_ONLINE">📱 Print & Online</SelectItem>
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
                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-sm mb-1">
                          Publisher
                        </FormLabel>
                        <div className="space-y-2">
                          <Select
                            value={publisherOption}
                            onValueChange={(value) => {
                              setPublisherOption(value);
                              if (value === "none") {
                                field.onChange(null);
                                setCustomPublisher("");
                              } else if (value !== "other") {
                                field.onChange(value);
                                setCustomPublisher("");
                              } else {
                                field.onChange(customPublisher || null);
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
                              <SelectItem value="Springer">Springer</SelectItem>
                              <SelectItem value="Elsevier">Elsevier</SelectItem>
                              <SelectItem value="Wiley">Wiley</SelectItem>
                              <SelectItem value="Taylor & Francis">Taylor & Francis</SelectItem>
                              <SelectItem value="Sage Publications">Sage Publications</SelectItem>
                              <SelectItem value="IEEE">IEEE</SelectItem>
                              <SelectItem value="ACM">ACM</SelectItem>
                              <SelectItem value="Oxford University Press">Oxford University Press</SelectItem>
                              <SelectItem value="Cambridge University Press">Cambridge University Press</SelectItem>
                              <SelectItem value="MDPI">MDPI</SelectItem>
                              <SelectItem value="Nature Publishing Group">Nature Publishing Group</SelectItem>
                              <SelectItem value="Frontiers Media">Frontiers Media</SelectItem>
                              <SelectItem value="Public Library of Science (PLOS)">Public Library of Science (PLOS)</SelectItem>
                              <SelectItem value="American Chemical Society">American Chemical Society</SelectItem>
                              <SelectItem value="Royal Society of Chemistry">Royal Society of Chemistry</SelectItem>
                              <SelectItem value="IOP Publishing">IOP Publishing</SelectItem>
                              <SelectItem value="Wolters Kluwer">Wolters Kluwer</SelectItem>
                              <SelectItem value="Emerald Publishing">Emerald Publishing</SelectItem>
                              <SelectItem value="BMJ">BMJ</SelectItem>
                              <SelectItem value="Hindawi">Hindawi</SelectItem>
                              <SelectItem value="other">✏️ Other (Custom)</SelectItem>
                            </SelectContent>
                          </Select>
                          {publisherOption === "other" && (
                            <Input
                              placeholder="Enter custom publisher name"
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
                    name="paperLink"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-4">
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
                      Status & Financials
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
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 w-full">
                                  <SelectValue placeholder="Journal Status" />
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
                        <FormControl>
                          <PosterUploadField
                            value={field.value}
                            onChange={handleImageUpload}
                            onRemove={() => { setImageFile(null); form.setValue("imageUrl", ""); }}
                            isUploading={uploadingImage}
                            disabled={uploadingImage}
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
                        <FormLabel className="text-base font-semibold mb-2 block">
                          Document
                        </FormLabel>
                        <FormControl>
                          <label htmlFor="document-upload" className="cursor-pointer block h-full">
                            <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors p-6 text-center h-full">
                              <div className="space-y-2 h-full flex flex-col justify-center">
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
                                  className="sr-only"
                                />
                                {uploadingDocument && (
                                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                )}
                              </div>
                            </Card>
                          </label>
                        </FormControl>
                        <FormDescription className="text-xs text-center pt-2 block">
                          {documentFile && (
                            <span className="flex items-center justify-center gap-1 text-xs bg-muted/50 p-2 rounded overflow-hidden">
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
                            </span>
                          )}
                          {field.value && !documentFile && (
                            <span className="text-xs text-green-600 font-medium block mt-2">
                              ✓ Uploaded
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
                  onClick={() => {
                    form.reset();
                    setImageFile(null);
                    setDocumentFile(null);
                    setSelectedFaculty([]);
                    setSelectedStudents([]);
                    setPublisherOption("");
                    setCustomPublisher("");
                  }}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 flex-1 sm:flex-none shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Creating..." : "Create Journal"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
