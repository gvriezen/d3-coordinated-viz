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
    var width = window.innerWidth * 0.5,
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

   };

}; //end of setmap function


// bar chart
function setChart(csvData, colorScale) {
    //chart dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;
        leftPadding = 25,
        rightPadding = 2, 
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

    // var chartFrame = chart.append("rect")
    //     .attr("class", "chartFrame")
    //     .attr("width", chartInnerWidth)
    //     .attr("height", chartInnerHeight)
    //     .attr("transform", translate);

    // var chartBackground = chart.append("rect")
    //     .attr("class", "chartBackground")
    //     .attr("width", chartInnerWidth)
    //     .attr("height", chartInnerHeight)
    //     .attr("transform", translate);


    var yScale = d3.scale.linear ()
        .range([400, 0])
        .domain([0, 105]);

    // set bars for each state
    var bars = chart.selectAll (".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b) {
            return b[expressed] - a[expressed]
        })
        .attr("class", function(d) {
            return "bars" + d.name;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr ("x", function(d, i) {
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", 460)
        .attr("y", 0)
        // .attr("height", function (d, i){
        //     return 463 - yScale (parseFloat (d[expressed]));
        // })
        // .attr("y", function (d, i){
        //     return yScale (parseFloat (d[expressed])) + topBottomPadding;
        // })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = (chartWidth - 27) / csvData.length;
            return (i * fraction + (fraction - 1) / 2) + 25;
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + 20;
        })
        .text(function(d){
            return d[expressed];
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Percent of Need met in Health Professional Shortage Areas (HPSAs) " + expressed[3] + " for each state");

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

})();
            
  //range = output
  //domain = input