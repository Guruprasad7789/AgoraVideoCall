import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng"
import { timeStamp } from 'node:console';
declare var MediaRecorder: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit{
  rtc = {
    // For the local client.
    client: null,
    // For the local audio and video tracks.
    localAudioTrack: null,
    localVideoTrack: null,
  };
  @ViewChild("video") video: ElementRef | undefined;
  @ViewChild("video1") video1: ElementRef | undefined;
  ngVersion: string;
  streaming = false;
  error: any;
  private stream: MediaStream | null = null;
  private constraints = {
    audio: false,
    video: true,
  };


  options:{
    appId:string;
    channel:string;
    token:null | string;
  } = {
    // Pass your app ID here.
    appId: "2af7bf1d2bfe4c3c979f7ef08490a513",
    // Set the channel name.
    channel: "GSS",
    // Pass a token if your project enables the App Certificate.
    token: null,
  };
  title = 'AgoraScreen';
  constructor() {
    this.rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    // this.startBasicCall();
  }
  initVideo(e: any) {
    this.getMediaStream()
      .then((stream) => {
        this.stream = stream;
        this.streaming = true;
      })
      .catch((err) => {
        this.streaming = false;
        this.error = err.message + " (" + err.name + ":" + err.constraintName + ")";
      });
  }
  private getMediaStream(): Promise<MediaStream> {

    const video_constraints = { video: true };
    const _video = this.video ? this.video.nativeElement : null;
    return new Promise<MediaStream>((resolve, reject) => {
      // (get the stream)
      return navigator.mediaDevices.
        getUserMedia(video_constraints)
        .then(stream => {
          (<any>window).stream = stream; // make variable available to browser console
          _video.srcObject = stream;
          // _video.src = window.URL.createObjectURL(stream);
          _video.onloadedmetadata = function (e: any) { };
          _video.play();
          return resolve(stream);
        })
        .catch(err => reject(err));
    });
  }
  async startBasicCall(call:boolean) {
    const uid = await this.rtc.client.join(this.options.appId, this.options.channel, this.options.token, null);
    // Create an audio track from the audio sampled by a microphone.
    this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    // Create a video track from the video captured by a camera.
  if(call)
  {
    this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    await this.rtc.client.publish([this.rtc.localAudioTrack,this.rtc.localVideoTrack]);
  }
     else{ 
      // @ts-ignore
     navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always"
      },
      audio: false
    })
    .then((mediaStream) => {
      const videoMediaStreamTrack = mediaStream.getVideoTracks()[0];
      // Create a custom video track
      return AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: videoMediaStreamTrack,
      });
    })
    .then(async (localVideoTrack) => {
      // ...
      await this.rtc.client.publish([localVideoTrack]);

    });
  }
    console.log("publish success!");
    this.rtc.client.on("user-published", async (evt) => {
      console.log(evt);
      console.log("evt");
    });

    this.rtc.client.on("user-published", async (user, mediaType) => {
      // Subscribe to a remote user.
      await this.rtc.client.subscribe(user, mediaType);
      console.log("subscribe success");
      console.log(user);
      console.log(mediaType);
      // If the subscribed track is video.
      if (mediaType === "video") {
        // Get `RemoteVideoTrack` in the `user` object.
        const remoteVideoTrack = user.videoTrack;
        console.log(remoteVideoTrack);
        console.log(this.video2?.srcObject);
        // Dynamically create a container in the form of a DIV element for playing the remote video track.
        const playerContainer = document.createElement("div");
        //Specify the ID of the DIV container. You can use the `uid` of the remote user.
        playerContainer.id = user.uid.toString();
        playerContainer.style.width = "640px";
        playerContainer.style.height = "480px";
        document.body.append(playerContainer);

     //  Play the remote video track.
     //  Pass the DIV container and the SDK dynamically creates a player in the container for playing the remote video track.
        remoteVideoTrack.play(playerContainer);
  //       const m =await navigator.mediaDevices.getUserMedia({audio:user.audioTrack,video: remoteVideoTrack});
  //     const video_constraints = { video: true };
  // const _video = this.video1 ? this.video1.nativeElement : null;
  //       // Or just pass the ID of the DIV container.
  //       // remoteVideoTrack.play(playerContainer.id);
  //       _video.srcObject = m;
  //       // _video.src = window.URL.createObjectURL(stream);
  //       _video.onloadedmetadata = function (e: any) { };
  //       _video.play(); 

      }

      // If the subscribed track is audio.
      if (mediaType === "audio") {
        // Get `RemoteAudioTrack` in the `user` object.
        const remoteAudioTrack = user.audioTrack;
        // Play the audio track. No need to pass any DOM element.
        remoteAudioTrack.play();
      } 
    });
    this.rtc.client.on("user-unpublished", user => {
      // Get the dynamically created DIV container.
      const playerContainer = document.getElementById(user.uid);
      // Destroy the container.
      playerContainer.remove();
    });
  }

  async leaveCall() {
    // Destroy the local audio and video tracks.
    this.rtc.localAudioTrack.close();
    this.rtc.localVideoTrack.close();

    // Traverse all remote users.
    this.rtc.client.remoteUsers.forEach(user => {
      // Destroy the dynamically created DIV container.
      const playerContainer = document.getElementById(user.uid);
      playerContainer && playerContainer.remove();
    });

    // Leave the channel.
    await this.rtc.client.leave();
  }
  // Scren share section
   displayMediaOptions = {
    video: {
      cursor: "always"
    },
    audio: false
  };
  video2:any;
   ngAfterViewInit(): void {
  //  this.shareScreen();
  }
  shareScreen() {
    const start = document.getElementById("start");
    const stop = document.getElementById("stop");
    this.video2 = document.getElementById("video");
  //  start.addEventListener('click',e=>{
      this.startShare();
  //  });
    stop.addEventListener('click',e=>{
      this.stopShare();
    });
  }
  stopShare() {
 
   let tracks = this.video2.srcObject.getTracks();

   tracks.forEach(track => track.stop());
   
   this.video2.srcObject = null;
    

  }
  async startShare() {
    try {
      // @ts-ignore
      this.video2.srcObject =await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: false
      }).then((res)=>{
    //    this.startBasicCall(res);
        console.log(res);
      });
      this.startRecording(this.video2.srcObject).then (recordedChunks => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm;codecs=vp8" });
        const reader = new FileReader();
        reader.readAsDataURL(recordedBlob);
        reader.onload = e => {
            const link = document.createElement('a');
            link.href =<string>e.target.result;
            link.download = "RecordedVideo.webm";
            link.click();   
        } 
      });
    } catch (error) {
      console.log("Error"+ error);
    }
  }

  async startRecording(stream) {

  let options = {mimeType:'video/webm;codecs=vp8'};

  let recorder = new MediaRecorder(stream,options);

  
  let data = [];
 
  recorder.ondataavailable = event => data.push(event.data);
  recorder.start(1000);
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });
  await Promise.all([
    stopped
  ]);
  return data;

}
}
