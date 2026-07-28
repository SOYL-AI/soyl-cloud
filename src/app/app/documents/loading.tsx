import { PageSkeleton } from "@/components/workspace/Skeleton";

/** Shown while the document list waits on the API. */
export default function Loading() {
  return <PageSkeleton cards={2} />;
}
