import { useEffect,useState } from "react"
export const Sender = () => {
    const [socket,setSocket] = useState<WebSocket | null>(null)
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080")
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "sender", message: "Hello from sender" }))
        }
        setSocket(socket)
    },[])
    
    async function startSendingVideo(){
        //create an offer
        if(!socket) return;
        const pc = new RTCPeerConnection() // create a peer connection
        pc.onnegotiationneeded = async () => {
            console.log("negotiation needed")
            const offer = await pc.createOffer(); // create an offer
            await pc.setLocalDescription(offer) // set the local description
            socket?.send(JSON.stringify({ type: "create-offer", message: offer })) // send the offer to the receiver // we can have offer == pc.localDescription
        // send ice candidate on receiver side
        }
        
        pc.onicecandidate = (event) => {
            console.log(event)
            if(event.candidate){
                socket?.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }))
            }
        }

        socket.onmessage = (event) => {
            console.log(event)
            const data = JSON.parse(event.data)
            if(data.type === "create-answer"){
                pc.setRemoteDescription(data.sdp)
            }else {
                if(data.candidate){
                    pc.addIceCandidate(data.candidate)
                }
            }
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); // get user media
        pc.addTrack(stream.getVideoTracks()[0]); // add video track to peer connection
        // pc.addTrack(stream.getAudioTracks()[0]); // add audio track to peer connection
        const video = document.createElement("video");
        document.body.appendChild(video);
        video.srcObject = stream;
        video.play();
        
    }
    return<div>
        <div className="bg-slate-700 p-4">
            <button className="bg-blue-700 flex text-center font-bold text-white p-2 rounded-md" onClick={startSendingVideo}>
                Send video
            </button>
        </div>
    </div>
    
}