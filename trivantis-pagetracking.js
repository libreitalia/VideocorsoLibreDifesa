function PageTrackingObj(exp, titleName, cm, frame){
   this.VarTrivPageTracking = new Variable( 'VarTrivPageTracking', null, 0, cm, frame, exp, titleName, true );
   this.numPages = 0;
   this.publishTimeStamp = 0;
   this.title = null;
}

PageTrackingObj.prototype.InitPageTracking = function ( )
{
	var THIS = this;
	var pageTrackData = this.VarTrivPageTracking.getValue();
	var bDoInit = true;
	
	if( pageTrackData != '~~~null~~~')
	{
		var topLevelSplit = pageTrackData.split('#');
		var arrIds = topLevelSplit[0].split(',');
		var arrStatus = topLevelSplit[1].split('');
		var bits = 4;
		for( var i=0; i<arrIds.length; i++ )
		{
			var id = parseInt( '0x' + arrIds[i] );
			var mask = 1<<(i%bits);
			var status = ( parseInt('0x'+arrStatus[Math.floor(i/bits)] ) & mask ) == 0 ? 1 : 2;
			var node = this.FindNode( this.title, id );
			if( node )
				node.v = status;
		}
	}	
}

PageTrackingObj.prototype.FindNode = function( node, id )
{
	if( node.id == id )
		return node;
	
	var match = null;
	if( typeof( node.c ) != 'undefined' ){
		for( var i=0; i<node.c.length; i++ ){
			match = this.FindNode( node.c[i], id );
			if( match != null )
				break;
		}
	}
	
	return match;
}

PageTrackingObj.prototype.InternalGetRangeStatus = function( node )
{
	if( node == null )
		return -1;
		
	if( typeof(node.c) == 'undefined' )
	{
		return node.v;
	}
	else
	{
		// we need to calculate
		if( node.v == 0 )
		{
			var bAllComplete = true;
			var bInprogress = false;
			for( var i=0; i<node.c.length; i++ )
			{
				var cnode = node.c[i];
				var status = this.InternalGetRangeStatus( cnode );
				if( status == 1 || status == 2 )
					bInprogress = true;
				if( status == 0 || status == 1)
					bAllComplete = false;
			}
			
			if( !node.t && bAllComplete )
				return 2;
			else if( bInprogress )
				return 1;
			else
				return 0;
		}
		else
			return node.v
			
	}
}

//returns a incomplete or inprogress or complete
PageTrackingObj.prototype.GetRangeStatus = function( id, bInit )
{
	var status = -1;
	if ( bInit ) 
		this.InitPageTracking();
	
	status = this.InternalGetRangeStatus( this.FindNode( this.title, id ) );
		
	if( status == 0)
		return 'notstarted';	
	else if( status == 1 )
		return 'inprogress';
		
	return 'complete';
}


PageTrackingObj.prototype.InternalSetRangeStatus=function( node, status )
{
	if( node == null )
		return;
	node.v = status;
	if( status == 0 && typeof(node.c)!='undefined')
	{
		for( var i=0; i<node.c.length; i++ )
			this.InternalSetRangeStatus( node.c[i], status ); 
	}
}

PageTrackingObj.prototype.SetRangeStatus = function( id, status /*0 or 1 or 2*/)
{
	this.InternalSetRangeStatus( this.FindNode(this.title, id), status );
	
	this.SavePageTracking();
}

PageTrackingObj.prototype.IterateTree = function( func )
{
	var stack = [];
	stack.push( this.title );
	var i = 0;
	while( stack.length > 0 )
	{
		var node = stack.shift();
		
		if( typeof(node.c) != 'undefined' )
			stack = node.c.concat(stack);
			
		//do the thing
		func( node, i, stack );
		i++;
	}	
}

PageTrackingObj.prototype.SavePageTracking = function()
{
	var hexVal = 0;
	var hexString = '';
	
	var arrayIds = [];
	var arrayStatus= [];
	
	this.IterateTree( function(node, i, stack){
		if( node.v != 0 )
		{
			arrayIds.push(node.id);
			arrayStatus.push(node.v);
		}
	});
	
	for( var i=0; i<arrayIds.length; i++ )
	{
		if( i!=0 ) hexString += ',';
		hexString += arrayIds[i].toString(16);
	}
	
	hexString += '#';
	
	var bits = 4;
	var num = 0;
	for( var i=0; i<arrayStatus.length; i++ )
	{
		var bit = arrayStatus[i] == 2 ? 1 : 0
		num |= bit << (i%bits);
		if( ((i+1)%bits==0) || ((i+1)==arrayStatus.length) )
		{
			hexString += num.toString(16);
			num = 0;
		}
	}
	
	this.VarTrivPageTracking.set(hexString);
}

var trivPageTracking = new PageTrackingObj(365,'page1', 0, null);
trivPageTracking.numPages = 0;

trivPageTracking.publishTimeStamp = 201659101444;

trivPageTracking.title={id:1,v:0,c:[{id:51498,v:0,c:[{id:95,v:0,c:[{id:19549,v:0,c:[{id:26647,v:0},{id:58234,v:0},{id:28432,v:0},{id:40308,v:0,c:[{id:50087,v:0,c:[{id:54131,v:0},{id:53678,v:0},{id:53854,v:0},{id:53685,v:0},{id:53776,v:0},{id:53924,v:0},{id:50088,v:0}]}]},{id:40290,v:0,c:[{id:50085,v:0,c:[{id:40291,v:0},{id:42425,v:0},{id:42676,v:0},{id:43277,v:0},{id:43310,v:0},{id:43567,v:0},{id:44242,v:0},{id:45190,v:0},{id:50086,v:0}]}]},{id:40292,v:0,c:[{id:46349,v:0,c:[{id:55143,v:0},{id:55706,v:0},{id:55799,v:0},{id:56040,v:0},{id:57796,v:0},{id:57813,v:0},{id:47049,v:0}]}]},{id:40294,v:0,c:[{id:50065,v:0,c:[{id:55179,v:0},{id:63641,v:0},{id:63660,v:0},{id:64160,v:0},{id:64191,v:0},{id:50066,v:0}]}]},{id:40296,v:0,c:[{id:50083,v:0,c:[{id:55188,v:0},{id:72567,v:0},{id:72551,v:0},{id:50084,v:0}]}]},{id:40298,v:0,c:[{id:50081,v:0,c:[{id:55197,v:0},{id:64938,v:0},{id:64962,v:0},{id:64901,v:0},{id:65190,v:0},{id:50082,v:0}]}]},{id:40300,v:0,c:[{id:50079,v:0,c:[{id:55206,v:0},{id:75067,v:0},{id:75059,v:0},{id:50080,v:0}]}]},{id:40302,v:0,c:[{id:50077,v:0,c:[{id:55216,v:0},{id:75973,v:0},{id:75968,v:0},{id:75948,v:0},{id:50078,v:0}]}]},{id:40304,v:0,c:[{id:50075,v:0,c:[{id:55225,v:0},{id:60328,v:0},{id:60406,v:0},{id:59740,v:0},{id:50076,v:0}]}]},{id:40306,v:0,c:[{id:50073,v:0,c:[{id:55234,v:0},{id:62420,v:0},{id:62456,v:0},{id:50074,v:0}]}]},{id:45635,v:0,c:[{id:50071,v:0,c:[{id:55243,v:0},{id:50072,v:0}]}]},{id:45637,v:0,c:[{id:50069,v:0,c:[{id:55252,v:0},{id:50070,v:0}]}]},{id:45641,v:0,c:[{id:50067,v:0,c:[{id:55261,v:0},{id:50068,v:0}]},{id:54585,v:0}]},{id:66442,v:0,c:[{id:66444,v:0,c:[{id:66446,v:0},{id:66457,v:0}]}]},{id:66474,v:0,c:[{id:66476,v:0,c:[{id:66478,v:0},{id:66489,v:0}]},{id:66505,v:0}]},{id:66506,v:0,c:[{id:66508,v:0,c:[{id:66510,v:0},{id:66521,v:0}]}]},{id:66538,v:0,c:[{id:66540,v:0,c:[{id:66542,v:0},{id:66553,v:0}]}]},{id:66570,v:0,c:[{id:66572,v:0,c:[{id:66574,v:0},{id:66585,v:0}]}]},{id:66602,v:0,c:[{id:66604,v:0,c:[{id:66606,v:0},{id:66617,v:0}]}]},{id:86804,v:0,c:[{id:86806,v:0,c:[{id:86808,v:0},{id:86836,v:0}]}]},{id:86852,v:0,c:[{id:86854,v:0,c:[{id:86856,v:0},{id:86884,v:0}]}]},{id:86900,v:0,c:[{id:86902,v:0,c:[{id:86904,v:0},{id:86932,v:0}]}]},{id:86948,v:0,c:[{id:86950,v:0,c:[{id:86952,v:0},{id:86980,v:0}]}]},{id:86996,v:0,c:[{id:86998,v:0,c:[{id:87000,v:0},{id:87028,v:0}]}]},{id:87044,v:0,c:[{id:87046,v:0,c:[{id:87048,v:0},{id:87076,v:0}]}]},{id:87092,v:0,c:[{id:87094,v:0,c:[{id:87096,v:0},{id:87124,v:0}]}]},{id:87140,v:0,c:[{id:87142,v:0,c:[{id:87144,v:0},{id:87172,v:0}]}]},{id:87188,v:0,c:[{id:87190,v:0,c:[{id:87192,v:0},{id:87220,v:0}]}]}]},{id:9430,v:0,c:[{id:9431,v:0},{id:58033,v:0},{id:67058,v:0},{id:94085,v:0},{id:94097,v:0}]}]},{id:8463,v:0,t:1,c:[{id:76501,v:0},{id:76483,v:0},{id:76473,v:0},{id:76461,v:0}]},{id:46648,v:0,t:1,c:[{id:76592,v:0},{id:76545,v:0},{id:76520,v:0}]},{id:49508,v:0,t:1,c:[{id:76643,v:0},{id:76621,v:0}]},{id:49611,v:0,t:1,c:[{id:76694,v:0},{id:76672,v:0}]},{id:49650,v:0,t:1,c:[{id:76746,v:0},{id:76734,v:0},{id:76722,v:0}]},{id:49689,v:0,t:1,c:[{id:76773,v:0},{id:76761,v:0}]},{id:49728,v:0,t:1,c:[{id:76803,v:0},{id:76791,v:0}]},{id:49767,v:0,t:1,c:[{id:76833,v:0},{id:76821,v:0}]},{id:49806,v:0,t:1,c:[{id:76863,v:0},{id:76851,v:0}]},{id:49845,v:0,t:1,c:[{id:76893,v:0},{id:76881,v:0}]},{id:49884,v:0,t:1,c:[{id:76923,v:0},{id:76911,v:0}]},{id:49923,v:0,t:1,c:[{id:76965,v:0},{id:76941,v:0}]},{id:49962,v:0,t:1,c:[{id:77009,v:0},{id:76997,v:0}]},{id:66152,v:0,t:1,c:[{id:77051,v:0},{id:77039,v:0},{id:77027,v:0}]},{id:66190,v:0,t:1,c:[{id:77091,v:0},{id:77079,v:0},{id:77067,v:0}]},{id:66228,v:0,t:1,c:[{id:77119,v:0},{id:77107,v:0}]},{id:66266,v:0,t:1,c:[{id:77149,v:0},{id:77137,v:0}]},{id:66304,v:0,t:1,c:[{id:77179,v:0},{id:77167,v:0}]},{id:66342,v:0,t:1,c:[{id:77209,v:0},{id:77197,v:0}]},{id:87288,v:0,t:1,c:[{id:87301,v:0},{id:87339,v:0}]},{id:87384,v:0,t:1,c:[{id:87397,v:0},{id:87435,v:0}]},{id:87480,v:0,t:1,c:[{id:87493,v:0},{id:87531,v:0}]},{id:87576,v:0,t:1,c:[{id:87589,v:0},{id:87627,v:0}]},{id:87672,v:0,t:1,c:[{id:87685,v:0},{id:87723,v:0}]},{id:87768,v:0,t:1,c:[{id:87781,v:0},{id:87819,v:0}]},{id:87864,v:0,t:1,c:[{id:87877,v:0},{id:87915,v:0}]},{id:87960,v:0,t:1,c:[{id:87973,v:0},{id:88011,v:0}]},{id:88056,v:0,t:1,c:[{id:88069,v:0},{id:88107,v:0}]}]}]};
