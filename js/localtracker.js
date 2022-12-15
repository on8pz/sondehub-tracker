
var local_livedata = "ws://sonde.bitnet.be:9001/";
var local_clientID = "SondeHub-Tracker-" + Math.floor(Math.random() * 10000000000);
var local_client = new Paho.Client(local_livedata, local_clientID);
var local_clientConnected = false;
var local_clientActive = false;
var local_clientTopic;
var local_messageRate = 0;
var local_messageRateAverage = 10;


local_live_data_buffer = {positions:{position:[]}}
function local_liveData() {
    local_client.onConnectionLost = local_onConnectionLost;
    local_client.onMessageArrived = local_onMessageArrived;

    local_client.connect({onSuccess:local_onConnect,onFailure:local_connectionError,reconnect:true});

    function local_onConnect() {
        if (wvar.query && sondePrefix.indexOf(wvar.query) == -1) {
            var topic = "sondes/" + wvar.query;
            local_client.subscribe(topic);
            local_clientTopic = topic;
        } else {
            local_client.subscribe("batch");
            local_clientTopic = "batch";
        }
        // Also subscribe to listener data, for listener and chase-car telemetry.
        // To revert listener-via-websockets change, comment out this line,
        // and un-comment the 'Disable periodical listener refresh' lines further below.
        local_client.subscribe("listener/#");

        local_clientConnected = true;
        $("#stText").text("websocket |");
    };

    function local_connectionError(error) {
        $("#stText").text("conn. error |");
        local_clientConnected = false;
        local_clientActive = false;
        if (!document.getElementById("stTimer").classList.contains('friendly-dtime') ) {
            document.getElementById("stTimer").classList.add('friendly-dtime');
            $("#updatedText").text(" Updated: ");
        }
        refresh();
    };

    function local_onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            local_clientConnected = false;
            local_clientActive = false;
            if (!document.getElementById("stTimer").classList.contains('friendly-dtime') ) {
                document.getElementById("stTimer").classList.add('friendly-dtime');
                $("#updatedText").text(" Updated: ");
            }
            refresh();
        }
    };

    function local_onMessageArrived(message) {
        local_messageRate += 1;
        setTimeout(function(){
            local_messageRate -= 1;
          }, (1000 * local_messageRateAverage));
        if ( document.getElementById("stTimer").classList.contains('friendly-dtime') ) {
            document.getElementById("stTimer").classList.remove('friendly-dtime');
        }
        $("#stTimer").text(Math.round(local_messageRate/10) + " msg/s");
        $("#updatedText").text(" ");
        var dateNow = new Date().getTime();
        try {
            if (local_clientActive) {
                if(message.topic.startsWith("listener")){
                    // Message is Listener / Chase-Car information
                    var frame = JSON.parse(message.payloadString.toString());
                    // We need to convert this into the right format for feeding into the receiver / chase car update functions.
                    // Probably a cleaner way of doing this.
                    // Format needs to be {callsign : {timestamp: frame}}
                    var formatted_frame = {};
                    formatted_frame[frame.uploader_callsign] = {};
                    formatted_frame[frame.uploader_callsign][frame.ts] = frame;

                    // Send frames with mobile present and true onto the chase-car updater,
                    // otherwise, send them to the receiver updater.
                    // Do this on a per-update bases, since listener / chase car updates shouldn't
                    // be as frequent.
                    if(frame.hasOwnProperty('mobile')) {
                        if(frame.mobile == true) {
                            updateChase(formatted_frame);
                        } else {
                            updateReceivers(formatted_frame, single=true);
                        }
                    } else {
                        updateReceivers(formatted_frame, single=true);
                    }

                } else {
                    var frame = JSON.parse(message.payloadString.toString());

                    if (wvar.query == "" || sondePrefix.indexOf(wvar.query) > -1 || wvar.query == frame.serial) {

                        var test = formatData(frame, true);
                        if (local_clientActive) {
                            local_live_data_buffer.positions.position.push.apply(local_live_data_buffer.positions.position,test.positions.position)
                            $("#stTimer").attr("data-timestamp", dateNow);
                            $("#stText").text("websocket |");
                        }
                    }
                }
            } else {
                console.log("WebSockets - Discarding Message, not ready yet.")
            }
        }
        catch(err) {}
    };
}


// Interval to read in the live data buffer and update the page.
setInterval(function(){
    update(local_live_data_buffer);
    local_live_data_buffer.positions.position=[];
}, 500)

