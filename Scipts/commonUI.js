function loadUIImage(_response){
    kongApi.console_log("LoadUIImage --------");

    var target = _response.responseXML;
    var tempList = target.getElementsByTagName("Image");

    var tempLoadCount = 0;

    function wp_EndLoad() {
        ++tempLoadCount;

        if (tempLoadCount >= tempList.length) {
            kongApi.console_log("LoadUIImage End <<<<<<<< tempLoadCount = " + tempLoadCount);

            // 스프라이트 시트 이미지 정보 셋팅
            var sheetInfoList = target.getElementsByTagName("SpriteInfo");

            for (var i = 0; i < sheetInfoList.length; i++) {
                setSpriteimageInfo(
                    getUIImageListGame(sheetInfoList[i].attributes["Tag"].value),
                    sheetInfoList[i].attributes["clipWidth"].value,
                    sheetInfoList[i].attributes["clipHeight"].value,
                    sheetInfoList[i].attributes["wCount"].value,
                    sheetInfoList[i].attributes["tCount"].value
                );
            }
            //사운드 데이터 로드
            loadXML( "resCommon/SoundData.xml", loadCommonSound );
        }
        else
        {
            imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
        }
    }
    imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
}

function loadCommonSound(_response){
    kongApi.console_log("LoadCommonSound --------");

    var target = _response.responseXML;
    var tempList = target.getElementsByTagName("Snd");

    for( i = 0 ; i < tempList.length ; i++ )
    {
        sndListGame.push({
            Id: tempList[i].attributes["Id"].value,
            Url: tempList[i].attributes["Url"].value,
            Loops: Number(tempList[i].attributes["Loops"].value)
        });
    }

    if(window.JSInterface != null )
    {
        // 안드로이드 웹뷰 사운드 플레이시
        kongApi.console_log("Sound Play >>>>>>>> Android WebView");
    }
    else
    {
        // 사운드 메니저 사운드 플레이시
        // ( PC 크롬 브라우저 또는 CJ, DLIVE 클라우드 버전 사운드 플레이 )
        kongApi.console_log("Sound Play >>>>>>>> SoundManager");

        if (typeof soundManager != 'undefined')
        {
            soundManager.setup({

                url:'/soundmanager/swf/',

                onready: function()
                {
                    for (i = 0; i < sndListGame.length; i++)
                    {
                        soundManagerCreateSound( sndListGame[ i ] );
                    }
                }
            });
        }
    }
}

loadXML("resCommon/ImageData.xml", loadUIImage);
var imgListGame = [];
var sndListGame = [];

function getUIImageListGame(_tag)
{
    for(var i = 0; i < imgListGame.length; i++)
    {
        if(_tag == imgListGame[i].Tag)
        {
            return imgListGame[i]
        }
    }
}

function getPlayCommonSound( _id )
{
    var index = -1;

    for( var i = 0 ; i < sndListGame.length ; i++)
    {
        if( sndListGame[ i ].Id == _id)
        {
            index = i;
            break;
        }
    }

    if( index == -1)
    {
        kongApi.console_log("Error GetPlaySoundData :::::::: _id = " + _id);
    }

    return sndListGame[ index ];
}

//#region UI Object

function EndTextPopup(){
    this.backgroundImg;
    this.backgroundPosX = 400;
    this.backgroundPosY = 185;
    this.buttonImg;
    this.buttonTextImg;

    this.buttonBGPosX_01 = 418;
    this.buttonBGPosY_01 = 452;

    this.buttonBGPosX_02 = 642;
    this.buttonBGPosY_02 = 452;
        
    this.animIdx = 0;
    this.animLen = 16;
    this.frameIdx = 0;

    this.pastCursor = 1;

    this.render = function(cursorPosition){
        this.backgroundImg = getUIImageListGame("UI_Pop_EndText");

        this.buttonImg = getUIImageListGame("UI_Pop_Btn");
        this.buttonTextImg = getUIImageListGame("UI_Pop_Icon");

        if(this.pastCursor != cursorPosition){
            this.animOn();
            this.pastCursor = cursorPosition;
        }


        context_GamePopup.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY);

        if(cursorPosition == 0)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 0, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 3, this.buttonBGPosX_02, this.buttonBGPosY_02);     
        }
        else if(cursorPosition == 1)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 1, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 2, this.buttonBGPosX_02, this.buttonBGPosY_02);    
        }

        
        this.frameIdx++;
        if(this.frameIdx >= 2 && this.animIdx < this.animLen - 1){
            this.animIdx++;
        }
    }
        
    this.animOn = function(){
        this.animIdx = 0;
    }

}
/**
 * 사용법
 * 1. 객체 선언 (var endPopup = new EndScorePopup();)
 * 2. endPopup.init(점수 매개변수)(점수 init, 게임 종료 후 게임 스테이트 바꾸는 곳에서 사용)
 * 3. endPopup.render(커서 위치 매개변수)(화면 rendering하는 곳에서 사용)
 */
function EndScorePopup(){
    this.backgroundImg;
    this.backgroundPosX = 400;
    this.backgroundPosY = 185;

    this.buttonImg;
    this.buttonTextImg;

    this.buttonBGPosX_01 = 418;
    this.buttonBGPosY_01 = 452;

    this.buttonBGPosX_02 = 642;
    this.buttonBGPosY_02 = 452;

    this.numImg;
    this.numPosX = 739;
    this.numPosY = 313;

    this.score
    
    this.animIdx = 0;
    this.animLen = 16;
    this.frameIdx = 0;

    this.pastCursor = 1;

    this.render = function(cursorPosition){
        this.backgroundImg = getUIImageListGame("UI_Pop_EndScore");

        this.buttonImg = getUIImageListGame("UI_Pop_Btn");
        this.buttonTextImg = getUIImageListGame("UI_Pop_Icon");
        this.numImg = getUIImageListGame("UI_Pop_Num");
                
        if(this.pastCursor != cursorPosition){
            this.animOn();
            this.pastCursor = cursorPosition;
        }


        context_GamePopup.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY);

        if(this.score == null || typeof(this.score) != "string"){
            drawSpriteImage(context_GamePopup, this.numImg, 0, this.numPosX, this.numPosY);
        }else{
            this.renderCount = 0;
            for(var i = this.score.length - 1; i >= 0 ; i--){
                drawSpriteImage(context_GamePopup, this.numImg, this.score[i], this.numPosX - (this.numImg.clipWidth - 2) * this.renderCount, this.numPosY);
                this.renderCount++;
            }
        }


        if(cursorPosition == 0)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 0, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 3, this.buttonBGPosX_02, this.buttonBGPosY_02);     
        }
        else if(cursorPosition == 1)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 1, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 2, this.buttonBGPosX_02, this.buttonBGPosY_02);    
        }

        this.frameIdx++;
        if(this.frameIdx >= 2 && this.animIdx < this.animLen - 1){
            this.animIdx++;
        }
    }

    this.init = function(gameScore){
        this.score = gameScore.toString();
    }
    
    this.animOn = function(){
        this.animIdx = 0;
    }
}

function ExitPopup(){
    this.backgroundImg;
    this.backgroundPosX = 400;
    this.backgroundPosY = 185;

    this.buttonImg;
    this.buttonTextImg;

    this.buttonBGPosX_01 = 418;
    this.buttonBGPosY_01 = 452;

    this.buttonBGPosX_02 = 642;
    this.buttonBGPosY_02 = 452;

    this.animIdx = 0;
    this.animLen = 16;
    this.frameIdx = 0;

    this.pastCursor = 1;

    this.render = function(cursorPosition){
        this.backgroundImg = getUIImageListGame("UI_Pop_Exit");

        this.buttonImg = getUIImageListGame("UI_Pop_Btn");
        this.buttonTextImg = getUIImageListGame("UI_Pop_Icon");
        
        if(this.pastCursor != cursorPosition){
            this.animOn();
            this.pastCursor = cursorPosition;
        }


        context_GamePopup.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY); 

        if(cursorPosition == 0)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 0, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 3, this.buttonBGPosX_02, this.buttonBGPosY_02);     
        }
        else if(cursorPosition == 1)
        {
            drawSpriteImage(context_GamePopup, this.buttonImg, 16 + this.animIdx, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonImg, this.animIdx, this.buttonBGPosX_02, this.buttonBGPosY_02);    
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 1, this.buttonBGPosX_01, this.buttonBGPosY_01);
            drawSpriteImage(context_GamePopup, this.buttonTextImg, 2, this.buttonBGPosX_02, this.buttonBGPosY_02);    
        }

        this.frameIdx++;
        if(this.frameIdx >= 2 && this.animIdx < this.animLen - 1){
            this.animIdx++;
        }
    }

    this.animOn = function(){
        this.animIdx = 0;
    }
}

function HowToPlayPopup(gameName){
    this.backgroundImg;
    this.backgroundImgText = "";
    this.backgroundPosX = 0;
    this.backgroundPosY = 0;

    this.render = function(){
        if(gameName == null || gameName == "")
            return;

        //20230428 수정..
        this.backgroundImg = getUIImageListGame("UI_Pop_How_" + gameName);

        context_GamePopup.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY);
    }
}

function RankingPopup(){
    this.backgroundImg;
    this.backgroundPosX = 0;
    this.backgroundPosY = 0;

    this.isLoadRankingData = false;

    this.render = function(isLoadRankingData){
        this.backgroundImg = getUIImageListGame("UI_Pop_Ranking");

        this.isLoadRankingData = isLoadRankingData;
        
        context_GamePopup.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY);

        if(this.isLoadRankingData == false)
        {
            drawLoadingUI();
        }
        else if(this.isLoadRankingData == true)
        {
            clearBuffer(canvas_TopLoading, context_TopLoading);

            //플레이어 현재 랭킹 표시
            drawText(context_GamePopup, "black", 24, "" + myRankInfoArray[0].info_0, 438, 216, TEXT_ALIGN_CENTER);
            drawText(context_GamePopup, "#black", 24, "" + userInfo.gameID, 640, 216, TEXT_ALIGN_CENTER);
            drawText(context_GamePopup, "#black", 24, "" + myRankInfoArray[0].info_1, 882, 216, TEXT_ALIGN_RIGHT);

            //랭킹정보 표시 - 등수, 별명, 점수순
            for(i = 0; i < 10; ++i)
            {
                drawText(context_GamePopup, "black", 24, "" + (i + 1), 438, 248 + i * 32, TEXT_ALIGN_CENTER);
                drawText(context_GamePopup, "#8ca5b4", 22, "" + rankInfoArray[i].info_0, 640, 248 + i * 32, TEXT_ALIGN_CENTER);
                drawText(context_GamePopup, "#378237", 22, "" + rankInfoArray[i].info_1, 882, 248 + i * 32, TEXT_ALIGN_RIGHT);
            }
        }
    }

    this.init = function(){

    }
}

function TitleUI(gameName){
    this.backgroundImg;

    this.buttonPosX = [[727, 990, 1070, 1150],
                        [730, 807, 1070, 1150],
                        [730, 810, 887, 1150],
                        [730, 810, 890, 967]]
    this.buttonPosY = 599;

    this.isStartAnim = false;
    this.titleBtnAnimIdx = 0;
    this.titleBtnAni = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.isMove = true;
    this.activeBtnAnimIdx = 0;
    this.activeBtnAnim = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.pastCursor = 0;

    this.activeBtnBGImg;
    this.activeBtnImg;
    this.activeBtnHIdx = [0, 1, 2, 3];
    
    this.btnBGImg;
    this.btnImg;

    this.render = function(cursorPos){
        this.backgroundImg = getUIImageListGame("Title_" + gameName);

        this.activeBtnBGImg = getUIImageListGame("UI_Title_Btn_L");
        this.activeBtnImg = getUIImageListGame("UI_Title_Btn01");

        this.btnBGImg = getUIImageListGame("UI_Title_Btn_S");
        this.btnImg = getUIImageListGame("UI_Title_Icon");

        if(this.pastCursor != cursorPos){
            this.pastCursor = cursorPos;
            this.isMove = true;
            this.activeBtnAnimIdx = 0;
        }

        context_GameBG.drawImage(this.backgroundImg, 0, 0);


        for(var i = 0; i < this.activeBtnHIdx.length; i++){
            if(i == cursorPos){
                drawSpriteImage(context_GameBG, this.activeBtnBGImg, this.activeBtnAnim[this.activeBtnAnimIdx], this.buttonPosX[i][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.activeBtnImg, this.activeBtnHIdx[i], this.buttonPosX[i][i], this.buttonPosY);
            }else{
                drawSpriteImage(context_GameBG, this.btnBGImg, this.titleBtnAni[this.titleBtnAnimIdx], this.buttonPosX[cursorPos][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.btnImg, this.activeBtnHIdx[i], this.buttonPosX[cursorPos][i], this.buttonPosY);
            }
        }

        if(this.isStartAnim == false){
            this.titleBtnAnimIdx++;
            if(this.titleBtnAnimIdx >= this.titleBtnAni.length){
                this.titleBtnAnimIdx = this.titleBtnAni.length -1;
                this.isStartAnim = true;
            }

        }

        if(this.isMove == true){
            this.activeBtnAnimIdx++;
            if(this.activeBtnAnimIdx >= this.activeBtnAnim.length){
                this.activeBtnAnimIdx = this.activeBtnAnim.length - 1
                this.isMove = false;
            }
        }
    }
}

//Six Button Title
function TitleUI_2(gameName){
    this.backgroundImg;

    this.buttonPosX = [[567, 830, 910, 990, 1070, 1150],
                        [570, 647, 910, 990, 1070, 1150],
                        [570, 650, 727, 990, 1070, 1150],
                        [570, 650, 730, 807, 1070, 1150],
                        [570, 650, 730, 810, 887, 1150],
                        [570, 650, 730, 810, 890, 967]]
    this.buttonPosY = 599;

    this.isStartAnim = false;
    this.titleBtnAnimIdx = 0;
    this.titleBtnAni = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.isMove = true;
    this.activeBtnAnimIdx = 0;
    this.activeBtnAnim = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.pastCursor = 0;

    this.activeBtnBGImg;
    this.activeBtnImg;
    this.activeBtnHIdx = [0, 1, 2, 3, 4, 5];
    
    this.btnBGImg;
    this.btnImg;

    this.render = function(cursorPos){
        this.backgroundImg = getUIImageListGame("Title_" + gameName);

        this.activeBtnBGImg = getUIImageListGame("UI_Title_Btn_L");
        this.activeBtnImg = getUIImageListGame("UI_Title_Btn02");

        this.btnBGImg = getUIImageListGame("UI_Title_Btn_S");
        this.btnImg = getUIImageListGame("UI_Title_Icon02");


        
        if(this.pastCursor != cursorPos){
            this.pastCursor = cursorPos;
            this.isMove = true;
            this.activeBtnAnimIdx = 0;
        }

        context_GameBG.drawImage(this.backgroundImg, 0, 0);


        for(var i = 0; i < this.activeBtnHIdx.length; i++){
            if(i == cursorPos){
                drawSpriteImage(context_GameBG, this.activeBtnBGImg, this.activeBtnAnim[this.activeBtnAnimIdx], this.buttonPosX[i][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.activeBtnImg, this.activeBtnHIdx[i], this.buttonPosX[i][i], this.buttonPosY);
            }else{
                drawSpriteImage(context_GameBG, this.btnBGImg, this.titleBtnAni[this.titleBtnAnimIdx], this.buttonPosX[cursorPos][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.btnImg, this.activeBtnHIdx[i], this.buttonPosX[cursorPos][i], this.buttonPosY);
            }
        }

        if(this.isStartAnim == false){
            this.titleBtnAnimIdx++;
            if(this.titleBtnAnimIdx >= this.titleBtnAni.length){
                this.titleBtnAnimIdx = this.titleBtnAni.length -1;
                this.isStartAnim = true;
            }

        }

        if(this.isMove == true){
            this.activeBtnAnimIdx++;
            if(this.activeBtnAnimIdx >= this.activeBtnAnim.length){
                this.activeBtnAnimIdx = this.activeBtnAnim.length - 1
                this.isMove = false;
            }
        }

    }
}

//Five Button Title
function TitleUI_3(gameName){
    this.backgroundImg;

    this.buttonPosX = [[647, 910, 990, 1070, 1150],
                        [650, 727, 990, 1070, 1150],
                        [650, 730, 807, 1070, 1150],
                        [650, 730, 810, 887, 1150],
                        [650, 730, 810, 890, 967]]
    this.buttonPosY = 599;
    this.isStartAnim = false;
    this.titleBtnAnimIdx = 0;
    this.titleBtnAni = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.isMove = true;
    this.activeBtnAnimIdx = 0;
    this.activeBtnAnim = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    this.pastCursor = 0;

    this.activeBtnBGImg;
    this.activeBtnImg;
    this.activeBtnHIdx = [0, 1, 2, 3, 4];
    
    this.btnBGImg;
    this.btnImg;

    this.render = function(cursorPos){
        this.backgroundImg = getUIImageListGame("Title_" + gameName);

        this.activeBtnBGImg = getUIImageListGame("UI_Title_Btn_L");
        this.activeBtnImg = getUIImageListGame("UI_Title_Btn03");

        this.btnBGImg = getUIImageListGame("UI_Title_Btn_S");
        this.btnImg = getUIImageListGame("UI_Title_Icon03");


        if(this.pastCursor != cursorPos){
            this.pastCursor = cursorPos;
            this.isMove = true;
            this.activeBtnAnimIdx = 0;
        }

        context_GameBG.drawImage(this.backgroundImg, 0, 0);


        for(var i = 0; i < this.activeBtnHIdx.length; i++){
            if(i == cursorPos){
                drawSpriteImage(context_GameBG, this.activeBtnBGImg, this.activeBtnAnim[this.activeBtnAnimIdx], this.buttonPosX[i][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.activeBtnImg, this.activeBtnHIdx[i], this.buttonPosX[i][i], this.buttonPosY);
            }else{
                drawSpriteImage(context_GameBG, this.btnBGImg, this.titleBtnAni[this.titleBtnAnimIdx], this.buttonPosX[cursorPos][i], this.buttonPosY);
                drawSpriteImage(context_GameBG, this.btnImg, this.activeBtnHIdx[i], this.buttonPosX[cursorPos][i], this.buttonPosY);
            }
        }

        if(this.isStartAnim == false){
            this.titleBtnAnimIdx++;
            if(this.titleBtnAnimIdx >= this.titleBtnAni.length){
                this.titleBtnAnimIdx = this.titleBtnAni.length -1;
                this.isStartAnim = true;
            }
        }

        if(this.isMove == true){
            this.activeBtnAnimIdx++;
            if(this.activeBtnAnimIdx >= this.activeBtnAnim.length){
                this.activeBtnAnimIdx = this.activeBtnAnim.length - 1
                this.isMove = false;
            }
        }
    }
}

function ComplimentSticker(context, positionX, positionY, isRanking){
    this.img;

    if(isRanking == null)
        isRanking = false;
    this.imgText = isRanking ? "UI_Sticker_Ranking" : "UI_Sticker";
    
    this.posX = positionX;
    this.posY = positionY;

    this.render = function(){
        this.img = getUIImageListGame(this.imgText);

        context.drawImage(this.img, this.posX, this.posY);
    }
}

function StartPopup(gameName){
    this.backgroundImg;
    this.textImg;
    this.textImgText = "UI_Start_" + gameName;

    this.animIdx = 0;
    this.animLen = 14;
    this.frameIdx = 0;

    this.posX = 390;
    this.posY = 720;

    this.upSpeed = 30;
    this.alpha = 0;

    this.isAnim = false;
    this.isSound = false;
    this.isFinish = false;

    this.numberOfSound = {
        "bigWheel" : 2,
        "Cleaning" : 1,
        "drawing" : 1,
        "EatVege" : 2,
        "FruitMonster" : 1,
        "guidance" : 4,
        "hangleGame" : 3,
        "Jewels" : 2,        
    }
    this.curSound = this.numberOfSound[gameName];
    this.isRandomSound = this.curSound > 1 ? true : false;
    this.soundNum = this.isRandomSound ? randomRange(1, this.curSound) : 1;

    this.render = function(){
        this.backgroundImg = getUIImageListGame("UI_Pop_Jelly");
        this.textImg = getUIImageListGame(this.textImgText);

        if(this.posY >= 203){
            this.posY -= this.upSpeed;
            this.alpha += 0.06

            if(this.posY <= 310 && this.isSound == false){
                //Start Sound Play
                soundPlayEffect(getPlayCommonSound("gameStart_" + gameName + "_" + this.soundNum));
                this.isSound = true;
            }
        }

        if(this.posY <= 203 && this.isAnim == false){
            this.isAnim = true;
            this.isFinish = true;
        }

        context_GamePopup.save();
        context_GamePopup.globalAlpha = this.alpha
        drawSpriteImage(context_GamePopup, this.backgroundImg, this.animIdx, this.posX, this.posY);
        context_GamePopup.drawImage(this.textImg, this.posX, this.posY);
        context_GamePopup.restore();

        if(this.isAnim && this.animIdx < this.animLen - 1)
            this.frameIdx++;
        if(this.frameIdx >= 2){
            this.animIdx++;
            this.frameIdx = 0;
        }
    }
}

function StickerPopup(){
    this.backgroundImg;
    this.textImg;

    this.animIdx = 0;
    this.animLen = 14;
    this.frameIdx = 0;

    this.posX = 390;
    this.posY = 720;
    
    this.upSpeed = 20;
    this.alpha = 0;

    this.isAnim = false;

    this.isKey = false;

    this.render = function(){
        this.backgroundImg = getUIImageListGame("UI_Pop_Jelly");
        this.textImg = getUIImageListGame("UI_Pop_Sticker");

        if(this.posY >= 203){
            this.posY -= this.upSpeed;
            this.alpha += 0.06

            if(this.posY <= 310 && this.isSound == false){
                //Start Sound Play
                soundPlayEffect(getPlayCommonSound("sticker"));
                this.isSound = true;
            }
        }

        if(this.posY <= 203 && this.isAnim == false){
            this.isAnim = true;
            this.isKey = true;
        }

        drawSpriteImage(context_GamePopup, this.backgroundImg, this.animIdx, this.posX, this.posY);
        context_GamePopup.drawImage(this.textImg, this.posX, this.posY);

        if(this.isAnim && this.animIdx < this.animLen - 1)
            this.frameIdx++;

        if(this.frameIdx >= 2){
            this.animIdx++;
            this.frameIdx = 0;
        }
    }

    this.IsKey = function(){
        return this.isKey;
    }

    this.IsKeySet = function(){
        this.isKey = true;
    }
}

/**
 * Timer UI
 * @param gameName 게임 이름
 * @param maxTime 게임 플레이 시간
 */
function TimerUI_Common(gameName, maxTime){
    this.maxTime = calculateSecToFrame(maxTime);
    this.playTime = this.maxTime;

    this.backgroundImg;
    this.backgroundPosX = 453;
    this.backgroundPosY = 43;

    this.gageImg;
    this.gagePosX = 518;
    this.gagePosY = 57;

    this.render = function(){
        this.backgroundImg = getUIImageListGame("UI_TimerBG_" + gameName);
        this.gageImg = getUIImageListGame("UI_TimeGage");

        this.offset =  1 - this.playTime / this.maxTime;

        if(this.backgroundImg == undefined || this.gageImg == undefined){
            return;
        }

        context_GameMain.drawImage(this.backgroundImg, this.backgroundPosX, this.backgroundPosY);
        context_GameMain.drawImage(this.gageImg, 0, 0, this.gageImg.width - (this.gageImg.width * this.offset), this.gageImg.height, this.gagePosX, this.gagePosY, this.gageImg.width - (this.gageImg.width * this.offset), this.gageImg.height)
        //TODO
    }

    this.addPlayTime = function(time){
        this.playTime += calculateSecToFrame(time);
        if(this.playTime >= this.maxTime)
            this.playTime = this.maxTime;
    }

    this.minusPlayTime = function(time){
        this.playTime -= calculateSecToFrame(time);

        if(this.playTime <= 0){
            this.playTime = 0;
        }
    }
}

function ScoreUI_Common(gameName){
    this.totalScore = 0;
    this.score = 0;
    
    this.backgroundImg;
    this.posX = 1008;
    this.posY = 43;

    this.textPosX = 1185;
    this.textPosY = 57;

    this.stringScore;

    this.render = function(){
        this.backgroundImg = getUIImageListGame("UI_ScoreBG_" + gameName);

        if(this.backgroundImg == undefined){
            return;
        }
        context_GameMain.drawImage(this.backgroundImg, this.posX, this.posY);

        this.renderTotalScore();
    }

    this.addScore = function(score){
        this.totalScore += score;
    }

    this.minusScore = function(score){
        if(this.totalScore <= 0){
            this.totalScore = 0;
            return;
        }
        this.totalScore -= score;
    }

    this.renderTotalScore = function(){
        this.numImg = getUIImageListGame("UI_Num");
        this.stringScore = this.totalScore.toString();
        this.renderCount = 0;

        if(this.numImg == undefined){
            return;
        }

        for(var i = this.stringScore.length - 1; i >= 0; i--){
            drawSpriteImage(context_GameMain, this.numImg, this.stringScore[i], this.textPosX - (this.numImg.clipWidth - 3) * this.renderCount, this.textPosY);
            this.renderCount++;
        }
    }
}

function randomRange(n1, n2)
{
    return Math.floor(Math.random() * (n2 - n1 + 1)) + n1;
}

//#endregion
