import { getServiceClient } from "./supabase";

// The OpenAI API key lives only as a Supabase Edge Function secret, never in
// this app's own environment — this just invokes that function over Supabase's
// authenticated functions gateway.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const supabase = getServiceClient();
  const { data, error } = await supabase.functions.invoke<{ embeddings: number[][]; error?: string }>(
    "embed",
    { body: { texts } }
  );

  if (error) throw new Error(`embed function invocation failed: ${error.message}`);
  if (!data) throw new Error("embed function returned no data");
  if (data.error) throw new Error(`embed function error: ${data.error}`);

  return data.embeddings;
}
