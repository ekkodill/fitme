/* global console,$,document,window,alert */
var db;
var dbname = "fitme3";
var day;


function dtFormat(input) {
    if(!input) return "";
    var res = (input.getMonth()+1) + "/" + input.getDate() + "/" + input.getFullYear() + " ";
    var hour = input.getHours();
    var ampm = "AM";
    if(hour === 12) ampm = "PM";
    if(hour > 12){
        hour-=12;
        ampm = "PM";
    }
    var minute = input.getMinutes()+1;
    if(minute < 10) minute = "0" + minute;
    res += hour + ":" + minute + " " + ampm;
    return res;
}

$(document).ready(function() {
 
    if(!("indexedDB" in window)) {
        alert("IndexedDB support required for this demo!");
        return;
    }
 
    var $noteDetail = $("#noteDetail");
    var $noteForm = $("#noteForm");
 
    var openRequest = window.indexedDB.open(dbname,1);
 
    openRequest.onerror = function(e) {
        console.log("Error opening db");
        console.dir(e);
    };
 
    openRequest.onupgradeneeded = function(e) {
 
        var thisDb = e.target.result;
        var objectStore;
 
        //Create Note OS
        if(!thisDb.objectStoreNames.contains("note")) {
            console.log("I need to make the note objectstore");
            objectStore = thisDb.createObjectStore("note", 
            { 
               keyPath: "id", autoIncrement:true                 
            });  
        }

        objectStore.createIndex("day","day", {unique:false});
       
 
    };
 
    openRequest.onsuccess = function(e) {
        db = e.target.result;

        db.onerror = function(event) {
          // Generic error handler for all errors targeted at this database's
          // requests!
          alert("Database error: " + event.target.errorCode);
          console.dir(event.target);
        };
 
      //  displayNotes();
 
    };  


    function displayNotes(day1) {

    var transaction = db.transaction(["note"], "readonly");  

    var content=
    "<table class='table table-bordered table-striped'> <thead><tr><th>Exercise</th><th>Weight</th><th>Sets</th><th>Edit weight</th><th></td></thead><tbody>";
 
    transaction.oncomplete = function(event) {
        $("#noteList").html(content);
    };

    //Table displayed on load
    var handleResult = function(event) {  
      var cursor = event.target.result;  

      if (cursor) {  
        
        //Reps for sets
        var rep1 = "rep1"+cursor.primaryKey;
        var rep2 = "rep3"+cursor.primaryKey;
        var rep3 = "rep2"+cursor.primaryKey;
        var rep1val = "0";
        var rep2val = "0";
        var rep3val = "0";
        if(sessionStorage.getItem(rep1)) { rep1val = sessionStorage.getItem(rep1); }
        if(sessionStorage.getItem(rep2)) { rep2val = sessionStorage.getItem(rep2); }
        if(sessionStorage.getItem(rep3)) { rep3val = sessionStorage.getItem(rep3); }
        
        
        content += "<tr data-key=\""+cursor.primaryKey+"\"><td class=\"noteexercise\">"+cursor.value.exercise+"</td>";
        content += "<td>"+cursor.value.weight+"</td>";
        content += "<td><a id='rep1"+cursor.primaryKey+"' type='button' class='btn btn-info btn-circle sets'>"+ rep1val +
        "</a><a id='rep2"+cursor.primaryKey+"' type='button' class='btn btn-info btn-circle sets'>" + rep2val +
        "</a> <a id='rep3"+cursor.primaryKey+"' type='button' class='btn btn-info btn-circle sets'>"+ rep3val + "</a></td>";

        content += "<td> <a id='incw' class=\"btn btn-success btn-circle inc\">+</a><a id='decw' class=\"btn btn-default btn-circle dec\">-</a>" 
        //+dtFormat(cursor.value.updated)+"
        "</td>";        
        content += "<td><a class=\"btn btn-primary edit\">Edit</a> <a class=\"btn btn-danger delete\">Delete</a>  </td>";
        content +="</tr>";
        cursor.continue();  
      }  
      else {  
        content += "</tbody></table>";
      }  
    };
   
    var objectStore = transaction.objectStore("note");
    var index = objectStore.index("day");
    index.openCursor(day1).onsuccess = handleResult;
 
    }

//Delete
$("#noteList").on("click", "a.delete", function(e) {
    var result = confirm("Are you sure?");
    if(result) {
    var thisId = $(this).parent().parent().data("key");
 
        var t = db.transaction(["note"], "readwrite");
        var request = t.objectStore("note").delete(thisId);
        t.oncomplete = function(event) {
            displayNotes(day);
            $noteDetail.hide();
            $noteForm.hide();
        };
    }
    return false;
});
 
//Edit
$("#noteList").on("click", "a.edit", function(e) {
    var thisId = $(this).parent().parent().data("key");

    var request = db.transaction(["note"], "readwrite")  
                    .objectStore("note")                            
                    .get(thisId);  
                    
    request.onsuccess = function(event) {  
        var note = request.result;
      
        $("#key").val(thisId);
        $("#day").val(note.day);
        $("#exercise").val(note.exercise);
        $("#body").val(note.body);
        $("#img").val(note.img);
        $("#weight").val(note.weight);
        $noteDetail.hide();
        $noteForm.show();
    };
 
    return false;
});
 
 //Click on exercise to show
$("#noteList").on("click", "td", function() {
    var thisId = $(this).parent().data("key");
    var transaction = db.transaction(["note"]);  
    var objectStore = transaction.objectStore("note");  
    var request = objectStore.get(thisId);
    
    request.onsuccess = function(event) {  
        var note = request.result;
        var img = "#";
        if(note.img != null) {
            img = "<img src='"+ note.img+"'>" ;
        } else {
            img = "";
        }
        $noteDetail.html("<h2>"+note.exercise+"</h2><p>"+note.day+"</p><p>"+note.body+"</p><p>"+note.weight+"</p>"+img).show();
        $noteForm.hide();
    };  
});
 
$("#addNoteButton").on("click", function(e) {
    $("#exercise").val("");
    $("#day").val("");
    $("#body").val("");
    $("#weight").val("");
    $("#img").val("");
    $("#key").val("");
    $noteDetail.hide();
    $noteForm.show();       
});


$("#saveNoteButton").on("click",function() {
        var day = $("#day").val();
        var exercise = $("#exercise").val();
        var body = $("#body").val();
        var img = $("#img").val();
        var weight = $("#weight").val();
        var key = $("#key").val();
 
        var t = db.transaction(["note"], "readwrite");

        if(key === "") {
            t.objectStore("note")
                            .add({day:day,exercise:exercise,body:body,img:img,weight:weight,updated:new Date()});
        } else {
            t.objectStore("note")
                            .put({day:day,exercise:exercise,body:body,img:img,weight:weight,updated:new Date(),id:Number(key)});
        }
 
        t.oncomplete = function(event) {
            $("#key").val("");
            $("#day").val("");
            $("#exercise").val("");
            $("#body").val("");
            $("#img").val("");
            $("#weight").val("");
            displayNotes(day);
            $noteForm.hide();           
        };
 
        return false;
    });
 

    //Update weight in indexeddb
    function updateW(id, option) {
        var transaction = db.transaction(["note"], "readwrite");
        var objectStore = transaction.objectStore("note");

        request = objectStore.get(id);

            request.onsuccess = function(event){

                   var xtraweight = 2.5;
                   var oldweight = Number(request.result.weight);
                     
                 if(option == "inc") {
                   var newweight = oldweight + xtraweight;
                } else {
                    var newweight = oldweight - xtraweight;
                }             
                   request.result.weight = newweight;
                   objectStore.put(request.result);

                   displayNotes(day);
                   event.preventDefault();
            };

    }

    //Add weight
    $("#noteList").on("click", "a.inc", function(e) {
        var thisId = $(this).parent().parent().data("key");
           
        updateW(thisId, "inc");       
        
        
        return false;
       
    });
    //Remove weight
        $("#noteList").on("click", "a.dec", function(e) {
        var thisId = $(this).parent().parent().data("key");
           
        updateW(thisId, "dec");       
        
        
        return false;
       
    });





$("#noteList").on("click", "a.sets", function(e) {
    var $this = $(this);
    var current = Number($this.text());

    var min = 4;
    var med = 5;
    var max = 6;
    var reps = 0;
    if(current == reps) {
        current = min;
    } else {
        current++;
    }
    if(current > max) {
        current = 4;
    }
    
    var test = $(this).attr("id");
    console.log(test);
    sessionStorage.setItem(test, current);
    var txt = sessionStorage.getItem(test);
    $this.text(txt);
    
});


// $("#noteList").on("click", "a.sets", function(e) {
//     var $this = $(this);
//     var current = Number($this.text());

//     var min = 4;
//     var med = 5;
//     var max = 6;
//     var reps = 0;
//     if(current == reps) {
//         current = min;
//     } else {
//         current++;
//     }
//     if(current > max) {
//         current = 4;
//     }
//     $this.text(current);
   
// });
  
  $(".btnDay").on("click", function(e) {
    $("#"+day).css("color","black");
    day = this.id;

    $(this).css('color','red');
    
    displayNotes(day);
  });

});