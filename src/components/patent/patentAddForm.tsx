"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { uploadFile } from "@/lib/appwrite";
import { createPatent } from "@/lib/research/patentApi";


const patentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  abstract: z.string().optional(),
  imageUrl: z.string().optional(),
  documentUrl: z.string().nullable().optional(),
  patentStatus: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "GRANTED",
  ]),
  applicationNo: z.string().nullable().optional(),
  grantedPatentNo: z.string().nullable().optional(),
  patentLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  isPublic: z.boolean(),
  keywords: z.array(z.string()).min(1, "At least 1 keyword is required").max(10, "No more than 10 keywords are allowed"),
  filingDate: z.string().nullable().optional(),
  submissionDate: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  grantDate: z.string().nullable().optional(),
  studentAuthorIds: z.array(z.string()),
  facultyAuthorIds: z.array(z.string()),
});

type PatentFormValues = z.infer<typeof patentSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function PatentAddForm({
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

  // Separate state for selected users (UI display)
  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  const form = useForm<PatentFormValues>({
    resolver: zodResolver(patentSchema),
    defaultValues: {
      title: "",
      abstract: "",
      imageUrl: "",
      documentUrl: null,
      patentStatus: "SUBMITTED",
      applicationNo: "",
      grantedPatentNo: "",
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

  const handleKeywordAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const keyword = keywordInput.trim();
      if (keyword && !form.getValues("keywords").includes(keyword)) {
        const currentKeywords = form.getValues("keywords");
        if (currentKeywords.length >= 10) {
          toast.error("Maximum 10 keywords allowed");
          return;
        }
        form.setValue("keywords", [...currentKeywords, keyword]);
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keywordToRemove),
    );
  };

  async function onSubmit(data: PatentFormValues) {
    setIsSubmitting(true);
    try {
      const response = await createPatent({
        ...data,
        abstract: data.abstract || undefined,
        imageUrl: data.imageUrl || undefined,
        documentUrl: data.documentUrl || undefined,
        applicationNo: data.applicationNo || undefined,
        grantedPatentNo: data.grantedPatentNo || undefined,
        patentLink: data.patentLink || undefined,
        filingDate: data.filingDate || undefined,
        submissionDate: data.submissionDate || undefined,
        publicationDate: data.publicationDate || undefined,
        grantDate: data.grantDate || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Patent created successfully");
      form.reset();
      setImageFile(null);
      setDocumentFile(null);
      setSelectedFaculty([]);
      setSelectedStudents([]);
      setOpen(false);
      onClose?.();
      onSuccess?.();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) onClose?.();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-primary to-purple-600">
            Add Patent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="md:max-w-[96vw]! max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            New Patent
          </DialogTitle>
          <DialogDescription className="text-base">
            Fill in the details to create a new patent entry
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
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-1 lg:col-span-2">
                          <FormLabel className="text-base font-semibold">
                            Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter patent title"
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
                      name="patentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Status <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SUBMITTED">Submitted</SelectItem>
                              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                              <SelectItem value="APPROVED">Approved</SelectItem>
                              <SelectItem value="GRANTED">Granted</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Public Visibility</FormLabel>
                            <FormDescription>
                              Make this patent visible to everyone
                            </FormDescription>
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

                    <FormField
                      control={form.control}
                      name="abstract"
                      render={({ field }) => (
                        <FormItem className="col-span-1 lg:col-span-2">
                          <FormLabel className="text-base font-semibold">Abstract</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter patent abstract"
                              className="min-h-[100px] text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Patent Details */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    Patent Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="applicationNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Application No.</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter application number"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel className="text-base font-semibold">Granted Patent No.</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter granted patent number"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
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
                        <FormItem className="col-span-1 lg:col-span-2">
                          <FormLabel className="text-base font-semibold">Patent Link (URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
                            />
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
                          <FormLabel className="text-base font-semibold">Filing Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel className="text-base font-semibold">Submission Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel className="text-base font-semibold">Publication Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel className="text-base font-semibold">Grant Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-12 text-base border focus-visible:ring-1"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Taxonomy */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    Taxonomy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Keywords <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type keyword and press Enter"
                              className="h-12 text-base border focus-visible:ring-1"
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              onKeyDown={handleKeywordAdd}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 px-4"
                              onClick={() => {
                                if (keywordInput.trim()) {
                                  const event = {
                                    key: "Enter",
                                    preventDefault: () => {},
                                  } as any;
                                  handleKeywordAdd(event);
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-sm py-1">
                                {keyword}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => removeKeyword(keyword)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Authors */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    Authors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="facultyAuthorIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Faculty Authors</FormLabel>
                          <MultiSelectUsers
                            isStudent={false}
                            value={selectedFaculty}
                            onChange={(users) => {
                              setSelectedFaculty(users);
                              field.onChange(users.map((u) => u.id));
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentAuthorIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Student Authors</FormLabel>
                          <MultiSelectUsers
                            isStudent={true}
                            value={selectedStudents}
                            onChange={(users) => {
                              setSelectedStudents(users);
                              field.onChange(users.map((u) => u.id));
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Files & Media */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    Files & Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel className="text-base font-semibold">Patent Image</FormLabel>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="image-upload"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : imageFile ? (
                            <div className="text-sm text-green-600 font-medium">
                              {imageFile.name}
                            </div>
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {uploadingImage
                              ? "Uploading..."
                              : "Click to upload image"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel className="text-base font-semibold">Document (PDF)</FormLabel>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          id="document-upload"
                          onChange={handleDocumentUpload}
                          disabled={uploadingDocument}
                        />
                        <label
                          htmlFor="document-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          {uploadingDocument ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : documentFile ? (
                            <div className="text-sm text-green-600 font-medium">
                              {documentFile.name}
                            </div>
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {uploadingDocument
                              ? "Uploading..."
                              : "Click to upload document"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
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
                  {isSubmitting ? "Creating..." : "Create Patent"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
