//GOAL: Proportional symbols representing attribute values of mapped features
//STEPS:
//1. Create the Leaflet map--done (in createMap())
//2. Import GeoJSON data--done (in getData())
//3. Add circle markers for point features to the map--done (in AJAX callback)
//4. Determine which attribute to visualize with proportional symbols
//5. For each feature, determine its value for the selected attribute
//6. Give each feature's circle marker a radius based on its attribute value

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('mapid', {
        center: [40, -96],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/anelson19/ciz4ogflq005o2srz18mlwvsz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYW5lbHNvbjE5IiwiYSI6ImNpdW9mNW93ODAxaW4yeXFtdjdpeGcxN2YifQ.2rI2QCPvKMDET0YyRws9OA', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
	

    //call getData function
    getData(map);
};

function search(map, data, pointLayer){
	var controlSearch = new L.Control.Search({
		position:'topleft', 
		layer: pointLayer,
		propertyName:"City",
		marker: false,
	moveToLocation: function(latlng, title, map) {
	//map.fitBounds( latlng.layer.getBounds() );
		console.log(latlng)
		//var zoom = map.getBoundsZoom(latlng.layer.getBounds());
	map.setView(latlng,12); // access the zoom
	}
	});
map.addControl( controlSearch );
}

	
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //PUT YOUR SCRIPT TO CREATE THE TEMPORAL LEGEND HERE
			//add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="400px" height="200px">';
			
			//array of circle names to base loop on
			var circles = {
            max: -45,
            mean: 0,
            min: 45
			};

			//Step 2: loop to add each circle and text to svg string
			for (var circle in circles){
				//circle string
				svg += '<circle class="legend-circle" id="' + circle + '" fill="#1E90FF" fill-opacity="0.8" stroke="#0066FF" cx="70"/>';

				//text string
				svg += '<text id="' + circle + '-text" x="140" y="' + (circles[circle]+100) + '"></text>';
			};

        //close svg string
        svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
	
	updateLegend(map, attributes[0]);
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[2];
    var content = "<b>Enrollment in " + year + "</b>";

    //replace legend content
    $('#temporal-legend').html(content);
	
	//get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
	
	for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 160 - radius,
            r: radius
        });
		
		//Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " students");
    };
};

//function to retrieve the data and place it on the map
/*function createPropSymbols(data, map){
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#FF4500",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
	
	var attribute = "Clge_Enr_2015";
	
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};*/

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
	//check
    //console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#1E90FF",
        color: "#0066FF",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[2];
    popupContent += "<p><b>Enrolled at university in " + year + ":</b> " + feature.properties[attribute] + " students</p> <p><b>Major University:</b> " + feature.properties.University + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });
	
	    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
			this.setStyle({fillColor: "#00CCFF"});
			this.setStyle({color: "#00CCFF"});
			this.setStyle({weight: 1});
        },
        mouseout: function(){
            this.closePopup();
			this.setStyle({fillColor: "#1E90FF"});
			this.setStyle({color: "#1E90FF"});
			this.setStyle({weight: 1});
        },
		/*click: function(){
            $("#panel").html(popupContent);
        }*/
    });

	/*var panelContent = "<p><b>City:</b> " + feature.properties.City + "</p>";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[2];
    panelContent += "<p><b>Enrolled at " + feature.properties.University + " in " + year + ":</b> " + feature.properties[attribute] + " students</p>";

    //popup content is now just the city name
    var popupContent = feature.properties.City;

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
        closeButton: false 
    });

    //event listeners to open popup on hover and fill panel on click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#panel").html(panelContent);
        }
    });*/

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    var pointLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
	
	search(map, data, pointLayer)
};

function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = .045;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

function createSequenceControls(map, attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
          // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
			
			//kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
			 //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

            return container;
        }
    });

    map.addControl(new SequenceControl());
	
	$('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
	
	$('#reverse').html('<img src="img/leftarrow_1.png">');
    $('#forward').html('<img src="img/rightarrow_1.png">');

    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();

        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 6 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 6 : index;
        };

        //Step 8: update slider
        $('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
    });


    $('.range-slider').on('input', function(){

        var index = $(this).val();
		updatePropSymbols(map, attributes[index]);
		updateLegend(map, attributes[index]);
    });
};

function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>City:</b> " + props.City + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[2];
            popupContent += "<p><b>Enrolled at university in "+ year + ":</b> " + props[attribute] + " students</p> <p><b>Major University:</b> " + props.University + "</p>";
			

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        };
    });
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Clge_Enr") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    //console.log(attributes);

    return attributes;
};

//get data. Pass through create functions
function getData(map){
    //load the data
    $.ajax("data/Lab1Cities.geojson", {
        dataType: "json",
        success: function(response){
			var attributes = processData(response);
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
			createSequenceControls(map, attributes);
			createLegend(map, attributes);
			
        }
    });
};

$(document).ready(createMap);
