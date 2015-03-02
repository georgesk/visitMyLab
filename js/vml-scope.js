// global variables

/**
 * This global variable is the unique plot returned by jquery-flot
 **/
var plot;

/**
 * global objet to contain the "Cathod Ray Tube"'s data
 **/
var cro; 

/**
 * global boolean switch to enable/disable refreshing cro's screen.
 **/
var auto_refresh=true;

/**
 * Creates the widget supporting CRO display
 * @param id the identifier of an element which will contain the CRO widget
 **/
function init_graph(id){
    var options={
	lines: {
	    show: true,
	},
	series: {
	    lines: {
		show: true,
		lineWidth:2,
	    },
	},
	points: {
	    show: false,
	},
	grid: {
	    hoverable: false,
	    autoHighlight: false,
	    clickable: true,
	    color:'black',
	    backgroundColor: {
		colors: ["#020", "#131"],
	    },
	},
	yaxis: {
	    min:-5,
	    max:5,
	    tickSize: 1,
	},
    };
    plot = $.plot($('#'+id),[ ],options);    
}

/**
 * callback function to adjust displaied values inside cro's buttons
 * @param data an object with following attributes:
 * - samples: integer, number of samples queries to plot the graph
 * - duration: float, duration of the graph in ms
 **/
function adjustCroValues(data){
    $("#sampleButton").html("Samples<br/>"+data.samples);
    $("#durationButton").html("Duration<br/>"+data.duration + " ms");
}

/**
 * Main fuction to create the oscilloscope web page.
 * Creates the display, and the auxiliary buttons, then connects
 * timer events to refreshers, for displaying the measurements plot.
 * @param owner a jQueryfied HTML element which will contain the scope
 * @param config boolean; must be true to take in account next parameters
 * @param input Expeye's input channel which will be scoped.
 *  defaults to "A1"
 * @param samples number of measurements : the total duration will be
 *  samples * (number-1) seconds ; defaults to 201
 * @param delay delay between two consecutive measurements (in second)
 *  defaults to 0.0002 (200 microseconds)
 * @param duration total duration of scoped data. Defaults to null.
 *  if set to some float value, its value takes precedence onto delay
 *  and delay will be set to duration/(number - 1).
 **/
function scope_page(owner, options={}){
    opts={};
    opts.config   = options.config   || false;
    opts.input    = options.input    || false; //"A1";
    opts.samples  = options.samples  || false; //201;
    opts.delay    = options.delay    || false; //0.0002;
    opts.duration = options.duration || false;
    cro = new Object();
    top_owner=owner||$('body');
    top_owner.empty();
    var dispDiv=$("<div>",{id:"disp"});
    var buttonsDiv=$("<div>",{id:"buttons"});
    top_owner.append(dispDiv);
    top_owner.append(buttonsDiv);
    cro.timer = null;
    cro.refresh_delay=100;

    //Pause unpause button
    cro.pause=add({
	what:'button',
	owner:buttonsDiv,
	txt:'Play/Pause',
	classes:'activeButton wideButton',
	title:'Click to pause or to start refreshing the display',
    });
    cro.pause.click(function(){
	if(auto_refresh==true){
	    auto_refresh=false;
	    cro.pause.css('color','red');
	} else {
	    auto_refresh=true;
	    cro.pause.css('color','green');
	}
    });
	
    //Save buttons
    cro.saveButtonsDiv=add({
	what:'div',
	owner:buttonsDiv,
	id:'saveButtonsDiv',
    });
    cro.save=add({
	what:'button',
	owner:$("#saveButtonsDiv"),
	txt:'Save',
	classes:'noButton',
    });
    cro.saveTxt=add({
	what:'button',
	owner:$("#saveButtonsDiv"),
	txt:'txt',
	classes:'activeButton',
	title:'Save a data series in ASCII text format',
    });
    cro.saveTxt.click(function(){
	var w = open("/getValues?mode=ascii");
    });
    cro.saveOds=add({
	what:'button',
	owner:$("#saveButtonsDiv"),
	txt:'ods',
	classes:'activeButton',
	title:'Save a data series in OpenDocument format (Calc spreadsheet)',
    });
    cro.saveOds.click(function(){
	var w = open("/getValues?mode=ods");
    });

    //sample Buttons
    cro.sampleButtonsDiv=add({
	what:'div',
	owner:buttonsDiv,
	id:'sampleButtonsDiv',
    });
    cro.sample=add({
	what: 'button',
	owner: cro.sampleButtonsDiv,
	id: 'sampleButton',
	txt: 'samples<br/>201',
	classes: 'noButton',
    });
    // sample- button
    cro.sampleMinus=add({
	what: 'button',
	owner: cro.sampleButtonsDiv,
	txt: '-',
	id:"sampleMinus",
	classes: 'activeButton',
	title: 'Take less measurement samples at each scan',
    });
    cro.sampleMinus.click(function(){
	$.ajax({
	    cache: false,
	    type: "GET",
	    url: "/sampleMinus",
	    timeout: 5000,
	    async: true,
	    dataType: "json",
	    success: function(data){
		adjustCroValues(data);
	    },
	});
    });
    // sample+ button
    cro.samplePlus=add({
	what: 'button',
	owner: cro.sampleButtonsDiv,
	txt: '+',
	classes: 'activeButton',
	title: 'Take more measurement samples at each scan',
    });
    cro.samplePlus.click(function(){
	$.ajax({
	    cache: false,
	    type: "GET",
	    url: "/samplePlus",
	    timeout: 5000,
	    async: true,
	    dataType: "json",
	    success: function(data){
		adjustCroValues(data);
	    },
	});
    });
    
    // duration buttons
    cro.durationButtonsDiv=add({
	what:'div',
	owner: buttonsDiv,
	id:"durationButtonsDiv",
    });
    cro.duration=add({
	what: 'button',
	owner: cro.durationButtonsDiv,
	id: 'durationButton',
	txt: 'duration<br/>40 ms',
	classes: 'noButton',
    });
    // duration- button
    cro.durationMinus=add({
	what: 'button',
	owner: cro.durationButtonsDiv,
	txt: '-',
	classes: 'activeButton',
	title: 'Decrease the duration of the scan',
    });
    cro.durationMinus.click(function(){
	$.ajax({
	    cache: false,
	    type: "GET",
	    url: "/durationMinus",
	    timeout: 5000,
	    async: true,
	    dataType: "json",
	    success: function(data){
		adjustCroValues(data);
	    },
	});
    });
    // duration+ button
    cro.durationPlus=add({
	what: 'button',
	owner: cro.durationButtonsDiv,
	txt: '+',
	classes: 'activeButton',
	title: 'Increase the duration of the scan',
    });
    cro.durationPlus.click(function(){
	$.ajax({
	    cache: false,
	    type: "GET",
	    url: "/durationPlus",
	    timeout: 5000,
	    async: true,
	    dataType: "json",
	    success: function(data){
		console.log("GRRR", data);
		adjustCroValues(data);
	    },
	});
    });
    
    //--initialize graph
    cro.container = add({
	what:'div',
	owner:dispDiv,
	txt:'',
	classes:'croContainer',
    });	//make a container
    cro.graph = add({
	what:'div',
	id:'plot',
	owner:cro.container,
	txt:'',
	classes: 'croGraph',
    });	//make an empty div
    init_graph('plot');		//load the flot.js graph into it

    cro.refresh_once =function(){
	$.ajax({
    	    cache:false,
            type: "GET",
            url: '/oneScopeChannel',
	    data:{
		options: JSON.stringify(opts),
	    },
	    dataType: "json",
	    timeout: 5000,
 	    async: true,
            success: function(gotdata){
		res=new Array();
		theData=new Array();
		while(gotdata.length){
		    dataset=new Array();
		    y=gotdata.pop();
		    x=gotdata.pop();
		    for(i=0;i<x.length;i++){
			dataset.push([x[i],y[i]]);
		    }
		    res.push(dataset);
		};
		theData.push({
		    data: res.pop(),
		    label: "voltage A1",
		    color: "#afc",
		});
		plot.setData(theData);
		plot.setupGrid();
		plot.draw();
		cro.scope_refresher(); // trigger the measurement again ?
	    },
            error: function(x,t,m){
		console.log(t,'...waiting');
		cro.scope_refresher(); // trigger the measurement again ?
	    }
	    
	});
    };


    cro.scope_refresher =function(){
	if(auto_refresh==true){
	    cro.timer = setTimeout("cro.refresh_once();",cro.refresh_delay);
	} else {
	    cro.timer = setTimeout("cro.scope_refresher();",cro.refresh_delay);
	}
    };
    cro.scope_refresher();   //start running the scope
};
