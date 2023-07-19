kongApi.setTag("Cleaning");//태그 설정

function initGame(){"use strict";

//#region Get & Set Info(Mainroop, GameData, ImageData)
    var GAME_STATE = {
        INIT : 0,
        LOAD_DATA : 1,
        TITLE : 2,
        INGAME : 5,
        GAME_END : 6,
        LOAD_JS : 9
    }

    var nowState = GAME_STATE.INIT;

    var mapData = {};

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


                    //게임을 이닛하면서 게으름 귀신의 승천 횟수를 가져온다
                    loadXML( "Cleaning/data/SoundData.xml", loadDataSound );
                }
                else
                {
                    imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
                }
            }
            imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
        }

        function loadMapData(_response){
            mapData = {};
            kongApi.console_log("LoadMapData --------");

            mapData = JSON.parse(_response.responseText);

            loadXML("Cleaning/data/ImageData.xml", loadDataImage);
            kongApi.console_log("LoadMapData End <<<<<<<<<<<<");
        }

        loadXML("Cleaning/data/MapData.json", loadMapData);
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
                soundPlayBGM(getPlaySoundData("bgm_game"));
                inGameReset();
                break;
            case GAME_STATE.GAME_END:
                endPopup.init(scoreUI.totalScore, "game_arcade_b");
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

    var titleUI = new TitleUI("Cleaning");
    var howPopup = new HowToPlayPopup("Cleaning");
    var rankingPopup = new RankingPopup("Cleaning");

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
                                if(userInfo.isCashUser == false) sendDataGravity(null, GAPI_INSERT_GAMEYN, "game_arcade_b", null);

                                if(firstConnect == true)
                                {
                                    setGameState(GAME_STATE.INGAME);
                                }
                                break;
                            case 2:
                                rankingBtnClick = true;
                                isLoadRankingData = true;
                                sendDataGravity(checkRankingResult, GAPI_CHECK_RANKING20, "game_arcade_b", null);
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
    var isStartPop = true;         //게임 시작전 시작 팝업을 보여줘야 하는가?
    var ingameCurPosition = 0;      //인게임에서 팝업 메뉴 버튼 위치
    var resultCurPosition = 0;      //게임 결과 팝업 메뉴 버튼 위치

    var isGetReward = false; //칭찬 스티커 획득 여부

    var isSuccess = false;

    //카메라 이동을 위한 변수
    var camInt_X = 0;
    var camInt_Y = 0;
 
    var camMinInt_X = 30;
    var camMinInt_Y = -300;
    var camMaxInt_X = 1210;
    var camMaxInt_Y = 740;

    //맵 생성 관련 변수
    var mapIndex = 0;
    var curMapData = {};
    var mapString = "";
    var mapArr = [];
    var mapMinX = 0;
    var mapMaxX = 0;
    var mapMinY = 0;
    var mapMaxY = 0;
    var mapDepth = 0;

    var collisionArea = []; //맵 충돌영역
    var tempCollIdx = 0;    //맵 충돌중인 영역 갯수

    //Object
    var allObjPoint = [];   //전체 오브젝트(청소) 위치
    var cleanUpObj = [];    //쓰레기 오브젝트
    var objNameArr = [];    //오브젝트를 랜덤으로 생성하기 위한 변수

    var totalObjCount = 10;  //전체 오브젝트 갯수
    var curObjCount = 10;
    var cleaningBox = [];   //쓰레기통(나중에 분리수거 게임 / 쓰레기통 증가의 가능성이 있어 배열로 사용)

    //충돌중인 쓰레기통, 오브젝트 타입 저장 및 현 상태 확인
    var isCollisionBox = false;
    var curObjType = "";
    var isCatchingObj = false;

    //쓰레기를 들고 가만히 있는 시간 체크를 위한 변수
    var idleTime = 150;
    var idleTimer = 0;

    var player = new Player();

    //UI
    var scoreUI = new ScoreUI_Common("Cleaning");
    var timerUI = new TimerUI_Common("Cleaning", 150);
    var compSticker = new ComplimentSticker(context_GameMain, 230, 53, true);

    var exitPopup = new ExitPopup();
    var startPopup = new StartPopup("Cleaning");

    //Functions
    function inGameReset()
    {
        sendDataGravity(checkRewardSticker, GAPI_CHECK_TODAYSTICKER, "game_arcade_b", null);

        ingameCurPosition = 0;
        resultCurPosition = 0;
        
        isSuccess = false;

        isStartPop = true;

        player = new Player();

        camInt_X = 0;
        camInt_Y = 0;
    
        camMinInt_X = 30;
        camMinInt_Y = -300;
        camMaxInt_X = 1210;
        camMaxInt_Y = 740;

        //맵 생성 관련 변수
        mapIndex = 0;
        curMapData = {};
        mapString = "";
        mapArr = [];
        // mapMinX = -560;
        // mapMaxX = 1880;
        // mapMinY = -240;
        // mapMaxY = 1020;
        mapDepth = 0;


        collisionArea = [];
        tempCollIdx = 0;
    
        //Object
        allObjPoint = [];
        cleanUpObj = [];
        objNameArr = [];
    
        totalObjCount = 10;
        curObjCount = 10;
        cleaningBox = [];
    
        isCollisionBox = false;
        curObjType = "";
        isCatchingObj = false;

        mapSetting();

        idleTime = 150;
        idleTimer = 0;

        tempCollIdx = 0;
        curObjCount = 10;

        scoreUI = new ScoreUI_Common("Cleaning");
        timerUI = new TimerUI_Common("Cleaning", 150);
        // timerUI = new TimerUI_Common("Cleaning", 1);
        compSticker = new ComplimentSticker(context_GameMain, 230, 53);
    
    
        exitPopup = new ExitPopup();
        startPopup = new StartPopup("Cleaning");
    }
    
    function updateInGame()
    {
        if(gameStart && exitBtnClick == false && isStartPop == false){
            if(timerUI.playTime <= 0){
                gameEnd("fail");
            }else{
                timerUI.playTime--;
                if(timerUI.playTime == calculateSecToFrame(15)){
                    soundPlay("hurryup");
                }
            }
    
            if(curObjCount <= 0){
                gameEnd("win");
            }
    
            player.move();
            player.checkCollisionWall();

            if(isCatchingObj == true && player.curState == player.state.idle){
                idleTimer++;
                if(idleTimer >= idleTime){
                    soundPlay("where");
                    idleTimer = 0;
                }
            }
    
            if(cleanUpObj.some(function(value){ return value.curState == value.state.catch; })){
                isCatchingObj = true;
            }else{
                isCatchingObj = false;
            }
    
            if(cleaningBox.some(function(value){ return value.curState == value.state.collision; })){
                isCollisionBox = true;
            }else{
                isCollisionBox = false;
            }
        }

        cameraController();
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
        }else if(isStartPop){
            switch(keyCode){
                case VK_ENTER:
                    isStartPop = false;
                    gameStart = true;

                    cleanUpObj.forEach(function(value){
                        value.isSoundPlay = false;
                    })
                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    gameStart = false;
                    break;
            }
        }else if(player.isThrowing == false){
            switch (keyCode)
            {
                case VK_UP:
                    if(player.curState == player.state.move_U)
                        return;
                    player.setState("move_U");
                    break;
                case VK_DOWN:
                    if(player.curState == player.state.move_D)
                        return;
                    player.setState("move_D");
                    break;
                case VK_LEFT:
                    if(player.curState == player.state.move_L)
                        return;
                    player.setState("move_L");
                    break;
                case VK_RIGHT:
                    if(player.curState == player.state.move_R)
                        return;
                    player.setState("move_R");
                    break;
                case VK_ENTER:
                    if(isCatchingObj && isCollisionBox){
                        var tempIdx = -1;
                        cleanUpObj.forEach(function(value, index){
                            if(value.curState == value.state.catch && curObjType == value.type){
                                tempIdx = index;
                            }
                        })
    
                        if(tempIdx != -1){
                            //TODO(Object 던지는 애니메이션) -> 애니메이션 완료 후 오브젝트 제거
                            player.setState("throw");
                            soundPlay("waste_b")
                            cleanUpObj[tempIdx].curState = cleanUpObj[tempIdx].state.gotoBox;

                            cleanUpObj[tempIdx].boxDistX = (cleaningBox[0].centerPosX - cleanUpObj[tempIdx].img.width / 2) - cleanUpObj[tempIdx].posX;
                            timerUI.addPlayTime(3);
                        }
                    }
    
                    for(var i = 0; i < cleanUpObj.length; i++){
                        switch(cleanUpObj[i].curState){
                            case cleanUpObj[i].state.collision:
                                if(cleanUpObj[i].checkCollision(cleanUpObj[i].img)){
                                    cleanUpObj[i].curState = cleanUpObj[i].state.catch;
                                    cleanUpObj[i].isCatching = true;
                                    player.isCatching = true;
                                    curObjType = cleanUpObj[i].type;
                                    player.isCollisionItem = false;
                                    soundPlay("waste_a");
                                    player.effect.on("Pick_Effect", player.posX, player.posY);
    
                                    cleanUpObjStateSet(i);
                                    return;
                                }
                                else{
                                    cleanUpObj[i].curState = cleanUpObj[i].state.idle;
                                    cleanUpObj[i].isCollision = false;
                                }
                            case cleanUpObj[i].state.catch:
                                var isNowColl = cleanUpObj.some(function(value){
                                    return value.isCatching == false && value.state != value.state.cleaned && value.checkCollision(value.img);
                                })
                                if(!isCollisionBox && !isNowColl){
                                    cleanUpObj[i].curState = cleanUpObj[i].state.Idle;
                                    cleanUpObj[i].posY += 70;
                                    cleanUpObj[i].isCatching = false;
                                    player.isCatching = false;
                                    player.backToIdle();
                                    scoreUI.minusScore(10);
                                    return;
                                }
                                break;
                        }
                    }
                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    gameStart = false;
                    break;
            }
        }
    }

    function mapSetting(){
        //====================
        //Map
        //====================
        // mapIndex = randomRange(1, 4);
        mapIndex = 4;
        if(mapIndex == 1)
            mapDepth = 40;
        curMapData = mapData["map_0" + mapIndex];

        mapString = "BackGround0" + mapIndex;
        mapArr = [];
        mapArr.push(mapString + "_L01");
        mapArr.push(mapString + "_L02");
        mapArr.push(mapString + "_R01");
        mapArr.push(mapString + "_R02");

        mapMinX = mapData["mapArea"][0];
        mapMaxX = mapData["mapArea"][1];
        mapMinY = mapData["mapArea"][2];
        mapMaxY = mapData["mapArea"][3];

        //====================
        //Player
        //====================
        var posIdx = randomRange(1,4).toString();
        // var posIdx = "2";
        player.posX = curMapData["startPosition"][posIdx][0];
        player.posY = curMapData["startPosition"][posIdx][1];

        //====================
        //Box
        //====================
        var cleaningBoxData = curMapData["cleaningBoxPos"];
        var idx = randomRange(1, 3);
        // var idx = 2;
        cleaningBox = [];
        cleaningBox.push(new CleaningBox(cleaningBoxData[idx][0], cleaningBoxData[idx][1], "wastebasket"));

        //====================
        //Collision Area
        //====================
        var collisionData = curMapData["collisionArea"];
        collisionArea = [];
        for(var i = 1; i <= collisionData.length; i++){
            var tempArr = [];
            var temp = i + "";
            tempArr.push(collisionData[temp]["x"], collisionData[temp]["y"], collisionData[temp]["w"], collisionData[temp]["h"]);
            collisionArea.push(tempArr);
        }
        collisionArea.push([cleaningBox[0].posX + 7, cleaningBox[0].posY + 25, cleaningBox[0].imgWidth - 14, cleaningBox[0].imgHeight - 30]);
        console.log(" 맵 : " + mapIndex + "번\n", "플레이어 생성 위치 : " + posIdx + "번\n", "쓰레기통 생성 위치 : " + idx + "번");

        objectSetting();
    }

    function objectSetting(){
        var objIndex = 0;
        allObjPoint = [];
        cleanUpObj = [];
        objNameArr = [];

        curMapData["cleanObjPoints"].forEach(function(value){
            allObjPoint.push(value);
        })

        mapData["cleanUpObjName"].forEach(function(value){
            objNameArr.push(value);
        })
        //html5에서 사용 불가
        // allObjPoint = [...curMapData["cleanObjPoints"]];
        // objNameArr = [...mapData["cleanUpObjName"]];
        while(cleanUpObj.length < totalObjCount){
            var posIndex = randomRange(0, allObjPoint.length - 1);
            var nameIndex = randomRange(0, objNameArr.length - 1);
            cleanUpObj.push(new CleanUPObj(allObjPoint[posIndex][0], allObjPoint[posIndex][1], objNameArr[nameIndex], objIndex));
            objNameArr.splice(nameIndex, 1);
            allObjPoint.splice(allObjPoint.indexOf(allObjPoint[posIndex]), 1);
            objIndex++;
        }
    }

    function cameraController(){
        //카메라 이동 기능 제한 영역 설정
        if(player.posX < camMinInt_X){
            camInt_X = camMinInt_X;
        }else if(player.posX > camMaxInt_X){ 
            camInt_X = camMaxInt_X;
        }else{
            camInt_X = player.posX;
        }

        if(player.posY < camMinInt_Y){
            camInt_Y = camMinInt_Y;
        }else if(player.posY > camMaxInt_Y){
            camInt_Y = camMaxInt_Y;
        }else{
            camInt_Y = player.posY;
        }
    }

    function renderBG(){
        //context GameBG
        context_GameBG.save();
        context_GameBG.translate(canvas_GameBG.width / 2 - camInt_X, canvas_GameBG.height / 2 - camInt_Y);
        context_GameBG.drawImage(getImageListGame(mapArr[0]), -640, -360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[1]), -640, 360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[2]), 640, -360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[3]), 640, 360 + mapDepth);
        context_GameBG.restore();
    }

    function renderMain(){
        context_GameMain.save();
        context_GameMain.translate(canvas_GameBG.width / 2 - camInt_X, canvas_GameMain.height / 2 - camInt_Y);

        //Ingame Objects
        //Idle 상태의 Object
        cleanUpObj.forEach(function(value){
            if(value.curState != value.state.catch){
                value.render();
            }
        })

        player.render();

        cleaningBox.forEach(function(value){
            value.render();
            value.arrow.render();

        })

        cleanUpObj.forEach(function(value){
            if(value.curState == value.state.catch){
                value.render();
            }
        })

        player.effect.render();

        // 충돌 영역 확인
        // collisionArea.forEach(function(value){
        //     context_GameMain.beginPath();
        //     context_GameMain.globalAlpha = 0.4;
        //     context_GameMain.fillStyle = 'red';
        //     context_GameMain.rect(value[0], value[1], value[2], value[3]);
        //     context_GameMain.fill();
        // })

        //Catch 상태의 Object(오브젝트를 player위에 렌더링 하기 위해 따로 작성)

        
        context_GameMain.restore();
    }

    function renderUI(){
        //UI
        // drawText(context_GameMain, "yellow", 30, curObjCount + " / " + totalObjCount, 0, 30, TEXT_ALIGN_LEFT);
        context_GameMain.drawImage(getImageListGame("UI_Garbage"), 55, 43);
        if(curObjCount == 10){
            drawSpriteImage(context_GameMain, getUIImageListGame("UI_Num"), 1, 118, 57);
            drawSpriteImage(context_GameMain, getUIImageListGame("UI_Num"), 0, 136, 57);
        }else{
            drawSpriteImage(context_GameMain, getUIImageListGame("UI_Num"), curObjCount, 136, 57);
        }

        scoreUI.render();
        timerUI.render();

        if(isGetReward == false) compSticker.render();

        if(isStartPop) startPopup.render();

        if(exitBtnClick) exitPopup.render(ingameCurPosition);
    }

    function soundPlay(index){
        var randNum;
        var soundText;
        switch(index){
            case "where":
                randNum = randomRange(1, 2);
                soundText = "where" + randNum;
                break;
            case "hurryup":
                randNum = randomRange(1, 2);
                soundText = "hurryup" + randNum;
                break;
            case "waste":
                randNum = randomRange(1, 2);
                soundText = "waste" + randNum;
                break;
            case "waste_a":
                randNum = randomRange(1, 2);
                soundText = "waste_a" + randNum;
                break;
            case "waste_b":
                soundText = "waste_b";
                break;
            case "waste_c":
                soundText = "waste_c";
                break
            case "win":
                randNum = randomRange(1, 2);
                soundText = "mission_success" + randNum;
                break;
            case "fail":
                randNum = randomRange(1, 2);
                soundText = "mission_fail" + randNum;
                break;
        }
        soundPlayEffect(getPlaySoundData(soundText));
    }

    function gameEnd(state){
        gameStart = false;

        player.setState(state);
        soundPlay(state);

        if(state == "win") {
            scoreUI.addScore(calculateFrameToScore(timerUI.playTime));
            isSuccess = true;
        }
        setGameState(GAME_STATE.GAME_END);
        if(isGetReward == true || isSuccess == false){
            stickerPopup.IsKeySet();
            isEndPopup = true;
        } 
        sendDataGravity(insertScore, GAPI_INSERT_SCORE, "game_arcade_b", scoreUI.totalScore);

    }

    function cleanUpObjStateSet(index){
        for(var i = 0; i < cleanUpObj.length; i++){
            if(index == i) continue;
            if(cleanUpObj[i].curState == cleanUpObj[i].state.cleaned) continue;
            
            cleanUpObj[i].curState = cleanUpObj[i].state.Idle;
        }
    }

    //Objects
    function Player(){
        this.img;
        this.imgText = "";

        this.posX = 0;
        this.posY = 0;

        this.pastPosX = 0;
        this.pastPosY = 0;

        this.halfWidth = 75;
        this.halfHeight = 90;

        this.speed = 10;

        this.isBlink = false;
        this.isWaitBlink = false;
        this.blinkTime = 90;
        this.blinkTimer = 0;

        this.isCatching = false;
        this.isThrowing = false;
        this.isCollisionItem = false;
        this.isCollisionBox = false;

        this.state = {
            idle_F : 0,
            idle_B : 1,
            idle_L : 2,
            idle_R : 3,
            move_L : 4,
            move_R : 5,
            move_U : 6,
            move_D : 7,
            throw : 8,
            win : 9,
            fail : 10,
        }
        this.curState = this.state.idle;
        this.pastState = this.state.move_D;

        //Animation의 Image가 너무 많아 최대값으로 사용
        this.anim = {
            idle_F : 30,
            idle_B : 30,
            idle_L : 30,
            idle_R : 30,
            throw : 30,
            walk_B : 30,
            walk_F : 30,
            walk_L : 30,
            walk_R : 30,
            win : 25,
            fail : 35,
            end_idle : 30,
        }
        this.curAnim = this.anim.idle_F;

        this.animIndex = 0;

        this.objCollisionArea = {
            x : this.posX - 24,
            y : this.posY - 30,
            w : 40,
            h : 90
        }

        this.isEndIdle = false;

        this.effect = new Effect();

        this.render = function(){
            this.objCollisionArea.x = this.posX - 18;
            this.objCollisionArea.y = this.posY - 20;

            this.imgText = "Idle_F";

            switch(this.curState){
                case this.state.idle_F:
                    this.imgText = "Idle_F";
                    this.curAnim = this.anim.idle_F;
                    break;
                case this.state.idle_B:
                    this.imgText = "Idle_B";
                    this.curAnim = this.anim.idle_B;
                    break;
                case this.state.idle_L:
                    this.imgText = "Idle_L";
                    this.curAnim = this.anim.idle_L;
                    break;
                case this.state.idle_R:
                    this.imgText = "Idle_R";
                    this.curAnim = this.anim.idle_R;
                    break;
                case this.state.move_D:
                    this.imgText = "Walk_F";
                    this.curAnim = this.anim.walk_F;
                    break;
                case this.state.move_U:
                    this.imgText = "Walk_B";
                    this.curAnim = this.anim.walk_B;
                    break;
                case this.state.move_L:
                    this.imgText = "Walk_L";
                    this.curAnim = this.anim.walk_L;
                    break;
                case this.state.move_R:
                    this.imgText = "Walk_R";
                    this.curAnim = this.anim.walk_R;
                    break;
                case this.state.throw:
                    this.imgText = "Throw";
                    this.curAnim = this.anim.throw
                    break; 
                case this.state.win:
                    this.imgText = "Win";
                    this.curAnim = this.anim.win
                    break;
                case this.state.fail:
                    this.imgText = "Fail";
                    this.curAnim = this.anim.fail
                    break;
            }

            if((this.imgText.indexOf("Walk") != -1 || this.imgText.indexOf("Idle") != -1)
            && this.isCatching == true){
                this.imgText += "_C";
            }else if(this.imgText.indexOf("_C") != -1 && this.isCatching == false){
                this.imgText = this.imgText.slice(0, this.imgText.indexOf("_C"));
            }

            if(this.isBlink && this.imgText.indexOf("_Blink") == -1 && this.curState != this.state.win && this.curState != this.state.fail && this.imgText.indexOf("_B") == -1){
                this.imgText += "_Blink";
            }else if(this.imgText.indexOf("_Blink") != -1 && this.isBlink == false){
                this.imgText = this.imgText.slice(0, this.imgText.indexOf("_Blink"));
            }

            if(this.isBlink == false && this.isThrowing == false && this.isWaitBlink == false){
                this.blinkTimer++;
                if(this.blinkTimer >= this.blinkTime){
                    this.blinkTimer = 0;
                    this.isWaitBlink = true;
                }
            }

            if(this.isEndIdle){
                if(this.imgText.indexOf("_Idle") == -1){
                    this.imgText += "_Idle";
                    this.curAnim = this.anim.end_idle;
                }

                if(this.isBlink && this.curState == this.state.fail){
                    this.imgText += "_Blink";
                }
            }
            this.img = getImageListGame(this.imgText);

            if(this.img == null || this.img == undefined){
                console.log(this.imgText + "이미지가 없습니다.");
                return;
            }

            drawSpriteImage(context_GameMain, this.img, this.animIndex, this.posX - this.halfWidth, this.posY - this.halfHeight);

            if(this.imgText.indexOf("Walk") != -1){
                this.animIndex += 2;
            }
            else{
                this.animIndex += 1;
            }

            if(this.animIndex >= this.curAnim){
                if(this.isBlink){
                    this.isBlink = false;
                }

                if(this.imgText.indexOf("Throw") != -1){
                    this.setState("idle_F");
                    this.isCatching = false;
                    this.isThrowing = false;
                }

                if(this.curState == this.state.win || this.curState == this.state.fail){
                    this.isEndIdle = true;
                }

                if(this.isWaitBlink == true){
                    this.isBlink = true;
                    this.isWaitBlink = false;
                }

                this.animIndex = 0;
            }

            // context_GameMain.beginPath();
            // context_GameMain.globalAlpha = 0.4;
            // context_GameMain.fillStyle = 'red';
            // context_GameMain.rect(player.posX - player.halfWidth + 40, player.posY - player.halfHeight + 25, player.halfWidth * 2 - 80, player.halfHeight * 2 - 45);
            // context_GameMain.fill();

            // context_GameMain.fillRect(this.posX- player.halfWidth, this.posY- player.halfHeight, 5, 5);
            // console.log(this.posX - player.halfWidth, this.posY - player.halfHeight);
        }

        this.move = function(){   
            //캐릭터 움직임에 따른 배경 움직임을 위한 기능
            context_GameBG.save();
            context_GameBG.translate(this.posX - canvas_GameBG.width / 2, this.posY - canvas_GameBG.height / 2);
            context_GameBG.restore();

            switch(this.curState){
                case this.state.move_L:
                    if(this.posX - this.halfWidth <= mapMinX){
                        this.backToIdle();
                        this.posX = mapMinX + this.halfWidth;
                    }else{
                        this.posX -= this.speed;
                    }
                    break;
                case this.state.move_R:
                    if(this.posX + this.halfWidth >= mapMaxX){
                        this.backToIdle();
                        this.posX = mapMaxX - this.halfWidth;
                    }else{
                        this.posX += this.speed;
                    }
                    break;
                case this.state.move_U:
                    if(this.posY - this.halfHeight <= mapMinY){
                        this.backToIdle();
                        this.posY = mapMinY + this.halfHeight;
                    }else {
                        this.posY -= this.speed;
                    }
                    break;
                case this.state.move_D:
                    if(this.posY + this.halfHeight >= mapMaxY){
                        this.backToIdle();
                        this.posY = mapMaxY - this.halfHeight;
                    }else{
                        this.posY += this.speed;
                    }
                    break;
            }
        }

        this.checkCollisionWall = function(){
            //캐릭터 충돌 체크
            tempCollIdx = collisionArea.filter(function(value){
                return checkCollisionRect(player.posX - player.halfWidth + 40, player.posY - player.halfHeight + 25, player.halfWidth * 2 - 80, player.halfHeight * 2 - 50, value[0], value[1], value[2], value[3]);
            }).length;

            if(tempCollIdx > 0){
                this.backToIdle();
                this.posX = this.pastPosX;
                this.posY = this.pastPosY;
            }else{
                this.pastPosX = this.posX;
                this.pastPosY = this.posY;
            }
        }

        this.checkCollisionObj = function(){
            
        }

        this.setState = function(state){
            this.pastState = this.curState;
            switch(state){
                case "idle_F":
                    this.curState = this.state.idle_F;
                    idleTimer = 0;
                    break;
                case "idle_B":
                    this.curState = this.state.idle_B;
                    idleTimer = 0;
                    break;
                case "idle_L":
                    this.curState = this.state.idle_L;
                    idleTimer = 0;
                    break;
                case "idle_R":
                    this.curState = this.state.idle_R;
                    idleTimer = 0;
                    break;
                case "move_L":
                    this.curState = this.state.move_L;
                    break;
                case "move_R":
                    this.curState = this.state.move_R;
                    break;
                case "move_U":
                    this.curState = this.state.move_U;
                    break;
                case "move_D":
                    this.curState = this.state.move_D;
                    break;
                case "throw":
                    this.curState = this.state.throw;
                    this.isThrowing = true;
                    break;
                case "win":
                    this.curState = this.state.win;
                    break;
                case "fail":
                    this.curState = this.state.fail;
                    break;
            }
            this.animIndex = 0;
            this.isBlink = false;
        }

        this.backToIdle = function(){
            switch(this.curState){
                case this.state.move_D:
                    this.setState("idle_F");
                break;
                case this.state.move_U:
                    this.setState("idle_B");
                break;
                case this.state.move_L:
                    this.setState("idle_L");
                break;
                case this.state.move_R:
                    this.setState("idle_R");
                break;
            }
        }
    }

    function CleanUPObj(positionX, positionY, objectName, index){
        this.img;

        this.posX = positionX;
        this.posY = positionY;

        this.num = index;
        this.type = objectName.slice(0, objectName.indexOf("_"));
        this.objectName = objectName.slice(objectName.indexOf("_") + 1, objectName.length);

        this.isSoundPlay = true;

        this.state = {
            Idle : 0,
            collision : 1,
            catch : 2,
            gotoBox : 3,
            cleaned : 4,
        }
        this.curState = this.state.Idle;

        this.isCollision = false;
        this.isCatching = false;

        this.timer = 0;
        this.boxDistX;
        this.vy = -30;
        this.g = 2;

        this.render = function(){
            this.img = getImageListGame(objectName);

            if(this.checkCollision(this.img) && this.curState != this.state.catch
            && player.isCatching == false && this.isCatching == false){
                this.curState = this.state.collision;
                if(player.isCollisionItem == false){
                    this.isCollision = true;
                    player.isCollisionItem = true;
                    player.backToIdle();
                }

                if(this.isSoundPlay == false){
                    soundPlay("waste");
                    this.isSoundPlay = true;
                }
            }else if(this.curState != this.state.catch && this.isCollision == true && this.isCatching == false){
                this.curState = this.state.idle;
                this.isCollision = false;
                player.isCollisionItem = false;
            }

            switch(this.curState){
                case this.state.collision:
                    context_GameMain.lineWidth = 3;
                    context_GameMain.strokeStyle = "white";
                    context_GameMain.strokeRect(this.posX, this.posY, this.img.width, this.img.height);
                    break;
                case this.state.catch:
                    this.offsetX = 0;
                    this.offsetY = 0;

                    switch(player.curState){
                        case player.state.move_L:
                        case player.state.idle_L:
                            this.offsetX = -25;
                            this.offsetY = 0;
                            break;
                        case player.state.move_R:
                        case player.state.idle_R:
                            this.offsetX = 25;
                            this.offsetY = 0;
                            break;
                        case player.state.move_U:
                            break;
                        case player.state.move_D:
                            this.offsetX = 2;
                            this.offsetY = 0;
                            break;
                    }
                    this.posX = player.posX - this.img.width / 2 + this.offsetX;
                    this.posY = player.posY - this.img.height / 2 + this.offsetY;
                    break;
                case this.state.gotoBox:
                    this.posX += this.boxDistX / 30;
                    this.vy += this.g;
                    this.posY += this.vy;

                    this.timer++;
                    if(this.checkCollisionBox(this.img)){
                        if(cleanUpObj[this.num].curState == cleanUpObj[this.num].state.cleaned)
                            return;
                        cleanUpObj[this.num].curState = cleanUpObj[this.num].state.cleaned;
                        scoreUI.addScore(200);
                        soundPlay("waste_c");
                        curObjCount--;
                        player.isCatching = false;
                        cleaningBox[0].effect.on("In_Effect", cleaningBox[0].posX + 30, cleaningBox[0].posY + 50);
                        this.vy = -30;
                    }

                    break;
            }

            if(this.curState == this.state.cleaned || 
                (player.curState == player.state.idle_B && this.curState == this.state.catch) || 
                (player.curState == player.state.move_U && this.curState == this.state.catch))
                return;

            if(this.img == undefined)
                return;

            context_GameMain.drawImage(this.img, this.posX, this.posY);
        }

        this.checkCollision = function(image){
            return checkCollisionRect(this.posX, this.posY, image.width, image.height, player.objCollisionArea.x, player.objCollisionArea.y, player.objCollisionArea.w, player.objCollisionArea.h);
        }

        this.checkCollisionBox = function(image){
            return checkCollisionRect(this.posX, this.posY, image.width, image.height, cleaningBox[0].collisionArea.x, cleaningBox[0].collisionArea.y, cleaningBox[0].collisionArea.w, cleaningBox[0].collisionArea.h);
        }
    }

    function CleaningBox(positionX, positionY, type){
        this.posX = positionX;
        this.posY = positionY;

        this.imgWidth = 80;
        this.imgHeight = 123;
        this.imgWCount = 0;

        this.centerPosX = this.posX + this.imgWidth / 2;

        this.collisionArea = {
            x : this.posX + 5,
            y : this.posY + 33,
            w : this.imgWidth - 10,
            h : 50, 
        }

        this.type = type;

        this.state = {
            idle : 0,
            collision : 1,
        }
        this.curState = this.state.idle;

        this.isCollision = false;

        this.effect = new Effect();

        this.arrow = new CleaningBoxArrow(this);

        this.render = function(){
            this.img = getImageListGame("Wastebasket");

            if(this.checkCollision()){
                if(player.isCollisionBox == false){
                    this.curState = this.state.collision;
                    this.imgWCount = 1;
                    this.isCollision = true;
                    player.isCollisionBox = true;
                    player.backToIdle();
                }
            }else{
                this.curState = this.state.idle;
                player.isCollisionBox = false;
                this.imgWCount = 0;
            }

            if(this.img == undefined)
                return;
            
            drawSpriteImage(context_GameMain, this.img, this.imgWCount, this.posX, this.posY);

            // context_GameMain.beginPath();
            // context_GameMain.globalAlpha = 0.4;
            // context_GameMain.fillStyle = 'red';
            // context_GameMain.rect(this.posX + 7, this.posY + 25, this.img.clipWidth - 14, this.imgHeight - 30);
            // context_GameMain.fill();

            this.effect.render();
        }

        this.checkCollision = function(){
            return checkCollisionRect(this.posX - 80, this.posY - 20, this.img.clipWidth * 3, this.imgHeight + 80, player.objCollisionArea.x, player.objCollisionArea.y, player.objCollisionArea.w, player.objCollisionArea.h);
        }
    }

    function CleaningBoxArrow(cleaningBox){
        this.img;
        this.imgWidth = 64;
        this.imgHeight = 74;

        this.posX = cleaningBox.posX + cleaningBox.imgWidth / 2 - this.imgWidth / 2;
        this.posY = cleaningBox.posY - cleaningBox.imgHeight / 2 - 10;

        this.animPos = [0,0,3,3,6,6,9,9,12,12,9,9,6,6,3,3,0,0];
        this.animIndex = 0;

        this.render = function(){
            this.img = getImageListGame("Arrow_Down");

            this.animIndex++;
            if(this.animIndex >= this.animPos.length)
                this.animIndex = 0;

            if(this.img == undefined)
                return;
            
            context_GameMain.drawImage(this.img, this.posX, this.posY + this.animPos[this.animIndex]);
        }
    }

    function Effect(){
        this.img;
        this.imgText = "";

        this.posX;
        this.posY;

        this.animLen = {
            "In_Effect" : 23,
            "Pick_Effect" : 14,
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
                this.animFrame = 0;
            }

            this.img = getImageListGame(this.imgText);

            if(this.animIdx > this.curAnimLen - 1){
                this.animIdx = 0;
                this.off();
                return;
            }

            drawSpriteImage(context_GameMain, this.img, this.animIdx, this.posX - this.img.clipWidth / 2, this.posY - this.img.clipHeight / 2);
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
//#endregion

//#region GameEnd
    var isEndPopup = false;
    var isEndKey = false;
    var isEndKeyTimer = 45;
    var isEndkeyCurTime = 0;

    var isStickerPopupKey = false;

    var endPopup = new EndScorePopup();
    var stickerPopup = new StickerPopup();

    function drawGameEnd(){
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        //context GameBG
        context_GameBG.save();
        context_GameBG.translate(canvas_GameBG.width / 2 - camInt_X, canvas_GameBG.height / 2 - camInt_Y);
        context_GameBG.drawImage(getImageListGame(mapArr[0]), -640, -360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[1]), -640, 360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[2]), 640, -360 + mapDepth);
        context_GameBG.drawImage(getImageListGame(mapArr[3]), 640, 360 + mapDepth);
        context_GameBG.restore();

        context_GameMain.save();
        context_GameMain.translate(canvas_GameBG.width / 2 - camInt_X, canvas_GameMain.height / 2 - camInt_Y);

        player.render();
        context_GameMain.restore();

        renderUI();

        if(isEndKey == false && isStickerPopupKey == true) isEndkeyCurTime++;

        if(isEndkeyCurTime >= isEndKeyTimer) isEndKey = true;

        isStickerPopupKey = stickerPopup.IsKey();


        if(isGetReward == false && isSuccess == true && isEndPopup == false) stickerPopup.render();

        if(isEndPopup) endPopup.render(resultCurPosition);
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
                    sendDataGravity(insertRewardSticker, GAPI_INSERT_STICKER_A, "game_arcade_b", null);
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

            kongApi.removeScriptFile("Cleaning.js", "js");// 현재 게임 jsavaScript 제거
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_arcade_b", "END");
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_arcade_b", "START");
        }
        else if(_retVal == 2 || userInfo.sticker_A >= 30)
        {
            //일일 칭찬스티커 수령
            isGetReward = true;

            //실제 게임 시작시 시작로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_arcade_b", "START");
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