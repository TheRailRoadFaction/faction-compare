"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dispatch, SetStateAction } from "react";
import { factionIds } from "./types";

const formSchema = z.object({
  leftFactionId: z.string(),
  rightFactionId: z.string(),
});

interface FactionInputFormProps extends React.ComponentProps<"div"> {
  setFactionIds: Dispatch<SetStateAction<factionIds | undefined>>;
}

export function FactionInputForm({
  className,
  setFactionIds,
  ...props
}: FactionInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leftFactionId: "",
      rightFactionId: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    localStorage.setItem("factionIds", JSON.stringify(values));
    setFactionIds(values);
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Enter faction IDs to compare</CardTitle>
          <CardDescription>
            Enter two faction IDs to compare members of
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="leftFactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Faction ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rightFactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Faction ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
