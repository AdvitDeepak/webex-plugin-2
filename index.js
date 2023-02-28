// Create a new Webex app instance
var app = new window.Webex.Application();

// Wait for onReady() promise to fulfill before using framework
app.onReady().then(() => {
    log("App ready. Instance", app);
}).catch((errorcode) =>  {
    log("Error with code: ", Webex.Application.ErrorCodes[errorcode])
});

function send() {
    fetch('http://127.0.0.1:5000/send')
    .then(response => response.json())
    .then((data) => {
      let summary = data.summary 
      let actionables = data.actionables 
      let time = data.time 
      let uncertainty = data.uncertainty 

      let summaryContainer = document.getElementById('summaryContainer')
      summaryContainer.innerHTML = `<div>${summary}</div>`
      let actionablesContainer = document.getElementById('actionablesContainer')
      actionablesContainer.innerHTML = `<div>${actionables}</div>`
      let timeContainer = document.getElementById('timeContainer')
      timeContainer.innerHTML = `<div>${time}</div>`
      let uncertaintyContainer = document.getElementById('uncertaintyContainer')
      uncertaintyContainer.innerHTML = `<div>${uncertainty}</div>`
    })

    setTimeout(send, 5000);
}

send(); 


// Utility function to log app messages
function log(type, data) {
    var ul = document.getElementById("console");
    var li = document.createElement("li");
    var payload = document.createTextNode(`${type}: ${JSON.stringify(data)}`);
    li.appendChild(payload)
    ul.prepend(li);
}
