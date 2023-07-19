kongApi.setTag("Jewels");//태그 설정

function initGame(){"use strict";

//#region Get & Set Info(Mainroop, GameData, ImageData)
    var GAME_STATE = {
        INIT : 0,
        LOAD_DATA : 1,
        TITLE : 2,
        INGAME : 5,
        LOAD_JS : 9,
        END : 10,
    }

    var nowState = GAME_STATE.INIT;

    //InGame Key Event Check Arr
    var keyDownArr = [];

    //키 이벤트 설정
    addKeyEventListener(gameKeyEvent);
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

                    loadXML( "Jewels/data/SoundData.xml", loadDataSound );
                }
                else
                {
                    imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
                }
            }
            imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
        }

        loadXML("Jewels/data/ImageData.xml", loadDataImage);
    }

    //스테이트 변경함수
    function setGameState(_state)
    {
        switch (_state)
        {
            case GAME_STATE.INIT:
                break;
            case GAME_STATE.LOAD_DATA:
                break;
            case GAME_STATE.TITLE:
                clearBuffer(canvas_TopLoading, context_TopLoading);
                soundPlayBGM(getPlaySoundData("bgm_title"));
                break;
            case GAME_STATE.INGAME:
                soundStopBGM();
                soundPlay("intro_a");
                inGameReset();
                break;
            case GAME_STATE.END:
                gameStart = false;
                break;
        }
        nowState = _state;
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
                case GAME_STATE.END:
                    drawGameEnd();
                    updateGameEnd();
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

                    case GAME_STATE.INGAME:
                        keyInGame(keyCode);
                        break;
                    case GAME_STATE.END:
                        keyGameEnd(keyCode);
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
//#endregion

//#region Title
    //-------------------------------------- 타이틀 스테이트 --------------------------------------//
    var rankingBtnClick = false;    //순위팝업
    var isLoadRankingData = false;  //랭킹 데이터 로드 완료
    var howBtnClick = false;        //게임 방법 팝업
    var menuCurPosition = 1;    //현재 메뉴 위치
    var firstConnect = true;

    var titleUI = new TitleUI("Jewels");
    var howPopup = new HowToPlayPopup("Jewels");
    var rankingPopup = new RankingPopup("Jewels");

    //타이틀 씬에서 그림을 그려줄 함수
    function drawTitle()
    {
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

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
        }else{
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
                                if(userInfo.isCashUser == false) sendDataGravity(null, GAPI_INSERT_GAMEYN, "game_hangle_d", null);

                                if(firstConnect == true)
                                {
                                    setGameState(GAME_STATE.INGAME);
                                }
                                break;
        
                            case 2:
                                rankingBtnClick = true;
                                isLoadRankingData = true;
                                sendDataGravity(checkRankingResult, GAPI_CHECK_RANKING20, "game_hangle_d", null);
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

//#region InGame
    var gameStart = false;          //게임이 시작되었는가?
    var exitBtnClick = false;       //나가기 버튼 클릭
    var quitBtnClick = false;       //그만하기 버튼 클릭
    var isStartPop = false;         //게임 시작전 시작 팝업을 보여줘야 하는가?
    var ingameCurPosition = 0;      //인게임에서 팝업 메뉴 버튼 위치
    var resultCurPosition = 0;      //게임 결과 팝업 메뉴 버튼 위치

    var isGetReward = false; //칭찬 스티커 획득 여부
    var isIntroAnim = true;
    var isWrongAns = false; // 오답 여부 확인

    var vowels = [
        {vowel : "ㅏ", index : 0},
        {vowel : "ㅑ", index : 1},
        {vowel : "ㅓ", index : 2},
        {vowel : "ㅕ", index : 3},
        {vowel : "ㅗ", index : 4},
        {vowel : "ㅛ", index : 5},
        {vowel : "ㅜ", index : 6},
        {vowel : "ㅠ", index : 7},
        {vowel : "ㅡ", index : 8},
        {vowel : "ㅣ", index : 9}
    ];
    var answerList = [];

    var maxAnswerCount = 3;
    var answerCount = 0;
    var isSuccess = false;

    var monster = new Monster();
    var siren_0 = new Siren(32, 138);
    var siren_1 = new Siren(1107, 138);

    var player = new Player();
    
    var jewelBoxPos = [[109, 324], [356, 387], [604, 324], [849, 387], [1097, 324], [170, 510], [418, 534], [653, 534], [911, 523], [1093.5, 543]];
    var jewelBoxes = []; // 총 10개
    
    var curCollBoxIdx = -1;
    var curCollJewelIdx = -1;
    
    var jewels = [];
    var jewelIdx = [0,1,2,3,4,5,6,7,8,9];

    var topJewel = [];
    var topJewelStartPos = [178, 152];
    var topJewelOffset = 95.5;

    var mapMinX = 0;
    var mapMaxX = 1050;
    var mapMinY = 150;
    var mapMaxY = 500;

    var effects = [new Effect(), new Effect(), new Effect(), new Effect(), new Effect()];
    var effectIndex = 0;

    var comboCount = 0;

    var timerUI = new TimerUI_Common("Jewels", 60);
    var scoreUI = new ScoreUI_Common("Jewels");
    var compSticker = new ComplimentSticker(context_GameBG, 65, 53);

    var startPopup = new StartPopup("Jewels");
    var exitPopup = new ExitPopup();

    function inGameReset()
    {
        sendDataGravity(checkRewardSticker, GAPI_CHECK_TODAYSTICKER, "game_hangle_d", null);
        
        ingameCurPosition = 0;
        resultCurPosition = 0;

        isSuccess = false;
        isWrongAns = false;

        vowels = [
            {vowel : "ㅏ", index : 0},
            {vowel : "ㅑ", index : 1},
            {vowel : "ㅓ", index : 2},
            {vowel : "ㅕ", index : 3},
            {vowel : "ㅗ", index : 4},
            {vowel : "ㅛ", index : 5},
            {vowel : "ㅜ", index : 6},
            {vowel : "ㅠ", index : 7},
            {vowel : "ㅡ", index : 8},
            {vowel : "ㅣ", index : 9}
        ];

        answerList = selectAnswer();

        maxAnswerCount = 3;
        answerCount = 0;

        monster = new Monster();
        siren_0 = new Siren(32, 138);
        siren_1 = new Siren(1107, 138);

        player = new Player();
    
        jewelBoxPos = [[109, 324], [356, 387], [604, 324], [849, 387], [1097, 324], [170, 510], [418, 534], [653, 534], [911, 523], [1093.5, 543]];
        jewelBoxes = []; // 총 10개
        
        curCollBoxIdx = -1;
        curCollJewelIdx = -1;
        
        jewels = [];
        jewelIdx = [0,1,2,3,4,5,6,7,8,9];

        topJewel = [];
        topJewelStartPos = [178, 152];
        topJewelOffset = 95.5;
            
        mapMinX = 0;
        mapMaxX = 1100;
        mapMinY = 150;
        mapMaxY = 500;

        effects = [new Effect(), new Effect(), new Effect(), new Effect(), new Effect()];
        effectIndex = 0;

        comboCount = 0;

        setBoxAndJewel();

        setTopJewel();

        scoreUI = new ScoreUI_Common("Jewels");   
        timerUI = new TimerUI_Common("Jewels", 60);
        compSticker = new ComplimentSticker(context_GameBG, 65, 53);
    
        startPopup = new StartPopup("Jewels");
        exitPopup = new ExitPopup();
    

        if(isIntroAnim == false){
            stopIntro();
        }
    }

    function updateInGame()
    {
        if(gameStart == true && isIntroAnim == false){
            if(timerUI.playTime <= 0){
                gameEnd();
            }
    
            if(answerCount >= maxAnswerCount){
                isSuccess = true;
                gameEnd();
            }


            jewels.forEach(function(value){
                value.move();
            })
            player.move();

            timerUI.playTime--;
        }else{
            monster.move();
            player.introMove();
        }

        jewelBoxes.forEach(function(value){
            value.move();
        })

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
                    exitBtnClick = false;
                    gameStart = true;
                    break;
            }
        }else if(isIntroAnim){
            if(keyCode == VK_ENTER || keyCode == VK_BACK){
                stopIntro();
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
            if(keyCode == VK_ENTER){
                isStartPop = false;
                gameStart = true;
            }
        }else{
            switch (keyCode)
            {
                case VK_UP:
                    if(player.curState == player.state.Run_B)
                        return;
                    player.setState("Run_B");
                    break;
                case VK_DOWN:
                    if(player.curState == player.state.Run_F)
                        return;
                    player.setState("Run_F");
                    break;
                case VK_LEFT:
                    if(player.curState == player.state.Run_L)
                        return;
                    player.setState("Run_L");
                    break;
                case VK_RIGHT:
                    if(player.curState == player.state.Run_R)
                        return;
                    player.setState("Run_R");
                    break;
                case VK_ENTER:
                    player.setState("Idle_F");
                    //Open Box
                    if(player.isCollisionBox && curCollBoxIdx != -1){
                        soundPlay("open");
                        effectPlay(jewelBoxes[curCollBoxIdx].posX - 40, jewelBoxes[curCollBoxIdx].posY - 30, "Open");
                        jewelBoxes[curCollBoxIdx].setState("Opened");
                        player.isCollisionBox = false;
                        //보석 생성 함수 
                        jewels[curCollBoxIdx].turnOn(jewelBoxes[curCollBoxIdx].posX, jewelBoxes[curCollBoxIdx].posY, randomRange(0, 3));

                        curCollBoxIdx = -1;
                    }

                    //Jewel Throw
                    if(player.isCollisionJewel && curCollJewelIdx != -1){
                        soundPlay("throw");
                        jewels[curCollJewelIdx].setState("GotoUI");
                        player.isCollisionJewel = false;
                        curCollJewelIdx = -1;
                    }

                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    gameStart = false;
                    break;
            }
        }
        
    }

    function renderBG(){
        context_GameBG.drawImage(getImageListGame("Background_Ingame"), 0, 0, 1280, 720);
        context_GameBG.drawImage(getImageListGame("Top_Jewel_Box"), 156, 126);

        siren_0.render();
        siren_1.render();

        // context_GameBG.save();
        // context_GameBG.globalAlpha = 0.3;
        // context_GameBG.drawImage(getImageListGame("Background_Draft"), 0, 0, 1280, 720);
        // context_GameBG.restore();
    }

    function renderMain(){
        if(isStartPop)
            startPopup.render();

        if(exitBtnClick)
            exitPopup.render(ingameCurPosition);

        topJewel.forEach(function(value){
            value.render();
        })

        monster.render();

        // box.render();
        jewelBoxes.forEach(function(value){
            value.render();
        })

        jewels.forEach(function(value){
            value.render();
        })

        player.render();

        effects.forEach(function(value){
            value.render();
        })
    }

    function renderUI(){
        timerUI.render();

        scoreUI.render();

        if(isGetReward == false) compSticker.render();

        if(isIntroAnim == true) context_GameMain.drawImage(getImageListGame("Intro_Skip_Btn"), 1120, 624);
    }

    function selectAnswer(){
        var answer = [];
        for(var i = 0; i < maxAnswerCount; i++){
            var randNum = randomRange(0, vowels.length - 1);
            answer.push(vowels[randNum].index);
            vowels.splice(randNum, randNum + 1);
        }
        return answer.sort();
    }

    function setBoxAndJewel(){
        var randNum;
        for(var i = 0; i < jewelBoxPos.length; i++){
            jewelBoxes.push(new JewelBox(jewelBoxPos[i][0], jewelBoxPos[i][1], i)); 
            randNum = randomRange(0, jewelIdx.length - 1);
            // jewels.push(new Jewel(i, jewelIdx[randNum], answerList.includes(jewelIdx[randNum])));
            jewels.push(new Jewel(i, jewelIdx[randNum], answerList.indexOf(jewelIdx[randNum]) != -1));
            jewelIdx.splice(randNum, 1);
        }
    }

    function setTopJewel(){
        for(var i = 0; i < 10; i++){
            topJewel.push(new TopJewel(topJewelStartPos[0] + i * topJewelOffset, topJewelStartPos[1], i, false));
        }
    }

    function gameEnd(){
        setGameState(GAME_STATE.END);
        if(isSuccess){
            soundPlay("win");
            player.setState("Win");
        }
        else{
            soundPlay("fail");
            player.setState("Fail");
        }

        if(isGetReward == true || isSuccess == false) {
            isEndPopup = true;
            stickerPopup.IsKeySet();
        }

        if(isWrongAns == false && isSuccess) scoreUI.addScore(5000);

        scoreUI.addScore(calculateFrameToScore(timerUI.playTime));
        
        endPopup.init(scoreUI.totalScore);
        sendDataGravity(insertScore, GAPI_INSERT_SCORE, "game_hangle_d", scoreUI.totalScore);
    }
    
    function stopIntro(){
        isStartPop = true;
        isIntroAnim = false;

        siren_0.stopAnim();
        siren_1.stopAnim();

        answerList.forEach(function(value){
            topJewel[value].isAnswer = true;
        })

        player.posX = 570;
        player.posY = 150;
        player.setState("Idle_F");
        
        monster.setState("End");

        jewelBoxes.forEach(function(value){
            value.setState("GotoPoint");
        })
        soundPlay("intro_e");
        soundPlayBGM(getPlaySoundData("bgm_game"));
    }

    function soundPlay(index){
        var randNum = -1;
        var soundText = "";
        switch(index){
            case "correct":
            case "start":
            case "intro_a":
            case "intro_c":
                randNum = randomRange(1, 2);
                soundText = index + randNum;
                break;
            case "fail":
                randNum = randomRange(1, 2);
                soundText = index + randNum;
                break;
            case "win":
                randNum = randomRange(1, 3);
                soundText = index + randNum;
                isWinSound = true;
                curSoundFrame = winSoundFrame[randNum];
                break;
            case "open":
            case "score":
            case "throw":
            case "wrong":
            case "precaution":
            case "intro_b":
            case "intro_e":
                soundText = index;
                break;
        }
        soundPlayEffect(getPlaySoundData(soundText));
    }

    function effectPlay(positionX, positionY, type){
        if(effects[effectIndex].isOn == true){
            effectIndex++;
            if(effectIndex >= effects.length){
                effectIndex = 0;
            }
            effects[effectIndex].on(positionX, positionY, type);
            return;
        }
        effects[effectIndex].on(positionX, positionY, type);
        effectIndex++;
        if(effectIndex >= effects.length){
            effectIndex = 0;
        }

    }

    function Player(){
        this.img;
        
        this.posX = -150;
        this.posY = 150;

        // this.speed = 10;
        this.speed = 8;

        this.isCollisionBox = false;
        this.isCollisionJewel = false;

        this.isIntroAnim = true;

        this.collisionArea = {
            x : 0,
            y : 0,
            w : 80,
            h : 100,
        }

        this.blinkTime = 90;
        this.blinkTimer = 0;
        this.isBlink = false;

        this.state = {
            Idle_B : 0,
            Idle_F : 1,
            Idle_L : 2,
            Idle_R : 3,
            Run_B : 4,
            Run_F : 5,
            Run_L : 6,
            Run_R : 7,
            Correct : 8,
            Wrong : 9,
            Precaution : 10,
            Win : 11,
            Fail : 12,
            Intro_Move_R : 13,
        }
        this.curState = this.state.Idle_F;

        this.animLen = {
            0 : 15,
            1 : 15,
            2 : 15,
            3 : 15,
            4 : 7,
            5 : 10,
            6 : 8,
            7 : 8,
            8 : 10,
            9 : 10,
            10 : 15,
            11 : 13,
            12 : 15,
            13 : 8,
        }

        this.curAnimLen = this.animLen[1];
        this.animIdx = 0;
        this.animFrame = 0;

        this.imgText = {
            0 : "Idle_B",
            1 : "Idle_F",
            2 : "Idle_L",
            3 : "Idle_R",
            4 : "Run_B",
            5 : "Run_F",
            6 : "Run_L",
            7 : "Run_R",
            8 : "Correct",
            9 : "Wrong",
            10 : "Precaution",
            11 : "Win",
            12 : "Fail",
            13 : "Run_R",
        }
        this.curImgText = this.imgText[1];

        this.render = function(){
            if(this.curImgText.indexOf("Idle") != -1 && this.curImgText.indexOf("_B") == -1
            && this.isBlink == false){
                this.blinkTimer++;

                if(this.blinkTimer >= this.blinkTime){
                    this.blinkTimer = 0;
                    this.animIdx = 0;
                    this.isBlink = true;
                }
            }

            if(this.isBlink && this.curImgText.indexOf("_Blink") == -1){
                this.curImgText += "_Blink";
            }else if(this.isBlink == false && this.curImgText.indexOf("_Blink") != -1){
                this.curImgText = this.curImgText.slice(0, this.imgText.indexOf("_Blink"));
            }

            this.img = getImageListGame(this.curImgText);

            if(this.img == undefined) return;

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);

            this.animFrame++;
            if(this.animFrame >= 2){
                if(this.animIdx <= this.curAnimLen && exitBtnClick != true && 
                    ((this.curState == this.state.Fail || this.curState == this.state.Precaution) && this.animIdx >= this.curAnimLen - 1) == false){
                    this.animIdx++;
                }
                if(this.animIdx > this.curAnimLen - 1){
                    this.animIdx = 0;

                    if(this.curState == this.state.Correct || this.curState == this.state.Wrong){
                        this.setState("Idle_F");
                    }
                }
                this.animFrame = 0;
            }
        }

        this.move = function(){
            this.collisionArea.x = this.posX + 35;
            this.collisionArea.y = this.posY + 40;

            switch(this.curState){
                case this.state.Run_B:
                    if(this.posY <= mapMinY){
                        this.posY = mapMinY;
                    }else{
                        this.posY -= this.speed;
                    }
                    break;
                case this.state.Run_F:
                    if(this.posY >= mapMaxY){
                        this.posY = mapMaxY;
                    }else{
                        this.posY += this.speed;
                    }
                    break;
                case this.state.Run_L:
                    if(this.posX <= mapMinX){
                        this.posX = mapMinX;
                    }else{
                        this.posX -= this.speed;
                    }
                    break;
                case this.state.Run_R:
                    if(this.posX >= mapMaxX){
                        this.posX = mapMaxX;
                    }else{
                        this.posX += this.speed;
                    }
                    break;
            }
        }

        this.setState = function(state){
            switch(state){
                case "Idle_B":
                    this.curState = this.state.Idle_B;
                    break;
                case "Idle_F":
                    this.curState = this.state.Idle_F;
                    break;
                case "Idle_L":
                    this.curState = this.state.Idle_L;
                    break;
                case "Idle_R":
                    this.curState = this.state.Idle_R;
                    break;
                case "Run_B":
                    this.curState = this.state.Run_B;
                    break;
                case "Run_F":
                    this.curState = this.state.Run_F;
                    break;
                case "Run_L":
                    this.curState = this.state.Run_L;
                    break;
                case "Run_R":
                    this.curState = this.state.Run_R;
                    break;
                case "Correct":
                    this.curState = this.state.Correct;
                    break;
                case "Wrong":
                    this.curState = this.state.Wrong;
                    break;
                case "Precaution":
                    this.curState = this.state.Precaution;
                    break;
                case "Win":
                    this.curState = this.state.Win;
                    break;
                case "Fail":
                    this.curState = this.state.Fail;
                    break;
                case "Intro_Move_R":
                    this.curState = this.state.Intro_Move_R;
                    break;
            }
            this.curImgText = this.imgText[this.curState];
            this.curAnimLen = this.animLen[this.curState];
            this.animIdx = 0;
            this.blinkTimer = 0;
            this.isBlink = false;
        }

        this.introMove = function(){
            if(this.curState == this.state.Intro_Move_R){
                if(this.posX <= 570){
                    this.posX += this.speed;
                }else{
                    stopIntro();
                }
            }
        }
    }

    function JewelBox(positionX, positionY, index){
        this.img;

        this.posX = 620;
        this.posY = 425;

        this.pointX = positionX;
        this.pointY = positionY;

        this.isOpen = false;
        this.alpha = 1;

        this.imgWIdx = 0;
        this.boxIndex = index;

        this.imgWidth = 77;
        this.imgHeight = 77;

        this.state = {
            OnCenter : 0,
            GotoPoint : 1,
            OnPoint : 2,
            Collision : 3,
            Opened : 4,
            Off : 5,
        }
        this.curState = this.state.Off;

        this.render = function(){
            if(this.curState == this.state.Off)
                return;

            if(this.curState == this.state.Collision) this.img = getImageListGame("Box_C");
            else this.img = getImageListGame("Box");

            if(this.isOpen == true){
                this.imgWIdx = 1;
                this.alpha -= 0.02;
            }

            if(this.alpha <= 0.1){
                this.setState("Off");
            }

            context_GameMain.save();
            context_GameMain.globalAlpha = this.alpha;
            drawSpriteImage(context_GameMain, this.img, this.imgWIdx, this.posX, this.posY);
            context_GameMain.restore();
        }

        this.move = function(){
            switch(this.curState){
                case this.state.GotoPoint:
                    this.posX = lerpFunc(this.posX, this.pointX, 0.1);
                    this.posY = lerpFunc(this.posY, this.pointY, 0.1);

                    if(Math.abs(this.posX - this.pointX) <= 0.1){
                        this.setState("OnPoint");
                    }
                    break;
                case this.state.OnPoint:
                    this.posX = this.pointX;
                    this.posY = this.pointY;
                    break;
            }

            this.checkCollisionPlayer();
        }

        this.setState = function(state){
            switch(state){
                case "OnCenter":
                    this.curState = this.state.OnCenter;
                    break;
                case "GotoPoint":
                    this.curState = this.state.GotoPoint;
                    break;
                case "OnPoint":
                    this.curState = this.state.OnPoint;
                    break;
                case "Collision":
                    this.curState = this.state.Collision;
                    break;
                case "Opened":
                    this.curState = this.state.Opened;
                    this.isOpen = true;
                    break;
                case "Off":
                    this.curState = this.state.Off;
                    break;
            }
        }

        this.checkCollisionPlayer = function(){
            if(checkCollisionRect(this.posX, this.posY, this.imgWidth, this.imgHeight, player.collisionArea.x, player.collisionArea.y, player.collisionArea.w, player.collisionArea.h)){
                if(player.isCollisionBox == false && this.curState == this.state.OnPoint && player.isCollisionJewel == false){
                    player.isCollisionBox = true;
                    curCollBoxIdx = this.boxIndex;
                    this.setState("Collision");
                }
            }else{
                if(this.curState == this.state.Collision && player.isCollisionBox == true){
                    player.isCollisionBox = false;
                    curCollBoxIdx = -1;
                    this.setState("OnPoint");
                }
            }
        }
    }

    function Jewel(index, answerIndex, isAnswer){
        this.img;
        this.imgText;

        this.posX = 0;
        this.posY = 0;

        this.index = index;
        this.answerIndex = answerIndex;

        this.topUIIndex = -1;

        this.state = {
            Appear : 0,
            Idle : 1,
            Collision : 2,
            GotoUI : 3,
            BounceOut : 4,
            Off : 5,
        }
        this.curState = this.state.Off;

        this.isAnswer = isAnswer;

        this.distX = 0;
        this.vy = -15;
        this.g = 1;

        this.randPointX = [-50, 70];//좌상, 좌하, 우상, 우하
        this.randPointY = [-50, 75]
        this.randTarget = [0, 0];

        this.gotoUITarget = [0, 0];

        this.bounceOutPos = 0;


        this.render = function(){
            if(this.curState == this.state.Off)
                return;

            this.imgText = "Jewel_" + (this.answerIndex + 1);
            
            if(this.curState == this.state.Collision){
                this.imgText += "_L"
            }

            this.img = getImageListGame(this.imgText);

            context_GameMain.drawImage(this.img, this.posX, this.posY);
        }

        this.move = function(){
            if(this.curState == this.state.Off)
                return;

            this.checkCollisionPlayer();
            switch(this.curState){
                case this.state.Appear:
                    //포물선 이동
                    if(Math.abs(this.posX - this.randTarget[0]) <= 1)
                        this.setState("Idle");

                    this.posX += (this.distX / 30);
                    this.vy += this.g;
                    this.posY += this.vy;

                    //해당 포인트와 충돌 체크

                    //충돌체크 확인 시  rand로 변경
                    break;
                case this.state.GotoUI:
                    this.posX = lerpFunc(this.posX, this.gotoUITarget[0], 0.15);
                    this.posY = lerpFunc(this.posY, this.gotoUITarget[1], 0.15);

                    if(Math.abs(this.posY - this.gotoUITarget[1] <= 1)){
                        if(this.isAnswer){
                            soundPlay("correct");
                            this.setState("Off");
                            effectPlay(this.posX - 70, this.posY - 70, "Correct");
                            topJewel[this.topUIIndex].isCorrect = true;
                            player.setState("Correct");

                            //UI관련 로직
                            timerUI.addPlayTime(5);
                            scoreUI.addScore(2000);

                            if(comboCount == 1) scoreUI.addScore(2000);
                            else if(comboCount == 2) scoreUI.addScore(4000);

                            comboCount++;
                            answerCount++;
                        }
                        else{
                            soundPlay("wrong");
                            effectPlay(this.posX - 70, this.posY - 70, "Wrong");
                            if(this.topUIIndex <= 4){
                                this.bounceOutPos = -250;
                            }else{
                                this.bounceOutPos = 1500;
                            }
                            this.setState("BounceOut");
                            player.setState("Wrong");

                            //UI관련 로직
                            timerUI.minusPlayTime(5);
                            isWrongAns = true;
                            scoreUI.minusScore(1000);
                            comboCount = 0;
                        }
                    }
                    break;
                case this.state.BounceOut:
                    if(Math.abs(this.bounceOutPos - this.posX) <= 20){
                        this.setState("Off");
                    }

                    this.posX += (this.distX / 15);
                    this.vy += this.g;
                    this.posY += this.vy;
                    break;

            }
        }

        this.setState = function(state){
            switch(state){
                case "Appear":
                    this.curState = this.state.Appear;
                    break;
                case "Idle":
                    this.curState = this.state.Idle;
                    break;
                case "Collision":
                    this.curState = this.state.Collision;
                    break;
                case "GotoUI":
                    this.curState = this.state.GotoUI;

                    if(this.isAnswer){{
                        this.gotoUITarget = topJewel[this.answerIndex].centerPos;
                        this.topUIIndex = this.answerIndex;
                    }
                    }else{
                        for(var i = 0; i < topJewel.length; i++){
                            if(topJewel[i].isAnswer == true && topJewel[i].isCorrect == false){
                                this.gotoUITarget = topJewel[i].centerPos;
                                this.topUIIndex = i;
                                break;
                            }
                        }
                    }
                    break;
                case "BounceOut":
                    this.curState = this.state.BounceOut;
                    this.distX = this.bounceOutPos - this.posX;
                    this.vy = -15;
                    this.g = 1;
                    break;
                case "Off":
                    this.curState = this.state.Off;
                    break;
            }
        }

        this.turnOn = function(positionX, positionY, appearType){
            this.posX = positionX;
            this.posY = positionY;

            switch(appearType){
                case 0:
                    this.randTarget[0] = this.posX + this.randPointX[0];
                    this.randTarget[1] = this.posY + this.randPointY[0];
                    this.vy = -25;      
                    this.g = 1.42;
                    break;
                case 1:
                    this.randTarget[0] = this.posX + this.randPointX[0];
                    this.randTarget[1] = this.posY + this.randPointY[1];  
                    this.vy = -20;      
                    this.g = 1.4;
                    break;
                case 2:
                    this.randTarget[0] = this.posX + this.randPointX[1];
                    this.randTarget[1] = this.posY + this.randPointY[0];
                    this.vy = -25;      
                    this.g = 1.42;        
                    break;
                case 3:
                    this.randTarget[0] = this.posX + this.randPointX[1];
                    this.randTarget[1] = this.posY + this.randPointY[1];      
                    this.vy = -20;      
                    this.g = 1.4;     
                    break;
            }

            this.distX = this.randTarget[0] - this.posX;
            this.setState("Appear");
        }

        this.turnOff = function(){
            this.posX = 0;
            this.posY = 0;

            this.randTarget = [0, 0];

            this.distX = 0;
            this.vy = -30;
            this.g = 2;
            
            this.setState("off");
        }

        this.checkCollisionPlayer = function(){
            if(checkCollisionRect(this.posX, this.posY, 50, 50, player.collisionArea.x, player.collisionArea.y, player.collisionArea.w, player.collisionArea.h)){
                if(player.isCollisionJewel == false && this.curState == this.state.Idle && player.isCollisionBox == false){
                    player.isCollisionJewel = true;
                    curCollJewelIdx = this.index;
                    this.setState("Collision");
                }
            }else{
                if(player.isCollisionJewel == true && this.curState == this.state.Collision){
                    player.isCollisionJewel = false;
                    curCollJewelIdx = -1;
                    this.setState("Idle");
                }
            }
        }
    }

    function Monster(){
        this.img;

        this.posX = -100;
        this.posY = 180;

        this.boxPosX = 0;
        this.boxPosY = 0;

        this.speed = 10;

        this.state = {
            Move_R : 0,
            MoveToStill : 1,
            MoveToCenter : 2,
            Laugh : 3,
            Surprise : 4,
            Jump : 5,
            End : 6,
        }
        this.curState = this.state.Move_R;

        this.imgText = {
            Idle_F : "Monster_Idle_F",
            Laugh_F : "Monster_Laugh_F",
            Laugh_S : "Monster_Laugh_S",
            Move_S : "Monster_Move_S",
            Surprise_F : "Monster_Surprise_F",
            Surprise_S : "Monster_Surprise_S",
        }
        this.curImgText = this.imgText.Move_S;

        this.animLen = {
            Idle_F : 15,
            Laugh_F : 10,
            Laugh_S : 10, 
            Move_S : 10, 
            Surprise_F : 8,
            Surprise_S : 10
        }
        this.curAnimLen = this.animLen.Move_S;

        this.animIdx = 0
        this.animFrame = 0;

        this.laughTime = 30;
        this.laughTimer = 0;

        this.boxDropTime = 25;
        this.boxDropTimer = 0;

        this.vy = -7;
        this.g = 1;
        this.randPositionY = 0;

        this.stillCount = 0;
        this.stillTarget = 0;
        this.isStill = false;

        this.distX = 0;
        this.distY = 0;

        this.render = function(){
            this.animFrame++;
            if(this.animFrame >= 2){
                this.animFrame = 0;
                this.animIdx++;
            }

            if(this.animIdx >= this.curAnimLen - 1){
                this.animIdx = 0;
            }

            if(this.curState == this.state.Laugh){
                this.laughTimer++;
            }
            if(this.laughTimer >= this.laughTime){
                // 콩순이 입장(왼쪽 중간), 도둑 놀람, 사이렌 울린, 보석함 바닥으로 떨어짐
                player.setState("Intro_Move_R");
                this.setState("Surprise");
                siren_0.playAnim();
                siren_1.playAnim();
                this.laughTimer = 0;
                soundPlay("intro_c");
            }

            this.img = getImageListGame(this.curImgText);

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX, this.posY);

            drawSpriteImage(context_GameMain, getImageListGame("Box"), 0, this.boxPosX, this.boxPosY);
        }

        this.move = function(){
            switch(this.curState){
                case this.state.Move_R:
                    this.posX += this.speed;
                    if(this.posX >= 40 && this.isStill == false){
                        this.setStillTarget(this.stillCount);
                    }
                    break;
                case this.state.MoveToStill:
                    if(this.stillTarget - this.posX <= 5){
                        this.setState("Jump");
                        this.vy = -7;
                        this.g = 1;
                        this.randPositionY = this.posY;
                    }

                    this.posX += this.speed;
                    break;
                case this.state.Jump:
                    this.vy += this.g;
                    this.posY += this.vy;

                    if(this.vy >= 0){
                        topJewel[answerList[this.stillCount]].isAnswer = true;
                    }

                    if(this.posY >= this.randPositionY){
                        this.posY = this.randPositionY;
                        this.stillCount++;
                        if(this.stillCount < 3){
                            this.setStillTarget(this.stillCount);
                        }else{
                            this.vy = -10;
                            this.g = 1;
                            this.setState("MoveToCenter");
                            this.distX = 640 - this.posX;
                            this.distY = 360 - this.posY;
                            this.isStill = true;
                        }
                    }
                    break;
                case this.state.MoveToCenter:
                    this.posX += (this.distX / 15);
                    this.posY += (this.distY / 15);

                    if(Math.abs(640 - this.posX) < 5 && Math.abs(360 - this.posY) < 5){
                        this.setState("Laugh");
                    }
                    break;
            }

            if(this.isStill == true && this.curState == this.state.Move_R)
            return;
            if(this.curState != this.state.Surprise){
                this.boxPosX = this.posX + 30;
                this.boxPosY = this.posY - 10;
            }else{
                this.boxDropTimer++;
                this.boxPosX -= 2;
                this.vy += this.g;
                this.boxPosY += this.vy;
                if(this.boxDropTimer >= this.boxDropTime){
                    effectPlay(this.boxPosX - 40, this.boxPosY - 50, "Drop");
                    this.boxPosX = -300;
                    this.boxDropTimer = 0;
                    this.setState("Move_R");
                    jewelBoxes.forEach(function(value){
                        value.setState("OnCenter");
                    })
                }
            }
        }

        this.setState = function(index){
            switch(index){
                case "Move_R":
                    this.curState = this.state.Move_R;
                    if(this.isStill == false){
                        this.curImgText = this.imgText.Move_S;
                        this.curAnimLen = this.animLen.Move_S;
                    }else{
                        this.curImgText = this.imgText.Surprise_S;
                        this.curAnimLen = this.animLen.Surprise_S;
                    }
                    break;
                case "MoveToStill":
                    this.curState = this.state.MoveToStill;
                    this.curImgText = this.imgText.Move_S;
                    this.curAnimLen = this.animLen.Move_S;
                    break;
                case "MoveToCenter":
                    this.curState = this.state.MoveToCenter;
                    this.curImgText = this.imgText.Laugh_F;
                    this.curAnimLen = this.animLen.Laugh_F;
                    break;
                case "Laugh":
                    this.curState = this.state.Laugh;
                    this.curImgText = this.imgText.Laugh_F;
                    this.curAnimLen = this.animLen.Laugh_F;
                    break;
                case "Surprise":
                    this.curState = this.state.Surprise;
                    this.curImgText = this.imgText.Surprise_F;
                    this.curAnimLen = this.animLen.Surprise_F;
                    break;
                case "Jump":
                    this.curState = this.state.Jump;
                    this.curImgText = this.imgText.Move_S;
                    this.curAnimLen = this.animLen.Move_S;
                    soundPlay("intro_b")
                    break;
                case "End":
                    this.curState = this.state.End;
                    this.posX = -500;
                    this.posY = -500;
                    break;
            }

            this.animIdx = 0;
        }

        this.setStillTarget = function(index){
            if(answerList.length <= 0)
                this.setStillTarget(index);

            this.stillTarget = topJewel[answerList[this.stillCount]].posX - 30
            this.setState("MoveToStill");
        }
    }

    function TopJewel(positionX, positionY, index, isAnswer){
        this.img;

        this.posX = positionX - 2;
        this.posY = positionY - 3;

        this.centerPos = [this.posX, this.posY];

        this.isAnswer = isAnswer;
        this.isCorrect = false;

        this.index = index;

        this.render = function(){
            if((this.isCorrect == false && this.isAnswer == false) || (this.isCorrect == true && this.isAnswer == true)){
                this.img = getImageListGame("Jewel_" + (this.index + 1));
                context_GameMain.drawImage(this.img, this.posX, this.posY);
            }
        }
    }

    function Siren(positionX, positionY){
        this.img;

        this.posX = positionX;
        this.posY = positionY;

        this.animLen = 6;
        this.animIdx = 0;
        this.animFrame = 0;
        this.isAnim = false;

        this.render = function(){
            this.img = getImageListGame("Siren");
            
            if(this.isAnim == true){
                this.animFrame++;
                if(this.animFrame >= 2){
                    this.animFrame = 0;
                    this.animIdx++;
                    if(this.animIdx >= this.animLen){
                        this.animIdx = 0;
                    }
                }
            }

            drawSpriteImage(context_GameBG, this.img, this.animIdx, this.posX, this.posY);
        }

        this.playAnim = function(){
            this.isAnim = true;
            this.animIdx = 0;
        }
        
        this.stopAnim = function(){
            this.isAnim = false;
            this.animIdx = 0;
        }
    }

    function Effect(){
        this.img;

        this.posX;
        this.posY;

        this.animLen = {
            "Drop" : 10,
            "Open" : 14,
            "Correct" : 14,
            "Wrong" : 9,
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

        this.on = function(positionX, positionY, type){
            this.isOn = true;

            switch(type){
                case "Drop":
                    break;
                case "Correct":
                    break;
                case "Open":
                    break;
                case "Wrong":
                    break;
            }

            this.imgText = type + "_Effect";
            this.curAnimLen = this.animLen[type];

            this.posX = positionX;
            this.posY = positionY;
            this.animIdx = 0;
        }

        this.off = function(){
            this.isOn = false;
        }
    }
    
//#endregion

//#region GameEnd
    var isWinSound = false;

    var endSoundFrame = 0;
    var winSoundFrame = {
        1 : 53,
        2 : 48,
        3 : 53
    }
    var curSoundFrame;

    var isEndPopup = false;

    var isEndKey = false;
    var isEndKeyTimer = 45;
    var isEndkeyCurTime = 0;

    var isStickerPopupKey = false;

    var stickerPopup = new StickerPopup();
    var endPopup = new EndScorePopup();

    function drawGameEnd(){
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        renderBG();

        jewelBoxes.forEach(function(value){
            value.render();
        })

        jewels.forEach(function(value){
            value.render();
        })
        player.render();

        if(isEndKey == false && isStickerPopupKey == true) isEndkeyCurTime++;

        if(isEndkeyCurTime >= isEndKeyTimer) isEndKey = true;

        timerUI.render();

        scoreUI.render();

        if(isGetReward == false) compSticker.render();

        isStickerPopupKey = stickerPopup.IsKey();

        if(isGetReward == false && isSuccess == true && isEndPopup == false) stickerPopup.render();
        if(isEndPopup) endPopup.render(resultCurPosition);
    }

    function updateGameEnd(){
        if(isWinSound){
            endSoundFrame++
        }
        if(endSoundFrame >= curSoundFrame){
            player.setState("Precaution");
            soundPlay("precaution");
            endSoundFrame = 0;
            isWinSound = false;
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
                    sendDataGravity(insertRewardSticker, GAPI_INSERT_STICKER_A, "game_hangle_d", null);
                    break;
                }
        }
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
            
            kongApi.removeScriptFile("Jewels.js", "js");// 현재 게임 jsavaScript 제거
        }

        isPageRefresh = true;

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
        if(frame <= 0)
            return 0;

        var result = ((frame / 30).toFixed(2)) * 100;
        return result;
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_d", "END");
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_d", "START");
        }
        else if(_retVal == 2 || userInfo.sticker_A >= 30)
        {
            //일일 칭찬스티커 수령
            isGetReward = true;

            //실제 게임 시작시 시작로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_d", "START");
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