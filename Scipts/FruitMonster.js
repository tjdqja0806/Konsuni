kongApi.setTag("FruitMonster");//태그 설정

function initGame(){"use strict";

//#region Get & Set Info(Mainroop, GameData, ImageData)
    var GAME_STATE = {
        INIT : 0,
        LOAD_DATA : 1,
        TITLE : 2,
        INTRO : 3,
        INGAME : 5,
        GAME_END : 6,
        LOAD_JS : 9
    }

    var nowState = GAME_STATE.INIT;


    //키 이벤트 설정
    addKeyEventListener(gameKeyEvent);
    addKeyUpEventListener(gameKeyUpEvent);
    //메인루프 설정
    setMainLoop( runApp );

    //이미지 데이터와 스프라이트 애니메이션 데이터를 불러와 이닛한다
    function initGameData()
    {
        var i = 0;
        var tempLoadCount = 0;

        // 사운드 --------------------------------------
        function loadDataSound( _response )
        {
            kongApi.console_log("LoadDataSound --------");

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
            //리소스로드가 완료되면 타이틀스테이트로 변경한다
            setGameState(GAME_STATE.TITLE);
        }

        // 이미지 --------------------------------------
        function loadDataImage(_response)
        {
            kongApi.console_log("LoadDataImage --------");

            var target = _response.responseXML;
            var tempList = target.getElementsByTagName("Image");

            tempLoadCount = 0;

            function wp_EndLoad() {
                ++tempLoadCount;

                if (tempLoadCount >= tempList.length) {
                    kongApi.console_log("LoadDataImage End <<<<<<<< tempLoadCount = " + tempLoadCount);

                    // 스프라이트 시트 이미지 정보 셋팅
                    var sheetInfoList = target.getElementsByTagName("SpriteInfo");

                    for (i = 0; i < sheetInfoList.length; i++) {
                        setSpriteimageInfo(
                            getImageListGame(sheetInfoList[i].attributes["Tag"].value),
                            sheetInfoList[i].attributes["clipWidth"].value,
                            sheetInfoList[i].attributes["clipHeight"].value,
                            sheetInfoList[i].attributes["wCount"].value,
                            sheetInfoList[i].attributes["tCount"].value
                        );
                    }

                    loadXML( "FruitMonster/data/SoundData.xml", loadDataSound );
                }
                else
                {
                    imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
                }
            }
            imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
        }

        function loadDataScore(_response){
            kongApi.console_log("LoadScoreData --------");

            var target = _response.responseXML;
            var tempList = target.getElementsByTagName("ScoreData");

            tempLoadCount = 0;

            for(var i = 0; i < tempList.length; i++){
                scoreData.push({
                    Type : tempList[i].attributes["Type"].value,
                    Index : tempList[i].attributes["Index"].value,
                })
            }

            loadXML("FruitMonster/data/ImageData.xml", loadDataImage);
        }

        loadXML("FruitMonster/data/ScoreData.xml", loadDataScore);
        // loadXML("FruitMonster/data/ImageData.xml", loadDataImage);
    }

    //스테이트 변경함수
    function setGameState(_state)
    {
        soundStopAll();
        nowState = _state;
        switch (_state)
        {
            case GAME_STATE.INIT:
                break;
            case GAME_STATE.LOAD_DATA:
                break;
            case GAME_STATE.TITLE:
                soundPlayBGM(getPlaySoundData("bgm_title"));
                clearBuffer(canvas_TopLoading, context_TopLoading);
                console.log("Title");
                break;
            case GAME_STATE.INTRO:
                playIntroSound("a");
                break;
            case GAME_STATE.INGAME:
                soundPlayBGM(getPlaySoundData("bgm_game"));
                inGameReset();
                break;
            case GAME_STATE.GAME_END:
                endSoundPlay();
                break;
        }
    }

    //현재 게임을 실행하는 함수
    function runApp()
    {
        if(isGlobalNetworkError)
        {
            // 네트워크 에러 팝업 그리기
            drawPopupNetWorkError();
        }
        else if(isShowGameEndPopup)
        {
            // 게임 종료 팝업
            drawGameEndPopup();
        }
        else
        {
            switch (nowState)
            {
                case GAME_STATE.INIT:
                    clearBuffer(canvas_GameBG, context_GameBG);
                    clearBuffer(canvas_TopLoading, context_TopLoading);

                    drawLoadingUI();

                    initGameData();
                    createBuildInfoGame();
                    setGameState( GAME_STATE.LOAD_DATA );
                    break;

                case GAME_STATE.LOAD_DATA:
                    clearBuffer(canvas_GameBG, context_GameBG);
                    clearBuffer(canvas_TopLoading, context_TopLoading);
                    drawLoadingUI();
                    break;

                case GAME_STATE.TITLE:
                    drawTitle();
                    break;
                case GAME_STATE.INTRO:
                    drawIntro();
                    break;
                case GAME_STATE.INGAME:
                    updateInGame();
                    drawInGame();
                    break;
                case GAME_STATE.GAME_END:
                    drawGameEnd();
                    break;
            }
        }
    }

    //게임 전체에서 키이벤트 처리
    function gameKeyEvent(event)
    {
        //kongApi.console_log("InputEvent keycode=" + event.keyCode);
        var keyCode = event.keyCode;

        if( isGlobalNetworkError )
        {
            // 네트워크 에러 팝업 키 처리
            if( keyCode == VK_ENTER || keyCode == VK_BACK )
            {
                kongAppExit();
            }
        }
        else if( isShowGameEndPopup )
        {
            // 게임종료 팝업
            keyGameEndPopup( keyCode );
        }
        else
        {
            if( keyCode == VK_ESCAPE && isShowGameEndPopup == false &&
                ( nowState == GAME_STATE.TITLE || nowState == GAME_STATE.INGAME ) )
            {
                if( nowState == GAME_STATE.TITLE && rankingBtnClick == true && isLoadRankingData == false )
                {
                    // 타이틀 && 랭킹확인 버튼 누름 && 서버로 부터 랭킹 응답갑을 아직 받지 못함
                    // ( 랭킹 데이터 수신중 로딩 화면이 보이고 있는상태 )
                }
                else
                {
                    // 게임 종료 팝업 보이기
                    showGameEndPopup( null, null );
                }
            }
            else
            {
                switch (nowState)
                {
                    case GAME_STATE.TITLE:
                        keyTitle(keyCode);
                        break;
                    case GAME_STATE.INTRO:
                        keyIntro(keyCode);
                        break;
                    case GAME_STATE.INGAME:
                        keyInGame(keyCode);
                        break;
                    case GAME_STATE.GAME_END:
                        keyGameEnd(keyCode);
                        break;
                }
            }
        }
    }

    function gameKeyUpEvent(event){
        var keyCode = event.keyCode;
        if(!isGlobalNetworkError && !isShowGameEndPopup){
            if( !(keyCode == VK_ESCAPE && isShowGameEndPopup == false &&
                ( nowState == GAME_STATE.TITLE || nowState == GAME_STATE.INGAME )))
            {
                switch (nowState)
                {
                    case GAME_STATE.INGAME:
                        keyUpInGame(keyCode);
                        break;
                }
            }
        }
    }

    //--------------------------------------
    //이미지 리스트
    //--------------------------------------
    var imgListGame = [];

    function getImageListGame(_tag)
    {
        for(var i = 0; i < imgListGame.length; i++)
        {
            if(_tag == imgListGame[i].Tag)
            {
                return imgListGame[i]
            }
        }
    }

    //--------------------------------------
    //사운드 리스트
    //--------------------------------------
    var sndListGame = [];

    function getPlaySoundData( _id )
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
            // _id 사운드 데이터가 존재하지 않음 !!!
            kongApi.console_log("Error GetPlaySoundData :::::::: _id = " + _id);
        }
        return sndListGame[ index ];
    }

    //게임 빌드 정보 생성
    var buildInfoGame = [];

    function createBuildInfoGame()
    {
        buildInfoGame[ 0 ] = "Build : 2022-5-18 15:37";
        buildInfoGame[ 1 ] = "STBID = " + userInfo.STBID;
        buildInfoGame[ 2 ] = "SUBSID = " + userInfo.SUBSID;
        buildInfoGame[ 3 ] = "MACADDRESS = " + userInfo.MACADDRESS;
        buildInfoGame[ 4 ] = "gameID = " + userInfo.gameID;
    }
    //게임 빌드 정보를 그려준다
    function drawBuildGame( _context )
    {
        // 검정 배경
        drawImageBlackBg( _context, 0.7, 1280, 260 );

        for( var i = 0 ; i < buildInfoGame.length ; i++ )
        {
            drawText(_context, "#ffffff", 22, buildInfoGame[ i ], 50, 50 + ( i * 30 ), TEXT_ALIGN_LEFT );
        }
    }

    var scoreData = [];
    function getScoreData(_tag){
        for(var i = 0; i < scoreData.length; i++){
            if(scoreData[i].Type == _tag){
                return scoreData[i].Index;
            }
        }
    }
//#endregion

//#region Title
    //-------------------------------------- 타이틀 스테이트 --------------------------------------//
    var rankingBtnClick = false;    //순위팝업
    var isLoadRankingData = false;  //랭킹 데이터 로드 완료
    var howBtnClick = false;        //게임 방법 팝업
    var menuCurPosition = 1;    //현재 메뉴 위치
    var firstConnect = true;
    var isIntro = false;//Intro 실행 여부


    var titleUI = new TitleUI("FruitMonster");
    var howPopup = new HowToPlayPopup("FruitMonster");
    var rankingPopup = new RankingPopup("FruitMonster");

    //타이틀 씬에서 그림을 그려줄 함수
    function drawTitle()
    {
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        titleUI.render(menuCurPosition);

        if(rankingBtnClick){
            rankingPopup.render(isLoadRankingData);
        }else if(howBtnClick){
            howPopup.render();
        }
    }

    //타이틀 씬에서 사용될 키 입력 함수
    function keyTitle(keyCode)
    {
        if(rankingBtnClick){
            switch(keyCode){
                case VK_ENTER:
                case VK_BACK:
                    rankingBtnClick = false;            
                    break;
            }
        }else if(howBtnClick){
            switch(keyCode){
                case VK_ENTER:
                case VK_BACK:
                    howBtnClick = false;        
                    break;
            }
        }else {
            switch (keyCode)
            {
                case VK_LEFT:
                    menuCurPosition--;
    
                    if (menuCurPosition < 0)
                    {
                        menuCurPosition = 3;
                    }
    
                    switch (menuCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("bt_how"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("bt_start"));
                            break;
                        case 2:
                            soundPlayEffect(getPlayCommonSound("bt_ranking"));
                            break;
                        case 3:
                            soundPlayEffect(getPlayCommonSound("bt_exit"));
                            break;
                    }
                    break;
                case VK_RIGHT:
                    menuCurPosition++;
    
                    if (menuCurPosition > 3)
                    {
                        menuCurPosition = 0;
                    }
    
                    switch (menuCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("bt_how"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("bt_start"));
                            break;
                        case 2:
                            soundPlayEffect(getPlayCommonSound("bt_ranking"));
                            break;
                        case 3:
                            soundPlayEffect(getPlayCommonSound("bt_exit"));
                            break;
                    }
                    break;
                case VK_ENTER:
                    switch (menuCurPosition)
                    {
                        case 0:
                            howBtnClick = true;
                            break;
                        case 1:
                            if(userInfo.isCashUser == false) sendDataGravity(null, GAPI_INSERT_GAMEYN, "game_hangle_e", null);

                            if(isIntro == false) setGameState(GAME_STATE.INTRO)
                            else setGameState(GAME_STATE.INGAME);
                            break;
                        case 2:
                            rankingBtnClick = true;
                            isLoadRankingData = true;
                            sendDataGravity(checkRankingResult, GAPI_CHECK_RANKING20, "game_hangle_e", null);
                            break;
    
                        case 3:
                            //포탈로 돌아간다..
                            gotoPortal();
                            break;
                    }
                    break;
                case VK_BACK:
                    //타이틀에서 이전 버튼을 누르면 포탈로 되돌아 간다.
                    gotoPortal();
                    break;
            }
        }
    }
//#endregion

//#region Intro
    var introFrameIndex = 0;
    var introMaxFrame;
    var introSoundName;

    var isSoundFrameCheck = false;
    var introSoundCheck = {
        "npc" : false,
        "intro_c" : false,
    }

    var introSoundFrameData = {
        "intro_a1" : 120,
        "intro_a2" : 156,
        "intro_a3" : 108,
        "intro_b1" : 18,
        "intro_b2" : 12,
        "intro_c" : 95,
        "intro_d" : 93,
        "npc_help1" : 51,
        "npc_help2" : 90,
        "npc_help3" : 90,
        "npc_help4" : 90,
        "npc_help5" : 39,
        "npc_help6" : 75,
        "npc_help7" : 84
    }

    var intro_Player = new Intro_Player();
    var farmers = [
        new Intro_Framer(450, 260),
        new Intro_Framer(350, 420),
        new Intro_Framer(700, 260),
        new Intro_Framer(780, 420),
    ]
    
    var mark = new Marks();

    //인트로 씬에서 그림을 그려줄 함수
    function drawIntro()
    {
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        context_GameBG.drawImage(getImageListGame("Background_Intro"), 0, 0);

        intro_Player.render();

        mark.render();

        farmers.forEach(function(value){
            value.render();
        })

        context_GameBG.drawImage(getImageListGame("Intro_Skip_Btn"), 1120, 624);

        soundFrameCheck();
    }

    //인트로 씬에서 사용될 키 입력 함수
    function keyIntro(keyCode)
    {
        switch (keyCode)
        {
            case VK_ENTER:
            case VK_BACK:
                setGameState(GAME_STATE.INGAME);
                isIntro = true;
                break;
        }
    }

    function setIntroSequence(num){
        switch(num){
            case 2:
                intro_Player.setState("idle");
                
                farmers.forEach(function(value){
                    value.setState("talk");
                })
                mark.On(0);
                playIntroSound("npc");
                break;
            case 3:
                mark.On(1);
                playIntroSound("c");
                farmers.forEach(function(value){
                    value.setState("cry");
                })
                break;
            case 4:
                playIntroSound("d");
                intro_Player.setState("wavehand");
                break;
            case 5:
                intro_Player.setState("run");
                break;
        }
    }

    function soundFrameCheck(){
        if(isSoundFrameCheck){
            introFrameIndex++;
            if(introFrameIndex >= introMaxFrame){
                introFrameIndex = 0;
                if(introSoundCheck["npc"] == true){
                    introSoundCheck["npc"] = false;
                    setIntroSequence(3);
                }else if(introSoundCheck["intro_c"] == true){
                    introSoundCheck["intro_c"] = false;;
                    isSoundFrameCheck = false;
                    setIntroSequence(4);
                }

            }
        }
    }

    //index : a, b, c, d
    function playIntroSound(index){
        var randNum;
        switch(index){
            case "a":
                randNum = randomRange(1, 3);
                introSoundName = "intro_a" + randNum;
                break;
            case "b":
                randNum = randomRange(1, 2);
                introSoundName = "intro_b" + randNum;
                break;
            case "c":
                introSoundName = "intro_c";
                introSoundCheck["intro_c"] = true;
                isSoundFrameCheck = true;
                break;
            case "d":
                introSoundName = "intro_d";
                break;
            case "npc":
                randNum = randomRange(1, 7);
                introSoundName = "npc_help" + randNum;
                introSoundCheck["npc"] = true;
                isSoundFrameCheck = true;
                break;
        }

        introMaxFrame = introSoundFrameData[introSoundName];
        soundPlayEffect(getPlaySoundData(introSoundName));
    }

    function Intro_Player(){
        this.img;
        this.imgText = {
            walk : "Intro_Walk",
            idle : "Intro_Idle",
            wavehand : "Intro_Wavehand",
            run : "Intro_Run",
        }
        this.curImgText = this.imgText.walk;
        
        this.posX = 545;
        this.posY = 900;
            
        this.stopPos = [620, 360];

        this.state = {
            Walk:0,
            Idle:1,
            Wavehand:2,
            Run:3,
        }

        this.curState = this.state.Walk

        this.anim = {
            walk : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
            idle : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
            wavehand : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12],
            run : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
        }

        this.animIdx = 0;
        this.curAnim = this.anim.run;

        this.effect = new Effect();

        this.setState = function(state){
            switch(state){
                case "walk":
                    this.curState = this.state.Walk;
                    this.curAnim = this.anim.walk;
                    break;
                case "idle":
                    this.curState = this.state.Idle;
                    this.curAnim = this.anim.idle;
                    break;
                case "wavehand":
                    this.curState = this.state.Wavehand;
                    this.curAnim = this.anim.wavehand;
                    this.effect.on( "Cape_Effect", this.posX - 60, this.posY - 20);
                    break;
                case "run":
                    this.curState = this.state.Run;
                    this.curAnim = this.anim.run;
                    break;
            }
            this.animIdx = 0;
        }

        this.render = function(){
            this.img = getImageListGame(this.curImgText);

            switch(this.curState){
                case this.state.Walk:
                    this.curImgText = this.imgText.walk;

                    if(this.posY > this.stopPos[1]){
                        this.posY -= 5;
                    }else{
                        setIntroSequence(2);
                    }
                    break;

                case this.state.Idle:
                    this.curImgText = this.imgText.idle;
                    break;

                case this.state.Wavehand:
                    this.curImgText = this.imgText.wavehand;
                    break;
                case this.state.Run:
                    this.curImgText = this.imgText.run;

                    if(this.posY > -200){
                        this.posY -= 10;
                    }else{
                        setGameState(GAME_STATE.INGAME);
                        isIntro = true;
                    }
                    break;
            }

            this.animIdx++;
            if(this.animIdx >= this.curAnim.length){
                if(this.curState == this.state.Wavehand){
                    setIntroSequence(5);
                }
                this.animIdx = 0;
            }

            drawSpriteImage(context_GameMain, this.img, this.curAnim[this.animIdx], this.posX, this.posY);

            this.effect.render();
        }
    }

    function Intro_Framer(positionX, positionY){
        this.img;
        
        this.posX = positionX;
        this.posY = positionY;

        this.posAnim = [0,0,1,1,2,2,1,1,0,0,-1,-1,-2,-2,-1,-1,0,0];
        this.posAnimIdx = randomRange(0, this.posAnim.length - 1);

        this.state = {
            Idle : 1,
            Talk : 2,
            Cry : 3
        }
        this.curState = this.state.Idle;

        this.animIdx = 0; //imgWIndex
        this.animTimer = randomRange(0, 10);

        this.imgHIndex = randomRange(0, 2);

        this.imgText = {
            idle : "Idle",
            talk : "Talk",
            cry : "Cry"
        }
        this.baseImgText = "Farmer_"
        this.curImgText = "Farmer_Idle";

        //Monster
        this.monsterImg;

        this.monsterAnim = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,5,5,5,4,4,4,3,3,3,2,2,2,1,1,1,0,0,0];
        this.monsterAnimIdx = 0;

        //Tears
        this.tearImg;
        
        this.tearAnim = [0,0,1,1,2,2,3,3,4,4];
        this.tearAnimIdx = 0;

        this.setState = function(state){
            switch(state){
                case "idle":
                    this.curState = this.state.Idle;
                    this.curImgText = this.baseImgText + this.imgText.idle;
                    break;
                case "talk":
                    this.curState = this.state.Talk;
                    this.curImgText = this.baseImgText + this.imgText.talk;
                    break;
                case "cry":
                    this.curState = this.state.Cry;
                    this.curImgText = this.baseImgText + this.imgText.cry;
                    break;
            }
            this.animIdx = 0;
        }
        this.render = function(){
            this.img = getImageListGame(this.curImgText);

            this.posAnimIdx++;
            if(this.posAnimIdx >= this.posAnim.length)
                this.posAnimIdx = 0;

            this.animTimer++;
            if(this.animTimer >= 15){
                if(this.animIdx == 0)
                    this.animIdx = 1;
                else
                    this.animIdx = 0;
                
                this.animTimer = 0;
            }

            if(this.curState == this.state.Talk){
                this.timeCount++;
                if(this.timeCount >= 45){
                    this.timeCount = 0;
                    this.setState("cry");
                }
            }
            context_GameMain.drawImage(this.img, this.img.clipWidth * this.animIdx, this.img.clipHeight * this.imgHIndex, this.img.clipWidth, this.img.clipHeight,
                this.posX, this.posY, this.img.clipWidth, this.img.clipHeight);

            //Monster
            if(this.curState == this.state.Talk){
                this.monsterImg = getImageListGame("Monster");

                this.monsterAnimIdx++;
                if(this.monsterAnimIdx >= this.monsterAnim.length){
                    this.monsterAnimIdx = this.monsterAnim.length - 1;
                }
                drawSpriteImage(context_GameMain, this.monsterImg, this.monsterAnim[this.monsterAnimIdx], this.posX, this.posY - 50);
            }    

            //Tears
            if(this.curState == this.state.Cry){
                this.tearImg = getImageListGame("Tears");

                this.tearAnimIdx++;
                if(this.tearAnimIdx >= this.tearAnim.length){
                    this.tearAnimIdx = 0;
                }
                drawSpriteImage(context_GameMain, this.tearImg, this.tearAnim[this.tearAnimIdx], this.posX - 3, this.posY - 22);
            }
        }
    }

    function Marks(){
        this.img;
        this.curImgText = "Mark_Question"

        this.posX = 590;
        this.posY = 315;

        this.isOn = false;

        this.markType = {
            question : 0,
            exclamation : 1
        }
        this.curType = this.markType.question;
        
        this.anim = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6];
        this.animIdx = 0;

        this.render = function(){
            if(this.isOn == false)
            return;

            this.img = getImageListGame(this.curImgText);

            this.animIdx++;
            if(this.animIdx >= this.anim.length - 1){
                this.Off();
            }
            drawSpriteImage(context_GameMain, this.img, this.anim[this.animIdx], this.posX, this.posY);
        }

        this.On = function(type){//type = 0 -> 물음표, type = 1 -> 느낌표
            this.isOn = true;
            
            if(type == 0){
                this.curType = this.markType.question;
                this.curAnim = this.anim.question;
                this.curImgText = "Mark_Question";
            }else if(type == 1){
                this.curType = this.markType.exclamation;
                this.curAnim = this.anim.exclamation;
                this.curImgText = "Mark_Exclamation";
            }

            this.animIdx = 0;
        }

        this.Off = function(){
            this.isOn = false;
        }
    }
//#endregion

//#region InGame
    var gameStart = false;          //게임이 시작되었는가?
    var exitBtnClick = false;       //나가기 버튼 클릭
    var quitBtnClick = false;       //그만하기 버튼 클릭
    var isStartPop = true;         //게임 시작전 시작 팝업을 보여줘야 하는가?
    var ingameCurPosition = 0;      //인게임에서 팝업 메뉴 버튼 위치
    var resultCurPosition = 0;      //게임 결과 팝업 메뉴 버튼 위치

    var isGetReward = false; //칭찬 스티커 획득 여부

    var isSuccess = false; //과일 수집 50개 이상이면 성공, 50개 미만이면 실패

    //InGame Key Event Check Arr
    var keyDownArr = [];

    var tree = new Tree();

    var player = new Player();

    var monsters = [];
    var monsterMaxIndex = 6;

    //player attack Item(Water ball)
    var heartBalls = []
    var heartBallsIndex = 0;
    var heartBallsMaxIndex = 5;

    var coolDownTime = 0.15;
    var coolDownCurTime = 0;
    var isCoolDown = false;

    var catchCount = 0;
    var winCount = 30;
    var monsterCount = 0;

    for(var i = 0; i < heartBallsMaxIndex; i++)
        heartBalls.push(new HeartBall);

    for(var i = 0; i < monsterMaxIndex; i++){
        monsters.push(new Monster());
        monsters[i].monsterObject = new MonsterObject(monsters[i]);
    }

    monsters.forEach(function(value){
        value.turnOn();
        value.monsterObject.turnOn();
    })

    setFirstTimeMonsters();
    
    var scoreUI = new ScoreUI();//단순 점수 추가가 아닌 기본점수, 아이템 점수 들의 다양한 변수로 인해 공동 Score안씀
    var timerUI = new TimerUI_Common("FruitMonster", 150);
    var compSticker = new ComplimentSticker(context_GameMain, 65, 53);
    var exitPopup = new ExitPopup();
    var startPopup = new StartPopup("FruitMonster");

    //Functions
    function inGameReset()
    {
        sendDataGravity(checkRewardSticker, GAPI_CHECK_TODAYSTICKER, "game_hangle_e", null);

        ingameCurPosition = 0;
        resultCurPosition = 0;
        
        isStartPop = true;
        isSuccess = false;

        keyDownArr = [];

        exitBtnClick = false;       //나가기 버튼 클릭
        quitBtnClick = false;       //그만하기 버튼 클릭

        tree = new Tree();

        player = new Player();
    
        monsters = [];
        monsterMaxIndex = 6;
    
        heartBalls = []
        heartBallsIndex = 0;
        heartBallsMaxIndex = 5;
    
        coolDownTime = 0.25;
        coolDownCurTime = 0;
        isCoolDown = false;
    
        catchCount = 0;
        winCount = 30;
        monsterCount = 0;
    
        for(var i = 0; i < heartBallsMaxIndex; i++)
            heartBalls.push(new HeartBall);


        for(var i = 0; i < monsterMaxIndex; i++){
            monsters.push(new Monster());
            monsters[i].monsterObject = new MonsterObject(monsters[i]);
        }

        monsters.forEach(function(value){
            value.turnOn();
            value.monsterObject.turnOn();
        })

        setFirstTimeMonsters();

        scoreUI = new ScoreUI();
        timerUI = new TimerUI_Common("FruitMonster", 150);

        compSticker = new ComplimentSticker(context_GameMain, 65, 53);
        exitPopup = new ExitPopup();
        startPopup = new StartPopup("FruitMonster");
    }
    
    function updateInGame()
    {
        if(gameStart && exitBtnClick == false && isStartPop == false){
            timerUI.playTime--;
            if(timerUI.playTime <= 0 || catchCount >= winCount){
                gameEnd();
            }
    
            if(isCoolDown){
                coolDownCurTime += 0.02;
                if(coolDownCurTime >= coolDownTime){
                    isCoolDown = false;
                    coolDownCurTime = 0;
                }
            }
    
            player.baseFunc(keyDownArr);
    
            heartBalls.forEach(function(value){
                value.baseFunc();
                monsters.forEach(function(value_2){
                    if(value_2.isAttacked == false && value.curState == value.state.on && value_2.isOnAttacked == true){
                        value.checkCollision(value_2);                        
                    }
                })
            })
    
    
            monsters.forEach(function(value){
                value.baseFUnc();
                value.monsterObject.move();
            })

            tree.checkCollisionAlpha();
    
            turnOnAllMonster();
        }
    }
    
    //인게임을 그려준다
    function drawInGame()
    {
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        renderBG();
        renderMain();
        renderUI();
    }

    //인게임 키 입력부분
    function keyInGame(keyCode)
    {
        if(exitBtnClick){
            switch (keyCode)
            {
                case VK_UP:
                    break;
                case VK_DOWN:
                    break;
                case VK_LEFT:
                    ingameCurPosition--;

                    if(ingameCurPosition < 0)
                    {
                        ingameCurPosition = 1;
                    }

                    switch (ingameCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("yes"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("no"));
                            break;
                    }
                    break;
                case VK_RIGHT:
                    ingameCurPosition++;

                    if(ingameCurPosition > 1)
                    {
                        ingameCurPosition = 0;
                    }

                    switch (ingameCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("yes"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("no"));
                            break;
                    }
                    break;
                case VK_ENTER:
                    if(ingameCurPosition == 0) //그만하기
                    {
                        soundStopAll();

                        setGameState(GAME_STATE.TITLE);
                        exitBtnClick = false;
                    }
                    else if(ingameCurPosition == 1)      //게임으로 돌아기기
                    {
                        clearBuffer(canvas_GamePopup, context_GamePopup);
                        exitBtnClick = false;
                        gameStart = true;
                    }
                    break;
                case VK_BACK:
                    exitBtnClick = true;
            }
        }else if(isStartPop){
            switch(keyCode){
                case VK_ENTER:
                    isStartPop = false;
                    gameStart = true;
                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    gameStart = false;
                    break;
            }
        }else if(!player.isAttacked){
            if(player.curState == player.state.throw)
            return;
            switch (keyCode)
            {
                case VK_UP:
                    break;
                case VK_DOWN:
                    break;
                case VK_LEFT:
                    player.curState = player.state.move_Left;
                    break;
                case VK_RIGHT:
                    player.curState = player.state.move_Right;
                    break;
                case VK_ENTER:
                    if(isCoolDown == false){
                        player.throw();
                    }
                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    gameStart = true;
                    break;
            }
        }
        
    }

    function keyUpInGame(keyCode){
        if(keyDownArr.indexOf(keyCode) >= 0){
            keyDownArr.splice(keyDownArr.indexOf(keyCode), 1);
        }
    }
    
    function turnOnAllMonster(){
        var isAllDie = false;
        monsters.forEach(function(value){
            if(value.curState != value.state.die){
                if(isAllDie == true)
                    return;

                isAllDie = true;
            }
        })

        if(isAllDie == false){
            monsters.forEach(function(value){
                value.turnOn();
                value.monsterObject.turnOn();
            })
        }
    }

    function setTree(){
        tree.setImgIndex(catchCount);
        catchCount++;
        if(catchCount == winCount)
            isSuccess = true;
    }

    function setFirstTimeMonsters(){
        monsters.forEach(function(value, index){
            if(index % 2 == 0) value.setState("move_R");
            else value.setState("move_L");

            if(index < 2) value.randPosY = value.randPosYArr[0];
            else if(index < 4) value.randPosY = value.randPosYArr[1];
            else value.randPosY = value.randPosYArr[2];
        })
    }

    function setScoreIndex(){
        scoreUI.setScore(monsterCount);
        scoreUI.addIncreaseScore();
    }
    
    function gameEnd(){
        monsters.forEach(function(value){
            value.setState("leaving");
            value.monsterObject.curState = 0;
        })



        if(isSuccess){
            player.curState = player.state.win
        }else{
            player.curState = player.state.lose
        }

        scoreUI.addTotalScore(calculateFrameToScore(timerUI.playTime));

        endPopup.init(scoreUI.totalScore, "game_hangle_e");

        setGameState(GAME_STATE.GAME_END);

        if(isGetReward || isSuccess == false){
            isEndPopup = true;
            stickerPopup.IsKeySet();
        } 

        sendDataGravity(insertScore, GAPI_INSERT_SCORE, "game_hangle_e", scoreUI.totalScore);
    }

    function renderBG(){
        //Background
        context_GameBG.drawImage(getImageListGame("Background_Ingame"), 0, 0, 1280, 720);
    }

    function renderMain(){
        //Main
        //-------------------------depth를 위해 2번 rendering--------------------------------
        heartBalls.forEach(function(value){
            if(value.isBehindTree == true)
                value.render();
        })
        //-----------------------------------------------------------------------------------

        monsters.forEach(function(value){
            value.render();
        })

        tree.render();

        heartBalls.forEach(function(value){
            if(value.isBehindTree == false)
                value.render();
        })

        player.render();
    }

    function renderUI(){
        scoreUI.render();
        timerUI.render();

        if(isGetReward == false) compSticker.render();

        if(isStartPop) startPopup.render();

        if(exitBtnClick == true) exitPopup.render(ingameCurPosition);
    }

    //Objects
    function Player(){
        this.img;
        this.imgText
        this.imgTextArr = {
            throw : "Player_Attack",
            blink : "Player_Blink",
            attacked : "Player_Damaged",
            idle_B : "Player_Idle_B",
            idle_F : "Player_Idle_F",
            idle_L : "Player_Idle_L",
            lose : "Player_Lose",
            move_Left : "Player_Run_L",
            move_Right : "Player_Run_R",
            win : "Player_Win",
        }
        
        this.posX = 566;
        this.posY = 510;
        
        this.speed = 10;

        this.imgWCount = 0;
        this.imgHCount = 7;

        this.imgWidth = 150;
        this.imgHeight = 180;

        this.anim = {
            throw : [0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,5,5],
            blink : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14],
            attacked : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8],
            idle_B : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
            idle_F : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14],
            idle_L : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14],
            lose : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12],
            move_Left : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
            move_Right : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7],
            win : [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,
                10,10,11,11,12,12,13,13,14,14,15,15,16,16,
                17,17,18,18,19,19,20,20,21,21]
        }
        this.curAnim = this.anim.idle_B;
        this.animIndex = 0;

        this.isAttacked = false;

        this.state = {
            idle : 0,
            move_Right : 1,
            move_Left : 2,
            throw : 3,
            attacked : 4,
            lose : 5,
            win : 6,
            win_idle: 7, 
            lose_idle: 8, 
        }

        this.curState = this.state.idle;

        this.isThrow = false;

        this.effect = new Effect();

        this.render = function(){
            switch(this.curState){
                case this.state.idle:
                    this.imgText = this.imgTextArr.idle_B;
                    this.curAnim = this.anim.idle_B;
                    break;
                case this.state.move_Left:
                    this.imgText = this.imgTextArr.move_Left;
                    this.curAnim = this.anim.move_Left;
                    break;
                case this.state.move_Right:
                    this.imgText = this.imgTextArr.move_Right;
                    this.curAnim = this.anim.move_Right;
                    break;
                case this.state.throw:
                    this.imgText = this.imgTextArr.throw;
                    this.curAnim = this.anim.throw;
                    break;
                case this.state.attacked:
                    this.imgText = this.imgTextArr.attacked;
                    this.curAnim = this.anim.attacked;
                    break;
                case this.state.win:
                    this.imgText = this.imgTextArr.win;
                    this.curAnim = this.anim.win;
                    break;
                case this.state.lose:
                    this.imgText = this.imgTextArr.lose;
                    this.curAnim = this.anim.lose;
                    break;
                case this.state.win_idle:
                    this.imgText = this.imgTextArr.idle_F;
                    this.curAnim = this.anim.idle_F;
                    break;
                case this.state.lose_idle:
                    this.imgText = this.imgTextArr.idle_L;
                    this.curAnim = this.anim.idle_L;
                    break;
            }
            this.img = getImageListGame(this.imgText);

            if(this.img == undefined)
                return;

            drawSpriteImage(context_GameMain, this.img, this.curAnim[this.animIndex], this.posX, this.posY);

            this.animIndex++
            if(this.animIndex >= this.curAnim.length){
                switch(this.curAnim){
                    case this.anim.throw:
                        this.curState = this.state.idle;
                        break;
                    case this.anim.attacked:
                        this.isAttacked = false;
                        this.curState = this.state.idle;
                        break;
                    case this.anim.win:
                        this.curState = this.state.win_idle;
                        break;
                    case this.anim.lose:
                        this.curState = this.state.lose_idle;
                        break;
                }
                
                this.animIndex = 0;
            }

            if(this.animIndex >= this.curAnim.length - 7 && this.curAnim == this.anim.throw){
                heartBalls[heartBallsIndex].turnOn();
                soundPlayEffect(getPlaySoundData("kong_atk"));
            }

            
            this.effect.render();
        }

        this.move = function(keyArr){
            if(this.curState == this.state.throw || this.curState == this.state.attacked)
                return;
            
            switch(this.curState){
                case this.state.move_Left:
                    if(this.posX > 0){
                        this.posX -= this.speed;
                    }
                    break;
                case this.state.move_Right:
                    if(this.posX < canvas_GameMain.width - this.img.clipWidth){
                        this.posX += this.speed;
                    }
                    break;
            }
        }

        this.throw = function(){
            //this.isThrow = true;
            this.curState = this.state.throw;
            this.animIndex = 0;
        }

        this.attacked = function(){
            this.isAttacked = true;
            this.curState = this.state.attacked;
            this.animIndex = 0;
            if(randomRange(0, 100) >= 50)
                soundPlayEffect(getPlaySoundData("kong_aya1"));
            else
                soundPlayEffect(getPlaySoundData("kong_aya2"));
            this.effect.on("Attacked_Effect_P", this.posX, this.posY - 20);
        }

        //실제 UpdateInGame에서 사용할 함수(이동, 충돌체크)
        this.baseFunc = function(keyArr){
            this.move(keyArr);
        }
    }

    function HeartBall(){
        this.img;

        this.posX = 0;
        this.posY = 0;

        this.isBehindTree = false;

        this.ballSpeed = 15;

        this.imgWidth = 150;
        this.imgHeight = 150;

        this.state = {
            on : 0,
            off : 1
        }
        this.curState = this.state.off;

        this.animIdx = 0;
        this.animLen = 10;
        this.animFrame = 0;

        this.render = function(){
            if(this.curState == this.state.off)
                return;
            this.img = getImageListGame("Heart_Attack");

            if(this.img == undefined)
                return;

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);

            this.animFrame++;
            if(this.animFrame >= 2){
                this.animIdx++;
                if(this.animIdx >= this.animLen - 1){
                    this.animIdx = 0;
                }
                this.animFrame = 0;
            }
        }

        this.move = function(){
            this.posY -= this.ballSpeed;

            if(this.posY >= tree.baseOfTreeArea.y){
                this.isBehindTree = true;
            }

            if(this.posY < -200){
                this.turnOff();
            }
        }

        this.checkCollision = function(other){//other = enemy
            if(checkCollisionRect(this.posX + 50, this.posY + 50, this.imgWidth - 100, this.imgHeight - 100, other.posX + 15, other.posY + 15, other.imgWidth - 30, other.imgHeight - 30)){
                other.setState("attacked");
                other.attacked();
                this.curState = this.state.off;
                monsterCount++;
                setScoreIndex();
            }
        }

        this.checkCollisionTree = function(){
            if(checkCollisionRect(this.posX + 50, this.posY + 50, this.imgWidth - 100, this.imgHeight - 100, tree.baseOfTreeArea.x, tree.baseOfTreeArea.y, tree.baseOfTreeArea.w, tree.baseOfTreeArea.h)){
                this.turnOff();
            }
        }

        this.baseFunc = function(){
            if(this.curState == this.state.off)
                return;
            
            this.move();
            this.checkCollisionTree();
        }

        this.turnOn = function(){
            if(isCoolDown)
                return;

            this.isBehindTree = false;
            this.curState = this.state.on;
            this.posX = player.posX + (player.imgWidth / 2) - this.imgWidth / 2;
            this.posY = player.posY;
        
            heartBallsIndex += 1;
            if(heartBallsIndex >= heartBalls.length)
                heartBallsIndex = 0;
        
            isCoolDown = true;
        }

        this.turnOff = function(){
            this.curState = this.state.off;
            this.posX = 0;
            this.posY = 0;
            this.animIdx = 0;
        }
    }

    function Monster(){
        this.img;
        this.imgText;
        
        this.posX = 585;
        this.posY = 200;

        this.startPosX = 585;
        this.startPosY = 200;

        this.isBehindTree = true;

        this.randPosY;
        this.randPosYArr = [100, 235, 370];

        this.speed = randomRange(2, 8);
        
        this.imgWidth = 100;
        this.imgHeight = 100;

        this.imgWCount = 0;

        this.attackTime = calculateSecToFrame(randomRange(10, 15));
        this.attackIndex = 0;

        this.respawnTime = 1;
        this.respawnIndex = 0;

        this.gasBall = new GasBall();
        this.attackCoolTime = calculateSecToFrame(randomRange(2, 5));
        this.attackTimeIndex = 0;
        this.attackInterval = calculateSecToFrame(2);
        this.attackIntervalTime = 0;

        this.createdTime = 0;

        this.effect = new Effect();

        this.isTurnOnAnim = false;
        this.isAttacked = false;
        this.isFlip = false;
        this.isOnAttacked = false;

        this.monsterObject;

        this.wordEffect = new WordEffect();

        this.color = ["None", "Blue", "Green", "Orange", "Pink", "Purple", "Yellow"];
        this.colorIdx = 0;

        this.state = {
            idle : 0,
            move_Left : 1,
            move_Right: 2,
            attacked : 3,
            die : 4,
            on : 5,
            attack : 6,
            leaving : 7,
        }

        this.curState = this.state.die
        this.pastState;

        this.anim = {
            atk : 8,
            idle : 15,
            leaving : 15,
            move : 10,
            shoted : 10
        }
        this.curAnim = this.anim.move

        this.animIdx = 0;
        this.frameTimer = 0;
        
        this.render = function(){
            this.imgText = this.color[this.colorIdx];

            switch(this.curState){
                case this.state.idle:
                    this.imgText += "_Idle";
                    this.curAnim = this.anim.idle;
                    break;
                case this.state.move_Left:
                case this.state.move_Right:
                    this.imgText += "_Move";
                    this.curAnim = this.anim.move;
                    break;
                case this.state.attacked:
                    this.imgText += "_Shoted";
                    this.curAnim = this.anim.shoted;
                    break;
                case this.state.on:
                    this.imgText += "_Idle";
                    this.curAnim = this.anim.idle;
                    break;
                case this.state.attack:
                    this.imgText += "_Atk";
                    this.curAnim = this.anim.atk;
                    break;
                case this.state.leaving:
                    this.imgText += "_Leaving";
                    this.curAnim = this.anim.leaving;
            }

            if(this.curState == this.state.attack){
                this.attackIntervalTime++;
                 if(this.attackIntervalTime >= this.attackInterval){
                     this.gasBall.turnOn(this.posX, this.posY);
                     this.curState = this.pastState;
                     this.attackIntervalTime = 0;
                    }
            }

            this.frameTimer++
            if(this.frameTimer >= 2){
                this.animIdx++
                this.frameTimer = 0;
            }

            if(this.animIdx >= this.curAnim){
                this.animIdx = 0;

                if(this.curState == this.state.attacked){
                    this.setState("leaving");
                }
            }

            if(this.curState == this.state.die){
                this.respawnIndex += 0.01;
                if(this.respawnIndex >= this.respawnTime){
                    this.respawnIndex = 0;
                    this.turnOn();
                    this.monsterObject.turnOn();
                }
                return;
            }

            this.img = getImageListGame(this.imgText);
            // console.log(this.imgText);

            if(this.img == undefined){
                return;
            }

            if(this.isFlip){
                context_GameMain.save();
                context_GameMain.scale(-1, 1);
                drawSpriteImage(context_GameMain, this.img, this.animIdx, -this.posX - this.img.clipHeight, this.posY);
                context_GameMain.restore();
            }else{
                drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);
            }

            if(this.isOnAttacked == false)  this.createdTime++;

            if(this.createdTime >= 15) this.isOnAttacked = true;

            this.monsterObject.render();

            this.gasBall.render();
            this.effect.render();
            this.wordEffect.render();
        }

        this.move = function(){
            if(this.curState == this.state.attacked || this.curState == this.state.die || this.curState == this.state.attack)
                return;
            
            //처음 생성되었을 때 position Y 값 이동
            if(this.isTurnOnAnim == false){
                this.offset = this.posY - this.randPosY;
                if(this.offset > 0){
                    if(this.posY >= this.randPosY){
                        this.posY -= this.speed;
                    }
                }else if(this.offset < 0){
                    if(this.posY <= this.randPosY){
                        this.posY += this.speed;
                    }
                }

                if(Math.abs(this.offset) < this.speed){
                    this.isTurnOnAnim = true;
                    //Y Position에 따라 this.isBehindTree 값 조정
                    this.isBehindTree = true;
                }
            }

            switch(this.curState){
                case this.state.move_Left:
                    this.posX -= this.speed;
                    if(this.posX <= 0){
                        this.setState("move_R");
                    }
                    break;
                case this.state.move_Right:
                    this.posX += this.speed;
                    if(this.posX >= 1180){
                        this.setState("move_L");
                    }
                    break;
                case this.state.leaving:
                    this.posY -= 10;
                    if(this.posY <= -120)
                        this.setState("die");
                    break;
            }
        }

        this.attacked = function(){
            this.isAttacked = true;
            if(this.monsterObject.curState == this.monsterObject.state.idle){
                this.monsterObject.curState = this.monsterObject.state.gotoTree;
            }
            
            if(this.monsterObject.isSoundPlay == false){
                this.monsterObject.playSound(this.monsterObject);
                this.monsterObject.isSoundPlay = true;
                this.effect.on("Attacked_Effect_M", this.posX - 28, this.posY - 28);
            }

            if(this.monsterObject.curType == this.monsterObject.type.fruit)
                this.wordEffect.on(this.monsterObject.posX, this.monsterObject.posY, this.monsterObject.imgIndex);
        }

        this.turnOn = function(){
            console.log(nowState);
            if(nowState == GAME_STATE.GAME_END) return;

            this.posX = this.startPosX;
            this.posY = this.startPosY;

            this.colorIdx = randomRange(1, 5);

            this.randPosY = this.randPosYArr[randomRange(0, 2)];

            this.speed = randomRange(2, 8);

            this.isTurnOnAnim = false;
            this.isAttacked = false;
            this.isOnAttacked = false;

            this.attackTime = calculateSecToFrame(randomRange(10, 15));
            this.attackIndex = 0;
    
            this.respawnTime = 1;
            this.respawnIndex = 0;
    
            this.attackCoolTime = calculateSecToFrame(randomRange(2, 5));
            this.attackTimeIndex = 0;
            this.attackInterval = calculateSecToFrame(2);
            this.attackIntervalTime = 0;

            this.createdTime = 0;

            this.patternIndex = randomRange(0, 1);
            
            if(this.patternIndex == 0)
                this.setState("move_L");
            else
                this.setState("move_R");

            this.pastState = this.state.idle;
        }

        this.turnOff = function(){
            this.curState = this.state.die;
            this.colorIdx = 0;
        }

        this.attackTimeCheck = function(){
            if(this.curState == this.state.die || this.curState == this.state.attacked || this.curState == this.state.attack || this.curState == this.state.leaving)
                return;

            this.attackTimeIndex++;
            if(this.attackTimeIndex >= this.attackCoolTime){
                this.attackTimeIndex = 0;
                this.randNum = randomRange(1, 100);
                if(this.randNum >= 10)
                    return;
                
                this.pastState = this.curState;
                this.curState = this.state.attack;
            }
        }

        this.setState = function(state){
            switch(state){
                case "idle":
                    this.curState = this.state.idle;
                    break;
                case "move_L":
                    this.curState = this.state.move_Left;
                    break;
                case "move_R":
                    this.curState = this.state.move_Right;
                    break;
                case "attacked":
                    this.curState = this.state.attacked;
                    break;
                case "die":
                    this.curState = this.state.die;
                    break;
                case "on":
                    this.curState = this.state.on;
                    break;
                case "attack":
                    this.curState = this.state.attack;
                    break;
                case "leaving":
                    this.curState = this.state.leaving;
                    break;
            }

            if(state == "move_R") this.isFlip = true;
            else this.isFlip = false;

            this.animIdx = 0
        }

        this.baseFUnc = function(){
            this.move();
            this.attackTimeCheck();
            
            this.gasBall.baseFunc(player);
        }
    }
    
    function MonsterObject(monster){
        this.img;
        this.imgTextArr = ["Apple", "Banana", "Cherry", "Cucumber", "Kiwi", "Lemon", "Melon", "Hanrabong", "Persimmon", "Pineapple", "Plum", "Pumpkin", "Strawberry", "Tomato", "Watermelon"];
        this.imgIndex = randomRange(0, this.imgTextArr.length - 1);
        this.imgWidth = 70;
        this.imgHeight = 70;

        this.posX;
        this.posY;

        this.isAddScore = false;
        this.isSoundPlay = false;

        this.state = {
            off : 0,
            idle : 1,
            gotoTree : 2,
        }
        this.curState = this.state.off;

        this.type = {
            none : 0, //10%
            fruit : 1, // 75%
            boom : 2, // 5%
            bonusTime : 3, // 5%
            bonusScore : 4, // 5%
        }
        this.curType = this.type.none;

        this.render = function(){
            if(this.curState == this.state.off)
                return;

            switch(this.curType){
                case this.type.fruit:
                    this.img = getImageListGame(this.imgTextArr[this.imgIndex]);
                    break;
                case this.type.boom:
                    this.img = getImageListGame("Boom");
                    break;
                case this.type.bonusTime:
                    this.img = getImageListGame("BonusTime");
                    break;
                case this.type.bonusScore:
                    this.img = getImageListGame("BonusScore");
                    break;
            }

            if(this.img == undefined){
                console.log("과일 이미지가 없습니다. => " + this.imgTextArr[this.imgIndex]);
                return;
            }
            context_GameMain.drawImage(this.img, this.posX, this.posY - 20);
        }

        this.move = function(){
            switch(this.curState){
                case this.state.idle:
                    this.posX = monster.posX + (monster.imgWidth/2) - (this.imgWidth/2);
                    this.posY = monster.posY - 20;
                    break;
                case this.state.gotoTree:
                    this.collisionCheck();
                    this.posX = lerpFunc(this.posX, tree.collisionArea.centerX - this.imgHeight / 2, 0.1);
                    this.posY = lerpFunc(this.posY, tree.collisionArea.centerY - this.imgHeight / 2, 0.1);
                    break;
            }
        }

        this.collisionCheck = function(){
            var isColl = checkCollisionRect(this.posX, this.posY, this.imgWidth, this.imgHeight, tree.collisionArea.x, tree.collisionArea.y, tree.collisionArea.w, tree.collisionArea.h);
            if(isColl){
                if(!this.isAddScore){
                    switch(this.curType){
                        case this.type.fruit:
                            // soundPlayEffect(getPlaySoundData(this.imgTextArr[this.imgIndex]));
                            scoreUI.addObjectScore(this.imgTextArr[this.imgIndex]);
                            setTree();
                            break;
                        case this.type.boom:
                            this.boomItem();
                            //TODO
                            break;
                        case this.type.bonusTime:
                            this.bonusTime();
                            //TODO
                            break;
                        case this.type.bonusScore:
                            this.bonusScore();
                            //TODO
                            break;
                    }
                    this.isAddScore = true;
                    this.curState = this.state.off;
                }
            }
        }

        this.baseFunc = function(){
            this.render();
            this.move();
        }

        this.turnOn = function(){
            this.isAddScore = false;
            this.isSoundPlay = false;

            this.randNum = randomRange(0, 100);

            if(this.randNum <= 10){
                this.curType = this.type.none;
                return;
            }else if(this.randNum <= 85){
                this.curType = this.type.fruit;
                this.imgIndex = randomRange(0, this.imgTextArr.length - 1);
            }else if(this.randNum <= 90){
                this.curType = this.type.boom;
            }else if(this.randNum <= 95){
                this.curType = this.type.bonusTime;
            }else if(this.randNum <= 100){
                this.curType = this.type.bonusScore;
            }
            this.curState = this.state.idle;
        }

        this.boomItem = function(){
            scoreUI.addObjectScore("Boom");

            monsters.forEach(function(value){
                if(value.curState == value.state.die || value.curState == value.state.attacked || value.curState == value.state.leaving)
                    return;
                
                value.curState = value.state.attacked;
                value.attacked();
            })
        }

        this.bonusTime = function(){
            scoreUI.addObjectScore("BonusTime");

            timerUI.addPlayTime(10);
        }

        this.bonusScore = function(){
            scoreUI.addObjectScore("BonusScore");
            scoreUI.addTotalScore(1000);
        }

        this.playSound = function(object){
            if(object.curState == object.state.off){
                soundPlayEffect(getPlaySoundData("mon_heart_a"));
                return;
            }

            switch(object.curType){
                case this.type.fruit:
                    soundPlayEffect(getPlaySoundData(this.imgTextArr[this.imgIndex]));
                    break;
                case this.type.boom:
                    soundPlayEffect(getPlaySoundData("mon_heart_b"));
                    break;
                case this.type.bonusTime:
                    soundPlayEffect(getPlaySoundData("mon_time"));
                    break;
                case this.type.bonusScore:
                    soundPlayEffect(getPlaySoundData("mon_bonus"));
                    break;
            }
        }
    }

    function Tree(){
        this.baseImg;
        this.basePosX = 517;
        this.basePosY = 145;

        this.fruitImg;
        this.fruitPosX = 521;
        this.fruitPosY = 151.5;
        this.fruitOffset = 0;

        this.topImg;
        this.topPosX = 587;
        this.topPosY = 130;

        this.glassImg;
        this.glassPosX = 521;
        this.glassPosY = 149.5;

        this.effectImg;
        this.effectPosX = 581;
        this.effectPosY = 168.5;

        this.imgIndex = 0;

        this.alpha = 1;

        this.collisionArea = {
            x : 600,
            y : 220,
            w : 70,
            h : 70,
            centerX : 635,
            centerY : 235,
        }

        this.baseOfTreeArea = {
            x : 615,
            y : 400,
            w : 45,
            h : 70,
        }

        this.render = function(){
            this.baseImg = getImageListGame("Tree_Base");
            this.fruitImg = getImageListGame("Tree_Fruit");
            this.glassImg = getImageListGame("Tree_Glass");
            this.effectImg = getImageListGame("Tree_Effect");
            this.topImg = getImageListGame("Tree_Top");

            context_GameMain.drawImage(this.baseImg, this.basePosX, this.basePosY);
            context_GameMain.drawImage(this.fruitImg, 0, this.fruitImg.height - (this.fruitImg.height * this.fruitOffset), this.fruitImg.width, this.fruitImg.height * this.fruitOffset, 
            this.fruitPosX, this.fruitPosY + this.fruitImg.height - (this.fruitImg.height * this.fruitOffset), this.fruitImg.width, this.fruitImg.height * this.fruitOffset);
            context_GameMain.drawImage(this.glassImg, this.glassPosX, this.glassPosY);
            context_GameMain.drawImage(this.effectImg, this.effectPosX, this.effectPosy);
            context_GameMain.drawImage(this.topImg, this.topPosX, this.topPosY);
        }

        this.setImgIndex = function(count){
            if(count > 30)
                return;

            if(count == 29){
                this.fruitOffset += 0.034;
                return;
            }
            this.fruitOffset += 0.033;
        }

        this.checkCollisionAlpha = function(){
            var isCollision = false;
            for(var i = 0; i < monsters.length; i++){
                if(monsters[i].curState != monsters[i].state.die && monsters[i].isBehindTree == true){
                    if(checkCollisionRect(540, 140, 200, 180, monsters[i].posX, monsters[i].posY, monsters[i].imgWidth, monsters[i].imgHeight)){
                        isCollision = true;
                    }
                }

            }

            if(isCollision == false){
                this.alpha = 1;
            }else{
                this.alpha = 0.6;
            }
        }
    }

    function GasBall(){
        this.img;

        this.posX;
        this.posY;

        this.imgWidth = 55;
        this.imgHeight = 65;

        this.speed = 10;

        this.state = {
            on : 0,
            off : 1,
        }
        this.curState = this.state.off;

        this.animLen = 3;
        this.animIdx = 0;

        this.animFrame = 0;

        this.coolDownTime = calculateSecToFrame( 7 + randomRange(5, 15));
        this.coolDownCurTime = 0;

        this.render = function(){
            this.img = getImageListGame("Slime_Ball");

            if(this.curState != this.state.on){
                return;
            }

            if(this.img == undefined)
                return;

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);

            this.animFrame++;
            if(this.animFrame >= 3){
                this.animIdx++;
                if(this.animIdx >= this.animLen){
                    this.animIdx = 0;
                }
                this.animFrame = 0;
            }      
        }

        this.move = function(){
            this.posY += this.speed;

            if(this.posY >= canvas_GameMain.height)
                this.turnOff();
        }
        this.turnOn = function(positionX, positionY){
            this.curState = this.state.on;

            this.posX = positionX;
            this.posY = positionY;
        }

        this.turnOff = function(){
            this.curState = this.state.off;

            this.coolDownTime = calculateSecToFrame( 7 + randomRange(5, 15));
            this.coolDownCurTime = 0;
        }

        this.collisionCheck = function(other){
            if(checkCollisionRect(this.posX + 5, this.posY + 5, this.imgWidth - 10, this.imgHeight - 10, other.posX + 40, other.posY + 25, other.imgWidth - 80, other.imgHeight - 50)
            && other.isAttacked == false){
                other.attacked();
                this.curState = this.state.off;
                timerUI.minusPlayTime(5);
            }
        }

        this.baseFunc = function(player){

            if(this.curState == this.state.on){
                this.move();
                this.collisionCheck(player);
            }
        }
    }

    function ScoreUI(){
        this.totalScore = 0;
        this.score = 0;
        this.scoreTypeText = "";
        
        this.backgroundImg;
        this.posX = 1008;
        this.posY = 43;

        this.textPosX = 1185;
        this.textPosY = 57;

        this.render = function(){
            this.backgroundImg = getImageListGame("UI_ScoreBG");

            if(this.backgroundImg == undefined){
                return;
            }
            context_GameMain.drawImage(this.backgroundImg, this.posX, this.posY);

            this.renderTotalScore();
        }

        this.setScore = function(count){
            if(count % 10 != 0 ||  count > 50)
                return;
            if(count != 0){
                var temp = count / 10 * 10;
                this.scoreTypeText = "ScoreData_" + temp;
            }else{
                this.scoreTypeText = "ScoreData_" + count;
            }

            this.score = parseInt(getScoreData(this.scoreTypeText));
        }

        this.addIncreaseScore = function(){
            if(this.score == 0)
                this.setScore(0);

            this.totalScore += this.score;
        }

        //Item, Fruit, Bonus etc.....
        this.addObjectScore = function(objectName){ 
            this.totalScore += parseInt(getScoreData(objectName));
        }

        this.addTotalScore = function(score){
            this.totalScore += score;
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

    function Effect(){
        this.img;
        this.imgText = "";

        this.posX;
        this.posY;

        this.type = {
            Monster_Attacked : 0,
        }
        this.curType = this.type.monster_Attacked;

        this.animLen = {
            "Attack_Effect_P" : 10,
            "Attacked_Effect_M" : 16,
            "Attacked_Effect_P" : 10,
            "Cape_Effect" : 14,
        }
        this.curAnimLen = this.animLen.Monster_Attacked;
        this.animIdx = 0;
        this.animFrame = 0;

        this.isOn = false;

        this.render = function(){
            if(this.isOn == false)
                return;

            this.animFrame++;
            if(this.animFrame >= 2){
                this.animIdx++;
                if(this.animIdx >= this.curAnimLen - 1){
                    this.animIdx = 0;
                    this.off();
                    return;
                }

                this.animFrame = 0;
            }
            
            this.img = getImageListGame(this.imgText);

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);
        }

        this.on = function(type, positionX, positionY){
            this.isOn = true;

            this.imgText = type;
            this.curAnimLen = this.animLen[type];

            this.posX = positionX;
            this.posY = positionY;
            this.animIdx = 0;
        }

        this.off = function(){
            this.isOn = false;
        }
    }

    function WordEffect(){
        this.img;
        this.imgTextArr = ["Apple", "Banana", "Cherry", "Cucumber", "Kiwi", "Lemon", "Melon", "Hanrabong", "Persimmon", "Pineapple", "Plum", "Pumpkin", "Strawberry", "Tomato", "Watermelon"];
        this.imgIndex = 0;

        this.animIdx = 0;
        this.animLen = 13;
        this.animFrame = 0;

        this.posX = 0;
        this.posY = 0;

        this.isOn = false;

        this.render = function(){
            if(this.isOn == false) return;

            this.img = getImageListGame(this.imgTextArr[this.imgIndex] + "_Word");

            if(this.img == null || this.img == undefined){
                console.log("과일 단어 이미지가 없습니다. => " + this.imgTextArr[this.imgIndex] + "_Word");
                return;
            }

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);

            this.animFrame++;
            if(this.animFrame >= 2){
                this.animIdx++;
            }

            if(this.animIdx >= this.animLen){
                this.off();
            }
        }

        this.on = function(positionX, positionY, imgIndex){
            this.posX = positionX - 50;
            this.posY = positionY - 40;

            this.imgIndex = imgIndex;

            this.animIdx = 0;

            this.isOn = true;
        }

        this.off = function(){
            this.isOn = false;
        }
    }

//#endregion

//#region GameEnd
    var isEndSoundPlay = false;
    var endMaxFrame;
    var endFrameIndex = 0;

    var isEndPopup = false;

    var isEndKey = false;
    var isEndKeyTimer = 0;

    var isStickerPopupKey = false;

    var endSoundFrameData = {
        "kong_end_a1" : 66,
        "kong_end_a2" : 63,
        "kong_end_a3" : 72,
        "kong_end_a4" : 60,
        "kong_end_b1" : 48,
        "kong_end_b2" : 42,
        "kong_end_b3" : 81,
        "pop2_say" : 117
    }

    var endPopup = new EndScorePopup();
    var stickerPopup = new StickerPopup();

    function drawGameEnd(){
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        if(isEndSoundPlay){
            endFrameIndex++
            if(endFrameIndex >= endMaxFrame){
                isEndSoundPlay = false;
                if(isGetReward == true) isEndPopup = true;
                // soundPlayEffect(getPlaySoundData("pop2_say"));
            }
        }

        tree.render();

        player.render();
        monsters.forEach(function(value){
            value.render();
            value.move();
            value.monsterObject.move();
        })

        scoreUI.render();
        timerUI.render();

        isStickerPopupKey = stickerPopup.IsKey();

        if(isGetReward == false && isEndPopup == false) stickerPopup.render();

        if(isEndPopup){
            isEndKeyTimer++
            if(isEndKeyTimer >= 45){
                isEndKey = true;
            }

            endPopup.render(resultCurPosition);
        }
    }

    function keyGameEnd(keyCode){
        if(isEndPopup == true && isEndKey == true){
            switch(keyCode){
                case VK_ENTER:
                    switch(resultCurPosition){
                        case 0:
                            setGameState(GAME_STATE.INGAME);
                            break;
                        case 1:
                            setGameState(GAME_STATE.TITLE);
                            break;
                    }
                    break;
                case VK_LEFT:
                    resultCurPosition--;
                    if(resultCurPosition < 0){
                        resultCurPosition = 1;
                    }
                    switch (resultCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("yes"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("no"));
                            break;
                    }
                    break;
                case VK_RIGHT:
                    resultCurPosition++;
                    if(resultCurPosition > 1){
                        resultCurPosition = 0;
                    }
                    switch (resultCurPosition)
                    {
                        case 0:
                            soundPlayEffect(getPlayCommonSound("yes"));
                            break;
                        case 1:
                            soundPlayEffect(getPlayCommonSound("no"));
                            break;
                    }
                    break;
                case VK_BACK:
                    break;
            }
        }else if (isGetReward == false && isStickerPopupKey == true){
            switch(keyCode){
                case VK_ENTER:
                    isGetReward = true;
                    isEndPopup = true;
                    sendDataGravity(insertRewardSticker, GAPI_INSERT_STICKER_A, "game_hangle_e", null);
                    break;
                }
        }
    }

    function endSoundPlay(){
        var randNum;
        var soundName;

        if(isSuccess){
            randNum = randomRange(1, 4);
            soundName = "kong_end_a" + randNum;
        }else{
            randNum = randomRange(1,3);
            soundName = "kong_end_b" + randNum;
        }
        endMaxFrame = endSoundFrameData[soundName];
        isEndSoundPlay = true;
        soundPlayEffect(getPlaySoundData(soundName));

    }

//#endregion

//#region Basic Func
    //게임 빌드 정보를 생성한다

    function gotoPortal()
    {
        setGameState( GAME_STATE.LOAD_JS );
        soundStopAll();

        clearBuffer(canvas_GameBG, context_GameBG );
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        function loadScriptSuccess()
        {
            // 이미지 제거
            //-----------------------
            clearArray(imgListGame);
            imgListGame = null;

            // 데이터 제거
            //-----------------------
            clearArray(sndListGame);
            sndListGame = null;

            kongApi.removeScriptFile("FruitMonster.js", "js");// 현재 게임 jsavaScript 제거
        }

        // 포탈 javaScript 실행
        kongApi.loadScript( "portal.js", loadScriptSuccess );// REAL
        // kongApi.loadScript( "ppportal.js", loadScriptSuccess );// TEST
    }

    function checkCollisionRect(x1, y1, w1, h1, x2, y2, w2, h2)
    {
        if(x1 + w1 >= x2 && x1 <= x2 + w2 && y1 + h1 >= y2 && y1 <= y2 + h2)
        {
            return true;
        }

        return false;
    }

    function randomRange(n1, n2)
    {
        return Math.floor(Math.random() * (n2 - n1 + 1)) + n1;
    }

    var lerpFunc = function(x, y, a){
        return x * (1 - a) + y * a;
    }

    function calculateFrameToScore(frame){
        var result = ((frame / 30).toFixed(2)) * 100;
        return Math.round(result);
    }

        //--------------------------------------
    //서버 API 콜백 함수들
    //--------------------------------------
    //랭킹데이터 조회
    function checkRankingResult(_retVal)
    {
        if( _retVal == 1 )
        {
            isLoadRankingData = true;
            console.log("rankingData load success....!");
        }
        else
        {
            // 실패
            console.log("rankingData load fail....!");
            setGlobalNetworkError( GAPI_CHECK_RANKING20, null );
        }
    }
    
    var insertScore = function (_retVal)
    {
        if( _retVal == 1 )
        {
            //실제 게임 종료시 로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_e", "END");
            console.log("insert Score success....!");
        }
        else
        {
            // 실패
            console.log("insert Score fail....!");
        }
    }

    //칭찬스티커 1일 수령 여부 조회
    function checkRewardSticker(_retVal)
    {
        if(_retVal == 1 && userInfo.sticker_A < 30)
        {
            //일일 칭찬스티커 미수령
            isGetReward = false;

            //실제 게임 시작시 시작로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_e", "START");
        }
        else if(_retVal == 2 || userInfo.sticker_A >= 30)
        {
            //일일 칭찬스티커 수령
            isGetReward = true;

            //실제 게임 시작시 시작로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_e", "START");
        }
        else
        {
            //실패
            console.log("reward Sticker data load fail....!");
        }
    }

    //칭찬스티커 갯수 업데이트
    function insertRewardSticker(_retVal)
    {
        if( _retVal == 1 )
        {
            console.log("insert Reward success....!");
        }
        else
        {
            // 실패
            console.log("insert Reward fail....!");
        }
    }
//#endregion
}

initGame();