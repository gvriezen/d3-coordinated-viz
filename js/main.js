(function (){
//psuedo-global variables
//variables for data join
    var attrArray = ["varA", "varB", "varC", "varD", "varE"];
    var expressed = attrArray[0]; //intial attribute
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
    var width = 960,
        height = 460;

     //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geo.albersUsa()
        // .center([39, 98])
        // .rotate([-2, 0, 0])
        // .parallels([43, 62])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);


	var q = d3_queue.queue();
	//queue
    //use queue.js to parallelize asynchronous data loading
    q
        .defer(d3.csv, "data/lab2data.csv") //load attributes from csv
        .defer(d3.json, "data/usa.topojson") //load background spatial data
        .await(callback);

function callback(error, csvData, states){
       //translate north america TopoJSON
       //place graticule on map
        setGraticule(map, path);
        //translate us topojson
       var northAmerica = topojson.feature(states, states.objects.usa).features;

       northAmerica = joinData(northAmerica, csvData);
       //set up color scale
       var colorScale = makeColorScale(csvData);
       //add enumeration units
       setEnumerationUnits (northAmerica, map, path, colorScale);
   };
}; //end of setmap function

function makeColorScale(data) {
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];
    //create color sequence generator

    var colorScale = d3.scale.quantile ()
        .range(colorClasses);
    //build array of all values of the expressed attributes
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i] [expressed]);
        domainArray.push(val);
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;
};

function setGraticule (map, path) {

       var graticule = d3.geo.graticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

       var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

       var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
 };

        
        // loop through csv sheet to assign each set of attribute values to geojson region
        function joinData(northAmerica, csvData){
            for (var i=0; i<csvData.length; i++){
                var csvRegion = csvData[i]; //the current region
                var csvKey = csvRegion.name; // the csv primary key
        // loop through geojson regions to find correct region
            for (var a=0; a<northAmerica.length; a++) {

                var geojsonProps = northAmerica[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.name; // geojson primary key 
            //where primary keys match, transfer csv data to geojson prop object
            if (geojsonKey == csvKey){
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attr value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };

    };

    return northAmerica;
};
            
        // //examine the results
        // console.log(northAmerica);

        // // var country = map.append("path")
        // //     .datum(northAmerica)
        // //     .attr("class", "northAmerica")
        // //     .attr("d", path);

function setEnumerationUnits (northAmerica, map, path, colorScale){
            var regions = map.selectAll(".regions")
            .data(northAmerica)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions" + d.properties.name;
            })
            .attr("d", path)
            .style("fill", function(d){
                return colorScale(d.properties[expressed]);
            });
    };

// function choropleth (props, colorScale) {
//     //make sure attribute value is a number
//     var val = parseFloat(props[expressed]);
//     //if attribute value exists, assign a color; otherwise assign gray
//     if (val && val != NaN) {
//         return colorScale(val);
//     } else {
//         return "#CCC";
//     };
// };

})();
            

  //range = output
  //domain = input