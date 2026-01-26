"use client";

import { useState } from "react";
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
  serialNo: z.string().min(1, "Serial No is required"),
  titleOfJournal: z.string().min(1, "Journal title is required").max(500),
  title: z.string().min(1, "Paper title is required").max(500),
  journalType: z.enum([
    "INTERNATIONAL",
    "NATIONAL",
    "PEER_REVIEWED",
    "OPEN_ACCESS",
    "OTHER",
  ]),
  impactFactor: z.number().nullable().optional(),
  dateOfImpactFactor: z.string().nullable().optional(),
  journalPublisher: z.string().nullable().optional(),
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "REVISION",
    "APPROVED",
    "PUBLISHED",
    "REJECTED",
  ]),
  paperLink: z.string().nullable().optional(),
  doi: z.string().nullable().optional(),
  registrationFees: z.number().nullable().optional(),
  reimbursement: z.number().nullable().optional(),
  isPublic: z.boolean(),
  abstract: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  keywords: z.array(z.string()),
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

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      serialNo: "",
      titleOfJournal: "",
      title: "",
      journalType: "INTERNATIONAL",
      impactFactor: null,
      dateOfImpactFactor: null,
      journalPublisher: null,
      status: "DRAFT",
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
      console.log("Submitting journal:", data);
      await axios.post("/api/research/journal", data);
      toast.success("Journal created successfully!");
      form.reset();
      setImageFile(null);
      setDocumentFile(null);
      setKeywordInput("");
      setSelectedFaculty([]);
      setSelectedStudents([]);
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
                            Serial No <span className="text-destructive">*</span>
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
                      name="titleOfJournal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Journal Title <span className="text-destructive">*</span>
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
                            Abstract
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write abstract (optional)"
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
                    name="journalType"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-sm mb-1">
                          Journal Type <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INTERNATIONAL">🌍 International</SelectItem>
                            <SelectItem value="NATIONAL">🏛️ National</SelectItem>
                            <SelectItem value="PEER_REVIEWED">👥 Peer Reviewed</SelectItem>
                            <SelectItem value="OPEN_ACCESS">🔓 Open Access</SelectItem>
                            <SelectItem value="OTHER">📄 Other</SelectItem>
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
                    name="dateOfImpactFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm mb-1">IF Date</FormLabel>
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
                    name="journalPublisher"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-sm mb-1">
                          Publisher
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Publisher name"
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
                    name="publicationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm mb-1">Pub Date</FormLabel>
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-1">
                              Status
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 w-full">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DRAFT">📝 Draft</SelectItem>
                                <SelectItem value="SUBMITTED">
                                  📤 Submitted
                                </SelectItem>
                                <SelectItem value="UNDER_REVIEW">
                                  🔍 Under Review
                                </SelectItem>
                                <SelectItem value="REVISION">
                                  ✏️ Revision
                                </SelectItem>
                                <SelectItem value="APPROVED">
                                  ✅ Approved
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
                          Cover Image
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
                                    <p className="font-medium text-sm">
                                      Cover Image
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
                                  form.setValue("imageUrl", "");
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
                  onClick={() => {
                    form.reset();
                    setImageFile(null);
                    setDocumentFile(null);
                    setSelectedFaculty([]);
                    setSelectedStudents([]);
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
