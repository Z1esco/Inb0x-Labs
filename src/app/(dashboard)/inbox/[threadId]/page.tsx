import { notFound } from "next/navigation";
import { ThreadView } from "@/components/thread-view";
import { getEnvironment } from "@/lib/env";
import { getDemoThread } from "@/server/services/demo-store";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const initialThread = getEnvironment().DEMO_MODE
    ? getDemoThread(threadId)
    : undefined;
  if (getEnvironment().DEMO_MODE && !initialThread) notFound();
  return initialThread ? (
    <ThreadView threadId={threadId} initialThread={initialThread} />
  ) : (
    <ThreadView threadId={threadId} />
  );
}
