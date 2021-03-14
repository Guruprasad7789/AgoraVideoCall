import { Component } from '@angular/core';
import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
   rtc = {
    // For the local client.
    client: null,
    // For the local audio and video tracks.
    localAudioTrack: null,
    localVideoTrack: null,
  };

   options = {
    // Pass your app ID here.
    appId: "2af7bf1d2bfe4c3c979f7ef08490a513",
    // Set the channel name.
    channel: "GSS",
    // Pass a token if your project enables the App Certificate.
    token: null,
  };
  title = 'AgoraScreen';
  constructor(){
 this.rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
// this.startBasicCall();
  }
  async startBasicCall() {
    const uid = await this.rtc.client.join(this.options.appId, this.options.channel, this.options.token, null);
// Create an audio track from the audio sampled by a microphone.
this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
// Create a video track from the video captured by a camera.
this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
// Publish the local audio and video tracks to the channel.
await this.rtc.client.publish([this.rtc.localAudioTrack, this.rtc.localVideoTrack]);

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
    // Dynamically create a container in the form of a DIV element for playing the remote video track.
    const playerContainer = document.createElement("div");
    // Specify the ID of the DIV container. You can use the `uid` of the remote user.
    playerContainer.id = user.uid.toString();
    playerContainer.style.width = "640px";
    playerContainer.style.height = "480px";
    document.body.append(playerContainer);

    // Play the remote video track.
    // Pass the DIV container and the SDK dynamically creates a player in the container for playing the remote video track.
    remoteVideoTrack.play(playerContainer);

    // Or just pass the ID of the DIV container.
    // remoteVideoTrack.play(playerContainer.id);
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

}
