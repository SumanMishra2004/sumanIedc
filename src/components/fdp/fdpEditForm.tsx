
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { updateFDP, getFDPById } from "@/lib/research/fdpApi";

const fdpSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  organizedBy: z.string().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  topic: z.string().optional(),
  duration: z.string().optional(),
  remark: z.string().optional(),
});

type FDPFormValues = z.infer<typeof fdpSchema>;

export default function FDPEditForm({
  fdpId,
  open,
  onOpenChange,
  onSuccess,
}: {
  fdpId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<FDPFormValues>({
    resolver: zodResolver(fdpSchema),
    defaultValues: {
      title: "",
      description: "",
      keywords: [],
      organizedBy: "",
      startDate: "",
      endDate: "",
      topic: "",
      duration: "",
      remark: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!fdpId || !open) return;
      
      setIsLoading(true);
      try {
        const response = await getFDPById(fdpId);
        if (response.data) {
          const fdp = response.data;
          form.reset({
            title: fdp.title,
            description: fdp.description || "",
            keywords: fdp.keywords || [],
            organizedBy: fdp.organizedBy || "",
            startDate: fdp.startDate ? new Date(fdp.startDate).toISOString().split('T')[0] : "",
            endDate: fdp.endDate ? new Date(fdp.endDate).toISOString().split('T')[0] : "",
            topic: fdp.topic || "",
            duration: fdp.duration || "",
            remark: fdp.remark || "",
          });
        } else {
            toast.error(response.error || "Failed to fetch FDP details");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fdpId, open, form]);

  const addKeyword = () => {
    const currentKeywords = form.getValues("keywords") || [];
    if (keywordInput.trim() && !currentKeywords.includes(keywordInput.trim())) {
      form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords") || [];
    form.setValue("keywords", currentKeywords.filter((k) => k !== keyword));
  };

  const onSubmit = async (values: FDPFormValues) => {
    if (!fdpId) return;
    setIsSubmitting(true);
    try {
      const response = await updateFDP(fdpId, values);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("FDP updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit FDP Record</DialogTitle>
          <DialogDescription>
            Update your Faculty Development Program record.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <>
            <ScrollArea className="flex-1 px-6 py-4">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="FDP on AI/ML" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="organizedBy"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Organized By</FormLabel>
                            <FormControl>
                                <Input placeholder="IIT Bombay, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                     <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Topic / Theme</FormLabel>
                            <FormControl>
                                <Input placeholder="Artificial Intelligence" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                                <Input placeholder="2 Weeks" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    </div>

                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Brief description of the FDP..." className="h-20" {...field} />
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
                        <FormLabel>Keywords</FormLabel>
                        <div className="flex gap-2">
                            <Input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Add keyword and press Enter"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                e.preventDefault();
                                addKeyword();
                                }
                            }}
                            />
                            <Button type="button" onClick={addKeyword} variant="secondary">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {field.value?.map((keyword, index) => (
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
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any additional remarks..." className="h-20" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <div className="h-4"></div>
                </form>
                </Form>
            </ScrollArea>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update FDP
                </Button>
            </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
