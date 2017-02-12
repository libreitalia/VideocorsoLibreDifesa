/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/

var bTrivUseLocal = isLocalStorageSupported();
function isLocalStorageSupported(){
  try {
    window.sessionStorage.setItem('test', '1');
    window.sessionStorage.removeItem('test');
    return true;
  } catch (error) {
    return false;
  }
}

var delim = '|';
var	storageVer = 2; //version of storage, change when the format of webstorage data changes. 
//Be sure to write a converter function if it changes.
//Version 1: initial implementation of web storage. beginning from Lectora v11.3
//Version 2: switched from comma delimiter to | delimiter. beginning from Lectora v11.3.2

function getWebStorageKey( title )
{
	return "Lectora" + storageVer + ( title ? (":"+ Encode(title)) : "" );
}

function saveVariable(name,value,days,title,lms, bHidden) {
  convertCookies(title, bHidden)

  if(bTrivUseLocal){
	UpgradeStorageVersion();
	var titleMgr = getTitleMgrHandle()
	
	var key = getWebStorageKey(title);
	var data
	if( days ) data = localStorage.getItem(key);
	else data = sessionStorage.getItem(key);
	
	var bFound = false;
	var newData = ""
	if( data ){
		var dataSplit = data.split(delim);
		for( var i = 0; i<dataSplit.length; i++ ){
			if( dataSplit[i].length == 0 )
				continue;
			
			var varParts = dataSplit[i].split('=');
			if( varParts.length == 2 ){
				var n = unescapeDelim(varParts[0]);
				var v = unescapeDelim(varParts[1]);
				if( n == name ){
					bFound = true;
					v = value
				}
				
				newData += (escapeDelim(n) + '=' + escapeDelim(v) + delim)
			}
		}
	}
	
	if( !bFound ){
		newData += (escapeDelim(name) + '=' + escapeDelim(value) + delim)
	}
	
	if( days ) localStorage.setItem(key,newData);
	else sessionStorage.setItem(key,newData);
	  
    if(!bHidden) trivLogMsg( 'saveVariable for ' + name + ' to [' + value + ']', 2 )
    if( titleMgr ){
	  titleMgr.setVariable(name,value,days)
	  if( (!days || lms) && !document.TitleMgr && ! window.jTitleManager ) return
    }
  }
  else
	saveVariableInCookie( name,value,days,title,lms, bHidden );
  
}

function saveVariableInCookie( name,value,days,title,lms, bHidden ){
  var titleMgr = getTitleMgrHandle()
  var props = "; path=/"
  
  if (days) {
    var date = new Date()
    date.setTime(date.getTime()+(days*24*60*60*1000))
    props += "; expires="+date.toGMTString()
  }
  
  var encName = Encode(name) 
  var encValue = Encode(value)
  var myCookie = (days ? '~LectoraPermCookie' : '~LectoraTempCookie' ) + ( title ? ':' + Encode(title) : '' ) + ':'
  var relatedCookies = {} // other cookies with the same base name but a different index
  var nameEQ = delim + encName + "="
  var cookieName = null
  var cookieValue = ''
  var cookieIdx = 0
  var saveIdx = -1
  var highIdx = 1

  var ca = document.cookie.split(';')

  for ( var i=0; i<ca.length; i++ )
  {
    var c = ca[i]
    for( var j=0;j<c.length;j++)
    {
      if( c.charAt(j) != ' ' )
        break
    }
    c = c.substring(j)

    if ( c.indexOf(myCookie) === 0 )
    {
      var equIdx = c.indexOf('=')
      cookieIdx = parseInt(c.substring(myCookie.length, equIdx), 10) // get cookie index from: ~LectoraPermCookie_title.html1=|n1=v1|n2=v2|n3=v3|
      highIdx = ( cookieIdx > highIdx ? cookieIdx : highIdx )
      cookieName = myCookie + cookieIdx
      var varIdx = c.indexOf(nameEQ)

      if ( varIdx >= 0 )
      {
        var firstPart = c.substring(equIdx + 1, varIdx) // null string or |n1=v1
        var lastPart = c.substring(varIdx + nameEQ.length) // v2| or v2|n3=v3|
        lastPart = lastPart.substring(lastPart.indexOf(delim)) // | or |n3=v3|
        lastPart = ( !firstPart && lastPart == delim ? '' : lastPart )
        cookieValue = firstPart + lastPart // |n1=v1|n3=v3| (current value of the cookie minus the var being updated or deleted)
        saveIdx = cookieIdx // indicates an update or delete
      }
      else
      {
        cookieValue = c.substring(equIdx + 1) // |n1=v1|n2=v2|n3=v3|
      }

      relatedCookies[cookieName] = cookieValue
    }
  }
  if(!bHidden) trivLogMsg( 'saveVariable for ' + name + ' to [' + value + ']', 2 )
  if( titleMgr )
  {
    titleMgr.setVariable(name,value,days)
    if( (!days || lms) && !document.TitleMgr && ! window.jTitleManager ) return
  }
  
  var isIns = ( saveIdx == -1 && days >= 0 );
  var isUpd = ( saveIdx != -1 && days >= 0 );
  var isDel = ( saveIdx != -1 && days < 0 );
  var newVal = ( isDel ? '' : nameEQ + encValue + delim );

  if ( isIns || isUpd || isDel )
  {
    // Loop through all indexes attempting to find a cookie with enough room to save the
    // variable.  If none exist start a new cookie.  In the case of an update, try the
    // original cookie first (so only 1 cookie update occurs) before trying other existing
    // cookies.  Cookie indexes start at 1 but the loop starts at 0 so for updates the
    // original cookie will be process at index 0 (first).  Also, the loop ends at highIdx + 1
    // in case a cookie needs to be added and there were no holes in the index sequence.

    for ( var cIdx = 0; cIdx <= highIdx + 1; cIdx++ )
    {
      if ( cIdx == saveIdx ) continue; // saveIdx was processed when cIdx was 0 (this is an update or delete of the variable)
      if ( cIdx == 0 && isIns ) continue; // this is insert not an update or delete so skip index 0

      cookieName = myCookie + ( cIdx == 0 ? saveIdx : cIdx ); // process matched cookie first if there was a match (this is an update or delete of the variable)
      cookieValue = ( relatedCookies[cookieName] == undefined ? '' : relatedCookies[cookieName] ); // covers holes in the index sequence and new cookie

      if ( cookieValue.length + newVal.length < 4000 )
      {
        if ( cookieValue && !isDel ) cookieValue = cookieValue.substring(0, cookieValue.length - 1); // remove ending '|'
        document.cookie = cookieName + '=' + cookieValue + newVal + props;
        // if ( document.cookie.length == 0 ) alert('IE7 4K cookie limit reached.  All variable data lost.');
        break;
      }
      else if ( cIdx == 0 ) // update where new value is too big for old cookie (save without var and move on)
      {
        document.cookie = cookieName + '=' + cookieValue + props;
        // if ( document.cookie.length == 0 ) alert('IE7 4K cookie limit reached.  All variable data lost.');
      }
      else if ( newVal.length >= 4000 ) // variable too big to insert or update
      {
        if(!bHidden) trivLogMsg('saveVariable failed for ' + name + ': length of value is greater than or equal to 4000 [' + newVal.length + ']', 2);
        break;
      }
    }
  }
}

function readVariable(name,defval,days,title, bHidden) {
  convertCookies(title, bHidden)
  if(bTrivUseLocal){
	UpgradeStorageVersion();
	var titleMgr = getTitleMgrHandle()
	if( titleMgr == null || titleMgr.findVariable( name ) < 0 ){
		var key = getWebStorageKey(title);
		var data
		
		if(days) data = localStorage.getItem(key);
		else data = sessionStorage.getItem(key);
		
		if( data ){
			var dataSplit = data.split(delim);
			
			for( var i=0; i<dataSplit.length; i++ ){
				if(dataSplit[i].length == 0)
					continue;
				
				var varParts = dataSplit[i].split('=')
				
				if( varParts.length == 2 ){
					var n = unescapeDelim(varParts[0]);
					var v = unescapeDelim(varParts[1]);
					if( n == name )
					{
						defval = v;
						break;
					}
				}			
			}
		}
		
		if( titleMgr ) titleMgr.setVariable(name,defval,days)  
	}
	
	if( titleMgr ) {
      defval = String( titleMgr.getVariable(name,defval,days) )
    }
  }
  else
	defval = readVariableFromCookie(name,defval,days,title, bHidden);
	
  if(!bHidden) trivLogMsg( 'readVariable for ' + name + ' = [' + defval + ']', 1 )
  return defval;
}

function readVariableFromCookie(name,defval,days,title, bHidden)
{
  var titleMgr = getTitleMgrHandle()
  if( titleMgr == null || titleMgr.findVariable( name ) < 0 )
  {
    var myCookie = (days ? '~LectoraPermCookie' : '~LectoraTempCookie' ) + ( title ? ':' + Encode(title) : '' ) + ':';
    var nameEQ = delim + Encode(name) + "="
    var i
    
    var ca = document.cookie.split(';')
  
    for(i=0;i<ca.length;i++) 
    {
      var c = ca[i]
      for( var j=0;j<c.length;j++)
      {
        if( c.charAt(j) != ' ' )
          break
      }
      c = c.substring(j)
      if( c.indexOf(myCookie) == 0 )
      {
        var varIdx = c.indexOf(nameEQ) 
        if( varIdx >= 0 )
        {
          var val=c.substring(varIdx+nameEQ.length)
          val = val.substring(0, val.indexOf(delim))
          var valUn = Decode(val)
        
          if( titleMgr ) titleMgr.setVariable(name,valUn,days)
          
          if(!bHidden) trivLogMsg( 'readVariable for ' + name + ' = [' + valUn + ']', 1 )
		  return valUn
        }
      }
    }
  }
  
  if( titleMgr ) {
    defval = String( titleMgr.getVariable(name,defval,days) )
  }
  
  if(!bHidden) trivLogMsg( 'readVariable for ' + name + ' = [' + defval + ']', 1 )
  return defval
}

// Convert cookies from old style to new style.  This is because browsers store cookies
// differently (some in UTF8 and some in the native code page of the machine) and also
// because the latest version of the cookie spec dictates that only certain characters
// can be in the cookie value.  Tomcat 7 for example will blow up (500 error) if a request
// contains cookies with a value containing control characters.  Also, the 'expires' attr
// will be set on all perm cookies to 30 days from the time of conversion.  There is no
// good way to preserve the current expiration date of the cookies.
//
//    OLD STYLE: var name not encoded, var value encoded via UniEscape()
//    NEW STYLE: var name and value encode via Encode() (encodeURI())
function escapeDelim( s )
{
	s = s.toString();
	return s.replace(/%/g, "%25").replace(/=/g, "%3D").replace(/\|/g, "%7C");
}

function unescapeDelim( s )
{
	s = s.toString();
	return s.replace(/%7C/g, delim).replace(/%3D/g, "=").replace(/%25/g, "%");
}

function convertCookies( title, bHidden )
{
		
	CleanOutCommas();
	
	if( !title )
		return;
		
	var arOldBaseNames = [ 'LectoraPermCookie', 'LectoraTempCookie' ]
	var reOldBaseNames = new RegExp('^(' + arOldBaseNames.join('|') + ')[^=]*')
	var reTitleName = new RegExp('^(Lectora.*Cookie' + (title?'_'+title:'') + ')([1-9])=(.*)')
	var arOldCookies = document.cookie.split(';')
	var oldCookies = {}
	var c = null
	var i = 0

	var date = new Date()
	date.setTime(date.getTime() + (30*24*60*60*1000))
	var expires = "; expires=" + date.toGMTString()
	date.setTime(0)
	var expired = "; expires=" + date.toGMTString()

	// Look for any cookies where the name begins with any of the names specified in
	// arOldBaseNames. Collect all related parts in an array as in:
	//
	//	{
	//		'LectoraPermCookie_title.html'  : [ 'valueOf1', 'valueOf2', 'valueOf3' ]
	//		'LectoraPermCookie_xyz.html'  : [ 'valueOf1' ]
	//		'LectoraPermCookie_foobar.html'  : [ 'valueOf1', 'valueOf2' ]
	//	}
	
	for ( i = 0; i < arOldCookies.length; i++ )
	{
		c = arOldCookies[i];
        for( var j=0;j<c.length;j++)
        {
            if( c.charAt(j) != ' ' )
                break
        }
        c = c.substring(j)

		var matches = reTitleName.exec( c );

		if ( matches != null && matches.length == 4 )
		{
			var ocbn = matches[1] // old cookie base name
			var oci = parseInt(matches[2]) // old cookie index
			var ocv = matches[3] // old cookie value

			if ( !oldCookies[ocbn] ) oldCookies[ocbn] = []
			oldCookies[ocbn][oci] = ocv

			if ( window.console && console.log ) console.log('convertCookies: found old cookie ['+ (ocbn + oci) + '] length=[' + ocv.length + ']')

			document.cookie = ocbn + oci + '=' + expired + '; path=/'
		}
	}



	// oldCookies now contains an attr for each cookie base name (i.e LectoraPermCookie_title.html).
	// Loop through each one, get the combined value, then split out each variable and process
	// one at a time saving cookies in the new format along the way.

	for ( var baseName in oldCookies )
	{
		if ( typeof baseName == 'function' )
			continue

		// Combine all cookies with the same base name (i.e. LectoraPermCookie_title.html1,
		// LectoraPermCookie_title.html2, LectoraPermCookie_title.html3, etc).

		var oldCombinedValue = ''

		for ( i = 1; i < oldCookies[baseName].length; i++ )
		{
			if ( typeof oldCookies[baseName][i] != 'string' )
				continue

			oldCombinedValue += oldCookies[baseName][i]
		}

		var isPerm = ( baseName.indexOf('LectoraPerm') == 0 )
		var nci = 1
		var ncv = delim
		var vars = oldCombinedValue.split('|')

		if ( window.console && console.log ) console.log('convertCookies: process old cookie ['+ baseName + '] parts(max)=[' + (oldCookies[baseName].length-1) + '] length=[' + oldCombinedValue.length + '] vars=[' + vars.length + ']')

		if(bTrivUseLocal)
		{
			var keyName =  getWebStorageKey(title);
			var data = ""
			for ( i = 0; i < vars.length; i++ )
			{
				var oldNvPair = vars[i]
				var oldParts = oldNvPair.split('=')
				
				if( oldParts.length == 2 )
				{
					var newName = escapeDelim(oldParts[0])
					var newValue = escapeDelim(UniUnescape(oldParts[1]))
					var newNvPair = newName + '=' + newValue + delim
					data += newNvPair;
				}
				
			}
			if( baseName.indexOf( arOldBaseNames[0] ) == 0 )
				localStorage.setItem(keyName,data);
			else if( baseName.indexOf( arOldBaseNames[1] ) == 0 )
				sessionStorage.setItem(keyName,data);
				
			if ( window.console && console.log ) console.log('convertCookies "' + baseName + '" to Web Storage: saving ['+ keyName + ']')
			if(!bHidden) trivLogMsg('convertCookies "' + baseName + '" to Web Storage' + keyName + ' with length ')
		}
		else
		{
		
			for ( i = 0; i < vars.length; i++ )
			{
				var oldNvPair = vars[i]
				var oldParts = oldNvPair.split('=')

				if ( oldParts.length == 2 )
				{
					var newName = Encode(oldParts[0])
					var newValue = Encode(UniUnescape(oldParts[1]))
					var newNvPair = newName + '=' + newValue + delim

					if ( newNvPair.length >= 4000 )
					{
						if ( window.console && console.log ) console.log('convertCookies: VAR too large to process ['+ newName + '] length=[' + newNvPair.length + '] ++++++++++++++++++++++++++++++')
						if(!bHidden) trivLogMsg('convertCookies found VAR [' + newName + '] too large to process - length is ' + newNvPair.length)
						continue
					}

					if ( ncv.length + newNvPair.length < 4000 )
					{
						ncv += newNvPair
						continue
					}
					var newBaseName = baseName.replace('_', ':');
					document.cookie = '~' + newBaseName + ':' + nci + '=' + ncv + (isPerm ? expires : '') + '; path=/'

					if ( window.console && console.log ) console.log('convertCookies: saving ['+ ('~' + baseName + nci) + '] length=[' + ncv.length + ']')
					if(!bHidden) trivLogMsg('convertCookies saving cookie ' + ('~' + baseName + nci) + ' with length ' + ncv.length)

					nci++
					ncv = delim + newNvPair
				}
			}

			if ( ncv.length > 1 )
			{
				var newBaseName = baseName.replace('_', ':');
				document.cookie = '~' + newBaseName + ':' + nci + '=' + ncv + (isPerm ? expires : '') + '; path=/'

				if ( window.console && console.log ) console.log('convertCookies: saving ['+ ('~' + baseName + nci) + '] length=[' + ncv.length + ']')
				if(!bHidden) trivLogMsg('convertCookies saving cookie ' + ('~' + baseName + nci) + ' with length ' + ncv.length)
			}
		}
	}
}

function UpgradeStorageVersion()
{
	//Upgrade from version 1 to version 2;
	if( bTrivUseLocal )
	{
		var arrStorage = [localStorage,sessionStorage];
		for( var j=0; j<arrStorage.length; j++ )
		{
			var keysToRemove = [];
			var newKeyValues = [];
			var store = arrStorage[j]; 
			for (var i = 0; i < store.length; i++){
				var key = store.key(i);
				if( key.indexOf('Lectora:') == 0 || key == "Lectora" ) //if version 1 of storage data (version 1 had no number)
				{
					var data = store.getItem(key);
					if( data.indexOf( ',' ) != -1 )
					{
						keysToRemove.push(key);
						var newKey = key.replace(/Lectora/g, 'Lectora' + storageVer);
						var newData = data.replace(/\|/g, '%7C');
						newData = newData.replace(/,/g, delim);
						newData = newData.replace(/%2C/g, ',');
						newKeyValues.push({key:newKey, value:newData});
					}
				}
			}
			//add the new keys
			for( var i=0; i<newKeyValues.length; i++ ){
				store.setItem( newKeyValues[i].key, newKeyValues[i].value );
			}
			//remove the old keys
			for( var i=0; i<keysToRemove.length; i++ ){
				store.removeItem(keysToRemove[i]);
			}
		}
	}
}

//This function will change commas to pipes in cookies. Cookies had commas used as 
//delimiters starting from version 11.3, but should now be pipes starting at 11.3.2
function CleanOutCommas()
{
	var arrCookieNames = ["~LectoraPermCookie", "~LectoraTempCookie"];
	var arrCookies = document.cookie.split(';');
	
	var date = new Date()
	date.setTime(date.getTime() + (30*24*60*60*1000))
	var expires = "; expires=" + date.toGMTString()
	date.setTime(0)
	var expired = "; expires=" + date.toGMTString()
	
	for( var i=0; i<arrCookies.length; i++)
	{
		var currCookie = arrCookies[i];
		var cookieToDelete = currCookie;
		
		//trim spaces at beginning
		for( var j=0;j<currCookie.length;j++)
        {
            if( currCookie.charAt(j) != ' ' )
                break
        }
        currCookie = currCookie.substring(j);
		
		if( (currCookie.indexOf(arrCookieNames[0]) == 0 ||
			currCookie.indexOf(arrCookieNames[1]) == 0) && 
			currCookie.indexOf(',') != -1 )
		{
			document.cookie = cookieToDelete + expired + '; path=/';
			currCookie = currCookie.replace(/,/g, delim);
			document.cookie = currCookie + expires + '; path=/';
		}
	}
}
	
function cleanupTitle(title)
{
    if ( window.name.indexOf( 'Trivantis_' ) == -1 )
	{
		var c = null
		var m = null
		var props = "; path=/"
		var date = new Date()
		date.setTime(date.getTime() + (-1*24*60*60*1000))
		props += "; expires=" + date.toGMTString()
		var myCookie = '~LectoraTempCookie' + ( title ? ':' + Encode(title) : '' )
		var reBaseName = new RegExp('^(' + myCookie + '[^=]*)')
		var arCookies = document.cookie.split(';')

		for ( var i = 0; i < arCookies.length; i++ )
		{
			c = arCookies[i]
            for( var j=0;j<c.length;j++)
            {
                if( c.charAt(j) != ' ' )
                break
            }
            c = c.substring(j)
			m = reBaseName.exec(c)

			if ( m && m.length == 2 )
				document.cookie = m[1] + '=' + props
		}

		
		if(bTrivUseLocal)
		{
			var key = getWebStorageKey(title);
			try{
				window.sessionStorage.removeItem(key);
			}
			catch( e ){
			}
		}		
		
		if ( title != title.toLowerCase() )
			cleanupTitle(title.toLowerCase())

		return 1
	}

	return 0
}

// Variable Object
function Variable(name,defval,f,cm,frame,days,title, bHidden) {
  this.origAICC = false
  this.bSCORM = false
  this.of=f
  this.f=f
  this.eTS=null
  this.tV=null
  this.aiccframe=frame
  this.aiccgroup=null
  this.aicccore=false
  this.exp=days
  if( defval ) this.defVal = defval.toString();
  else this.defVal=null;
  this.cm=0
  this.title=title
  this.lastUT = null
  if(!bHidden)
  {
	this.bHidden = false;
  }
  else
  {
	this.bHidden=bHidden;
  }
  if( cm ) {
    this.cm = -1 * cm
    if(name=='CM_Course_ID')this.name='TrivantisCourse'
    else if(name=='CM_Course_Name')this.name='TrivantisCourseName'
    else if(name=='CM_Student_ID')this.name='TrivantisLogin'
    else if(name=='CM_Student_Name')this.name='TrivantisLoginName'
    else {
      this.name=name
      this.cm = cm
    }
  }
  else if( frame ) {
    var underPos = name.indexOf('AICC_')
    if( underPos == 0 ) {
      this.origAICC = true
      this.name=name.substring(5)
      if( frame == 'scorm' || frame == 'tincan') {
        this.bSCORM = true
        this.aiccgroup = 'cmi'
        this.name = this.name.toLowerCase()
        var core_check = this.name.substring(0,5)
        if( core_check == 'core_' ) this.name = this.name.substring(5)
        if(this.name=='lesson') this.name='cmi.suspend_data'
        else if(this.name=='vendor') this.name='cmi.launch_data'
        else if(this.name=='time') this.name='cmi.core.total_time'
        else if(this.name=='score') this.name='cmi.core.score.raw'
        else if(this.name=='student_language') this.name='cmi.student_preference.language'
        else this.name = 'cmi.core.' + this.name
      }
      else if( frame == 'scorm2004' ) {
        this.bSCORM = true
        this.aiccgroup = 'cmi'
        this.name = this.name.toLowerCase()
        var core_check = this.name.substring(0,5)
        if( core_check == 'core_' ) this.name = this.name.substring(5)
        if(this.name=='lesson') this.name='cmi.suspend_data'
        else if(this.name=='vendor') this.name='cmi.launch_data'
        else if(this.name=='time') this.name='cmi.total_time'
        else if(this.name=='score') this.name='cmi.score.raw'
        else if(this.name=='course_id')this.name='cmi.evaluation.course_id'
        else if(this.name=='lesson_id')this.name='cmi.core.lesson_id'
        else if(this.name=='student_id')this.name='cmi.learner_id'
        else if(this.name=='student_name')this.name='cmi.learner_name'
        else if(this.name=='lesson_location')this.name='cmi.location'
        else if(this.name=='lesson_status')this.name='cmi.success_status'
        else this.name = 'cmi.' + this.name
      }
      else if(this.name=='Core_Lesson') {
        this.aiccgroup='[CORE_LESSON]'
      }
      else if(this.name=='Core_Vendor') {
        this.aiccgroup='[CORE_VENDOR]'
      }
      else if(this.name=='Course_ID') {
        this.aiccgroup='[EVALUATION]'
      }
      else {
        this.aiccgroup='[CORE]'
        this.aicccore=true
      }
      if( !this.bSCORM ) this.update()
    }
    else {
      if( frame == 'scorm' || frame == 'scorm2004' || frame == 'tincan' ) this.bSCORM = true
      if( name.indexOf('CMI_Core') == 0 ) {
        this.origAICC = true
        this.aiccgroup='cmi'
        if( name == 'CMI_Core_Entry' ) {
          this.name='cmi.core.entry'
          this.update()
        }
        else {
          this.name='cmi.core.exit'
          this.value=this.defVal
        }
      }
      else if ( name == 'CMI_Completion_Status' ) {
        if( frame == 'scorm2004' ) this.bSCORM = true
        this.origAICC = true
        this.aiccgroup='cmi'
        this.name='cmi.completion_status'
        this.update()
      }
      else {
        this.name = name
      }
    }
  }
  else {
    this.name=name;
  }
  if( this.f == 4 ) this.uDT()
}

function VarUpdateValue() {
  var now = new Date().getTime()
  if( this.lastUT >= now - 500 ) return;
  else this.lastUT = now;
  
  if( this.cm ) {
    if( this.cm < 0 ) {
      this.defVal=readCookie(this.name,this.defVal)
      this.cm *= -1
    }
    var titleMgr = getTitleMgrHandle();
    if( titleMgr ) {
      this.value = String(titleMgr.getVariable(this.name,this.defVal,this.exp));
    }
    else this.value=this.defVal
  }
  else if( this.aiccframe ) {
    var titleMgr = getTitleMgrHandle();
    if( this.origAICC ) {
      if( this.bSCORM ) {
        if( this.name=='cmi.evaluation.course_id' ) this.value=this.defVal
        else if( this.name=='cmi.core.lesson_id' ) this.value=this.defVal
        else if( this.name!='cmi.core.exit' && this.name != 'cmi.exit' ) {
          var lmsVal = LMSGetValue( this.name );
          if( lmsVal == null )
            lmsVal = this.defVal;
          this.value = String( lmsVal );
        }
        if( titleMgr ) {
          titleMgr.setVariable(this.name,Encode(this.value),this.exp)
          if( this.name=='cmi.learner_id' ) titleMgr.setVariable('cmi.core.student_id',this.value,this.exp)
          if( this.name=='cmi.learner_name' ) titleMgr.setVariable('cmi.core.student_name',this.value,this.exp)
          if( this.name=='cmi.core.total_time' || this.name=='cmi.total_time' ) this.value = UpdateSCORMTotalTime( this.value )
        }
      }
      else if(this.name=='Core_Lesson') {
        this.value=getParam(this.aiccgroup)
      }
      else if(this.name=='Core_Vendor') {
        this.value=getParam(this.aiccgroup)
      }
      else if(this.name=='Course_ID') {
        this.value=getParam(this.name)
      }
      else {
        this.value=getParam(this.name)
      }
    }
    else {
      if( this.bSCORM ) {
        this.value=this.defVal
        if( titleMgr && titleMgr.findVariable( this.name ) != -1 ){
            this.value = String(titleMgr.getVariable(this.name,this.defVal,this.exp));
        } else {
          var data = String( GetSuspendData() )
          if ( !this.bHidden ) trivLogMsg('cmi.suspend_data (unescaped) is currently [' + Decode(data) + ']')
          if( data == '' ) {
            if( titleMgr ) titleMgr.setVariable(this.name,this.value,this.exp)
          }
          else {
            var ca = data.split(';')
            for(var i=0;i<ca.length;i++) {
              var c = ca[i];
              if( c.indexOf('=') >= 0 ) {
                ce = c.split('=')
                if( this.name == Decode(ce[0]) ) this.value = Decode(ce[1])
                if( titleMgr ) titleMgr.setVariable(Decode(ce[0]),Decode(ce[1]),this.exp)
              }
            }
          }
        }
      }
      else {
        if( titleMgr ) {
          this.value = String(titleMgr.getVariable(this.name,this.defVal,this.exp));
        }
        else this.value = this.defVal
      }
    }
  }
  else if( this.f > 0 ) {
    this.uDT()
  }
  else {
    var val = readVariable(this.name,this.defVal,this.exp,this.title, this.bHidden)
    var subval = val ? val.substr( 0, 7 ) : null
    if( subval == "~~f=1~~" ) {
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.f = 1
      this.uDTV()
    }
    else if( subval == "~~f=2~~" ) {
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.f = 2
      this.uDTV()
    }
    else if( subval == "~~f=4~~" ) {
      var now = new Date()
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.eTS = now.getTime() - this.tV
      this.f = 4
      this.uDTV()
    }
    else this.value=val
  }
  this.value = EncodeNull( this.value )
}

function VarSave() {
  if(this.cm) {
    var titleMgr = getTitleMgrHandle();
    if( titleMgr ) titleMgr.setVariable(this.name,this.value,this.exp)
  }
  else if(this.aiccframe){
    var titleMgr = getTitleMgrHandle();
    if( this.bSCORM ) {
	  var lmsVal = this.value;
	  if( lmsVal == '~~~null~~~' )
	    lmsVal = null;
      if( this.name == 'cmi.core.total_time' || this.name == 'cmi.total_time' ) {
        if( this.aiccframe == 'scorm' || this.aiccframe == 'tincan' ) {
          LMSSetValue( 'cmi.core.session_time', lmsVal )
          if( titleMgr ) titleMgr.setVariable('cmi.core.session_time',this.value,this.exp)
        }
        else {
          LMSSetValue( 'cmi.session_time', lmsVal )
          if( titleMgr ) titleMgr.setVariable('cmi.session_time',this.value,this.exp)
        }
      }
      else {
        if( titleMgr ) titleMgr.setVariable(this.name,this.value,this.exp)
        if( this.aiccgroup ) {
          LMSSetValue( this.name, lmsVal )
          if( this.name == 'cmi.score.raw' ){
            var scaled = this.value / 100
            LMSSetValue( 'cmi.score.scaled', scaled )
            LMSCommit( "" );
          } 
          else if( this.name == 'cmi.core.score.raw'     ||
                   this.name == 'cmi.core.lesson_status' ||
                   this.name == 'cmi.success_status' ){
            LMSCommit( "" );
          }
        }
        else {
          var newData = Encode(this.name) + "=" + Encode(this.value) + ';'
          var bErr = false;
          var data = String( GetSuspendData() )
          if( data != '' ) {
            var ca = data.split(';');
            for(var i=0;i<ca.length;i++) {
              var c = ca[i];
              if (c != '' && c.indexOf(Encode(this.name) + "=") != 0) {   
                newData = newData + c + ';'
              }
            }
          }
          
          SetSuspendData( newData )
          if(!this.bHidden) trivLogMsg('cmi.suspend_data (unescaped) is now set to [' + Decode(newData) + ']')
          var chkdata = String( GetSuspendData() )
          if( chkdata.length < newData.length ) {
            bErr = true;
          }
          
          if( bErr && bDisplayErr ) {
            var errMsg = 'Some of the persistent data was not able to be stored';
            trivLogMsg( errMsg, 2 )
            alert( errMsg )
          }
        }
      }
    }
    else {
      if(this.aicccore) putParam(this.aiccgroup,this.name+'='+this.value,this.aiccframe)
      else if( this.aiccgroup ) putParam(this.aiccgroup,this.value,this.aiccframe)
      else {
        if( titleMgr ) titleMgr.setVariable(this.name,this.value,this.exp)
        saveVariable(this.name,this.value,this.exp,this.title,this.aiccframe, this.bHidden)
      }
    }
  }
  else{
    if( this.f != 0 && this.tV >= 0 ) {
      if( this.f == 4 ) saveVariable(this.name,"~~f=4~~"+this.tV+'#'+this.value,this.exp,this.title,this.aiccframe, this.bHidden)
      else if ( this.f == 2 ) saveVariable(this.name,"~~f=2~~"+this.tV+'#'+this.value,this.exp,this.title,this.aiccframe, this.bHidden)
      else if ( this.f == 1 ) saveVariable(this.name,"~~f=1~~"+this.tV+'#'+this.value,this.exp,this.title,this.aiccframe, this.bHidden)
    } 
    this.value = EncodeNull( this.value )
    saveVariable(this.name,this.value,this.exp,this.title,this.aiccframe, this.bHidden)
  }
}

function VarSet(setVal) {
  if (window.TrivSetFlypaperVariable) TrivSetFlypaperVariable(this.name,setVal);
  this.value = EncodeNull( setVal )
  this.f = 0
  this.eTS = null
  this.tV = null
  this.save() 
}

function VarSetVar(setVar) {
  if( setVar.f > 0 ) setVar.uDT()
  else setVar.update()
  this.value = setVar.value
  this.f = setVar.f
  if( setVar.f == 1 || setVar.f == 2 )
    this.of = 8
  this.eTS = setVar.eTS
  this.tV = setVar.tV
  this.save() 
}

function VarAdd(addVal) {
  this.update()
  if ( this.f > 0 && !isNaN( parseFloat( addVal ) )) { 
    this.tV += CalcTD( this.f, addVal )
    this.uDTV()             
  } 
  else if( this.value == "~~~null~~~" ) {
    this.f = 0
    if( addVal != null && addVal != "" ) this.value = addVal
  }
  else {
    this.f = 0
	
	if( addVal === 0 ) 
		addVal = addVal.toString();
	
    if( addVal != null && addVal != "" ) {
      if(!isNaN(this.value)&&!isNaN(addVal)&&!isNaN( parseFloat(addVal))&&!isNaN( parseFloat(this.value)) ) {
        var val=parseFloat(this.value)+parseFloat(addVal)
        var myVal = this.value.toString();
        if( addVal.indexOf( "." ) != -1 && myVal.indexOf( "." ) != -1 )
            val = (parseInt(val*100000000,10))/100000000
        this.value=val.toString()
      }
      else if( addVal != "~~~null~~~") this.value+=addVal;
    }
  }
  this.save()
}

function VarAddVar(addVar) {
  if( addVar.f > 0 ) {
    addVar.uDT()
    if( this.f > 0 ) {
      this.tV += addVar.tV
      if( addVar.f == 1 ) this.f = 1
        this.uDTV()
    }
    else this.add( addVar.value )
  }
  else {
    addVar.update()
    this.add( addVar.value )
  }
}

function VarSub(subVal) {
  this.update()
  if ( this.f > 0 && !isNaN( subVal )) {
    this.tV -= CalcTD( this.f, subVal )
    this.uDTV()            
  }
  else if( this.value == "~~~null~~~" ) {
    this.f = 0
    if( !isNaN(subVal)&&!isNaN(parseFloat(subVal) ) ) {
      var val=this.value=parseFloat("-"+subVal)
      this.value=val.toString()
    }
  }
  else {
    this.f = 0
    if( subVal != null && subVal != "" ) {
      if(!isNaN(this.value)&&!isNaN(subVal)&&!isNaN( parseFloat(subVal))&&!isNaN( parseFloat(this.value)) ) {
        var val=parseFloat(this.value)-parseFloat(subVal)
        var myVal = this.value.toString();
        if( subVal.indexOf( "." ) != -1 && myVal.indexOf( "." ) != -1 )
            val = (parseInt(val*100000000,10))/100000000
        this.value=val.toString()
      }    
	  else{
	    var re = new RegExp(subVal, "g");
		this.value=this.value.replace( re, "");
	  }
    }
  }
  this.save()
}

function VarSubVar(subVar) {
  if( subVar.f > 0 ) {
    subVar.uDT()
    if( this.f > 0 ) {
      this.tV -= subVar.tV
      if( subVar.f == 1 ) this.f = 1
      this.uDTV()
    }
    else this.sub( subVar.value )
  }
  else {
    subVar.update()
    this.sub( subVar.value )
  }
}

function VarMult(multVal) {
  this.update()
  if( this.value != "~~~null~~~" ) {
    if(!isNaN(this.value)&&!isNaN(multVal)&&!isNaN( parseFloat(multVal))&&!isNaN( parseFloat(this.value)) ) {
      var val=parseFloat(this.value)*parseFloat(multVal)
      val = parseFloat(val.toFixed(6));
      var myVal = this.value.toString();
      multVal = multVal.toString();
      if( multVal.indexOf( "." ) != -1 && myVal.indexOf( "." ) != -1 )
        val = (parseInt(val*100000000,10))/100000000
      this.value=val.toString()
    }
    this.save()
  }
}

function VarDiv(divVal) {
  this.update()
  if( this.value != "~~~null~~~" ) {
    if(!isNaN(this.value)&&!isNaN(divVal)&&!isNaN( parseFloat(divVal))&&!isNaN( parseFloat(this.value)) ) {
      if( parseFloat(divVal) != 0 ) {
        var val=parseFloat(this.value)/parseFloat(divVal)
        val = parseFloat( val.toFixed(2) )
        var myVal = this.value.toString();
        divVal = divVal.toString();
        if( divVal.indexOf( "." ) != -1 && myVal.indexOf( "." ) != -1 )
          val = (parseInt(val*100000000,10))/100000000
        this.value=val.toString()
      }
    }
    this.save()
  }
}

function VarCont(strCont) {
  this.update()
  if( this.value == "~~~null~~~" || ( this.value == "" && this.value != 0 ) ) return 0
  var myVal = this.value.toString();
  var result=myVal.indexOf( strCont )
  return (result >= 0)
}

function VarEQ(strEquals) {
  this.update()
  return (this.value == strEquals)
}

function VarLT(strTest) {
  this.update()
  if( this.value == "~~~null~~~" || ( this.value == "" && this.value != 0 ) ) {
    if( strTest == "~~~null~~~" || strTest == "" ) return 0
    else return 1
  }
  if(isNaN(this.value)||isNaN(strTest))return this.value<strTest
  else return parseFloat(this.value)<parseFloat(strTest)
}

function VarGT(strTest) {
  this.update()
  if( this.value == "~~~null~~~" || ( this.value == "" && this.value != 0 ) ) {
    if( strTest == "~~~null~~~" || strTest == "" ) return 1
    else return 0
  }
  if(isNaN(this.value)||isNaN(strTest))return this.value>strTest
  else return parseFloat(this.value)>parseFloat(strTest)
}

function VarUDT() {
  var now = new Date()
  if( this.of == 8 ) {
    var val = readVariable(this.name,this.defVal,this.exp,this.title, this.bHidden)
    var subval = val ? val.substr( 0, 7 ) : null
    if( subval == "~~f=1~~" ) {
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.f = 1
      this.uDTV()
    }
    else if( subval == "~~f=2~~" ) {
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.f = 2
      this.uDTV()
    }
    else if( subval == "~~f=4~~" ) {
      var now = new Date()
      this.tV = parseInt( val.substr( 7, val.length-7 ), 10 )
      this.eTS = now.getTime() - this.tV
      this.f = 4
      this.uDTV()
    }
    else this.value=val
  }
  else if( this.f == 1 ) {
    this.tV = now.getTime()
    this.value = FormatDS( now )
  }
  else if( this.f == 2 ) {
    this.tV = now.getTime()
    this.value = FormatTS( now )
  }
  else if( this.of == 4 ) {
    // Only the original Elapsed Time variable gets updated
    var dT = 0
    if( this.eTS == null ) {
      var val = readVariable( this.name, "", this.exp, this.title, this.bHidden) 
      if( val ) {
        var hours = parseInt( val, 10 )
        var loc   = val.indexOf( ':' )
        val       = val.substring( loc + 1 )
        var mins  = parseInt( val, 10 )
        loc       = val.indexOf( ':' )
        val       = val.substring( loc + 1 )
        var secs  = parseInt( val, 10 )
        dT        = (((hours * 60) + mins) * 60 + secs) * 1000
      }
      this.eTS = now.getTime() - dT
    }
    this.tV = now.getTime() - this.eTS
    this.value = FormatETS( this.tV )
  }
  this.save()
 }

function VarUDTV() {
  if( this.f == 1 ) this.value = FormatDS( new Date( this.tV ))
  else if( this.f == 2 ) this.value = FormatTS( new Date( this.tV ))
  else if( this.f == 4 ) this.value = FormatETS( this.tV )
  this.save()
}

function VarGetValue() {
  if (window.FlypaperUpdateFunction) FlypaperUpdateFunction();
  this.update()
  return this.value
}

function VarMail() {
  this.update()
  ObjLayerActionGoTo( 'mailto:' + this.value )
}

function VarIsCorr(ans) {
  this.update()
  var val = this.value.toString();
  val = val.replace(/'/g, "\\'");
  if( val == ans )
    return true;
  else
    return false;
}

function VarIsCorrSub(ans,idx) {
  this.update()
  var answers = ans.split(",");
  if( this.value.indexOf( answers[idx] ) >= 0 )
    return true;
  else
    return false;
}

function VarIsAnsSub(idx) {
  this.update()
  var subtest = ',' + (idx+1) + '-';
  var test = ',' + this.value;
  if( test.indexOf( subtest ) >= 0 )
    return true;
  else
    return false;
}

function VarIsCorrFIB(ans,cs,aa) {
  this.update()
  var val = this.value.toString();
  if( !cs )
    val = val.toLowerCase();
  val = val.replace(/'/g, "\\'");
  
  var test = val.split("\n");
  var ret = false;
  for(var i=0;i<test.length;i++) 
  {
    var testAns = '"' + test[i] + '"';
    if( ans.indexOf(testAns) >= 0 )
    {
      if( aa )
        return true;
      else
        ret = true;
    }
    else if( !aa )
      return false;
  }
  return ret;
}

function VarIsCorrNE(ans) {
  this.update()
  
  if( this.value == "~~~null~~~" )
    return false;
    
  var val = this.value.toString();
  var evalAns = ans.replace(/##/g, val);
  evalAns = evalAns.replace(/,/g, '');
  var result = eval(evalAns);
  return result;
}

function VarIsCorrDD(ans) {
  this.update()
  var val = this.value.toString();
  val = val.toLowerCase();
  val = val.replace(/'/g, "\\'");
  var answers = ans.split(",");
  for(var i=0;i<answers.length;i++) {
	var subAns = answers[i].split("|");
	var subCorrect = false;
    for(var j=0; j<subAns.length; j++ )
	{
		if( val.indexOf( subAns[j].toLowerCase() ) >=0 )
			subCorrect = true;
	}
	if( !subCorrect )
		return false;
  }
  return true;
}

{ // Setup protpotypes
var p=Variable.prototype
p.save=VarSave
p.set=VarSet
p.add=VarAdd
p.sub=VarSub
p.mult=VarMult
p.div=VarDiv
p.setByVar=VarSetVar
p.addByVar=VarAddVar
p.subByVar=VarSubVar
p.contains=VarCont
p.equals=VarEQ
p.lessThan=VarLT
p.greaterThan=VarGT
p.uDT=VarUDT
p.uDTV=VarUDTV
p.update=VarUpdateValue
p.getValue=VarGetValue
p.mailTo=VarMail
p.isCorr=VarIsCorr
p.isCorrSub=VarIsCorrSub
p.isAnsSub=VarIsAnsSub
p.isCorrFIB=VarIsCorrFIB
p.isCorrNE=VarIsCorrNE
p.isCorrDD=VarIsCorrDD
p.betweenInc = VarBTIN
p.betweenExc = VarBTEX
}

function saveTestScore( varTestName, score, title, frame ) 
{
  saveVariable( varTestName, score, null, title, frame)
}

var titleMgrHandle = null;
function getTitleMgrHandle()
{
   if (titleMgrHandle == null)
   {
	try { 
		titleMgrHandle = getTitleMgr( window, 0 ); 
	} catch(error){ 
		titleMgrHandle = null }   
	}
   return titleMgrHandle;
}

function getTitleMgr( testWnd, level )
{
   if( !testWnd )
     return null
     if( testWnd.jTitleManager )
        return testWnd.jTitleManager;
     else if( testWnd.document.TitleMgr )
       return testWnd.document.TitleMgr;
     else
     {
       var target
       if( this.frameElement && this.frameElement.id && this.frameElement.id.indexOf('DLG_content') == 0 && parent.parent )
         target = eval( "parent.parent.titlemgrframe" )
       else
         target = eval( "parent.titlemgrframe" )
         
       if( !target )
          target = eval( "testWnd.parent.titlemgrframe" )
       if( target ) {
          if( target.jTitleManager )
            return target.jTitleManager;
          else
            return target.document.TitleMgr;
       } else {
          if( testWnd.name.indexOf( 'Trivantis_Dlg_' ) == 0 )
            return getTitleMgr( testWnd.parent, level+1 )
          else {
            if( testWnd.name.indexOf( 'Trivantis_' ) == 0 )
              return getTitleMgr( testWnd.opener, level+1 )
            else if( level < 2 )
              return getTitleMgr( testWnd.parent, level+1 )
          }
       }
     }
       
   return null
}

function readCookie(name,defval) {
  var nameEQ = Encode(name) + "="
  var ca = document.cookie.split(';')
  for(var i=0;i<ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length)
  }
  return defval
}

function afterProcessTest( score, name ) {
}

function UpdateSCORMTotalTime( currTime ) {
  var startDate = readVariable( 'TrivantisSCORMTimer', 0 )
  if ( startDate == 0 ) return currTime
  
  var currentDate = new Date().getTime();
  var elapsedMills = currentDate - startDate;
  var hours = parseInt( currTime, 10 )
  var loc   = currTime.indexOf( ':' )
  currTime  = currTime.substring( loc + 1 )
  var mins  = parseInt( currTime, 10 )
  loc       = currTime.indexOf( ':' )
  currTime  = currTime.substring( loc + 1 )
  var secs  = parseInt( currTime, 10 )
  loc       = currTime.indexOf( '.' )
  currTime  = currTime.substring( loc + 1 )
  var mills = parseInt( currTime, 10 ) * 100
  var total = (((hours * 60) + mins) * 60 + secs) * 1000 + mills
  return convertTotalMills( total + elapsedMills )
}

function EncodeNull( chkStr ) {
  if( chkStr == null ) return "~~~null~~~"
  else if( String( chkStr ) == "0" ) return 0
  else if ( chkStr == "" ) return "~~~null~~~"
  return chkStr
}

function VarBTIN(strLower,strUpper) {
  this.update()
  if (this.value == "~~~null~~~" || (this.value == "" && this.value != 0)) {
    if (strLower == "~~~null~~~" || strLower == "") return 1
    else if (strUpper == "~~~null~~~" || strUpper == "") return 1
    else return 0
  }
  if (isNaN(this.value) || isNaN(strLower) || isNaN(strUpper)) return (this.value >= strLower && this.value <= strUpper)
  else return (parseFloat(this.value) >= parseFloat(strLower) && parseFloat(this.value) <= parseFloat(strUpper))
}

function VarBTEX(strLower, strUpper) {
  this.update()
  if (this.value == "~~~null~~~" || (this.value == "" && this.value != 0)) {
    if (strLower == "~~~null~~~" || strLower == "") return 1
    else if (strUpper == "~~~null~~~" || strUpper == "") return 1
    else return 0
  }
  if (isNaN(this.value) || isNaN(strLower) || isNaN(strUpper)) return (this.value > strLower && this.value < strUpper)
  else return (parseFloat(this.value) > parseFloat(strLower) && parseFloat(this.value) < parseFloat(strUpper))
}

function GetSuspendData() {
  var data = String( LMSGetValue( 'cmi.suspend_data' ) )
  if( data.length > 2 ) {
    if( data.indexOf(";~;") == 0 )
      data = data.substring( 3 )
    else
      data = NewEncode( data )
  }
  return data
}

function SetSuspendData(data) {
  LMSSetValue( 'cmi.suspend_data', ";~;" + data )
}

function NewEncode( data ) {
  var newData = ""
  if( data != '' ) {
    var ca = data.split(';');
    for(var i=0;i<ca.length;i++) {
      var c = ca[i];
      if( c != '' ) {
        var nv = c.split('=')
        if( nv.length == 2 )   
          newData = newData + Encode(nv[0]) + "=" + Encode(UniUnescape(nv[1])) + ";"
      }
    }
  }
  return( newData )
}