/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/
var ocmOrig = document.oncontextmenu
var ocmNone = new Function( "return false" )

// Button Object
function ObjButton(n,a,x,y,w,h,v,z,d,cl,act) {
  this.name = n
  this.altName = a
  this.x = x
  this.y = y
  this.w = w
  this.h = h
  this.v = v
  this.z = z
  this.obj = this.name+"Object"
  this.alreadyActioned = false;
  eval(this.obj+"=this")
  if ( d != 'undefined' && d!=null )
    this.divTag = d;
  else  
    this.divTag = "div";
  this.addClasses = cl;
  this.hasAct = act;
}

function ObjButtonActionGoTo( destURL, destFrame ) {
  this.objLyr.actionGoTo( destURL, destFrame );
}

function ObjButtonActionGoToNewWindow( destURL, name, props ) {
  this.objLyr.actionGoToNewWindow( destURL, name, props );
}

function ObjButtonActionPlay( ) {
  this.objLyr.actionPlay();
}

function ObjButtonActionStop( ) {
  this.objLyr.actionStop();
}

function ObjButtonActionShow( ) {
  if( !this.isVisible() )
    this.onShow();
}

function ObjButtonActionHide( ) {
  if( this.isVisible() )
    this.onHide();
}

function ObjButtonActionLaunch( ) {
  this.objLyr.actionLaunch();
}

function ObjButtonActionExit( ) {
  this.objLyr.actionExit();
}

function ObjButtonActionChangeContents( ) {
  this.objLyr.actionChangeContents();
}

function ObjButtonActionTogglePlay( ) {
  this.objLyr.actionTogglePlay();
}

function ObjButtonActionToggleShow( ) {
  if(this.objLyr.isVisible()) this.actionHide();
  else this.actionShow();
}

function ObjButtonSizeTo( w, h ) {
  this.w = w
  this.h = h
  this.build()
  this.activate()
  this.objLyr.clipTo( 0, w, h, 0  )
}

{// Setup prototypes
var p=ObjButton.prototype
p.checkbox = false
p.setImages = ObjButtonSetImages
p.build = ObjButtonBuild
p.init = ObjButtonInit
p.activate = ObjButtonActivate
p.down = ObjButtonDown
p.up = ObjButtonUp
p.over = ObjButtonOver
p.out = ObjButtonOut
p.change = ObjButtonChange
p.capture = 0

p.onDown = new Function()
p.onUp = new Function()
p.onOver = new Function()
p.onOut = new Function()
p.onSelect = new Function()
p.onDeselect = new Function()
p.actionGoTo = ObjButtonActionGoTo
p.actionGoToNewWindow = ObjButtonActionGoToNewWindow
p.actionPlay = ObjButtonActionPlay
p.actionStop = ObjButtonActionStop
p.actionShow = ObjButtonActionShow
p.actionHide = ObjButtonActionHide
p.actionLaunch = ObjButtonActionLaunch
p.actionExit = ObjButtonActionExit
p.actionChangeContents = ObjButtonActionChangeContents
p.actionTogglePlay = ObjButtonActionTogglePlay
p.actionToggleShow = ObjButtonActionToggleShow
p.writeLayer = ObjButtonWriteLayer
p.onShow = ObjButtonOnShow
p.onHide = ObjButtonOnHide
p.isVisible = ObjButtonIsVisible
p.sizeTo    = ObjButtonSizeTo
p.onSelChg = new Function()
}

function ObjButtonSetImages(imgOff,imgOn,imgRoll,dir) {
  if (!dir) dir = ''
  this.imgOffSrc = imgOff?dir+imgOff:''
  this.imgOnSrc = imgOn?dir+imgOn:''
  this.imgRollSrc = imgRoll?dir+imgRoll:''
}

function ObjButtonBuild() {
  this.css = buildCSS(this.name,this.x,this.y,this.w,this.h,this.v,this.z)
  this.div = '<' + this.divTag + ' id="'+this.name+'" style="text-indent:0;"'
  if( this.addClasses ) this.div += ' class="'+this.addClasses+'"'
  this.div += '></' + this.divTag + '>\n'
  if(this.hasAct) this.divInt = '<a name="'+this.name+'anc" href="javascript:if( ' + this.name + '.hasOnUp ) ' + this.name + '.onUp()"'
  else this.divInt = '<a name="'+this.name+'anc"'
  if( this.altName ) this.divInt += ' title="'+this.altName+'"'
  else if( this.altName != null ) this.divInt += ' title=""'
  this.divInt += '><img name="'+this.name+'Img" src="'+this.imgOffSrc
  if( this.altName ) this.divInt += '" alt="'+this.altName
  else if( this.altName != null ) this.divInt += '" alt="'
  this.divInt += '" width='+this.w+' height='+this.h+' border=0'
  this.divInt += ' style="cursor:pointer;position:absolute"'
  this.divInt += '></a>'
}

function ObjButtonInit() {
  this.objLyr = new ObjLayer(this.name)
}

function ObjButtonActivate() {
  if( this.objLyr && this.objLyr.styObj && !this.alreadyActioned ) {
    if( this.v ) this.actionShow()
  }
  if(!is.iOS)//bug11459
  {
	this.objLyr.ele.onUp = new Function(this.obj+".onUp(); return false;")
	this.objLyr.ele.onmouseout = new Function(this.obj+".out(); return false;")
	this.objLyr.ele.onmousedown = new Function("event", this.obj+".down(event); return false;")
	this.objLyr.ele.onmouseover = new Function(this.obj+".over(); return false;")
	this.objLyr.ele.onmouseup = new Function("event", this.obj+".up(event); return false;")
  }
  if( is.ns5 ) this.objLyr.ele.innerHTML = this.divInt
  else this.objLyr.write( this.divInt );
}

function ObjButtonDown(e) {
  if( is.ie ) e = event
  if( is.ie && !is.ieMac && e && e.button!=1 && e.button!=2 ) return
  if( is.ns && !is.nsMac && e && e.button!=0 && e.button!=2 )  return
  if (this.selected) {
    this.selected = false
    if (this.imgOnSrc) this.change(this.imgOnSrc)
    this.onDeselect()
  }
  else {
    if (this.checkbox) this.selected = true
    if (this.imgOnSrc) this.change(this.imgOnSrc)
    this.onSelect()
  }
  this.onDown()
}

function ObjButtonUp(e) {
  if( is.ie ) e = event
  if( (is.ie || is.nsMac) && !e ) return
  if( is.ie && !is.ieMac && e && e.button!=1 && e.button!=2 ) return
  if( is.ns && !is.nsMac && e && e.button!=0 && e.button!=2 ) return
  if (!this.selected) {
    if (this.imgRollSrc) this.change(this.imgRollSrc)
    else if (this.imgOnSrc) this.change(this.imgOffSrc)
  }
  if( !is.ieMac && !is.nsMac && e && e.button==2 )
  {
    if( this.hasOnRUp )
    {
      document.oncontextmenu = ocmNone
      this.onRUp()
      setTimeout( "document.oncontextmenu = ocmOrig", 100)
    }
  }
}

function ObjButtonOver() {
  if (this.imgRollSrc && !this.selected) this.change(this.imgRollSrc)
  this.onOver()
}

function ObjButtonOut() {
  if (this.imgRollSrc && !this.selected) this.change(this.imgOffSrc)
  this.onOut()
}

function ObjButtonChange(img) {
  if (this.objLyr) this.objLyr.doc.images[this.name+"Img"].src = img
}

function ObjButtonWriteLayer( newContents ) {
  if (this.objLyr) this.objLyr.write( newContents )
}

function ObjButtonOnShow() {
  this.alreadyActioned = true;
  this.objLyr.actionShow();
}

function ObjButtonOnHide() {
  this.alreadyActioned = true;
  this.objLyr.actionHide();
}

function ObjButtonIsVisible() {
  if( this.objLyr.isVisible() )
    return true;
  else
    return false;
}