// The main style, tochoose a skin for the application
// Following values are implemented: "tabs" (default style), ...
var mainStyle="";

// The .ready callback, which is the main javascript program
// launched when the DOM is ready.

$(
    function(){
	if (! mainStyle) mainStyle="tabs";
	if (mainStyle == "tabs") {
	    $( "#tabs" ).tabs({activate: onTabActivate,});
	    createScopeWidget($('#experiments'), $("#tabs"));
	    createCommandWidgets($('#commands'));
	}
    }
);

/**
 * callback function to be called when tabs are changing
 * @param event jQuery Event object
 * @param ui jQuery Object
 **/
function onTabActivate(event, ui){
    if (ui.oldPanel.attr("id")=="experiments"){
	pauseScope();
    }
    if (ui.newPanel.attr("id")=="experiments"){
	playScope();
    }
}

/**
 * Creates the scope widget and tailors it shap to fit within a tab
 * @parameter container a jqueryfied element to contain the scope
 * @parameter controlWidget an optional jqueryfied element which implements
 *  a control widget like jQuery tabs
 **/
function createScopeWidget(container, controlWidget){
    /////////// creates the scope widget //////////////
    scope_widget(container);
    // scope's top must be moved down since its parent panel is not
    // positioned in absolute style.

    if (controlWidget.attr("class").contains("ui-tabs")){
	// then the controlWidget is created by "tabs", let us tailor
	// the container's shape
	var h=parseInt(controlWidget.height());
	container.css({
	    top: parseInt(container.css('top')) + h,
	    bottom: "",
	    height: parseInt($(window).height()) - h - 120,
	});
	// make the scope resizeable as it is initially sized from
	// the tabs defaults.
	container.resizable({handles:"s"});
	// adds a title to resize handles
	$(".ui-resizable-handle").attr("title","Drag here to resize the widget")
    }
}

/**
 * Creates the widget featuring commands for the Expeyes-Jr box
 * @param container a jqueryfied element
 **/
function createCommandWidgets(container){
    container.empty()
    controlOD1(container);
    controlPVS(container);
    controlSQR(container);
}
