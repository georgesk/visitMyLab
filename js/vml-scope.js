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
 * Main fuction to create the oscilloscope web page.
 * Creates the display, and the auxiliary buttons, then connects
 * timer events to refreshers, for displaying the measurements plot.
 * @param owner a jQueryfied HTML element which will contain the scope
 * @param input Expeye's input channel which will be scoped.
 *  defaults to "A1" !!!not yet supported!!!
 * @param delay delay between two consecutive measurements (in second)
 *  defaults to 0.001 (one millisecond) !!!not yet supported!!!
 * @param number number of measurements (the total duration will be
 *  delay * (number-1) seconds) defaults to 501 !!!not yet supported!!!
 * @param duration total duration of scoped data. Defaults to null.
 *  if set to some float value, its value takes precedence onto delay
 *  and delay will be set to duration/(number - 1). !!!not yet supported!!!
 **/
function scope_page(owner, input="A1", delay="0.001", number=501, duration=null){
    cro = new Object();
    cro.own=owner||$('body');
    owner.empty();
    cro.timer = null;
    cro.refresh_delay=100;

    //Pause unpause button
    cro.pause=add({
	what:'button',
	owner:cro.own,
	txt:'Play/Pause',
	classes:'pauseButton',
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
	
    //Save button
    cro.save=add({
	what:'button',
	owner:cro.own,
	txt:'Save',
	classes:'saveButton',
    });
    cro.save.click(function(){
	var w = open("/getValues")
    });
	
    //--initialize graph
    cro.container = add({
	what:'div',
	owner:cro.own,
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
		input:"A1",
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
