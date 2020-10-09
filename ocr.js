//各種キー
var access_token = ""
var cloud_vision_api_key = "";
var google_drive_id = "";

// doPost()は、Messaging apiからwebhookでpostされた時に実行される関数
function doPost(e) {
  var events = JSON.parse(e.postData.contents).events;
  events.forEach(function(event) {
    if(event.type == "message") {
      reply(event);
    }
 });
}

// 送信された画像解析して結果を返す
function reply(e) {
  var replyToken = e.replyToken;
  if(e.message.type=="image"){
  } else {
    replyMessage(replyToken, "これは画像ではありません");
    return;
  }

    //LINEから画像のバイナリーデータ取得
    var imgBinary = getImgBinary(e);

    //GoogleVisionAPIで解析可能な形に変換
    var imgInfo = encodeImg(imgBinary);

    //画像ファイルをGoogleVisionAPIで解析
    var AnswerMessage = Analysis(imgInfo.encodedFile);

    //解析結果を返答する
    replyMessage(replyToken, AnswerMessage);

    //画像ファイルを削除
    removeFile(imgInfo);

}

//一時保存した画像ファイルを削除する処理
function removeFile(imgInfo) {
  var folder = imgInfo.folder;
  var file = imgInfo.file;
  folder.removeFile(file);
}

//LINEから画像データをバイナリー形式で取得
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

//画像データをCloudVisionで使えるようにDriveを利用して加工
function encodeImg(imgBinary){
  //GoogleDriveフォルダ
  var folder = DriveApp.getFolderById(google_drive_id);
  //ランダムな文字列を生成
  var fileName = Math.random().toString(36).slice(-8);
  //フォルダに画像を生成
  var imageFile = folder.createFile(imgBinary.getBlob().setName(fileName));

  //画像ファイルにリンクでアクセスの権限付与
  imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  //画像ファイルURL取得
  var imageURL = 'https://drive.google.com/uc?export=view&id=' + imageFile.getId();
  //base64形式にエンコード
  var fetchImg = Utilities.base64Encode(UrlFetchApp.fetch(imageURL).getContent());

  //ファイル削除情報をまとめる
  var imgInfo = {
    folder:folder,
    file:imageFile,
    encodedFile:fetchImg
  }
  return imgInfo;
}

//ユーザーにメッセージを返信します。
function replyMessage(replyToken, message) {

//LINEBOTからのメッセージ生成
    var botMessage = {
    "replyToken" : replyToken,
        "messages" : [
      {
        "type" : "text",
        "text" : message
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

//GoogleCloudVisionAPIで画像解析結果を取得
function Analysis(contents) {
  //Googlevisionapi key
  var apiKey = cloud_vision_api_key;
  var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;

  // 画像からテキストの検出
  var body = {
    "requests":[
      {
        "image": {
          "content": contents
        },
        "features":[
          {
            "type":"TEXT_DETECTION",
          }
        ]
      }
    ]
  };
  var head = {
    "method":"post",
    "contentType":"application/json",
    "payload":JSON.stringify(body),
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, head);
  var description = "";

//画像についての説明を検出する処理
    if (JSON.parse(response).responses[0].hasOwnProperty('textAnnotations')){

        var description = JSON.parse(response).responses[0].textAnnotations[0].description;

      }else{
          description = "画像には文字がありません。";
    }

    return description;
}
