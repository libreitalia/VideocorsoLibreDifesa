/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/

var ocmOrig = document.oncontextmenu
var ocmNone = new Function( "return false" )

// Image Object
function ObjImage(n,i,a,x,y,w,h,v,z,d,cl) {
  this.name = n
  this.altName = a
  this.x = x
  this.y = y
  this.w = w
  this.h = h
  this.v = v
  this.z = z
  this.hasOnUp = false
  this.hasOnRUp = false
  this.isChoice = false
  this.obj = this.name+"Object"
  this.alreadyActioned = false;
  eval(this.obj+"=this")
  this.imgSrc = i
  if ( d!=null && d!="undefined" )
    this.divTag = d;
  else  
    this.divTag = "div";
  this.addClasses = cl;
}

function ObjImageActionGoTo( destURL, destFrame ) {
  this.objLyr.actionGoTo( destURL, destFrame );
}

function ObjImageActionGoToNewWindow( destURL, name, props ) {
  this.objLyr.actionGoToNewWindow( destURL, name, props );
}

function ObjImageActionPlay( ) {
  this.objLyr.actionPlay();
}

function ObjImageActionStop( ) {
  this.objLyr.actionStop();
}

function ObjImageActionShow( ) {
  if( !this.isVisible() )
    this.onShow();
}

function ObjImageActionHide( ) {
  if( this.isVisible() )
    this.onHide();
}

function ObjImageActionLaunch( ) {
  this.objLyr.actionLaunch();
}

function ObjImageActionExit( ) {
  this.objLyr.actionExit();
}

function ObjImageActionChangeContents( newImage ) {
  
  //ie6 deals with transparent png's differently.
  if(is.ie6)
  {
    if(this.imgSrc.indexOf('.png') == this.imgSrc.length-4){
	  this.objLyr.styObj.filter = "";
	  this.objLyr.doc.images[this.name+"Img"].style.filter = "";
    }
    if(newImage.indexOf('.png') == newImage.length-4){
      this.objLyr.doc.images[this.name+"Img"].style.filter =  "progid:DXImageTransform.Microsoft.Alpha(opacity=0)";
      this.objLyr.styObj.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+newImage+"',sizingMethod='scale')";
    }
  }
  
  this.objLyr.doc.images[this.name+"Img"].src = newImage
}

function ObjImageActionTogglePlay( ) {
  this.objLyr.actionTogglePlay();
}

function ObjImageActionToggleShow( ) {
  if(this.objLyr.isVisible()) this.actionHide();
  else this.actionShow();
}

function ObjImageSizeTo( w, h ){
    this.w = w
    this.h = h
    this.build()
    this.activate()
    this.objLyr.clipTo( 0, w, h, 0  )
}

function ObjSetAsIndicator(imgIP,imgNS,dir)
{
	if (!dir) dir = ''
    this.ind = true;
    this.imgNS = imgNS?dir+imgNS:''
    this.imgIP = imgIP?dir+imgIP:''
}

function ObjSetImages(imgSrc,imgIP,imgNS,dir)
{
	if ( this.ind )
	{
		if (!dir) dir = ''
		this.imgSrc = imgSrc?dir+imgSrc:''
		this.imgNS = imgNS?dir+imgNS:''
		this.imgIP = imgIP?dir+imgIP:''
	}
}

function ObjUpdateIndicator(status)
{
	if( status == 'notstarted' )
	  this.actionChangeContents(this.imgNS);
	else if( status == 'inprogress' )
	  this.actionChangeContents(this.imgIP);
	else
	  this.actionChangeContents(this.imgSrc);
 }

{ // Setup prototypes
var p=ObjImage.prototype
p.build = ObjImageBuild
p.init = ObjImageInit
p.activate = ObjImageActivate
p.up = ObjImageUp
p.down = ObjImageDown
p.over = ObjImageOver
p.out = ObjImageOut
p.capture = 0
p.onOver = new Function()
p.onOut = new Function()
p.onSelect = new Function()
p.onDown = new Function()
p.onUp = new Function()
p.onRUp = new Function()
p.actionGoTo = ObjImageActionGoTo
p.actionGoToNewWindow = ObjImageActionGoToNewWindow
p.actionPlay = ObjImageActionPlay
p.actionStop = ObjImageActionStop
p.actionShow = ObjImageActionShow
p.actionHide = ObjImageActionHide
p.actionLaunch = ObjImageActionLaunch
p.actionExit = ObjImageActionExit
p.actionChangeContents = ObjImageActionChangeContents
p.actionTogglePlay = ObjImageActionTogglePlay
p.actionToggleShow = ObjImageActionToggleShow
p.writeLayer = ObjImageWriteLayer
p.onShow = ObjImageOnShow
p.onHide = ObjImageOnHide
p.isVisible = ObjImageIsVisible
p.sizeTo = ObjImageSizeTo
p.onSelChg = new Function()
p.setAsIndicator = ObjSetAsIndicator
p.setImages = ObjSetImages
p.updateIndicator = ObjUpdateIndicator
}

function ObjImageBuild() {
  this.css = buildCSS(this.name,this.x,this.y,this.w,this.h,this.v,this.z)
  this.div = '<' + this.divTag + ' id="'+this.name+'"'
  if( this.addClasses ) this.div += ' class="'+this.addClasses+'"'
  this.div += '></' + this.divTag +'>\n'
  this.divInt = '<a name="'+this.name+'anc"'
  if( this.hasOnUp ) this.divInt += ' href="javascript:void(null)"'
  if( this.altName ) this.divInt += ' title="'+this.altName+'"'
  else if( this.altName != null ) this.divInt += ' title=""'
  this.divInt += '><img name="'+this.name+'Img" src="'+this.imgSrc
  if( this.altName ) this.divInt += '" alt="'+this.altName
  else if( this.altName != null ) this.divInt += '" alt="'
  this.divInt += '" width='+this.w+' height='+this.h
  var addStyle = ''
  if( this.x != null ) addStyle += 'position:absolute;'
  if( this.hasOnUp || this.isChoice ) addStyle += ' cursor:pointer"'
  if( addStyle != '') this.divInt += ' style="' + addStyle + '"'
  this.divInt += ' border=0></a>'
}

function ObjImageInit() {
  this.objLyr = new ObjLayer(this.name)
}

function ObjImageActivate() {
  if( this.objLyr && this.objLyr.styObj && !this.alreadyActioned )
    if( this.v ) this.actionShow()
  if( this.capture & 4 ) {
    this.objLyr.ele.onUp = new Function(this.obj+".onUp(); return false;")
    this.objLyr.ele.onmousedown = new Function("event", this.obj+".down(event); return false;")
    this.objLyr.ele.onmouseup = new Function("event", this.obj+".up(event); return false;")
    this.objLyr.ele.onkeydown = ObjImageKeyDown
  }
  if( this.capture & 1 ) this.objLyr.ele.onmouseover = new Function(this.obj+".over(); return false;")
  if( this.capture & 2 ) this.objLyr.ele.onmouseout = new Function(this.obj+".out(); return false;")
  if( is.ns5 ) this.objLyr.ele.innerHTML = this.divInt
  else this.objLyr.write( this.divInt );
}

function ObjImageDown(e) {
  if( is.ie ) e = event
  if( is.ie && !is.ieMac && e.button!=1 && e.button!=2 ) return
  if( is.ieMac && e.button != 0 ) return
  if( is.ns && e.button!=0 && e.button!=2 ) return
  this.onSelect()
  this.onDown()
}

function ObjImageKeyDown(e) {
    var keyVal = 0
    if( is.ie ) e = event
    keyVal = e.keyCode
    if( keyVal == 13 || keyVal == 32 ) 
	{ this.onUp(); return false; }
}

function ObjImageUp(e) {
  if( is.ie ) e = event
  if( (is.ie || is.nsMac) && !e ) return
  if( is.ie && !is.ieMac && e&& e.button!=1 && e.button!=2 ) return
  if( is.ns && !is.nsMac && e && e.button!=0 && e.button!=2 ) return
  if( !is.ieMac && !is.nsMac && e && e.button==2 )
  {
    if( this.hasOnRUp )
    {
      document.oncontextmenu = ocmNone
      this.onRUp()
      setTimeout( "document.oncontextmenu = ocmOrig", 100)
    }
  }
  else if( this.hasOnUp )
    this.onUp()
}

function ObjImageOver() {
  this.onOver()
}

function ObjImageOut() {
  this.onOut()
}

function ObjImageWriteLayer( newContents ) {
  if (this.objLyr) this.objLyr.write( newContents )
}

function ObjImageOnShow() {
  this.alreadyActioned = true;
  this.objLyr.actionShow();
  if( this.matchObj )
	this.drawLine();
}

function ObjImageOnHide() {
  this.alreadyActioned = true;
  this.objLyr.actionHide();
  if( this.matchLine )
	this.matchLine.ResizeTo( -10, -10, -10, -10 );
}

function ObjImageIsVisible() {
  return this.objLyr.isVisible()
}