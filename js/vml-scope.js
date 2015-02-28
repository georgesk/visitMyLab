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
    opts.input    = options.input    || "A1";
    opts.samples  = options.samples  || 201;
    opts.delay    = options.delay    || 0.0002;
    opts.duration = options.duration || null;
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
	owner:buttonsDiv,
	txt:'Save',
	classes:'activeButton wideButton',
    });
    cro.save.click(function(){
	var w = open("/getValues")
    });

    //sample Buttons
    cro.sample=add({
	what: 'button',
	owner: buttonsDiv,
	txt: 'samples',
	classes: 'noButton',
    });
    cro.sample_array=[11,21,51,101,201,501,1001];
    // sample- button
    cro.sampleMinus=add({
	what: 'button',
	owner: buttonsDiv,
	txt: '-',
	classes: 'activeButton',
    });
    cro.sampleMinus.click(function(){
	//!!!!
    });
    // sample+ button
    cro.samplePlus=add({
	what: 'button',
	owner: buttonsDiv,
	txt: '+',
	classes: 'activeButton',
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
