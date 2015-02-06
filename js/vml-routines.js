
//--------COMMUNICATION WITH THE SERVER "VISIT MY LAB" ------------------------

function call_expeyes(){
    $.ajax({
    	cache:false,
        type: "GET",
        url: '/run',
	dataType: "json",
	timeout: 5000,
	async: false,
        success: function(data){
	    console.log(data)
	},
        error: function(x,t,m){	console.log(x,t); }

    });

};


function call_expeyes_async(){
    $.ajax({
    	cache:false,
        type: "GET",
        url: '/run',
	dataType: "json",
	timeout: 5000,
 	async: true,
        success: function(data){
	    //var res = $.parseJSON(data);
	    console.log(data);
	},
        error: function(x,t,m){	console.log(t,'...waiting');}

    });

};


function call_url(url,success_function,element){

    $.ajax({
	cache:false,
        type: "POST",
        url: url,
	async: false,
        success: function(data){
	    if(success_function){success_function(data,element);}
	},
    });

};

function send_data(url,success_function,dat,element) {
    $.ajax({
	cache:false,
	type: 'POST',
	url: url,
	async:true,
	contentType: "application/json",
	processData: false,
	data: dat,
	success: function(data) {success_function(data,element);},
	dataType: "text"
    });
}
