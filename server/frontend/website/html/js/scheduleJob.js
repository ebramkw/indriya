var timeline = null;
var items = null;
var counter;
var moveTo = 0;
var mousedownInterval;
var jobName;
var s = null;
var e = null;
var jobID;
var timeNowAtServer;

function scheduleJob() {    
    var i = this.id.split("@");
    jobID = i[0];
    
    scheduleJobFun();
}

function scheduleJobFun() {
    //get busy times for selected motes (job) and job name
    var jobInfo = new FormData();
    jobInfo.append('userID', userID);
    jobInfo.append('jobID', jobID);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'php/getBusySlots.php', true);
    xhr.send(jobInfo);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var motesBusySlotsXML = xhr.responseXML;
            usedQuota = parseInt(motesBusySlotsXML.getElementsByTagName("usedQuota")[0].childNodes[0].nodeValue);
            var quotaLabel = document.getElementById("quotaReportLabel");
            quotaLabel.innerHTML = "You have a quota (dd.hh:mm) of " + showQuota(quota) + "<br>(" + showQuota(usedQuota) + " of pending jobs and " + showQuota((quota - usedQuota)) + " available)<br><br>Time now: " + timeAtServer.toString().split(' ', 5).join(' ') + " (SGT)";
            
            //allow schedule if usedQuota < Allowd
            if(usedQuota < quota) {                
                jobName = motesBusySlotsXML.getElementsByTagName("jobName")[0].childNodes[0].nodeValue;
                document.getElementById("scheduleJobLegend").innerHTML = "Schedule \"" + motesBusySlotsXML.getElementsByTagName("jobName")[0].childNodes[0].nodeValue + "\" Job";

                // timeNowAtServer = new Date(motesBusySlotsXML.getElementsByTagName("timeNowAtServer")[0].childNodes[0].nodeValue.replace(/-/g, "/"));

                parts = motesBusySlotsXML.getElementsByTagName("timeNowAtServer")[0].childNodes[0].nodeValue.split(".");
                timeNowAtServer = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));

                var timezone = +8;
                var offset = (timeNowAtServer.getTimezoneOffset() + (timezone * 60)) * 60 * 1000;
                // Use the timestamp and offset as necessary to calculate min/sec etc, i.e. for countdowns.
                var timestamp = timeNowAtServer.getTime() + offset,
                    seconds = Math.floor(timestamp / 1000) % 60,
                    minutes = Math.floor(timestamp / 1000 / 60) % 60,
                    hours   = Math.floor(timestamp / 1000 / 60 / 60);

                // Or update the timestamp to reflect the timezone offset.
                timeNowAtServer.setTime(timeNowAtServer.getTime() + offset);
                // Then Output dates and times using the normal methods.
                var date = timeNowAtServer.getDate(),
                    hour = timeNowAtServer.getHours();


                //set max duration
                document.getElementById("durationJob").value = quota - usedQuota;
                document.getElementById("durationJob").max = quota - usedQuota;

                var container = document.getElementById("visualization");

                counter = 1;
                // Create a DataSet (allows two way data-binding)
                if(items == null)
                    items = new vis.DataSet([]);
                else {
                    items.get({
                        filter: function(testItem) {
                            items.remove(testItem);
                        }
                    });
                }
                
                //fill in items from XML file
                if(motesBusySlotsXML.getElementsByTagName("start").length != 0){
                    for(var i = 0; i < motesBusySlotsXML.getElementsByTagName("start").length; i++) {
                        var s = new Date(motesBusySlotsXML.getElementsByTagName("start")[i].childNodes[0].nodeValue.replace(/-/g, "/"));
                        var e = new Date(motesBusySlotsXML.getElementsByTagName("end")[i].childNodes[0].nodeValue.replace(/-/g, "/"));

                        items.add({id: counter, content: '', start: s, end: e, className: 'red', editable: false, selectable: false, type: 'range', title: 'Busy'});
                        counter++;
                        
                    }
                }

                // fill in sunday midnight
                var s = new Date();    
                s.setDate(timeNowAtServer.getDate() + (0+(7-timeNowAtServer.getDay())) % 7);
                s.setHours(23,55,0,0);
                var e = vis.moment(s).add(25, 'm').toDate();
                items.add({id: counter, content: '', start: s, end: e, className: 'red', editable: false, selectable: false, type: 'range', title: 'Busy'});
                counter++;


                var minDate = timeNowAtServer;
                if(userAdmin == 1)
                    var maxDate = new Date(minDate.getTime() + 7*24*60*60*1000);
                else
                    var maxDate = new Date(minDate.getTime() + 2*24*60*60*1000);
                // Configuration for the Timeline

                var options = {
                    // moment: function (date) {
                    //     return vis.moment(date).utcOffset('+08:00');
                    // },

                    editable: {
                        add: true,
                        remove: true,
                    },
                    onAdd: itemAdded,
                    onRemove: itemRemoved,
                    onMoving: itemMoving,

                    // .utcOffset('+08:00')

                    min: minDate,
                    max: maxDate,
                    start: minDate,
                    end: maxDate,

                    //max zoom out - 12 hrs
                    zoomMax: 1000 * 60 * 60 * 12,
                    //max zoom in - 1 hr
                    zoomMin: 1000 * 60 * 60 * 0.5,

                    //timeAxis: {scale: 'minute', step: 5},

                    //clickToUse: true,

                    stack: false,

                    width: '100%',

                    height: '120px',

                    showTooltips: true,

                    moveable: true,

                    zoomable: true,
                    
                    //horizontalScroll: true,
                };

                // Create a Timeline
                if(timeline == null)
                    timeline = new vis.Timeline(container, items, options);
                else {
                    timeline.setOptions(options);
                    timeline.setData(items);
                }

                timeline.setCurrentTime(timeNowAtServer.getTime());
                // console.log(timeline.getCurrentTime().toString());
                
                setTimeout( function() {timeline.moveTo(timeNowAtServer);}, 1000);

                var jobsTableDiv = document.getElementById("jobsTableDiv");
                jobsTableDiv.style.display = "none";
                //jQuery(jobsTableDiv).toggle('slow');

                var scheduleJobDiv = document.getElementById("scheduleJobDiv");
                scheduleJobDiv.style.display = "block";
                //jQuery(scheduleJobDiv).toggle('slow');
            } else {
                alert("Sorry, we cannot schedule this job because it exceeds your quota!");
                
                var jobsTableDiv = document.getElementById("jobsTableDiv");
                jobsTableDiv.style.display = "block";
                
                var scheduleJobDiv = document.getElementById("scheduleJobDiv");
                scheduleJobDiv.style.display = "none";
            }
        }
    };
}

function refreshScheduleJob() {
    //get busy times for selected motes (job) and job name
    var jobInfo = new FormData();
    jobInfo.append('userID', userID);
    jobInfo.append('jobID', jobID);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'php/getBusySlots.php', true);
    xhr.send(jobInfo);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var motesBusySlotsXML = xhr.responseXML;
            
            usedQuota = motesBusySlotsXML.getElementsByTagName("usedQuota")[0].childNodes[0].nodeValue;
            var quotaLabel = document.getElementById("quotaReportLabel");
            quotaLabel.innerHTML = "You have a quota (dd.hh:mm) of " + showQuota(quota) + "<br>(" + showQuota(usedQuota) + " of pending jobs and " + showQuota((quota - usedQuota)) + " available)<br><br>Time now: " + timeAtServer.toString().split(' ', 5).join(' ') + " (SGT)";
            
            // timeNowAtServer = new Date(motesBusySlotsXML.getElementsByTagName("timeNowAtServer")[0].childNodes[0].nodeValue.replace(/-/g, "/"));
            
            parts = motesBusySlotsXML.getElementsByTagName("timeNowAtServer")[0].childNodes[0].nodeValue.split(".");
            timeNowAtServer = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));

            var timezone = +8;
            var offset = (timeNowAtServer.getTimezoneOffset() + (timezone * 60)) * 60 * 1000;
            // Use the timestamp and offset as necessary to calculate min/sec etc, i.e. for countdowns.
            var timestamp = timeNowAtServer.getTime() + offset,
                seconds = Math.floor(timestamp / 1000) % 60,
                minutes = Math.floor(timestamp / 1000 / 60) % 60,
                hours   = Math.floor(timestamp / 1000 / 60 / 60);

            // Or update the timestamp to reflect the timezone offset.
            timeNowAtServer.setTime(timeNowAtServer.getTime() + offset);
            // Then Output dates and times using the normal methods.
            var date = timeNowAtServer.getDate(),
                hour = timeNowAtServer.getHours();

            //set max duration
            document.getElementById("durationJob").value = quota - usedQuota;
            document.getElementById("durationJob").max = quota - usedQuota;

            var container = document.getElementById("visualization");

            counter = 1;
            // Create a DataSet (allows two way data-binding)
            if(items == null)
                items = new vis.DataSet([]);
            else {
                items.get({
                    filter: function(testItem) {
                        items.remove(testItem);
                    }
                });
            }

            //fill in items from XML file
            if(motesBusySlotsXML.getElementsByTagName("start").length != 0){
                for(var i = 0; i < motesBusySlotsXML.getElementsByTagName("start").length; i++) {
                    var s = new Date(motesBusySlotsXML.getElementsByTagName("start")[i].childNodes[0].nodeValue.replace(/-/g, "/"));
                    var e = new Date(motesBusySlotsXML.getElementsByTagName("end")[i].childNodes[0].nodeValue.replace(/-/g, "/"));

                    items.add({id: counter, content: '', start: s, end: e, className: 'red', editable: false, selectable: false, type: 'background', title: 'Busy'});
                    counter++;

                }
            }

            // fill in sunday midnight
            var s = new Date();    
            s.setDate(timeNowAtServer.getDate() + (0+(7-timeNowAtServer.getDay())) % 7);
            s.setHours(23,55,0,0);
            var e = vis.moment(s).add(25, 'm').toDate();
            items.add({id: counter, content: '', start: s, end: e, className: 'red', editable: false, selectable: false, type: 'range', title: 'Busy'});
            counter++;


            var minDate = timeNowAtServer;
            var maxDate = new Date(minDate.getTime() + 2*24*60*60*1000);
            // Configuration for the Timeline
            var options = {
                // moment: function (date) {
                //     return vis.moment(date).utcOffset('+08:00');
                // },

                editable: {
                    add: true,
                    remove: true,
                },
                onAdd: itemAdded,
                onRemove: itemRemoved,
                onMoving: itemMoving,

                min: minDate,
                max: maxDate,
                start: minDate,
                end: maxDate,

                //max zoom out - 6 hrs
                zoomMax: 1000 * 60 * 60 * 6,
                //max zoom in - 1 hr
                zoomMin: 1000 * 60 * 60 * 1,

                timeAxis: {scale: 'minute', step: 5},

                //clickToUse: true,

                stack: false,

                width: '100%',

                height: '120px',

                showTooltips: true,

                moveable: true,

                zoomable: true,

                //horizontalScroll: true,
            };

            // Create a Timeline
            if(timeline == null)
                timeline = new vis.Timeline(container, items, options);
            else {
                timeline.setOptions(options);
                timeline.setData(items);
            }

            timeline.setCurrentTime(timeNowAtServer.getTime());
            
            setTimeout( function() {timeline.moveTo(timeNowAtServer);}, 1000);
        }
    };
}



function getTimeStamp(now) {
       return ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
                     + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now
                     .getSeconds()) : (now.getSeconds())) + ' GMT+8 (SGT)');
}

function itemAdded(item, callback) {
    if(document.getElementById("durationJob").value.length == 0){
        alert("Please, write down the duration in minutes!");
    } else if(parseInt(document.getElementById("durationJob").value) < 10){
        alert("Error, cannot schedule a job for less than 10 minutes!");
    } else if(parseInt(document.getElementById("durationJob").value) + usedQuota > quota) {
        alert("Sorry, we cannot schedule this job because it exceeds your quota!");
    } else {
        //get the choosen slot
        //get the start of the slot
        
        var m = vis.moment(item.start).toDate().getMinutes();
        var c = parseInt(m / 5);
        s = vis.moment(item.start).set('m', c * 5).toDate();
        s = vis.moment(s).set('s', 0).toDate();
        e = vis.moment(s).add(parseInt(document.getElementById("durationJob").value), 'm').toDate();
        
        //get current NOW slot
        var nw = timeNowAtServer;
        var mNow = vis.moment(nw).toDate().getMinutes();
        var cNow = parseInt(mNow / 5);
        sNow = vis.moment(nw).set('m', cNow * 5).toDate();
        sNow = vis.moment(sNow).set('s', 0).toDate();
        
        if(!(s <= sNow)) {
            var overlapping = items.get({
                filter: function(testItem) {
                    //if(((s < testItem.end) && (e > testItem.start)))
                    //    console.log("new item s " + s);
                    return ((s < testItem.end) && (e > testItem.start));
                }
            });
            
            if(overlapping.length == 0){
                $("#durationJob").attr("disabled", true).on('click');
                //console.log("added");
                items.add({id: counter, content: jobName, start: s, end: e, className: 'blue', editable: true, selectable: true, type: 'range'});
                
                var options = {
                    editable: {
                        add: false,
                    },
                }
                timeline.setOptions(options);
            }
            else {
                s = null;
                e = null;
            }
        }
    }
}

function itemRemoved(item, callback) {
    $("#durationJob").attr("disabled", false).on('click');
    items.remove(item);
    s = null;
    e = null;
    var options = {
        editable: {
            add: true,
        },
    }
    timeline.setOptions(options);
}

function itemMoving(item, callback) {
    
}

function cancelScheduleJob() {
    $("#durationJob").attr("disabled", false).on('click');
    /*var jobsTableDiv = document.getElementById("jobsTableDiv");
    jQuery(jobsTableDiv).toggle('slow');

    var scheduleJobDiv = document.getElementById("scheduleJobDiv");
    jQuery(scheduleJobDiv).toggle('slow');*/

    refreshJobs();
}

function ScheduleJobDB() {
    if(s != null && e != null) {
        $("#durationJob").attr("disabled", false).on('click');
        $("#scheduleJobDiv *").attr("disabled", true).on('click');
        
        // var ts = Math.round(s.getTime() / 1000);
        // var te = Math.round(e.getTime() / 1000);

        var ts = Math.round((Date.parse(getTimeStamp(s))) / 1000);
        var te = Math.round((Date.parse(getTimeStamp(e))) / 1000);

        // var ts_str = s.getFullYear() + '-' + (s.getMonth() + 1) + '-' + s.getDate() + ' ' + s.getHours() + ':' + s.getMinutes() + ':' + '0';
        // var te_str = e.getFullYear() + '-' + (e.getMonth() + 1) + '-' + e.getDate() + ' ' + e.getHours() + ':' + e.getMinutes() + ':' + '0';
        
        //send userid, jobid, scheduled time
        var scheduleJobInfo = new FormData();
        scheduleJobInfo.append('userID', userID);
        scheduleJobInfo.append('jobID', jobID);
        scheduleJobInfo.append('ts', ts);
        scheduleJobInfo.append('te', te);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/scheduleJob.php', true);
        xhr.send(scheduleJobInfo);
        xhr.onload = function () {
            if (xhr.status === 200) {
                $("#scheduleJobDiv *").attr("disabled", false).on('click');
                //console.log(this.responseText);
                if(this.responseText == -1){
                    //time slot is busy!
                    //refresh timeline, ask the user to choose again.
                    alert("Sorry, but it seems that the selected time slote is already busy!\r\nKindly, choose another time slot.");
                    
                    refreshScheduleJob();
                    
                } else if(this.responseText == 0) {
                    alert("Error occurred! Please try again later.");
                } else {
                    usedQuota = parseInt(usedQuota) + ((te - ts) / 60);
                    var quotaLabel = document.getElementById("quotaReportLabel");
                    quotaLabel.innerHTML = "You have a quota (dd.hh:mm) of " + showQuota(quota) + "<br>(" + showQuota(usedQuota) + " of pending jobs and " + showQuota((quota - usedQuota)) + " available)<br><br>Time now: " + timeAtServer.toString().split(' ', 5).join(' ') + " (SGT)";
                    
                    var jobsTableDiv = document.getElementById("jobsTableDiv");
                    jQuery(jobsTableDiv).toggle('slow');

                    var scheduleJobDiv = document.getElementById("scheduleJobDiv");
                    jQuery(scheduleJobDiv).toggle('slow');
                    
                    refreshJobs();
                }
            }
        };
    } else
        alert("Please, choose time slot!");
}

function durationChanged() {
    /*var options = {
        timeAxis: {scale: 'minute', step: parseInt(document.getElementById("durationJob").value)},
    }
    
    timeline.setOptions(options);    
    timeline.redraw();*/
}

function zoomInDown(){
    mousedownInterval = setInterval(zoomIn, 100);
}

function zoomInUp(){
    clearInterval(mousedownInterval);
}

function zoomIn() {
    //var options
    timeline.zoomIn(1);
}

function zoomOutDown(){
    mousedownInterval = setInterval(zoomOut, 100);
}

function zoomOutUp(){
    clearInterval(mousedownInterval);
}

function zoomOut() {
    timeline.zoomOut(1);
}
