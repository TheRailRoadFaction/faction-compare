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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";
import { keys } from "./types";

const formSchema = z.object({
  ffScouterKey: z.string().min(16).max(16),
  publicKey: z.string().min(16).max(16),
});

interface LoginFormProps extends React.ComponentProps<"div"> {
  setKeys: Dispatch<SetStateAction<keys | undefined>>;
}

export function LoginForm({ className, setKeys, ...props }: LoginFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ffScouterKey: "",
      publicKey: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    localStorage.setItem("keys", JSON.stringify(values));
    setKeys(values)
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Enter two API keys</CardTitle>
          <CardDescription>
            Enter FF Scouter V3 key and Public Torn API key
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="ffScouterKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FF Scouter V3 API Key</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the key you signed up with at FF Scouter.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="publicKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public API Key</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your Torn API public Key.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
          {/* 

          left this here in case u want to style the form as before, im too lazy


          <form onSubmit={formSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="ffscouterKey">FF Scouter V3 API Key</Label>
                <Input
                  id="ffscouterKey"
                  type="password"
                  placeholder=""
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="publicKey">Public Torn API Key</Label>
                </div>
                <Input id="publicKey" type="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
            </div> */}
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="http://ffscouter.com"
              className="underline underline-offset-4"
            >
              Create an FF Scouter V3 key
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
