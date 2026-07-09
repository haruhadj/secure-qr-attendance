"use client";

import { useState } from "react";
import { updateSystemSetting } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

export default function SystemSettingsForm({ settings }: { settings: Setting[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(
    settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
  );

  const handleUpdate = async (key: string) => {
    setLoading(key);
    try {
      const result = await updateSystemSetting(key, values[key]);
      if (result.success) {
        toast.success("Setting updated successfully");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {settings.map((setting) => (
        <div key={setting.key} className="flex flex-col sm:flex-row sm:items-end gap-4 p-4 border rounded-xl bg-card shadow-sm">
          <div className="flex-1 space-y-2">
            <Label className="text-base font-semibold capitalize text-foreground">
              {setting.key.replace(/_/g, " ")}
            </Label>
            <p className="text-xs text-muted-foreground">{setting.description}</p>
            {setting.key.endsWith("_enabled") ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValues({
                    ...values,
                    [setting.key]: values[setting.key] === "true" ? "false" : "true",
                  })
                }
                className="bg-muted/50"
              >
                {values[setting.key] === "true" ? "Enabled" : "Disabled"}
              </Button>
            ) : (
              <Input
                value={values[setting.key] || ""}
                onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                className="bg-muted/50"
              />
            )}
          </div>
          <Button 
            onClick={() => handleUpdate(setting.key)} 
            disabled={loading === setting.key || values[setting.key] === setting.value}
            className="gap-2 shrink-0"
          >
            {loading === setting.key ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      ))}
    </div>
  );
}
