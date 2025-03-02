"use client"
import { useUser } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk"
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import UserInfo from "./UserInfo";
import {  Loader2Icon, XIcon } from "lucide-react";
import { TIME_SLOTS } from "@/constants";
import { Calendar } from "@/components/ui/calendar";
import MeetingCard from "./MeetingCard";


const InterviewScheduleUI = () => {
    const client = useStreamVideoClient();
    const { user } = useUser();
    const [oprn, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const interviews = useQuery(api.interviews.getAllInterviews);
    const users = useQuery(api.user.getUsers);
    const createInterview = useMutation(api.interviews.createInterview);

    const candidates = users?.filter((u) =>u.role === "candidate") || [];
    const interviewers = users?.filter((u) =>u.role === "interviewer") || [];

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: new Date(),
        time: "09:00",
        candidateId: "",
        interviewersIds: user?.id ? [user.id] : [],
    })

    const scheduleMeeting = async () =>{
      if(!client || !user) return;
      if(!formData.candidateId || formData.interviewersIds.length === 0){
        toast.error("Please select both candidate and at laast one interviewer")
        return;
      }
      setIsCreating(true)
      
      try {
        const { title, description, date, time, candidateId, interviewersIds } = formData;
        const [hours, minutes] = time.split(":");
        const meetingDate = new Date(date);
        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0)

        const id = crypto.randomUUID();
        const call = client.call("default",id);

        await call.getOrCreate({
          data:{
            starts_at: meetingDate.toISOString(),
            custom: {
              description: title,
              additionalDetails: description,
            },
          },
        });
        
        await createInterview({
          title,
          description,
          startTime:meetingDate.getTime(),
          status: "upcoming",
          streamCallId: id,
          candidateId,
          interviewersIds,

        })

        setOpen(false);
        toast.success("Metting scheduled successfully!")

        setFormData({
          title: "",
          description: "",
          date: new Date(),
          time: "09:00",
          candidateId: "",
          interviewersIds: user?.id ? [user.id] : [],
        })
      } catch (err) {
        console.log(err);
        toast.error("Failed to schedule meeting. Please try again.")
        
      }finally{
        setIsCreating(false)
      }
    }

    const addInterviewer = (interviewerId: string) =>{
      if(!formData.interviewersIds.includes(interviewerId)){
        setFormData((prev) =>({
          ...prev,
          interviewersIds: [...prev.interviewersIds,interviewerId]
        }))
      }
    }

    const removeInterviewer = (interviewerId: string) =>{
      if(interviewerId === user?.id) return;
      setFormData((prev) =>({
        ...prev,
        interviewersIds:prev.interviewersIds.filter((id) => id !==interviewerId)
      }))
    }

    const selectedInterviewers = interviewers?.filter((i) => formData.interviewersIds.includes(i.clerkId))

    const availableInterviewers = interviewers?.filter((i) =>!formData.interviewersIds.includes(i.clerkId))
    

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        {/*header info*/}
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage interviews</p>
        </div>
        {/*dialog*/}
        <Dialog open={oprn} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
                Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] h-[calc(100vh-200px)] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                Schedule Interview
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* interview title*/}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="Interview title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title:e.target.value})}
                />
              </div>
              {/* interview des..*/}
              <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Interview description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
              </div>
              {/*candidate*/}
              <div className="space-y-2">
                <label className="text-sm font-medium">Candidate</label>
                <Select
                  value={formData.candidateId}
                  onValueChange={(candidateId) => setFormData({ ...formData, candidateId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.clerkId} value={candidate.clerkId}>
                        <UserInfo user={candidate} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              
              {/* interviewers */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Interviewers</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedInterviewers.map((interviewer) => (
                    <div
                      key={interviewer.clerkId}
                      className="inline-flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      <UserInfo user={interviewer} />
                      {interviewer.clerkId !== user?.id && (
                        <button
                          onClick={() => removeInterviewer(interviewer.clerkId)}
                          className="hover:text-destructive transition-colors"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {availableInterviewers.length > 0 && (
                  <Select onValueChange={addInterviewer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add interviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInterviewers.map((interviewer) => (
                        <SelectItem key={interviewer.clerkId} value={interviewer.clerkId}>
                          <UserInfo user={interviewer} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
                {/* date and time */}
                <div className="flex gap-4">
                {/* calendar */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                {/* time */}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Select
                    value={formData.time}
                    onValueChange={(time) => setFormData({ ...formData, time })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

               {/* action buttons*/}
               <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={scheduleMeeting} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule Interview"
                  )}
                </Button>
              </div>

            </div>
          </DialogContent>

        </Dialog>
      </div>

       {/* LOADING STATE & MEETING CARDS  */}
        {!interviews ? (
        <div className="flex justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : interviews.length > 0 ? (
        <div className="spacey-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
              <MeetingCard key={interview._id} interview={interview} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">No interviews scheduled</div>
      )}
    </div>
  )
}

export default InterviewScheduleUI