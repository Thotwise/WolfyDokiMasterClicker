var TIME_ONE_SECOND = 1000;
var TIME_ONE_MINUTE = TIME_ONE_SECOND * 60;
var TIME_ONE_HOUR   = TIME_ONE_MINUTE * 60;
var TIME_ONE_DAY    = TIME_ONE_HOUR * 24;
//
var LOGIN_TIMES = "LoginTimes";
///----------- DAILY REWARDS CONSTANTS
var TIME_FOR_ONE_REWARD = TIME_ONE_DAY ; //0.4 * TIME_ONE_MINUTE;
var LAST_TIME_DAILY_REWARD = "DailyRewardLastTime";
var TOTAL_NUMBER_REWARD_DAYS = 10;
////---------- TEAMS AND TOURNAMENTS CONSTANTS
var TOURNAMENT_DURATION = TIME_ONE_HOUR * 3;


/***
	 CLOUD SCRIPT FOR TEAMS AND TOURNAMENTS

*/
handlers.CheckIfTournamentFinished = function (args)
{

    ///-- Security Code
    if (args["CodigoLoco"] != "123TUVIEJA")
    {
    	return {  messageValue : "QUEOPSOS" , op: "yeah"+ args["CodigoLoco"]};
    }

	var GetTitleDataRequest =
    {
	    	"Keys": [ "TeamsAndTournaments" ]
	};
    var GetTitleDataResult = server.GetTitleData(GetTitleDataRequest);

 	//---- Create the Tournaments and Teams Data. THIS WILL RUN ONLY ONCE for first time of we destroy all the data
    if( !GetTitleDataResult.Data.hasOwnProperty("TeamsAndTournaments"))
    {
        // 0 Pigs, 1 Cavalliers ,2 BigFishes,3 Unicorns,4 Mosters
        var TournamentData =
            {
                "Number":1,
                "StartTime" : Date.now(),
                "EndTime" : Date.now() + TOURNAMENT_DURATION,
                "TeamsStatus":[
                        { "ID":0, "Points":50 },
                        {  "ID":1, "Points":51 },
                        {  "ID":2, "Points":53 },
                        {  "ID":3, "Points":48 },
                        {  "ID":4, "Points":49 }
                      ]

            }
    }





    var TandTDAta = JSON.parse( GetTitleDataResult.Data.TeamsAndTournaments );

    var IsFinished = TandTDAta.EndTime <= Date.now();



    if(IsFinished)
    {

        var ClonedTournament =JSON.parse(JSON.stringify(TandTDAta));
        ClonedTournament.TeamsStatus.sort(function(a,b) {return (a.Points > b.Points) ? 1 : ((b.Points > a.Points) ? -1 : 0);} );
		ClonedTournament.TeamsStatus.reverse();



         var TournamentData =
         {
                "Number": TandTDAta.Number+1,
                "StartTime" : Date.now(),
                "EndTime" : Date.now() + TOURNAMENT_DURATION,
                "TeamsStatus":[
                        { "ID":0, "Points":50  , "LastPoints" : 0 , "LastPos" : 0 },
                        {  "ID":1, "Points":51 , "LastPoints" : 0 , "LastPos" : 0},
                        {  "ID":2, "Points":49 , "LastPoints" : 0 , "LastPos" : 0},
                        {  "ID":3, "Points":48 , "LastPoints" : 0 , "LastPos" : 0},
                        {  "ID":4, "Points":52 , "LastPoints" : 0 , "LastPos" : 0}
                      ]

         }

         for(var i=0 ; i < 5 ; i++)
         {
           TournamentData.TeamsStatus[  ClonedTournament.TeamsStatus[i].ID ].LastPos = i+1;
           TournamentData.TeamsStatus[  ClonedTournament.TeamsStatus[i].ID ].LastPoints = ClonedTournament.TeamsStatus[i].Points;
         }

        //---- replace Tournament Data with the New Resetted tournament
        var Created = server.SetTitleData({
         							 "Key": "TeamsAndTournaments",
      							     "Value": JSON.stringify(TournamentData)

        								});

        return {  messageValue : "OK" , data : "FORCED" , tournament: TandTDAta.Number , Finished: IsFinished , UpdatedData : TournamentData.TeamsStatus };
    }


    TandTDAta["TimeToFinish"] = TandTDAta.EndTime - Date.now();

	return {  messageValue : "OK" , tournament: TandTDAta.Number , Finished: IsFinished , AllData : TandTDAta };

}




function GetTeamsAndTournamentData()
{
	// Get Teams and Tournament Data
	var GetTitleDataRequest =
    {
	    	"Keys": [ "TeamsAndTournaments" ]
	};
  var GetTitleDataResult = server.GetTitleData(GetTitleDataRequest);

  return;

  if( !GetTitleDataResult.Data.hasOwnProperty("TeamsAndTournaments"))
  {
       handlers.CheckIfTournamentFinished({"CodigoLoco":"123TUVIEJA"});
       var GetTitleDataResult = server.GetTitleData(GetTitleDataRequest);
  }



  var TandTDAta = GetTitleDataResult.Data["TeamsAndTournaments"];
  var DataTaT = JSON.parse(TandTDAta);
  return DataTaT;
}

function GetPlayerDataForKeys( keys )
{
   var playerData = server.GetUserInternalData(
     {
         PlayFabId : currentPlayerId,
         Keys : keys
     }
    );

   return playerData.Data;
}


////-------------------------------- PLAYER ADD POINTS TO TEAM FOR A PRESTIGE
handlers.AddPrestigeTeamPoints = function ( args )
{
    var QtyPoints = args["Qty"];
    var DataTaT    = GetTeamsAndTournamentData();
    var PlayerData =   GetPlayerDataForKeys(  ["SelectedTeam"] );

    var SelectedTeam = parseInt(PlayerData.SelectedTeam.Value);

    QtyPoints  += DataTaT.TeamsStatus[SelectedTeam].Points ;

    DataTaT.TeamsStatus[SelectedTeam].Points = QtyPoints;


    var Created = server.SetTitleData({
         							 "Key": "TeamsAndTournaments",
      							     "Value": JSON.stringify(DataTaT)

        								});


    return {  messageValue : "OK" , qty: QtyPoints };

}


////----------------------------------------------------------------------------- COLLECT LAST TOURNAMENT BOUNTY
handlers.CollectBountyTournament = function ( args )
{


     var DataTaT    = GetTeamsAndTournamentData();

     var PlayerData =   GetPlayerDataForKeys(  ["LastTournamentEarned"] );

     var LastTournamentEarned =   PlayerData.LastTournamentEarned.Value.toString();
     var PastTournamentNumber = (DataTaT.Number - 1).toString();


     if(  LastTournamentEarned!= PastTournamentNumber)
     {
          var updateUserDataResult = server.UpdateUserInternalData(
           {
              PlayFabId : currentPlayerId,
              Data :
                 {
                   "LastTournamentEarned": DataTaT.Number - 1
                 }
           });


    	   return {  messageValue : "COLLECTED" , data: {lastNumber:PastTournamentNumber, lastEarned: PlayerData}};
     }

  	 return {  messageValue : "ERROR_NOCOLLECTIONFORTIWACHO" };





}

/**------------------------------------  GET TOURNAMENT DATA --------------------------------------
-------------------------------------------------------------------------------------------------*/
handlers.GetTournamentData = function ( args )
{
    var TandTDAta = GetTeamsAndTournamentData();
    return {  messageValue : "FORCED3" , data : TandTDAta  };

    DataTaT["TimeToFinish"] = DataTaT.EndTime - Date.now();

    if( DataTaT["TimeToFinish"] < 0)
    {
    	  handlers.CheckIfTournamentFinished({"CodigoLoco":"123TUVIEJA"});
        GetTitleDataResult = server.GetTitleData(GetTitleDataRequest);

        TandTDAta = GetTitleDataResult.Data["TeamsAndTournaments"];
  	    DataTaT = JSON.parse(TandTDAta);
  	    DataTaT["TimeToFinish"] = DataTaT.EndTime - Date.now();
    }





	return {  messageValue : "OK" , data : DataTaT  };

}



////----------------------------------------------------------------------------- GET PLAYER TEAM DATA

handlers.GetPlayerTeamData = function (args)
{

  var playerData = server.GetUserInternalData(
     {
         PlayFabId : currentPlayerId,
         Keys : ["SelectedTeam","SelectedDate","LastTournamentEarned"]
     }
   );

   if( !playerData.Data.hasOwnProperty("SelectedTeam"))
   {

     var updateUserDataResult = server.UpdateUserInternalData(
     {
     	PlayFabId : currentPlayerId,
        Data :
           {
             "SelectedTeam" : -1 ,
             "SelectedDate" : Date.now(),
             "LastTournamentEarned": 0
           }
     });

     //---- RELOAD
     playerData = server.GetUserInternalData(
     		{
         			PlayFabId : currentPlayerId,
			         Keys : ["SelectedTeam","SelectedDate","LastTournamentEarned"]
     		}
   	 );


   }

    var Data = {
                "SelectedTeam" : playerData.Data["SelectedTeam"].Value,
                "SelectedDate" : playerData.Data["SelectedDate"].Value.toString(),
      			"LastTournamentEarned" : playerData.Data["LastTournamentEarned"].Value
               };

	return {  messageValue : "OK" , data : Data };

}

handlers.SelectTeam = function(args)
{
    var IDReceived = args["TeamID"];

     var updateUserDataResult = server.UpdateUserInternalData(
     {
     	PlayFabId : currentPlayerId,
        Data :
           {
             "SelectedTeam" : IDReceived ,
             "SelectedDate" : Date.now()
           }
     });


	return {  messageValue : "OK" , data : IDReceived };
}


///-------------------------------------------------------------------------------
///---- SUPORT CODE STUFF
///------------------------------------------------

handlers.SupportCode = function ( args )
{
	var ReturnData =
    {
        "CODE" : args["code"],
        "TYPE" : "SKIN_LOCO"
    };


	return {  messageValue : "OK" , data : ReturnData };

}

handlers.CollectDailyReward = function (args)
{
     var playerData = server.GetUserInternalData(
     {
         PlayFabId : currentPlayerId,
         Keys : ["DailyRewardLastTime","LoginTimes","RewardNumberOnCalendar"]
     }
      );


    var LastTimeDailyReward = Date.now();
    var RewardNumberOnCalendar = playerData.Data["RewardNumberOnCalendar"].Value;

    RewardNumberOnCalendar ++;

    var ReturnData =
    {
        "RewardNumberOnCalendar" : RewardNumberOnCalendar - 1,
        "Status" : "OK"
    };


    if(RewardNumberOnCalendar >= TOTAL_NUMBER_REWARD_DAYS)
        RewardNumberOnCalendar=0;

    var updateUserDataResult = server.UpdateUserInternalData(
     {
     	PlayFabId : currentPlayerId,
        Data :
           {
             "DailyRewardLastTime" : LastTimeDailyReward ,
             "RewardNumberOnCalendar" :RewardNumberOnCalendar

           }


     }

   );


    return {  messageValue : "OK" , data : ReturnData };


}



handlers.CheckDailyRewards = function (args)
{



   var playerData = server.GetUserInternalData(
     {
         PlayFabId : currentPlayerId,
         Keys : ["DailyRewardLastTime","LoginTimes","RewardNumberOnCalendar"]
     }

   );




   var LastTimeDailyReward = -1;
   var RewardNumberOnCalendar = 0;
   var DataStatus;

   try
   {
     LastTimeDailyReward = playerData.Data[ "DailyRewardLastTime" ].Value;
     RewardNumberOnCalendar = playerData.Data["RewardNumberOnCalendar"].Value;

     DataStatus = "DataRetrieved";
   }
   catch(e)
   {

     var nowDate = Date.now();
     LastTimeDailyReward = nowDate;
     RewardNumberOnCalendar = 0;

     DataStatus = "DataReseted";
   }





   var TimePassed =  Date.now() - LastTimeDailyReward;

   //--- This Value is in Seconds, Because we use Seconds in Unity3D
   var TimeForNextReward =  (TIME_FOR_ONE_REWARD - TimePassed) / TIME_ONE_SECOND;
   var STATUS = "";



   if(TimePassed > TIME_FOR_ONE_REWARD)
   {
     	//----------- If you lost the chance, then, reset all the calendar
   		if(TimePassed > TIME_FOR_ONE_REWARD *2)
        {
             STATUS = "REWARD_MISSED";
             RewardNumberOnCalendar = 0;
          	 TimeForNextReward = 0;


        }
        //------- If still didnt lost the chance
     	else
        {
            STATUS = "REWARD_READY";
            TimeForNextReward = 0;
        }
   }
   else
   {
      STATUS = "REWARD_WAITING";

   }

   //return {  messageValue : "FORCED" , data : ReturnData };


  var ReturnData =
  {
      "DataStatus" : DataStatus,
      "LastTimeDailyReward" : LastTimeDailyReward,
      "RewardNumberOnCalendar" : RewardNumberOnCalendar ,
      "TimeForNextReward" : TimeForNextReward,   //--- In Seconds
      "Status" : STATUS,
      "Now" : Date.now(),
      "TimePassed" : TimePassed
  };

   var updateUserDataResult = server.UpdateUserInternalData(
     {
     	PlayFabId : currentPlayerId,
        Data :
           {
             "DailyRewardLastTime" : LastTimeDailyReward ,
             "RewardNumberOnCalendar" :RewardNumberOnCalendar

           }


     }

   );


   return {  messageValue : "OK" , data : ReturnData };

}






// This is a Cloud Script function. "args" is set to the value of the "FunctionParameter"
// parameter of the ExecuteCloudScript API.
// (https://api.playfab.com/Documentation/Client/method/ExecuteCloudScript)
// "context" contains additional information when the Cloud Script function is called from a PlayStream action.
handlers.helloWorld = function (args, context) {

    // The pre-defined "currentPlayerId" variable is initialized to the PlayFab ID of the player logged-in on the game client.
    // Cloud Script handles authenticating the player automatically.
    var message = "Hello " + currentPlayerId + "!";

    // You can use the "log" object to write out debugging statements. It has
    // three functions corresponding to logging level: debug, info, and error. These functions
    // take a message string and an optional object.
    log.info(message);
    log.debug("helloWorld:", { input: args.inputValue });

    // The value you return from a Cloud Script function is passed back
    // to the game client in the ExecuteCloudScript API response, along with any log statements
    // and additional diagnostic information, such as any errors returned by API calls or external HTTP
    // requests. They are also included in the optional player_executed_cloudscript PlayStream event
    // generated by the function execution.
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels/player/player_executed_cloudscript)
    return { messageValue: message };
}

// This is a simple example of making a PlayFab server API call
handlers.makeAPICall = function (args, context) {

    // The pre-defined "server" object has functions corresponding to each PlayFab server API
    // (https://api.playfab.com/Documentation/Server). It is automatically
    // authenticated as your title and handles all communication with
    // the PlayFab API, so you don't have to write extra code to issue HTTP requests.
    var playerStatResult = server.UpdateUserStatistics (
        {
            PlayFabId: currentPlayerId,
            UserStatistics: {Level:2}
        }
    );
}

// This is a simple example of making a web request to an external HTTP API.
handlers.makeHTTPRequest = function (args, context) {
    var headers = {
        "X-MyCustomHeader": "Some Value"
    };

    var body = {
        input: args,
        userId: currentPlayerId,
        mode: "foobar"
    };

    var url = "http://httpbin.org/status/200";
    var content = JSON.stringify(body);
    var httpMethod = "post";
    var contentType = "application/json";
    var logRequestAndResponse = true;

    // The pre-defined http object makes synchronous HTTP requests
    var response = http.request(url, httpMethod, content, contentType, headers, logRequestAndResponse);
    return { responseContent: response };
}

// This is a simple example of a function that is called from a
// PlayStream event action. (https://playfab.com/introducing-playstream/)
handlers.handlePlayStreamEventAndProfile = function (args, context) {

    // The event that triggered the action
    // (https://api.playfab.com/playstream/docs/PlayStreamEventModels)
    var psEvent = context.playStreamEvent;

    // The profile data of the player associated with the event
    // (https://api.playfab.com/playstream/docs/PlayStreamProfileModels)
    var profile = context.playerProfile;

    // Post data about the event to an external API
    var content = JSON.stringify({user: profile.PlayerId, event: psEvent.EventName});
    var response = http.request('https://httpbin.org/status/200', 'post', content, 'application/json', null, true);

    return { externalAPIResponse: response };
}


// Below are some examples of using Cloud Script in slightly more realistic scenarios

// This is a function that the game client would call whenever a player completes
// a level. It updates a setting in the player's data that only game server
// code can write - it is read-only on the client - and it updates a player
// statistic that can be used for leaderboards.
//
// A funtion like this could be extended to perform validation on the
// level completion data to detect cheating. It could also do things like
// award the player items from the game catalog based on their performance.
handlers.completedLevel = function (args, context) {
    var level = args.levelName;
    var monstersKilled = args.monstersKilled;

    var updateUserDataResult = server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            lastLevelCompleted: level
        }
    });

    log.debug("Set lastLevelCompleted for player " + currentPlayerId + " to " + level);

    server.UpdateUserStatistics({
        PlayFabId: currentPlayerId,
        UserStatistics: {
            level_monster_kills: monstersKilled
        }
    });

    log.debug("Updated level_monster_kills stat for player " + currentPlayerId + " to " + monstersKilled);
}


// In addition to the Cloud Script handlers, you can define your own functions and call them from your handlers.
// This makes it possible to share code between multiple handlers and to improve code organization.
handlers.updatePlayerMove = function (args) {
    var validMove = processPlayerMove(args);
    return { validMove: validMove };
}



// This is a helper function that verifies that the player's move wasn't made
// too quickly following their previous move, according to the rules of the game.
// If the move is valid, then it updates the player's statistics and profile data.
// This function is called from the "UpdatePlayerMove" handler above and also is
// triggered by the "RoomEventRaised" Photon room event in the Webhook handler
// below.
//
// For this example, the script defines the cooldown period (playerMoveCooldownInSeconds)
// as 15 seconds. A recommended approach for values like this would be to create them in Title
// Data, so that they can be queries in the script with a call to GetTitleData
// (https://api.playfab.com/Documentation/Server/method/GetTitleData). This would allow you to
// make adjustments to these values over time, without having to edit, test, and roll out an
// updated script.
function processPlayerMove(playerMove) {
    var now = Date.now();
    var playerMoveCooldownInSeconds = 15;

    var playerData = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: ["last_move_timestamp"]
    });

    var lastMoveTimestampSetting = playerData.Data["last_move_timestamp"];

    if (lastMoveTimestampSetting) {
        var lastMoveTime = Date.parse(lastMoveTimestampSetting.Value);
        var timeSinceLastMoveInSeconds = (now - lastMoveTime) / 1000;
        log.debug("lastMoveTime: " + lastMoveTime + " now: " + now + " timeSinceLastMoveInSeconds: " + timeSinceLastMoveInSeconds);

        if (timeSinceLastMoveInSeconds < playerMoveCooldownInSeconds) {
            log.error("Invalid move - time since last move: " + timeSinceLastMoveInSeconds + "s less than minimum of " + playerMoveCooldownInSeconds + "s.")
            return false;
        }
    }

    var playerStats = server.GetUserStatistics({
        PlayFabId: currentPlayerId
    }).UserStatistics;

    if (playerStats.movesMade)
        playerStats.movesMade += 1;
    else
        playerStats.movesMade = 1;

    server.UpdateUserStatistics({
        PlayFabId: currentPlayerId,
        UserStatistics: playerStats
    });

    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            last_move_timestamp: new Date(now).toUTCString(),
            last_move: JSON.stringify(playerMove)
        }
    });

    return true;
}

// This is an example of using PlayStream real-time segmentation to trigger
// game logic based on player behavior. (https://playfab.com/introducing-playstream/)
// The function is called when a player_statistic_changed PlayStream event causes a player
// to enter a segment defined for high skill players. It sets a key value in
// the player's internal data which unlocks some new content for the player.
handlers.unlockHighSkillContent = function(args, context)
{
    var playerStatUpdatedEvent = context.playStreamEvent;

    var playerInternalData = server.UpdateUserInternalData(
    {
        PlayFabId: currentPlayerId,
        "Data": {
            "HighSkillContent": true,
            "XPAtHighSkillUnlock": playerStatUpdatedEvent.StatisticValue
          }
    });

    log.info('Unlocked HighSkillContent for ' + context.playerProfile.DisplayName);
    return { profile: context.playerProfile };
}

// Photon Webhooks Integration
//
// The following functions are examples of Photon Cloud Webhook handlers.
// When you enable the Photon Add-on (https://playfab.com/marketplace/photon/)
// in the Game Manager, your Photon applications are automatically configured
// to authenticate players using their PlayFab accounts and to fire events that
// trigger your Cloud Script Webhook handlers, if defined.
// This makes it easier than ever to incorporate multiplayer server logic into your game.


// Triggered automatically when a Photon room is first created
handlers.RoomCreated = function (args) {
    log.debug("Room Created - Game: " + args.GameId + " MaxPlayers: " + args.CreateOptions.MaxPlayers);
}

// Triggered automatically when a player joins a Photon room
handlers.RoomJoined = function (args) {
    log.debug("Room Joined - Game: " + args.GameId + " PlayFabId: " + args.UserId);
}

// Triggered automatically when a player leaves a Photon room
handlers.RoomLeft = function (args) {
    log.debug("Room Left - Game: " + args.GameId + " PlayFabId: " + args.UserId);
}

// Triggered automatically when a Photon room closes
// Note: currentPlayerId is undefined in this function
handlers.RoomClosed = function (args) {
    log.debug("Room Closed - Game: " + args.GameId);
}

// Triggered automatically when a Photon room game property is updated.
// Note: currentPlayerId is undefined in this function
handlers.RoomPropertyUpdated = function(args) {
    log.debug("Room Property Updated - Game: " + args.GameId);
}

// Triggered by calling "OpRaiseEvent" on the Photon client. The "args.Data" property is
// set to the value of the "customEventContent" HashTable parameter, so you can use
// it to pass in arbitrary data.
handlers.RoomEventRaised = function (args) {
    var eventData = args.Data;
    log.debug("Event Raised - Game: " + args.GameId + " Event Type: " + eventData.eventType);

    switch (eventData.eventType) {
        case "playerMove":
            processPlayerMove(eventData);
            break;

        default:
            break;
    }
}
