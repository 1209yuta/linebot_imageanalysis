//各種キー
var access_token = "760meXkV+yLf0j9VNy8y65gsiy3ExubkaFx64TxC3fXUFUcNpbNAlKwb5yUs4kSiQo6NFP9qRguZLPjtooPB1oLxF4zGrVE0EZcctwlbgDP6JnA9u3VQLxgjOTwV+cHkrW+k3nqn3zyYfCvNrMihPgdB04t89/1O/w1cDnyilFU="
var google_drive_id = "1IY8_toc4k0f-mqcVQYH7oxxNWiKBMHPF";
var cloud_vision_api_key = "AIzaSyC-0HNWVb5uT9U2nmz3bE9O0b65Ok0Dkzs";

// doPost()は、Messaging apiからwebhookでpostされた時に実行される関数
function doPost(e) {
  var events = JSON.parse(e.postData.contents).events;
  events.forEach(function(event) {
    if(event.type == "message") {
      reply(event);
    }
 });
}

// 送信された画像を保存して結果を返す
function reply(e) {
  var replyToken = e.replyToken;
  if(e.message.type=="image"){
  } else {
    replyMessage(replyToken, "これは画像ではありません");
    return;
  }

    //LINEから画像取得　getImgBinary（）
    var imgBinary = getImgBinary(e);

    //Googleドライブに保存　encodeImg()
    var imgInfo = encodeImg(imgBinary);

    //「保存しました」とLINEにメッセージを送る
    replyMessage(replyToken, imgInfo);

}


//LINEから画像取得　getImgBinary（）
function getImgBinary(e) {
  var requestUrl = 'https://api-data.line.me/v2/bot/message/' + e.message.id + '/content';
  var img_get_head = {
    "method":"get",
    "headers": {
      "Authorization" : "Bearer " + access_token
    }
  }
  var imgBinary = UrlFetchApp.fetch(requestUrl,img_get_head);
  return imgBinary;
}

//Googleドライブに保存　encodeImg()
function encodeImg(imgBinary){
  //GoogleDriveフォルダID
  var folder = DriveApp.getFolderById(google_drive_id);
  //ランダムな文字列を生成して、画像のファイル名とする
  var fileName = Math.random().toString(36).slice(-8);
  //Googleドライブのフォルダに画像を生成
  var imageFile = folder.createFile(imgBinary.getBlob().setName(fileName));
  //「保存しました」としたメッセージを変数に代入
  var imgInfo = "保存しました";

  return imgInfo;
}

  //「保存しました」とLINEにメッセージを送る
function replyMessage(replyToken, imgInfo) {

   var botMessage = {
    "replyToken" : replyToken,
        "messages" : [
      {
        "type" : "text",
        "text" : imgInfo
      }
    ]
   };

//リクエストヘッダー
  var request_head = {
    "method" : "post",
    "headers" : {
      "Content-Type" : "application/json",
      "Authorization" : "Bearer " + access_token
    },
    "payload" : JSON.stringify(botMessage)
  };
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", request_head);
}
