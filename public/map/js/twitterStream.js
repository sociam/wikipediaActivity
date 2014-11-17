function getUrlParameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}  


function initialize() {
  
  //Setup Google Map
  var myLatlng = new google.maps.LatLng(15.0,0);
  
  var light_grey_style = [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]}];
  
  var myOptions = {
    zoom: 3,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    panControl: false,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL
    },
    styles: light_grey_style
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  
  //Setup heat map and link to Twitter array we will append data to
  //positive comments
  var heatmapPos;
  var liveTweetsPos = new google.maps.MVCArray();
    heatmapPos = new google.maps.visualization.HeatmapLayer({
    data: liveTweetsPos,
    radius: 25
  });
  var gradient = [
    'rgba(30,244,248,0)',
    'rgba(30,244,248,0.5)',
    'rgba(30,244,248,0.5)',
    'rgba(32,248,158,0.5)',
    'rgba(33,249,152,0.5)',
    'rgba(51,255,75,0.5)',
    'rgba(51,255,75,0.5)'
  ]
  heatmapPos.set('gradient', heatmapPos.get('gradient') ? null : gradient);
  heatmapPos.setMap(map);

  //negative comments
  var heatmapNeg;
  var liveTweetsNeg = new google.maps.MVCArray();
    heatmapNeg = new google.maps.visualization.HeatmapLayer({
    data: liveTweetsNeg,
    radius: 15
  });
  var gradient = [
    'rgba(232,213,46,0)',
    'rgba(232,213,46,0.25)',
    'rgba(232,213,46,0.5)',
    'rgba(234,134,46,0.5)',
    'rgba(236,128,46,0.5)',
    'rgba(255,50,50,0.5)',
    'rgba(255,50,50,0.5)'
  ]
  heatmapNeg.set('gradient', heatmapNeg.get('gradient') ? null : gradient);
  heatmapNeg.setMap(map);

  if(io !== undefined) {
    // Storage for WebSocket connections

    var socket = io.connect('http://sociamvm-app-001.ecs.soton.ac.uk:9001');

    
    socket.on('wikipedia_revisions', function (data) {
	
	//get geo wikipedia entries
        if(data.wikipedia_language_geo != undefined){
        // console.log(data.wikipedia_page_name);
          var tweetLocation = new google.maps.LatLng(data.wikipedia_language_geo.lat,data.wikipedia_language_geo.lng);
          liveTweetsPos.push({location: tweetLocation, weight: 10});
        }	
    });

    socket.on('tweets', function (data) {
     

        // update words
        if(data.geo.lat != undefined){
         //console.log(data);
	if(data.text.indexOf("wiki") > -1){
	  //console.log(data.text)
          var tweetLocation = new google.maps.LatLng(data.geo.lat, data.geo.lng);
          liveTweetsNeg.push({location: tweetLocation, weight: (-10)});
	  }
        }	
    });	

    //tooo too much for the browser to handle without parralel processing.

 //    socket.on('spinn3r', function (data) {
 //        // update words
	// if(data.text != undefined){
	// 	if(data.text.indexOf("wikipedia.org") > -1){
 //         	console.log(data);
 //        	}
	// }
 //    });  


function pop_arrays(){
	try{
		for (i = 0; i < (liveTweetsPos.getLength()-2); i++) { 
			liveTweetsPos.pop();
			console.log("popping");
		}
	}catch(err){}
	

}		


    var interval = setInterval(function(){pop_arrays()}, 3000);




  }
}