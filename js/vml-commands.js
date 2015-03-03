// this file implements widgets to send commands to Expeyes-Jr

/////////////////// Digital Output OD1 //////////////////////

/**
 * creates an jqueryfied element providing a GUI to control
 * Digital Output 1, inside a given container
 * @param container a jqueryfied DIV element
 **/
function controlOD1(container){
    var slider = $("<input>",{
	type:"range",
	name:"od1",
	id:"od1",
	min:"0",
	max:"1",
	value:"0",
    });
    slider.change(function(){
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setOD1",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: $("#od1").val(),
	    },
	    success: function(data){
		if (data=="1"){
		    $("#sliderDiv").css({
			"background-color": "rgba(255,255,200,1)",
			"box-shadow": "10px 5px 5px purple",
		    });
		} else {
		    $("#sliderDiv").css({
			"background-color": "rgba(255,255,200,0.25)",
			"box-shadow": "",
		    });
		}
	    },
	});
    });
    var sliderDiv=$("<div>",{
	id:"sliderDiv",
    });
    sliderDiv.append((
	$("<div>")
	    .css({
		clear:"both",
	    })
	    .append(slider)
    ));
    sliderDiv.append($("<div>").css({float:"left",}).text("0: False"));
    sliderDiv.append($("<div>").css({float:"right",}).text("1: True"));
    container.append(
	($("<div>",{
	    id: "od1Div",
	    "class": "control",
	})
	 .append(($("<span>")
		  .css({
		      "font-size": "22pt",
		  })
		  .html("Digital Output (OD1)&nbsp;")))
	 .append(sliderDiv)
	));
}

/////////////////// Programmable Voltage Source PVS /////////
/**
 * creates an jqueryfied element providing a GUI to control
 * Digital Output 1, inside a given container
 * @param container a jqueryfied DIV element
 **/
function controlPVS(container){
    var slider = $("<input>",{
	type:"range",
	name:"pvs",
	id:"pvs",
	min:"0",
	max:"5000",
	value:"0",
    });
    slider.change(function(){
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setPVS",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: $("#pvs").val(),
	    },
	    success: function(data){
		console.log("inside PVS feedback callback", data)
		data=parseFloat(data).toFixed(2);
		$("#pvsFeedback").val(data+" V")
	    },
	});
    });
    var sliderPvsDiv=$("<div>",{
	id:"sliderPvsDiv",
    });
    sliderPvsDiv.append((
	$("<div>")
	    .css({
		clear:"both",
	    })
	    .append(slider)
    ));
    var pvsFeedback=$("<input>",{
	type:"text",
	id:"pvsFeedback",
	value: "0 V",
    });
    pvsFeedback.change(function(){
	// retrieve the value between 0 and 5000 mV
	var val = parseInt(parseFloat($("#pvsFeedback").val())*1000);
	if (!val) return;
	if (val < 0) val=0;
	if (val > 5000) val=5000;
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setPVS",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: val,
	    },
	    success: function(data){
		var cursor=parseInt(1000*parseFloat(data));
		$("#pvs").val(cursor);
		data=parseFloat(data).toFixed(2);
		$("#pvsFeedback").val(data+" V");
	    },
	});
    });
    sliderPvsDiv.append($("<div>").css({float:"left",}).text("0V"));
    sliderPvsDiv.append($("<div>").css({float:"right",}).text("5V"));
    sliderPvsDiv.append(pvsFeedback);
    container.append((
	$("<div>",{
	    id: "pvsDiv",
	    "class": "control",
	})
	    .append(($("<span>")
		     .css({
			 "font-size": "22pt",
		     })
		     .text("Programmable Voltage Source (PVS)")))
	    .append(sliderPvsDiv)
    ));
}

/////////////////// Constant Current Source CCS /////////////

/////////////////// Square Wave Generators SQR1 and SQR2 ////
/**
 * creates an jqueryfied element providing a GUI to control
 * square wave generators SQR1 and SQR2
 * @param container a jqueryfied DIV element
 **/
function controlSQR(container){
    var slider1 = $("<input>",{
	type:"range",
	name:"sqr1",
	id:"sqr1",
	min:"0",
	max:"20000",
	value:"0",
    });
    slider1.change(function(){
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setSQR",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: $("#sqr1").val(),
		sqr: 1,
	    },
	    success: function(data){
		console.log("inside SQR1 feedback callback", data)
		data=parseFloat(data).toFixed(1);
		$("#sqr1Feedback").val(data+" Hz")
	    },
	});
    });
    var slider2 = $("<input>",{
	type:"range",
	name:"sqr2",
	id:"sqr2",
	min:"0",
	max:"20000",
	value:"0",
    });
    slider2.change(function(){
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setSQR",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: $("#sqr2").val(),
		sqr: 2,
	    },
	    success: function(data){
		console.log("inside SQR1 feedback callback", data)
		data=parseFloat(data).toFixed(1);
		$("#sqr2Feedback").val(data+" Hz")
	    },
	});
    });
    var sliderSqrDiv=$("<div>",{
	id:"sliderSqrDiv",
    });
    sliderSqrDiv.append((
	$("<div>")
	    .css({
		clear:"both",
	    })
	    .append(slider1)
	    .append("<br>")
	    .append(slider2)
    ));
    var sqr1Feedback=$("<input>",{
	type:"text",
	id:"sqr1Feedback",
	value: "0 Hz",
    });
    sqr1Feedback.change(function(){
	// retrieve the value between 0 and 20000 Hz
	var val = parseInt(parseInt($("#sqr1Feedback").val()));
	if (!val) return;
	if (val < 0) val=0;
	if (val > 20000) val=20000;
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setSQR",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: val,
		sqr: 1,
	    },
	    success: function(data){
		var cursor=parseFloat(parseFloat(data));
		$("#sqr1").val(cursor);
		data=parseFloat(data).toFixed(2);
		$("#sqr1Feedback").val(data+" Hz");
	    },
	});
    });
    var sqr2Feedback=$("<input>",{
	type:"text",
	id:"sqr2Feedback",
	value: "0 Hz",
    });
    sqr2Feedback.change(function(){
	// retrieve the value between 0 and 20000 Hz
	var val = parseInt(parseInt($("#sqr2Feedback").val()));
	if (!val) return;
	if (val < 0) val=0;
	if (val > 20000) val=20000;
	$.ajax({
	    cache:false,
	    type: "GET",
	    url: "/setSQR",
	    timeout: 5000,
	    async: true,
	    datatype: "json",
	    data: {
		val: val,
		sqr: 2,
	    },
	    success: function(data){
		var cursor=parseFloat(parseFloat(data));
		$("#sqr2").val(cursor);
		data=parseFloat(data).toFixed(2);
		$("#sqr2Feedback").val(data+" Hz");
	    },
	});
    });
    sliderSqrDiv.append($("<div>").css({float:"left",}).text("0 Hz"));
    sliderSqrDiv.append($("<div>").css({float:"right",}).text("20 kHz"));
    var doubleSqrFeedback=$("<span>",{
	id: "doubleSqrFeedback",
    });
    doubleSqrFeedback
	.append($("<span>").html("SQR1&nbsp;"))
	.append(sqr1Feedback)
	.append($("<br>"))
	.append($("<span>").html("SQR2&nbsp;"))
	.append(sqr2Feedback)
    
    sliderSqrDiv.append(doubleSqrFeedback);
    container.append((
	$("<div>",{
	    id: "sqr1Div",
	    "class": "control",
	})
	    .append(($("<span>")
		     .css({
			 "font-size": "22pt",
		     })
		     .text("Square wave generators (SQR1 & SQR2)")))
	    .append(sliderSqrDiv)
    ));
}

