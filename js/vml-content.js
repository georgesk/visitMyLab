var ident=1;

function get_id()
{
    ident+=1;
    return 'id_'+ident;
};

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


function drop_down_menu(opt){
    var me = new Object();
    me.owner=opt.owner||$('body');
    me.names=opt.names||['A','B'];
    me.values=opt.values||[1,2];
    me.style=opt.style||'';
    me.onchange=opt.onchange||function(){alert(this.value);};
    me.owner=opt.owner||$('body');
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

function set_this(data,element){
    element.html(data);
};

function append_to_this(data,element){
    element.html(element.html()+'<br>'+data);
}

//----------------------------JS + JQUERY FUNCTIONS----------
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
