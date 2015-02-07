/**
 * global variable used for automatic increments and 
 * unique id generation.
 **/
var ident=1;

/**
 * Creates unique identifiers
 * @return a unique identifier made by automatic incrementation
 **/
function get_id()
{
    ident+=1;
    return 'id_'+ident;
};

/**
 * creates a jQueryfied HTML element
 * @param opt is an object bearing the options wanted for the new element.
 * - opt.owner is the element to attach the result (defaults to BODY)
 * - opt.id is the wanted ID (defaults to an auto-incremented automatic ID)
 * - opt.txt is an optional text (defaults to empty string)
 * - opt.role is an optional role (defaults to 'child')
 * - opt.onclick optional callback, defaults to ''
 * - opt.classes optional list of classes, defaults to ''
 * @return a jQueryfied HTML element.
 **/
function add(opt)
{
    var item = document.createElement(opt.what);
    var result = $(item)
    owner=opt.owner||$('body');
    id=opt.id||get_id();
    txt=opt.txt||'';
    fn=opt.onclick||'';
    role=opt.role||'child';
    classes=opt.classes||'';
    
    item.id = id;
    item.onclick=fn;
    item.innerHTML = txt;
    owner.append(item);
    result.addClass(classes);
    return result;
};

/**
 * Creates a SELECT element
 * @param opt an object containing a few options:
 * - opt.owner an element to attach the SELECT element, defaults to BODY
 * - opt.names a list of names for the menu, defaults to ['A','B']
 * - opt.values a list of values for the menu, defaults to [1,2]
 * - opt.style an optional style string, defaults to ''
 * - op.onchange a callback, defaults to "alert(this.value)"
 * - opt.id an optional identifier, defaults to an automatic unique id.
 * @ return a SELECT element
 **/
function drop_down_menu(opt){
    var me = new Object();
    me.owner=opt.owner||$('body');
    me.names=opt.names||['A','B'];
    me.values=opt.values||[1,2];
    me.style=opt.style||'';
    me.onchange=opt.onchange||function(){alert(this.value);};
    me.menu = document.createElement('select');
    me.menu.setAttribute('id', opt.id||get_id());
    me.menu.setAttribute("style", me.style);
    me.menu.onchange=me.onchange;
    me.owner.append(me.menu);
    var option;
    for(i=0;i<me.names.length;i++){
	option = document.createElement("option");
	option.setAttribute("value", me.values[i]);
	option.setAttribute("txt", me.names[i]);
	option.innerHTML = me.names[i];
	me.menu.appendChild(option);
    }
    return me.menu;
};

/**
 * Injects HTML code into a jQueryfied element
 * @param data a string which should be valid HTML code
 * @param element a jQuerified element which will be affected
 **/
function set_this(data,element){
    element.html(data);
};

/**
 * Appends HTML code into a jQueryfied element. A <br/> tag is added,
 * then the wanted data is appended.
 * @param data a string which should be valid HTML code
 * @param element a jQuerified element which will be modified
 **/
function append_to_this(data,element){
    element.html(element.html()+'<br>'+data);
}

//----------------------------JS + JQUERY FUNCTIONS----------
/**
 * Creates a big button widget.
 * @param owner an element to attach the button
 * @param txt the text to be diplaid on the button
 * @return a jQueryfied HTML element
 **/
function big_button(owner,txt){
    var big = add({
	what:'button',
	owner:owner,
	txt:txt,
	style:'width:90%;text-align:center;margin:10px;font-size:20pt;vertical-align:middle;border-radius:15px;',
    });
    big.css('height',parseInt(big.css('width'))/4);
    return big;
}
