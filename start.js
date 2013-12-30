var map = {};

var layers = {};
layers.attrib = ' &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

layers.skobbler = new L.tileLayer(
        'http://tiles2.skobbler.net/osm_tiles2/{z}/{x}/{y}.png',
        {attribution: layers.attrib, maxZoom: 18, opacity: 0.8}
);
layers.osm = new L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {attribution: layers.attrib, maxZoom: 19, opacity: 0.8}
);
layers.bing = new L.BingLayer("Aof80DCiA7y03b6b3qi28v438KSMhXU5fmUL6K9op7N4U2wmW82qbRDHWUxyfpD8");

var api = {};
api.layer = new L.MarkerClusterGroup({showCoverageOnHover: false, maxClusterRadius: 25}); //layer for elements

/**
 * INIT
 * -----------------------------------------------------------------------------
 */
$(document).ready(function() {
  map = L.map('map', {
    center: [localStorage['commons-lat'] !== undefined ? localStorage['commons-lat'] : 52.019,
            localStorage['commons-lng'] !== undefined ? localStorage['commons-lng'] : 20.676],
    zoom: localStorage['commons-zoom'] !== undefined ? localStorage['commons-zoom'] : 6,
    layers: [layers.skobbler, api.layer],
    minZoom: 3,
    attributionControl: false
  });
  map.controlLayers = {
    "Bing": layers.bing,
    "Skobbler": layers.skobbler,
    "OpenStreetMap": layers.osm
  };
  
  L.control.layers(map.controlLayers, null).addTo(map);
  L.control.scale().addTo(map);
  new L.Hash(map);
  
  map.icon = L.icon({
    iconUrl: 'img/marker.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    shadowUrl: 'img/shadow.png',
    shadowSize: [35, 24],
    shadowAnchor: [15, 22]
  });
  
  map.getImage = function() {
    if (map.getZoom() > 11) {
      $('#loader').fadeOut('fast');
      getImageAPI();
    } else
      $('#loader').html('Please <strong>zoom in</strong>').fadeIn('fast');
  };
  
  map.on('moveend', function() {
    localStorage['commons-lat'] = map.getCenter().lat;
    localStorage['commons-lng'] = map.getCenter().lng;
    localStorage['commons-zoom'] = map.getZoom();
    map.getImage();
  });
  map.getImage();

  var images = new Array();
  
  /**
   * Get images from Commons via Commons API
   * @returns JSON images 
   */
  function getImageAPI() {
    $('#loader').text('Loading').fadeIn('fast');
    var m = map.getCenter();
    $.ajax({
      url: "proxy.php?url=" + encodeURIComponent('http://commons.wikimedia.org/w/api.php?action=query&list=geosearch&format=json&gscoord=' + m.lat + '%7C' + m.lng + '&gsradius=5000&gslimit=500&gsnamespace=6'),
      type: 'GET',
      crossDomain: true,
      success: function(out) {
        var data = jQuery.parseJSON(out);
        
        data.query.geosearch.forEach(function(e) {
          if (images[e.pageid] === undefined) {
            var image = L.marker([e.lat, e.lon], {icon: map.icon})
                .bindPopup("<h3>" + e.title.substring(5) + "</h3><a id='thumbnail-loader' href='http://commons.wikimedia.org/wiki/" + e.title + "' target='_blank'><img src='img/loading.gif' /></a>", {minWidth: 200});
            api.layer.addLayer(image);
            
            image.on('click', function() { //@see: http://stackoverflow.com/a/2392448/1418878
              $("#thumbnail-loader img")
                  .one('load', function() {
                    $(this).hide(); $(this).fadeIn();
                  })
                  .attr('src', "http://commons.wikimedia.org/w/thumb.php?f=" + encodeURIComponent(e.title.substring(5)) + "&w=250")
                  .each(function() {
                    if (this.complete) $(this).trigger('load');
                  });
            });
            images[e.pageid] = image;
          }
          ;
        });
        $('#loader').fadeOut('fast');
      }
    });
  };
  
  
  /**
   * Get images from Commons via GeoCommons KML (not used, it's a hack)
   * @returns JSON images 
   */
  function getImagesKML() {
    $('#map-loading').fadeIn();
    $.ajax({
      url: "proxy.php?url=" + encodeURIComponent("http://toolserver.org/~para/GeoCommons/kml.php?f=photos&simple&BBOX=") + map.getBounds().toBBoxString(),
      type: 'GET',
      crossDomain: true,
      success: function(data) {
        //alert(data);
        $(data).find('Placemark').each(function() {
          var name = $('name', this).text();
          if (!images[name]) {
            var coor = $('coordinates', this).text().split(",");
            var file = $('description table a', this);
            if (file.text().length != 0 || $(file).attr("href") != undefined) {
              file = $(file).attr("href").substring(39);
              images[name] = L.marker([coor[1], coor[0]], {icon: map.icon})
                      .bindPopup("<h5 id='thumbnail-loader'>" + name + "</h5><a id='thumbnail-loader' href='http://commons.wikimedia.org/wiki/File:" + file + "' target='_blank'><img src='img/loading.gif' /></a>", {minWidth: 200});
              api.layer.addLayer(images[name]);
              images[name].on('click', function(e) {
                //map.setView(new L.LatLng(coor[1], coor[0]), map.getZoom());
                //@see: http://stackoverflow.com/a/2392448/1418878
                $("#thumbnail-loader img")
                        .one('load', function() {
                          $(this).hide();
                          $(this).fadeIn();
                        })
                        .attr('src', "http://commons.wikimedia.org/w/thumb.php?f=" + file + "&w=200")
                        .each(function() {
                          if (this.complete) {
                            $(this).trigger('load');
                          }
                        });
              });
            }
          }
        });
        $('#map-loading').fadeOut();
      }
    });
  }
});
