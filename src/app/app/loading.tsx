import { PageSkeleton } from "@/components/workspace/Skeleton";

/** Shown while the overview waits on the API. */
export default function Loading() {
  return <PageSkeleton cards={3} />;
}
