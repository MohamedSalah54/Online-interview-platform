import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useUserROle = () =>{
     const {user} = useUser();

     const userData = useQuery(api.user.getUserByClerkId,{
        clerkId: user?.id || ""
     })

     const isLoading = userData === undefined;
     
     return {
        isLoading,
        isInterviewer: userData?.role === "interviewer",
        isCandidate: userData?.role === "candidate",
     }

}