// Response codes from MessageBox
var IDOK = 0;
var IDCAN = 1;

// Btn Types from MessageBox
var MB_OK = 0; // default
var MB_OKCAN = 1;

var INC_dlgMsgBox =	"																		\
<div class='DLG_window_old'>																\
	<div id='divContent'>																	\
		<table border='0' width='100%'>														\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
			<tr valign=center height='100%'>												\
				<td colspan=2>																\
					<table width='100%' height='100%' border=0>								\
						<tr valign=center height=*>											\
							<td align=center width=10px>&nbsp;</td>							\
							<td align=center width=*><span id='mb_message_div_myid'></span></td>	\
							<td align=center width=10px>&nbsp;</td>							\
						</tr>																\
					</table>																\
				</td>																		\
			</tr>																			\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
			<tr valign=center height=20px>													\
				<td colspan=2 align=center>													\
					<div id='mb_button_div_myid'>&nbsp;</div>									\
				</td>																		\
			</tr>																			\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
		</table>																			\
	</div>																					\
</div>";

var INC_dlgPromptBox =	"																		\
<div class='DLG_window_old'>																\
	<div id='divContent'>																	\
		<table border='0' width='100%'>														\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
			<tr valign=center height='100%'>												\
				<td colspan=2>																\
					<table width='100%' height='100%' border=0>								\
						<tr valign=center height=*>											\
							<td align=center width=10px>&nbsp;</td>							\
							<td align=center width=*><span id='mb_message_div_myid'></span></td>	\
							<td align=center width=10px>&nbsp;</td>							\
						</tr>																\
						<tr valign=center height=*>											\
							<td align=center width=10px>&nbsp;</td>							\
							<td align=center width=*><input type='text' id='in' value=''/></td>		\
							<td align=center width=10px>&nbsp;</td>							\
						</tr>																\
					</table>																\
				</td>																		\
			</tr>																			\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
			<tr valign=center height=20px>													\
				<td colspan=2 align=center>													\
					<div id='mb_button_div_myid'>&nbsp;</div>									\
				</td>																		\
			</tr>																			\
			<tr valign=center height=10px><td colspan=2></td></tr>							\
		</table>																			\
	</div>																					\
</div>";

var zidx = 1000;



function jsDialog(pWinId)
{
	this.winId = pWinId;
	this.contentHTML = '';
	this.initialized = false;
	this.isModal = false;
	this.isDragable = true;
	this.isScrollable = true;
	this.isResizable = false;
	this.isAutoRsz = false;
	this.isClosable = true;
	this.bVisible = false;
	this.title='Dialog';
	this.state='normal';
	this.setXPos(-1);
	this.setYPos(-1);
	this.minWidth=200;
	this.maxWidth=2000;
	this.minHeight=100;
	this.maxHeight=2000;
	this.titleHt = 17;
	this.titleHtAdj = 1; // bottom title bar border width
	this.setWidth(400);
	this.setHeight(400);
	this.isIframe = false;
	this.lBtnDn = false;
	this.rtMMove = -1;
	this.rtMUp = -1;
	this.callbackFunc = null;
	this.doc = document;
	this.closed = false;
	this.lBtnDnRsz = false;
	this.rtRszMMove = -1;
	this.rtRszMUp = -1;
}

jsDialog.prototype.create = function(doc)
{
	if( doc )
		this.setDoc( doc );
		
	this.bCreated = true;

	this.createDivEles();
	this.divEleContent.style.width  = this.width + "px";
	this.divEleContent.style.height = this.isAutoRsz ? '' : (this.height - this.titleHt - this.titleHtAdj) + "px";
	this.divEleTitle_txt.innerHTML = this.title;

	this.showHideBtnEles();
	this.setInitWinPos();
	this.showDivEles();
	if( this.isIframe )
	{
		this.divEleContent.src = this.contentHTML;
		this.divEleContent.contentWindow.window.name = "Trivantis_Dlg_" + this.winId;
		this.divEleContent.contentWindow.window.focus();
	}
	else
	{
		if( this.contentHTML )
			this.divEleContent.innerHTML = this.contentHTML.replace(/myid/g, this.winId);
	}

	this.onInitDialog();
};

jsDialog.prototype.showDivEles = function()
{
	this.divEle.style.display = 'block';
	if( this.isModal )
		this.divModal.style.display = 'block';
};

jsDialog.prototype.createDivEles = function()
{
	var THIS = this;
	
	this.divModal = this.doc.createElement('DIV');
	this.divModal.id = 'DLG_ModalDiv_' + this.winId;
	this.divModal.className = 'DLG_modalDiv';
	this.divModal.style.zIndex = zidx;
	zidx = zidx + 2;
	this.doc.body.appendChild(this.divModal);
	jsDialog.resizeModalDiv(this.divModal);

	this.divEle = this.doc.createElement('DIV');
	this.divEle.id = 'DLG_Div_' + this.winId;
	this.divEle.className = 'DLG_window';
	this.divEle.style.zIndex = zidx;
	zidx++;
	this.doc.body.appendChild(this.divEle);

	this.divEleInner = this.doc.createElement('DIV');
	this.divEleInner.id = 'DLG_innerDiv_' + this.winId;
	this.divEleInner.className = 'DLG_innerDiv';
	this.divEle.appendChild(this.divEleInner);

	this.createTitleBar();

	if( this.isIframe )
	{
		this.divEleContent = this.doc.createElement('iframe');
		if( this.isDragable )
		{
			this.divDrg = this.doc.createElement('DIV');
			this.divDrg.id = 'DLG_dragDiv_' + this.winId;
			this.divDrg.className = 'DLG_dragDiv';
			this.divDrg.style.left = '0px';
			this.divDrg.style.top = (this.titleHt + this.titleHtAdj) + 'px';
			this.divDrg.style.zIndex = zidx - 2;
			this.divEleInner.appendChild(this.divDrg);
		}
	}
	else
		this.divEleContent = this.doc.createElement('DIV');
	this.divEleContent.id = 'DLG_content_' + this.winId;
	this.divEleContent.className = 'DLG_content';
	
	if( !this.isScrollable )
	{
		this.divEleContent.style.overflow = 'hidden';
		this.divEleContent.scrolling = 'no';
	}

	this.divEleInner.appendChild(this.divEleContent);
	
	// Create a hidden close.
	if( this.isIframe )
	{
		this.divHiddenClose = this.doc.createElement('DIV');
		this.divHiddenClose.id = 'DLG_hiddenClose';
		this.divHiddenClose.style.visibility = 'hidden';
		this.divHiddenClose.onclick = function(e){ return THIS.onCancel(e); };
		this.divEleInner.appendChild(this.divHiddenClose);
	}
	
	if ( this.isResizable )
	{
		this.divRsz = this.doc.createElement('DIV');
		this.divRsz.id = 'DLG_resizeHandle_' + this.winId;
		this.divRsz.className = 'DLG_resizeHandle';
		this.divEleInner.appendChild(this.divRsz);
		this.divRsz.onmouseover = function(e){ return THIS.onRszMOver(e); };
		this.divRsz.onmouseout = function(e){ return THIS.onRszMOut(e); };
		this.divRsz.onmousedown = function(e){ return THIS.onRszMDown(e); };
		this.divRsz.onmouseup = function(e){ return THIS.onRszMUp(e); };
	}
};

jsDialog.resizeModalDiv = function(div)
{
	if ( ! div )
	{
		var divs = document.getElementsByTagName('div');
		
		for ( var i = 0; i < divs.length; i++ )
		{
			if ( divs[i].id && divs[i].id.match('DLG_ModalDiv_[0-9]*') )
			{
				div = divs[i];
				break;
			}
		}		
	}
	
	if ( div )
	{
		var doc = document;
		div.style.width = Math.max(doc.documentElement["clientWidth"], doc.body["scrollWidth"], doc.documentElement["scrollWidth"], doc.body["offsetWidth"], doc.documentElement["offsetWidth"])+"px";
		div.style.height = Math.max(doc.documentElement["clientHeight"], doc.body["scrollHeight"], doc.documentElement["scrollHeight"], doc.body["offsetHeight"], doc.documentElement["offsetHeight"])+"px";
	}
};

jsDialog.prototype.createTitleBar = function()
{
	var THIS = this;
	if ( this.divTitleBar )
		return;

	this.divTitleBar = this.doc.createElement('DIV');
	this.divTitleBar.className = 'DLG_titleBarLine';
	this.divTitleBar.style.height = this.titleHt + 'px';
	if( this.isDragable )
	{
		this.divTitleBar.onmouseover = function(e){ return THIS.onMOver(e); };
		this.divTitleBar.onmouseout = function(e){ return THIS.onMOut(e); };
		this.divTitleBar.onmousedown = function(e){ return THIS.onMDown(e); };
		this.divTitleBar.onmouseup = function(e){ return THIS.onMUp(e); };
	}
	this.divEleInner.appendChild(this.divTitleBar);

	var buttonDiv = this.doc.createElement('DIV');
	buttonDiv.className = 'DLG_titleBtns';
	this.divTitleBar.appendChild(buttonDiv);

	this.divCloseBtn = this.doc.createElement('DIV');
	this.divCloseBtn.id = "closeBtn";
	this.divCloseBtn.className='DLG_titleCloseBtn';
	this.divCloseBtn.onmouseover = function(e){ return THIS.onMOverBtn(e); };
	this.divCloseBtn.onmouseout = function(e){ return THIS.onMOutBtn(e); };
	this.divCloseBtn.onclick = function(e){ return THIS.onCancel(e); };
	if ( !this.isClosable )	this.divCloseBtn.style.display='none';
	buttonDiv.appendChild(this.divCloseBtn);

	this.divEleTitle_txt = this.doc.createElement('DIV');
	this.divEleTitle_txt.className = 'DLG_titleText';
//	this.divTitleBar.onselectstart = function(e) { THIS.cancelEvent(e); };
	this.divTitleBar.appendChild(this.divEleTitle_txt);
};

jsDialog.prototype.onInitDialog = function()
{
    // find the controls
	var subDivs = this.divEleContent.getElementsByTagName('DIV');
	for ( var idx=0; subDivs && idx<subDivs.length; idx++)
	{
		if ( subDivs[idx].id === 'IDOK_'+this.winId )
		{
			this.okBtn = subDivs[idx].firstChild;
		    this.okBtn.onclick = function(e){this.onOK(e);};
		}
		else if ( subDivs[idx].id === 'IDCAN_'+this.winId )
		{
			this.cancelBtn = subDivs[idx].firstChild;
		    this.cancelBtn.onclick = function(e){this.onCancel(e);};
		}

		if ( /*theApp.is.ns5 &&*/ subDivs[idx].className=='DLG_edittext' && subDivs[idx].style.width )
		{
			// fix firefox bug
			var input = subDivs[idx].firstChild;
			if ( input && (input.type=='text'||input.type=='textarea') )
			{
				subDivs[idx].style.overflow = 'auto';
				if ( subDivs[idx].style.width && subDivs[idx].style.width.EndsWith('px') )
					input.style.width = (parseInt(subDivs[idx].style.width) - 8) + "px";
				if ( subDivs[idx].style.height && subDivs[idx].style.height.EndsWith('px') )
					input.style.height = (parseInt(subDivs[idx].style.height) - 8) + "px";
			}
		}
    }

	var THIS = this;
	if ( is.ie ) // DLL Bug 7954 - give IE time to show the page to stop the onfocus killing us //BZ Bug11369 Need a little more time.
		setTimeout(function(){THIS.initialized=true;}, 600); 
	else
		THIS.initialized=true;

	return true;
};

jsDialog.prototype.setInitWinPos = function()
{
	this.divEle.style.position = 'absolute';

   	// Setting width and height of content div

   	this.divEle.style.width  = this.width + 'px';
	this.divEle.style.height = ( this.isAutoRsz ? 'auto' : this.height + 'px' );

   	var topOffset = Math.max(this.doc.body.scrollTop, this.doc.documentElement.scrollTop);

	var left = -1;
	var top = -1;
	var d = this.doc;
   	var bodyWidth = 0;
   	var bodyHeight = 0;
   	try {
		bodyWidth = winW;
		bodyHeight = winH;
	}
	catch (e)
	{
		if (navigator.appVersion.indexOf('MSIE 8')!=-1 || navigator.appVersion.indexOf('MSIE 7')!=-1) {
		    bodyWidth = winW = document.documentElement.clientWidth - 16;
		    bodyHeight = winH = document.documentElement.clientHeight;
		}
		else
		{
		   bodyWidth =  winW = (window.innerWidth)? window.innerWidth-16 : document.body.offsetWidth-20
		   bodyHeight = winH = (window.innerHeight)? window.innerHeight   : document.body.offsetHeight
		}
	}		
 

	left = ( this.xPos < 0 ? Math.ceil((bodyWidth - this.width) / 2) : this.xPos );
	top = ( this.yPos < 0 ? Math.ceil((bodyHeight - this.height) / 2) +  topOffset : this.yPos );

	if (left<0) left = 0;
	if (top<0) top = 0;

	this.xPos = left;
	this.yPos = top;

   	this.divEle.style.left = left + 'px';
   	this.divEle.style.top = top + 'px';
};

jsDialog.prototype.moveWinPosBy = function(x,y)
{
	this.xPos += x;
	this.yPos += y;

   	this.divEle.style.left = this.xPos + 'px';
   	this.divEle.style.top = this.yPos + 'px';
};

jsDialog.prototype.rszWinBy = function(dw,dh)
{
	this.width += dw;
	this.height += dh;
	
	if( this.width < 60 )
		this.width = 60;
	if( this.height < 40 )
		this.height = 40;

   	this.divEle.style.width = this.width + 'px';
   	this.divEle.style.height = this.height + 'px';
	this.divEleContent.style.width  = this.width + "px";
	this.divEleContent.style.height = this.isAutoRsz ? '' : (this.height - this.titleHt - this.titleHtAdj) + "px";
};

jsDialog.prototype.setTitleStr = function(titleStr)
{
	this.divEleTitle_txt.innerHTML = titleStr;
};

jsDialog.prototype.deleteWin = function()
{
	this.divEle.style.display='none';
};

jsDialog.prototype.showHideBtnEles = function()
{
	if(this.isClosable)this.divCloseBtn.style.display='block'; else this.divCloseBtn.style.display='none';

};

jsDialog.prototype.onMOverBtn = function(e)
{
	if(this.doc.all)e = event;

	var thisItem = null;
	if (e.target) thisItem = e.target;
	else if (e.srcElement) thisItem = e.srcElement;
	if (thisItem.nodeType == 3) // defeat Safari bug
		thisItem = thisItem.parentNode;

	if ( thisItem == null || thisItem.tagName != 'DIV' )
		return false;

	thisItem.className = thisItem.className + ' DLG_winBtnOver';
	return false;
};

jsDialog.prototype.onMOutBtn = function(e)
{
	if(this.doc.all)e = event;

	var thisItem = null;
	if (e.target) thisItem = e.target;
	else if (e.srcElement) thisItem = e.srcElement;
	if (thisItem.nodeType == 3) // defeat Safari bug
		thisItem = thisItem.parentNode;

	if ( thisItem == null || thisItem.tagName != 'DIV' )
		return false;

	thisItem.className = thisItem.className.replace(' DLG_winBtnOver','');
};

jsDialog.prototype.setWidth = function(newWidth)
{
	if ( this.minWidth && (newWidth / 1) < (this.minWidth / 1) ) newWidth = this.minWidth;
	if ( this.maxWidth && (newWidth / 1) > (this.maxWidth / 1) ) newWidth = this.maxWidth;
	this.width = newWidth;
};

jsDialog.prototype.setHeight = function(newHeight)
{
	if ( this.minHeight && (newHeight / 1) < (this.minHeight / 1) ) newHeight = this.minHeight;
	if ( this.maxHeight && (newHeight / 1) > (this.maxHeight / 1) ) newHeight = this.maxHeight;
	this.height = newHeight + this.titleHt + this.titleHtAdj;
};

jsDialog.prototype.setXPos = function(newXPos)
{
	this.xPos = newXPos;
};

jsDialog.prototype.setYPos = function(newYPos)
{
	this.yPos = newYPos;
};

jsDialog.prototype.onCancel = function(e)
{
	if ( this.lBtnDn == true )
		this.onMUp(e);
	var cb = this.cbFunc;
	this.endDialog();
	if( cb )
		return cb(e, IDCAN);
	return IDCAN;
};

jsDialog.prototype.onOK = function(e)
{
	var cb = this.cbFunc;
	this.endDialog();
	if( cb )
		return cb(e, IDOK);
	return IDOK;
};

jsDialog.prototype.endDialog = function()
{
	this.closed = true;
	this.destroy()
};

jsDialog.prototype.destroy = function()
{
	if ( this.divEleContent )
	{
		if( this.isIframe )
			this.divEleContent.src = "";
		else
			this.divEleContent.innerHTML = "";
		if( this.divEleContent.parentNode )
			this.divEleContent.parentNode.removeChild(this.divEleContent);
	}
	if ( this.divModal && this.divModal.parentNode )
		this.divModal.parentNode.removeChild(this.divModal);
	if ( this.divEle && this.divEle.parentNode )
		this.divEle.parentNode.removeChild(this.divEle);

	for ( var attr in this )
	{
		if ( this[attr] && this[attr].destroy && (typeof this[attr].destroy === 'function') )
			this[attr].destroy();

		this[attr] = null;
	}

	return true;
};

jsDialog.prototype.onMOver = function(e)
{
	this.divTitleBar.style.cursor = 'move';
	return;
};

jsDialog.prototype.onMOut = function(e)
{
	if( !this.lBtnDn )
		this.divTitleBar.style.cursor = '';
	return;
};

jsDialog.prototype.onMDown = function(e)
{
	if(this.doc.all)e = event;
	
	if ( this.lBtnDn == true )
		this.onMUp(e);

	this.lBtnDn = true;
	
	if(this.doc.captureEvents) this.doc.captureEvents(Event.MOUSEMOVE);
	if(this.doc.captureEvents) this.doc.captureEvents(Event.MOUSEUP);
	this.rtMMove = this.doc.onmousemove;
	this.rtMUp = this.doc.onmouseup;
	var THIS = this;
	this.doc.onmousemove = function(e){ return THIS.onMMove(e); };
	this.doc.onmouseup =  function(e){ return THIS.onMUp(e); };
	
	if( this.isIframe )
		this.divDrg.style.display = 'block';
	
	this.curX = e.pageX ? e.pageX : e.clientX;
	this.curY = e.pageY ? e.pageY : e.clientY;
	return;
};

jsDialog.prototype.onMUp = function(e)
{
	this.lBtnDn = false;
	
	if(this.rtMMove != -1){
		if(this.doc.releaseEvents) this.doc.releaseEvents(Event.MOUSEMOVE);
		if(this.doc.releaseEvents) this.doc.releaseEvents(Event.MOUSEUP);
		this.doc.onmousemove = this.rtMMove;
		this.doc.onmouseup = this.rtMUp;
		this.rtMMove = -1;
		this.rtMUp = -1;
	
		if( this.isIframe )
			this.divDrg.style.display = 'none';
	}
	return;
};

jsDialog.prototype.onMMove = function(e)
{
	if(this.doc.all)e = event;
	
	x = e.pageX ? e.pageX : e.clientX;
	y = e.pageY ? e.pageY : e.clientY;
	if( x < this.doc.body.offsetLeft )
		x = this.doc.body.offsetLeft;
	else if( x > winW )
		x = winW;
	if( y < this.doc.body.offsetTop )
		y = this.doc.body.offsetTop;
	else if( y > winH )
		y = winH;
	
	this.moveWinPosBy(x-this.curX, y-this.curY);
	this.curX = x;
	this.curY = y;
	
	return;
};

jsDialog.prototype.setDoc = function(doc)
{
	this.doc = doc;
};

jsDialog.prototype.setClosable = function(closable)
{
	this.isClosable = closable;
};

jsDialog.prototype.close = function()
{
	this.onCancel(null);
};

jsDialog.prototype.onRszMOver = function(e)
{
	this.divRsz.style.cursor = 'se-resize';
	return;
};

jsDialog.prototype.onRszMOut = function(e)
{
	if( !this.lBtnDnRsz )
		this.divRsz.style.cursor = '';
	return;
};

jsDialog.prototype.onRszMDown = function(e)
{
	if(this.doc.all)e = event;
	
	if ( this.lBtnDnRsz == true )
		this.onRszMUp(e);

	this.lBtnDnRsz = true;
	
	if(this.doc.captureEvents) this.doc.captureEvents(Event.MOUSEMOVE);
	if(this.doc.captureEvents) this.doc.captureEvents(Event.MOUSEUP);
	this.rtRszMMove = this.doc.onmousemove;
	this.rtRszMUp = this.doc.onmouseup;
	var THIS = this;
	this.doc.onmousemove = function(e){ return THIS.onRszMMove(e); };
	this.doc.onmouseup =  function(e){ return THIS.onRszMUp(e); };
	
	if( this.isIframe )
		this.divDrg.style.display = 'block';
	
	this.curDW = e.pageX ? e.pageX : e.clientX;
	this.curDH = e.pageY ? e.pageY : e.clientY;
	return;
};

jsDialog.prototype.onRszMUp = function(e)
{
	this.lBtnDnRsz = false;
	
	if(this.rtRszMMove != -1){
		if(this.doc.releaseEvents) this.doc.releaseEvents(Event.MOUSEMOVE);
		if(this.doc.releaseEvents) this.doc.releaseEvents(Event.MOUSEUP);
		this.doc.onmousemove = this.rtRszMMove;
		this.doc.onmouseup = this.rtRszMUp;
		this.rtRszMMove = -1;
		this.rtRszMUp = -1;
	
		if( this.isIframe )
			this.divDrg.style.display = 'none';
	}
	return;
};

jsDialog.prototype.onRszMMove = function(e)
{
	if(this.doc.all)e = event;
	
	dw = e.pageX ? e.pageX : e.clientX;
	dh = e.pageY ? e.pageY : e.clientY;
	
	this.rszWinBy(dw-this.curDW, dh-this.curDH);
	this.curDW = dw;
	this.curDH = dh;
	
	return;
};


function jsDlgMsgBox(pWinId, title, msg, buttonSet, cb, width, height)
{
	jsDialog.prototype.constructor.call(this, pWinId);
	
	this.contentHTML = INC_dlgMsgBox;

	this.title = title ? title : '';
	this.text = msg ? msg : '';
	this.buttonSet = buttonSet ? buttonSet : MB_OK;
	
	if( cb )
		this.cbFunc = cb;

	if ( width )
		this.setWidth(width);

	if ( height )
		this.setHeight(height);

	this.isAutoRsz = true;
	this.isModal = true;
	this.elements = {};

	this.EID_MSG_DIV = "mb_message_div_" + this.winId;
	this.EID_BTN_DIV = "mb_button_div_" + this.winId;

	this.btnHTML = "<input type='button' style='width:80px;' ";
	this.btnSpaceHTML = "&nbsp;&nbsp;&nbsp;";
}

jsDlgMsgBox.prototype = new jsDialog();

jsDlgMsgBox.prototype.create = function(doc)
{
	jsDialog.prototype.create.call(this, doc);
};

jsDlgMsgBox.prototype.onInitDialog = function()
{
	this.getEles();

	var textTable = "<table width=100% height=100% border=0><tr valign='middle'>";
  	textTable += "<td align='center' width=*>";

	// add text message

	this.elements[this.EID_MSG_DIV].innerHTML = textTable + this.text + "</td></tr></table>";

	// update buttons

	var divHTML = "";

	switch ( this.buttonSet )
	{
		case MB_OK:		divHTML = this.getBtnHTML(IDOK); break;
		case MB_OKCAN:	divHTML = this.getBtnHTML(IDOK) + this.btnSpaceHTML + this.getBtnHTML(IDCAN); break;
	}

	this.elements[this.EID_BTN_DIV].innerHTML = divHTML;

	var THIS = this;
	var ele = this.doc.getElementById('IDOK_'+this.winId);
	if( ele ) ele.onclick = function(e){ return THIS.onBtn(e,IDOK); };
	if( ele ) ele.focus();
	ele = this.doc.getElementById('IDCAN_'+this.winId);
	if( ele ) ele.onclick = function(e){ return THIS.onBtn(e,IDCAN); };
		
	return jsDialog.prototype.onInitDialog.call(this);
};

jsDlgMsgBox.prototype.getEles = function(prefix) // TODO: base code ???
{
	var re = new RegExp('^' + (prefix ? prefix : 'EID_'));

	for ( var attr in this )
	{
		if ( attr.match(re) )
			this.elements[this[attr]] = this.doc.getElementById(this[attr]);
	}
};

jsDlgMsgBox.prototype.getBtnHTML = function(btnId)
{
	var n = null;
	var v = null;
	var id = 'NoId';

	switch ( btnId )
	{
		case IDOK:       n = v = trivstrOK; id='IDOK_'+this.winId; break;
		case IDCAN:      n = v = trivstrCancel; id='IDCAN_'+this.winId; break;
	}

	return( this.btnHTML + "id='" + id +"' name='" + n + "' value='" + v + "' onclick='alert(this.value);'/>" );
};

jsDlgMsgBox.prototype.onBtn = function(e,btnId)
{
	var cb = this.cbFunc;
	this.endDialog();
	if(cb && typeof(cb) == 'string' ) 
		eval(cb);
	else if(cb && typeof(cb) == 'function' ) 
		return cb(e, btnId);
	return btnId;
};



function jsDlgPromptBox(pWinId, title, msg, deftxt, cb, width, height)
{
	jsDialog.prototype.constructor.call(this, pWinId);
	
	this.contentHTML = INC_dlgPromptBox;

	this.title = title ? title : '';
	this.text = msg ? msg : '';
	this.deftxt = deftxt ? deftxt : '';
	this.buttonSet = MB_OKCAN;
	
	if( cb )
		this.cbFunc = cb;

	if ( width )
		this.setWidth(width);

	if ( height )
		this.setHeight(height);

	this.isAutoRsz = true;
	this.isModal = true;
	this.elements = {};

	this.EID_MSG_DIV = "mb_message_div_" + this.winId;
	this.EID_BTN_DIV = "mb_button_div_" + this.winId;

	this.btnHTML = "<input type='button' style='width:80px;' ";
	this.btnSpaceHTML = "&nbsp;&nbsp;&nbsp;";
}

jsDlgPromptBox.prototype = new jsDialog();

jsDlgPromptBox.prototype.create = function(doc)
{
	jsDialog.prototype.create.call(this, doc);
};

jsDlgPromptBox.prototype.onInitDialog = function()
{
	this.getEles();

	var textTable = "<table width=100% height=100% border=0><tr valign='middle'>";
  	textTable += "<td align='center' width=*>";
  	
	var ele = this.doc.getElementById('IDOK_'+this.winId);
	
  	this.inEle = this.doc.getElementById('in')
  	this.inEle.value = this.deftxt;
  	this.inEle.focus();

	// add text message

	this.elements[this.EID_MSG_DIV].innerHTML = textTable + this.text + "</td></tr></table>";

	// update buttons

	var divHTML = "";

	switch ( this.buttonSet )
	{
		case MB_OK:		divHTML = this.getBtnHTML(IDOK); break;
		case MB_OKCAN:	divHTML = this.getBtnHTML(IDOK) + this.btnSpaceHTML + this.getBtnHTML(IDCAN); break;
	}

	this.elements[this.EID_BTN_DIV].innerHTML = divHTML;

	var THIS = this;
	var ele = this.doc.getElementById('IDOK_'+this.winId);
	if( ele ) ele.onclick = function(e){ return THIS.onBtn(e,IDOK); };
	ele = this.doc.getElementById('IDCAN_'+this.winId);
	if( ele ) ele.onclick = function(e){ return THIS.onBtn(e,IDCAN); };
		
	return jsDialog.prototype.onInitDialog.call(this);
};

jsDlgPromptBox.prototype.getEles = function(prefix) // TODO: base code ???
{
	var re = new RegExp('^' + (prefix ? prefix : 'EID_'));

	for ( var attr in this )
	{
		if ( attr.match(re) )
			this.elements[this[attr]] = this.doc.getElementById(this[attr]);
	}
};

jsDlgPromptBox.prototype.getBtnHTML = function(btnId)
{
	var n = null;
	var v = null;
	var id = 'NoId';

	switch ( btnId )
	{
		case IDOK:       n = v = trivstrOK; id='IDOK_'+this.winId; break;
		case IDCAN:      n = v = trivstrCancel; id='IDCAN_'+this.winId; break;
	}

	return( this.btnHTML + "id='" + id +"' name='" + n + "' value='" + v + "' onclick='alert(this.value);'/>" );
};

jsDlgPromptBox.prototype.onBtn = function(e,btnId)
{
	var cb = this.cbFunc;
	var rsp = this.inEle.value;
	this.endDialog();
	if( cb )
		return cb(e, btnId, rsp);
	if( btnId == IDOK )
		return rsp;
	else
		return null;
};



function jsDlgBox(pWinId, title, url, cb, width, height, x, y, bNoScr, bNoRsz )
{
	jsDialog.prototype.constructor.call(this, pWinId);

	this.title = title ? title : '';
	this.contentHTML = url;
	this.isIframe = true;	
	this.isAutoRsz = false;
	this.isModal = true;
	
	if( cb )
		this.cbFunc = cb;

	if ( width )
		this.setWidth(width);
	if ( height )
		this.setHeight(height);
		
	if( typeof x != 'undefined' )
		this.setXPos(x)
	if( typeof y != 'undefined' )
		this.setYPos(y)
		
	if( typeof bNoScr != 'undefined' )
		this.isScrollable = !bNoScr;
		
	if( typeof bNoRsz != 'undefined' )
		this.isResizable = !bNoRsz;
	
}

jsDlgBox.prototype = new jsDialog();

jsDlgBox.prototype.create = function(doc)
{
	jsDialog.prototype.create.call(this, doc);
};
