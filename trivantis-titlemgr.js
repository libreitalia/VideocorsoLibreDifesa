/**************************************************
Trivantis (http://www.trivantis.com)
**************************************************/

var jTitleManager = new JSTitleMgr();

var TINCAN = 2013;

var UNK = -1;
var TF = 1;
var MC = 2;
var SA = 3;
var ES = 4;
var FB = 5;
var MT = 6;
var DD = 7;
var IN = 8;
var HS = 9;
var LK = 10;
var OR = 11;
var LT = 12;
var NE = 13;
var MR = 14;
//var RS = 15;

var TRN = 0;
var TRE = 1;
var TRS = 2;

var EQU = 1;
var BT_INC = 2;
var BT_EXC = 3;
var GRT = 4;
var GTE = 5;
var LST = 6;
var LSTE = 7;
var NEQU = 8;

function JSTitleMgr()
{
  this.arVars = new Array();
  this.arTests = new Array();
  this.bPerUpd = false;
  this.bIntActs = false;
  this.bCM = false;
  this.bIntTxt = false;
  this.bForceTF = true;
  this.bSCORM = false;
  this.bTinCan = false;
  this.bAICC = false;
  this.intCID = -1;
  this.intLID = -1;
  this.intSID = -1;
  this.intTIdx = -1;
  this.intQIdx = -1;
  this.cmVers = 0;
  this.scVers = 0;
  this.bAddTimeStamp = true;

  this.strAiccST = new String( "" );
  this.strAiccEM = new String( "" );
  this.strAiccSN = new String( "" );
  this.strAiccCR = new String( "" );
  this.strAiccCO = new String( "" );
  this.strCmBase = new String( "" );
  this.strRedir  = new String( "" );
}

var TMPr=JSTitleMgr.prototype

TMPr.setCoursemillParms = function( li, us, co, bs )
{
  this.strAiccST = new String( li );
  this.strAiccSN = new String( us );
  this.strAiccCO = new String( co );
  this.strCmBase = new String( bs );

  if( this.bCM && this.cmVers >= 2 )
    this.persistCMVars( false, us );
}

TMPr.persistCMVars = function( put, vn ) 
{ 
  var bSuccess = true;

  if( this.bCM && (this.bPerUpd || !put))
  {
    var urlDest = null;
    var locIdx = this.findVariable( "AICC_Lesson_Location" );

    if( locIdx < 0 )
    {
      if( put || this.cmVers < 2 )
      return false;
    }

    if( this.cmVers >= 2 )
      urlDest = this.strCmBase + "/persistvars.jsp";
    else
    {
      if( vn == "AICC_Lesson_Location" )
        urlDest = this.strCmBase + "/bookmark.jsp?currpage=" + this.arVars[locIdx].vv;
    }

    if( urlDest != null )
    {
      var props = new TrivStr("");
      var i;
      var varB  = new TrivStr("");

      if( put )
      {
        if( this.cmVers >= 2 )
        {
          props.addparm( "put", "yes" );

          for( i = 0; i < this.arVars.length; i++ )
          {
            if( this.arVars[i].bP )
              varB.add( this.arVars[i].vn + '=' + this.arVars[i].vv + '\r\n' );
          }

          if( locIdx >= 0 )
            props.addparm( "loc", this.arVars[locIdx].vv, true );

          props.addparm( "vars", varB.str, true );
        }
      }
      else
        props.addparm( "get", "yes" );

      props.str = props.str.replace(/\+/g, '%2B');
      var httpReq = getHTTP( urlDest, this.cmVers >= 2 ? 'POST' : 'GET', props.str );
      
      if(httpReq.status == 200)
      {
        var strRet = httpReq.responseText;

        while( strRet.length > 2 && strRet.indexOf( '\r\n' ) == 0 )
        {
          var temp = strRet.substring( 2 );
          strRet = temp;
        }
 
        var strErr;
        if( strRet.length > 3 )
          strErr = strRet.substring( 0, 3 );
        else
          strErr = strRet;

        if( strErr == "200" )
        {
          var loc = strRet.indexOf( '\r\n' );
          strErr = strRet.substring( loc + 2 );
          if( !put )
          {
            for( ; loc != -1 && loc < strRet.length; loc = end )
            {
              loc += 2;
              var end = strRet.indexOf( '\r\n', loc );
              var equalsPos = strRet.indexOf( '=', loc );
              if( equalsPos >= 0 )
              {
                name    = strRet.substring( loc, equalsPos );
                value   = strRet.substring( equalsPos+1, end );
                this.setVariable( name, value, "365" );
              }
            }
          }
        }
        else if( strErr == "550" || (strErr == "500" && this.cmVers < 2))
        {
          bSuccess = false;
          trivAlert( 'CM_SUBVARSERR', 'CourseMill', trivstrCMTO );
          parent.document.location.href=readCookie('TrivantisBase', '/');
        }
      }
    }
    if( put && bSuccess )
      this.bPerUpd = false;
  }

  return bSuccess;
}

TMPr.setUserInfo = function( us, em )
{
  this.strAiccSN = new String( us );
  this.strAiccEM = new String( em );
}

TMPr.findVariable = function( vn )
{
  var i;
  var vnl = vn.toLowerCase();
   
  for( i = 0; i < this.arVars.length; i++ )
  {
    var tsl = this.arVars[i].vn.toLowerCase();
    if( tsl == vnl ) return i;
  }
  return -1;
}

TMPr.getVariable = function( vn, dv, nd )
{
  var val = dv;
  var i = this.findVariable( vn );
  if( i >= 0 )
    return this.arVars[i].vv;
    
  return this.addVariable( vn, dv, nd );
}

TMPr.setVariable = function( vn, dv, nd )
{
  var i = this.findVariable( vn );
  
  if( this.intTIdx != -1 )
    this.arTests[this.intTIdx].SetInteraction( vn, this.intQIdx );
  
  if( i >= 0 )
  {
    if( this.arVars[i].bP && this.arVars[i].vv != dv )
      this.bPerUpd = true;

    this.arVars[i].vv = dv;
    if( vn == 'cmi.core.student_name' ) this.strAiccSN = new String( dv );

    if( this.bCM )
      this.persistCMVars( true, vn );

    return;
  }

  this.addVariable( vn, dv, nd );
}

TMPr.addVariable = function( vn, dv, nd ) 
{
  if( dv == null )
      dv = "";

  var nVar = new TrivVar();
  nVar.vn = vn;
  nVar.vv = dv;
  if( nd )
  {
    nVar.bP = true;
    this.bPerUpd = true;
  }
  this.arVars.push(nVar);

  if( vn == 'cmi.core.student_name' ) this.strAiccSN = new String( dv );

  if( this.bCM )
    this.persistCMVars( true, vn );

  return dv;
}

TMPr.loadTest = function( fn, tn, pn )
{
  var tIdx = this.getTIdx( tn, 1 );
  
  if( tIdx < 0 )
    return false;

  if( !this.arTests[tIdx].bLoaded )
  {
    var xfn = fn + '.xml';
    var httpReq = getHTTP( xfn, 'GET', null );
    if( httpReq.status != 200 && httpReq.status != 0 ) 
    {
      trivAlert( 'LOADTESTERR', tn, 'You must run this content from a web-based server ' + httpReq.statusText );
      return;
    }
	
    var nl;
	if(httpReq.responseXML == null){
		var parser = new DOMParser();  
		var xmlDoc = parser.parseFromString(httpReq.response, "application/xml");
		nl = xmlDoc.documentElement;
	} else {
		nl = httpReq.responseXML.documentElement;
	}
    if( !nl && window.ActiveXObject)
    {
      nl=new ActiveXObject("Microsoft.XMLDOM")
      nl.async="false"
      nl.load(xfn)
    }
    else
      nl.normalize();
      
    this.arTests[tIdx].strLoadedName = tn;
    this.arTests[tIdx].loadTestFile( nl );
  }
  this.intTIdx = -1;
  if( this.arTests[tIdx].bLoaded && this.bIntActs )
  {
    this.intQIdx = this.arTests[tIdx].StartInteractions( pn );
    if( this.intQIdx != -1 )
      this.intTIdx = tIdx;
  }
  return true;
}

TMPr.ResetTest = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, true );

  if( tIdx < 0 )
    return false;

  this.arTests[tIdx].ResetTest();
  return true;
}

TMPr.getTIdx = function( tn, add ) 
{
  var i;

  for( i = 0; i < this.arTests.length; i++ )
  {
    if( this.arTests[i].strLoadedName == tn ) return i;
  }

  if( !add ) return -1;
  
  var test = new TrivTest();
  this.arTests.push( test );
  return this.arTests.length - 1;
}

TMPr.startTestTimer = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return;

  if( this.arTests[tIdx].lStartTime == 0 )
    this.arTests[tIdx].lStartTime = new Date().getTime();
}

TMPr.stopTestTimer = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return; 

  if( this.arTests[tIdx].lStartTime > 0 )
  {
    var now = new Date();
    this.arTests[tIdx].lElapsedTime += now.getTime() - this.arTests[tIdx].lStartTime;
    this.arTests[tIdx].lStartTime    = 0;
  }
}

TMPr.getRandomPageNumber = function( tn, pn )
{
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return "";

  return this.arTests[tIdx].getRandomPageNumber( pn );
}

TMPr.getRandomSectPageNumber = function( tn, sect, pg ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return "";

  return this.arTests[tIdx].getRandomSectPageNumber( sect, pg );
}

TMPr.getPrevTestPage = function( tn, pg )
{
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  var pp = this.arTests[tIdx].getPrevTestPage( pg );
  if( pp != null )
  {
    if( pp.indexOf( '#' ) == 0 )
    {
      var test = pp.substring( 1 );
      tIdx = this.getTIdx( test, false );
      if( tIdx >= 0 && this.arTests[tIdx].bLoaded )
      {
        var pn = this.arTests[tIdx].iNumPages-1;
        pp = this.arTests[tIdx].arRTPages[pageNum].name;
      }
    }
    return pp;
  }
  else
    return this.processTest( tn );
}

TMPr.getNextTestPage = function( tn, pg ) 
{
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  var np = this.arTests[tIdx].getNextTestPage( pg );
  if( np != null )
  {
    if( np.indexOf( '#' ) == 0 )
    {
      var test = np.substring( 1 );
      np = this.getNextTestPage( test, "" );
    }
    return np;
  }
  else
    return null;
}

TMPr.getRandomPage = function( tn, sn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  return this.arTests[tIdx].getRandomPage( sn );
}

TMPr.cancelTest = function( tn )
{
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  var dest = this.arTests[tIdx].strFailPage;
  if( dest.indexOf( '#' ) == 0 )
  {
    var test = dest.substring( 1 );
    dest = this.getNextTestPage( test, "" );
  }
  return dest;
}

TMPr.processTest = function( tn ) 
{
  var tIdx = this.getTIdx( tn, false );
  var dest;

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  this.stopTestTimer( tn );
  this.arTests[tIdx].GradeTest( this.arVars );
  this.arTests[tIdx].strTestResult = this.arTests[tIdx].ProcessTest( this.bCM, this.strCmBase, this.strAiccSN, this.strAiccST, this.strAiccEM, this.strAiccCO, this.arVars );

  if( this.arTests[tIdx].strTestResult.indexOf( '#' ) == 0 )
  {
    var test = this.arTests[tIdx].strTestResult.substring( 1 );
    this.arTests[tIdx].strTestResult = this.getNextTestPage( test, "" );
  }

  if( this.bIntActs )
  {
    var CID;
    var LID;
    var SID;

    if( this.bSCORM )
    {
      if( this.intCID == -1 )
        this.intCID = this.findVariable( "cmi.core.course_id" );
      if( this.intLID == -1 )
        this.intLID = this.findVariable( "cmi.core.lesson_id" );
      if( this.intSID == -1 )
        this.intSID = this.findVariable( "cmi.core.student_id" );
    }
    else
    {
      if( this.intCID == -1 )
        this.intCID = this.findVariable( "COURSE_ID" );
      if( this.intLID == -1 )
        this.intLID = this.findVariable( "LESSON_ID" );
      if( this.intSID == -1 )
        this.intSID = this.findVariable( "STUDENT_ID" );
    }

    if( this.intCID != -1 )
      CID = this.arVars[this.intCID].vv;
    else
      CID = this.strAiccCO;

    if( this.intLID != -1 )
      LID = this.arVars[this.intLID].vv;
    else
      LID = "";

    if( this.intSID != -1 )
      SID = this.arVars[this.intSID].vv;
    else
      SID = "";

    var intStr = new TrivStr("");
    this.arTests[tIdx].HandleInteractions( intStr, CID, SID, LID, this.scVers, this.bIntTxt, this.bAddTimeStamp, this.bForceTF );
    if( this.bAICC )
      this.PutInteractions( intStr.str );
  }
  return this.arTests[tIdx].strTestResult;
}

TMPr.getStudentResults = function( tn ) 
{
  var tIdx = this.getTIdx( tn, false );
  var dest;

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;
  else
    return this.arTests[tIdx].strStudentRes;
}

TMPr.getTestName = function( tn ) 
{
  var tIdx = this.getTIdx( tn, false );
  var dest;

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;
  else
    return this.arTests[tIdx].strTestName;
}

TMPr.getProcessTestResult = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );
  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  return this.arTests[tIdx].strTestResult;
}

TMPr.getProcessTestResponse = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return null;

  return this.arTests[tIdx].strTestSubmit;
}

TMPr.GetTestScore = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return "0";

  var score = this.arTests[tIdx].GradeTest( this.arVars );
  if( !this.arTests[tIdx].bAutoG || score >= this.arTests[tIdx].iPassGrade || score == -1 )
    this.arTests[tIdx].strTestResult = this.arTests[tIdx].strPassPage;
  else
    this.arTests[tIdx].strTestResult = this.arTests[tIdx].strFailPage;
  return score;
}

TMPr.GetIfTestPassed = function( tn ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return false;

  var score = this.arTests[tIdx].GradeTest( this.arVars );
  if( !this.arTests[tIdx].bAutoG || score >= this.arTests[tIdx].iPassGrade || score == -1 )
    return true;
  else
    return false;
}

TMPr.GetQuestionList = function( tn )
{
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return "0";

  return this.arTests[tIdx].getQuestionList();  
}

TMPr.GetTestSectionScore = function( tn, sect ) 
{ 
  var tIdx = this.getTIdx( tn, false );

  if( tIdx < 0 || !this.arTests[tIdx].bLoaded )
    return "0";

  return this.arTests[tIdx].GradeTestSection( this.arVars, sect );
}

TMPr.getVariableNameAt = function( atVal )
{
	if( atVal >= 0 && atVal < this.arVars.length )
		return this.arVars[atVal].vn;

	return "";
}

TMPr.getVariableValueAt = function ( atVal )
{
	if(atVal >= 0 && atVal < this.arVars.length)
		return this.arVars[atVal].vv;

	return "";
}

TMPr.getNumVariables = function(){
	return this.arVars.length;
}

TMPr.isWeb20Enabled = function()
{
  return trivWeb20Popups;
}

function TrivVar()
{
  this.bP = false;
  this.vn = "";
  this.vv = "";
}

function TrivStr(a)
{
  this.str = a;
  this.count=0;
}

TrivStr.prototype.add = function( a )
{
  this.str += a;
}

TrivStr.prototype.addparm = function( parm, val, noEnc )
{
  if( this.str.length > 0 )
    this.str += "&"
  if( noEnc )
    this.str += parm + "=" + val;
  else
    this.str += encodeURI(parm) + "=" + encodeURI(val);
  this.count++;
}

function getNVStr( nl, tag, dv )
{
  var nv = nl.getElementsByTagName(tag)[0];
  
  if( nv && nv.firstChild ) return unJUN(nv.firstChild.data);
  else return dv;
}

function getNVInt( nl, tag, dv )
{
  return parseInt(getNVStr( nl, tag, dv ), 10);
}

function get_random( lim )
{
  return Math.round(Math.random()*lim);
}

function TrivTest()
{
  this.bLoaded = false;
  this.strLoadedName = "";
  this.strTestName = "";
  this.strResults = "";
  this.bAutoG = 0;
  this.iShowRes = 0;
  this.bShowScOnly = 0;
  this.iTestTime = 0;
  this.iNumberRandom = 0;
  this.iPassGrade = 0;
  this.bModeGet = 0;
  this.bIncVar = 0;
  this.bPromptSuc = 0;
  this.bPersist = 0;
  this.iStudScore = 0;
  this.lStartTime = 0;
  this.lElapsedTime = 0;
  this.strFailPage = "";
  this.strPassPage = "";
  this.strPrevPage = "";
  this.strAllowedTM = "";
  this.strElapsedTM = "";
  this.strTestSubmit = "";
  this.bSurvey = 0;
  this.arWork = new Array();
  this.arPicked = new Array();
  this.arLoadedPages = new Array();
  this.arSections = new Array();
  this.arRTPages = new Array();
  this.strStudentRes = "";
}

var TTPr=TrivTest.prototype

TTPr.loadTestFile = function( nl )
{
  this.bSurvey = getNVInt( nl, 'survey', this.bSurvey );
  this.bAutoG = getNVInt( nl, 'grade', this.bAutoG );
  this.iShowRes = getNVInt( nl, 'showresults', this.iShowRes );
  this.bShowScOnly = getNVInt( nl, 'scoreonly', this.bShowScOnly );
  this.bModeGet = getNVInt( nl, 'get', this.bModeGet );
  this.bIncVar = getNVInt( nl, 'incvar', this.bIncVar );
  this.bPromptSuc = getNVInt( nl, 'promptsuccess', this.bPromptSuc );
  this.bPersist = getNVInt( nl, 'persist', this.bPersist );
  this.strTestName = getNVStr( nl, 'name', this.strTestName );
  this.strResults = getNVStr( nl, 'submitto', this.strResults );
  this.iTestTime = getNVInt( nl, 'testtime', this.iTestTime );
  this.iNumberRandom = getNVInt( nl, 'numrandom', this.iNumberRandom );
  this.iPassGrade = getNVInt( nl, 'passinggrade', this.iPassGrade );
  this.strFailPage = getNVStr( nl, 'cancelfail', this.strFailPage );
  this.strPassPage = getNVStr( nl, 'passdone', this.strPassPage );
  this.strPrevPage = getNVStr( nl, 'prevpage', this.strPrevPage );
  this.bGDocs = getNVInt( nl, 'gdocs', this.bGDocs );
  var arEle = nl.getElementsByTagName('section');
  var i, j, k;
  
  for( i = 0; arEle && i < arEle.length; i++ )
  {
    var sect = new TrivTestSection();
    sect.load( arEle[i] );
    this.arSections.push( sect );
  }
  arEle = nl.getElementsByTagName('page');
  for( i = 0; arEle && i < arEle.length; i++ )
  {
    var page = new TrivTestPage();
    var bAdd = true
    page.load( UNK, arEle[i] );
    for( j = 0; j < this.arSections.length; j++ )
    {
      for( k = 0; k < this.arSections[j].arPages.length; k++ )
      {
        if( page.name == this.arSections[j].arPages[k].name )
        {
          bAdd = false;
          break;
        }
      }      
    }
    if( bAdd )
      this.arLoadedPages.push( page );
  }
  this.LoadPages();
  this.bLoaded = true;
}

TTPr.LoadPages = function()
{
  var i;
  var j;
  
  if( this.iNumberRandom > 0 )
  {
    if( this.arWork.length == 0 )
    {
      for( i = 0; i < this.arSections.length; i++ )
        this.arSections[i].LoadPages( this.arWork, false );

      for( i = 0; i < this.arLoadedPages.length; i++ )    
        this.arWork.push( this.arLoadedPages[i] );
    
      if( this.iNumberRandom > this.arWork.length ) this.iNumberRandom = this.arWork.length;
    }    
    
    for( i = 0; i < this.arWork.length; i++ )
    {
      if( this.arPicked.length < i + 1)
        this.arPicked.push( 0 );
      else
        this.arPicked[i] = 0;
    }
    
    for( i = 0; i < this.iNumberRandom; i++ )
    {
      var sel = get_random( this.arWork.length - i - 1);
      for( j = 0; j <= sel; j++ )
        if( this.arPicked[j] ) sel++;
      
      this.arPicked[sel] = 1;
      this.arRTPages.push( this.arWork[sel] );
    }
  }
  else
  {
    var tmpArr = new Array();
    
    for( i = 0; i < this.arLoadedPages.length; i++ )
      this.arRTPages[this.arLoadedPages[i].index] = this.arLoadedPages[i];
    
    for( i = 0; i < this.arSections.length; i++ )
      this.arSections[i].LoadPages( this.arRTPages, true );
    
    for( i = 0; i < this.arRTPages.length; i++ )
    {
      if( this.arRTPages[i] != null )
        tmpArr.push( this.arRTPages[i] );
    }
    this.arRTPages = tmpArr;
  }
}

TTPr.ResetTest = function() 
{ 
  this.arRTPages.length = 0;
  this.LoadPages();
  this.lElapsedTime = 0;
}

TTPr.GetTestScore = function( arVars ) 
{ 
  var maxScore = 0;
  var testScore = 0;
  var mScore = 0;
  var tScore = 0;
  var bCanScore = true;

  for( var idx = 0; idx < this.arRTPages.length; idx++ )
  {
    this.arRTPages[idx].gradeQs( arVars );

    if( !this.arRTPages[idx].isScoreable() )
      bCanScore = false;

    mScore = this.arRTPages[idx].getMaxScore();
    tScore = this.arRTPages[idx].getScore();

    maxScore += mScore;
    testScore += tScore;
  }

  if( bCanScore )
  {
    if( maxScore > 0 )
      this.iStudScore = parseInt(testScore * 100.0 / maxScore + 0.5, 10);
    else
      this.iStudScore = 100;
  }
  else
    this.iStudScore = -1;

  return this.iStudScore;
}

TTPr.getQuestionList = function()
{
  var ql = '';
  for( var idx = 0; idx < this.arRTPages.length; idx++ )
  {
    var ques = this.arRTPages[idx].getQuestionList();
    if( ques.length != 0 )
      ql += ques;
  }
  
  return ql;
}

TTPr.GradeTest = function( arVars ) { return this.GetTestScore( arVars ); }

TTPr.GradeTestSection = function( arVars, sect ) 
{ 
  var maxScore = 0;
  var testScore = 0;
  var mScore = 0;
  var tScore = 0;
  var sectScore = 0;
  var bCanScore = true;

  for( var idx = 0; idx < this.arRTPages.length; idx++ )
  {
    if( this.arRTPages[idx].iSectionId == sect )
    {
      this.arRTPages[idx].gradeQs( arVars );

      if( !this.arRTPages[idx].isScoreable() )
        bCanScore = false;

      mScore = this.arRTPages[idx].getMaxScore();
      tScore = this.arRTPages[idx].getScore();

      maxScore += mScore;
      testScore += tScore;
    }
  }

  if( bCanScore )
  {
    if( maxScore > 0 )
      sectScore = parseInt(testScore * 100 / maxScore, 10);
    else
      sectScore = 100;
  }
  else
    sectScore = -1;

  return sectScore;
}

TTPr.ProcessTest = function( bCM, strCMBase, us, id, em, cid, arVars ) 
{ 
  var strDest = null;
  var bSuccess = true;
  var secs;
  var test;
  var eT;

  if( this.iTestTime > 0 )
  {
    secs = this.iTestTime * 60;
    test = parseInt(secs/3600, 10);
    secs -= (test * 3600);
    
    this.strAllowedTM = "";
    
    if( test < 10 )
      this.strAllowedTM += "0";
    this.strAllowedTM += test + ":";
    test  = parseInt(secs/60, 10);
    secs -= (test * 60);
    
    if( test < 10 )
      this.strAllowedTM += "0";
    this.strAllowedTM += test + ":";

    if( secs < 10 )
      this.strAllowedTM += "0";
    this.strAllowedTM += secs;

    eT = parseInt(this.lElapsedTime / 1000, 10);

    if( eT > this.iTestTime * 60 || eT < 0)
      eT = this.iTestTime * 60;

    test = parseInt(eT/3600, 10);
    eT = eT - (test * 3600);
    this.strElapsedTM = "";
    if( test < 10 )
      this.strElapsedTM += "0";
    
    this.strElapsedTM += test + ":";

    test  = parseInt(eT/60, 10);
    eT -= (test * 60);
    if( test < 10 )
      this.strElapsedTM += "0";
    this.strElapsedTM += test + ":";

    if( eT < 10 )
      this.strElapsedTM += "0";
    this.strElapsedTM += eT;
  }

  window.resWind = null
  if( this.iShowRes )
  {
    this.strStudentRes = this.CreateTextResults( us, arVars );
  }
  
  if( bCM )
  {
    var urlDest = strCMBase + "/testresults.jsp";

    pl = new TrivStr("")
    if( us ) pl.addparm( "user", us );
    if( cid ) pl.addparm( "course", cid );

    this.CreateCGIResults( pl, arVars, true, false );
    pl.str = pl.str.replace(/\+/g, '%2B');

    var httpReq = getHTTP( urlDest, 'POST', pl.str );
      
    if(httpReq.status == 200)
    {
      var strRet = httpReq.responseText;

      while( strRet.length > 2 && strRet.indexOf( '\r\n' ) == 0 )
      {
        var temp = strRet.substring( 2 );
        strRet = temp;
      }

      var strErr;
      if( strRet.length > 3 )
        strErr = strRet.substring( 0, 3 );
      else
        strErr = strRet;

      var strMsg = "";
        
      if( strErr == "520" )
      {
        bSuccess = false;
        strMsg = trivstrERRNQ;
      }
      else if( strErr == "530" )
      {
        bSuccess = false;
        strMsg = trivstrERRAS;
      }
      else if( strErr == "430" )
      {
        bSuccess = false;
        strMsg = trivstrERRLI;
      }
      else if( strErr != "200" )
      {
        bSuccess = false;
        strMsg = trivstrERRST;
      }
 
      if( !bSuccess ) 
      {
        trivAlert( 'CM_HTTPERR', this.strLoadedName, strMsg );
      }
    }
  }
  
  // Determine if a variable macro
  strDest = this.getVariableMacroValue( this.strResults, arVars );

  if( bSuccess && strDest != null )
  {
    if ( strDest != null && strDest.length > 0 )
    {
      var pl = new TrivStr("")
      if( this.bGDocs )
	  {
		var i=strDest.indexOf("key=");
		if(i>=0){
			var str=strDest.substr(i+4);
			i=str.indexOf('#');
			if(i>=0)
				str=str.substr(0,i);
			pl.addparm( "key", str );
		}else{
			i=strDest.indexOf("formKey=");
			if(i>=0){
				var str=strDest.substr(i+8);
				i=str.indexOf('#');
				if(i>=0)
					str=str.substr(0,i);
				pl.addparm( "formKey", str );
			}
		}
		strDest="https://spreadsheets.google.com/formResponse";
	  }
      if( this.bGDocs ) pl.addparm( 'entry.'+(pl.count-1)+'.single', us );
	  else pl.addparm( "name", us );
      this.CreateCGIResults( pl, arVars, false, this.bGDocs );
      pl.str = pl.str.replace(/\+/g, '%2B');

	  if( this.bGDocs ){
	    if( is.ie ){
			var request = strDest + '?' + pl.str;
			var head = document.getElementsByTagName("head").item(0);
			var script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", request);
			head.appendChild(script);
		}else
			getHTTP( strDest, 'GET', pl.str );
		this.strTestSubmit = '';
		bSuccess = true;
	  }else{
	    var httpReq = getHTTP( strDest, ((this.bModeGet)?'GET':'POST'), pl.str );
        bSuccess = (httpReq.status == 200);
        this.strTestSubmit = httpReq.responseText;
	  }
      if( bSuccess && this.bPromptSuc )
      {
        var subTxt;
        if( !this.bSurvey )
            subTxt = trivstrTRSUB;
        else
            subTxt = trivstrSUSUB;
            
        if( !trivWeb20Popups )
        {
          if( window.resWind != null )
            window.resWind.alert( subTxt );
          else
            alert( subTxt );
        }
        else
        {
          var fn = null;
          if ( window.trivActFBCnt != 'undefined' && window.trivActFBCnt != null )
          { 
            window.trivActFBCnt++;
            fn =(function(){ window.trivActFBCnt--;});
          }
          trivAlert( 'SUBERR', this.strLoadedName, subTxt, fn );
        }
      }
    }
  }

  if( !this.bAutoG || this.iStudScore >= this.iPassGrade || this.iStudScore == -1 )
    return this.strPassPage;
  else
    return this.strFailPage;
}

TTPr.CreateTextResults = function( us, arVars ) 
{ 
  var idx;
  var qNum = 0;
  var txtRes = new TrivStr("")
  
  txtRes.add( this.strTestName + "<br /><br />");

  if( us != null && us.length > 0 )
    txtRes.add( trivstrSTUD + us + "<br /><br />" );

  if( this.iStudScore != -1 && this.bAutoG )
  {
    txtRes.add( trivstrSCORE + this.iStudScore + "%<br />" );
    if( this.iStudScore >= this.iPassGrade )
      txtRes.add( trivstrPASS );
    else
      txtRes.add( trivstrFAIL );
    txtRes.add( "<br /><br />" );
  }

  if( this.bShowScOnly == 0 )
  {
    for( idx = 0; idx < this.arRTPages.length; idx++ )
      qNum = this.arRTPages[idx].createTextResults( txtRes, qNum, this.bAutoG );
  }
  
  return txtRes.str;
}

TTPr.CreateCGIResults = function( pl, arVars, bCM, bGD ) 
{ 
  var idx;
  var qNum = 0;
  var svSID = -1;
  var numTFTot = 0;
  var numTFSect = 0;
  var numTFOnP = 0;
  var numMCTot = 0;
  var numMCSect = 0;
  var numMCOnP = 0;
  var corrTFTot = 0;
  var corrTFSect = 0;
  var corrTFOnP = 0;
  var corrMCTot = 0;
  var corrMCSect = 0;
  var corrMCOnP = 0;

  if( !bGD )
  {
	if( this.bSurvey )  
		pl.addparm( "SurveyName", this.strTestName);
	else
		pl.addparm( "TestName", this.strTestName);
  }
  for( idx = 0; idx < this.arRTPages.length; idx++ )
  {
    qNum = this.arRTPages[idx].createCGIResults( pl, qNum, bGD );

    if( svSID != this.arRTPages[idx].iSectionId )
    {
      if( svSID > 0 && this.bAutoG )
      {
        var strSSN = "TrueFalseSection" + svSID;
        var strSSV = corrTFSect + "/" + numTFSect;

        if( !bGD ) pl.addparm( strSSN, strSSV );

        strSSN  = "MultipleChoiceSection" + svSID;
        strSSV = corrMCSect + "/" + numMCSect;

        if( !bGD ) pl.addparm( strSSN, strSSV );
      }

      corrTFSect = 0;
      corrMCSect = 0;
      numTFSect = 0;
      numMCSect = 0;
      svSID = this.arRTPages[idx].iSectionId;
    }

    numTFOnP = this.arRTPages[idx].getNumTFQs();
    corrTFOnP = this.arRTPages[idx].getNumCorrectTFQs();
    numMCOnP = this.arRTPages[idx].getNumMCQs();
    corrMCOnP = this.arRTPages[idx].getNumCorrectMCQs();

    numTFTot += numTFOnP;
    numTFSect += numTFOnP;
    corrTFTot += corrTFOnP;
    corrTFSect += corrTFOnP;

    numMCTot += numMCOnP;
    numMCSect += numMCOnP;
    corrMCTot += corrMCOnP;
    corrMCSect += corrMCOnP;
  }

  if( !this.bShowScOnly && svSID > 0 && this.bAutoG )
  {
    var strSSN  = "TrueFalseSection" + svSID;
    var strSSV = corrTFSect + "/" + numTFSect;

    if( !bGD ) pl.addparm( strSSN, strSSV );

    strSSN = "MultipleChoiceSection" + svSID;
    strSSV = corrMCSect + "/" + numMCSect;

    if( !bGD ) pl.addparm( strSSN, strSSV );
  }

  if( this.iStudScore != -1 && this.bAutoG )
  {
    if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', this.iStudScore );
	else pl.addparm( "Score", this.iStudScore );
  }
  else if( bCM )
    pl.addparm( "Score", "-1" );

  if( this.bAutoG || bCM )
  {
    if( !bGD ) pl.addparm( "PassingGrade", this.iPassGrade );
    if( !bGD ) pl.addparm( "TrueFalse", corrTFTot + "/" + numTFTot );
    if( !bGD ) pl.addparm( "MultipleChoice", corrMCTot + "/" + numMCTot );
  }

  if( !bGD ) pl.addparm( "NumQuestions", qNum );

  if( this.strAllowedTM != "" )
  {
    if( !bGD ) pl.addparm( "AllowedTime", this.strAllowedTM );
    if( !bGD ) pl.addparm( "ElapsedTestTime", this.strElapsedTM );
  }

  if( this.bIncVar && !bGD )
  {
    for( idx = 0; idx < arVars.length; idx++ ) {
      if ((submitValue = this.getVariableSubmitValue( idx, arVars )) == "~~~null~~~") submitValue = trivstrNA
      pl.addparm( this.getVariableSubmitName( idx, arVars ), submitValue, true );
    }
  }
  return true;
}

TTPr.getRandomPageNumber = function( pg ) 
{ 
  var i;
  for( i = 0; i < this.arRTPages.length; i++ )
    if( this.arRTPages[i] && this.arRTPages[i].name == pg ) 
      return String(i + 1);
  
  return "";
}

TTPr.getRandomSectPageNumber = function( section, pg ) 
{ 
  var i;
  var pn = 0;
  
  for( i = 0; i < this.arRTPages.length; i++ )
  {
    if( this.arRTPages[i].iSectionId == section ) 
      pn++;
    if( this.arRTPages[i].name == pg ) 
      return String(pn);
  }
  
  return "";
}

TTPr.findTestPage = function( pg )
{
  var i;

  for( i = 0; i < this.arRTPages.length; i++ )
    if( this.arRTPages[i].name == pg ) 
      return i;

  return -1;
}

TTPr.getPrevTestPage = function( pg ) 
{
  var cp = this.findTestPage( pg );
  if( cp > 0 )
    cp--;
  else if( cp == 0 )
    return this.strPrevPage;
  else
    cp = this.arRTPages.length-1;

  if( cp >= 0 && cp < this.arRTPages.length )
    return this.arRTPages[cp].name;

  return null;
}

TTPr.getNextTestPage = function( pg ) 
{
  var cp = this.findTestPage( pg );
  if( cp > -1 && cp < this.arRTPages.length )
    cp++;
  else
    cp = 0;
    
  if( cp >= 0 && cp < this.arRTPages.length )
    return this.arRTPages[cp].name;

  return null;
}

TTPr.getRandomPage = function( pre ) 
{ 
  var i;
  var len = 0;
  
  if( pre ) len = pre.length;
  
  for( i = 0; i < this.arRTPages.length; i++ )
  {
    var tmp = this.arRTPages[i].name.substr( 0, len );
    if( tmp == pre ) 
      return this.arRTPages[i].name;
  }

  return null;

}

TTPr.getVariableSubmitName = function( idx, arVars ) 
{ 
  var vn = arVars[idx].vn;
  if( vn == null )
    vn = "";
    
  if( vn.length > 3 )
  {
    var pN  = vn.substring(0, 3 ).toLowerCase();
    if( pN == "var" )
      return vn.substring( 3 );
  }
  return vn;
}

TTPr.getVariableSubmitValue = function( idx, arVars ) 
{ 
  var vv = arVars[idx].vv;
  if( vv == null )
    vv = "";
    
  if( vv.length > 7 ) 
  {
    var pV = vv.substring(0, 7 );
    if( pV == "~~f=1~~" ||
        pV == "~~f=2~~" ||
        pV == "~~f=4~~" )
    {
      var slashPos = vv.indexOf( '|' );
      return vv.substring( slashPos + 1 );
    }
  }
  else if ( vv == "~~~null~~~" )
    return "";

  return vv;
}

TTPr.getVariableMacroValue = function( val, arVars ) 
{ 
  var strResult = val;
  var length    = val.length;

  if( length > 6 )
  {
    var strStart;
    var strMid;
    var strEnd;

    strStart = val.substring( 0, 4 ).toLowerCase();
    strMid   = val.substring( 4, length - 1 );
    strEnd   = val.substring( length-1 );

    if( strStart == "var(" &&
        strEnd == ")" )
    {
      var idx;

      for( idx = 0; idx < arVars.length; idx++ )
      {
        if( arVars[idx].vn == strMid )
          return this.getVariableSubmitValue( idx, arVars );
      }
    }
  }

  return strResult;
}

function TrivTestSection()
{
  this.iNumberRandom = 0;
  this.iSectionId = UNK;
  this.index = UNK;
  this.arPages = new Array();
  this.arPicked = new Array();
}

var TSPr=TrivTestSection.prototype

TSPr.load = function( nl )
{
  this.iSectionId = getNVInt( nl, 'id', this.iSectionId );
  this.iNumberRandom = getNVInt( nl, 'numrandom', this.iNumberRandom );
  this.index = getNVInt( nl, 'index', this.index );
  var arEle = nl.getElementsByTagName('page');
  for( var i=0; arEle && i < arEle.length; i++ )
  {
    var page = new TrivTestPage();
    page.load( this.iSectionId, arEle[i] );
    this.arPages.push( page );
  }
}

TSPr.LoadPages = function( arr, rand )
{
  var i;
  var j;
  var sIdx = this.index;
    
  if( this.iNumberRandom > 0 && rand )
  {
    if( this.iNumberRandom > this.arPages.length ) this.iNumberRandom = this.arPages.length;

    for( i = 0; i < this.arPages.length; i++ )
    {
      if( this.arPicked.length < i + 1)
        this.arPicked.push( 0 );
      else
        this.arPicked[i] = 0;
    }
    
    for( i = 0; i < this.iNumberRandom; i++ )
    {
      var sel = get_random( this.arPages.length - i - 1);
      for( j = 0; j <= sel; j++ )
        if( this.arPicked[j] ) sel++;
      
      this.arPicked[sel] = 1;
      arr[sIdx++] = this.arPages[sel];
    }
    
    for( i = 0; i < ( this.arPages.length - this.iNumberRandom ); i++ )
      arr[sIdx++] = null;
  }
  else
  {
    for( i = 0; i < this.arPages.length; i++ )
      arr[this.arPages[i].index] = this.arPages[i];
  }
}

function TrivTestPage()
{
  this.index = UNK;
  this.name = "";
  this.iSectionId = UNK;
  this.arQues = new Array();
}

var TPPr=TrivTestPage.prototype
TPPr.load = function( sid, nl )
{
  this.iSectionId = sid;
  this.index = getNVInt( nl, 'index', this.index );
  this.name = getNVStr( nl, 'name', this.name );
  var arEle = nl.getElementsByTagName('question');
  for( var i=0; arEle && i < arEle.length; i++ )
  {
    var quest = new TrivQuestion();
    quest.load( this.iSectionId, arEle[i] );
    this.arQues.push( quest );
  }
}

TPPr.gradeQs = function( arVars )
{
  for( var idx = 0; idx < this.arQues.length; idx++ )
    this.arQues[idx].gradeQs( arVars );
}

TPPr.getQuestionList = function()
{
  var ql = '';
  
  for( var idx = 0; idx < this.arQues.length; idx++ )
  {
    if( (this.arQues[idx].type == DD || this.arQues[idx].type == MT) && this.arQues[idx].bGradeInd )
    {
      var subidx;
      for( subidx = 0; subidx < this.arQues[idx].arCorrAns.length; subidx++ )
        ql += this.arQues[idx].id + '-' + (subidx+1) + ';';
    }
    else if( (this.arQues[idx].type == MC || this.arQues[idx].type == MR || this.arQues[idx].type == HS) && this.arQues[idx].bGradeInd )
    {
      var subidx;
      for( subidx = 0; subidx < this.arQues[idx].arChoices.length; subidx++ )
        ql += this.arQues[idx].id + '-' + (subidx+1) + ';';
    }
    else
      ql += this.arQues[idx].id + ';';
  }  
  return ql;
}

TPPr.getNumTFQs = function()
{
  var numQ = 0;
  
  for( var idx = 0; idx < this.arQues.length; idx++ )
    numQ += this.arQues[idx].getNumTFQs();

  return numQ;
}

TPPr.getNumCorrectTFQs = function()
{
  var idx;
  var numC = 0;

  for( idx = 0; idx < this.arQues.length; idx++ )
    numC += this.arQues[idx].getNumCorrectTFQs();

  return numC;
}

TPPr.getNumMCQs = function()
{
  var idx;
  var numQ = 0;

  for( idx = 0; idx < this.arQues.length; idx++ )
    numQ += this.arQues[idx].getNumMCQs();

  return numQ;
}

TPPr.getNumCorrectMCQs = function()
{
  var idx;
  var numC = 0;

  for( idx = 0; idx < this.arQues.length; idx++ )
    numC += this.arQues[idx].getNumCorrectMCQs();

  return numC;
}

TPPr.createTextResults = function( txtRes, bQN, bAG )
{
  for( var idx = 0; idx < this.arQues.length; idx++ )
    bQN = this.arQues[idx].createTextResults( txtRes, bQN, bAG );
    
  return bQN;
}

TPPr.getMaxScore = function()
{
  var ourMax = 0;

  for( var idx = 0; idx < this.arQues.length; idx++ )
    ourMax += this.arQues[idx].getMaxScore();
    
  return ourMax;
}

TPPr.getScore = function()
{
  var ourScore = 0;

  for( var idx = 0; idx < this.arQues.length; idx++ )
    ourScore += this.arQues[idx].getScore();
    
  return ourScore;
}

TPPr.isScoreable = function()
{
  for( var idx = 0; idx < this.arQues.length; idx++ )
    if( !this.arQues[idx].isScoreable())
      return false;
  return true;
}

TPPr.createCGIResults = function( pl, bQN, bGD )
{
  var idx;
  var subidx;
  var loc;
  var strTemp;

  for( idx = 0; idx < this.arQues.length; idx++ )
    bQN = this.arQues[idx].createCGIResults( pl, bQN, bGD );
  
  return bQN;
}
  
function TrivQuestion()
{
  this.id = 0;
  this.iSectionId = UNK;
  this.type = 0;
  this.weight = 1;
  this.name = "";
  this.varName = "";
  this.text = "";
  this.corrAns = "";
  this.arCorrAns = new Array();
  this.arChoices = new Array();
  this.arAddedInfo = new Array();
  this.choices = "";
  this.bAllowMult = 0;
  this.bPersist = 0;
  this.bGradeInd = 0;
  this.bSurvey = 0;
  this.strOurAns = "";
  this.iOurScore = 0;
  this.bAnyAnswer = 0;
  this.bCaseSensitive = 0;
  this.separator = "";
  this.arRel = new Array();
}

var TQPr=TrivQuestion.prototype
TQPr.load = function (sid, nl) {
    this.iSectionId = sid;
    this.id = getNVInt(nl, 'id', this.id);
    this.type = getNVInt(nl, 'type', this.type);
    this.weight = getNVInt(nl, 'weight', this.weight);
    this.name = getNVStr(nl, 'name', this.name);
    this.varName = getNVStr(nl, 'var', this.varName);
    this.text = getNVStr(nl, 'text', this.text);
    this.corrAns = getNVStr(nl, 'correctans', this.corrAns);
    this.bAnyAnswer = getNVInt(nl, 'anyanswer', this.bAnyAnswer);
    this.bCaseSensitive = getNVInt(nl, 'casesensitive', this.bCaseSensitive);
    this.separator = getNVStr(nl, 'separator', this.separator);
    if (this.type == DD || this.type == MT || this.type == MC || this.type == HS || this.type == MR || this.type == OR) {
        var pos1 = 0
        var pos2 = this.corrAns.indexOf(',')
        while (pos2 != -1) 
        {
            this.arCorrAns.push(this.corrAns.substring(pos1, pos2))
            pos1 = pos2 + 1
            pos2 = this.corrAns.indexOf(',', pos1)
        }
        this.arCorrAns.push(this.corrAns.substring(pos1, this.corrAns.length))
    }
    if (this.type == FB) {
        var pos1 = 0
        var pos2 = this.corrAns.indexOf('|')
        while (pos2 != -1) 
        {
            this.arCorrAns.push(this.corrAns.substring(pos1, pos2))
            pos1 = pos2 + 1
            pos2 = this.corrAns.indexOf('|', pos1)
        }
        this.arCorrAns.push(this.corrAns.substring(pos1, this.corrAns.length))
    }
    if (this.type == NE) {
        var rel = getNVStr(nl, 'relationship', rel);
        var pos1 = 0
        var pos2 = rel.indexOf('|')
        while (pos2 != -1) 
        {
            this.arRel.push(rel.substring(pos1, pos2))
            pos1 = pos2 + 1
            pos2 = rel.indexOf('|', pos1)
        }
        this.arRel.push(rel.substring(pos1, rel.length))

        pos1 = 0;
        var sepLen = this.separator.length;
        pos2 = this.corrAns.indexOf(this.separator)
        while (pos2 != -1) 
        {
            this.arCorrAns.push(this.corrAns.substring(pos1, pos2))
            pos1 = pos2 + sepLen;
            pos2 = this.corrAns.indexOf(this.separator, pos1)
        }
        this.arCorrAns.push(this.corrAns.substring(pos1, this.corrAns.length))
    }
    this.choices = getNVStr(nl, 'choices', this.choices);
    if (this.type == MC || this.type == HS || this.type == MR || this.type == DD || this.type == MT || this.choices.indexOf('|') >= 0) 
    {
        var pos1 = 0
        var pos2 = this.choices.indexOf('|')
        while (pos2 != -1) 
        {
            this.arChoices.push(this.choices.substring(pos1, pos2))
            pos1 = pos2 + 1
            pos2 = this.choices.indexOf('|', pos1)
        }
        this.arChoices.push(this.choices.substring(pos1, this.choices.length))
    }
    var ai = getNVStr(nl, 'addedinfo', null);
    if( ai )
    {
        var pos1 = 0
        var pos2 = ai.indexOf('|')
        while (pos2 != -1) 
        {
            this.arAddedInfo.push(ai.substring(pos1, pos2))
            pos1 = pos2 + 1
            pos2 = ai.indexOf('|', pos1)
        }
        this.arAddedInfo.push(ai.substring(pos1, ai.length))
    }
    this.bAllowMult = getNVInt(nl, 'allowmult', this.bllowMult);
    this.bPersist = getNVInt(nl, 'persist', this.bPersist);
    this.bGradeInd = getNVInt(nl, 'gradeindividual', this.bGradeInd);
    this.bSurvey = getNVInt(nl, 'surveyquestion', this.bSurvey);
}

TQPr.getMaxScore = function()
{
  var ourMax = 0;
  
  if( !this.bSurvey )
  {
    if( this.bGradeInd )
    {
      if (this.type == MR || this.type == HS || this.type == MC)
        ourMax = this.arChoices.length;
      else if( this.arCorrAns.length > 0 )
        ourMax = this.arCorrAns.length;
      else
      {
        ourMax = 1;
        for( var loc = this.corrAns.indexOf( ',' ); loc != -1; loc = this.corrAns.indexOf( ',', loc+1) )
          ourMax++;
      }

      ourMax *= this.weight;
    }
    else if( this.type != UNK )
      ourMax = this.weight;
  }

  return ourMax;
}

TQPr.getScore = function()
{
  var ourScore = 0;
  
  if( !this.bSurvey )
  {
    if( this.type != UNK )
      ourScore = this.iOurScore;
  }

  return ourScore;
}

TQPr.isScoreable = function()
{
  if( !this.bSurvey )
  {
    if( this.type == SA || this.type == ES )
    {
      if( this.weight > 0 )
        return false;
    }
  }
  return true;
}

TQPr.isCorrect = function()
{
  var idx;

  if( !this.bSurvey )
  {
    if( this.strOurAns == null || this.strOurAns.length == 0 )
    	return 0;

    switch( this.type )
    {
        case TF:
        if( this.strOurAns == this.corrAns )
          return 1;
        break;

      case MC:
      case HS:
      case MR:
      case OR:
        if( this.bGradeInd )
        {
          var bSel, bCorr;
          var iNumCorr = 0;
          
          for( var i=0; i<this.arChoices.length; i++ )
          {            
            var strChoice = this.arChoices[i].replace(/,/g,"&#44");
            if( this.type == OR ){
              var indObj = {i:-1};
              bSel = IsChoiceSelected( strChoice, this.strOurAns, indObj );
              if( this.isCorrectSub(strChoice,indObj) > 0)
                bCorr = true;
              else 
                bCorr = false;
              if( ( bCorr && bSel ) )
                iNumCorr++;
            }
            else{
              bSel = IsChoiceSelected( strChoice, this.strOurAns );
              if( this.isCorrectSub(strChoice) > 0)
                bCorr = true;
              else 
                bCorr = false;
              if( ( bCorr && bSel ) || ( !bCorr && !bSel ) )
                iNumCorr++;
            }
          }
          return iNumCorr;
        }
        else if( this.strOurAns == this.corrAns )
          return 1;
        break;

      case SA:
      case ES:
        return 0;

    case FB:
        var strTemp;
        var oAns;
        var brc = 0;
        if (!this.bCaseSensitive) oAns = this.strOurAns.toString().toLowerCase();
        else oAns = this.strOurAns.toString();

        for (var i = 0; i < this.arCorrAns.length; i++) {
            if (!this.bCaseSensitive) strTemp = this.arCorrAns[i].toLowerCase();
            else strTemp = this.arCorrAns[i];
            if (this.bAnyAnswer) { if (oAns == strTemp) return 1; }
            else { if (oAns.indexOf(strTemp) == -1) return 0; else brc = 1; }
        }
        return brc;
        break;
    case NE:
        var oAns = parseInt(this.strOurAns);
        var brc = 0;
        for (var i = 0; i < this.arRel.length; i++) {
            switch (parseInt(this.arRel[i])) {
                case EQU: if (oAns == parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case BT_INC: if (oAns >= parseInt(this.arCorrAns[i]) && oAns <= parseInt(this.arCorrAns[i + 1])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case BT_EXC: if (oAns > parseInt(this.arCorrAns[i]) && oAns < parseInt(this.arCorrAns[i + 1])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case GRT: if (oAns > parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case GTE: if (oAns >= parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case LST: if (oAns < parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case LSTE: if (oAns <= parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
                case NEQU: if (oAns != parseInt(this.arCorrAns[i])) { if (this.bAnyAnswer) return 1; else brc = 1; } else { brc = 0; } break;
            }
            if( this.separator == 'and' && !brc )
              break;
        }
        return brc;
        break;

      case MT:
        var tmpOurAns = this.strOurAns + ',';
        var tmpCorrAns;
        var iNumCorr = 0;
        for( var i=0; i<this.arCorrAns.length; i++ )
        {
          tmpCorrAns = this.arCorrAns[i] + ',';
          if( tmpOurAns.indexOf( tmpCorrAns ) != -1 )
            iNumCorr += 1;
          else
          {
            if( !this.bGradeInd )
              return 0;
          }
        }
        if( this.bGradeInd )
          return iNumCorr;
        else
          return 1;
        break;
      case DD:
        var tmpOurAns = this.strOurAns + ',';
        var tmpCorrAns;
        var iNumCorr = 0;
        for( var i=0; i<this.arCorrAns.length; i++ )
        {
          tmpCorrAns = this.arCorrAns[i];
		  var possibleCorr = tmpCorrAns.split('|');
			
		  var bFound = false;
		  for( var j=0; j<possibleCorr.length && !bFound; j++ )
		  {
		    var tmpAns = possibleCorr[j];
			if( tmpOurAns.indexOf( tmpAns ) != -1 )
			  bFound = true;
		  }
			
		  if( bFound )
		    iNumCorr += 1;
		  else
		  {
		    if( !this.bGradeInd )
		      return 0;
	      }
        }
        if( this.bGradeInd )
          return iNumCorr;
        else
          return 1;
        break;

      case IN:
        return 1;
    }
  }

  return 0;
}

function GetMatchingPairStr( strQNum, inp )
{
  var strFormat = ",";
  var strTemp   = ",";
  var strPair   = "";
  var loc;
  var next;

  strTemp += inp + ",";

  strFormat += strQNum + "-";

  loc = strTemp.indexOf( strFormat );
  if( loc < 0 )
    return strPair;

  next = strTemp.indexOf( ",", loc+1);
  strPair = strTemp.substring( loc+1, next );
  return strPair;
}

function IsChoiceSelected( strCho, inp, indObj )
{
  var spl = inp.split(',');
  var i;
  for( i=0; i<spl.length; i++ )
  {
	if( spl[i]==strCho )
	  break;	
  }
  
  if( indObj )
  {
	if( i<spl.length )
		indObj.i = i;
	else
		indObj.i = -1;
  }
	
  if( i >= spl.length )
    return false;

  return true;
}

TQPr.isCorrectSub = function( oc, indObj )
{
  if( !this.bSurvey )
  {
    if( oc != null && oc.length > 0 )
    {
       for( var i=0; i<this.arCorrAns.length; i++ )
       {
         if( oc == this.arCorrAns[i] )
         {
           if( indObj )
           {
			 indObj.correcti=i;
             if( indObj.i == i )
               return 1;
             else
               return 0;
           }
           else
             return 1;
         }
       }
    }
  }
  return 0;
}

TQPr.getNumTFQs = function()
{
  if( !this.bSurvey )
  {
    if( this.type == TF ) 
      return this.weight;
  }
  return 0;
}

TQPr.getNumCorrectTFQs = function()
{
  if( !this.bSurvey )
  {
    if( this.type == TF )
      return this.isCorrect() * this.weight;
  }
  return 0;
}

TQPr.getNumMCQs = function()
{
  var numQ = 0;

  if( !this.bSurvey )
  {
    switch( this.type )
    {
      case MC:
      case FB:
      case HS:
      case NE:
      case MR:
      case DD:
      case MT:
        numQ = 1;
        if( this.bGradeInd )
          numQ = this.arChoices.length;
        break;
    }
    numQ *= this.weight;
  }
  return numQ;
}

TQPr.getNumCorrectMCQs = function()
{
  var numC = 0;

  if( !this.bSurvey )
  {
    switch( this.type )
    {
      case MC:
      case FB:
      case HS:
      case DD:
      case MT:
      case NE:
      case MR:
        numC = this.isCorrect();
        break;
    }

    numC *= this.weight;
  }

  return numC;
}

TQPr.gradeQs = function( arVars )
{
  var idx;

  this.strOurAns = "";
  this.iOurScore = 0;

  if( this.type != UNK )
  {
    for( idx = 0; idx < arVars.length; idx++ )
    {
      if( arVars[idx].vn == this.varName )
      {
        this.strOurAns = arVars[idx].vv;
        break;
      }
    }
  
    if( !this.bSurvey )
    {
      this.iOurScore = this.isCorrect();
      this.iOurScore *= this.weight;
    }
  }
}

TQPr.createTextResults = function (txtRes, bQN, bAG) {
    var subidx;
    var strTemp;

    if (this.type != UNK) {
        bQN++;

        txtRes.add(trivstrQ + bQN + "<br />" + this.text + "<br />");
        switch (this.type) {
            case TF:
            case MC:
            case HS:
            case LK:
            case OR:
            case LT:
            case MR:
                if (bAG && !this.bSurvey) {
                    if (this.bGradeInd) {
                        var bSel;
                        var strChoice;
                        for (subidx = 0; subidx < this.arChoices.length; subidx++) {
                            strChoice = this.arChoices[subidx];
                            if( this.type==OR )
							{
								var indObj = { i:-1, correcti:-1};
								bSel = IsChoiceSelected(strChoice.replace(/,/g,"&#44"), this.strOurAns, indObj);
								if ( this.isCorrectSub(strChoice.replace(/,/g,"&#44"),indObj) > 0) {
									txtRes.add(trivstrYAC + strChoice + "=" + (indObj.i+1).toString() + "<br />");
								}
								else {
									txtRes.add(trivstrYA);
									if (!bSel)
										txtRes.add(trivstrNA);
									else
										txtRes.add(strChoice + "=" + (indObj.i+1).toString() );

									txtRes.add("<br />" + trivstrCA + (indObj.correcti+1).toString() + "<br />");
								}
							}
							else
							{
								bSel = IsChoiceSelected(strChoice.replace(/,/g,"&#44"), this.strOurAns);
								if ( this.isCorrectSub(strChoice.replace(/,/g,"&#44")) > 0 ) {
									if (bSel)
										txtRes.add(trivstrYACS + strChoice + "<br />");
									else
										txtRes.add(trivstrYAINS + strChoice + "<br />");
								}
								else {
									if (bSel)
										txtRes.add(trivstrYAIS + strChoice + "<br />");
									else
										txtRes.add(trivstrYACNS + strChoice + "<br />");
								}
							}
                            if (subidx < this.arChoices.length - 1) {
                                bQN++;
                                txtRes.add("<br />" + trivstrQ + bQN + "<br />" + this.text + "<br />");
                            }
                        }
                    }
                    else {
                        if (this.isCorrect() > 0)
                            txtRes.add(trivstrYAC + this.strOurAns + "<br />");
                        else {
                            txtRes.add(trivstrYA);
                            if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                                txtRes.add(trivstrNA);
                            else
                                txtRes.add(this.strOurAns);

                            txtRes.add("<br />" + trivstrCA + this.corrAns + "<br />");
                        }
                    }
                }
                else {
                    txtRes.add(trivstrYA);
                    if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                        txtRes.add(trivstrNA);
                    else
                        txtRes.add(this.strOurAns);
                    txtRes.add("<br />");
                }
                break;

            case FB:
                if (bAG && !this.bSurvey) {
                    if (this.isCorrect() > 0)
                        txtRes.add(trivstrYAC + this.strOurAns + "<br />");
                    else 
                    {
                        var sepRep;
                        if( this.bAnyAnswer )
                            sepRep = " " + trivstrOr + " ";
                        else
                            sepRep = " " + trivstrAnd + " ";
                        
                        strTemp = this.corrAns.replace(/\|/g, sepRep );
                        txtRes.add(trivstrYA);
                        if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                            txtRes.add(trivstrNA);
                        else
                            txtRes.add(this.strOurAns);
                        txtRes.add("<br />" + trivstrCA + strTemp + "<br />");
                    }
                }
                else {
                    txtRes.add(trivstrYA);
                    if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                        txtRes.add(trivstrNA);
                    else
                        txtRes.add(this.strOurAns);
                    txtRes.add("<br />");
                }
                break;
            case NE:
                if (bAG && !this.bSurvey) {
                    if (this.isCorrect() > 0)
                        txtRes.add(trivstrYAC + this.strOurAns + "<br />");
                    else {
                        strTemp = this.getNEResult();

                        txtRes.add(trivstrYA);
                        if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                            txtRes.add(trivstrNA);
                        else
                            txtRes.add(this.strOurAns);
                        txtRes.add("<br />" + trivstrCA + strTemp + "<br />");
                    }
                }
                else {
                    txtRes.add(trivstrYA);
                    if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                        txtRes.add(trivstrNA);
                    else
                        txtRes.add(this.strOurAns);
                    txtRes.add("<br />");
                }
                break;

            case ES:
            case SA:
                txtRes.add(trivstrYA);
                if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                    txtRes.add(trivstrNA);
                else
                    txtRes.add(this.strOurAns);
                txtRes.add("<br />");
                break;

            case DD:
            case MT:
                {
                    if (bAG) {
                        var strQNum;
                        if (this.bGradeInd) {
                            for (subidx = 0; subidx < this.arCorrAns.length; subidx++) {
                                strQNum = this.arCorrAns[subidx].substring(0, this.arCorrAns[subidx].indexOf('-'));
                                strTemp = GetMatchingPairStr(strQNum, this.strOurAns);

                                if (this.isCorrectSub(strTemp) > 0)
                                    txtRes.add(trivstrYAC + strTemp + "<br />");
                                else {
                                    txtRes.add(trivstrYA);
                                    if (strTemp == null || strTemp.length == 0)
                                        txtRes.add(trivstrNA);
                                    else
                                        txtRes.add(strTemp);

                                    txtRes.add("<br />" + trivstrCA + this.arCorrAns[subidx] + "<br />");
                                }

                                if (subidx < this.arCorrAns.length - 1) {
                                    bQN++;
                                    txtRes.add("<br />" + trivstrQ + bQN + "<br />" + this.text + "<br />");
                                }
                            }
                        }
                        else {
                            if (this.isCorrect() > 0)
                                txtRes.add(trivstrYAC + this.corrAns + "<br />");
                            else {
                                txtRes.add(trivstrYA);
                                if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                                    txtRes.add(trivstrNA);
                                else {
                                    for (subidx = 0; subidx < this.arCorrAns.length; subidx++) {
                                        strQNum = this.arCorrAns[subidx].substring(0, this.arCorrAns[subidx].indexOf('-'));
                                        strTemp = GetMatchingPairStr(strQNum, this.strOurAns);

                                        if (strTemp == null || strTemp.length == 0)
                                            txtRes.add(trivstrNA);
                                        else
                                            txtRes.add(strTemp);

                                        if (subidx < this.arCorrAns.length - 1)
                                            txtRes.add(",");
                                    }
                                }

                                txtRes.add("<br />" + trivstrCA + this.corrAns + "<br />");
                            }
                        }
                    }
                    else {
                        if (this.bGradeInd) {
                            for (subidx = 0; subidx < this.arCorrAns.length; subidx++) {
                                strQNum = this.arCorrAns[subidx].substring(0, this.arCorrAns[subidx].indexOf('-'));
                                strTemp = GetMatchingPairStr(strQNum, this.strOurAns);

                                txtRes.add(trivstrYA);
                                if (strTemp == null || strTemp.length == 0)
                                    txtRes.add(trivstrNA);
                                else
                                    txtRes.add(strTemp);
                                txtRes.add("<br />");

                                if (subidx < this.arCorrAns.length - 1) {
                                    bQN++;
                                    txtRes.add("<br />" + trivstrQ + bQN + "<br />" + this.text + "<br />");
                                }
                            }
                        }
                        else {
                            txtRes.add(trivstrYA);
                            if (this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~")
                                txtRes.add(trivstrNA);
                            else {
                                for (subidx = 0; subidx < this.arCorrAns.length; subidx++) {
                                    strQNum = this.arCorrAns[subidx].substring(0, this.arCorrAns[subidx].indexOf('-'));
                                    strTemp = GetMatchingPairStr(strQNum, this.strOurAns);

                                    if (strTemp == null || strTemp.length == 0)
                                        txtRes.add(trivstrNA);
                                    else
                                        txtRes.add(strTemp);

                                    if (subidx < this.arCorrAns.length - 1)
                                        txtRes.add(",");
                                }
                            }

                            txtRes.add("<br />" + trivstrCA + this.corrAns + "<br />");
                        }
                    }
                    break;
                }
        }

        txtRes.add("<br />");
    }

    return bQN;
}

TQPr.createCGIResults = function( pl, bQN, bGD )
{
  var subidx;
  var loc;
  var strTemp;

  var sQText = "";
  var sAnswer = "";
  var sCAnswer = "";
  var sQType = "";
  var sQID = "";
  var sSection = "";
  var sCurr;

  bQN++;

  sCurr = bQN;

  sQText = "Question" + sCurr;
  sAnswer = "Answer" + sCurr;
  sCAnswer = "CorrectAnswer" + sCurr;
  sQType = "QuestionType" + sCurr;
  sQID = "QuestionID" + sCurr;
  sSection = "Section" + sCurr;

  if( !bGD ) pl.addparm( sQText, this.text );
  if( !bGD ) pl.addparm( sQType, this.type );
  if( !bGD ) pl.addparm( sQID, this.id );
  if( this.iSectionId > 0 && !bGD )
    pl.addparm( sSection, this.iSectionId );

  switch( this.type )
  {
    case TF:
    case MC:
    case HS:
    case LK:
    case OR:
    case LT:
    case MR:
      if( this.bGradeInd )
      {
        for( subidx = 0; subidx < this.arChoices.length; subidx++ )
        {
          if( this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~" )
            strTemp = trivstrNA;
          else
          {
            if( IsChoiceSelected( this.arChoices[subidx], this.strOurAns ) )
              strTemp = this.arChoices[subidx];
            else
              strTemp = trivstrNA + ', ' + this.arChoices[subidx];
          }

             if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', strTemp );
			 else pl.addparm( sAnswer, strTemp );

          if( !bGD ) pl.addparm( sCAnswer, this.corrAns );

          if( subidx < this.arChoices.length - 1 )
          {
            bQN++;

            sCurr = bQN;

            sQText = "Q" + sCurr;
            sAnswer = "Answer" + sCurr;
            sCAnswer = "CorrectAnswer" + sCurr;
            sQType = "QuestionType" + sCurr;
            sQID = "QuestionID" + sCurr;
            sSection = "Section" + sCurr;

            if( !bGD ) pl.addparm( sQText, this.text );
            if( !bGD ) pl.addparm( sQType, this.type );
            if( !bGD ) pl.addparm( sQID,  this.id );
            if( this.iSectionId > 0 && !bGD )
              pl.addparm( sSection, this.iSectionId );
          }
        }
      }
      else
      {
        if( this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~" )
          strTemp = trivstrNA;
        else
          strTemp = this.strOurAns;
  
        if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', strTemp );
		else pl.addparm( sAnswer, strTemp );
        if( !this.bSurvey && !bGD )
          pl.addparm( sCAnswer, this.corrAns );
      }
      break;

    case FB:
    case NE:
      if( this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~" )
        strTemp = trivstrNA;
      else
        strTemp = this.strOurAns;

      if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', strTemp );
	  else pl.addparm( sAnswer, strTemp );
      if( !this.bSurvey && !bGD )
      {
        loc = this.corrAns.indexOf( '|' );
        if( loc >= 0 )
          strTemp = this.corrAns.substring( 0, loc );
        else
          strTemp = this.corrAns;

        pl.addparm( sCAnswer, strTemp );
      }
      break;

    case ES:
    case SA:
      if( this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~" )
        strTemp = trivstrNA;
      else
        strTemp = this.strOurAns;

      if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', strTemp );
	  else pl.addparm( sAnswer, strTemp );
      break;

    case DD:
    case MT:
      var strQNum;

      if( this.bGradeInd )
      {
        for( subidx = 0; subidx < this.arCorrAns.length; subidx++ )
        {
          strQNum = this.arCorrAns[subidx].substring( 0, this.arCorrAns[subidx].indexOf( '-' ) );
          strTemp = GetMatchingPairStr( strQNum, this.strOurAns );

          if( strTemp == null || strTemp.length == 0 )
            strTemp = trivstrNA;

          pl.addparm( sAnswer, strTemp );

          if( !bGD ) pl.addparm( sCAnswer, this.arCorrAns[subidx] );

          if( subidx < this.arCorrAns.length - 1 )
          {
            bQN++;

            sCurr = bQN;

            sQText = "Q" + sCurr;
            sAnswer = "Answer" + sCurr;
            sCAnswer = "CorrectAnswer" + sCurr;
            sQType = "QuestionType" + sCurr;
            sQID = "QuestionID" + sCurr;
            sSection = "Section" + sCurr;

            if( !bGD ) pl.addparm( sQText, this.text );
            if( !bGD ) pl.addparm( sQType, this.type );
            if( !bGD ) pl.addparm( sQID,  this.id );
            if( this.iSectionId > 0 && !bGD )
              pl.addparm( sSection, this.iSectionId );
          }
        }
      }
      else
      {
        if( this.strOurAns == null || this.strOurAns.length == 0 || this.strOurAns == "~~~null~~~" )
          strTemp = trivstrNA;
        else
        {
          var strTemp2;
          strTemp = "";
          for( subidx = 0; subidx < this.arCorrAns.length; subidx++ )
          {
            strQNum = this.arCorrAns[subidx].substring( 0, this.arCorrAns[subidx].indexOf( '-' ) );
            strTemp2 = GetMatchingPairStr( strQNum, this.strOurAns );

            if( strTemp2 == null || strTemp2.length == 0 )
              strTemp += trivstrNA;
            else
              strTemp += strTemp2;

            if( subidx < this.arCorrAns.length - 1 )
              strTemp += ",";
          }
        }
        if( bGD ) pl.addparm( 'entry.'+(pl.count-1)+'.single', strTemp );
		else pl.addparm( sAnswer, strTemp );
        if( !bGD ) pl.addparm( sCAnswer, this.corrAns );
      }
      break;
  }

  return bQN;
}

TQPr.getNEResult = function () {
    var strTemp = "";
    var y = 0;
    for (var i = 0; i < this.arRel.length; i++) {
        var rel;
        var sep = " " + this.separator + " ";
        if (i == 0) sep = "";

        switch (parseInt(this.arRel[i])) {
            case EQU: strTemp += sep + "= " + this.arCorrAns[y]; break;
            case BT_INC: 
              strTemp += sep;
              if( this.separator != trivstrAnd )
                strTemp += "( ";
              strTemp += ">= " + this.arCorrAns[y] + " " + trivstrAnd + " <= " + this.arCorrAns[y + 1]; 
              if( this.separator != trivstrAnd )
                strTemp += " )";
              y++; 
              break;
            case BT_EXC: 
              strTemp += sep;
              if( this.separator != trivstrAnd )
                strTemp += "( ";
              strTemp += "> " + this.arCorrAns[y] + " " + trivstrAnd + " < " + this.arCorrAns[y + 1]; 
              if( this.separator != trivstrAnd )
                strTemp += " )";
              y++; 
              break;
            case GRT: strTemp += sep + "> " + this.arCorrAns[y]; break;
            case GTE: strTemp += sep + ">= " + this.arCorrAns[y]; break;
            case LST: strTemp += sep + "< " + this.arCorrAns[y]; break;
            case LSTE: strTemp += sep + "<= " + this.arCorrAns[y]; break;
            case NEQU: strTemp += sep + "!= " + this.arCorrAns[y]; break;
        }
        y++;
    }
    return strTemp;
}