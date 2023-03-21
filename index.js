// Create a new Webex app instance
var app = new window.Webex.Application();
var REST_API_READ_CONTAINERS = 'http://127.0.0.1:5000/read'
var REST_API_SEND_KEYS_IDS = 'http://127.0.0.1:5000/send'
var flag = false; 
var update_interval = 5000; // in ms 


// Wait for onReady() promise to fulfill before using framework
app.onReady().then(() => {
    log("App ready. Instance", app);
}).catch((errorcode) =>  {
    log("Error with code: ", Webex.Application.ErrorCodes[errorcode])
});


let webex;
let receiveTranscriptionOption;

const meetingsListElm = [];
const meetingsCurrentDetailsElm = "";

var ACCESSTOKEN = "";





// Send function to send keys/ids to the REST API 
function submitForm() {
    var webexId = document.getElementById("webex-id").value;
    var openaiKey = document.getElementById("openai-key").value;
  
    if (webexId === "" || openaiKey === "") {
      alert("Please enter values for both input boxes!");
      return;
    }
  

    // Call big scrip tto use WebexID key to register the mtg 

    ACCESSTOKEN = webexId; 
    registerMeeting(); 

    // Call REST API with webexId and openaiKey values here

    fetch(REST_API_SEND_KEYS_IDS, {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        webexId: webexId,
        openaiKey: openaiKey
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        flag = true; 
        document.getElementById("webex-id").value = "Successfully received."; 
        document.getElementById("openai-key").value = "Successfully received."; 

        return response.json();
        })
    .catch(error => {
        console.error("There was a problem with the send operation:", error);
    });  
    read(); 
}


// Read function to call rest api and update HTML plugin 
function read() {
    console.log("We in the READ function again BOIS"); 
    if (!flag) { 
        setTimeout(function() {
            read(); 
        }, update_interval); 
    } // Haven't received keys, so return! 
    console.log("Made it past the flag check, so we're chilling!"); 
    fetch(REST_API_READ_CONTAINERS)
    .then(response => response.json())
    .then((data) => {
      let summary = data.summary 
      let summaryContainer = document.getElementById('summaryContainer')
      summaryContainer.innerHTML = `<div>${summary}</div>`

      let actionables = data.actionables 
      let actionablesContainer = document.getElementById('actionablesContainer')
      actionablesContainer.innerHTML = `<div>${actionables}</div>`

      let time = data.time 
      let timeContainer = document.getElementById('timeContainer')
      timeContainer.innerHTML = `<div>${time}</div>`

    //   let uncertainty = data.uncertainty 
    //   let uncertaintyContainer = document.getElementById('uncertaintyContainer')
    //   uncertaintyContainer.innerHTML = `<div>${uncertainty}</div>`
    })

    setTimeout(function() {
        read(); 
    }, update_interval);
}


// Utility function to log app messages
function log(type, data) {
    var ul = document.getElementById("console");
    var li = document.createElement("li");
    var payload = document.createTextNode(`${type}: ${JSON.stringify(data)}`);
    li.appendChild(payload)
    ul.prepend(li);
}

// ---------------------------------------------------------


function registerMeeting() {

    console.log("Entered script, got access token"); 
    console.log(ACCESSTOKEN);

    initWebex(); 
    console.log("Initialized Webex"); 

    setTimeout(function() {
        register();
        console.log("Register meeting");
    }, 1000); 

    setTimeout(function() {
        collectMeetings();
        console.log("Collected meetings");
    }, 2000); 

    setTimeout(function() {
        startReceivingTranscription(); 
        console.log("Started receiving transcription");
    }, 3000);

    setTimeout(function() {
        console.log(meetingsListElm);
        joinMeeting(meetingsListElm[0]);
        console.log("Finished, should be receiving now!!");
    }, 4000); 
}

function initWebex() {
    console.log('Authentication#initWebex()');
  
    webex =  window.webex = Webex.init({
      config: {
        logger: {
          level: 'debug'
        },
        meetings: {
          reconnection: {
            enabled: true
          },
          enableRtx: true,
          experimental: {
            enableUnifiedMeetings: true
          }
        }
        // Any other sdk config we need
      },
      credentials: {
        access_token: ACCESSTOKEN
      }
    });
  
    webex.once('ready', () => {
      console.log('Authentication#initWebex() :: Webex Ready');
    });
}
  
function register() {
    console.log('Authentication#register()');

    webex.meetings.register()
        .then(() => {
        console.log('Authentication#register() :: successfully registered');
        })
        .catch((error) => {
        console.warn('Authentication#register() :: error registering', error);
        })
        .finally(() => {
        });

    webex.meetings.on('meeting:added', (m) => {
        const {type} = m;

        if (type === 'INCOMING') {
        const newMeeting = m.meeting;

        toggleDisplay('incomingsection', true);
        newMeeting.acknowledge(type);
        }
    });
}

function generateMeetingsListItem_MODIFIED(meeting) {
    const itemElm = document.createElement('div');
    const joinElm = document.createElement('button');
    const detailsElm = document.createElement('label');

    itemElm.id = `meeting-list-item-${meeting.id}`;
    itemElm.key = meeting.id;

    joinElm.onclick = () => joinMeeting(meeting.id);
    joinElm.type = 'button';
    joinElm.value = meeting.id;
    joinElm.innerText = 'meeting.join()';

    detailsElm.innerText = meeting.destination ||
        meeting.sipUri ||
        meeting.id;

    itemElm.appendChild(joinElm);
    itemElm.appendChild(detailsElm);

    return meeting.id;
    }

function collectMeetings() {
console.log('MeetingsManagement#collectMeetings()');

webex.meetings.syncMeetings()
    .then(() => new Promise((resolve) => {
    setTimeout(() => resolve(), 200);
    }))
    .then(() => {
    console.log('MeetingsManagement#collectMeetings() :: successfully collected meetings');
    const meetings = webex.meetings.getAllMeetings();

    if (Object.keys(meetings).length === 0) {
        return;
    }

    Object.keys(meetings).forEach(
        (key) => {
        meetingsListElm.push(
            generateMeetingsListItem_MODIFIED(meetings[key])
        );
        }
    );
    });
}

function joinMeeting(meetingId) {
const meeting = webex.meetings.getAllMeetings()[meetingId];

if (!meeting) {
    throw new Error(`meeting ${meetingId} is invalid or no longer exists`);
}

const joinOptions = {
    moveToResource: false,
    resourceId: webex.devicemanager._pairedDevice ?
    webex.devicemanager._pairedDevice.identity.id :
    undefined,
    receiveTranscription: receiveTranscriptionOption
};

meeting.join(joinOptions)
    .then(() => {
    meetingsCurrentDetailsElm = meeting.destination ||
        meeting.sipUri ||
        meeting.id;
    });
}

function getNormalizedMeetingId(meeting) {
return meeting.sipUri || meeting.id;
}

function getCurrentMeeting() {
const meetings = webex.meetings.getAllMeetings();

return meetings[Object.keys(meetings)[0]];
}

function startReceivingTranscription() {
const meeting = getCurrentMeeting();

if (meeting) {
    receiveTranscriptionOption = true;

    meeting.on('meeting:receiveTranscription:started', (payload) => {      
    console.log('about to start');

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:5000/proc", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        value: payload 
    }));

    console.log('xhr.status=',xhr.status);
    console.log('response=',xhr.responseText);

    });

    meeting.on('meeting:receiveTranscription:stopped', () => {
    });
}
else {
    console.log('MeetingControls#startRecording() :: no valid meeting object!');
}
}

const getOptionValue = (select) => {
const selected = select.options[select.options.selectedIndex];

return selected ? selected.value : undefined;
};
  

// Script will continuously execute "read" function
//read(); 
