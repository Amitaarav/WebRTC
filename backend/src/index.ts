import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket : null | WebSocket= null
let receiverSocket : null | WebSocket = null
wss.on("connection",function connection(ws){
    console.log("New client connected");
    ws.on("error",console.error);

    ws.on("message",function message(data:any){
        const message = JSON.parse(data);

        if(message.type === "sender"){
            console.log("Sender identified");
            senderSocket = ws; // caching the message in the sender socket
        }else if(message.type === "receiver"){
            console.log("Receiver identified");
            receiverSocket = ws; // caching the message in the receiver socket
        }else if(message.type === "create-offer" && receiverSocket){
            // receiver socket will send the offer to the sender socket
            console.log("Forwarding offer to receiver.");
            receiverSocket?.send(JSON.stringify({type:"create-offer",sdp: message.sdp}));
        }else if(message.type === "create-answer" && senderSocket){
            // sender socket will send the answer to the receiver socket
            console.log("Forwarding answer to sender.");
            senderSocket?.send(JSON.stringify({type:"create-answer",sdp: message.sdp}));
        }else if(message.type === "ice-candidate"){
            receiverSocket?.send(JSON.stringify({type:"ice-candidate",candidate: message.candidate}));
        }else if(ws === receiverSocket &&  senderSocket){
            senderSocket?.send(JSON.stringify({type:"ice-candidate",candidate: message.candidate}));
        }
        
    })
    ws.on("close",()=>{
        console.log("Connection closed")
        if(ws === senderSocket){
            receiverSocket = null;
        }else if(ws === receiverSocket){
            senderSocket = null;
        }
    })

    ws.on("error",(error)=>{
        console.log("WebSocket Error",error)
    })
})