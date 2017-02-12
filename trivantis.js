/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/

/* 
** If you want to enable a Debug Window that will show you status
** and debugging information for your HTML published content, 
** copy the file "trivantisdebug.html" from your Support Files directory
** (typically C:\Program Files\Trivantis\(Product Name)\Support Files
** and place in the root folder of your published content (next to this file)
** and then change the value of the trivDebug variable from 0 to 1
** (don't forget to save the modified file).
**
*/

var trivDebug      = 0;
var bDisplayErr    = true;
var trivAddMsgFunc = null;
var trivDebugWnd   = '';
var trivSaveMsg    = '';
var trivProtected  = false;
var trivWeb20Popups  = false;
var trivDynXMLfilePath = '';

function trivLogMsg( msg, level ) {
  if( level != null )
  {
    if( !(trivDebug & level )) return;
  }
  else if( !trivDebug ) return;
  var topWnd = findTrivLogMsg( window, true );
  if( topWnd.trivDebug ) {
    if( topWnd.trivDebugWnd && !topWnd.trivDebugWnd.closed && topWnd.trivDebugWnd.location ) {
      if( msg ) {
        if( topWnd.trivSaveMsg.length ) topWnd.trivSaveMsg += '<br />';
        topWnd.trivSaveMsg += msg;
      }
      if( topWnd.trivAddMsgFunc ) {
        msg = topWnd.trivSaveMsg;
        topWnd.trivSaveMsg = '';
        topWnd.trivAddMsgFunc( msg );
      }
    }
    else {
      topWnd.trivSaveMsg    = msg;
      topWnd.trivDebugWnd   = topWnd.open( 'trivantisdebug.html', 'TrivantisDebug', 'width=400,height=400,scrollbars=0,resizable=1,menubar=0,toolbar=0,location=0,status=0' )
      if( topWnd.trivDebugWnd ) {
        topWnd.trivDebugWnd.focus()
        setTimeout( "trivLogMsg()", 1000 );
      }
    }
  }
}

function findTrivLogMsg( win, bCheckOpener ) {

   if( bCheckOpener && win.opener && win.opener.trivLogMsg ) {
     return findTrivLogMsg( win.opener, false )
   }
   
   while( win ) {
     if( win.parent && win.parent != win && win.parent.trivLogMsg ) win = win.parent;
     else break;
   }
   return win;
}

function ObjLayer(id,pref,frame) {
  if (!ObjLayer.bInit && !frame) InitObjLayers()
  this.frame = frame || self
  if (is.ns) {
    if (is.ns5) {
      this.ele = this.event = document.getElementById(id)
      this.styObj = this.ele.style
      this.doc = document
      this.x = this.ele.offsetLeft
      this.y = this.ele.offsetTop
      this.w = this.ele.offsetWidth
      this.h = this.ele.offsetHeight
    }
  }
  else if (is.ie) {
    this.ele = this.event = this.frame.document.all[id]
    this.styObj = this.frame.document.all[id].style
    this.doc = document
    this.x = this.ele.offsetLeft
    this.y = this.ele.offsetTop
    this.w = this.ele.offsetWidth
    this.h = this.ele.offsetHeight
  }
  if( this.styObj ) this.styObj.visibility = "hidden"
  this.id = id
  this.unique = 1;
  this.pref = pref
  this.obj = id + "ObjLayer"
  eval(this.obj + "=this")
  this.hasMoved = false;
  this.newX = null;
  this.newY = null;
}

function ObjLayerMoveTo(x,y) {
  if (x!=null) {
    this.x = x
    if( this.styObj ) this.styObj.left = this.x + 'px';
  }
  if (y!=null) {
    this.y = y
    if( this.styObj ) this.styObj.top = this.y + 'px';
  }
  
  // Fly transitions or other moves off-page can produce a scrollbar.
  // currently objects moved off the page still maintain their view, this
  // causes a scrollbar to be shown on the page, if a user wants the object
  // to be hidden as soon as it leaves the page dimensions they can set the
  // following line in an external HTML object, header scripting:
  // window.trivHideOffPageObjects=true;
  //
  if (window.trivHideOffPageObjects)
  {
	  // hide it when it's outside the page div
	  var pageDiv = document.getElementById('pageDIV');
	  var pageWidth = Math.max(pageDiv["clientWidth"],pageDiv["offsetWidth"]);
	  var pageHeight = Math.max(pageDiv["clientHeight"],pageDiv["offsetHeight"]);
	  this.styObj.display= ( 0 > (this.x+this.w) || pageWidth < this.x || 0 > (this.y+this.h) || pageHeight < this.y ) ? 'none' : '';  
  }
}

function ObjLayerMoveBy(x,y) {
  this.moveTo(Number(this.x)+Number(x),Number(this.y)+Number(y))
}

function ObjLayerClipInit(t,r,b,l) {
  if (arguments.length==4) this.clipTo(t,r,b,l)
  else this.clipTo(0,this.ele.offsetWidth,this.ele.offsetHeight,0)
}

function ObjLayerClipTo(t,r,b,l) {
  if( !this.styObj ) return;
  try{ this.styObj.clip = "rect("+t+"px "+r+"px "+b+"px "+l+"px)" } catch(e){}
}

function ObjLayerShow() {
  if( this.styObj ) this.styObj.visibility = "inherit"
}

function ObjLayerHide() {
  if( this.styObj ) this.styObj.visibility = "hidden"
}

function ObjLayerActionGoTo( destURL, destFrame, subFrame, bFeed ) {
  var targWind = null
  var bFeedback = bFeed != null ? bFeed : true
  if( destFrame ) {
    if( destFrame == "opener" ) targWind = parent.opener;
    else if( destFrame == "_top" ) targWind = eval( "parent" ) 
    else if(destFrame == "NewWindow" ) targWind = open( destURL, 'NewWindow' )
    else {
      var parWind = eval( "parent" )
      var index=0
      while( index < parWind.length ) {
        if( parWind.frames[index].name == destFrame ) {
          targWind = parWind.frames[index]
          break;
        }
        index++;
      }
      if( subFrame ) {
        index=0
        parWind = targWind
        while( index < parWind.length ) {
          if( parWind.frames[index].name == subFrame ) {
            targWind = parWind.frames[index]
            break;
          }
          index++;
        }
      }
      try
      {
        if( !targWind.closed && targWind.trivExitPage ) {
          targWind.trivExitPage( destURL, bFeedback )
          return
        }
      }catch(e){}      
    }
  }
  if( !targWind ) targWind = window
  try
  {
    if( !targWind.closed ) targWind.location.href = destURL;
  }catch(e){}      
}

function ObjLayerActionGoToNewWindow( destURL, name, props ) {
  var targWind
  if ((props.indexOf('left=') == -1) && (props.indexOf('top=') == -1)) props += GetNewWindXAndYPos( props );
  targWind = window.open( destURL, name, props, false )
  if( targWind ) targWind.focus()
  return targWind
}

function GetNewWindXAndYPos( props ) {
  var countOfW = 'width='.length
  var idxW = props.indexOf('width=');
  var wndW = GetMiddleString( props, countOfW + idxW, ',' )
  var countOfH = 'height='.length
  var idxH = props.indexOf('height=');
  var wndH = GetMiddleString( props, countOfH + idxH, ',' )  
  var wndX = (screen.width - wndW) / 2;
  var wndY = (screen.height - wndH) / 2;	
  return ',left=' + wndX + ',top=' + wndY;
}

function GetMiddleString( str, startIndex, endChar ) {
  var midStr = '';
  for (strIndex = startIndex; str.charAt(strIndex) != endChar; strIndex++) {
    midStr += str.charAt(strIndex);
  }  
  return midStr;
}

function ObjLayerActionPlay( ) {
}

function ObjLayerActionStop( ) {
}

function ObjLayerActionShow( ) {
    this.show();
}

function ObjLayerActionHide( ) {
    this.hide();
}

function ObjLayerActionLaunch( ) {
}

function ObjLayerActionExit( ) {
  if( this.frameElement && this.frameElement.id && this.frameElement.id.indexOf('DLG_content') == 0 )
    closeDialog();
  else
    window.top.close()
}

function ObjLayerActionChangeContents( ) {
}

function ObjLayerActionTogglePlay( ) {
}

function ObjLayerIsVisible() {
  if( !this.styObj || this.styObj.visibility == "hide" || this.styObj.visibility == "hidden" ) return false;
  else return true;
}

{ // Setup prototypes
var p=ObjLayer.prototype
p.moveTo = ObjLayerMoveTo
p.moveBy = ObjLayerMoveBy
p.clipInit = ObjLayerClipInit
p.clipTo = ObjLayerClipTo
p.show = ObjLayerShow
p.hide = ObjLayerHide
p.actionGoTo = ObjLayerActionGoTo
p.actionGoToNewWindow = ObjLayerActionGoToNewWindow
p.actionPlay = ObjLayerActionPlay
p.actionStop = ObjLayerActionStop
p.actionShow = ObjLayerActionShow
p.actionHide = ObjLayerActionHide
p.actionLaunch = ObjLayerActionLaunch
p.actionExit = ObjLayerActionExit
p.actionChangeContents = ObjLayerActionChangeContents
p.actionTogglePlay = ObjLayerActionTogglePlay
p.isVisible = ObjLayerIsVisible
p.write = ObjLayerWrite
p.hackForNS4 = ObjLayerHackForNS4
}

// InitObjLayers Function
function InitObjLayers(pref) {
  if (!ObjLayer.bInit) ObjLayer.bInit = true
  if (is.ns) {
    if (pref) ref = eval('document.'+pref+'.document')
    else {
      pref = ''
      if( is.ns5 ) {
        document.layers = document.getElementsByTagName("*")
        ref = document
      }
      else ref = document
    }
    for (var i=0; i<ref.layers.length; i++) {
      var divname
      if( is.ns5 ) {
        if( ref.layers[i] ) divname = ref.layers[i].tagName
        else divname = null
      }
      else divname = ref.layers[i].name
      if( divname ) {
        ObjLayer.arrPref[divname] = pref
        if (!is.ns5 && ref.layers[i].document.layers.length > 0) {
          ObjLayer.arrRef[ObjLayer.arrRef.length] = (pref=='')? ref.layers[i].name : pref+'.document.'+ref.layers[i].name
        }
      }
    }
    if (ObjLayer.arrRef.i < ObjLayer.arrRef.length) {
      InitObjLayers(ObjLayer.arrRef[ObjLayer.arrRef.i++])
    }
  }
  return true
}

ObjLayer.arrPref = new Array()
ObjLayer.arrRef = new Array()
ObjLayer.arrRef.i = 0
ObjLayer.bInit = false

function ObjLayerSlideEnd() {
  this.tTrans = -1;
  if (this.orgPos)
  {
	this.x = this.orgPos[0];
	this.ele.style.left = this.x+"px";
	this.y = this.orgPos[1];
	this.ele.style.top = this.y+"px";
	this.orgPos=0;
  }
}

function ObjLayerHackForNS4() {
  if( this.isVisible() )
  {
    this.hide()
    setTimeout( this.obj+".show()", 10 )
  }
}

function ObjLayerWrite(html) {
  this.event.innerHTML = html
}

function BrowserProps() {
  var name = navigator.appName
  var ua = navigator.userAgent.toLowerCase();
  
  if (name=="Netscape") name = "ns"
  else if (name=="Microsoft Internet Explorer") name = "ie"
  
  this.v = parseInt(navigator.appVersion,10)
  this.op = ua.indexOf("opera")!=-1
  this.ns = ((name=="ns" && this.v>=4)||this.op)
  this.ns4 = (this.ns && this.v==4)
  this.ns5 = ((this.ns && this.v==5)||this.op)
  this.nsMac = (this.ns && navigator.platform.indexOf("Mac") >= 0 )
  this.ie = (name=="ie" && this.v>=4)
  this.ie6 = (this.ie && navigator.appVersion.indexOf('MSIE 6')>0)
  if( this.ie ) this.v = parseInt( navigator.appVersion.substr( navigator.appVersion.indexOf('MSIE') + 5),10);
  this.ieMac = (this.ie && navigator.platform.indexOf("Mac") >= 0 )
  this.min = (this.ns||this.ie)
  this.Mac = (navigator.platform.indexOf("Mac") >= 0)
  this.activeX = ( this.ie ) ? true : false; 
  this.wmpVersion = 6; // default version number we only support 7 and up
  if( ua.indexOf("iphone")!=-1 || ua.indexOf("ipod")!=-1 || ua.indexOf("ipad")!=-1 ) this.iOS = 1;
  else this.iOS = 0;
  this.chrome = ua.indexOf("chrome") != -1;
  this.webkit = ua.indexOf(" applewebkit/") != -1;
  this.safari = ( navigator.vendor && navigator.vendor.indexOf('Apple') >= 0 ? true : false );
  this.android = ua.indexOf("android") != -1;
  var player = null;
  try 
  {
    if(window.ActiveXObject)
      player = new ActiveXObject("WMPlayer.OCX.7");
    else if (window.GeckoActiveXObject)
      player = new GeckoActiveXObject("WMPlayer.OCX.7");
    else
      player = navigator.mimeTypes["application/x-mplayer2"].enabledPlugin;		
  }
  catch(e)
  {
    // Handle error only if title has wmp-- no WMP control
 
  }
  
  if( player && player.versionInfo ) {
    this.wmpVersion = player.versionInfo.slice(0,player.versionInfo.indexOf('.'));
  }
  
	/*
	 * Use HTML5 if Flash is not present and browser is capable.
	 */
	this.useHTML5Video = function()
	{
		return ( !this.flashVersion(9,0,0) && supports_h264_baseline_video() ); 
	}
	this.useHTML5Audio = function()
	{
		return ( !this.flashVersion(9,0,0) && !!document.createElement('audio').canPlayType ); 
	}

	/*
	 * Flash detection
	 */
	var flashVer = -1;
	// When called with reqMajorVer, reqMinorVer, reqRevision returns t if that version or greater is available
	this.flashVersion = function (reqMajorVer, reqMinorVer, reqRevision)
	{
		if (flashVer == -1 ) 
		{
			var nav = navigator;

			// NS/Opera version >= 3 check for Flash plugin in plugin array

			if (nav.plugins != null && nav.plugins.length > 0) {
				if (nav.plugins["Shockwave Flash 2.0"] || nav.plugins["Shockwave Flash"]) {
					var swVer2 = nav.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
					var flashDescription = nav.plugins["Shockwave Flash" + swVer2].description;
					var descArray = flashDescription.split(" ");
					var tempArrayMajor = descArray[2].split(".");
					var versionMajor = tempArrayMajor[0];
					var versionMinor = tempArrayMajor[1];
					var versionRevision = descArray[3];
					if (versionRevision == "") {
						versionRevision = descArray[4];
					}
					if (versionRevision[0] == "d") {
						versionRevision = versionRevision.substring(1);
					} else if (versionRevision[0] == "r") {
						versionRevision = versionRevision.substring(1);
						if (versionRevision.indexOf("d") > 0) {
							versionRevision = versionRevision.substring(0, versionRevision.indexOf("d"));
						}
					}
					flashVer = versionMajor + "." + versionMinor + "." + versionRevision;
					//alert("flashVer="+flashVer);
				}
			}
			else if ( this.ie && !this.Mac && !this.op ) {

				var axo;
				// NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
				try {
					// version will be set for 7.X or greater players
					axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
					flashVer = axo.GetVariable("$version");
				} catch (e) {
				}

				if (!flashVer)
				{
					try {
						// version will be set for 6.X players only
						axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");

						// installed player is some revision of 6.0
						// GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
						// so we have to be careful.

						// default to the first public version
						flashVer = "WIN 6,0,21,0";

						// throws if AllowScripAccess does not exist (introduced in 6.0r47)
						axo.AllowScriptAccess = "always";

						// safe to call for 6.0r47 or greater
						flashVer = axo.GetVariable("$version");

					} catch (e) {
					}
				}
			}
		}
		
		if (flashVer == -1 ) {
			return false;
		} else if (flashVer != 0) {
			var versionArray;
			if(this.ie && !this.Mac && !this.op) {
				// Given "WIN 2,0,0,11"
				var tempArray     = flashVer.split(" "); 	// ["WIN", "2,0,0,11"]
				var tempString        = tempArray[1];			// "2,0,0,11"
				versionArray      = tempString.split(",");	// ['2', '0', '0', '11']
			} else {
				versionArray      = flashVer.split(".");
			}
			var versionMajor      = versionArray[0];
			var versionMinor      = versionArray[1];
			var versionRevision   = versionArray[2];

			// is the major.revision >= requested major.revision AND the minor version >= requested minor
			if (versionMajor > parseFloat(reqMajorVer)) {
				return true;
			} else if (versionMajor == parseFloat(reqMajorVer)) {
				if (versionMinor > parseFloat(reqMinorVer))
					return true;
				else if (versionMinor == parseFloat(reqMinorVer)) {
					if (versionRevision >= parseFloat(reqRevision))
						return true;
				}
			}
			return false;
		}
	};
}

is = new BrowserProps()

// CSS Function
function buildCSS(id,left,top,width,height,visible,zorder,color,other) {
  var str = (left!=null && top!=null)? '#'+id+' {position:absolute; left:'+left+'px; top:'+top+'px;' : ((width!=null && height!=null) ? '#'+id+' {position:relative;' : '#'+id+' {position:fixed; width:100%; height:100%;' )
  if (arguments.length>=4 && width!=null) str += ' width:'+width+'px;'
  if (arguments.length>=5 && height!=null) {
    str += ' height:'+height+'px;'
    if (arguments.length<9 || other.indexOf('clip')==-1) str += ' clip:rect(0px '+width+'px '+height+'px 0px);'
  }
  if (arguments.length>=6 && visible!=null) str += ' visibility:'+ ( (visible)? 'inherit' : 'hidden' ) +';'
  if (arguments.length>=7 && zorder!=null) str += ' z-index:'+zorder+';'
  if (arguments.length>=8 && color!=null) str += ' background:'+color+';'
  if (arguments.length==9 && other!=null) str += ' '+other
  str += '}\n'
  return str
}

function writeStyleSheets(str) {
  cssStr = '<style type="text/css">\n'
  cssStr += str
  cssStr += '</style>'
  document.write(cssStr)
}

function preload() {
  if (!document.images) return;
  var ar = new Array();
  for (var i = 0; i < arguments.length; i++) {
    ar[i] = new Image();
    ar[i].src = arguments[i];
  }
}

function getHTTP(dest, method, parms)
{
    var httpReq;
    if( method == 'GET' ) { 
        if( parms ) {
          if( dest.indexOf('?' ) > 0 )
            dest += '&';
          else
            dest += '?';
          dest += parms;
          parms = null;
        }
    }
    
    var msg = 'Issuing ' + method + ' to ' + dest;
    if( parms ) msg += ' for [' + parms + ']';
    trivLogMsg( msg, 8 );
    
    var requestSent = 0;
    try { 
        // branch for native XMLHttpRequest object
        if (window.XMLHttpRequest) {
            httpReq = new XMLHttpRequest();
            httpReq.open(method, dest, false);
            httpReq.onreadystatechange = null;
            if( method == 'POST' ) {
              httpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            }
            httpReq.send(parms); 
            requestSent = 1;
        } 
    }
    catch(e){}
    
    // branch for IE/Windows ActiveX version
    if (!requestSent && window.ActiveXObject) {
        httpReq = new ActiveXObject("Microsoft.XMLHTTP");
        if (httpReq) {
            httpReq.open(method, dest, false);
            if( method == 'POST' ) {
              httpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            }
            httpReq.send(parms);
        }
    }
    trivLogMsg( 'ReturnCode = ' + httpReq.status + ' Received Data [' + httpReq.responseText + ']', 8 );
    return httpReq;
}

function GenRand( min, max )
{
  return Math.floor( Math.random() * ( max - min + 1 ) + min );
}

function Encode( s )
{
  if( s == null ) return '';
  return encodeURIComponent( String(s) );
}

function Decode( s )
{
  if( s == null ) return '';
  return decodeURIComponent( String(s) );
}

function UniUnescape( s )
{
  if( s == null ) return '';
  return( unescape( String(s).replace(/%5Cu/g, '%u') ) );
}

function unJUN( s )
{
  var val = "";
  if( s != null )
  {
    for( i=0; i<s.length; i++ )
    {
      if( s.charAt(i) == '\\' && s.length > (i + 5) && s.charAt(i+1) == 'u' )
      {
        cEsc = '%';
        cEsc += s.substring(i+1,i+6);
        c = unescape(cEsc);
        if( c.length == 1 )
        {
          val += c;
          i += 5;
        }
        else
        {
          val += s.charAt(i);
        }
      }
      else
      {
        val += s.charAt(i);
      }
    }
  }
  return val;
}

function convJS( s )
{
  if( s == null ) return '';
  s = s.replace(/\n/g, '<br/>');
  s = s.replace(/\\r/g, '<br/>');
  s = s.replace(/"/g, '&quot;');
  return s;
}

function addDelimeter( arrCh, strAns, del ) {
  var retVar = "";
  if( strAns != null && strAns != "" )
  {
    var strTmpChoice = "";
    var loc;
    var str = "," + strAns + ",";
    for( var i=0; i<arrCh.length; i++ ) {
      strTmpChoice = "," + arrCh[i] + ",";
      loc = str.indexOf(strTmpChoice);
      if( loc != -1 )
      {
        if( retVar.length == 0 )
          retVar = del;
        retVar += arrCh[i] + del;
      }
    }
  }
  return retVar;
}

function getContentWindow()
{
  var win = window;
  if( window.frameElement && ( window.frameElement.name == 'titlemgrframe' ) )
  {
    if( window.frameElement.parentNode )
    {
      for( i=0; i<window.frameElement.parentNode.childNodes.length; i++ )
      {
        if( window.frameElement.parentNode.childNodes[i].name == 'contentframe' )
        {
          win = window.frameElement.parentNode.childNodes[i].contentWindow;
          break;
        }
      }
    }
  }
  return win;
}


function trivAlert( pWinId, title, msg, cb )
{
	if( trivWeb20Popups )
	{
		var alertMsg = msg.replace(/\n/g, "<br>"); // 15923 - handle line breaks
		var mb = new jsDlgMsgBox( pWinId, title, alertMsg, null, cb);
		mb.create();
	}
	else
		alert( msg );
}

function closeDialog()
{
	var close;
	var rc = false;
	if( this.frameElement && this.frameElement.parentNode )
	{
		for( i=0; i<this.frameElement.parentNode.childNodes.length; i++ )
		{
			if( this.frameElement.parentNode.childNodes[i].id == 'DLG_hiddenClose' )
			{
				close = this.frameElement.parentNode.childNodes[i];
				break;
			}
		}
		if( close && close.onclick )
		{
			close.onclick();
			rc = true;
		}
	}
	return rc;
}

function CloseWnd() {
  if( this.frameElement && this.frameElement.id && this.frameElement.id.indexOf('DLG_content') == 0 )
    closeDialog();
  else
    window.close();
}

function createXMLHTTPObject(filename){
	var httpReq;
	try{
		if ( window.ActiveXObject ){
			httpReq = new ActiveXObject("Microsoft.XMLHTTP");

			if (httpReq){
				httpReq.open('GET', filename, false);
				httpReq.send();
			}
		}
		else if ( window.XMLHttpRequest ){
			httpReq = new XMLHttpRequest();
			httpReq.open('GET', filename, false);
			httpReq.onreadystatechange = null;
			httpReq.send("noCache=" + (new Date().getTime()) );
		}

		var respXML = httpReq.responseXML;
		if ( window.ActiveXObject ){
			respXML = new ActiveXObject("Microsoft.XMLDOM");
			respXML.async = "false";
			respXML.loadXML(httpReq.responseText);
		}

	}
	catch(e) {}
	return respXML;
}

function getNVStr(nl,tag){
	var ar = nl.getElementsByTagName(tag);
	for( var i=0; i<ar.length; i++ )
		if( ar[i] && ar[i].firstChild && ar[i].parentNode == nl ) return ar[i].firstChild.data;
	return "";
}

function getTextData(filename, textblockname){
	if( trivDynXMLfilePath.length > 4 ) 
		filename = trivDynXMLfilePath;
	var nl = createXMLHTTPObject(filename);
	var arTB = nl.getElementsByTagName('textblock');
	for( var i = 0; arTB && i < arTB.length; i++ ){
		if(arTB[i].getAttribute('name') == textblockname)
			return getNVStr( arTB[i], 'text' );
	}
	return '';
}

function getAllChildrenSpanElem(targetDocument, currentElement, arr) {
    if (currentElement) {
        var j;
        var tagName = currentElement.tagName;

        if (tagName == 'SPAN')
            arr.push(currentElement);

        var i = 0;
        var currentElementChild = currentElement.childNodes[i];
        while (currentElementChild) {
            getAllChildrenSpanElem(targetDocument, currentElementChild, arr);
            i++;
            currentElementChild = currentElement.childNodes[i];
        }
    }
}

function supports_video() {
    return !!document.createElement('video').canPlayType;
}

function supports_h264_baseline_video() {
    if (!supports_video()) { return false; }
    var v = document.createElement("video");
    return /^(probably|maybe)$/i.test(v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
}

function trivTimerLoop( timerVar, durInSec, onDone, updatefunc, propsStr, bRecur ){
	var timerVarVal = timerVar.getValue();
	var startTime = parseInt( timerVarVal );
	var paused = false;
	var now = parseInt((new Date().getTime()+500)/1000)*1000;
	if( timerVarVal!=null && typeof(timerVarVal)!="undefined")
	{
		timerVarVal = timerVarVal.toString();
		var bPause = timerVarVal.indexOf( "pause:" ) != -1;
		var bDone  = timerVarVal.indexOf( "done:" ) != -1;
		if( bPause || bDone )
		{
			var remainingTime = parseInt( timerVarVal.split(':')[1]) ;
			startTime = ( now - remainingTime );
			if( bPause )
				paused = true;
			else
			{
				if( bRecur )
					paused = true;
				else
					timerVar.set( startTime );
			}
		}
	}
	
	if( ( startTime == 0 || startTime > now  )&& !paused)
	{
		//this is a fresh timer: 
		startTime = now;
		timerVar.set( startTime );
	}	
	
	var props = eval(propsStr);
	var strRemain = getRemainingTime(now, startTime, durInSec*1000, props.bShowHours, props.bShowMin, props.bShowSec, props.countdown );
	
	if( strRemain == null && !paused)
	{
		timerVar.set( "pause:-999999999999999" ); //negative remaining time, this will signify timer completed.
		eval( onDone ); 
	}
	else 
	{
		if( strRemain == null )
			strRemain = buildTimeString( (props.countdown)?0:(durInSec*1000), props.bShowHours, props.bShowMin, props.bShowSec );
		var updFunc = eval(updatefunc);
		updFunc( strRemain );
	}
	
	var strExec = "trivTimerLoop(" + timerVar.name + "," + durInSec + ",'" + onDone +"','" + updatefunc + "', '" + propsStr + "', true )";
	setTimeout( strExec, 500 );
}

function buildTimeString(lRemain, showHours, showMins, showSecs )
{
	var strRemain = '';
	
    lRemain = lRemain/1000;
	
    var temp = parseInt(lRemain/3600);
    lRemain -= temp * 3600;
    if ( showHours )
	{
		strRemain += temp + ':';
	}
    else
		strRemain += '  ';
		
    temp = parseInt(lRemain/60);
    lRemain -= temp * 60;
    if ( showMins )
    {
        if( temp <= 9 )
			strRemain += '0';
	    strRemain += temp;
    }
    if ( showSecs )
    {
        if ( showMins )
            strRemain += ':';
        if( lRemain <= 9 )
            strRemain += '0';
        strRemain += parseInt( lRemain );
    }
	return strRemain;
}

function getRemainingTime( now, lStartTime, lDuration, showHours, showMins, showSecs, countDown ) 
{ 
  lStartTime = parseInt(lStartTime/1000)*1000
  var lRemain = 0;
  var timeSoFar = 0;
  var lCurr = 0;
  var now = parseInt((new Date().getTime()+500)/1000)*1000;
  
  if( lStartTime > now )
	return null;

  lCurr = now - lStartTime;

  lRemain = lDuration - lCurr;

  if ( !countDown )
  {
	timeSoFar = lDuration - lRemain;

	if ( timeSoFar > lDuration )
		return null;
	lRemain = timeSoFar;
  }
  
  if( countDown && lRemain > 0 || !countDown && timeSoFar < lDuration)
    return buildTimeString( lRemain, showHours, showMins, showSecs, countDown );
  else
    return null;
}

function validateNum(evt) {
  var theEvent = evt || window.event;
  if( is.ns && !is.chrome && theEvent.keyCode != 0 ) return;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode( key );
  var regex = /[0-9]|\.|\,|\-/;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}
