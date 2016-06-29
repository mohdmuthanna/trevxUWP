﻿var positionUpdateInterval = 0;
var serverStarted = false;
var isMusicPlaying = false;
var initialized = false;

var resultList = [];
var favoritesList = [];


var MediaPlaybackStatus = Windows.Media.MediaPlaybackStatus;
var MediaPlayerState = Windows.Media.Playback.MediaPlayerState;
var mediaPlayer = Windows.Media.Playback.BackgroundMediaPlayer.current;
var smtc = Windows.Media.SystemMediaTransportControls.getForCurrentView();


function initializeBackgroundAudio() {
    setupSMTC();
    Windows.Media.Playback.BackgroundMediaPlayer.addEventListener("messagereceivedfrombackground", messagereceivedHandler);
    mediaPlayer.autoPlay = false;
    mediaPlayer.addEventListener("currentstatechanged", backgroundAudioStateChanged);
}

function addApplicationEventHandlers() {
    document.getElementById("PlayButton").addEventListener("click", startOrResume, false);
    document.getElementById("PauseButton").addEventListener("click", pausePlayback, false);
    document.getElementById("NextButton").addEventListener("click", playNextSong, false);
    document.getElementById("PreviousButton").addEventListener("click", playPrevSong, false);

    document.getElementById("trevxSearchButton").addEventListener("click", searchForQuery, false);

    $('#results').on('click', '.add-remove-fav', function () {
        //send onAppId & id wich is song id in trevx database
        AddRemoveFav(this.getAttribute('on-app-id'),this.id);
        console.log(this.id);
    });

    $('#results').on('click', '.audio-line', function () {
        //send send to background
        PlayThisAudio("resultlist", this.getAttribute('on-app-id'));
        //startOrResume();
        //startPlaylist();
        initializeBackgroundAudio()
        console.log(this.id);
    });

    $('#fav').on('click', '.audio-line', function () {
        //send send to background
        PlayThisAudio("favoritesList", this.getAttribute('on-app-id'));
        console.log(this.id);
    });

    try {
        Windows.Media.Playback.BackgroundMediaPlayer.onmessagereceivedfrombackground = function (e) {
            messagereceivedHandler(e);
        }
        if (mediaPlayer.currentState != Windows.Media.Playback.MediaPlayerState.playing) {
            document.getElementById("PauseButton").disabled = true;
            document.getElementById("NextButton").disabled = true;
        }
    } catch (err) {
        console.log(err);
    }

}

function removeMediaPlayerEventHandlers() {
    mediaPlayer.removeEventListener("currentstatechanged", backgroundAudioStateChanged);
    Windows.Media.Playback.BackgroundMediaPlayer.removeEventListener("messagereceivedfrombackground", messagereceivedHandler);
}

// Messages from audio background task will be handled here
function messagereceivedHandler(e) {
    var messageSize = e.detail.length;
    for (var i = 0; i < messageSize; i++) {
        for (var key in e.detail[i].data) {
            switch (key) {
                case Messages.ServerStarted:
                    serverStarted = true;
                    break;
                case Messages.MyMusicIsPlaying:
                    isMusicPlaying = true;
                    smtc.playbackStatus = MediaPlaybackStatus.playing;
                    break;
                case Messages.CurrentSong:
                    updateCurrentSong(e.detail[i].data[key]);
                    break;
            }
        }
    }
}

function updateCurrentSong(songName) {
    smtc.displayUpdater.type = MediaPlaybackType.music;
    smtc.displayUpdater.musicProperties.title = songName;
    smtc.displayUpdater.update();
}

function startOrResume() {
    if (!initialized) {
        startPlaylist();
    } else {
        mediaPlayer.play();
    }
}

function pausePlayback() {
    if (mediaPlayer.canPause) {
        mediaPlayer.pause();
    }
}


function getAudioTitle(title) {
    if (title.length > 40) {
        title = title.substr(0, 39) + "..";
    }
    return title;
}
function getAudioImage(imgUrl) {
    if (imgUrl.length == 0) {
        imgUrl = "images/cover-img.jpg";
    }
    return imgUrl;
}

function searchForQuery() {
    var searchQueryValueEncoded = encodeURI(document.getElementById("trevxSearchBox").value);
    if (searchQueryValueEncoded.length > 0) {
        var url = 'http://trevx.com/v1/' + searchQueryValueEncoded + '/0/40/?format=json';
        $.getJSON(url, function (data) {
            resultList = data.slice(0, data.length - 7);
            WriteTextFileResult(resultList);
            sendResultList(JSON.stringify(resultList));
            removeRedundentResult();
            if (resultList.length > 0) {
                document.getElementById("results").innerHTML = createAudioLines(resultList);
            } else {
                document.getElementById("results").innerHTML = "No results found";
            }
        });
    }
};

function sendResultList(list) {
        var message = new Windows.Foundation.Collections.ValueSet();
        message.insert(Messages.ResultPlaylist, list);
        Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
        console.log("sendResultList function");
};

function sendFavoritesList(list) {
    var message = new Windows.Foundation.Collections.ValueSet();
    message.insert(Messages.FavoritesList, list);
    Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
    //console.log("sendfavoritesList function");
};

function PlayThisAudio(activeList, onAppId) {
    console.log("activ " + activeList);
    var message = new Windows.Foundation.Collections.ValueSet();
    var detail = { activeList: activeList, onAppId: onAppId };
    message.insert(Messages.PlayThisAudio, JSON.stringify(detail));
    Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
    console.log("sendResultList function");
};


function AddRemoveFav(onAppId, id) {
    var isFavored = checkIfFavored(id);
    //console.log("id = " +id +  "  isFavored = " + isFavored);
    
    if (isFavored == -1) {
        addToFavorites(onAppId);
    } else {
        removeFromFavorites(id);
    };

    WriteTextFileFav(favoritesList);
    sendFavoritesList(JSON.stringify(favoritesList));
    document.getElementById("fav").innerHTML = createAudioLines(favoritesList);
    //ReadTextFileFav();

}

function checkIfFavored(target) {
        for (var i = 0; i < favoritesList.length; i++) {
            if (favoritesList[i].id == target) {
                return [i];
            }
        }
        return -1;

}

function addToFavorites(target){
  // max length should not be more than 250, because google SafeSearch API cant handel more than 500 links
  // and every audio has tow links, image & audio url
    if (favoritesList.length < 249) {
        console.log("ddddd  " + resultList.length);
    for (var i = 0; i < resultList.length; i++) {
      if (resultList[i].id == target) {
        var active = i;
      }
    }
    var element = resultList[active];
    favoritesList.push(resultList[target]);
  } else {
    alert("Sorry, your favorites list is full, remove some items and the try add new item");
  }

} // add to favorite

function removeFromFavorites(target){
  for (var i = 0; i < favoritesList.length; i++) {
    if (favoritesList[i].id == target) {
      favoritesList.splice( i, 1 );
    }
  }
}



function createAudioLines(list) {
    var links = '';
    for (var i = 0; i < list.length; i++) {
        //"<a class='action' id='" + resultList[i].id + "'href='#'>"
        links += "<span id=" + list[i].id + " class='add-remove-fav' on-app-id=" + i + ">add to fav</span>" + "<p id=" + list[i].id + " on-app-id=" + i + " class='audio-line'>" + list[i].title + "</p>";
    }
    return links;
}


//Read and Wite file
var applicationData = Windows.Storage.ApplicationData.current;
var localFolder = applicationData.localFolder;

// This  to read fav-list file
function WriteTextFileResult(JSONlist) {
    localFolder.createFileAsync("searchResult.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
   .then(function (sampleFile) {
       return Windows.Storage.FileIO.writeTextAsync(sampleFile, JSON.stringify(JSONlist));

   }).done(function () {
       console.log("Saved completely ");
       // console.log("beforddddd  " + JSON.stringify(sx).length);
   }, function () {
       console.log("Not saved ");
   });
}

// This  to read fav-list file
function ReadTextFileResult() {
    localFolder.getFileAsync("searchResult.txt")
   .then(function (sampleFile) {

       return Windows.Storage.FileIO.readTextAsync(sampleFile);;
   }).done(function (timestamp) {
       //list to html
       if (JSON.parse(timestamp).length > 0) {
           resultList = JSON.parse(timestamp);
           document.getElementById("results").innerHTML = createAudioLines(resultList);
           sendResultList(timestamp);
           console.log("read done, msg should sent ");
       } else {
           document.getElementById("results").innerHTML = "search for a music";
       }
       
   }, function () {
       document.getElementById("results").innerHTML = "an erorr accured";
       console.log("not exisit");
   });
}


function WriteTextFileFav(JSONlist) {
    localFolder.createFileAsync("fav.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
   .then(function (sampleFile) {
       return Windows.Storage.FileIO.writeTextAsync(sampleFile, JSON.stringify(JSONlist));

   }).done(function () {
       console.log("Saved completely ");
       // console.log("beforddddd  " + JSON.stringify(sx).length);
   }, function () {
       console.log("Not saved ");
   });
}

// This  to read fav-list file
function ReadTextFileFav() {
    localFolder.getFileAsync("fav.txt")
   .then(function (sampleFile) {

       return Windows.Storage.FileIO.readTextAsync(sampleFile);;
   }).done(function (timestamp) {
       //list to html
       try {
           if (JSON.parse(timestamp).length > 0) {
               favoritesList = JSON.parse(timestamp);
               document.getElementById("fav").innerHTML = createAudioLines(favoritesList);
               sendResultList(timestamp);
               console.log("read done, msg should sent ");
           } else {
               document.getElementById("fav").innerHTML = "no fav added yet";
           }
       } catch (err) {
           console.log(err);
       }


   }, function () {
       document.getElementById("fav").innerHTML = "an erorr accured";
       console.log("not exisit");
   });
}

function removeRedundentResult() {
    resultList = resultList.reduceRight(function (r, a) {
        r.some(function (b) { return a.link === b.link; }) || r.push(a);
        return r;
    }, []);
    resultList = resultList.reverse();
};

//
// To start playback send message to the background
//
function startPlaylist() {
    if (!initialized) {
        initializeBackgroundAudio();
        var message = new Windows.Foundation.Collections.ValueSet();
        if (serverStarted == true) {
            message.insert(Messages.StartPlayback, "");
            Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
            initialized = true;
        }
    }

    document.getElementById("PauseButton").disabled = false;
    document.getElementById("NextButton").disabled = false;
    

}

function playNextSong() {
    var message = new Windows.Foundation.Collections.ValueSet();
    message.insert("SkipSong", "");
    Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
}

function playPrevSong() {
    var message = new Windows.Foundation.Collections.ValueSet();
    message.insert("PrevSong", "");
    Windows.Media.Playback.BackgroundMediaPlayer.sendMessageToBackground(message);
}

//
// Display and update progress bar
//
function progressBar() {
    try {
        //get current position 
        var elapsedTime = Math.round(mediaPlayer.position);
        //update the progress bar
        if (canvas.getContext) {
            var ctx = canvas.getContext("2d");
            //clear canvas before painting
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            ctx.fillStyle = "#DD4433";
            var fWidth = (elapsedTime / mediaPlayer.naturalDuration) * (canvas.clientWidth);
            if (fWidth > 0) {
                ctx.fillRect(0, 0, fWidth, canvas.clientHeight);
            }
        }
    }
    catch (error) {

        log(error.message);
        log(error.description);
    }

}

//
// This method sets the interval to update the progress bar on the UI
//
function backgroundAudioStateChanged() {
    if (mediaPlayer != null) {
        var currentState = mediaPlayer.currentState;
        if (currentState == Windows.Media.Playback.MediaPlayerState.playing) {
            smtc.playbackStatus = MediaPlaybackStatus.playing;
            document.getElementById("PauseButton").disabled = false;
            document.getElementById("PlayButton").disabled = true;
            if (positionUpdateInterval == 0) {
                positionUpdateInterval = window.setInterval(progressBar, 1000, "test");
            }
        }
        else if (currentState == Windows.Media.Playback.MediaPlayerState.paused) {
            smtc.playbackStatus = MediaPlaybackStatus.paused;
            document.getElementById("PauseButton").disabled = true;
            document.getElementById("PlayButton").disabled = false;
            if (positionUpdateInterval != 0) {
                window.clearInterval(positionUpdateInterval);
                positionUpdateInterval = 0;
            }
        }
        else if (currentState == MediaPlayerState.stopped) {
            smtc.playbackStatus = MediaPlaybackStatus.closed;
            if (positionUpdateInterval != 0) {
                window.clearInterval(positionUpdateInterval);
                positionUpdateInterval = 0;
            }
        }
    }
}

function log(message) {
    var statusDiv = document.getElementById("statusMessage");
    if (statusDiv) {
        message += "\n";
        statusDiv.innerText += message;
    }
}

function skipSong()
{
    smtc.playbackStatus = MediaPlaybackStatus.changing;
    playNextSong();
}

function prevSong() {
    smtc.playbackStatus = MediaPlaybackStatus.changing;
    playPrevSong();
}


function smtc_buttonPressed(ev) {
    try {
        console.log(ev.button);
        switch (ev.button) {
            case 0:
                mediaPlayer.play();
                break;
            case 1:
                mediaPlayer.pause();
                break;
            //case SystemMediaTransportControlsButton.next: 
            case 6:
                this.skipSong();
                break;
            case 7:
                this.prevSong();
                break;
        }
    } catch (err) {
        console.log(ev.button);
        console.log(err);
    }
};

function systemmediatransportcontrol_propertyChanged(ev) {};

function setupSMTC()
{
    smtc.addEventListener("buttonpressed", this.smtc_buttonPressed.bind(this));
    smtc.addEventListener("propertychanged", this.systemmediatransportcontrol_propertyChanged.bind(this));
    smtc.isEnabled = true;
    smtc.isPauseEnabled = true;
    smtc.isPlayEnabled = true;
    smtc.isNextEnabled = true;
    smtc.isPreviousEnabled = true;
}
window.onload = function(){
    ReadTextFileFav();
    ReadTextFileResult();
}
