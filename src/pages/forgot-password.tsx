import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const forgotPasswordMutation = useForgotPassword();
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate({ data }, {
      onSuccess: () => {
        setSuccess(true);
        toast({
          title: "Email sent",
          description: "Check your inbox for reset instructions.",
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to send reset email",
          description: error.data?.error || error.message || "An error occurred",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-red-600 tracking-tight cursor-pointer drop-shadow-[0_0_10px_rgba(0,255,135,0.3)] mb-2">
              Nike<span className="text-red-400"> earn</span>
            </h1>
          </Link>
          <p className="text-muted-foreground text-lg">Reset your password</p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-red-600 font-medium">We've sent a password reset link to your email.</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full h-12">Return to Login</Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider font-bold">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="gamer@example.com" {...field} className="bg-slate-50 border-input focus-visible:ring-primary h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 text-black font-bold uppercase tracking-wider hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,135,0.2)]"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-8 text-center text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login">
            <span className="text-red-600 hover:underline cursor-pointer font-medium">Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
