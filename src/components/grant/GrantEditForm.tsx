"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GrantInRole, GrantInStatus } from "@prisma/client";
import { getGrantInById } from "@/lib/research/grant-in";

const grantSchema = z.object({
  projectCode: z.string().optional(),
  grantInStatus: z.nativeEnum(GrantInStatus),
  applicationDate: z.string().min(1, "Application date is required"),
  grantDate: z.string().optional(),
  durationOfProject: z.string().optional(),
  amountGranted: z.number().min(0).optional(),
  usedAmount: z.number().min(0).optional(),
  isPublic: z.boolean(),
  
  // Minimal author handling for edit (we preserve existing unless re-implemented)
  // Re-implementing author role management in edit requires a complex UI
  // matching AddDialog. For now basic fields.
});

type GrantFormValues = z.infer<typeof grantSchema>;

export function GrantEditDialog({
  grantId,
  open,
  onOpenChange,
  onSuccess,
}: {
  grantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const form = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: {
      grantInStatus: GrantInStatus.APPLIED,
      isPublic: false,
    },
  });

  useEffect(() => {
    if (open && grantId) {
      const fetchGrant = async () => {
        setFetchLoading(true);
        try {
          const response = await getGrantInById(grantId);
          if (response.data?.grantIn) {
            const g = response.data.grantIn;
            form.reset({
              projectCode: g.projectCode || undefined,
              grantInStatus: g.grantInStatus,
              applicationDate: g.applicationDate ? new Date(g.applicationDate).toISOString().split('T')[0] : '',
              grantDate: g.grantDate ? new Date(g.grantDate).toISOString().split('T')[0] : undefined,
              durationOfProject: g.durationOfProject || undefined,
              amountGranted: g.amountGranted || undefined,
              usedAmount: g.usedAmount || undefined,
              isPublic: g.isPublic,
            });
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch grant details");
        } finally {
          setFetchLoading(false);
        }
      };
      
      fetchGrant();
    }
  }, [open, grantId, form]);

  const onSubmit = async (values: GrantFormValues) => {
    if (!grantId) return;
    
    setLoading(true);
    try {
      const payload = {
        ...values,
        applicationDate: values.applicationDate ? new Date(values.applicationDate).toISOString() : undefined,
        grantDate: values.grantDate ? new Date(values.grantDate).toISOString() : undefined,
      };

      await axios.patch(`/api/research/grant-in/${grantId}`, payload);
      toast.success("Grant updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to update grant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Grant</DialogTitle>
          <DialogDescription>
            Update grant details.
          </DialogDescription>
        </DialogHeader>

        {fetchLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grantInStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(GrantInStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applicationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amountGranted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Granted</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(e.target.valueAsNumber || undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="usedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Used Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(e.target.valueAsNumber || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                   control={form.control}
                   name="durationOfProject"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Duration</FormLabel>
                       <FormControl>
                         <Input placeholder="e.g. 2 Years" {...field} />
                       </FormControl>
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
                        <FormLabel className="text-base">Public Visibility</FormLabel>
                        <FormDescription>
                          Make this grant visible to all users
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
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
