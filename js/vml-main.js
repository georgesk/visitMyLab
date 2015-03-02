// The .ready callback, which is the main javascript program
// launched when the DOM is ready.

$(
    function(){
	$( "#tabs" ).tabs({activate: onTabActivate,});

	createScopeWidget($( "#tabs" ), $('#experiments'));
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
 * @parameter tabs a jqueryfied element which implements tabs
 * @parameter container a jqueryfied element to contain the scope
 **/
function createScopeWidget(tabs, container){
    /////////// creates the scope widget //////////////
    scope_widget(container);
    // scope's top must be moved down since its parent panel is not
    // positioned in absolute style.
    container.css('top', parseInt(container.css('top'))+tabs.height());
    // make the scope resizeable as it is initially sized from
    // the tabs defaults.
    container.resizable({handles:"s"});
}

