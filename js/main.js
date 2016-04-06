(function (){
//psuedo-global variables
//variables for data join
    var attrArray = ["Medicare Beneficiaries", "Hospital Beds Per 1000", "Percent of Need Met HPSA", "Cost Barriers", "Medicare Spending Per Enrollee"];
    var expressed = attrArray[0]; //intial attribute
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

	 //map frame dimensions
    var width = 1060,
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

       setChart (csvData, colorScale);

       createDropdown (csvData, attrArray);

   };

}; //end of setmap function


// bar chart
function setChart(csvData, colorScale) {
    //chart dimensions
    var chartWidth = 1060,
        chartHeight = 463;
        leftPadding = 5,
        rightPadding = 5, 
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    // create second svg element to hold bar chart

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);


    var yScale = d3.scale.linear ()
        .range([0, 460])
        .domain([0, 30]);

    // set bars for each state
    var bars = chart.selectAll (".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b) {
            return a[expressed] - b[expressed]
        })
        .attr("class", function(d) {
            return "bars" + d.name;
        })
        .attr("width", chartWidth / csvData.length - 2)
        .attr ("x", function(d, i) {
            return i * (chartWidth / csvData.length) + 10;
        })
        // .attr("height", 460)
        // .attr("y", 0)
        .attr("height", function (d){
            return yScale (parseFloat (d[expressed]));
        })
        .attr("y", function (d){
            return 460 - yScale (parseFloat (d[expressed]));
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.name;
        })
        .attr("text-anchor", "bottom")
        .attr("x", function(d, i){
            var fraction = (chartWidth - 27) / csvData.length;
            return (i * fraction + (fraction - 1) / 2) + 7;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) - 15;
        })
        .text(function(d){
            return d[expressed];
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable A for each state");

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);


};


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
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;

};

function choropleth (props, colorScale) {
    var val = parseFloat (props[expressed]);

    if (val && val != NaN) {
        return colorScale (val);
    } else {
        return "#CCC";
    };
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
                return choropleth(d.properties, colorScale);
            });
    };

function createDropdown(csvData) {
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    //add initial option

    var titleOption = dropdown.append("option")
        .attr ("class", titleOption)
        .attr("disabled", "true")
        .text("Select Attribute");
    //add attribute name options

    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter ()
        .append("option")
        .attr("value", function(d) { return d})
        .text(function (d) { return d});
};

//dropdown change listener handler
function changeAttribute (attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate color scale
    var colorScale = makeColorScale (csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .style("fill", function (d) {
            return choropleth(d.properties, colorScale)
        });
}

// ON USER SELECTION:
// 1. Change the expressed attribute
// 2. Recreate the color scale with new class breaks
// 3. Recolor each enumeration unit on the map
// 4. Re-sort each bar on the bar chart
// 5. Resize each bar on the bar chart
// 6. Recolor each bar on the bar chart




})();
            
  //range = output
  //domain = input