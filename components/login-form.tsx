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
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  formSubmit,
  ...props
}: React.ComponentProps<"div">) {
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
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a
                href="http://ffscouter.com"
                className="underline underline-offset-4"
              >
                Create an FF Scouter V3 key
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
