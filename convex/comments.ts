import {query,mutation} from './_generated/server';
import {v} from 'convex/values';


export const addComment = mutation({
    args: {
        interviewId: v.id("interviews"),
        content: v.string(),
        rate: v.number()
    },
    handler: async (ctx, args) =>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity) throw new Error("Unauthorized")

        
        return await ctx.db.insert("comments",{
            interviewId: args.interviewId,
            content: args.content,
            rate: args.rate,
            interviewerId: identity.subject

        })
    }
});


export const getAllComments = query({
    args: {
        interviewId: v.id("interviews")
    },
    handler: async(ctx,args) =>{
        const comments = ctx.db
        .query("comments")
        .withIndex("by_interview_id",q =>(q.eq("interviewId",args.interviewId)))
        .collect();
        
        return comments

    }
})