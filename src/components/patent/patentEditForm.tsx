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
import { getPatentById, updatePatent } from "@/lib/research/patentApi";


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

export default function EditPatentDialog({
  patentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  patentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);


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

  useEffect(() => {
    if (open && patentId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const result = await getPatentById(patentId);
          if (result.error || !result.data) {
            toast.error(result.error || "Failed to fetch patent details");
            onOpenChange(false);
            return;
          }

          const patent = result.data.patent;

          // Helper to format date for input type="date"
          const formatDate = (date: any) => {
            if (!date) return "";
            return new Date(date).toISOString().split('T')[0];
          };

          form.reset({
            title: patent.title,
            abstract: patent.abstract || "",
            imageUrl: patent.imageUrl || "",
            documentUrl: patent.documentUrl,
            patentStatus: patent.patentStatus as any,
            applicationNo: patent.applicationNo || "",
            grantedPatentNo: patent.grantedPatentNo || "",
            patentLink: patent.patentLink || "",
            isPublic: patent.isPublic,
            keywords: patent.keywords,
            filingDate: formatDate(patent.filingDate),
            submissionDate: formatDate(patent.submissionDate),
            publicationDate: formatDate(patent.publicationDate),
            grantDate: formatDate(patent.grantDate),
            studentAuthorIds: patent.studentAuthors.map(a => a.user.id),
            facultyAuthorIds: patent.facultyAuthors.map(a => a.user.id),
          });

          setSelectedFaculty(patent.facultyAuthors.map(a => ({
             id: a.user.id,
             name: a.user.name || "",
             email: a.user.email || "",
             image: a.user.image || undefined
          })));
          
          setSelectedStudents(patent.studentAuthors.map(a => ({
             id: a.user.id,
             name: a.user.name || "",
             email: a.user.email || "",
             image: a.user.image || undefined
          })));

        } catch {
          toast.error("Failed to load patent");

          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open, patentId, form, onOpenChange]);


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

    setUploadingDocument(true);

    try {
      const documentUrl = await uploadFile(file);
      form.setValue("documentUrl", documentUrl);
      toast.success("Document uploaded successfully");
    } catch {
      toast.error("Failed to upload document");
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
    if (!patentId) return;
    setIsSubmitting(true);
    try {
      const response = await updatePatent(patentId, {
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

      toast.success("Patent updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-225 h-[90vh] p-0 overflow-hidden flex flex-col">

        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogTitle>Edit Patent</DialogTitle>
          <DialogDescription>
             Update the details of your patent.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
            <div className="flex items-center justify-center flex-1">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <ScrollArea className="flex-1 w-full">
          <div className="px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Patent Title" {...field} />
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
                            <FormLabel>Status *</FormLabel>
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
                                <FormLabel>Public Visibility</FormLabel>
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
                    </div>

                    <div className="gap-4">
                      <FormField
                        control={form.control}
                        name="abstract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Abstract</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Patent Abstract"
                                className="min-h-25"

                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Patent Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Patent Details</h3>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applicationNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application No.</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Application Number" 
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
                            <FormLabel>Granted Patent No.</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Granted Patent Number" 
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
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Patent Link (URL)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://..." 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="filingDate"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Filing Date</FormLabel>
                                <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
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
                                <FormLabel>Submission Date</FormLabel>
                                <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
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
                                <FormLabel>Publication Date</FormLabel>
                                <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
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
                                <FormLabel>Grant Date</FormLabel>
                                <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                  

                  {/* Taxonomy */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Taxonomy</h3>
                    <Separator />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Keywords *</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type keyword and press Enter"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={handleKeywordAdd}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
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
                                    <Badge key={index} variant="secondary">
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
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Authors */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Authors</h3>
                    <Separator />

                    <div className="grid grid-cols-1 gap-4">
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
                            <FormLabel>Student Authors</FormLabel>
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
                  </div>

                  {/* Files */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Files & Media</h3>
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative w-full h-64 rounded-md overflow-hidden border">
                        {imageFile || form.getValues('imageUrl') ? (
                          <img
                            src={imageFile ? URL.createObjectURL(imageFile) : form.getValues('imageUrl') || ""}
                            alt="Preview"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-muted/50">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                     
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
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
                            ) : (
                                <>
                                 <Upload className="h-8 w-8 text-muted-foreground" />
                                 <span className="text-sm text-muted-foreground">Change Image</span>
                                </>
                            )}
                          </label>
                        </div>
                    

                      <div className="space-y-2">
                         <FormLabel>Document (PDF)</FormLabel>
                         {form.getValues('documentUrl') && (
                             <div className="mb-2 text-sm text-blue-600">
                                 <a href={form.getValues('documentUrl')!} target="_blank" rel="noopener noreferrer">View Current Document</a>
                             </div>
                         )}
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
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
                            ) : (
                                <>
                                 <Upload className="h-8 w-8 text-muted-foreground" />
                                 <span className="text-sm text-muted-foreground">Change Document</span>
                                </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
               
              </form>
            </Form>
          </div>
        </ScrollArea>
        )}
        
        <div className="p-6 border-t bg-background mt-auto flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || loading}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Update Patent
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
