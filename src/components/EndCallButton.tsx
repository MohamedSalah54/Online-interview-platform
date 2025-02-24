import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk"
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

const EndCallButton = () => {
    const call = useCall();
    const router = useRouter()

    const { useLocalParticipant} = useCallStateHooks();
    const localParticipants = useLocalParticipant();

    const updateInterviewState = useMutation(api.interviews.updateInterviewStatus);
    const interview = useQuery(api.interviews.getInterviewByStreamCallId, {
        streamCallId: call?.id || "",
    })

    if(!call || !interview) return null;

    const isMeetingOwner = localParticipants?.userId === call.state.createdBy?.id

    if(!isMeetingOwner) return null;

    const endCall = async () =>{
        try {
            await call.endCall();
            await updateInterviewState({
                id: interview._id,
                status: "completed"
            })
            router.push("/")
            toast.success("Meeting Ended For Everyone")
        } catch (err) {
            console.log(err);
            toast.error("Failed to end meeting")
        }
    }

    
  return (
    <Button variant={"destructive"} onClick={endCall}>
        End Meeting
    </Button>
  )
}

export default EndCallButton