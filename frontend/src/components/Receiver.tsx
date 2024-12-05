
// import { useEffect} from "react";
// export const Receiver = () => {
    
//     useEffect(() => {
//         const socket = new WebSocket("ws://localhost:8080");
//         let pc2 : RTCPeerConnection | null = null;
//         socket.onopen = () => {
//             socket.send(JSON.stringify({ type: "receiver", message: "Hello from receiver" }));
//         }
//         socket.onmessage = async (event) => {
//             const message = JSON.parse(event.data);

//             if(message.type === "create-offer"){
//                 //create an answer
//                 pc2 = new RTCPeerConnection();
//                 pc2.setRemoteDescription(message.sdp);


//                 pc2.onicecandidate = (event) => {
//                     console.log(event)
//                     if(event.candidate){
//                         socket?.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }))
//                     }
//                 }
//                 const video = document.createElement("video");
//                 document.body.appendChild(video);
//                 pc2.ontrack = (eventTrack) => {
//                     console.log(eventTrack)
                    
//                     video.srcObject = eventTrack.streams[0];
//                     video.play();
                    
//                 }
//                 const answer = await pc2.createAnswer();
//                 await pc2.setLocalDescription(answer);
//                 socket.send(JSON.stringify({ type: "create-answer", sdp: pc2.localDescription }));
//             } if (pc2) {
//                 await pc2.addIceCandidate(message.candidate);
//             } else {
//                 console.error("PeerConnection is not initialized.");
//             }
//         }
//     },[])

    
    
//     return <div>
//         Hello from Receiver
        
//     </div>
// }


// import { useEffect } from "react";

// export const Receiver = () => {
//     useEffect(() => {
//         const socket = new WebSocket("ws://localhost:8080");
//         let pc2: RTCPeerConnection | null = null;

//         socket.onopen = () => {
//             console.log("WebSocket connection opened.");
//             socket.send(JSON.stringify({ type: "receiver", message: "Hello from receiver" }));
//         };

//         socket.onmessage = async (event) => {
//             const message = JSON.parse(event.data);

//             if (message.type === "create-offer") {
//                 console.log("Received SDP offer:", message.sdp);
//                 pc2 = new RTCPeerConnection();
                
//                 try {
//                     await pc2.setRemoteDescription(new RTCSessionDescription(message.sdp));
//                 } catch (err) {
//                     console.error("Failed to set remote description:", err);
//                     return;
//                 }

//                 pc2.onicecandidate = (event) => {
//                     if (event.candidate) {
//                         socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
//                     }
//                 };

//                 const video = document.createElement("video");
//                 document.body.appendChild(video);
//                 pc2.ontrack = (eventTrack) => {
//                     video.srcObject = eventTrack.streams[0];
//                     video.play();
//                 };

//                 try {
//                     const answer = await pc2.createAnswer();
//                     await pc2.setLocalDescription(answer);
//                     socket.send(JSON.stringify({ type: "create-answer", sdp: pc2.localDescription }));
//                 } catch (err) {
//                     console.error("Failed to create and send SDP answer:", err);
//                 }
//             } else if (message.type === "ice-candidate") {
//                 if (pc2) {
//                     try {
//                         await pc2.addIceCandidate(message.candidate);
//                     } catch (err) {
//                         console.error("Failed to add ICE candidate:", err);
//                     }
//                 } else {
//                     console.error("PeerConnection is not initialized. ICE candidate discarded.");
//                 }
//             }
//         };

//         return () => {
//             socket.close();
//             if (pc2) {
//                 pc2.close();
//                 pc2 = null;
//             }
//         };
//     }, []);

//     return <div>Hello from Receiver</div>;
// };

import { useEffect } from "react";

export const Receiver = () => {
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        let pc2 : RTCPeerConnection | null = null;
        let candidateQueue : RTCIceCandidateInit[] = [];

        socket.onopen = () => {
            console.log("WebSocket connected as receiver.");
            socket.send(JSON.stringify({ type: "receiver", message: "Hello from receiver" }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "create-offer") {
                console.log("Received offer. Creating PeerConnection.");
                pc2 = new RTCPeerConnection({iceServers: [{ urls: "stun:stun.l.google.com:19302" }]});

                pc2.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("Sending ICE candidate.")
                        socket.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
                    }
                };

                const video = document.createElement("video");
                document.body.appendChild(video);

                pc2.ontrack = (eventTrack) => {
                    console.log("Receiving media track.");
                    const video = document.createElement("video");
                    document.body.appendChild(video);
                    video.srcObject = eventTrack.streams[0];
                    video.play();
                };

                try {
                    await pc2.setRemoteDescription(message.sdp);
                    console.log("Remote description set successfully.");
                } catch (err) {
                    console.error("Failed to set remote description:", err);
                    return;
                }

                if (candidateQueue.length > 0) {
                    console.log("Adding queued ICE candidates...");
                    for (const candidate of candidateQueue) {
                        try {
                            await pc2.addIceCandidate(candidate);
                            console.log("Queued ICE candidate added successfully.");
                        } catch (err) {
                            console.error("Failed to add queued ICE candidate:", err);
                        }
                    }
                    candidateQueue = [];
                }

                try {
                    if (!message.sdp || !message.sdp.type || !message.sdp.sdp) {
                        throw new Error("Invalid SDP received.");
                    }
                    await pc2.setRemoteDescription(message.sdp);
                    console.log("Remote description set successfully.");

                    const answer = await pc2.createAnswer();
                    await pc2.setLocalDescription(answer);
                    console.log("Answer created and local description set.");

                    socket.send(JSON.stringify({ type: "create-answer", sdp: pc2.localDescription }));
                } catch (err) {
                    console.error("Failed to set remote description or create answer:", err);
                }

                // Add queued candidates after remote description is set
                for (const candidate of candidateQueue) {
                    try {
                        await pc2.addIceCandidate(candidate);
                        console.log("Queued ICE candidate added.");
                    } catch (err) {
                        console.error("Failed to add queued ICE candidate:", err);
                    }
                }
                candidateQueue = [];
            } else if (message.type === "ice-candidate") {
                if (pc2?.remoteDescription) {
                    try {
                        await pc2.addIceCandidate(message.candidate);
                        console.log("ICE candidate added successfully.");
                    } catch (err) {
                        console.error("Failed to add ICE candidate:", err);
                    }
                } else {
                    console.log("Queueing ICE candidate until remote description is set.");
                    candidateQueue.push(message.candidate);
                }
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
            console.log("WebSocket closed.");
        };
    }, []);

    return <div>Hello from Receiver</div>;
};