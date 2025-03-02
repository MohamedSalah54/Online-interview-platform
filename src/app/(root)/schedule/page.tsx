"use client"

import { useRouter } from "next/navigation";
import { useUserROle } from "@/hooks/useUserRole";
import LoaderUI from "@/components/LoaderUI";
import InterviewScheduleUI from "@/components/InterviewScheduleUI";
const SchedulePage = () => {
  const router = useRouter();
  const { isInterviewer, isLoading } = useUserROle();




  if (isLoading) return <LoaderUI />;
  if (!isInterviewer) return router.push("/");
  return (
    <InterviewScheduleUI/>
  )
}

export default SchedulePage;