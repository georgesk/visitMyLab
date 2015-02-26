
//--------COMMUNICATION WITH THE SERVER "VISIT MY LAB" ------------------------

/**
 * Makes an AJAX call to the URL '/run' in synchronous mode.
 * The timeout duration is 5 seconds.
 * Callbacks are:
 * - for success: just a log in the console
 * - for error: also a log in the console
 **/
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


/**
 * Makes an AJAX call to the URL '/run' in asynchronous mode.
 * The timeout duration is 5 seconds.
 * Callbacks are:
 * - for success: just a log in the console
 * - for error: also a log in the console
 **/
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


/**
 * Makes an AJAX call to a given URL in synchronous mode.
 * Provides a success callback
 * @param url the target URL for the AJAX call
 * @param success_function a function to be called by the success callback
 * @param element will be given as a second argument to success_function,
 * after the data returned by the AJAX query.
 **/
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

/**
 * Makes an AJAX call to a given URL in asynchronous mode.
 * Provides a success callback
 * @param url the target URL for the AJAX call
 * @param success_function a function to be called by the success callback
 * @param dat input data for the AJAX query
 * @param element will be given as a second argument to success_function,
 * after the data returned by the AJAX query.
 **/
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
