//const Peer = window.Peer;

(async function main() {

  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  var flag_speech = 0;
  var language_flag = 0;
  
  messages.textContent += '=== Welcome chinameeting ===\n';

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  // eslint-disable-next-line require-atomic-updates
  const peer = new Peer({
    key:   "2793c15b-9584-4c26-b473-59b4e0e657ab",
    debug: 3,
    
  });

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    vr_function();

    const room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent

      if(data > 0 && data < 10){

        console.log(data);
        unityInstance.SendMessage ('ScriptObject','FromJS_motion', Number(data));
        
      }else if(data == "こんにちは"){
        
        sp_function(data);
        messages.textContent += `${src}: ${data}\n`;
  
      }else{

      messages.textContent += `${src}: ${data}\n`;

      }

    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      if(localText.value > 0 && localText.value < 10){

        console.log(localText.value);
        //unityInstance.SendMessage ('ScriptObject','FromJS_motion', msg );
        unityInstance.SendMessage ('ScriptObject','FromJS_motion', Number(localText.value));
  
      }else{

      messages.textContent += `${peer.id}: ${localText.value}\n`;

      };

      localText.value = '';
    }
    
    function sp_function(arg) {
      
      const uttr = new SpeechSynthesisUtterance()

      // 文章 (コンストラクタの引数以外に、この方法でも指定できます)
      uttr.text = arg;

      // 言語 (日本語:ja-JP, アメリカ英語:en-US, イギリス英語:en-GB, 中国語:zh-CN, 韓国語:ko-KR)
      uttr.lang = "ja-JP"

      // 速度 0.1-10 初期値:1 (倍速なら2, 半分の倍速なら0.5)
      uttr.rate = 1.0

      // 高さ 0-2 初期値:1
      uttr.pitch = 1.7

      // 音量 0-1 初期値:1
       uttr.volume = 0.75
 
      // 再生 (発言キュー発言に追加)
      speechSynthesis.speak(uttr);
    }

    function vr_function() {

      console.log("音声認識開始");

      window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
      var recognition = new webkitSpeechRecognition();

      recognition.interimResults = true;
      recognition.continuous = true;

      if(language_flag==0){

        recognition.lang = 'ja';

      }else if(language_flag==1){

        recognition.lang = "en-US";

      }

      recognition.onsoundstart = function() {
          //document.getElementById('status').innerHTML = "認識中";
          console.log("音声認識中");
      };
      recognition.onnomatch = function() {
          //document.getElementById('status').innerHTML = "もう一度試してください";
          console.log("もう一度試してください");
      };
      recognition.onerror = function() {
          //document.getElementById('status').innerHTML = "エラー";
          console.log("音声認識エラー");
          if(flag_speech == 0)
            vr_function();
      };
      recognition.onsoundend = function() {
          //document.getElementById('status').innerHTML = "停止中";
          console.log("音声認識停止中");
            vr_function();
      };

      recognition.onresult = function(event) {
          var results = event.results;
          for (var i = event.resultIndex; i < results.length; i++) {
              if (results[i].isFinal)
              {
                  //document.getElementById('result_text').innerHTML = results[i][0].transcript;
                  console.log("音声認識結果　"　+ results[i][0].transcript);
                  room.send(results[i][0].transcript);
                  messages.textContent += `${peer.id}: ${results[i][0].transcript}\n`;


                  if(results[i][0].transcript > 0 && results[i][0].transcript < 10){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', Number(results[i][0].transcript));
              
                  }else if(results[i][0].transcript=="ジャパン"　||　results[i][0].transcript=="japan" ||　results[i][0].transcript=="日本語"){

                    recognition.lang = 'ja';
                    console.log("日本語モード");
                    messages.textContent += `${"日本語モード"}: ${recognition.lang}\n`;
            
                  }else if(results[i][0].transcript=="イングリッシュ"　||　results[i][0].transcript=="English"　||　results[i][0].transcript=="英語"){
            
                    recognition.lang = "en-US";
                    console.log("英語モード");
                    messages.textContent += `${"英語モード"}: ${recognition.lang}\n`;
            
                  }else if(results[i][0].transcript=="スライディング"　||　results[i][0].transcript=="チーズ"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 2);
                    room.send(2);
            
                  }else if(results[i][0].transcript=="うん"　||　results[i][0].transcript=="レタス" ||　results[i][0].transcript=="頷く"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 7);
                    room.send(7);
            
                  }else if(results[i][0].transcript=="びっくり"　||　results[i][0].transcript=="トマト"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 1);
                    room.send(1);
            
                  }else if(results[i][0].transcript=="スマイル"　||　results[i][0].transcript=="キャベツ"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 3);
                    room.send(3);
            
                  }else if(results[i][0].transcript=="ウインク"　||　results[i][0].transcript=="メロン"　||　results[i][0].transcript=="Wink"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 4);
                    room.send(4);
            
                  }else if(results[i][0].transcript=="恥ずかしい"　||　results[i][0].transcript=="バナナ"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 5);
                    room.send(5);
            
                  }else if(results[i][0].transcript=="フルフル"　||　results[i][0].transcript=="りんご"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 8);
                    room.send(5);
            
                  }else if(results[i][0].transcript=="Full SCREEN"){

                    unityInstance.SetFullscreen(1)
            
                  }else if(results[i][0].transcript=="こんにちは"){

                    unityInstance.SendMessage ('ScriptObject','FromJS_motion', 1);
                    room.send(1);
                    sp_function(results[i][0].transcript);
                  }

                  vr_function();

              }
              else
              {
                  //document.getElementById('result_text').innerHTML = "[途中経過] " + results[i][0].transcript;
                  console.log("音声認識途中結果　"　+ results[i][0].transcript);
                  flag_speech = 1;
              }
          }
      }
      flag_speech = 0;
      //document.getElementById('status').innerHTML = "start";
      recognition.start();
  }


  });

  peer.on('error', console.error);
})();
