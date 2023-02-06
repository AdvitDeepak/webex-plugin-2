var app = new window.Webex.Application();

// Wait for onReady promise, handle error scenario
app.onReady().then(() => {
    log("Application ready. App", app);
    // Display the ID of the current user
    app.context.getUser().then((user)=> {
        log("User ID", user.id)
    }).catch((errorcode) => {
        log("Error", errorcode)
    })
}).catch((errorcode) =>  {
    log("Error with code: ", Webex.Application.ErrorCodes[errorcode])
});

function log(type, data) {
    var ul = document.getElementById("console");
    var li = document.createElement("li");
    var payload = document.createTextNode(`${type}: ${JSON.stringify(data)}`);
    li.appendChild(payload)
    ul.prepend(li);
}