import { useState, useEffect } from "react";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";


export const useGetCallById = (id: string | string[]) =>{

    const [ call, setCall ] = useState <Call>();
    const [ isCallLoading, setIsCallLoading ] = useState(true);

    const client = useStreamVideoClient();

    useEffect(() =>{
        if(!client) return;

        const getCall = async () =>{
            try {
                const { calls} = await client.queryCalls({filter_conditions: { id }})

                if(calls.length > 0 ) return setCall(calls[0])
            } catch (err) {
                console.log(err);
                setCall(undefined)
                
            }finally{
                setIsCallLoading(false)
            }
        }
        getCall()

    },[id, client])
    return  { call, isCallLoading}
}