function edit_moteType_row(no) {
    document.getElementById("edit_moteType_button"+no).style.display="none";
    document.getElementById("save_moteType_button"+no).style.display="block";
    
    var name=document.getElementById("name_moteType_row"+no);
    
    var name_data=name.innerHTML;
    
    name.innerHTML="<input type='text' class='text1' id='name_moteType_text"+no+"' value='"+name_data+"'>";
}

function save_moteType_row(no) {
    var name_val=document.getElementById("name_moteType_text"+no).value;
    if(name_val != "" && name_val.replace(/\s/g, '').length){        
        var moteTypeInfo = new FormData();
        moteTypeInfo.append('userID', userID);
        moteTypeInfo.append('moteTypeID', no);
        moteTypeInfo.append('moteTypeName', name_val);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/updateMoteType.php', true);
        xhr.send(moteTypeInfo);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var flag = this.responseText;
                if(flag) {
                    loadMotes();
                } else {
                    alert("Error occurred, please try again later!");
                }
            }
        };
    } else {
        alert("Kindly, type in the mote type in the text field.");
    }
}

function delete_moteType_row(no) {
    //delete mote type from DB
    var result = confirm("Deleting mote type will affect other records (eg. jobs, files, and motes). Are you sure?");
    if (result) {
        var moteTypeInfo = new FormData();
        moteTypeInfo.append('userID', userID);
        moteTypeInfo.append('moteTypeID', no);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/deleteMoteType.php', true);
        xhr.send(moteTypeInfo);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var flag = this.responseText;
                if(flag == 1){
                    loadMotes();
                } else{
                    alert("Error occurred! Please try again later.");
                }
            }
        };
    }
}

function add_moteType_row() {
    var new_name=document.getElementById("new_moteType_name").value;
    
    if(new_name != "" && new_name.replace(/\s/g, '').length){
        var moteTypeInfo = new FormData();
        moteTypeInfo.append('userID', userID);
        moteTypeInfo.append('new_name', new_name);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/addMoteType.php', true);
        xhr.send(moteTypeInfo);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var moteTypeID = this.responseText;
                if(moteTypeID != -1){
                    var table=document.getElementById("moteTypes_data_table");
                    var row = table.insertRow(1).outerHTML="<tr id='moteType_row"+moteTypeID+"'><td id='name_moteType_row"+moteTypeID+"'>"+new_name+"</td><td><input class='button' type='button' id='edit_moteType_button"+moteTypeID+"' value='Edit' class='edit' onclick='edit_moteType_row("+moteTypeID+")' style='float: left'> <input class='button' type='button' id='save_moteType_button"+moteTypeID+"' value='Save' class='save' onclick='save_moteType_row("+moteTypeID+")' style='display: none''> <input class='button' type='button' value='Delete' class='delete' onclick='delete_moteType_row("+moteTypeID+")' style='float: left'></td></tr>";
                    
                    addMoteTypes_load();
                } else{
                    alert("Error occurred! Please try again later.");
                }

                document.getElementById("new_moteType_name").value="";
            }
        };
    } else {
        alert("Kindly, type in the mote type in the text field.");
    }
}