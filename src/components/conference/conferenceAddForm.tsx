"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadFile } from "@/lib/appwrite";
import { createConference } from "@/lib/research/conferenceApi";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";

const conferenceSchema = z.object({
  conferenceName: z.string().min(1, "Conference Name is required").max(200, "Name is too long"),
  paperName: z.string().optional(),
  abstract: z.string().min(100, "Abstract must be at least 100 characters").max(1000, "Abstract is too long").optional().or(z.literal('')),
  imageUrl: z.string().min(1, "Cover image is required"),
  documentUrl: z.string().optional(),
  conferenceStatus: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "PRESENTED",
    "PUBLISHED",
  ]),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  registrationFees: z.number().nullable().optional(),
  reimbursement: z.number().nullable().optional(),
  isPublic: z.boolean(),
  keywords: z.array(z.string()).min(3, "At least 3 keywords are required").max(10, "No more than 10 keywords are allowed"),
  paperDoi: z.string().nullable().optional(),
  paperLink: z.string().nullable().optional(),
  conferenceDate: z.string().nullable().optional(),
  conferencePublisher: z.string().nullable().optional(),
  studentAuthorIds: z.array(z.string()),
  facultyAuthorIds: z.array(z.string()),
});

type ConferenceFormValues = z.infer<typeof conferenceSchema>;

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function ConferenceAddForm({
  onSuccess,
  open,
  onOpenChange,
}: {
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const { cropState, openCrop, closeCrop } = useImageCrop();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [selectedFaculty, setSelectedFaculty] = useState<SelectedUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<SelectedUser[]>([]);

  const form = useForm<ConferenceFormValues>({
    resolver: zodResolver(conferenceSchema),
    defaultValues: {
      conferenceName: "",
      paperName: "",
      abstract: "",
      imageUrl: "",
      documentUrl: "",
      conferenceStatus: "SUBMITTED",
      mode: "OFFLINE",
      isPublic: false,
      keywords: [],
      paperDoi: "",
      paperLink: "",
      conferenceDate: "",
      conferencePublisher: "",
      studentAuthorIds: [],
      facultyAuthorIds: [],
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    openCrop(file, "poster", async (croppedFile) => {
      closeCrop();
      setImageFile(croppedFile);
      setUploadingImage(true);
      try {
        const fileId = await uploadFile(croppedFile);
        const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        form.setValue("imageUrl", fileUrl);
        toast.success("Image uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload image");
        console.error(error);
      } finally {
        setUploadingImage(false);
      }
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocumentFile(file);
    setUploadingDocument(true);
    try {
      const fileId = await uploadFile(file);
      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      form.setValue("documentUrl", fileUrl);
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (value) {
      const currentKeywords = form.getValues("keywords");
      if (!currentKeywords.includes(value) && currentKeywords.length < 10) {
        form.setValue("keywords", [...currentKeywords, value]);
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keywordToRemove)
    );
  };

  const onSubmit = async (data: ConferenceFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        registrationFees: data.registrationFees ?? undefined,
        reimbursement: data.reimbursement ?? undefined,
        paperDoi: data.paperDoi ?? undefined,
        paperLink: data.paperLink ?? undefined,
        conferencePublisher: data.conferencePublisher ?? undefined,
        conferenceDate: data.conferenceDate || undefined,
        paperName: data.paperName || undefined,
        abstract: data.abstract || undefined,
        documentUrl: data.documentUrl || undefined,
      };
      
      const response = await createConference(payload);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Conference created successfully");
        form.reset();
        setSelectedFaculty([]);
        setSelectedStudents([]);
        setImageFile(null);
        setDocumentFile(null);
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {cropState.open && <ImageCropModal src={cropState.src} ratio={cropState.ratio} fileName={cropState.fileName} onCrop={cropState.onCrop} onCancel={closeCrop} />}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[96vw] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            New Conference
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter the details for the new conference record.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-6">
              
              {/* Basic Details */}
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
                      name="conferenceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Conference Name <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="International Conference on..." 
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
                      name="paperName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Paper Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Research paper title..." 
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
                            <FormLabel className="text-base font-semibold mb-1">Keywords <span className="text-destructive">*</span></FormLabel>
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
                                  <div className="flex flex-wrap gap-1.5 pt-2">
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
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Abstract</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter abstract..."
                              className="min-h-[100px] text-base border focus-visible:ring-1 resize-vertical"
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

              {/* Conference Details */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    Conference Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="conferencePublisher"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">Publisher</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Publisher..." 
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
                      name="conferenceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">Conference Date</FormLabel>
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
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm mb-1">Mode</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ONLINE">Online</SelectItem>
                                <SelectItem value="OFFLINE">Offline</SelectItem>
                                <SelectItem value="HYBRID">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                       <FormField
                      control={form.control}
                      name="paperDoi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm mb-1">Paper DOI</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="DOI..." 
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
                      name="paperLink"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-sm mb-1">Paper Link</FormLabel>
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
                </CardContent>
              </Card>

              {/* Authors & Status Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 
                 {/* Authors */}
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

                 {/* Status & Financials */}
                 <Card className="border-dashed border-border overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        Status & Financials
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <FormField
                          control={form.control}
                          name="conferenceStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-1">Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                  <SelectItem value="APPROVED">Approved</SelectItem>
                                  <SelectItem value="PRESENTED">Presented</SelectItem>
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
                                <FormLabel className="text-sm mb-1">Reg Fees</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    value={field.value || ""}
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
                                    placeholder="0.00"
                                    className="h-10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                         <Separator className="my-2" />
                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="space-y-0.5">
                                <FormLabel className="font-semibold">Public Access</FormLabel>
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

              {/* Uploads */}
              <Card className="border-dashed border-border overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    Documents & Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold mb-2 block">Cover Image <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                           <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors cursor-pointer text-center h-full">
                            <div 
                              className="p-6 flex flex-col items-center justify-center gap-2 h-full"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <div className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                <br />PNG, JPG (max 5MB)
                              </div>
                              <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                               {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                           </Card>
                          </FormControl>
                          <FormDescription className="text-xs text-center pt-2">
                            {field.value && !uploadingImage && (
                               <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                                 <Upload className="h-3 w-3" />
                                 <span className="truncate">{imageFile?.name || "Image uploaded"}</span>
                                 <Button
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    className="h-5 w-5 p-0"
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
                          <FormLabel className="text-base font-semibold mb-2 block">Document (PDF)</FormLabel>
                          <FormControl>
                            <Card className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors cursor-pointer text-center h-full">
                              <div 
                                className="p-6 flex flex-col items-center justify-center gap-2 h-full"
                                onClick={() => document.getElementById('doc-upload')?.click()}
                              >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                  <br />PDF, DOC (max 10MB)
                                </div>
                                <Input
                                  id="doc-upload"
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={handleDocumentUpload}
                                  className="hidden"
                                  disabled={uploadingDocument}
                                />
                                {uploadingDocument && <Loader2 className="h-4 w-4 animate-spin" />}
                              </div>
                            </Card>
                          </FormControl>
                          <FormDescription className="text-xs text-center pt-2">
                            {field.value && !uploadingDocument && (
                               <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                                 <Upload className="h-3 w-3" />
                                 <span className="truncate">{documentFile?.name || "Document uploaded"}</span>
                                 <Button
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                      setDocumentFile(null);
                                      form.setValue("documentUrl", "");
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                               </div>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

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
                  disabled={isSubmitting}
                  className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 flex-1 sm:flex-none shadow-md"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Conference
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
