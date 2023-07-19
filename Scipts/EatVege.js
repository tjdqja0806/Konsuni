kongApi.setTag("EatVege");

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

    //InGame Key Event Check Arr
    var keyDownArr = [];

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

                    loadXML( "EatVege/data/SoundData.xml", loadDataSound );
                }
                else
                {
                    imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
                }
            }
            imgListGame.push(loadImage(tempList[tempLoadCount].attributes["Tag"].value, tempList[tempLoadCount].attributes["Url"].value, wp_EndLoad));
        }

        loadXML("EatVege/data/ImageData.xml", loadDataImage);
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
                gameStart = true;
                soundPlayBGM(getPlaySoundData("bgm_game"));
                // soundPlay("game_start");
                inGameReset();
                break;
            case GAME_STATE.GAME_END:
                endPopup.init(scoreUI.totalScore, "game_arcade_c");
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
//#endregion

//#region Title
    //-------------------------------------- 타이틀 스테이트 --------------------------------------//
    var rankingBtnClick = false;    //순위팝업
    var isLoadRankingData = false;  //랭킹 데이터 로드 완료
    var howBtnClick = false;        //게임 방법 팝업
    var menuCurPosition = 1;    //현재 메뉴 위치
    var firstConnect = true;


    var titleUI = new TitleUI("EatVege");
    var howPopup = new HowToPlayPopup("EatVege");
    var rankingPopup = new RankingPopup("EatVege");

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
                                if(userInfo.isCashUser == false) sendDataGravity(null, GAPI_INSERT_GAMEYN, "game_arcade_c", null);

                                if(firstConnect == true)
                                {
                                    setGameState(GAME_STATE.INGAME);
                                }
                                break;
        
                            case 2:
                                sendDataGravity(checkRankingResult, GAPI_CHECK_RANKING20, "game_arcade_c", null);
                                rankingBtnClick = true;
                                isLoadRankingData = true;
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
    var ingameCurPosition = 0;      //인게임에서 팝업 메뉴 버튼 위치
    var resultCurPosition = 0;      //게임 결과 팝업 메뉴 버튼 위치
    var isStartPop = true;         //게임 시작전 시작 팝업을 보여줘야 하는가?
    var isCheck = false;            //퍼즐 2Match 확인중인것을 체크하기 위한 변수
    var isItemSound = false;        //Item Sound 재생을 위한 변수

    var isGetReward = false;

    var isSuccess = false;

    var newLineMaxTimer = calculateSecToFrame(18);
    var newLineCount = 0;
    var newLineTimer = 0;
    
    //퍼즐 관련 변수
    var vegeType = ["broccoli", "pumpkin", "mushroom", "onion"];
    var puzzleObjSize = 76;
    var puzzleColumn = 7; //퍼즐 가로 줄
    var puzzleRow = 7; //퍼즐 새로 줄
    var puzzleArr = [ //puzzle[Y][X] 첫 블록 생성을 위한 배열
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0,],
    ]

    var puzzleObjects = [];//실제 퍼즐 필드 오브젝트 배열
    var startPosX = 240;//퍼즐 필드 초기 위치
    var startPosY = 114;//퍼즐 필드 초기 위치
    //퍼즐 오브젝트 생성
    for(var i = 0; i < puzzleArr.length; i++){
        var curObj = [];
        for(var j = 0; j < puzzleArr[i].length; j++){
            curObj.push(new Block(j, i, puzzleArr[i][j]))
        }
        puzzleObjects.push(curObj);
    }

    var curPuzzleObj = new Block(3, -1, randomRange(0, vegeType.length - 1));
    var nextPuzzleObj = new Block(10.2, 0.3, randomRange(0, vegeType.length - 1));
    var curXIndex = 3;
    var curYIndex = -1;

    //인게임 생성 변수
    var isThreeBlock = false;
    var isFourBlock = false;

    var isToothpaste = false;//치약 아이템 생성 값
    var isToothpaste_R = false;//무지개 치약 아이템 생성 값
    var isCheck = false;
    var isNone = false//필드에 블록이 있는지 없는지 확인

    var comboCount = 0;
    var boomItemCount = 0;

    var lastBlockPosX = 0;
    var lastBlockPosY = 0;

    //필드상의 블록이 너무 적을 때에 블록 추가기능을 사용하기 위한 변수
    var lineCooldown = calculateSecToFrame(2);
    var lineCooldownIndex = 0;
    var isLineCooldown = false;

    var player = new Player();

    var guideLine = new GuideLine();

    var timerUI = new TimerUI();
    var scoreUI = new ScoreUI_Renewal();
    var compSticker = new ComplimentSticker(context_GameBG, 1138, 321);

    var exitPopup = new ExitPopup();
    var startPopup = new StartPopup("EatVege");



    function inGameReset()
    {
        sendDataGravity(checkRewardSticker, GAPI_CHECK_TODAYSTICKER, "game_arcade_c", null);

        ingameCurPosition = 0;
        resultCurPosition = 0;

        isSuccess = false;

        isStartPop = true;
        isCheck = false;
        isItemSound = false;

        //게임 내 시간 변수    
        newLineMaxTimer = calculateSecToFrame(18);
        newLineCount = 0;
        newLineTimer = 0;

        vegeType = ["broccoli", "pumpkin", "mushroom", "onion"];

        puzzleObjSize = 76;
        puzzleColumn = 7; //퍼즐 가로 줄
        puzzleRow = 7; //퍼즐 새로 줄

        //필드, 퍼즐 생성 변수
        puzzleArr = [ //puzzle[Y][X] 첫 블록 생성을 위한 배열
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
            [0, 0, 0, 0, 0, 0, 0,],
        ]

        createPuzzle();

        puzzleObjects = [];

        startPosX = 240;//퍼즐 필드 초기 위치
        startPosY = 114;//퍼즐 필드 초기 위치

        for(var i = 0; i < puzzleArr.length; i++){
            var curObj = [];
            for(var j = 0; j < puzzleArr[i].length; j++){
                curObj.push(new Block(j, i, puzzleArr[i][j]))
            }
            puzzleObjects.push(curObj);
        }

        curPuzzleObj = new Block(3, -1, randomRange(0, vegeType.length - 1));
        nextPuzzleObj = new Block(10.2, 0.3, randomRange(0, vegeType.length - 1));
        curXIndex = 3;
        curYIndex = -1;

        //아이템, 블록 여부 등의 bool 변수
        isThreeBlock = false;
        isFourBlock = false;
    
        isToothpaste = false;//치약 아이템 생성 값
        isToothpaste_R = false;//무지개 치약 아이템 생성 값
        isCheck = false;
        isNone = false//필드에 블록이 있는지 없는지 확인

        //점수, 콤보 등의 현재 index 변수
        comboCount = 0;
        boomItemCount = 0;
    
        //마지막 블록 위치 변수
        lastBlockPosX = 0;
        lastBlockPosY = 0;

        lineCooldown = calculateSecToFrame(2);
        lineCooldownIndex = 0;
        isLineCooldown = false;

        player = new Player();

        guideLine = new GuideLine();
    
        timerUI = new TimerUI();
        scoreUI = new ScoreUI_Renewal();
        compSticker = new ComplimentSticker(context_GameBG, 1138, 321);
    
        exitPopup = new ExitPopup();
        startPopup = new StartPopup("EatVege");

        exitPopup.backgroundPosX -= 130;
        exitPopup.buttonBGPosX_01 -= 130;
        exitPopup.buttonBGPosX_02 -= 130;
        startPopup.posX -= 130;
    }

    function updateInGame()
    {
        if(gameStart && exitBtnClick == false && isStartPop == false){
                //Game Timer
            if(timerUI.playTime > 0){
                timerUI.playTime--;
            }else{
                gameEnd("TimeOver");
            }

            //18초마다 새로운 줄이 생기는 기능
            newLineTimer++
            if(newLineTimer > newLineMaxTimer && isCheck == false){
                newLineTimer = 0;
                createBottomLine();
                newLineCount++;
                if(newLineCount == 3){
                    vegeType.push("tomato");
                }
            }

            if(isLineCooldown){
                lineCooldownIndex++;
                if(lineCooldownIndex >= lineCooldown){
                    lineCooldownIndex = 0;
                    isLineCooldown = false;
                }
            }

            isNone = true;//매 프레임마다 확인하기 위해 초기화
            //모든 블록 체크 및 사용할 블럭 없으면 제일 밑에 줄 생성
            for(var i = puzzleRow - 1; i >= 0; i--){
                puzzleObjects[i].forEach(function(value){
                    if(value.type != -1){
                        isNone = false;
                        return false;
                    }
                })
                if(isNone){
                    break;
                }
            }

            //필드 Object의 Y축 재정렬을 위한 기능
            puzzleObjects.forEach(function(valueArr){
                valueArr.forEach(function(value){
                    value.fallDown();
                })
            })

            if(isNone){//필드에 블럭이 존재하는지 확인
                createBottomLine();
            }

            //6번째 줄에 블럭 있는지 확인 후 Animation 실행

            curPuzzleObj.move();
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
                        // soundResumeBGM(getPlaySoundData("inGameBGM_lazy"));
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
                    break;
                case VK_BACK:
                    exitBtnClick = true;
                    break;
            }
        }else if(isCheck == false){
            switch (keyCode)
            {
                case VK_UP:

                    break;

                case VK_DOWN:
                    break;

                case VK_LEFT:
                    soundPlay("cursor_side")
                    curXIndex--;
                    if(curXIndex < 0){
                        curXIndex = puzzleObjects.length - 1;
                    }
                    break;

                case VK_RIGHT:
                    soundPlay("cursor_side")

                    curXIndex++;
                    if(curXIndex > puzzleObjects.length - 1){
                        curXIndex = 0;
                    }
                    break;

                case VK_ENTER:
                    // soundPlayEffect(getPlaySoundData("cursor_ok"));
                    isCheck = true;
                    curPuzzleObj.isFall = true;
                    for(var i = puzzleObjects.length - 1; i >= 0; i--){
                        if(puzzleObjects[i][curXIndex].type == -1){
                            curYIndex = i;
                            lastBlockPosX = curXIndex;
                            lastBlockPosY = i;
                            return;
                        }
                    }
                    break;
                case VK_BACK://게임 종료 팝업
                    exitBtnClick = true;
                    gameStart = true;
                    break;
                case 113:
                    if(isLineCooldown == false){
                        createBottomLine();
                        isLineCooldown = true;
                    }
                    break;
            }
        }
    }

    function keyUpInGame(keyCode){
        switch(keyCode){
            case VK_LEFT:
                if(keyDownArr.includes(keyCode)){
                    keyDownArr.splice(keyDownArr.indexOf(keyCode), 1);
                }
                break;
            case VK_RIGHT:
                if(keyDownArr.includes(keyCode)){
                    keyDownArr.splice(keyDownArr.indexOf(keyCode), 1);
                }
                break;
            case VK_UP:
                if(keyDownArr.includes(keyCode)){
                    keyDownArr.splice(keyDownArr.indexOf(keyCode), 1);
                }
                break;
            case VK_DOWN:
                if(keyDownArr.includes(keyCode)){
                    keyDownArr.splice(keyDownArr.indexOf(keyCode), 1);
                }
                break;
        }
    }

    //퍼즐 생성
    function createPuzzle(){
        for(var i = puzzleArr.length - 1; i >= 0; i--){
            for(var j = 0; j < puzzleArr[i].length; j++){
                if(i == 6){
                    puzzleArr[i][j] = randomRange(0, vegeType.length - 1);
                    if(j > 0){
                        while(puzzleArr[i][j] == puzzleArr[i][j - 1]){
                            puzzleArr[i][j] = randomRange(0, vegeType.length - 1);
                        }
                    }
                }else if(i >= 3){
                    puzzleArr[i][j] = randomRange(0, vegeType.length - 1);
                    if(j >= 0){
                        while(puzzleArr[i][j] == puzzleArr[i][j - 1] || puzzleArr[i][j] == puzzleArr[i + 1][j]){
                                puzzleArr[i][j] = randomRange(0, vegeType.length - 1);
                        }
                    }
                }else{
                    puzzleArr[i][j] = -1;
                }
            }
        }
    }

    //현재 블록, 다음 생성 블록 리셋 함수
    function resetPuzzleObj(){
        puzzleObjects[curPuzzleObj.hCnt][curPuzzleObj.wCnt] = curPuzzleObj;
        curPuzzleObj = new Block(curXIndex, -1, nextPuzzleObj.type);
        
        var itemPercent = randomRange(0, 100);
        if(itemPercent >= 6){
            nextPuzzleObj.blockReset(10.2, 0.3, randomRange(0, vegeType.length - 1))
        }else if(itemPercent >= 3){//칫솔 아이템 생성
            nextPuzzleObj.blockReset(10.2, 0.3, 13)
        }else{//가글 아이템 생성
            nextPuzzleObj.blockReset(10.2, 0.3, 14)
        }
    }
    
    //2match 기준 확인 함수
    function check2Match(){
        var count = 1;

        //가로 방향 체크
        for(var i = 0; i < puzzleRow; i++){
            for(var j = 0; j < puzzleColumn - 1; j++){
                if(puzzleObjects[i][j].type == puzzleObjects[i][j + 1].type && 
                    puzzleObjects[i][j].type != -1){
                    count += 1;
                    puzzleObjects[i][j].isCluster = true;    
                    puzzleObjects[i][j + 1].isCluster = true;
                }
            }
        }

        //세로 방향 체크
        for(var j = 0; j < puzzleColumn; j++){
            for(var i = 0; i < puzzleRow - 1; i++){
                if(puzzleObjects[i][j].type == puzzleObjects[i + 1][j].type&& 
                    puzzleObjects[i][j].type != -1){
                    count += 1;
                    puzzleObjects[i][j].isCluster = true;
                    puzzleObjects[i + 1][j].isCluster = true;
                    
                    //아이템 생성 여부 확인
                    if(j > 0 && j < puzzleColumn - 1){
                        if(puzzleObjects[i][j - 1].type == puzzleObjects[i][j].type &&
                            puzzleObjects[i][j + 1].type == puzzleObjects[i][j].type){
                                //블록 4개 아이템 생성
                                isToothpaste = true;
                                isFourBlock = true;
                        }
                    }
                }
            }
        }

        //점수 제공을 위한 블록 구성 확인
        if(count >= 3){
            for(var i = 0; i < puzzleRow; i++){
                for(var j = 0; j < puzzleColumn; j++){
                    if(i < puzzleRow - 1 && j < puzzleColumn - 1){
                        if((puzzleObjects[i][j].isCluster && puzzleObjects[i][j + 1].isCluster && puzzleObjects[i + 1][j + 1].isCluster) || 
                        (puzzleObjects[i][j].isCluster && puzzleObjects[i + 1][j].isCluster && puzzleObjects[i][j + 1].isCluster)){
                            isThreeBlock = true;
                        }
                    }
                }
            }
        }

        if(count <= 1){
            //리셋
            count = 1;

            scoreUI.addComboScore();
            comboCount = 0;
            boomItemCount = 0;

            isCheck = false;
            //TODO(현재 블록 높이 확인 후 게임 종료)
            for(var i = 0; i < puzzleObjects[0].length; i++){
                if(puzzleObjects[0][i].type != -1){
                    gameEnd("LineOver");
                }
            }
        }else{
            comboCount++;
            boomItemCount++;
            removeBlock();
            scoreUI.addScore();
        }
    }

    //게임 종료 시 해당 함수 호출
    function gameEnd(type){
        switch(type){
            case "TimeOver":
                soundPlay("end_success");
                player.setState("Win");
                isSuccess = true;
                break;
            case "LineOver":
                soundPlay("end_fail");
                player.setState("Fail");
                break;
        }

        setGameState(GAME_STATE.GAME_END);

        sendDataGravity(insertScore, GAPI_INSERT_SCORE, "game_arcade_c", scoreUI.totalScore);

        if(isGetReward == true || isSuccess == false){
            isEndPopup = true;
            stickerPopup.IsKeySet();
        } 
    }

    //아이템 여부 확인
    function checkItem(wIdx, hIdx){
        var isLeft = false;//w-1이 있는 경우
        var isRight = false;//w+1이 있는 경우
        var isUp = false;//h-1이 있는 경우
        var isDown = false;//h+1이 있는 경우

        var targetColor = puzzleObjects[hIdx][wIdx].type;
  
        //좌우 블럭 존재 여부 확인
        if(wIdx + 1 <= puzzleColumn - 1){
            if(wIdx - 1 >= 0){
                //w + 1이 있으면서 w - 1도 있는 경우
                isRight = true;
                isLeft = true;
            }else{
                //w + 1이 있지만 w - 1은 없는경우
                isRight = true;
            }
        }else{
            if(wIdx - 1 >= 0){
                //w - 1은 있지만 w + 1은 없는 경우
                isLeft = true;
            }
        }

        //상하 블럭 존재 여부 확인
        if(hIdx + 1 <= puzzleRow - 1){
            if(hIdx - 1 >= 0){
                //h + 1이 있으면서 h - 1도 있는 경우
                isUp = true;
                isDown = true;
            }else{
                //h + 1이 있지만 h - 1은 없는경우
                isDown = true;
            }
        }else{
            if(hIdx - 1 >= 0){
                //h - 1은 있지만 h + 1은 없는 경우
                isUp = true
            }
        }

        if(targetColor > 10){//칫솔 아이템, 가글 아이템에만 해당
                puzzleObjects[hIdx][wIdx].isCluster = true;
                removeItemBlock(wIdx, hIdx, puzzleObjects[hIdx][wIdx].type, 99);
            return;
        }


        if(isLeft){
            if(puzzleObjects[hIdx][wIdx - 1].type > 10){
                puzzleObjects[hIdx][wIdx - 1].isCluster = true;
                puzzleObjects[hIdx][wIdx].isCluster = true;
                removeItemBlock(wIdx - 1, hIdx, puzzleObjects[hIdx][wIdx - 1].type, targetColor);
                return;
            }
        }

        if(isRight){
            if(puzzleObjects[hIdx][wIdx + 1].type > 10){
                puzzleObjects[hIdx][wIdx + 1].isCluster = true;
                puzzleObjects[hIdx][wIdx].isCluster = true;
                removeItemBlock(wIdx + 1, hIdx, puzzleObjects[hIdx][wIdx + 1].type, targetColor);
                return;
            }
        }

        if(isUp){
            if(puzzleObjects[hIdx - 1][wIdx].type > 10){
                puzzleObjects[hIdx - 1][wIdx].isCluster = true;
                puzzleObjects[hIdx][wIdx].isCluster = true;
                removeItemBlock(wIdx, hIdx - 1, puzzleObjects[hIdx - 1][wIdx].type, targetColor);
                return;
            }
        }

        if(isDown){
            if(puzzleObjects[hIdx + 1][wIdx].type > 10){
                puzzleObjects[hIdx + 1][wIdx].isCluster = true;
                puzzleObjects[hIdx][wIdx].isCluster = true;
                removeItemBlock(wIdx, hIdx + 1, puzzleObjects[hIdx + 1][wIdx].type, targetColor);
                return;
            }
        }

        check2Match();
    }

    //블록 삭제 함수
    function removeBlock(){
        if(isItemSound == false){
            soundPlay("block_a");
            player.setState("Eat");
        }else{
            isItemSound = false;
        }
        for(var i = 0; i < puzzleObjects.length; i++){
            for(var j = 0; j < puzzleObjects[i].length; j++){
                if(puzzleObjects[i][j].isCluster == true)
                {
                    puzzleObjects[i][j].type = -1;
                    puzzleObjects[i][j].isCluster = false;
                    puzzleObjects[i][j].isDestroy = true;
                }
            }
        }
    }

    //블록 삭제 기능 실행 확인
    function checkDestroy(){
        for(var i = 0; i < puzzleRow; i++){
            for(var j = 0; j < puzzleColumn; j++){
                if(puzzleObjects[i][j].isDestroy == true){
                    return;
                }
            }
        }
        
        createItem();
        resetPosition();
    }

    //블록이 아래로 떨어지는지 여부 확인
    function checkFalling(){
        for(var i = 0; i < puzzleRow; i++){
            for(var j = 0; j < puzzleColumn; j++){
                if(puzzleObjects[i][j].isFallDown == true){
                    return;
                }
            }
        }
        resetPosition();
    }

    //아이템 블록 삭제 기능
    function removeItemBlock(wIdx, hIdx, type, targetColor){
        isItemSound = true;
        switch(type){
            case 11://파랑, 노랑 별
                //아이템을 맞춘 블록과 같은 색상의 모든 블록 파괴
                destroySameColor(targetColor);
                soundPlay("item_samecolor");
                break;
            case 12://폭탄
                //주변 8개 블록 파괴
                destroyEightBlock(wIdx, hIdx);
                soundPlay("item_eightblock");
                break;
            case 13://빨강, 노랑 별
                //블록 위치를 기준으로 가로에 있는 모든 블록 파괴
                destroyWidth(hIdx);
                soundPlay("item_width");
                break;
            case 14://노랑 별
                //블록 위치를 기준으로 가로, 세로에 있는 모든 블록 파괴
                destroyHeight(wIdx);
                soundPlay("item_height");
                break;
        }
        scoreUI.addItemScore(type);
        comboCount++;
        boomItemCount++;
        removeBlock();
    }

    //블록 위치 아래로 정렬하기 위한 리셋 함수
    function resetPosition(){
        var isReset = false;
        for(var j = 0; j < puzzleColumn; j++){
            for(var i = puzzleRow - 2; i >= 0; i--){
                if(puzzleObjects[i][j].type == -1){
                    continue;
                }

                if(puzzleObjects[i + 1][j].type == -1){
                    isReset = true;
                    puzzleObjects[i + 1][j] = puzzleObjects[i][j];
                    puzzleObjects[i + 1][j].nextPosY = puzzleObjects[i][j].posY + puzzleObjSize;
                    puzzleObjects[i + 1][j].isFallDown = true;
                    puzzleObjects[i][j] = new Block(j, i, -1);
                }
            }
        }
        if(isReset){
            //resetPosition();
        }else{
            check2Match();
        }
    }

    //퍼즐 필드 새로운 줄 생성 기능
    function createBottomLine(){
        var lastArr = [];

        puzzleObjects.shift();
        for(var i = 0; i < puzzleRow - 1; i++){
            for(var j = 0; j < puzzleColumn; j++){
                puzzleObjects[i][j].posY -= puzzleObjSize;
                puzzleObjects[i][j].hCnt = i;
            }
        }
        var lastType = 0;
        for(var i = 0; i < puzzleColumn; i++){
            var tempType = randomRange(0, vegeType.length - 1);
            if(i > 0){
                while(tempType == puzzleObjects[puzzleObjects.length - 1][i].type || tempType == lastType){
                    tempType = randomRange(0, vegeType.length - 1);
                }
            }else{
                while(tempType == puzzleObjects[puzzleObjects.length - 1][i].type){
                    tempType = randomRange(0, vegeType.length - 1);
                }
            }
            lastArr.push(new Block(i, 6, tempType));//중복 제거 기능 추가
            lastType = tempType;
        }
        puzzleObjects.push(lastArr);

        //제일 위의 블럭 라인 확인 후 블럭이 존재하면 게임 종료
        for(var i = 0; i < puzzleObjects[0].length; i++){
            if(puzzleObjects[0][i].type != -1){
                gameEnd("LineOver");
            }
        }
    }

    //아이템 생성 기능
    function createItem(){
        if(boomItemCount >= 4){
            isToothpaste_R = true;
            boomItemCount = 0;
        }

        if(isToothpaste){
            puzzleObjects[lastBlockPosY][lastBlockPosX] = new Block(lastBlockPosX, lastBlockPosY, 11);
            isToothpaste = false;
        }

        if(isToothpaste_R){
            var itemIndexX = randomRange(0, puzzleColumn - 1);
            var itemIndexY = randomRange(0, puzzleRow - 1);

            puzzleObjects[itemIndexY][itemIndexX] = new Block(itemIndexX, itemIndexY, 12);
            isToothpaste_R = false;
        }
    }

    //Item Function
    function destroySameColor(targetColor){
        if(targetColor == 99 || targetColor > 10){
            return;
        }

        for(var i = 0; i < puzzleRow; i++){
            for(var j = 0; j < puzzleColumn; j++){
                if(puzzleObjects[i][j].type == targetColor){
                    puzzleObjects[i][j].isCluster = true;
                }
            }
        }
        timerUI.addTime(10);
    }

    function destroyEightBlock(x, y){
        var dx = [0];
        var dy = [0];

        //북
        if(y - 1 >= 0){
            dy.push(-1);
        }

        //남
        if(y + 1 <= puzzleRow - 1){
            dy.push(1);
        }

        //동
        if(x + 1 <= puzzleColumn - 1){
            dx.push(1);
        }

        //서
        if(x - 1 >= 0){
            dx.push(-1);
        }

        for(var i = 0; i < dx.length; i++){
            for(var j = 0; j < dy.length; j++){
                if(puzzleObjects[y + dy[j]][x + dx[i]].type != -1){
                    puzzleObjects[y + dy[j]][x + dx[i]].isCluster = true;
                    puzzleObjects[y + dy[j]][x + dx[i]].effectType = 14;
                }
            }
        }
        timerUI.addTime(10);
    }

    function destroyWidth(y){
        for(var i = 0; i < puzzleColumn; i++){
            puzzleObjects[y][i].isCluster = true;
            puzzleObjects[y][i].effectType = 13;
        }
        timerUI.addTime(10);
    }

    function destroyHeight(x){
        for(var i = 0; i < puzzleRow; i++){
            puzzleObjects[i][x].isCluster = true;
            puzzleObjects[i][x].effectType = 13;
        }
        timerUI.addTime(10);
    }

    //Character Animation BG부분에 render 및 BG보다 뒤쪽에 Rendering 되도록 설정
    function renderBG(){

        //Background
        context_GameBG.drawImage(getImageListGame("Bg_image"), 902, 284);

        player.render();
        if(isGetReward == false)
            compSticker.render();

        context_GameBG.drawImage(getImageListGame("Background"), 0, 0, 1280, 720);

        context_GameBG.drawImage(getImageListGame("Next_Block"), 998, 239);
        // context_GameBG.drawImage(getImageListGame("Mirror"), 932, 315);
    }

    function renderMain(){
        guideLine.render();

        //퍼즐 오브젝트
        for(var i = 0; i < puzzleObjects.length; i++){
            puzzleObjects[i].forEach(function(value){
                value.render();
            })
        }

        curPuzzleObj.render();
        nextPuzzleObj.render();

    }

    function renderUI(){
        //Score
        scoreUI.render();
        
        //타이머
        timerUI.render();

        if(isStartPop){
            startPopup.render();
        }

        if(exitBtnClick == true)
        {
            exitPopup.render(ingameCurPosition);
        }
    }

    function soundPlay(index){
        var randNum;
        var soundText;
        switch(index){
            case "game_start":
                randNum = randomRange(1, 2);
                soundText = "game_start" + randNum;
                break;
            case "cursor_side":
                soundText = "cursor_side";
                break;
            case "cursor_ok":
                soundText = "cursor_ok";
                break;
            case "block_a":
                soundText = "block_a";
                break;
            case "item_samecolor":
                soundText = "sp1";
                break;
            case "item_eightblock":
                soundText = "sp2";
                break;
            case "item_width":
                soundText = "sp3";
                break;
            case "item_height":
                soundText = "sp3";
                break;
            case "end":
                soundText = "block_end";
                break;
            case "end_success":
                randNum = randomRange(1, 2);
                soundText = "end_a" + randNum;
                break;
            case "end_fail":
                randNum = randomRange(1, 2);
                soundText = "end_b" + randNum;
                break;
        }
        soundPlayEffect(getPlaySoundData(soundText));
    }

    //Objects
    //Puzzle Object
    function Block(wCnt, hCnt, type){
        this.wCnt = wCnt;
        this.hCnt = hCnt;

        this.posX;
        this.posY = startPosY + this.hCnt * puzzleObjSize;
        this.speed = 9.5;
        this.isFall = false;

        this.nextPosY = 0;//필드 Object의 y축 재배치 기능 실행을 위한 위치 변수
        this.isFallDown = false;//필드 Object의 y위치 재배치를 위한 bool 변수

        this.type = type;
        this.blockType = {
            "None" : -1,
            "white" : 0,
            "blue" : 1,
            "green" : 2,
            "yellow" : 3,
            "red" : 4,
            "star_BY" : 11, // sameColor
            "star_Y" : 12, //xIndex block
            "star_RY" : 13,//yIndex block
            "boom" : 14, //eight block
        }

        this.state = {
            Idle : 0,
            Fall : 1,
        }
        this.curState = this.state.Idle;

        this.isCluster = false;//2match 조건 여부 bool값
        this.isDestroy = false;//블록 파괴 effect를 실행하기 위한 bool값
        this.curEffect = 15;
        this.effectType = 0;


        this.imgWIdx = 0;
        this.imgHIdx;

        //블럭 생성 기준 왼쪽, 아래쪽과 색상이 안겹치도록 생성

        this.render = function(){
            this.posX = startPosX + this.wCnt * puzzleObjSize;

            if(this.type <= 10){
                this.img = getImageListGame("Block_All")
            }else if(this.type == 11){
                this.img = getImageListGame("Item_01");
            }else if(this.type == 12){
                this.img = getImageListGame("Item_04");
            }else if(this.type == 13){
                this.img = getImageListGame("Item_03");
            }else if(this.type == 14){
                this.img = getImageListGame("Item_02");
            }

            if(!gameStart){
                this.img = getImageListGame("Block_G");
            }

            this.imgHIdx = this.type;


            if(this.img == undefined)
                return;

            if(this.type != -1 && gameStart){
                if(this.type <= 10){
                    this.clipWidth = this.img.clipWidth;
                    this.clipHeight = this.img.clipHeight;
                    context_GameMain.drawImage(this.img, this.clipWidth * this.imgWIdx, this.clipHeight * this.imgHIdx, this.clipWidth, this.clipHeight,
                        this.posX, this.posY, puzzleObjSize, puzzleObjSize);
                }else{
                    context_GameMain.drawImage(this.img, this.posX, this.posY);
                }
            }else if(this.type != -1 && !gameStart){
                context_GameMain.drawImage(this.img, this.posX, this.posY);
            }

            if(this.isDestroy){
                this.destroyEffect(this.effectType);
            }else{
                this.effectIdx = 0;
            }
        }

        this.move = function(){
            this.wCnt = curXIndex;

            if(this.isFall){
                if(this.posY < startPosY + curYIndex * puzzleObjSize){
                    this.posY += this.speed * 2;
                }else{
                    this.hCnt = curYIndex;
                    puzzleObjects[curYIndex][curXIndex] = this;
                    this.isFall = false;
                    checkItem(this.wCnt, this.hCnt);
                    resetPuzzleObj();
                }
            }
        }

        this.destroyEffect = function(effectType){
            switch(effectType){
                case 13:
                    this.destImgText = "Line_Effect";
                break;
                case 14:
                    this.destImgText = "Boom_Effect";
                break;
                default:
                    this.destImgText = "Block_Effect";
                break;
            }

            this.effectIdx++;
            if(this.effectIdx >= this.curEffect - 1){
                this.isDestroy = false;
                this.effectIdx = this.curEffect - 1;
                checkDestroy();
            }

            this.destImg = getImageListGame(this.destImgText);

            drawSpriteImage(context_GameMain, this.destImg, this.effectIdx, this.posX - 10, this.posY - 10);
            // context_GameMain.drawImage(this.destImg, this.posX - 10, this.posY - 10);
        }

        this.fallDown = function(){
            if(this.isFallDown){
                if(this.posY < this.nextPosY){
                    this.posY += this.speed;
                }else{
                    this.isFallDown = false;
                    checkFalling();
                }
            }
        }
        
        this.blockReset = function(wIndex, hIndex, type){
            this.posX = startPosX + wIndex * puzzleObjSize; 
            this.posY = startPosY + hIndex * puzzleObjSize;
            this.type = type;
        }
    }

    function Player(){
        this.img;
        this.imgText = "Player_Idle";

        this.posX = 909;
        this.posY = 349;

        this.isIdleReady = false;
        this.idleTime = 0;
        this.blinkTime = 90;

        this.state = {
            Idle : 0,
            Idle_Blink : 1,
            Eat : 2,
            Win : 3,
            Fail : 4
        }  
        this.curState = this.state.Idle;

        this.animLen = {
            idle : 15,
            idle_blink : 15,
            eat : 18,
            win : 13,
            fail : 15
        }
        this.curAnimLen = this.animLen.idle;
        this.animIdx = 0;
        this.animFrame = 0;

        this.render = function(){
            this.animFrame++;

            if(this.animFrame >= 2){
                this.animIdx++;
                this.animFrame = 0;
            }

            if(this.curState == this.state.Idle)
                this.idleTime++;
            
            if(this.idleTime >= this.blinkTime && this.isIdleReady == false && this.curState != this.state.Idle_Blink){
                this.isIdleReady = true;
                this.idleTime = 0;
            }

            if(this.animIdx >= this.curAnimLen - 1){
                this.animIdx = 0;

                if(this.curState != this.state.Idle)
                    this.setState("Idle");
                else if(this.isIdleReady == true){
                    this.setState("Idle_Blink");
                    this.isIdleReady = false;
                }
            }

            this.img = getImageListGame(this.imgText);

            drawSpriteImage(context_GameBG, this.img, this.animIdx, this.posX, this.posY);
        }

        this.setState = function(state){
            switch(state){
                case "Idle":
                    this.curState = this.state.Idle;
                    this.curAnimLen = this.animLen.idle;
                    this.idleTime = 0;
                    break;
                case "Idle_Blink":
                    this.curState = this.state.Idle_Blink;
                    this.curAnimLen = this.animLen.idle_blink;
                    break;
                case "Eat":
                    this.curState = this.state.Eat;
                    this.curAnimLen = this.animLen.eat;
                    break;
                case "Win":
                    this.curState = this.state.Win;
                    this.curAnimLen = this.animLen.win;
                    break;
                case "Fail":
                    this.curState = this.state.Fail;
                    this.curAnimLen = this.animLen.fail;
                    break;
            }
            this.animIdx = 0;
            this.imgText = "Player_" + state;
        }
    }

    function GuideLine(){
        this.img;

        this.posX;
        this.posY = 110;

        this.render = function(){
            this.img = getImageListGame("GuideLine");

            this.posX = curXIndex * puzzleObjSize + startPosX;

            if(this.img == undefined)
                return;
            context_GameBG.drawImage(this.img, this.posX, this.posY);
        }
    }

    function ScoreUI_Renewal(){
        this.totalScore = 0;
        this.score = 0;
        this.scoreTypeText = "";

        this.textPosX = 1143;
        this.textPosY = 605;

        this.render = function(){
            this.renderTotalScore();
        }


        this.addScore = function(){
            if(isFourBlock){//블록 4개 한번에 제거
                this.totalScore += 300;
                isFourBlock = false;
            }else if(isThreeBlock){//블록 3개 한번에 제거
                this.totalScore += 150;
                isThreeBlock = false;
            }else{
                this.totalScore += 50;
            }
        }

        this.addComboScore = function(){          
            if(comboCount <= 1)
                return;

            var comboScore = 0;
            for(i = 0; i < comboCount - 1; i++){
                comboScore += 100;
                if(comboCount >= 3){
                    comboScore += (comboCount - 2) * 100;
                }
            }
            this.totalScore += comboScore;
        }

        //Item, Fruit, Bonus etc.....
        this.addItemScore = function(type){

            switch(type){
                case 11:
                    this.totalScore += 500;
                break;
                case 12:
                    this.totalScore += 1000;
                break;
                case 13:
                case 14:
                    this.totalScore += 2000;
                break;
            }
        }

        this.renderTotalScore = function(){
            this.numImg = getUIImageListGame("UI_Num");
            this.stringScore = this.totalScore.toString();
            this.renderCount = 0;
            if(this.numImg == undefined){
                return;
            }

            for(var i = this.stringScore.length - 1; i >= 0; i--){
                drawSpriteImage(context_GameBG, this.numImg, this.stringScore[i], this.textPosX - (this.numImg.clipWidth - 3) * this.renderCount, this.textPosY);
                this.renderCount++;
            }
        }
    }

    function TimerUI(){
        this.maxTime = calculateSecToFrame(120);
        // this.maxTime = calculateSecToFrame(5);
        this.playTime = this.maxTime;

        this.gageImg;
        this.gagePosX = 825;
        this.gagePosY = 82;

        this.render = function(){
            this.gageImg = getImageListGame("TimeGage");


            this.offset = this.playTime / this.maxTime;
            this.positionOffset = this.gageImg.height - (this.gageImg.height * this.offset);

            if(this.gageImg == undefined)
                return;

            context_GameBG.drawImage(this.gageImg, 0, this.positionOffset, this.gageImg.width, this.gageImg.height + this.positionOffset, this.gagePosX, this.gagePosY + this.positionOffset, this.gageImg.width, this.gageImg.height + this.positionOffset)

            context_GameBG.drawImage(getImageListGame("Clock"), 818, 595);
        }

        this.addTime = function(num){
            if(typeof(num) != "number")
                return;

            this.playTime += calculateSecToFrame(num);
            if(this.playTime >= this.maxTime)
                this.playTime = this.maxTime;
        }
    }   
//#endregion

//#region GameEnd
    var isEndPopup = false;

    var stickerPopup = new StickerPopup();
    var endPopup = new EndScorePopup();

    var isEndKey = false;
    var isEndKeyTimer = 45;
    var isEndkeyCurTime = 0;

    var isStickerPopupKey = false;

    stickerPopup.posX -= 130;

    endPopup.backgroundPosX -= 130;
    endPopup.buttonBGPosX_01 -= 130;
    endPopup.buttonBGPosX_02 -= 130;
    endPopup.numPosX -= 130;


    function drawGameEnd(){
        clearBuffer(canvas_GameBG, context_GameBG);
        clearBuffer(canvas_GameMain, context_GameMain);
        clearBuffer(canvas_GamePopup, context_GamePopup);

        if(isEndKey == false && isStickerPopupKey == true) isEndkeyCurTime++;

        if(isEndkeyCurTime >= isEndKeyTimer) isEndKey = true;

        isStickerPopupKey = stickerPopup.IsKey();

        renderBG();
        renderMain();
        renderUI();
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
                    sendDataGravity(insertRewardSticker, GAPI_INSERT_STICKER_A, "game_arcade_c", null);
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

            kongApi.removeScriptFile("EatVege.js", "js");// 현재 게임 jsavaScript 제거
        }

        isPageRefresh = true;

        // 포탈 javaScript 실행
        kongApi.loadScript( "portal.js", loadScriptSuccess );// REAL
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_hangle_a", "END");
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
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_arcade_c", "START");
        }
        else if(_retVal == 2 || userInfo.sticker_A >= 30)
        {
            //일일 칭찬스티커 수령
            // isGetReward = true;
            isGetReward = false;

            //실제 게임 시작시 시작로그를 남김
            sendDataGravity(null, GAPI_INSERT_LOGGAME, "game_arcade_c", "START");
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