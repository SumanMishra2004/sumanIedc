"use client";

import { useState, useEffect } from "react";
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
import { uploadFile } from "@/lib/appwrite";
import { getConferenceById, updateConference } from "@/lib/research/conferenceApi";
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useImageCrop } from "@/hooks/useImageCrop";

const conferenceSchema = z.object({
  conferenceName: z.string().min(1, "Conference Name is required").max(200, "Name is too long"),
  paperName: z.string().optional(),
  abstract: z.string().min(100, "Abstract must be at least 100 characters").max(1000, "Abstract is too long").optional().or(z.literal('')),
  imageUrl: z.string().min(1, "Cover image is required"),
  documentUrl: z.string().nullable().optional(),
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

export default function ConferenceEditForm({
  conferenceId,
  open,
  onOpenChange,
  onSuccess,
}: {
  conferenceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const { cropState, openCrop, closeCrop } = useImageCrop();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Separate state for selected users (UI display)
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

  useEffect(() => {
    const fetchConference = async () => {
      if (!conferenceId || !open) return;
      
      setLoading(true);
      try {
        const response = await getConferenceById(conferenceId);
        if (response.data) {
          const conf = response.data.conference;
          
          // Map API response to form values
          form.reset({
            conferenceName: conf.conferenceName,
            paperName: conf.paperName || "",
            abstract: conf.abstract || "",
            imageUrl: conf.imageUrl || "",
            documentUrl: conf.documentUrl,
            conferenceStatus: conf.conferenceStatus,
            mode: conf.mode,
            isPublic: conf.isPublic,
            keywords: conf.keywords,
            paperDoi: conf.paperDoi || "",
            paperLink: conf.paperLink || "",
            conferenceDate: conf.conferenceDate ? new Date(conf.conferenceDate).toISOString().split('T')[0] : "",
            conferencePublisher: conf.conferencePublisher || "",
            registrationFees: conf.registrationFees,
            reimbursement: conf.reimbursement,
            studentAuthorIds: conf.studentAuthors.map(a => a.userId),
            facultyAuthorIds: conf.facultyAuthors.map(a => a.userId),
          });

          // Set selected users for MultiSelect components
          setSelectedFaculty(conf.facultyAuthors.map(a => ({
             id: a.user.id,
             name: a.user.name || "",
             email: a.user.email || "",
             image: a.user.image || undefined
          })));

          setSelectedStudents(conf.studentAuthors.map(a => ({
             id: a.user.id,
             name: a.user.name || "",
             email: a.user.email || "",
             image: a.user.image || undefined
          })));
        } else {
            toast.error(response.error || "Failed to fetch conference details");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load conference data");
      } finally {
        setLoading(false);
      }
    };

    fetchConference();
  }, [conferenceId, open, form]);

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

  const addKeyword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = keywordInput.trim();
      if (value) {
        const currentKeywords = form.getValues("keywords");
        if (!currentKeywords.includes(value) && currentKeywords.length < 10) {
          form.setValue("keywords", [...currentKeywords, value]);
          setKeywordInput("");
        }
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
    if (!conferenceId) return;
    
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

      const response = await updateConference(conferenceId, payload);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Conference updated successfully");
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Conference</DialogTitle>
          <DialogDescription>
            Update the conference details.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
             <div className="flex items-center justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        ) : (
        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Details</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conferenceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conference Name</FormLabel>
                        <FormControl>
                          <Input placeholder="International Conference on..." {...field} />
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
                        <FormLabel>Paper Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Research paper title..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conferencePublisher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publisher</FormLabel>
                        <FormControl>
                          <Input placeholder="IEEE, Springer, etc." {...field} value={field.value || ""} />
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
                        <FormLabel>Conference Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="conferenceStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
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

                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
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
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public</FormLabel>
                          <FormDescription>
                            Visible to everyone
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
                </div>

                <FormField
                  control={form.control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abstract</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter abstract..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Uploads</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="cursor-pointer"
                                />
                                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                            </div>
                            {field.value && (
                                <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                    View Current Image
                                </a>
                            )}
                          </div>
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
                        <FormLabel>Document (PDF)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-4">
                                <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleDocumentUpload}
                                className="cursor-pointer"
                                />
                                {uploadingDocument && <Loader2 className="h-4 w-4 animate-spin" />}
                             </div>
                             {field.value && (
                                <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                    View Current Document
                                </a>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financials & Identifiers */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Info</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationFees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Fees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
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
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paperDoi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper DOI</FormLabel>
                        <FormControl>
                          <Input placeholder="DOI..." {...field} value={field.value || ""} />
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
                        <FormLabel>Paper Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords (Press Enter to add)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="Add keywords..."
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={addKeyword}
                          />
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((keyword, index) => (
                              <Badge key={index} variant="secondary">
                                {keyword}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 ml-2 hover:bg-transparent"
                                  onClick={() => removeKeyword(keyword)}
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               {/* Authors */}
               <div className="space-y-4">
                <h3 className="text-lg font-medium">Authors</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facultyAuthorIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faculty Authors</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="studentAuthorIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Authors</FormLabel>
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
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Conference
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
