import { AlertCircle, Database, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function SetupRequired() {
  const databaseUrl = "postgresql://neondb_owner:npg_ySbZeC5J9wIs@ep-square-boat-ain9gi5m-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(databaseUrl);
    alert("DATABASE_URL copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Database className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Setup Required</CardTitle>
              <CardDescription className="text-base mt-1">
                Database environment variable not configured
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>DATABASE_URL Missing</AlertTitle>
            <AlertDescription>
              The application cannot connect to the database. Please add the DATABASE_URL environment variable to Vercel.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Setup (2 minutes):</h3>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Vercel Dashboard</p>
                  <a 
                    href="https://vercel.com/buildkindtech/dalconnect/settings/environment-variables" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 text-sm mt-1"
                  >
                    Open Settings → Environment Variables
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Add DATABASE_URL</p>
                  <div className="bg-white border rounded p-3 font-mono text-xs break-all">
                    {databaseUrl}
                  </div>
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Select Environments</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check: <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Redeploy</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Redeploy" button (Vercel will automatically rebuild)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                After adding the environment variable, this page will automatically show the DalConnect platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
