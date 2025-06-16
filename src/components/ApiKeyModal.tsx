import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ApiKeyModalProps {
  onClose: () => void;
  currentApiKey: string | null;
}

export function ApiKeyModal({ onClose, currentApiKey }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useBuiltIn, setUseBuiltIn] = useState(!currentApiKey);

  const storeApiKey = useMutation(api.chat.storeApiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useBuiltIn && !apiKey.trim()) return;

    setIsLoading(true);
    try {
      if (useBuiltIn) {
        await storeApiKey({ apiKey: "builtin" });
        toast.success("Using built-in AI model");
      } else {
        await storeApiKey({ apiKey: apiKey.trim() });
        toast.success("API key saved successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">AI Configuration</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="aiOption"
                  checked={useBuiltIn}
                  onChange={() => setUseBuiltIn(true)}
                  className="text-blue-500"
                />
                <div>
                  <div className="font-medium text-slate-800">Use Built-in AI</div>
                  <div className="text-sm text-slate-600">Free tier with limited usage</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="aiOption"
                  checked={!useBuiltIn}
                  onChange={() => setUseBuiltIn(false)}
                  className="text-blue-500"
                />
                <div>
                  <div className="font-medium text-slate-800">Use Your OpenAI API Key</div>
                  <div className="text-sm text-slate-600">Full access with your own quota</div>
                </div>
              </label>
            </div>

            {!useBuiltIn && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!useBuiltIn}
                />
                <p className="text-xs text-slate-500">
                  Your API key is stored securely and only used for AI responses.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (!useBuiltIn && !apiKey.trim())}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
