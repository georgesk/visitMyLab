// global variables
var plot; 
var cro; 
var auto_refresh=true;

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

function scope_page(owner){
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
	    dataType: "json",
	    timeout: 5000,
 	    async: true,
            success: function(data){
		res=new Array();
		theData=new Array();
		while(data.length){
		    dataset=new Array();
		    y=data.pop();
		    x=data.pop();
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
